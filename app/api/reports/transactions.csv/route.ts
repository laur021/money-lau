import {
  isReportingPeriod,
  reportingDateRange,
} from "@/lib/calculations/periods";
import { createClient } from "@/lib/supabase/server";

type ExportRow = {
  transaction_date: string;
  transaction_type: string;
  amount: number | string;
  currency: string;
  status: string;
  merchant: string | null;
  description: string | null;
  reference_number: string | null;
  source_account: { name: string } | null;
  destination_account: { name: string } | null;
  category: { name: string } | null;
};

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) {
    return new Response("Unauthorized", { status: 401 });
  }

  const parameters = new URL(request.url).searchParams;
  const requestedPeriod = parameters.get("period") ?? "";
  const period = isReportingPeriod(requestedPeriod)
    ? requestedPeriod
    : "this_year";
  const currency = (parameters.get("currency") ?? "PHP").toUpperCase();
  const account = parameters.get("account") ?? "";
  const category = parameters.get("category") ?? "";
  const status = parameters.get("status") ?? "";
  const { data: profile } = await supabase
    .from("profiles")
    .select("week_starts_on")
    .maybeSingle();
  const range = reportingDateRange(period, new Date(), profile?.week_starts_on ?? 1);

  let query = supabase
    .from("transactions")
    .select(
      "transaction_date,transaction_type,amount,currency,status,merchant,description,reference_number,source_account:accounts!transactions_account_id_fkey(name),destination_account:accounts!transactions_destination_account_id_fkey(name),category:categories!transactions_category_id_fkey(name)",
    )
    .eq("currency", currency)
    .order("transaction_date", { ascending: false })
    .limit(5000);
  if (range.from) query = query.gte("transaction_date", range.from.toISOString());
  if (range.to) query = query.lte("transaction_date", range.to.toISOString());
  if (account) {
    query = query.or(
      `account_id.eq.${account},destination_account_id.eq.${account}`,
    );
  }
  if (category) query = query.eq("category_id", category);
  if (["completed", "pending", "cancelled"].includes(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    return new Response("Unable to export report", { status: 500 });
  }

  const rows = (data ?? []) as unknown as ExportRow[];
  const csv = [
    [
      "Date",
      "Type",
      "Account",
      "Destination account",
      "Category",
      "Merchant",
      "Description",
      "Reference",
      "Amount",
      "Currency",
      "Status",
    ]
      .map(csvCell)
      .join(","),
    ...rows.map((row) =>
      [
        row.transaction_date,
        row.transaction_type,
        row.source_account?.name,
        row.destination_account?.name,
        row.category?.name,
        row.merchant,
        row.description,
        row.reference_number,
        row.amount,
        row.currency,
        row.status,
      ]
        .map(csvCell)
        .join(","),
    ),
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="moneylau-${period}-${currency}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
