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

type OrganizationModel = {
  id: string;
  name: string;
  slug: string;
};

type ProductModel = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string | null;
  imageUrl: string | null;
  inStock: boolean | null;
  organizationId: string;
};

type OrganizationCreateInput = Pick<OrganizationModel, 'name' | 'slug'>;

type ProductCreateInput = {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  organizationId: string;
};

export type DataClient = {
  models: {
    Organization: {
      list: () => ListResult<OrganizationModel>;
      create: (
        input: OrganizationCreateInput
      ) => CreateResult<OrganizationModel>;
    };
    Product: {
      list: () => ListResult<ProductModel>;
      create: (input: ProductCreateInput) => CreateResult<ProductModel>;
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
