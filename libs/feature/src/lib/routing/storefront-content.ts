import {
  listPublicCatalog,
  type PublicCategory,
  type PublicProduct,
} from '@credo/data-access';
import { getDataClient, resolveCatalogImageUrl } from '@credo/platform-amplify';

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
  category: PublicCategory | null | undefined
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

async function resolveProductImageUrl(
  imageReference: string | null | undefined
): Promise<string | null> {
  try {
    return await resolveCatalogImageUrl(imageReference);
  } catch {
    return null;
  }
}

async function toProductContent(
  product: PublicProduct | null | undefined,
  category: PublicCategory | null | undefined
): Promise<StorefrontProductContent | null> {
  if (!product?.id || !product.name || !product.slug) {
    return null;
  }

  return {
    id: product.id,
    slug: product.slug,
    title: product.name,
    summary:
      product.description ??
      `Fiche produit ${product.name} prete pour le storefront public.`,
    categorySlug: category?.slug ?? null,
    imageUrl: await resolveProductImageUrl(product.imageUrl),
    price: product.price,
    currency: product.currency ?? 'EUR',
    inStock: product.inStock !== false,
  };
}

async function loadCatalogContent() {
  const dataClient = getDataClient();
  const { categories, products } = await listPublicCatalog(dataClient);
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
    products: (
      await Promise.all(
        products
          .filter((product) => product.categoryId === category.id)
          .map((product) =>
            toProductContent(product, categoriesById.get(category.id))
          )
      )
    ).filter((product): product is StorefrontProductContent =>
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

  return await toProductContent(
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
    ...(
      await Promise.all(
        products.map((product) =>
          toProductContent(
            product,
            product.categoryId ? categoriesById.get(product.categoryId) : null
          )
        )
      )
    )
      .filter((product): product is StorefrontProductContent =>
        Boolean(product)
      )
      .map((product) => `/p/${product.slug}`),
    ...promos.map((promo) => `/promo/${promo.slug}`),
  ];
}
