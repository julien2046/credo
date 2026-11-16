import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { StorefrontProductContent } from '../routing/storefront-content';
import { addCartItem, cartTotal, MAX_QUANTITY, readCart, type CartItem } from './cart-state';

type CartContextValue = {
  items: CartItem[];
  ready: boolean;
  storageError: boolean;
  currency: string;
  count: number;
  total: number;
  add: (product: StorefrontProductContent) => boolean;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
};
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ clientId, currency, children }: {
  clientId: string; currency: string; children: ReactNode;
}) {
  const key = 'credo:cart:v1:' + clientId;
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try { setItems(readCart(localStorage.getItem(key), currency)); }
    catch { setStorageError(true); }
    setReady(true);
  }, [key, currency]);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(key, JSON.stringify(items)); setStorageError(false); }
    catch { setStorageError(true); }
  }, [items, key, ready]);

  function add(product: StorefrontProductContent) {
    if (!ready || !product.inStock || product.currency !== currency ||
      !Number.isFinite(product.price) || product.price < 0 ||
      items.some(item => item.id === product.id && item.quantity >= MAX_QUANTITY)) return false;
    const { id, slug, title, price } = product;
    setItems(previous => addCartItem(previous, { id, slug, title, price, currency }));
    return true;
  }

  return <CartContext.Provider value={{
    items, ready, storageError, currency, total: cartTotal(items),
    count: items.reduce((count, item) => count + item.quantity, 0),
    add,
    setQuantity: (id, quantity) => {
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) return;
      setItems(previous => previous.map(item => item.id === id ? { ...item, quantity } : item));
    },
    remove: id => setItems(previous => previous.filter(item => item.id !== id)),
  }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('CartProvider manquant');
  return value;
}
