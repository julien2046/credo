import type { ComponentType } from 'react';
import type { StorefrontTheme } from '@credo/shared';
import { Route, useParams } from 'react-router-dom';
import type { RoutePlaceholderProps } from './app.types';

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

  return (
    <PlaceholderComponent
      title="Categorie"
      details={`Route publique /c/${params.categorySlug ?? ':categorySlug'}`}
      theme={theme}
    />
  );
}

/**
 * Placeholder pour la route publique de produit.
 */
function ProductPage({ theme, PlaceholderComponent }: PublicPageProps) {
  const params = useParams();

  return (
    <PlaceholderComponent
      title="Produit"
      details={`Route publique /p/${params.productSlug ?? ':productSlug'}`}
      theme={theme}
    />
  );
}

/**
 * Placeholder pour la route publique de promotion.
 */
function PromoPage({ theme, PlaceholderComponent }: PublicPageProps) {
  const params = useParams();

  return (
    <PlaceholderComponent
      title="Promo"
      details={`Route publique /promo/${params.promoSlug ?? ':promoSlug'}`}
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
            details="Route publique /"
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
            details="Route publique /cart"
            theme={theme}
          />
        }
      />
    </>
  );
}
