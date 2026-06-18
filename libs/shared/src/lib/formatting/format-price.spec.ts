import { formatPrice } from './format-price.js';

describe('formatPrice', () => {
  it('formats numeric values with the requested currency', () => {
    expect(formatPrice(24.99, 'CAD')).toBe('24,99\u00a0$');
  });

  it('keeps the existing fallback for empty values', () => {
    expect(formatPrice(null, 'CAD')).toBe('0 CAD');
  });
});
