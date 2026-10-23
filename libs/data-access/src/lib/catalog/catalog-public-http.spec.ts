import { describe, it, expect, vi } from 'vitest';
import { fetchPublicCatalog } from './catalog-public-http.js';

describe('public catalog pagination', () => {
  it('continues after an empty filtered page and collects all products', async () => {
    const tokens: unknown[] = [];
    const fetcher = vi.fn(async (_url, init) => {
      const { query, variables } = JSON.parse(init?.body as string);
      if (query.includes('listPublicCategoryPage'))
        return Response.json({
          data: { listPublicCategoryPage: { items: [], nextToken: null } },
        });
      tokens.push(variables.nextToken);
      return Response.json({
        data: {
          listPublicProductPage: variables.nextToken
            ? { items: [{ id: 'published' }], nextToken: null }
            : { items: [], nextToken: 'page-2' },
        },
      });
    }) as typeof fetch;
    const result = await fetchPublicCatalog(
      { url: 'https://example.test/graphql', apiKey: 'test' },
      fetcher
    );
    expect(tokens).toEqual([null, 'page-2']);
    expect(result.products).toEqual([{ id: 'published' }]);
  });

  it.each([
    () => new Response('', { status: 403 }),
    () => Response.json({ errors: [{ message: 'bad key' }] }),
    () => Response.json({ data: {} }),
  ])(
    'fails instead of returning an empty catalogue on API errors',
    async (response) => {
      await expect(
        fetchPublicCatalog(
          { url: 'https://example.test', apiKey: 'test' },
          vi.fn(async () => response())
        )
      ).rejects.toThrow();
    }
  );

  it('rejects a repeating pagination token', async () => {
    const fetcher = vi.fn(async (_url, init) => {
      const { query } = JSON.parse(init?.body as string);
      const key = query.includes('listPublicCategoryPage')
        ? 'listPublicCategoryPage'
        : 'listPublicProductPage';
      return Response.json({
        data: { [key]: { items: [], nextToken: 'same-token' } },
      });
    }) as typeof fetch;
    await expect(
      fetchPublicCatalog(
        { url: 'https://example.test', apiKey: 'test' },
        fetcher
      )
    ).rejects.toThrow('Pagination');
  });
});
