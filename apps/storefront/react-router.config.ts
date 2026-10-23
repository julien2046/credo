import type { Config } from '@react-router/dev/config';
import { cp, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { catalogRoutes, validateSnapshot } from './scripts/catalog-build';

export default {
  appDirectory: 'src',
  buildDirectory: 'dist',
  ssr: false,
  async prerender() {
    const path = process.env.STOREFRONT_BUILD_SNAPSHOT;
    if (!path) return [];
    return catalogRoutes(
      validateSnapshot(JSON.parse(await readFile(path, 'utf8')))
    );
  },
  async buildEnd({ reactRouterConfig }) {
    const assets = process.env.STOREFRONT_BUILD_ASSETS;
    if (assets)
      await cp(
        assets,
        join(reactRouterConfig.buildDirectory, 'client/catalog-assets'),
        { recursive: true }
      );
  },
} satisfies Config;
