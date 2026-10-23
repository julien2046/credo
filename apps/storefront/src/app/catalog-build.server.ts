import { readFile } from 'node:fs/promises';
import type { PublicCatalogSnapshot } from '@credo/data-access';
import {
  loadCategoryPage,
  loadProductPage,
  type StorefrontContentSource,
} from '@credo/feature';

let snapshot: Promise<PublicCatalogSnapshot> | undefined;

const source: StorefrontContentSource = {
  loadCatalog() {
    const path = process.env.STOREFRONT_BUILD_SNAPSHOT;
    if (!path)
      throw new Error(
        'Snapshot de build manquant. Utilisez npm run build:storefront.'
      );
    return (snapshot ??= readFile(path, 'utf8').then(JSON.parse));
  },
  resolveImage: async (reference) => reference ?? null,
};

export const loadBuiltProduct = (slug: string | undefined) =>
  loadProductPage(slug, source);
export const loadBuiltCategory = (slug: string | undefined) =>
  loadCategoryPage(slug, source);
