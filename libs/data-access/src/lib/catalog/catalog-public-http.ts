import type { PublicCategory, PublicProduct } from './catalog.types.js';
import type { PublicCatalogSnapshot } from './catalog.repository.types.js';

export type PublicCatalogConnection = { url: string; apiKey: string };

export async function fetchPublicCatalog(
  connection: PublicCatalogConnection,
  fetcher: typeof fetch = fetch
): Promise<PublicCatalogSnapshot> {
  async function collect<T>(field: string, fields: string): Promise<T[]> {
    const items: T[] = [];
    const seen = new Set<string>();
    let nextToken: string | null = null;
    do {
      const response = await fetcher(connection.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': connection.apiKey,
        },
        body: JSON.stringify({
          query: `query CatalogPage($nextToken: String) { ${field}(nextToken: $nextToken) { items { ${fields} } nextToken } }`,
          variables: { nextToken },
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok)
        throw new Error(`Catalogue public: HTTP ${response.status}`);
      const result = (await response.json()) as {
        errors?: unknown[];
        data?: Record<string, { items?: T[]; nextToken?: unknown }>;
      } | null;
      if (result?.errors?.length) {
        throw new Error(
          'Lecture du catalogue impossible. Verifiez le deploiement des requetes paginees et la cle API Amplify.'
        );
      }
      const page = result?.data?.[field];
      if (!page || !Array.isArray(page.items))
        throw new Error('Reponse catalogue invalide');
      items.push(...page.items);
      const token = page.nextToken;
      if (token != null && (typeof token !== 'string' || seen.has(token))) {
        throw new Error('Pagination catalogue invalide');
      }
      nextToken = token ?? null;
      if (nextToken) seen.add(nextToken);
    } while (nextToken);
    return items;
  }

  const [categories, products] = await Promise.all([
    collect<PublicCategory>(
      'listPublicCategoryPage',
      'id name slug description organizationId'
    ),
    collect<PublicProduct>(
      'listPublicProductPage',
      'id name slug description price currency imageUrl inStock organizationId categoryId'
    ),
  ]);
  return { categories, products };
}
