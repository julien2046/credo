import type { PublicProduct } from '@credo/data-access';

export type CartItem = {
  id: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
  quantity: number;
  availability?: 'available' | 'unavailable' | 'out-of-stock';
  previousPrice?: number;
};

export const MAX_QUANTITY = 99;

export function readCart(raw: string | null, currency: string): CartItem[] {
  try {
    const value: unknown = JSON.parse(raw ?? '[]');
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    return value.filter((item): item is CartItem => {
      if (!item || typeof item !== 'object' ||
        typeof item.id !== 'string' || !item.id || seen.has(item.id) ||
        typeof item.slug !== 'string' || !item.slug ||
        typeof item.title !== 'string' || !item.title ||
        item.currency !== currency || !Number.isFinite(item.price) || item.price < 0 ||
        !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY) return false;
      seen.add(item.id);
      return true;
    }).map(({ id, slug, title, price, currency: itemCurrency, quantity }) =>
      ({ id, slug, title, price, currency: itemCurrency, quantity }));
  } catch {
    return [];
  }
}

export function addCartItem(items: CartItem[], product: Omit<CartItem, 'quantity'>): CartItem[] {
  const existing = items.find(item => item.id === product.id);
  return existing
    ? items.map(item => item.id === product.id
      ? { ...product, quantity: Math.min(MAX_QUANTITY, item.quantity + 1) } : item)
    : [...items, { ...product, quantity: 1 }];
}

export function cartTotal(items: CartItem[]) {
  return items.filter(item => !item.availability || item.availability === 'available')
    .reduce((total, item) => total + Math.round(item.price * 100) * item.quantity, 0) / 100;
}

export function reconcileCart(items: CartItem[], products: PublicProduct[]): CartItem[] {
  const byId = new Map(products.map(product => [product.id, product]));
  return items.map(item => {
    const product = byId.get(item.id);
    if (!product || !product.name || !product.slug || product.currency !== item.currency ||
      typeof product.price !== 'number' || !Number.isFinite(product.price) || product.price < 0) {
      return { ...item, availability: 'unavailable', previousPrice: undefined };
    }
    return {
      ...item, title: product.name, slug: product.slug, price: product.price,
      previousPrice: Math.round(item.price * 100) !== Math.round(product.price * 100)
        ? item.price : item.previousPrice,
      availability: product.inStock === false ? 'out-of-stock' : 'available',
    };
  });
}
