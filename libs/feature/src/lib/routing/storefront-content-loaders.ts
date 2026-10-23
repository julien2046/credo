import {
  getCategoryContentBySlug,
  getProductContentBySlug,
  type StorefrontContentSource,
} from './storefront-content';

export async function loadProductPage(
  slug: string | undefined,
  source?: StorefrontContentSource
) {
  const content = await getProductContentBySlug(slug, source);
  if (!content) {
    throw new Response('Produit introuvable', { status: 404 });
  }
  return content;
}

export async function loadCategoryPage(
  slug: string | undefined,
  source?: StorefrontContentSource
) {
  const content = await getCategoryContentBySlug(slug, source);
  if (!content) {
    throw new Response('Categorie introuvable', { status: 404 });
  }
  return content;
}
