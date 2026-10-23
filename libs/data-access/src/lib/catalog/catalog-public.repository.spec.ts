import { describe, expect, it, vi } from 'vitest';
import { listPublicCatalog } from './catalog-public.repository.js';

function client() {
  return {
    queries: {
      listPublicCategoryPage: vi
        .fn()
        .mockResolvedValue({ data: { items: [], nextToken: null } }),
      listPublicProductPage: vi
        .fn()
        .mockResolvedValue({ data: { items: [], nextToken: null } }),
    },
  };
}

describe('listPublicCatalog', () => {
  it('continues after an empty filtered page', async () => {
    const api = client();
    api.queries.listPublicProductPage
      .mockResolvedValueOnce({ data: { items: [], nextToken: 'page-2' } })
      .mockResolvedValueOnce({
        data: { items: [{ id: 'p1' }], nextToken: null },
      });
    expect((await listPublicCatalog(api)).products).toEqual([{ id: 'p1' }]);
    expect(api.queries.listPublicProductPage).toHaveBeenLastCalledWith(
      { nextToken: 'page-2' },
      { authMode: 'apiKey' }
    );
  });

  it('rejects repeated tokens', async () => {
    const api = client();
    api.queries.listPublicProductPage.mockResolvedValue({
      data: { items: [], nextToken: 'same' },
    });
    await expect(listPublicCatalog(api)).rejects.toThrow('Pagination');
  });

  it('does not hide backend errors as an empty catalogue', async () => {
    const api = client();
    api.queries.listPublicCategoryPage.mockResolvedValue({
      data: null,
      errors: [{ message: 'Forbidden' }],
    });
    await expect(listPublicCatalog(api)).rejects.toThrow('Forbidden');
  });
});
