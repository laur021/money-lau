import { describe, expect, it, vi } from "vitest";
import {
  analyzeAzureReceipt,
  mapAzureReceipt,
  mapReceiptText,
  normalizeReceiptCurrency,
  normalizeReceiptDate,
  ReceiptServiceError,
  suggestReceiptCategory,
} from "../features/receipts/service";
import { hasAzureReceiptConfig, readAzureReceiptEnv } from "../lib/validation/azure-receipts";

describe("Azure Document Intelligence receipt extraction", () => {
  it("maps receipt text into a bounded transaction draft", () => {
    expect(
      mapReceiptText("CORNER STORE\nDate: 08/25/2026\nVAT PHP 12.50\nGrand Total PHP 125.50"),
    ).toEqual({
      amount: 125.5,
      currency: "PHP",
      items: [],
      merchant: "CORNER STORE",
      tax: 12.5,
      transactionDate: "2026-08-25",
    });
  });

  it("rejects text without a positive receipt total and normalizes safe values only", () => {
    expect(() => mapReceiptText("Corner Store\nThank you")).toThrow(ReceiptServiceError);
    expect(normalizeReceiptCurrency(" philippine peso ")).toBe(null);
    expect(normalizeReceiptCurrency("usd")).toBe("USD");
    expect(normalizeReceiptDate("2026-02-29")).toBe(null);
    expect(normalizeReceiptDate("2026-08-25")).toBe("2026-08-25");
  });

  it("recognizes bank receipts that label the value as bill amount and use a named month", () => {
    expect(
      mapReceiptText(
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
      mapReceiptText(
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

  it("uses Azure credentials only when both are configured server-side", () => {
    expect(hasAzureReceiptConfig(readAzureReceiptEnv({}))).toBe(false);
    expect(hasAzureReceiptConfig(readAzureReceiptEnv({
      AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT: "https://receipts.cognitiveservices.azure.com",
      AZURE_DOCUMENT_INTELLIGENCE_KEY: "server-only-key",
    }))).toBe(true);
  });

  it("uploads the image, polls the Azure operation, and maps structured receipt fields", async () => {
    const file = new File(["receipt-bytes"], "receipt.png", { type: "image/png" });
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, {
        headers: { "operation-location": "https://receipts.cognitiveservices.azure.com/result/123" },
        status: 202,
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        status: "succeeded",
        analyzeResult: {
          documents: [{
            fields: {
              MerchantName: { valueString: "Corner Store" },
              Items: {
                valueArray: [{
                  valueObject: {
                    Description: { valueString: "Milk" },
                    Price: { valueCurrency: { amount: 2.5, currencyCode: "USD" } },
                    Quantity: { valueNumber: 2 },
                    TotalPrice: { valueCurrency: { amount: 5, currencyCode: "USD" } },
                  },
                }],
              },
              Total: { valueCurrency: { amount: 10, currencyCode: "USD" } },
              TotalTax: { valueCurrency: { amount: 0.91 } },
              TransactionDate: { valueDate: "2026-08-25" },
            },
          }],
        },
      }), { status: 200 }));
    const result = await analyzeAzureReceipt({
      env: {
        AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT: "https://receipts.cognitiveservices.azure.com",
        AZURE_DOCUMENT_INTELLIGENCE_KEY: "server-only-key",
      },
      fetcher,
      file,
      waitForResult: async () => {},
    });

    expect(result.amount).toBe(10);
    expect(result).toMatchObject({
      currency: "USD",
      items: [{ currency: "USD", description: "Milk", quantity: 2, totalPrice: 5, unitPrice: 2.5 }],
      merchant: "Corner Store",
      tax: 0.91,
      transactionDate: "2026-08-25",
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0]?.[0]).toBe("https://receipts.cognitiveservices.azure.com/documentintelligence/documentModels/prebuilt-receipt:analyze?api-version=2024-11-30");
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({ method: "POST" });
    expect(fetcher.mock.calls[1]?.[0]).toBe("https://receipts.cognitiveservices.azure.com/result/123");
  });

  it("uses OCR text as a fallback when Azure does not return a structured total", () => {
    expect(mapAzureReceipt({ content: "Corner Store\nTOTAL PHP 100.00" })).toMatchObject({ amount: 100, currency: "PHP" });
  });
});
