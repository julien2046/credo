import type { ReactNode } from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import { resolveStorefrontBootstrap } from './app/storefront-bootstrap';
import { privatePageMeta } from './app/seo/catalog-seo';

const { clientConfig } = resolveStorefrontBootstrap();

export function meta() {
  return privatePageMeta(clientConfig.brandName);
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang={clientConfig.locale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}

export function HydrateFallback() {
  return <p role="status">Chargement de la boutique...</p>;
}
