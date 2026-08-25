import { describe, expect, it, vi } from "vitest";
import {
  analyzeOcrSpaceReceipt,
  mapOcrSpaceReceiptText,
  normalizeReceiptCurrency,
  normalizeReceiptDate,
  ReceiptServiceError,
  suggestReceiptCategory,
} from "../features/receipts/service";
import { hasOcrSpaceConfig, readOcrSpaceEnv } from "../lib/validation/ocr-space";

describe("OCR.space receipt extraction", () => {
  it("maps receipt text into a bounded transaction draft", () => {
    expect(
      mapOcrSpaceReceiptText("CORNER STORE\nDate: 08/25/2026\nVAT PHP 12.50\nGrand Total PHP 125.50"),
    ).toEqual({
      amount: 125.5,
      currency: "PHP",
      merchant: "CORNER STORE",
      tax: 12.5,
      transactionDate: "2026-08-25",
    });
  });

  it("rejects text without a positive receipt total and normalizes safe values only", () => {
    expect(() => mapOcrSpaceReceiptText("Corner Store\nThank you")).toThrow(ReceiptServiceError);
    expect(normalizeReceiptCurrency(" philippine peso ")).toBe(null);
    expect(normalizeReceiptCurrency("usd")).toBe("USD");
    expect(normalizeReceiptDate("2026-02-29")).toBe(null);
    expect(normalizeReceiptDate("2026-08-25")).toBe("2026-08-25");
  });

  it("recognizes bank receipts that label the value as bill amount and use a named month", () => {
    expect(
      mapOcrSpaceReceiptText(
        "SeaBank A Rural Bank\nTransaction Receipt\nBiller\nTOYOTA FINANCIAL SERVICES\nBill Amount PHP 16,284.00\nTransaction Time 23 Sep 2025, 18:35",
      ),
    ).toMatchObject({
      amount: 16_284,
      currency: "PHP",
      transactionDate: "2025-09-23",
    });
  });

  it("recognizes notification screenshots with an unlabeled negative currency amount", () => {
    expect(
      mapOcrSpaceReceiptText(
        "TOYOTA FINANCIAL SERVICES\nBills - Finance\n-PHP 16,284.00\n23 Sep 2025, 18:35",
      ),
    ).toMatchObject({
      amount: 16_284,
      currency: "PHP",
      merchant: "TOYOTA FINANCIAL SERVICES",
      transactionDate: "2025-09-23",
    });
  });

  it("suggests only active categories, preferring the most frequent then most recent merchant history", () => {
    expect(
      suggestReceiptCategory({
        activeCategoryIds: new Set(["food", "transport"]),
        merchant: "  CITY  MART ",
        history: [
          { categoryId: "transport", merchant: "City Mart", transactionDate: "2026-08-24T00:00:00Z" },
          { categoryId: "food", merchant: "city mart", transactionDate: "2026-08-03T00:00:00Z" },
          { categoryId: "food", merchant: "CITY MART", transactionDate: "2026-08-02T00:00:00Z" },
          { categoryId: "archived", merchant: "City Mart", transactionDate: "2026-08-25T00:00:00Z" },
        ],
      }),
    ).toBe("food");
  });

  it("uses an OCR.space key only when it is configured server-side", () => {
    expect(hasOcrSpaceConfig(readOcrSpaceEnv({}))).toBe(false);
    expect(hasOcrSpaceConfig(readOcrSpaceEnv({ OCR_SPACE_API_KEY: "server-only-key" }))).toBe(true);
  });

  it("uploads a multipart receipt and maps only the returned text into a draft", async () => {
    const file = new File(["receipt-bytes"], "receipt.png", { type: "image/png" });
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          IsErroredOnProcessing: false,
          OCRExitCode: 1,
          ParsedResults: [{ FileParseExitCode: 1, ParsedText: "Corner Store\nTOTAL $10.00" }],
        }),
        { status: 200 },
      ),
    );
    const result = await analyzeOcrSpaceReceipt({
      env: { OCR_SPACE_API_KEY: "server-only-key" },
      fetcher,
      file,
    });

    expect(result.amount).toBe(10);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]?.[0]).toBe("https://api.ocr.space/parse/image");
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({ method: "POST" });
  });
});
