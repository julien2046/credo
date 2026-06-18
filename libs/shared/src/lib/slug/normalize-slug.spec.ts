import { normalizeSlug } from './normalize-slug.js';

describe('normalizeSlug', () => {
  it('normalizes accents, casing and separators', () => {
    expect(normalizeSlug(' Bougie Ambre & Cedre ')).toBe('bougie-ambre-cedre');
  });
});
