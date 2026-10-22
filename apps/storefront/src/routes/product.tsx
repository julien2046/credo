import { useLoaderData, type ClientLoaderFunctionArgs } from 'react-router';
import { loadProductPage, ProductPage } from '@credo/feature';
import { storefront } from '../app/storefront-runtime';
import { CatalogRouteError } from '../app/catalog-route-error';

export function clientLoader({
  params,
}: Pick<ClientLoaderFunctionArgs, 'params'>) {
  return loadProductPage(params.productSlug);
}

export default function ProductRoute() {
  const content = useLoaderData<typeof clientLoader>();
  return <ProductPage content={content} theme={storefront.theme} />;
}

export function ErrorBoundary() {
  return <CatalogRouteError label="Produit" />;
}
