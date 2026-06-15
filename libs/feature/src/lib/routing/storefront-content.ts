import type { Category, Product } from '@credo/data-access';
import { getDataClient } from '@credo/platform-amplify';
import { getErrorMessage } from '@credo/shared';

export type StorefrontCategoryContent = {
  id: string;
  slug: string;
  title: string;
  summary: string;
};

export type StorefrontProductContent = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  categorySlug: string | null;
  imageUrl: string | null;
  price: number;
  currency: string;
  inStock: boolean;
};

export type StorefrontCategoryPageContent = {
  category: StorefrontCategoryContent;
  products: StorefrontProductContent[];
};

export type StorefrontPromoContent = {
  slug: string;
  title: string;
  summary: string;
};

const promos: StorefrontPromoContent[] = [
  {
    slug: 'summer',
    title: 'Promo Summer',
    summary:
      'Promotion exemple pour preparer une page evenementielle indexable.',
  },
];

function toCategoryContent(
  category: Category | null | undefined
): StorefrontCategoryContent | null {
  if (!category?.id || !category.name || !category.slug) return null;

  return {
    id: category.id,
    slug: category.slug,
    title: category.name,
    summary:
      category.description ??
      `Selection de produits pour la categorie ${category.name}.`,
  };
}

function toProductContent(
  product: Product | null | undefined,
  category: Category | null | undefined
): StorefrontProductContent | null {
  if (
    !product?.id ||
    !product.name ||
    !product.slug ||
    product.price === null
  ) {
    return null;
  }

  if (!product.published) return null;

  return {
    id: product.id,
    slug: product.slug,
    title: product.name,
    summary:
      product.description ??
      `Fiche produit ${product.name} prete pour le storefront public.`,
    categorySlug: category?.slug ?? null,
    imageUrl: product.imageUrl ?? null,
    price: product.price,
    currency: product.currency ?? 'EUR',
    inStock: product.inStock !== false,
  };
}

async function loadCatalogContent() {
  const dataClient = getDataClient();
  const [categoryResult, productResult] = await Promise.all([
    dataClient.models.Category.list(),
    dataClient.models.Product.list(),
  ]);

  const message = [
    getErrorMessage(categoryResult?.errors),
    getErrorMessage(productResult?.errors),
  ]
    .filter(Boolean)
    .join(', ');

  if (message) {
    throw new Error(message);
  }

  const categories = Array.isArray(categoryResult?.data)
    ? (categoryResult.data as Category[])
    : [];
  const products = Array.isArray(productResult?.data)
    ? (productResult.data as Product[])
    : [];
  const categoriesById = new Map(
    categories
      .filter((category) => category.id)
      .map((category) => [category.id, category])
  );

  return {
    categories,
    products,
    categoriesById,
  };
}

/**
 * Retourne une categorie publique et ses produits publies par slug.
 */
export async function getCategoryContentBySlug(
  slug: string | undefined
): Promise<StorefrontCategoryPageContent | null> {
  if (!slug) return null;

  const { categories, products, categoriesById } = await loadCatalogContent();
  const category = categories.find((item) => item.slug === slug);
  const categoryContent = toCategoryContent(category);

  if (!category || !categoryContent) return null;

  return {
    category: categoryContent,
    products: products
      .filter((product) => product.categoryId === category.id)
      .map((product) =>
        toProductContent(product, categoriesById.get(category.id))
      )
      .filter((product): product is StorefrontProductContent =>
        Boolean(product)
      ),
  };
}

/**
 * Retourne un produit public publie par slug.
 */
export async function getProductContentBySlug(
  slug: string | undefined
): Promise<StorefrontProductContent | null> {
  if (!slug) return null;

  const { products, categoriesById } = await loadCatalogContent();
  const product = products.find((item) => item.slug === slug);

  return toProductContent(
    product,
    product?.categoryId ? categoriesById.get(product.categoryId) : null
  );
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
 * Liste les routes candidates au prerender statique.
 */
export async function listPrerenderableStorefrontRoutes(): Promise<string[]> {
  const { categories, products, categoriesById } = await loadCatalogContent();

  return [
    '/',
    ...categories
      .map((category) => toCategoryContent(category))
      .filter((category): category is StorefrontCategoryContent =>
        Boolean(category)
      )
      .map((category) => `/c/${category.slug}`),
    ...products
      .map((product) =>
        toProductContent(
          product,
          product.categoryId ? categoriesById.get(product.categoryId) : null
        )
      )
      .filter((product): product is StorefrontProductContent =>
        Boolean(product)
      )
      .map((product) => `/p/${product.slug}`),
    ...promos.map((promo) => `/promo/${promo.slug}`),
  ];
}
