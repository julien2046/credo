import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { PublicCatalogSnapshot } from '@credo/data-access';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const imagePattern = /^catalog\/product-images\/[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

export function validateSnapshot(input: unknown): PublicCatalogSnapshot {
  if (
    !input ||
    typeof input !== 'object' ||
    !('categories' in input) ||
    !('products' in input) ||
    !Array.isArray(input.categories) ||
    !Array.isArray(input.products)
  ) {
    throw new Error('Snapshot catalogue invalide');
  }
  const snapshot = structuredClone(input) as PublicCatalogSnapshot;
  // Public API results contain no publication flag. Explicit drafts in fixtures are excluded.
  snapshot.products = snapshot.products.filter(
    (product) =>
      !product || !('published' in product) || product.published === true
  );
  for (const records of [snapshot.categories, snapshot.products]) {
    const slugs = new Set<string>();
    const ids = new Set<string>();
    for (const record of records) {
      if (
        !record ||
        typeof record.id !== 'string' ||
        !record.id ||
        typeof record.name !== 'string' ||
        !record.name.trim() ||
        typeof record.slug !== 'string' ||
        !slugPattern.test(record.slug) ||
        typeof record.organizationId !== 'string' ||
        !record.organizationId
      ) {
        throw new Error(
          'Catalogue: identifiant, nom, organisation ou slug invalide'
        );
      }
      if (slugs.has(record.slug) || ids.has(record.id))
        throw new Error(`Catalogue: doublon ${record.slug}`);
      slugs.add(record.slug);
      ids.add(record.id);
    }
  }
  for (const product of snapshot.products) {
    if (!Number.isFinite(product.price) || product.price < 0)
      throw new Error(`Prix invalide: ${product.slug}`);
    if (product.categoryId) {
      const category = snapshot.categories.find(
        (item) => item.id === product.categoryId
      );
      if (!category || category.organizationId !== product.organizationId) {
        throw new Error(`Categorie invalide: ${product.slug}`);
      }
    }
  }
  return snapshot;
}

export function catalogRoutes(snapshot: PublicCatalogSnapshot): string[] {
  return [
    ...snapshot.categories.map((category) => `/c/${category.slug}`),
    ...snapshot.products.map((product) => `/p/${product.slug}`),
  ].sort();
}

type ImageDownload = { bytes: Uint8Array; contentType: string };

export async function prepareCatalog(
  input: unknown,
  directory: string,
  download: (path: string) => Promise<ImageDownload>
) {
  const snapshot = validateSnapshot(input);
  const assetsDirectory = join(directory, 'catalog-assets');
  await mkdir(assetsDirectory, { recursive: true });
  const images = new Map<string, string>();
  for (const product of snapshot.products) {
    const reference = product.imageUrl;
    if (!reference) continue;
    if (imagePattern.test(reference)) {
      if (!images.has(reference)) {
        const { bytes, contentType } = await download(reference);
        const extensions: Record<string, string> = {
          'image/png': 'png',
          'image/jpeg': 'jpg',
          'image/webp': 'webp',
          'image/gif': 'gif',
          'image/avif': 'avif',
        };
        const extension =
          extensions[contentType.split(';')[0].trim().toLowerCase()];
        if (
          !extension ||
          bytes.byteLength === 0 ||
          bytes.byteLength > 20 * 1024 * 1024
        ) {
          throw new Error(
            `Image invalide ou trop volumineuse: ${product.slug}`
          );
        }
        const hash = createHash('sha256').update(bytes).digest('hex');
        const filename = `${hash}.${extension}`;
        await writeFile(join(assetsDirectory, filename), bytes);
        images.set(reference, `/catalog-assets/${filename}`);
      }
      product.imageUrl = images.get(reference) ?? null;
    } else {
      // External images remain external; never fetch merchant-controlled URLs in CI.
      let url: URL;
      try {
        url = new URL(reference);
      } catch {
        throw new Error(`Reference image invalide: ${product.slug}`);
      }
      if (
        url.protocol !== 'https:' ||
        url.username ||
        url.password ||
        /(?:signature|token|expires|x-amz-|x-goog-)/i.test(url.search)
      ) {
        throw new Error(
          `Image externe non durable: ${product.slug}. Importez-la dans S3.`
        );
      }
    }
  }
  const snapshotPath = join(directory, 'catalog.json');
  await writeFile(snapshotPath, JSON.stringify(snapshot));
  return {
    snapshot,
    snapshotPath,
    assetsDirectory,
    routes: catalogRoutes(snapshot),
  };
}
