import type { RouteConfig } from '@react-router/dev/routes';
import { index, route } from '@react-router/dev/routes';

export default [
  index('routes/storefront-shell.tsx', { id: 'storefront-index' }),
  route('*', 'routes/storefront-shell.tsx', { id: 'storefront-catchall' }),
] satisfies RouteConfig;
