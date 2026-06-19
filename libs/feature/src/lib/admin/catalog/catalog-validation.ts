/** Retourne le message de validation prix attendu par les formulaires catalogue. */
export function validateCatalogPrice(value: string): true | string {
  const numericPrice = Number(value);

  if (!Number.isFinite(numericPrice)) {
    return 'Le prix doit etre un nombre.';
  }

  if (numericPrice < 0) {
    return 'Le prix doit etre positif.';
  }

  return true;
}
