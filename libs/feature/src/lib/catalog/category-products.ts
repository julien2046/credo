import type { StorefrontProductContent } from '../routing/storefront-content';

export type PriceOrder = 'catalog' | 'asc' | 'desc';

export function selectCategoryProducts(
  products: readonly StorefrontProductContent[],
  inStockOnly: boolean,
  order: PriceOrder
) {
  const visible = inStockOnly
    ? products.filter((product) => product.inStock)
    : products;
  if (order === 'catalog') return visible;
  return [...visible].sort((a, b) =>
    order === 'asc' ? a.price - b.price : b.price - a.price
  );
}
