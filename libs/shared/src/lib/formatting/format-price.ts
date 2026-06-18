export function formatPrice(
  value: number | null | undefined,
  currency: string,
  locale = 'fr-CA'
): string {
  if (value === null || value === undefined) return `0 ${currency}`;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
}
