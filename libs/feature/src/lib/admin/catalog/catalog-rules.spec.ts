import type { Category, Product } from '@credo/data-access';
import {
  categoryContainsProducts,
  getCategoryMoveBlocker,
  getProductCategoryBlocker,
  getProductPublishBlocker,
  hasDuplicateCategorySlug,
  hasDuplicateOrganizationSlug,
  hasDuplicateProductSlug,
} from './catalog-rules.js';

const categories: Category[] = [
  {
    id: 'category-1',
    name: 'Nouveautes',
    slug: 'nouveautes',
    description: null,
    organizationId: 'org-1',
  },
  {
    id: 'category-2',
    name: 'Archives',
    slug: 'archives',
    description: null,
    organizationId: 'org-2',
  },
];

const products: Product[] = [
  {
    id: 'product-1',
    name: 'Bougie Ambre',
    slug: 'bougie-ambre',
    description: null,
    price: 24.99,
    currency: 'CAD',
    imageUrl: null,
    inStock: true,
    published: false,
    organizationId: 'org-1',
    categoryId: 'category-1',
  },
];

describe('catalog duplicate rules', () => {
  it('detects duplicate slugs with optional exclusion', () => {
    expect(
      hasDuplicateOrganizationSlug(
        [{ id: 'org-1', name: 'Atelier', slug: 'atelier' }],
        { slug: 'atelier' }
      )
    ).toBe(true);
    expect(
      hasDuplicateCategorySlug(categories, {
        organizationId: 'org-1',
        slug: 'nouveautes',
      })
    ).toBe(true);
    expect(
      hasDuplicateProductSlug(products, {
        excludeId: 'product-1',
        slug: 'bougie-ambre',
      })
    ).toBe(false);
  });
});

describe('catalog relationship rules', () => {
  it('blocks category moves while products remain attached', () => {
    expect(categoryContainsProducts(products, 'category-1')).toBe(true);
    expect(
      getCategoryMoveBlocker(categories[0], products, 'org-2')
    ).toContain('contient des produits');
    expect(getCategoryMoveBlocker(categories[0], products, 'org-1')).toBeNull();
  });

  it('detects product category mismatch', () => {
    expect(
      getProductCategoryBlocker(categories, 'category-1', 'org-1')
    ).toBeNull();
    expect(
      getProductCategoryBlocker(categories, 'category-1', 'org-2')
    ).toBe('La categorie choisie ne correspond pas a cette boutique.');
  });
});

describe('product publish rules', () => {
  it('accepts complete products', () => {
    expect(getProductPublishBlocker(products[0], categories)).toBeNull();
  });

  it('blocks incomplete products', () => {
    expect(
      getProductPublishBlocker(
        {
          ...products[0],
          slug: null,
        },
        categories
      )
    ).toBe('Complete le nom, le slug et le prix avant de publier ce produit.');
  });
});
