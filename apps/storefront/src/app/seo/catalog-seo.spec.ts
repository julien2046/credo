import { describe, expect, it } from 'vitest';
import { categoryMeta, privatePageMeta, productMeta } from './catalog-seo';
import { resolveSeoConfig } from './seo-config';

const product = {
  id: 'p1',
  slug: 'chaise',
  title: 'Chaise',
  summary: 'Une chaise confortable.',
  categorySlug: 'salon',
  imageUrl: '/catalog-assets/chaise.jpg',
  price: 49.9,
  currency: 'CAD',
  inStock: true,
};
const production = resolveSeoConfig('https://boutique.example/', 'true');

describe('SEO configuration', () => {
  it('defaults to noindex without an invented domain', () => {
    expect(resolveSeoConfig()).toEqual({ origin: null, indexable: false });
  });
  it.each([
    undefined,
    'http://boutique.example',
    'https://boutique.example/path',
    'https://user:pass@boutique.example',
    'https://boutique.example?test=1',
    'https://boutique.example/#section',
    'https://demo.local',
  ])('rejects invalid production origin %s', (origin) => {
    expect(() => resolveSeoConfig(origin, 'true')).toThrow();
  });
  it('rejects an ambiguous indexing flag', () => {
    expect(() => resolveSeoConfig(undefined, 'yes')).toThrow();
  });
});

describe('catalogue metadata', () => {
  it('generates product metadata and honest offer data', () => {
    const meta = productMeta(product, 'Atelier', production);
    expect(meta).toContainEqual({ title: 'Chaise | Atelier' });
    expect(meta).toContainEqual({
      tagName: 'link',
      rel: 'canonical',
      href: 'https://boutique.example/p/chaise',
    });
    expect(meta).toContainEqual({ name: 'robots', content: 'index, follow' });
    const structured = meta.find((item) => 'script:ld+json' in item);
    expect(structured).toMatchObject({
      'script:ld+json': {
        '@type': 'Product',
        image: ['https://boutique.example/catalog-assets/chaise.jpg'],
        offers: {
          '@type': 'Offer',
          price: 49.9,
          priceCurrency: 'CAD',
          availability: 'https://schema.org/InStock',
        },
      },
    });
    expect(JSON.stringify(structured)).not.toContain('aggregateRating');
    expect(
      JSON.stringify(
        productMeta({ ...product, inStock: false }, 'Atelier', production)
      )
    ).toContain('OutOfStock');
  });
  it('does not invent image data', () => {
    const meta = productMeta(
      { ...product, imageUrl: null },
      'Atelier',
      production
    );
    expect(JSON.stringify(meta)).not.toContain('"image"');
  });
  it('keeps local pages noindex and omits absolute SEO links without a domain', () => {
    const meta = productMeta(product, 'Atelier', resolveSeoConfig());
    expect(meta).toContainEqual({
      name: 'robots',
      content: 'noindex, nofollow',
    });
    expect(
      meta.some((item) => 'tagName' in item || 'script:ld+json' in item)
    ).toBe(false);
  });
  it('creates category metadata without product rich results', () => {
    const meta = categoryMeta(
      {
        category: {
          id: 'c1',
          slug: 'salon',
          title: 'Salon',
          summary: ' Mobilier\n de salon ',
        },
        products: [product],
      },
      'Atelier',
      production
    );
    expect(meta).toContainEqual({
      name: 'description',
      content: 'Mobilier de salon',
    });
    expect(meta).toContainEqual({
      tagName: 'link',
      rel: 'canonical',
      href: 'https://boutique.example/c/salon',
    });
    expect(meta.some((item) => 'script:ld+json' in item)).toBe(false);
  });
  it('makes errors and private routes noindex without a canonical or structured data', () => {
    expect(productMeta(undefined, 'Atelier', production)).toEqual(
      privatePageMeta('Atelier')
    );
    expect(categoryMeta(undefined, 'Atelier', production)).toEqual(
      privatePageMeta('Atelier')
    );
  });
});
