import { isCatalogProductImageStoragePath } from '@credo/platform-amplify';
import { normalizeSlug } from '@credo/shared';

export function validateTrimmedRequired(
  value: string,
  message: string
): true | string {
  return value.trim() ? true : message;
}

export function validateOptionalCatalogSlug(value: string): true | string {
  if (!value.trim()) {
    return true;
  }

  return normalizeSlug(value)
    ? true
    : 'Le slug doit contenir au moins une lettre ou un chiffre.';
}

export function validateOptionalImageUrl(value: string): true | string {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return true;
  }

  if (isCatalogProductImageStoragePath(trimmedValue)) {
    return true;
  }

  try {
    const url = new URL(trimmedValue);
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? true
      : "L'URL de l'image doit commencer par http:// ou https://.";
  } catch {
    return "L'URL de l'image doit etre valide.";
  }
}

export function parseCatalogPrice(value: string): number {
  return Number(value.trim());
}

/** Retourne le message de validation prix attendu par les formulaires catalogue. */
export function validateCatalogPrice(value: string): true | string {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return 'Le prix est requis.';
  }

  const numericPrice = parseCatalogPrice(trimmedValue);

  if (!Number.isFinite(numericPrice)) {
    return 'Le prix doit etre un nombre.';
  }

  if (numericPrice < 0) {
    return 'Le prix doit etre positif.';
  }

  return true;
}
