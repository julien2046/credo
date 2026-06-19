import { validateCatalogPrice } from './catalog-validation.js';

describe('validateCatalogPrice', () => {
  it('accepts zero and positive prices', () => {
    expect(validateCatalogPrice('0')).toBe(true);
    expect(validateCatalogPrice('24.99')).toBe(true);
  });

  it('rejects invalid and negative prices', () => {
    expect(validateCatalogPrice('not-a-number')).toBe(
      'Le prix doit etre un nombre.'
    );
    expect(validateCatalogPrice('-1')).toBe('Le prix doit etre positif.');
  });
});
