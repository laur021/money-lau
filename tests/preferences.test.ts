import { describe, expect, it } from "vitest";
import { preferencesSchema } from "../lib/validation/preferences";

describe("profile preferences validation", () => {
  it("normalizes the default currency and accepts supported settings", () => {
    expect(preferencesSchema.parse({
      displayName: "Mark",
      defaultCurrency: "php",
      dateFormat: "MMM d, yyyy",
      timezone: "Asia/Manila",
      weekStartsOn: "1",
      defaultDashboardPeriod: "this_month",
    })).toMatchObject({ defaultCurrency: "PHP", weekStartsOn: 1 });
  });

  it("rejects unsupported dashboard periods", () => {
    expect(() => preferencesSchema.parse({
      displayName: "Mark",
      defaultCurrency: "PHP",
      dateFormat: "MMM d, yyyy",
      timezone: "Asia/Manila",
      weekStartsOn: 1,
      defaultDashboardPeriod: "forever",
    })).toThrow();
  });
});
