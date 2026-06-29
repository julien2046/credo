import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import {
  listPublicCatalog,
  type PublicCatalogSnapshot,
  type PublicCategory,
  type PublicProduct,
} from '@credo/data-access';
import { configureAmplify, getDataClient } from '@credo/platform-amplify';

type StaticPage = {
  body: string;
  canonicalPath: string;
  description: string;
  jsonLd?: Record<string, unknown>;
  title: string;
};

type StaticProduct = {
  categorySlug: string | null;
  currency: string;
  description: string;
  id: string;
  imageUrl: string | null;
  inStock: boolean;
  name: string;
  price: number;
  slug: string;
};

type StaticCategory = {
  description: string;
  id: string;
  name: string;
  organizationId: string;
  slug: string;
};

type StaticPromo = {
  description: string;
  slug: string;
  title: string;
};

const require = createRequire(import.meta.url);
const scriptDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(scriptDir, '../../..');
const appRoot = join(workspaceRoot, 'apps/storefront');
const distDir = resolve(
  process.env.STOREFRONT_DIST_DIR ?? join(appRoot, 'dist/client')
);
const indexPath = join(distDir, 'index.html');
const brandName = process.env.STOREFRONT_BRAND_NAME ?? 'Credo Storefront';
const siteUrl = normalizeSiteUrl(
  process.env.STOREFRONT_BASE_URL ??
    process.env.VITE_SITE_URL ??
    'http://localhost:4200'
);

const promos: StaticPromo[] = [
  {
    slug: 'summer',
    title: 'Promo Summer',
    description:
      'Promotion exemple pour preparer une page evenementielle indexable.',
  },
];

function normalizeSiteUrl(value: string): string {
  return value.replace(/\/+$/g, '');
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('`', '&#96;');
}

function absoluteUrl(path: string): string {
  return `${siteUrl}${path}`;
}

function isExternalImageUrl(value: string | null | undefined): value is string {
  return /^https?:\/\//i.test(value ?? '');
}

function toStaticCategory(
  category: PublicCategory | null | undefined
): StaticCategory | null {
  if (!category?.id || !category.name || !category.slug) {
    return null;
  }

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    organizationId: category.organizationId,
    description:
      category.description ??
      `Selection de produits pour la categorie ${category.name}.`,
  };
}

function toStaticProduct(
  product: PublicProduct | null | undefined,
  category: StaticCategory | null | undefined
): StaticProduct | null {
  if (!product?.id || !product.name || !product.slug) {
    return null;
  }

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description:
      product.description ??
      `Fiche produit ${product.name} prete pour le storefront public.`,
    categorySlug: category?.slug ?? null,
    imageUrl: isExternalImageUrl(product.imageUrl) ? product.imageUrl : null,
    price: product.price,
    currency: product.currency ?? 'EUR',
    inStock: product.inStock !== false,
  };
}

async function loadSnapshotFromFile(
  snapshotPath: string
): Promise<PublicCatalogSnapshot> {
  return JSON.parse(await readFile(resolve(snapshotPath), 'utf8'));
}

async function loadPublicCatalog(): Promise<PublicCatalogSnapshot> {
  if (process.env.STOREFRONT_PRERENDER_SNAPSHOT_JSON) {
    return JSON.parse(process.env.STOREFRONT_PRERENDER_SNAPSHOT_JSON);
  }

  if (process.env.STOREFRONT_PRERENDER_SNAPSHOT) {
    return loadSnapshotFromFile(process.env.STOREFRONT_PRERENDER_SNAPSHOT);
  }

  const outputs = require(join(workspaceRoot, 'amplify_outputs.json'));
  configureAmplify(outputs);

  return listPublicCatalog(getDataClient());
}

function staticShell(content: string): string {
  return `
    <main data-static-prerender="true" style="font-family: Inter, Arial, sans-serif; color: #1f2933; max-width: 1120px; margin: 0 auto; padding: 48px 24px;">
      ${content}
    </main>
  `;
}

