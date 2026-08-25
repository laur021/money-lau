import type { ReceiptCategoryHistory, ReceiptDraft } from "@/features/receipts/types";
import type { OcrSpaceEnv } from "@/lib/validation/ocr-space";

type OcrSpacePayload = {
  ErrorMessage?: string | string[] | null;
  IsErroredOnProcessing?: boolean;
  OCRExitCode?: number | string;
  ParsedResults?: Array<{
    ErrorMessage?: string | string[] | null;
    FileParseExitCode?: number | string;
    ParsedText?: string | null;
  }>;
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

export function mapOcrSpaceReceiptText(text: string): Omit<ReceiptDraft, "categoryId"> {
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
    merchant: merchant?.slice(0, 500) ?? null,
    tax: taxLine ? moneyFromText(taxLine) : null,
    transactionDate: lines.map(dateFromText).find((date): date is string => Boolean(date)) ?? null,
  };
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

export async function analyzeOcrSpaceReceipt({
  file,
  env,
  fetcher = fetch,
}: {
  file: File;
  env: OcrSpaceEnv & { OCR_SPACE_API_KEY: string };
  fetcher?: typeof fetch;
}) {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("language", "eng");
  formData.set("OCREngine", "2");
  formData.set("detectOrientation", "true");
  formData.set("isOverlayRequired", "false");
  formData.set("isTable", "true");
  formData.set("scale", "true");
  let response: Response;
  try {
    response = await fetcher("https://api.ocr.space/parse/image", {
      body: formData,
    cache: "no-store",
    headers: {
        apikey: env.OCR_SPACE_API_KEY,
    },
    method: "POST",
    signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ReceiptServiceError("TIMEOUT", "Receipt analysis took too long. Please try again.");
    }
    throw new ReceiptServiceError("PROVIDER", "OCR.space could not analyze this receipt right now.");
  }
  if (!response.ok) {
    throw new ReceiptServiceError("PROVIDER", "OCR.space could not analyze this receipt right now.");
  }
  const payload = (await response.json()) as OcrSpacePayload;
  const parsedText = payload.ParsedResults
    ?.filter((result) => String(result.FileParseExitCode) === "1")
    .map((result) => result.ParsedText?.trim())
    .filter((result): result is string => Boolean(result))
    .join("\n");
  if (payload.IsErroredOnProcessing || String(payload.OCRExitCode) === "3" || String(payload.OCRExitCode) === "4" || !parsedText) {
    throw new ReceiptServiceError("PROVIDER", "OCR.space could not read this receipt. Try a clearer photo.");
  }
  return mapOcrSpaceReceiptText(parsedText);
}

/* Azure Document Intelligence backup (inactive while OCR.space is configured)
 * AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT and AZURE_DOCUMENT_INTELLIGENCE_KEY remain
 * documented in the previous implementation. Restore the Azure analyzer and its
 * structured prebuilt-receipt mapping when an Azure subscription is available.
 */
