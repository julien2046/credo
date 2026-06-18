import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';

type AmplifyConfigInput = Parameters<typeof Amplify.configure>[0];
type GraphQLErrors = Array<{ message?: string }> | undefined;

type ListResult<TData> = Promise<{
  data: TData[] | null | undefined;
  errors: GraphQLErrors;
}>;

type CreateResult<TData> = Promise<{
  data: TData | null | undefined;
  errors: GraphQLErrors;
}>;

type MutationResult<TData> = Promise<{
  data: TData | null | undefined;
  errors: GraphQLErrors;
}>;

type QueryOptions = {
  authMode?: 'apiKey' | 'userPool';
};

type OrganizationModel = {
  id: string;
  name: string;
  slug: string;
};

type CategoryModel = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  organizationId: string;
};

type ProductModel = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  price: number;
  currency: string | null;
  imageUrl: string | null;
  inStock: boolean | null;
  published: boolean | null;
  organizationId: string;
  categoryId: string | null;
};

type PublicCategoryModel = Pick<
  CategoryModel,
  'id' | 'name' | 'slug' | 'description' | 'organizationId'
>;

type PublicProductModel = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string | null;
  imageUrl: string | null;
  inStock: boolean | null;
  organizationId: string;
  categoryId: string | null;
};

type OrganizationCreateInput = Pick<OrganizationModel, 'name' | 'slug'>;
type CategoryCreateInput = {
  name: string;
  slug: string;
  description?: string;
  organizationId: string;
};
type CategoryUpdateInput = Partial<
  Pick<CategoryModel, 'name' | 'slug' | 'description' | 'organizationId'>
> &
  Pick<CategoryModel, 'id'>;

type ProductCreateInput = {
  name: string;
  slug?: string;
  description?: string;
  price: number;
  currency?: string;
  imageUrl?: string;
  inStock?: boolean;
  published?: boolean;
  organizationId: string;
  categoryId?: string;
};
type ProductUpdateInput = Partial<
  Pick<
    ProductModel,
    | 'name'
    | 'slug'
    | 'description'
    | 'price'
    | 'currency'
    | 'imageUrl'
    | 'inStock'
    | 'published'
    | 'organizationId'
    | 'categoryId'
  >
> &
  Pick<ProductModel, 'id'>;

type DeleteInput = {
  id: string;
};

export type DataClient = {
  queries: {
    listPublicCategories: (
      options?: QueryOptions
    ) => ListResult<PublicCategoryModel>;
    listPublicProducts: (
      options?: QueryOptions
    ) => ListResult<PublicProductModel>;
  };
  models: {
    Organization: {
      list: () => ListResult<OrganizationModel>;
      create: (
        input: OrganizationCreateInput
      ) => CreateResult<OrganizationModel>;
    };
    Category: {
      list: () => ListResult<CategoryModel>;
      create: (input: CategoryCreateInput) => CreateResult<CategoryModel>;
      update: (input: CategoryUpdateInput) => MutationResult<CategoryModel>;
      delete: (input: DeleteInput) => MutationResult<CategoryModel>;
    };
    Product: {
      list: () => ListResult<ProductModel>;
      create: (input: ProductCreateInput) => CreateResult<ProductModel>;
      update: (input: ProductUpdateInput) => MutationResult<ProductModel>;
      delete: (input: DeleteInput) => MutationResult<ProductModel>;
    };
  };
};

let isConfigured = false;
let dataClientInstance: DataClient | null = null;

export function configureAmplify(config: AmplifyConfigInput) {
  if (isConfigured) return;

  Amplify.configure(config);
  isConfigured = true;
}

/**
 * Retourne un client Amplify Data initialise apres `Amplify.configure()`.
 */
export function getDataClient(): DataClient {
  if (!dataClientInstance) {
    // Temporary manual typing to avoid `any` until we wire the full Amplify
    // schema type across workspace boundaries.
    dataClientInstance = generateClient() as unknown as DataClient;
  }

  return dataClientInstance;
}
