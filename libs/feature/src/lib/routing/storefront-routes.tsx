import type { ReactNode } from 'react';
import { Route, useParams } from 'react-router';
import type { StorefrontTheme } from '@credo/shared';
import { AdminCatalog } from '../admin/admin-catalog';
import type { AuthState } from '../auth/auth.types';
import { AdminGuard } from './admin-guard';
import { RoutePlaceholder } from './route-placeholder';
import { ServerRoutePage } from './server-route-page';
import { getPromoContentBySlug } from './storefront-content';

type PublicPageProps = { theme: StorefrontTheme };

export type RenderStorefrontRoutesProps = {
  auth: AuthState;
  currency: string;
  signInNode: ReactNode;
  theme: StorefrontTheme;
};

/**
 * Placeholder pour la route publique de promotion.
 */
function PromoPage({ theme }: PublicPageProps) {
  const params = useParams();
  const promo = getPromoContentBySlug(params.promoSlug);

  return (
    <RoutePlaceholder
      title={promo?.title ?? 'Promo'}
      details={
        promo?.summary ??
        `Route publique /promo/${params.promoSlug ?? ':promoSlug'}`
      }
      theme={theme}
    />
  );
}

/**
 * Routes dynamiques restantes, montees sous la route Framework `*`.
 */
export function renderStorefrontRoutes({
  auth,
  currency,
  signInNode,
  theme,
}: RenderStorefrontRoutesProps) {
  return (
    <>
      <Route path="/promo/:promoSlug" element={<PromoPage theme={theme} />} />
      <Route
        path="/cart"
        element={
          <RoutePlaceholder
            title="Panier"
            details="Panier public. A garder dynamique ou a prerenderiser selon le besoin."
            theme={theme}
          />
        }
      />

      <Route
        path="/admin"
        element={
          <AdminGuard auth={auth} theme={theme} signInNode={signInNode}>
            <RoutePlaceholder
              title="Admin"
              details="Backoffice principal"
              theme={theme}
            />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/products"
        element={
          <AdminGuard auth={auth} theme={theme} signInNode={signInNode}>
            <AdminCatalog theme={theme} currency={currency} />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <AdminGuard auth={auth} theme={theme} signInNode={signInNode}>
            <AdminCatalog theme={theme} currency={currency} />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/promos"
        element={
          <AdminGuard auth={auth} theme={theme} signInNode={signInNode}>
            <RoutePlaceholder
              title="Admin Promos"
              details="Gestion des promotions"
              theme={theme}
            />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/newsletters"
        element={
          <AdminGuard auth={auth} theme={theme} signInNode={signInNode}>
            <RoutePlaceholder
              title="Admin Newsletters"
              details="Gestion newsletter"
              theme={theme}
            />
          </AdminGuard>
        }
      />

      <Route
        path="/api/stripe/webhook"
        element={
          <ServerRoutePage pathLabel="/api/stripe/webhook" theme={theme} />
        }
      />
      <Route
        path="/api/ai/*"
        element={<ServerRoutePage pathLabel="/api/ai/*" theme={theme} />}
      />

      <Route
        path="*"
        element={
          <RoutePlaceholder
            title="404"
            details="Route inconnue"
            theme={theme}
          />
        }
      />
    </>
  );
}
