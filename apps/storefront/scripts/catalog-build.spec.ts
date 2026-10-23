import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  catalogRoutes,
  prepareCatalog,
  validateSnapshot,
} from './catalog-build';

const fixture = {
  categories: [
    { id: 'c1', name: 'Chaises', slug: 'chaises', organizationId: 'o1' },
  ],
  products: [
    {
      id: 'p1',
      name: 'Chaise',
      slug: 'chaise',
      organizationId: 'o1',
      categoryId: 'c1',
      price: 12,
      imageUrl: 'catalog/product-images/chaise.png',
    },
  ],
};
const directories: string[] = [];
async function directory() {
  const path = await mkdtemp(join(tmpdir(), 'credo-catalog-test-'));
  directories.push(path);
  return path;
}
afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((path) => rm(path, { recursive: true, force: true }))
  );
});

describe('catalogue statique', () => {
  it('copies S3 images and emits content-addressed URLs without expiring credentials', async () => {
    const bytes = new Uint8Array([137, 80, 78, 71]);
    const download = vi.fn(async () => ({ bytes, contentType: 'image/png' }));
    const prepared = await prepareCatalog(fixture, await directory(), download);
    const image = prepared.snapshot.products[0].imageUrl ?? '';
    expect(image).toMatch(/^\/catalog-assets\/[a-f0-9]{64}\.png$/);
    expect(
      await readFile(
        join(prepared.assetsDirectory, image.split('/').pop() ?? '')
      )
    ).toEqual(Buffer.from(bytes));
    expect(prepared.routes).toEqual(['/c/chaises', '/p/chaise']);
    expect(JSON.parse(await readFile(prepared.snapshotPath, 'utf8'))).toEqual(
      prepared.snapshot
    );
  });

  it('does not download drafts and permits an empty catalog', async () => {
    const download = vi.fn();
    const prepared = await prepareCatalog(
      { ...fixture, products: [{ ...fixture.products[0], published: false }] },
      await directory(),
      download
    );
    expect(download).not.toHaveBeenCalled();
    expect(prepared.routes).toEqual(['/c/chaises']);
    expect(
      catalogRoutes(validateSnapshot({ categories: [], products: [] }))
    ).toEqual([]);
  });

  it('fails on image download errors instead of publishing broken images', async () => {
    await expect(
      prepareCatalog(fixture, await directory(), async () => {
        throw new Error('S3 unavailable');
      })
    ).rejects.toThrow('S3 unavailable');
  });

  it.each(['../outside', 'same/slug', '', 'test?draft=true'])(
    'rejects unsafe slugs: %s',
    (slug) => {
      expect(() =>
        validateSnapshot({
          ...fixture,
          products: [{ ...fixture.products[0], slug }],
        })
      ).toThrow();
    }
  );

  it('rejects duplicate routes and missing categories', () => {
    expect(() =>
      validateSnapshot({
        ...fixture,
        products: [fixture.products[0], { ...fixture.products[0], id: 'p2' }],
      })
    ).toThrow('doublon');
    expect(() => validateSnapshot({ ...fixture, categories: [] })).toThrow(
      'Categorie'
    );
  });

  it('rejects signed external URLs and path traversal in storage references', async () => {
    for (const imageUrl of [
      'https://example.test/photo?X-Amz-Signature=secret',
      'catalog/product-images/../../secret',
    ]) {
      await expect(
        prepareCatalog(
          { ...fixture, products: [{ ...fixture.products[0], imageUrl }] },
          await directory(),
          vi.fn()
        )
      ).rejects.toThrow();
    }
  });
});
