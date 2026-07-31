import { NextResponse } from "next/server";
import {
  askDeepSeek,
  completeInsightUsage,
  getInsightProfile,
  InsightServiceError,
  insightRequestSchema,
  loadFinancialInsightSummary,
  removeReservedInsightUsage,
  reserveInsightUsage,
} from "@/features/insights/service";
import { formatInsightSummary } from "@/features/insights/summary";
import { createClient } from "@/lib/supabase/server";
import { readPrivateAiEnv } from "@/lib/validation/ai";

export async function POST(request: Request) {
  try {
    const payload = insightRequestSchema.parse(await request.json());
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;
    if (!userId) return NextResponse.json({ error: "Sign in to use MoneyLau Insights." }, { status: 401 });

    const profile = await getInsightProfile(supabase);
    if (!profile?.ai_insights_consent_at) {
      return NextResponse.json(
        { code: "CONSENT_REQUIRED", error: "Allow DeepSeek financial summaries before using Insights." },
        { status: 403 },
      );
    }
    const env = readPrivateAiEnv();
    const summary = await loadFinancialInsightSummary(supabase, payload, profile);
    const usageId = await reserveInsightUsage(
      supabase,
      userId,
      env.DEEPSEEK_MODEL,
      env.AI_INSIGHTS_MONTHLY_REQUEST_LIMIT,
    );
    try {
      const answer = await askDeepSeek({
        history: payload.history,
        message: payload.message,
        summary: formatInsightSummary(summary),
      });
      await completeInsightUsage(supabase, usageId, answer.usage);
      return NextResponse.json({ answer: answer.content });
    } catch (error) {
      await removeReservedInsightUsage(supabase, usageId);
      throw error;
    }
  } catch (error) {
    if (error instanceof InsightServiceError) {
      return NextResponse.json({ code: error.code, error: error.message }, { status: error.status });
    }
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Please enter a valid insight question." }, { status: 400 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Please send a valid insight request." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to prepare an insight right now." }, { status: 500 });
  }
}
