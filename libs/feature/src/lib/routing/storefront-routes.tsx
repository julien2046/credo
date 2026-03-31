import type { ReactNode } from 'react';
import { Route, useParams } from 'react-router-dom';
import type { StorefrontTheme } from '@credo/shared';
import { AdminCatalog } from '../admin/admin-catalog';
import type { AuthState } from '../auth/auth.types';
import { AdminGuard } from './admin-guard';
import { RoutePlaceholder } from './route-placeholder';
import { ServerRoutePage } from './server-route-page';
import {
  getCategoryContentBySlug,
  getProductContentBySlug,
  getPromoContentBySlug,
} from './storefront-content';

type PublicPageProps = {
  theme: StorefrontTheme;
};

export type RenderStorefrontRoutesProps = {
  auth: AuthState;
  currency: string;
  signInNode: ReactNode;
  theme: StorefrontTheme;
};

/**
 * Placeholder pour la route publique de catégorie.
 */
function CategoryPage({ theme }: PublicPageProps) {
  const params = useParams();
  const category = getCategoryContentBySlug(params.categorySlug);

  return (
    <RoutePlaceholder
      title={category?.title ?? 'Categorie'}
      details={
        category?.summary ??
        `Route publique /c/${params.categorySlug ?? ':categorySlug'}`
      }
      theme={theme}
    />
  );
}

/**
 * Placeholder pour la route publique de produit.
 */
function ProductPage({ theme }: PublicPageProps) {
  const params = useParams();
  const product = getProductContentBySlug(params.productSlug);

  return (
    <RoutePlaceholder
      title={product?.title ?? 'Produit'}
      details={
        product?.summary ??
        `Route publique /p/${params.productSlug ?? ':productSlug'}`
      }
      theme={theme}
    />
  );
}

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
 * Retourne l'ensemble des routes storefront injectables dans `<Routes>`.
 */
export function renderStorefrontRoutes({
  auth,
  currency,
  signInNode,
  theme,
}: RenderStorefrontRoutesProps) {
  return (
    <>
      <Route
        path="/"
        element={
          <RoutePlaceholder
            title="Home"
            details="Page vitrine publique qui pourra etre prerenderisee pour le SEO."
            theme={theme}
          />
        }
      />
      <Route path="/c/:categorySlug" element={<CategoryPage theme={theme} />} />
      <Route path="/p/:productSlug" element={<ProductPage theme={theme} />} />
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
            <RoutePlaceholder
              title="Admin Categories"
              details="Gestion des categories"
              theme={theme}
            />
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
        element={<ServerRoutePage pathLabel="/api/stripe/webhook" theme={theme} />}
      />
      <Route
        path="/api/ai/*"
        element={<ServerRoutePage pathLabel="/api/ai/*" theme={theme} />}
      />

      <Route
        path="*"
        element={
          <RoutePlaceholder title="404" details="Route inconnue" theme={theme} />
        }
      />
    </>
  );
}
