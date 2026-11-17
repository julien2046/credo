import { addCartItem, cartTotal, MAX_QUANTITY, readCart, reconcileCart } from './cart-state';
import type { PublicProduct } from '@credo/data-access';

const product = { id: 'p1', slug: 'chaise', title: 'Chaise', price: 0.1, currency: 'CAD' };
const live: PublicProduct = { id: 'p1', slug: 'chaise-renommee', name: 'Chaise actuelle',
  price: 10, currency: 'CAD', inStock: true, description: null, imageUrl: null,
  organizationId: 'o1', categoryId: 'c1' };
describe('cart state', () => {
  it('refreshes price, title and slug while retaining quantities', () => {
    const result = reconcileCart([{ ...product, quantity: 3 }], [live]);
    expect(result[0]).toMatchObject({ title: live.name, slug: live.slug, price: 10,
      quantity: 3, previousPrice: 0.1, availability: 'available' });
    expect(cartTotal(result)).toBe(30);
  });
  it('keeps missing and out-of-stock lines but excludes them from totals', () => {
    const missing = reconcileCart([{ ...product, quantity: 2 }], []);
    expect(missing[0].availability).toBe('unavailable');
    expect(cartTotal(missing)).toBe(0);
    const out = reconcileCart([{ ...product, quantity: 2 }], [{ ...live, inStock: false }]);
    expect(out[0].availability).toBe('out-of-stock');
    expect(cartTotal(out)).toBe(0);
    expect(reconcileCart(out, [live])[0].availability).toBe('available');
  });
  it('rejects incompatible currency or invalid price without corrupting saved amounts', () => {
    for (const invalid of [{ ...live, currency: 'EUR' }, { ...live, price: NaN }]) {
      expect(reconcileCart([{ ...product, quantity: 1 }], [invalid])[0])
        .toMatchObject({ availability: 'unavailable', price: 0.1 });
    }
  });
  it('does not trust persisted availability or change notices', () => {
    expect(readCart(JSON.stringify([{ ...product, quantity: 1,
      availability: 'available', previousPrice: 500 }]), 'CAD'))
      .toEqual([{ ...product, quantity: 1 }]);
  });
  it('merges additions and caps quantities', () => {
    const once = addCartItem([], product);
    expect(addCartItem(once, product)[0].quantity).toBe(2);
    expect(addCartItem([{ ...product, quantity: MAX_QUANTITY }], product)[0].quantity).toBe(MAX_QUANTITY);
  });
  it('calculates in cents', () => {
    expect(cartTotal([{ ...product, quantity: 3 }])).toBe(0.3);
    expect(cartTotal([])).toBe(0);
  });
  it('ignores malformed storage and incompatible currencies', () => {
    expect(readCart('broken', 'CAD')).toEqual([]);
    expect(readCart('{}', 'CAD')).toEqual([]);
    expect(readCart(JSON.stringify([{ ...product, quantity: 2 }]), 'EUR')).toEqual([]);
  });
  it('filters invalid quantities and duplicate products', () => {
    const item = { ...product, quantity: 2 };
    expect(readCart(JSON.stringify([item, item, { ...item, id: 'p2', quantity: -1 }]), 'CAD')).toEqual([item]);
  });
});
