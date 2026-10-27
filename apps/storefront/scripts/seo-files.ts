import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { SeoConfig } from '../src/app/seo/seo-config';

function escapeXml(value: string): string {
  return value.replace(
    /[<>&"']/g,
    (character) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;',
      }[character] ?? character)
  );
}

export function sitemapXml(routes: string[], config: SeoConfig): string {
  const urls =
    config.indexable && config.origin
      ? [...new Set(routes)]
          .sort()
          .map(
            (path) => `<url><loc>${escapeXml(config.origin + path)}</loc></url>`
          )
          .join('\n')
      : '';
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function robotsTxt(config: SeoConfig): string {
  // Let crawlers read noindex tags; robots.txt is not an access-control mechanism.
  return config.indexable && config.origin
    ? `User-agent: *\nAllow: /\nSitemap: ${config.origin}/sitemap.xml\n`
    : 'User-agent: *\nAllow: /\n# Preview: pages carry noindex; sitemap is empty.\n';
}

export async function writeSeoFiles(
  directory: string,
  routes: string[],
  config: SeoConfig
) {
  await writeFile(join(directory, 'sitemap.xml'), sitemapXml(routes, config));
  await writeFile(join(directory, 'robots.txt'), robotsTxt(config));
  await writeFile(
    join(directory, '404.html'),
    '<!doctype html><html lang="fr-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>Page introuvable</title></head><body><main><h1>Page introuvable</h1><p>Cette page n\'existe pas ou n\'est plus publiee.</p><a href="/">Accueil</a></main></body></html>'
  );
}
