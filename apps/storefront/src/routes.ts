import type { RouteConfig } from '@react-router/dev/routes';
import { index, layout, route } from '@react-router/dev/routes';

export default [
  layout('routes/storefront-shell.tsx', [
    index('routes/home.tsx'),
    route(
      'p/:productSlug',
      process.env.STOREFRONT_BUILD_PRODUCTS === '1'
        ? 'routes/product.prerender.tsx'
        : 'routes/product.tsx',
      { id: 'product' }
    ),
    route(
      'c/:categorySlug',
      process.env.STOREFRONT_BUILD_CATEGORIES === '1'
        ? 'routes/category.prerender.tsx'
        : 'routes/category.tsx',
      { id: 'category' }
    ),
    route('*', 'routes/storefront-dynamic.tsx'),
  ]),
] satisfies RouteConfig;
