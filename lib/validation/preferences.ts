import { z } from "zod";

export const preferencesSchema = z.object({
  displayName: z.string().trim().min(1).max(100),
  defaultCurrency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  dateFormat: z.enum(["MMM d, yyyy", "dd/MM/yyyy", "MM/dd/yyyy"]),
  timezone: z.string().trim().min(1).max(100),
  weekStartsOn: z.coerce.number().int().min(0).max(6),
  defaultDashboardPeriod: z.enum(["today", "this_week", "this_month", "last_month", "this_year", "custom"]),
  numberFormat: z.literal("1,234.56"),
  showArchivedAccounts: z.string().optional(),
  showArchivedCategories: z.string().optional(),
});