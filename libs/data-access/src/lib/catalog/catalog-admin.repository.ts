import type { Category, Organization, Product } from './catalog.types.js';
import {
  assertCatalogResult,
  getCatalogErrorMessage,
} from './catalog-result.js';
import type {
  AdminCatalogSnapshot,
  CatalogAdminDataClient,
  CreateCategoryInput,
  CreateOrganizationInput,
  CreateProductInput,
  DeleteInput,
  UpdateCategoryInput,
  UpdateProductInput,
} from './catalog.repository.types.js';

function listData<TData>(data: TData[] | null | undefined): TData[] {
  return Array.isArray(data) ? data : [];
}

export async function listAdminCatalog(
  dataClient: CatalogAdminDataClient
): Promise<AdminCatalogSnapshot> {
  const [organizationResult, categoryResult, productResult] = await Promise.all([
    dataClient.models.Organization.list(),
    dataClient.models.Category.list(),
    dataClient.models.Product.list(),
  ]);

  const message = [
    getCatalogErrorMessage(organizationResult.errors),
    getCatalogErrorMessage(categoryResult.errors),
    getCatalogErrorMessage(productResult.errors),
  ]
    .filter(Boolean)
    .join(', ');

  if (message) {
    throw new Error(message);
  }

  return {
    organizations: listData(organizationResult.data),
    categories: listData(categoryResult.data),
    products: listData(productResult.data),
  };
}

export async function createOrganization(
  dataClient: CatalogAdminDataClient,
  input: CreateOrganizationInput
): Promise<Organization | null | undefined> {
  const result = await dataClient.models.Organization.create(input);
  assertCatalogResult(result.errors);
  return result.data;
}

export async function createCategory(
  dataClient: CatalogAdminDataClient,
  input: CreateCategoryInput
): Promise<Category | null | undefined> {
  const result = await dataClient.models.Category.create(input);
  assertCatalogResult(result.errors);
  return result.data;
}

export async function updateCategory(
  dataClient: CatalogAdminDataClient,
  input: UpdateCategoryInput
): Promise<Category | null | undefined> {
  const result = await dataClient.models.Category.update(input);
  assertCatalogResult(result.errors);
  return result.data;
}

export async function deleteCategory(
  dataClient: CatalogAdminDataClient,
  input: DeleteInput
): Promise<Category | null | undefined> {
  const result = await dataClient.models.Category.delete(input);
  assertCatalogResult(result.errors);
  return result.data;
}

export async function createProduct(
  dataClient: CatalogAdminDataClient,
  input: CreateProductInput
): Promise<Product | null | undefined> {
  const result = await dataClient.models.Product.create(input);
  assertCatalogResult(result.errors);
  return result.data;
}

export async function updateProduct(
  dataClient: CatalogAdminDataClient,
  input: UpdateProductInput
): Promise<Product | null | undefined> {
  const result = await dataClient.models.Product.update(input);
  assertCatalogResult(result.errors);
  return result.data;
}

export async function deleteProduct(
  dataClient: CatalogAdminDataClient,
  input: DeleteInput
): Promise<Product | null | undefined> {
  const result = await dataClient.models.Product.delete(input);
  assertCatalogResult(result.errors);
  return result.data;
}
