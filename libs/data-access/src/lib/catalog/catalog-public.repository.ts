import { getCatalogErrorMessage } from './catalog-result.js';
import type {
  CatalogPublicDataClient,
  GraphQLResult,
  PublicCatalogSnapshot,
} from './catalog.repository.types.js';

async function collectPages<T>(
  query: (input: {
    nextToken: string | null;
  }) => Promise<GraphQLResult<{ items: T[]; nextToken?: string | null }>>
): Promise<T[]> {
  const items: T[] = [];
  const seen = new Set<string>();
  let nextToken: string | null = null;
  do {
    const result = await query({ nextToken });
    const message = getCatalogErrorMessage(result.errors);
    if (message) throw new Error(message);
    if (!result.data || !Array.isArray(result.data.items)) {
      throw new Error('Reponse catalogue invalide');
    }
    items.push(...result.data.items);
    nextToken = result.data.nextToken ?? null;
    if (
      nextToken !== null &&
      (typeof nextToken !== 'string' || seen.has(nextToken))
    ) {
      throw new Error('Pagination catalogue invalide');
    }
    if (nextToken) seen.add(nextToken);
  } while (nextToken);
  return items;
}

export async function listPublicCatalog(
  dataClient: CatalogPublicDataClient
): Promise<PublicCatalogSnapshot> {
  const [categories, products] = await Promise.all([
    collectPages((input) =>
      dataClient.queries.listPublicCategoryPage(input, { authMode: 'apiKey' })
    ),
    collectPages((input) =>
      dataClient.queries.listPublicProductPage(input, { authMode: 'apiKey' })
    ),
  ]);
  return { categories, products };
}
