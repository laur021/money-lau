import { describe, expect, it } from "vitest";
import {
  formatAmount,
  formatCompactAmount,
  formatMoney,
} from "../lib/formatting/money";

describe("money formatting", () => {
  it("uses comma-separated thousands and two decimals", () => {
    expect(formatAmount(1234567.8)).toBe("1,234,567.80");
    expect(formatMoney("9876.5", "php")).toBe("9,876.50 PHP");
  });

  it("safely handles empty and compact values", () => {
    expect(formatAmount(undefined)).toBe("0.00");
    expect(formatAmount("invalid")).toBe("0.00");
    expect(formatCompactAmount(12500)).toBe("12.5K");
  });
});
