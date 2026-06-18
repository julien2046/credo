import {
  getCatalogErrorMessage,
} from './catalog-result.js';
import type {
  CatalogPublicDataClient,
  PublicCatalogSnapshot,
} from './catalog.repository.types.js';

function listData<TData>(data: TData[] | null | undefined): TData[] {
  return Array.isArray(data) ? data : [];
}

export async function listPublicCatalog(
  dataClient: CatalogPublicDataClient
): Promise<PublicCatalogSnapshot> {
  const [categoryResult, productResult] = await Promise.all([
    dataClient.queries.listPublicCategories({ authMode: 'apiKey' }),
    dataClient.queries.listPublicProducts({ authMode: 'apiKey' }),
  ]);

  const message = [
    getCatalogErrorMessage(categoryResult.errors),
    getCatalogErrorMessage(productResult.errors),
  ]
    .filter(Boolean)
    .join(', ');

  if (message) {
    throw new Error(message);
  }

  return {
    categories: listData(categoryResult.data),
    products: listData(productResult.data),
  };
}
