import type { MetaDescriptor } from 'react-router';
import type {
  StorefrontProductContent,
  StorefrontCategoryPageContent,
} from '@credo/feature';
import type { SeoConfig } from './seo-config';

export function privatePageMeta(brand: string): MetaDescriptor[] {
  return [{ title: brand }, { name: 'robots', content: 'noindex, nofollow' }];
}

function pageMeta(
  title: string,
  summary: string,
  path: string,
  brand: string,
  config: SeoConfig
): MetaDescriptor[] {
  const description =
    summary.replace(/\s+/g, ' ').trim().slice(0, 160) || `${title} - ${brand}`;
  return [
    { title: `${title} | ${brand}` },
    { name: 'description', content: description },
    {
      name: 'robots',
      content: config.indexable ? 'index, follow' : 'noindex, nofollow',
    },
    ...(config.origin
      ? [
          {
            tagName: 'link' as const,
            rel: 'canonical',
            href: `${config.origin}${path}`,
          },
        ]
      : []),
  ];
}

export function productMeta(
  product: StorefrontProductContent | undefined,
  brand: string,
  config: SeoConfig
): MetaDescriptor[] {
  if (!product) return privatePageMeta(brand);
  const path = `/p/${encodeURIComponent(product.slug)}`;
  const meta = pageMeta(product.title, product.summary, path, brand, config);
  if (config.origin) {
    const url = `${config.origin}${path}`;
    meta.push({
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title,
        description: product.summary,
        url,
        ...(product.imageUrl
          ? { image: [new URL(product.imageUrl, config.origin).href] }
          : {}),
        offers: {
          '@type': 'Offer',
          url,
          price: product.price,
          priceCurrency: product.currency,
          availability: product.inStock
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        },
      },
    });
  }
  return meta;
}

export function categoryMeta(
  content: StorefrontCategoryPageContent | undefined,
  brand: string,
  config: SeoConfig
): MetaDescriptor[] {
  if (!content) return privatePageMeta(brand);
  return pageMeta(
    content.category.title,
    content.category.summary,
    `/c/${encodeURIComponent(content.category.slug)}`,
    brand,
    config
  );
}
