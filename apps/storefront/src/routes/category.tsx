import { useLoaderData, type ClientLoaderFunctionArgs } from 'react-router';
import { CategoryPage, loadCategoryPage } from '@credo/feature';
import { storefront } from '../app/storefront-runtime';
import { CatalogRouteError } from '../app/catalog-route-error';

export function clientLoader({
  params,
}: Pick<ClientLoaderFunctionArgs, 'params'>) {
  return loadCategoryPage(params.categorySlug);
}

export default function CategoryRoute() {
  const content = useLoaderData<typeof clientLoader>();
  return <CategoryPage content={content} theme={storefront.theme} />;
}

export function ErrorBoundary() {
  return <CatalogRouteError label="Categorie" />;
}