function renderProductCard(product: StaticProduct): string {
  return `
    <article style="border: 1px solid #d7dde5; border-radius: 12px; padding: 20px; background: #fff;">
      ${
        product.imageUrl
          ? `<img src="${escapeAttribute(product.imageUrl)}" alt="${escapeAttribute(
              product.name
            )}" style="width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 10px; margin-bottom: 16px;" />`
          : ''
      }
      <h2 style="font-size: 22px; margin: 0 0 8px;">${escapeHtml(
        product.name
      )}</h2>
      <p style="margin: 0 0 14px; color: #536170;">${escapeHtml(
        product.description
      )}</p>
      <p style="font-weight: 800; margin: 0 0 14px;">${new Intl.NumberFormat(
        'fr-CA',
        {
          style: 'currency',
          currency: product.currency,
        }
      ).format(product.price)}</p>
      <a href="/p/${escapeAttribute(product.slug)}">Voir le produit</a>
    </article>
  `;
}

function productJsonLd(product: StaticProduct): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: product.id,
    url: absoluteUrl(`/p/${product.slug}`),
    ...(product.imageUrl ? { image: [product.imageUrl] } : {}),
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: absoluteUrl(`/p/${product.slug}`),
    },
  };
}

function stringifyJsonLd(value: Record<string, unknown>): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

function createHomePage(
  categories: StaticCategory[],
  products: StaticProduct[]
): StaticPage {
  return {
    canonicalPath: '/',
    title: `${brandName} | Boutique en ligne`,
    description: `${brandName}: boutique en ligne, categories et produits publies.`,
    body: staticShell(`
      <p style="text-transform: uppercase; letter-spacing: .08em; color: #536170; margin: 0 0 12px;">Boutique en ligne</p>
      <h1 style="font-size: 42px; line-height: 1.08; margin: 0 0 16px;">${escapeHtml(
        brandName
      )}</h1>
      <p style="font-size: 18px; color: #536170; margin: 0 0 32px;">Catalogue public genere statiquement pour le SEO.</p>
      <section>
        <h2>Categories</h2>
        <ul>
          ${categories
            .map(
              (category) =>
                `<li><a href="/c/${escapeAttribute(
                  category.slug
                )}">${escapeHtml(category.name)}</a></li>`
            )
            .join('')}
        </ul>
      </section>
      <section>
        <h2>Produits publies</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
          ${products.slice(0, 6).map(renderProductCard).join('')}
        </div>
      </section>
    `),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: brandName,
      url: absoluteUrl('/'),
    },
  };
}

function createCategoryPage(
  category: StaticCategory,
  products: StaticProduct[]
): StaticPage {
  return {
    canonicalPath: `/c/${category.slug}`,
    title: `${category.name} | ${brandName}`,
    description: category.description,
    body: staticShell(`
      <p style="text-transform: uppercase; letter-spacing: .08em; color: #536170; margin: 0 0 12px;">Categorie</p>
      <h1 style="font-size: 42px; line-height: 1.08; margin: 0 0 16px;">${escapeHtml(
        category.name
      )}</h1>
      <p style="font-size: 18px; color: #536170; margin: 0 0 32px;">${escapeHtml(
        category.description
      )}</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
        ${products.map(renderProductCard).join('')}
      </div>
    `),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: category.name,
      description: category.description,
      url: absoluteUrl(`/c/${category.slug}`),
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: products.map((product, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: absoluteUrl(`/p/${product.slug}`),
          name: product.name,
        })),
      },
    },
  };
}

function createProductPage(product: StaticProduct): StaticPage {
  return {
    canonicalPath: `/p/${product.slug}`,
    title: `${product.name} | ${brandName}`,
    description: product.description,
    body: staticShell(`
      <p style="text-transform: uppercase; letter-spacing: .08em; color: #536170; margin: 0 0 12px;">Produit</p>
      <h1 style="font-size: 42px; line-height: 1.08; margin: 0 0 16px;">${escapeHtml(
        product.name
      )}</h1>
      ${
        product.imageUrl
          ? `<img src="${escapeAttribute(product.imageUrl)}" alt="${escapeAttribute(
              product.name
            )}" style="width: min(100%, 680px); aspect-ratio: 4 / 3; object-fit: cover; border-radius: 12px; margin: 0 0 24px;" />`
          : ''
      }
      <p style="font-size: 18px; color: #536170; margin: 0 0 24px;">${escapeHtml(
        product.description
      )}</p>
      <p style="font-size: 22px; font-weight: 800; margin: 0 0 12px;">${new Intl.NumberFormat(
        'fr-CA',
        {
          style: 'currency',
          currency: product.currency,
        }
      ).format(product.price)}</p>
      <p style="margin: 0;">${product.inStock ? 'En stock' : 'Rupture'}</p>
      ${
        product.categorySlug
          ? `<p><a href="/c/${escapeAttribute(
              product.categorySlug
            )}">Voir la categorie</a></p>`
          : ''
      }
    `),
    jsonLd: productJsonLd(product),
  };
}

function createPromoPage(promo: StaticPromo): StaticPage {
  return {
    canonicalPath: `/promo/${promo.slug}`,
    title: `${promo.title} | ${brandName}`,
    description: promo.description,
    body: staticShell(`
      <p style="text-transform: uppercase; letter-spacing: .08em; color: #536170; margin: 0 0 12px;">Promotion</p>
      <h1 style="font-size: 42px; line-height: 1.08; margin: 0 0 16px;">${escapeHtml(
        promo.title
      )}</h1>
      <p style="font-size: 18px; color: #536170; margin: 0;">${escapeHtml(
        promo.description
      )}</p>
    `),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: promo.title,
      description: promo.description,
      url: absoluteUrl(`/promo/${promo.slug}`),
    },
  };
}

function injectStaticPage(indexHtml: string, page: StaticPage): string {
  const title = escapeHtml(page.title);
  const description = escapeAttribute(page.description);
  const canonicalUrl = absoluteUrl(page.canonicalPath);
  const jsonLd = page.jsonLd
    ? `<script type="application/ld+json">${stringifyJsonLd(
        page.jsonLd
      )}</script>`
    : '';
  const head = `
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />
    <meta property="og:title" content="${escapeAttribute(page.title)}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${escapeAttribute(canonicalUrl)}" />
    <meta property="og:type" content="website" />
    ${jsonLd}
  `;

  return indexHtml
    .replace('<html lang="en">', '<html lang="fr-CA">')
    .replace(/<title>.*?<\/title>/s, `<title>${title}</title>`)
    .replace('</head>', `${head}\n  </head>`)
    .replace(
      /<div id="root">[\s\S]*?<\/div>/,
      `<div id="root">${page.body}</div>`
    );
}

function routeOutputPath(routePath: string): string {
  if (routePath === '/') {
    return join(distDir, 'index.html');
  }

  return join(distDir, routePath.replace(/^\/+/, ''), 'index.html');
}

async function writeRoute(indexHtml: string, page: StaticPage) {
  const outputPath = routeOutputPath(page.canonicalPath);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, injectStaticPage(indexHtml, page), 'utf8');
}

async function writeSitemap(routePaths: string[]) {
  const urls = routePaths
    .map(
      (routePath) => `
  <url>
    <loc>${escapeHtml(absoluteUrl(routePath))}</loc>
  </url>`
    )
    .join('');

  await writeFile(
    join(distDir, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>
`,
    'utf8'
  );
}

