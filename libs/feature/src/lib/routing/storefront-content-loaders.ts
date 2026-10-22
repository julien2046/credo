import {
  getCategoryContentBySlug,
  getProductContentBySlug,
} from './storefront-content';

export async function loadProductPage(slug: string | undefined) {
  const content = await getProductContentBySlug(slug);
  if (!content) {
    throw new Response('Produit introuvable', { status: 404 });
  }
  return content;
}

export async function loadCategoryPage(slug: string | undefined) {
  const content = await getCategoryContentBySlug(slug);
  if (!content) {
    throw new Response('Categorie introuvable', { status: 404 });
  }
  return content;
}
