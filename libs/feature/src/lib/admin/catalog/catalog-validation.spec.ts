import {
  parseCatalogPrice,
  validateCatalogPrice,
  validateOptionalCatalogSlug,
  validateOptionalImageUrl,
  validateTrimmedRequired,
} from './catalog-validation.js';

describe('validateCatalogPrice', () => {
  it('accepts zero and positive prices', () => {
    expect(validateCatalogPrice('0')).toBe(true);
    expect(validateCatalogPrice('24.99')).toBe(true);
    expect(parseCatalogPrice(' 24.99 ')).toBe(24.99);
  });

  it('rejects empty, invalid and negative prices', () => {
    expect(validateCatalogPrice('   ')).toBe('Le prix est requis.');
    expect(validateCatalogPrice('not-a-number')).toBe(
      'Le prix doit etre un nombre.'
    );
    expect(validateCatalogPrice('-1')).toBe('Le prix doit etre positif.');
  });
});

describe('validateOptionalCatalogSlug', () => {
  it('accepts empty slugs and normalizable slugs', () => {
    expect(validateOptionalCatalogSlug('')).toBe(true);
    expect(validateOptionalCatalogSlug(' Bougie Ambre ')).toBe(true);
  });

  it('rejects slugs without any searchable character', () => {
    expect(validateOptionalCatalogSlug('---')).toBe(
      'Le slug doit contenir au moins une lettre ou un chiffre.'
    );
  });
});

describe('validateOptionalImageUrl', () => {
  it('accepts empty http and https image URLs', () => {
    expect(validateOptionalImageUrl('')).toBe(true);
    expect(validateOptionalImageUrl('https://example.com/image.jpg')).toBe(true);
    expect(validateOptionalImageUrl('http://example.com/image.jpg')).toBe(true);
  });

  it('rejects invalid or unsupported image URLs', () => {
    expect(validateOptionalImageUrl('not-an-url')).toBe(
      "L'URL de l'image doit etre valide."
    );
    expect(validateOptionalImageUrl('ftp://example.com/image.jpg')).toBe(
      "L'URL de l'image doit commencer par http:// ou https://."
    );
  });
});

describe('validateTrimmedRequired', () => {
  it('rejects whitespace-only values', () => {
    expect(validateTrimmedRequired('   ', 'Requis.')).toBe('Requis.');
  });
});
