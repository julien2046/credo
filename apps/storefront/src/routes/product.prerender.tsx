import type { LoaderFunctionArgs } from 'react-router';
import { loadBuiltProduct } from '../app/catalog-build.server';
export { default, clientLoader, ErrorBoundary } from './product';

export function loader({ params }: LoaderFunctionArgs) {
  return loadBuiltProduct(params.productSlug);
}
