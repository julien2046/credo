import type { LoaderFunctionArgs } from 'react-router';
import { loadBuiltCategory } from '../app/catalog-build.server';
export { default, clientLoader, ErrorBoundary, meta } from './category';

export function loader({ params }: LoaderFunctionArgs) {
  return loadBuiltCategory(params.categorySlug);
}
