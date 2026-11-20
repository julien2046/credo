import type { StorefrontDeliveryConfig } from '@credo/shared';
export { validateQuebecPostalCode } from '@credo/shared';

export function getDeliveryFeeCents(
  delivery: StorefrontDeliveryConfig | undefined,
  currency: string
): number | null {
  const fee = delivery?.quebecFlatRateCents;
  return currency === 'CAD' &&
    typeof fee === 'number' &&
    Number.isSafeInteger(fee) &&
    fee >= 0
    ? fee
    : null;
}
