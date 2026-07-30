import { createClient } from "@/lib/supabase/server";
import type {
  BillAccountOption,
  BillCategoryOption,
  BillItem,
  BillTemplate,
} from "@/features/bills/types";

type BillItemRow = {
  id: string;
  template_id: string | null;
  source_bill_item_id: string | null;
  planner_month: string;
  coverage_month: string;
  name: string;
  currency: string;
  planned_amount: number | string;
  actual_paid_amount: number | string | null;
  due_date: string;
  payment_date: string | null;
  account_id: string | null;
  category_id: string | null;
  notes: string | null;
  transaction_id: string | null;
  account: { name: string } | null;
  category: { name: string } | null;
};

function mapBillItem(row: BillItemRow): BillItem {
  return {
    id: row.id,
    templateId: row.template_id,
    sourceBillItemId: row.source_bill_item_id,
    plannerMonth: row.planner_month,
    coverageMonth: row.coverage_month,
    name: row.name,
    currency: row.currency,
    plannedAmount: Number(row.planned_amount),
    actualPaidAmount: row.actual_paid_amount === null ? null : Number(row.actual_paid_amount),
    dueDate: row.due_date,
    paymentDate: row.payment_date,
    accountId: row.account_id,
    categoryId: row.category_id,
    accountName: row.account?.name ?? null,
    categoryName: row.category?.name ?? null,
    notes: row.notes,
    transactionId: row.transaction_id,
  };
}

export async function getBillOptions() {
  const supabase = await createClient();
  const [{ data: accounts }, { data: categories }, { data: profile }] = await Promise.all([
    supabase.from("accounts").select("id,name,currency,is_archived").order("display_order").order("name"),
    supabase
      .from("categories")
      .select("id,name,is_archived")
      .eq("transaction_type", "expense")
      .order("display_order")
      .order("name"),
    supabase.from("profiles").select("default_currency").maybeSingle(),
  ]);
  return {
    accounts: (accounts ?? []) as BillAccountOption[],
    categories: (categories ?? []) as BillCategoryOption[],
    defaultCurrency: profile?.default_currency ?? "PHP",
  };
}

export async function getBillTemplates({ includeArchived = false } = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("bill_templates")
    .select("id,name,currency,default_amount,due_day,default_account_id,default_category_id,notes,is_archived")
    .order("name");
  if (!includeArchived) query = query.eq("is_archived", false);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row): BillTemplate => ({
    id: row.id,
    name: row.name,
    currency: row.currency,
    defaultAmount: Number(row.default_amount),
    dueDay: row.due_day,
    defaultAccountId: row.default_account_id,
    defaultCategoryId: row.default_category_id,
    notes: row.notes,
    isArchived: row.is_archived,
  }));
}

export async function getBillItems(plannerMonth: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bill_items")
    .select(
      "id,template_id,source_bill_item_id,planner_month,coverage_month,name,currency,planned_amount,actual_paid_amount,due_date,payment_date,account_id,category_id,notes,transaction_id,account:accounts!bill_items_account_id_fkey(name),category:categories!bill_items_category_id_fkey(name)",
    )
    .eq("planner_month", `${plannerMonth}-01`)
    .order("due_date")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapBillItem(row as unknown as BillItemRow));
}
