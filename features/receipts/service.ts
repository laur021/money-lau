import type { ReceiptCategoryHistory, ReceiptDraft, ReceiptItem } from "@/features/receipts/types";
import type { AzureReceiptEnv } from "@/lib/validation/azure-receipts";

type AzureReceiptField = {
  content?: string;
  valueArray?: Array<{ valueObject?: Record<string, AzureReceiptField> }>;
  valueCurrency?: { amount?: number; currencyCode?: string };
  valueDate?: string;
  valueNumber?: number;
  valueString?: string;
};

type AzureReceiptPayload = {
  status?: "notStarted" | "running" | "succeeded" | "failed";
  analyzeResult?: {
    content?: string;
    documents?: Array<{
      fields?: Record<string, AzureReceiptField>;
    }>;
  };
};

export class ReceiptServiceError extends Error {
  constructor(
    public readonly code: "PROVIDER" | "TIMEOUT" | "NO_TOTAL",
    message: string,
  ) {
    super(message);
  }
}

export function normalizeReceiptCurrency(value: string | undefined) {
  const currency = value?.trim().toUpperCase();
  return currency && /^[A-Z]{3}$/.test(currency) ? currency : null;
}

export function normalizeReceiptDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : value;
}

function moneyFromText(value: string) {
  const matches = [...value.matchAll(/-?\s*(?:PHP|USD|EUR|GBP|\u20B1|\$|\u20AC|\u00A3)?\s*([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)(?:\.([0-9]{1,2}))?/gi)];
  const match = matches.at(-1);
  if (!match) return null;
  const parsed = Number(`${match[1].replace(/,/g, "")}.${(match[2] ?? "").padEnd(2, "0")}`);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function currencyFromText(value: string) {
  if (/\bPHP\b|\u20B1/i.test(value)) return "PHP";
  if (/\bUSD\b|\$/i.test(value)) return "USD";
  if (/\bEUR\b|\u20AC/i.test(value)) return "EUR";
  if (/\bGBP\b|\u00A3/i.test(value)) return "GBP";
  return null;
}

function dateFromText(value: string) {
  const isoDate = value.match(/\b(20\d{2}-\d{2}-\d{2})\b/)?.[1];
  if (isoDate) return normalizeReceiptDate(isoDate);
  const numericDate = value.match(/\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2})\b/);
  if (numericDate) {
    const [, month, day, year] = numericDate;
    if (!month || !day || !year) return null;
    return normalizeReceiptDate(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
  }
  const namedDate = value.match(/\b(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(20\d{2})\b/i);
  if (!namedDate) return null;
  const [, day, monthName, year] = namedDate;
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const month = months.indexOf(monthName?.slice(0, 3).toLowerCase() ?? "") + 1;
  if (!day || !year || month === 0) return null;
  return normalizeReceiptDate(`${year}-${String(month).padStart(2, "0")}-${day.padStart(2, "0")}`);
}

export function mapReceiptText(text: string): Omit<ReceiptDraft, "categoryId"> {
  const lines = text.split(/\r?\n/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
  const labeledAmountLine = [...lines].reverse().find(
    (line) =>
      /\b(grand\s+total|total\s+due|amount\s+due|bill\s+amount|payment\s+amount|amount\s+paid|transaction\s+amount|total)\b/i.test(line) &&
      !/sub\s*total/i.test(line),
  );
  const totalLine = labeledAmountLine ?? lines.find((line) => /-?\s*(?:PHP|USD|EUR|GBP|\u20B1|\$|\u20AC|\u00A3)\s*[0-9][0-9,.]*/i.test(line));
  const amount = totalLine ? moneyFromText(totalLine) : null;
  if (amount === null || amount <= 0) {
    throw new ReceiptServiceError("NO_TOTAL", "MoneyLau could not confidently find a positive total on this receipt.");
  }
  const taxLine = lines.find((line) => /\b(vat|tax)\b/i.test(line));
  const merchant = lines.find((line) => /[a-z]/i.test(line) && !/\b(receipt|invoice|date|cashier|total|subtotal|tax|vat)\b/i.test(line)) ?? null;

  return {
    amount,
    currency: currencyFromText(totalLine ?? "") ?? currencyFromText(text),
    items: [],
    merchant: merchant?.slice(0, 500) ?? null,
    tax: taxLine ? moneyFromText(taxLine) : null,
    transactionDate: lines.map(dateFromText).find((date): date is string => Boolean(date)) ?? null,
  };
}

function fieldNumber(field: AzureReceiptField | undefined) {
  const value = field?.valueCurrency?.amount ?? field?.valueNumber;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function mapAzureReceiptItems(field: AzureReceiptField | undefined, receiptCurrency: string | null): ReceiptItem[] {
  return (field?.valueArray ?? []).reduce<ReceiptItem[]>((items, item) => {
      const fields = item.valueObject;
      const description = fields?.Description?.valueString?.trim()
        || fields?.Name?.valueString?.trim()
        || fields?.Description?.content?.trim()
        || fields?.Name?.content?.trim();
      if (!description) return items;

      const unitPriceField = fields?.Price ?? fields?.UnitPrice;
      const totalPriceField = fields?.TotalPrice ?? fields?.Amount;
      const quantity = fieldNumber(fields?.Quantity);
      const unitPrice = fieldNumber(unitPriceField);
      const totalPrice = fieldNumber(totalPriceField) ?? (quantity !== null && unitPrice !== null ? quantity * unitPrice : null);
      if (totalPrice === null || totalPrice <= 0) return items;
      items.push({
        currency: normalizeReceiptCurrency(totalPriceField?.valueCurrency?.currencyCode)
          ?? normalizeReceiptCurrency(unitPriceField?.valueCurrency?.currencyCode)
          ?? receiptCurrency,
        description: description.slice(0, 500),
        quantity,
        totalPrice,
        unitPrice,
      });
      return items;
    }, []).slice(0, 100);
}

export function normalizeMerchant(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ").toLocaleLowerCase() || null;
}

export function suggestReceiptCategory({
  activeCategoryIds,
  history,
  merchant,
}: {
  activeCategoryIds: Set<string>;
  history: ReceiptCategoryHistory[];
  merchant: string | null;
}) {
  const normalizedMerchant = normalizeMerchant(merchant);
  if (!normalizedMerchant) return null;

  const scores = new Map<string, { count: number; latest: number }>();
  for (const item of history) {
    if (!item.categoryId || !activeCategoryIds.has(item.categoryId)) continue;
    if (normalizeMerchant(item.merchant) !== normalizedMerchant) continue;
    const timestamp = new Date(item.transactionDate).getTime();
    const current = scores.get(item.categoryId) ?? { count: 0, latest: 0 };
    scores.set(item.categoryId, {
      count: current.count + 1,
      latest: Math.max(current.latest, Number.isFinite(timestamp) ? timestamp : 0),
    });
  }

  return [...scores.entries()]
    .sort((left, right) => right[1].count - left[1].count || right[1].latest - left[1].latest)[0]?.[0] ?? null;
}

export function mapAzureReceipt(document: AzureReceiptPayload["analyzeResult"]): Omit<ReceiptDraft, "categoryId"> {
  const fields = document?.documents?.[0]?.fields;
  const total = fields?.Total;
  const amount = total?.valueCurrency?.amount ?? total?.valueNumber;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    if (document?.content) return mapReceiptText(document.content);
    throw new ReceiptServiceError("NO_TOTAL", "MoneyLau could not confidently find a positive total on this receipt.");
  }

  const tax = fields?.TotalTax?.valueCurrency?.amount ?? fields?.TotalTax?.valueNumber ?? null;
  const merchant = fields?.MerchantName?.valueString?.trim() || null;
  const currency = normalizeReceiptCurrency(total?.valueCurrency?.currencyCode) ?? currencyFromText(total?.content ?? "");
  const transactionDate = normalizeReceiptDate(fields?.TransactionDate?.valueDate)
    ?? dateFromText(fields?.TransactionDate?.content ?? "");

  return {
    amount,
    currency,
    items: mapAzureReceiptItems(fields?.Items, currency),
    merchant: merchant?.slice(0, 500) ?? null,
    tax: typeof tax === "number" && Number.isFinite(tax) ? tax : null,
    transactionDate,
  };
}

const azureApiVersion = "2024-11-30";

function analyzeUrl(endpoint: string) {
  return new URL(
    `/documentintelligence/documentModels/prebuilt-receipt:analyze?api-version=${azureApiVersion}`,
    endpoint,
  ).toString();
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

export async function analyzeAzureReceipt({
  file,
  env,
  fetcher = fetch,
  waitForResult = wait,
}: {
  file: File;
  env: AzureReceiptEnv & { AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT: string; AZURE_DOCUMENT_INTELLIGENCE_KEY: string };
  fetcher?: typeof fetch;
  waitForResult?: (milliseconds: number) => Promise<void>;
}) {
  let response: Response;
  try {
    response = await fetcher(analyzeUrl(env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT), {
      body: file,
      cache: "no-store",
      headers: {
        "Content-Type": file.type,
        "Ocp-Apim-Subscription-Key": env.AZURE_DOCUMENT_INTELLIGENCE_KEY,
      },
      method: "POST",
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ReceiptServiceError("TIMEOUT", "Receipt analysis took too long. Please try again.");
    }
    throw new ReceiptServiceError("PROVIDER", "Azure Document Intelligence could not analyze this receipt right now.");
  }
  const operationLocation = response.headers.get("operation-location");
  if (response.status !== 202 || !operationLocation) {
    throw new ReceiptServiceError("PROVIDER", "Azure Document Intelligence could not analyze this receipt right now.");
  }

  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    await waitForResult(1_000);
    try {
      response = await fetcher(operationLocation, {
        cache: "no-store",
        headers: { "Ocp-Apim-Subscription-Key": env.AZURE_DOCUMENT_INTELLIGENCE_KEY },
        method: "GET",
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "TimeoutError") {
        throw new ReceiptServiceError("TIMEOUT", "Receipt analysis took too long. Please try again.");
      }
      throw new ReceiptServiceError("PROVIDER", "Azure Document Intelligence could not analyze this receipt right now.");
    }
    if (!response.ok) {
      throw new ReceiptServiceError("PROVIDER", "Azure Document Intelligence could not analyze this receipt right now.");
    }
    const payload = (await response.json()) as AzureReceiptPayload;
    if (payload.status === "succeeded") return mapAzureReceipt(payload.analyzeResult);
    if (payload.status === "failed") {
      throw new ReceiptServiceError("PROVIDER", "Azure Document Intelligence could not read this receipt. Try a clearer photo.");
    }
  }
  throw new ReceiptServiceError("TIMEOUT", "Receipt analysis took too long. Please try again.");
}
