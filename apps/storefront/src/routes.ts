import type { RouteConfig } from '@react-router/dev/routes';
import { index, layout, route } from '@react-router/dev/routes';

export default [
  layout('routes/storefront-shell.tsx', [
    index('routes/home.tsx'),
    route('p/:productSlug', 'routes/product.tsx'),
    route('c/:categorySlug', 'routes/category.tsx'),
    route('*', 'routes/storefront-dynamic.tsx'),
  ]),
] satisfies RouteConfig;
