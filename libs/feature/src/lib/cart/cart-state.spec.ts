import { addCartItem, cartTotal, MAX_QUANTITY, readCart } from './cart-state';

const product = { id: 'p1', slug: 'chaise', title: 'Chaise', price: 0.1, currency: 'CAD' };
describe('cart state', () => {
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
