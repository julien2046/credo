import type { StorefrontDeliveryConfig } from '@credo/shared';

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

export function validateQuebecPostalCode(value: string): true | string {
  const code = value.trim().toUpperCase();
  if (
    !/^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ] ?\d[ABCEGHJKLMNPRSTVWXYZ]\d$/.test(
      code
    )
  ) {
    return 'Entrez un code postal canadien au format A1A 1A1.';
  }
  return /^[GHJ]/.test(code) || 'La livraison est limitée au Québec.';
}
