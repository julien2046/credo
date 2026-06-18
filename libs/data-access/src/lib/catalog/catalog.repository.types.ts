import type { Category, Organization, Product, PublicCategory, PublicProduct } from './catalog.types.js';

export type GraphQLErrorLike = {
  message?: string;
};

export type GraphQLResult<TData> = {
  data: TData | null | undefined;
  errors: GraphQLErrorLike[] | undefined;
};

export type GraphQLListResult<TData> = GraphQLResult<TData[]>;

export type QueryOptions = {
  authMode?: 'apiKey' | 'userPool';
};

export type CreateOrganizationInput = {
  name: string;
  slug: string;
};

export type CreateCategoryInput = {
  name: string;
  slug: string;
  description?: string;
  organizationId: string;
};

export type UpdateCategoryInput = {
  id: string;
  name?: string;
  slug?: string;
  description?: string | null;
  organizationId?: string;
};

export type CreateProductInput = {
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency: string;
  imageUrl?: string;
  inStock: boolean;
  published: boolean;
  organizationId: string;
  categoryId: string;
};

export type UpdateProductInput = {
  id: string;
  name?: string;
  slug?: string | null;
  description?: string | null;
  price?: number;
  currency?: string | null;
  imageUrl?: string | null;
  inStock?: boolean | null;
  published?: boolean | null;
  organizationId?: string;
  categoryId?: string | null;
};

export type DeleteInput = {
  id: string;
};

export type CatalogAdminDataClient = {
  models: {
    Organization: {
      list: () => Promise<GraphQLListResult<Organization>>;
      create: (
        input: CreateOrganizationInput
      ) => Promise<GraphQLResult<Organization>>;
    };
    Category: {
      list: () => Promise<GraphQLListResult<Category>>;
      create: (input: CreateCategoryInput) => Promise<GraphQLResult<Category>>;
      update: (input: UpdateCategoryInput) => Promise<GraphQLResult<Category>>;
      delete: (input: DeleteInput) => Promise<GraphQLResult<Category>>;
    };
    Product: {
      list: () => Promise<GraphQLListResult<Product>>;
      create: (input: CreateProductInput) => Promise<GraphQLResult<Product>>;
      update: (input: UpdateProductInput) => Promise<GraphQLResult<Product>>;
      delete: (input: DeleteInput) => Promise<GraphQLResult<Product>>;
    };
  };
};

export type CatalogPublicDataClient = {
  queries: {
    listPublicCategories: (
      options?: QueryOptions
    ) => Promise<GraphQLListResult<PublicCategory>>;
    listPublicProducts: (
      options?: QueryOptions
    ) => Promise<GraphQLListResult<PublicProduct>>;
  };
};

export type AdminCatalogSnapshot = {
  organizations: Organization[];
  categories: Category[];
  products: Product[];
};

export type PublicCatalogSnapshot = {
  categories: PublicCategory[];
  products: PublicProduct[];
};
