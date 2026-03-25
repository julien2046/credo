import type { ComponentType } from 'react';
import type { StorefrontTheme } from '@credo/shared';
import { Route, useParams } from 'react-router-dom';
import type { RoutePlaceholderProps } from './app.types';
import {
  getCategoryContentBySlug,
  getProductContentBySlug,
  getPromoContentBySlug,
} from './storefront-content';

type StorefrontPublicRoutesProps = {
  theme: StorefrontTheme;
  PlaceholderComponent: ComponentType<RoutePlaceholderProps>;
};

type PublicPageProps = {
  theme: StorefrontTheme;
  PlaceholderComponent: ComponentType<RoutePlaceholderProps>;
};

/**
 * Placeholder pour la route publique de categorie.
 */
function CategoryPage({ theme, PlaceholderComponent }: PublicPageProps) {
  const params = useParams();
  const category = getCategoryContentBySlug(params.categorySlug);

  return (
    <PlaceholderComponent
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
function ProductPage({ theme, PlaceholderComponent }: PublicPageProps) {
  const params = useParams();
  const product = getProductContentBySlug(params.productSlug);

  return (
    <PlaceholderComponent
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
function PromoPage({ theme, PlaceholderComponent }: PublicPageProps) {
  const params = useParams();
  const promo = getPromoContentBySlug(params.promoSlug);

  return (
    <PlaceholderComponent
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
 * Regroupe les routes publiques pour preparer un futur prerender.
 */
export function StorefrontPublicRoutes({
  theme,
  PlaceholderComponent,
}: StorefrontPublicRoutesProps) {
  return (
    <>
      <Route
        path="/"
        element={
          <PlaceholderComponent
            title="Home"
            details="Page vitrine publique qui pourra etre prerenderisee pour le SEO."
            theme={theme}
          />
        }
      />
      <Route
        path="/c/:categorySlug"
        element={
          <CategoryPage
            theme={theme}
            PlaceholderComponent={PlaceholderComponent}
          />
        }
      />
      <Route
        path="/p/:productSlug"
        element={
          <ProductPage
            theme={theme}
            PlaceholderComponent={PlaceholderComponent}
          />
        }
      />
      <Route
        path="/promo/:promoSlug"
        element={
          <PromoPage
            theme={theme}
            PlaceholderComponent={PlaceholderComponent}
          />
        }
      />
      <Route
        path="/cart"
        element={
          <PlaceholderComponent
            title="Panier"
            details="Panier public. A garder dynamique ou a prerenderiser selon le besoin."
            theme={theme}
          />
        }
      />
    </>
  );
}
