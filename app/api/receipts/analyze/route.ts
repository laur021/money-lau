import { NextResponse } from "next/server";
import { analyzeOcrSpaceReceipt, ReceiptServiceError, suggestReceiptCategory } from "@/features/receipts/service";
import { createClient } from "@/lib/supabase/server";
import { hasOcrSpaceConfig, readOcrSpaceEnv } from "@/lib/validation/ocr-space";

const allowedTypes = new Set(["image/jpeg", "image/png"]);
const maxFileSize = 1 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;
    if (!userId) return NextResponse.json({ error: "Sign in to scan a receipt." }, { status: 401 });

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("receipt_scanning_consent_at")
      .maybeSingle();
    if (profileError) throw new Error(profileError.message);
    if (!profile?.receipt_scanning_consent_at) {
      return NextResponse.json(
        { code: "CONSENT_REQUIRED", error: "Allow OCR.space receipt scanning before uploading a receipt." },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const receipt = formData.get("receipt");
    if (!(receipt instanceof File) || !allowedTypes.has(receipt.type) || receipt.size <= 0 || receipt.size > maxFileSize) {
      return NextResponse.json(
        { error: "Upload a JPEG or PNG receipt smaller than 1 MB." },
        { status: 400 },
      );
    }

    const env = readOcrSpaceEnv();
    if (!hasOcrSpaceConfig(env)) {
      return NextResponse.json({ code: "CONFIGURATION", error: "Receipt scanning is not configured yet." }, { status: 503 });
    }
    const result = await analyzeOcrSpaceReceipt({ file: receipt, env });
    const [{ data: categories, error: categoriesError }, { data: history, error: historyError }] = await Promise.all([
      supabase.from("categories").select("id").eq("transaction_type", "expense").eq("is_archived", false),
      supabase
        .from("transactions")
        .select("category_id,merchant,transaction_date")
        .eq("transaction_type", "expense")
        .eq("status", "completed")
        .not("category_id", "is", null)
        .order("transaction_date", { ascending: false })
        .limit(500),
    ]);
    if (categoriesError || historyError) throw new Error(categoriesError?.message ?? historyError?.message);

    return NextResponse.json({
      draft: {
        ...result,
        categoryId: suggestReceiptCategory({
          activeCategoryIds: new Set((categories ?? []).map((category) => category.id)),
          history: (history ?? []).map((entry) => ({
            categoryId: entry.category_id,
            merchant: entry.merchant,
            transactionDate: entry.transaction_date,
          })),
          merchant: result.merchant,
        }),
      },
    });
  } catch (error) {
    if (error instanceof ReceiptServiceError) {
      return NextResponse.json({ code: error.code, error: error.message }, { status: error.code === "TIMEOUT" ? 504 : 502 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Please upload a valid receipt image." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to scan this receipt right now." }, { status: 500 });
  }
}
