const numberFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatAmount(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return numberFormatter.format(Number.isFinite(amount) ? amount : 0);
}

export function formatMoney(
  value: number | string | null | undefined,
  currency: string,
) {
  return `${formatAmount(value)} ${currency.toUpperCase()}`;
}

export function formatCompactAmount(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export const COMMA_NUMBER_FORMAT = "1,234.56";
