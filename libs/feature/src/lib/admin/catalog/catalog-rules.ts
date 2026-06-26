import type { Category, Organization, Product } from '@credo/data-access';

type DuplicateSlugOptions = {
  excludeId?: string;
  slug: string;
};

export function hasDuplicateOrganizationSlug(
  organizations: Organization[],
  { excludeId, slug }: DuplicateSlugOptions
): boolean {
  return organizations.some(
    (organization) =>
      organization.id !== excludeId && organization.slug === slug
  );
}

export function hasDuplicateCategorySlug(
  categories: Category[],
  {
    excludeId,
    organizationId,
    slug,
  }: DuplicateSlugOptions & { organizationId: string }
): boolean {
  return categories.some(
    (category) =>
      category.id !== excludeId &&
      category.organizationId === organizationId &&
      category.slug === slug
  );
}

export function hasDuplicateProductSlug(
  products: Product[],
  { excludeId, slug }: DuplicateSlugOptions
): boolean {
  return products.some(
    (product) => product.id !== excludeId && product.slug === slug
  );
}

export function categoryContainsProducts(
  products: Product[],
  categoryId: string
): boolean {
  return products.some((product) => product.categoryId === categoryId);
}

export function isCategoryAssignedToOrganization(
  categories: Category[],
  categoryId: string,
  organizationId: string
): boolean {
  return categories.some(
    (category) =>
      category.id === categoryId && category.organizationId === organizationId
  );
}

export function getCategoryMoveBlocker(
  category: Category,
  products: Product[],
  nextOrganizationId: string
): string | null {
  if (category.organizationId === nextOrganizationId) {
    return null;
  }

  if (!categoryContainsProducts(products, category.id)) {
    return null;
  }

  return 'Cette categorie contient des produits. Deplace ou supprime les produits avant de changer sa boutique.';
}

export function getProductCategoryBlocker(
  categories: Category[],
  categoryId: string,
  organizationId: string
): string | null {
  return isCategoryAssignedToOrganization(categories, categoryId, organizationId)
    ? null
    : 'La categorie choisie ne correspond pas a cette boutique.';
}

export function getProductPublishBlocker(
  product: Product,
  categories: Category[]
): string | null {
  const hasName = Boolean(product.name?.trim());
  const hasSlug = Boolean(product.slug?.trim());
  const hasValidPrice =
    product.price !== null &&
    product.price !== undefined &&
    Number.isFinite(product.price) &&
    product.price >= 0;
  const hasOrganization = Boolean(product.organizationId);
  const hasCategory = Boolean(product.categoryId);

  if (!hasName || !hasSlug || !hasValidPrice) {
    return 'Complete le nom, le slug et le prix avant de publier ce produit.';
  }

  if (!hasOrganization || !hasCategory) {
    return 'Rattache le produit a une boutique et une categorie avant de le publier.';
  }

  return getProductCategoryBlocker(
    categories,
    product.categoryId ?? '',
    product.organizationId ?? ''
  );
}
