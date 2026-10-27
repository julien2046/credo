import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { robotsTxt, sitemapXml, writeSeoFiles } from './seo-files';
import { spaPathPattern } from './hosting-routes';
import rules from '../amplify-custom-rules.json';

const production = { origin: 'https://boutique.example', indexable: true };

describe('SEO build files', () => {
  it('lists unique public paths with XML escaping', () => {
    const xml = sitemapXml(['/p/a', '/c/b', '/p/a', '/p/a&b'], production);
    expect(xml.match(/<url>/g)).toHaveLength(3);
    expect(xml).toContain('<loc>https://boutique.example/p/a&amp;b</loc>');
    expect(xml).not.toContain('lastmod');
    expect(robotsTxt(production)).toContain(
      'Sitemap: https://boutique.example/sitemap.xml'
    );
  });
  it('does not advertise a preview catalogue', () => {
    const config = { ...production, indexable: false };
    expect(sitemapXml(['/p/a'], config)).not.toContain('<loc>');
    expect(robotsTxt(config)).not.toContain('Sitemap:');
  });
  it('writes the sitemap, robots and a noindex static 404', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'credo-seo-'));
    try {
      await writeSeoFiles(directory, ['/p/a'], production);
      expect(await readFile(join(directory, 'sitemap.xml'), 'utf8')).toContain(
        '/p/a</loc>'
      );
      expect(await readFile(join(directory, 'robots.txt'), 'utf8')).toContain(
        'Allow: /'
      );
      expect(await readFile(join(directory, '404.html'), 'utf8')).toContain(
        'noindex, nofollow'
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

describe('static hosting boundaries', () => {
  it('uses the same SPA scope in preview and Amplify', () => {
    expect(rules[0].source).toBe(
      `<${spaPathPattern.toString().replaceAll('\\/', '/')}>`
    );
    expect(rules[1]).toMatchObject({
      source: '/<*>',
      status: '404',
      target: '/404.html',
    });
  });
  it.each([
    '/admin',
    '/admin/products',
    '/account/orders',
    '/cart',
    '/checkout',
    '/promo/summer',
  ])('allows the dynamic route %s', (path) => {
    expect(spaPathPattern.test(path)).toBe(true);
  });
  it.each([
    '/p/missing',
    '/c/missing',
    '/missing',
    '/sitemap.xml',
    '/catalog-assets/missing.png',
    '/p/test.data',
    '/admin/missing.js',
  ])('does not mask missing static content %s', (path) => {
    expect(spaPathPattern.test(path)).toBe(false);
  });
});
