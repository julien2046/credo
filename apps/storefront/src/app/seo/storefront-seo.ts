import { resolveSeoConfig } from './seo-config';

export const storefrontSeo = resolveSeoConfig(
  import.meta.env.VITE_SITE_URL,
  import.meta.env.VITE_SEO_INDEXABLE
);
