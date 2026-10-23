import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchPublicCatalog } from '@credo/data-access';
import { configureAmplify, resolveStorageUrl } from '@credo/platform-amplify';
import { prepareCatalog } from './catalog-build';

const workspace = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const directory = await mkdtemp(join(tmpdir(), 'credo-prerender-'));

try {
  let input: unknown;
  if (process.env.STOREFRONT_PRERENDER_SNAPSHOT) {
    input = JSON.parse(
      await readFile(resolve(process.env.STOREFRONT_PRERENDER_SNAPSHOT), 'utf8')
    );
  } else {
    const outputs = JSON.parse(
      await readFile(join(workspace, 'amplify_outputs.json'), 'utf8')
    );
    if (!outputs.data?.url || !outputs.data?.api_key)
      throw new Error('Outputs Amplify: API publique manquante');
    configureAmplify(outputs);
    input = await fetchPublicCatalog({
      url: outputs.data.url,
      apiKey: outputs.data.api_key,
    });
  }
  const prepared = await prepareCatalog(input, directory, async (path) => {
    // Fixture mode may still reference S3 images from the selected backend.
    const outputs = JSON.parse(
      await readFile(join(workspace, 'amplify_outputs.json'), 'utf8')
    );
    configureAmplify(outputs);
    const response = await fetch(await resolveStorageUrl(path), {
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok)
      throw new Error(`Lecture image S3 impossible: HTTP ${response.status}`);
    const length = Number(response.headers.get('content-length'));
    if (length > 20 * 1024 * 1024) throw new Error('Image S3 trop volumineuse');
    return {
      bytes: new Uint8Array(await response.arrayBuffer()),
      contentType: response.headers.get('content-type') ?? '',
    };
  });
  console.log(
    `Catalogue de build: ${prepared.snapshot.products.length} produit(s), ${prepared.snapshot.categories.length} categorie(s).`
  );
  const child = spawn(
    process.execPath,
    [
      join(workspace, 'node_modules/@react-router/dev/bin.cjs'),
      'build',
      'apps/storefront',
    ],
    {
      cwd: workspace,
      stdio: 'inherit',
      env: {
        ...process.env,
        STOREFRONT_BUILD_SNAPSHOT: prepared.snapshotPath,
        STOREFRONT_BUILD_ASSETS: prepared.assetsDirectory,
        STOREFRONT_BUILD_PRODUCTS: prepared.snapshot.products.length
          ? '1'
          : '0',
        STOREFRONT_BUILD_CATEGORIES: prepared.snapshot.categories.length
          ? '1'
          : '0',
      },
    }
  );
  const code = await new Promise<number>((resolveCode, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => resolveCode(code ?? 1));
  });
  process.exitCode = code;
} finally {
  await rm(directory, { recursive: true, force: true });
}
