export type ReceiptDraft = {
  amount: number;
  categoryId: string | null;
  currency: string | null;
  merchant: string | null;
  tax: number | null;
  transactionDate: string | null;
};

export type ReceiptCategoryHistory = {
  categoryId: string | null;
  merchant: string | null;
  transactionDate: string;
};