async function writeRobots() {
  await writeFile(
    join(distDir, 'robots.txt'),
    `User-agent: *
Allow: /
Sitemap: ${absoluteUrl('/sitemap.xml')}
`,
    'utf8'
  );
}

async function main() {
  const indexHtml = await readFile(indexPath, 'utf8');
  const { categories, products } = await loadPublicCatalog();
  const staticCategories = categories
    .map(toStaticCategory)
    .filter((category): category is StaticCategory => Boolean(category));
  const categoriesById = new Map(
    staticCategories.map((category) => [category.id, category])
  );
  const staticProducts = products
    .map((product) =>
      toStaticProduct(
        product,
        product.categoryId ? categoriesById.get(product.categoryId) : null
      )
    )
    .filter((product): product is StaticProduct => Boolean(product));
  const pages = [
    createHomePage(staticCategories, staticProducts),
    ...staticCategories.map((category) =>
      createCategoryPage(
        category,
        staticProducts.filter(
          (product) => product.categorySlug === category.slug
        )
      )
    ),
    ...staticProducts.map(createProductPage),
    ...promos.map(createPromoPage),
  ];

  await Promise.all(pages.map((page) => writeRoute(indexHtml, page)));
  await writeSitemap(pages.map((page) => page.canonicalPath));
  await writeRobots();
  await writeFile(
    join(distDir, 'prerendered-routes.json'),
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        routes: pages.map((page) => page.canonicalPath),
      },
      null,
      2
    )}\n`,
    'utf8'
  );

  console.log(`Prerendered ${pages.length} storefront route(s).`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
