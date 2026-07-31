import { afterEach, describe, expect, it, vi } from "vitest";
import { insightRequestSchema, askDeepSeek, InsightServiceError } from "../features/insights/service";
import { buildFinancialInsightSummary, formatInsightSummary } from "../features/insights/summary";
import { hasDeepSeekConfig, readPrivateAiEnv } from "../lib/validation/ai";

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.DEEPSEEK_API_KEY;
  delete process.env.DEEPSEEK_MODEL;
});

describe("MoneyLau Insights summary", () => {
  it("uses only aggregate financial facts for the selected currency and period", () => {
    const summary = buildFinancialInsightSummary({
      accounts: [
        { id: "account-a", currency: "PHP", include_in_total: true, is_archived: false },
        { id: "account-b", currency: "USD", include_in_total: true, is_archived: false },
      ],
      balances: [
        { id: "account-a", current_balance: 12_500 },
        { id: "account-b", current_balance: 10 },
      ],
      bills: [
        { currency: "PHP", due_date: "2026-08-03", planned_amount: 1_200, category: { name: "Utilities" } },
      ],
      comparisonTransactions: [
        { currency: "PHP", status: "completed", transaction_type: "expense", amount: 3_000, category: { name: "Food" } },
      ],
      currency: "PHP",
      now: new Date("2026-08-01T12:00:00.000Z"),
      period: "this_month",
      salaries: [{ currency: "PHP", net_pay: 25_000, transaction_id: "salary-run-id" }],
      transactions: [
        { currency: "PHP", status: "completed", transaction_type: "income", amount: 25_000, category: { name: "Salary" } },
        { currency: "PHP", status: "completed", transaction_type: "expense", amount: 2_000, category: { name: "Food" } },
        { currency: "PHP", status: "pending", transaction_type: "expense", amount: 900, category: { name: "Pending" } },
        { currency: "USD", status: "completed", transaction_type: "expense", amount: 99, category: { name: "Other" } },
      ],
    });

    expect(summary).toMatchObject({
      currency: "PHP",
      includedAccountBalance: 12_500,
      postedSalaryIncome: 25_000,
      previousMonthExpense: 3_000,
      totals: { completedIncome: 25_000, completedExpense: 2_000, netCashFlow: 23_000 },
    });
    expect(summary.expenseCategories).toEqual([{ name: "Food", amount: 2_000 }]);
    expect(summary.upcomingBills).toEqual([
      { category: "Utilities", dueDate: "2026-08-03", plannedAmount: 1_200, state: "upcoming" },
    ]);
  });

  it("does not include raw ledger text or identifiers in the formatted summary", () => {
    const summary = buildFinancialInsightSummary({
      accounts: [],
      balances: [],
      bills: [],
      currency: "PHP",
      period: "this_month",
      salaries: [],
      transactions: [
        {
          amount: 100,
          category: { name: "Food" },
          currency: "PHP",
          status: "completed",
          transaction_type: "expense",
          description: "Private lunch with Mark",
          id: "transaction-id",
          merchant: "Private merchant",
          reference_number: "reference-number",
        } as never,
      ],
    });
    const serialized = formatInsightSummary(summary);

    expect(serialized).not.toContain("Private lunch");
    expect(serialized).not.toContain("transaction-id");
    expect(serialized).not.toContain("Private merchant");
    expect(serialized).not.toContain("reference-number");
  });
});

describe("MoneyLau Insights request boundaries", () => {
  it("validates bounded prompts, history, currency, and reporting period", () => {
    expect(
      insightRequestSchema.parse({
        currency: "php",
        history: [{ role: "assistant", content: "A previous answer" }],
        message: "Can I afford my upcoming bills?",
        period: "this_month",
      }),
    ).toMatchObject({ currency: "PHP", period: "this_month" });
    expect(
      insightRequestSchema.safeParse({ currency: "PHP", history: [], message: "", period: "quarterly" }).success,
    ).toBe(false);
  });

  it("uses a server-only DeepSeek key and handles provider errors without data changes", async () => {
    expect(hasDeepSeekConfig(readPrivateAiEnv({}))).toBe(false);
    process.env.DEEPSEEK_API_KEY = "server-only-key";
    process.env.DEEPSEEK_MODEL = "deepseek-chat";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Unavailable", { status: 503 })));

    await expect(
      askDeepSeek({ history: [], message: "Help", summary: "{\"currency\":\"PHP\"}" }),
    ).rejects.toMatchObject({ code: "PROVIDER", status: 502 } satisfies Partial<InsightServiceError>);
  });

  it("limits a provider response before returning it to the browser", async () => {
    process.env.DEEPSEEK_API_KEY = "server-only-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "a".repeat(9_000) } }],
            usage: { completion_tokens: 2, prompt_tokens: 3 },
          }),
          { status: 200 },
        ),
      ),
    );

    const result = await askDeepSeek({ history: [], message: "Help", summary: "{}" });
    expect(result.content).toHaveLength(2_000);
    expect(result.usage).toEqual({ inputTokens: 3, outputTokens: 2 });
  });
});
