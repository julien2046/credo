export type StorefrontCategoryContent = {
  slug: string;
  title: string;
  summary: string;
};

export type StorefrontProductContent = {
  slug: string;
  title: string;
  summary: string;
  categorySlug: string;
};

export type StorefrontPromoContent = {
  slug: string;
  title: string;
  summary: string;
};

const categories: StorefrontCategoryContent[] = [
  {
    slug: 'featured',
    title: 'Categorie Featured',
    summary: 'Selection mise en avant pour la page categorie publique.',
  },
];

const products: StorefrontProductContent[] = [
  {
    slug: 'demo-product',
    title: 'Demo Product',
    summary: 'Produit de demonstration pour preparer le rendu statique SEO.',
    categorySlug: 'featured',
  },
];

const promos: StorefrontPromoContent[] = [
  {
    slug: 'summer',
    title: 'Promo Summer',
    summary: 'Promotion exemple pour preparer une page evenementielle indexable.',
  },
];

/**
 * Retourne une categorie publique par slug.
 */
export function getCategoryContentBySlug(
  slug: string | undefined
): StorefrontCategoryContent | null {
  if (!slug) return null;

  return categories.find((category) => category.slug === slug) ?? null;
}

/**
 * Retourne un produit public par slug.
 */
export function getProductContentBySlug(
  slug: string | undefined
): StorefrontProductContent | null {
  if (!slug) return null;

  return products.find((product) => product.slug === slug) ?? null;
}

/**
 * Retourne une promotion publique par slug.
 */
export function getPromoContentBySlug(
  slug: string | undefined
): StorefrontPromoContent | null {
  if (!slug) return null;

  return promos.find((promo) => promo.slug === slug) ?? null;
}

/**
 * Liste minimale de routes candidates au prerender statique.
 */
export function listPrerenderableStorefrontRoutes(): string[] {
  return [
    '/',
    '/cart',
    ...categories.map((category) => `/c/${category.slug}`),
    ...products.map((product) => `/p/${product.slug}`),
    ...promos.map((promo) => `/promo/${promo.slug}`),
  ];
}
