export type CartItem = {
  id: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
  quantity: number;
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
    });
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
  return items.reduce((total, item) => total + Math.round(item.price * 100) * item.quantity, 0) / 100;
}
