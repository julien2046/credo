import { useLoaderData, type ClientLoaderFunctionArgs } from 'react-router';
import { loadProductPage, ProductPage } from '@credo/feature';
import { storefront } from '../app/storefront-runtime';
import { CatalogRouteError } from '../app/catalog-route-error';
import type { MetaFunction } from 'react-router';
import { productMeta } from '../app/seo/catalog-seo';
import { storefrontSeo } from '../app/seo/storefront-seo';

export const meta: MetaFunction<typeof clientLoader> = ({ loaderData, error }) =>
  productMeta(
    error ? undefined : loaderData,
    storefront.clientConfig.brandName,
    storefrontSeo
  );

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
