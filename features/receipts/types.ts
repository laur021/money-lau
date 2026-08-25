export type ReceiptItem = {
  currency: string | null;
  description: string;
  quantity: number | null;
  totalPrice: number | null;
  unitPrice: number | null;
};

export type ReceiptDraft = {
  amount: number;
  categoryId: string | null;
  currency: string | null;
  items: ReceiptItem[];
  merchant: string | null;
  tax: number | null;
  transactionDate: string | null;
};

export type ReceiptCategoryHistory = {
  categoryId: string | null;
  merchant: string | null;
  transactionDate: string;
};
