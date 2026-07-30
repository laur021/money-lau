export type BillTemplate = {
  id: string;
  name: string;
  currency: string;
  defaultAmount: number;
  dueDay: number;
  defaultAccountId: string | null;
  defaultCategoryId: string | null;
  notes: string | null;
  isArchived: boolean;
};

export type BillItem = {
  id: string;
  templateId: string | null;
  sourceBillItemId: string | null;
  plannerMonth: string;
  coverageMonth: string;
  name: string;
  currency: string;
  plannedAmount: number;
  actualPaidAmount: number | null;
  dueDate: string;
  paymentDate: string | null;
  accountId: string | null;
  categoryId: string | null;
  accountName: string | null;
  categoryName: string | null;
  notes: string | null;
  transactionId: string | null;
};

export type BillTotals = Record<
  string,
  { planned: number; paid: number; remaining: number; count: number; paidCount: number }
>;

export type BillDueState = "paid" | "overdue" | "due_soon" | "upcoming";

export type BillAccountOption = {
  id: string;
  name: string;
  currency: string;
  is_archived: boolean;
};

export type BillCategoryOption = {
  id: string;
  name: string;
  is_archived: boolean;
};
