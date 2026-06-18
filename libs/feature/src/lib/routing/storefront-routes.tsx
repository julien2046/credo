import { useEffect, useState, type ReactNode } from 'react';
import { Link as RouterLink, Route, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { formatPrice, type StorefrontTheme } from '@credo/shared';
import { InsetPanel, SectionLead, StorefrontCard } from '@credo/ui';
import { AdminCatalog } from '../admin/admin-catalog';
import type { AuthState } from '../auth/auth.types';
import { AdminGuard } from './admin-guard';
import { RoutePlaceholder } from './route-placeholder';
import { ServerRoutePage } from './server-route-page';
import {
  getCategoryContentBySlug,
  getProductContentBySlug,
  getPromoContentBySlug,
  type StorefrontCategoryPageContent,
  type StorefrontProductContent,
} from './storefront-content';

type PublicPageProps = {
  theme: StorefrontTheme;
};

type AsyncContentState<TContent> =
  | { status: 'loading' }
  | { status: 'ready'; content: TContent | null }
  | { status: 'error'; message: string };

export type RenderStorefrontRoutesProps = {
  auth: AuthState;
  currency: string;
  signInNode: ReactNode;
  theme: StorefrontTheme;
};

function PublicLoadingCard({
  label,
  theme,
}: {
  label: string;
  theme: StorefrontTheme;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        backgroundColor: alpha(theme.surface, 0.86),
      }}
    >
      <CircularProgress size={20} />
      <Typography>{label}</Typography>
    </Paper>
  );
}

function ProductSummaryCard({
  product,
  theme,
}: {
  product: StorefrontProductContent;
  theme: StorefrontTheme;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2.5,
        borderColor: alpha(theme.accentColor, 0.14),
        backgroundColor: alpha(theme.surface, 0.9),
      }}
    >
      <Stack spacing={1.5}>
        {product.imageUrl ? (
          <Box
            component="img"
            src={product.imageUrl}
            alt={product.title}
            sx={{
              display: 'block',
              width: '100%',
              aspectRatio: '4 / 3',
              objectFit: 'cover',
              borderRadius: 2,
              border: `1px solid ${alpha(theme.accentColor, 0.1)}`,
            }}
          />
        ) : null}
        <Stack spacing={0.75}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {product.title}
          </Typography>
          <Typography sx={{ color: theme.mutedTextColor }}>
            {product.summary}
          </Typography>
        </Stack>
        <Stack
          direction="row"
          spacing={1}
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography sx={{ fontWeight: 800 }}>
            {formatPrice(product.price, product.currency)}
          </Typography>
          <Chip
            label={product.inStock ? 'En stock' : 'Rupture'}
            color={product.inStock ? 'primary' : 'default'}
            size="small"
          />
        </Stack>
        <Button
          component={RouterLink}
          to={`/p/${product.slug}`}
          variant="outlined"
        >
          Voir le produit
        </Button>
      </Stack>
    </Paper>
  );
}

/**
 * Page publique de categorie branchee sur le catalogue publie.
 */
function CategoryPage({ theme }: PublicPageProps) {
  const params = useParams();
  const [state, setState] = useState<
    AsyncContentState<StorefrontCategoryPageContent>
  >({ status: 'loading' });

  useEffect(() => {
    let active = true;

    setState({ status: 'loading' });

    void getCategoryContentBySlug(params.categorySlug)
      .then((content) => {
        if (active) setState({ status: 'ready', content });
      })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : 'Unable to load category';
        if (active) setState({ status: 'error', message });
      });

    return () => {
      active = false;
    };
  }, [params.categorySlug]);

  if (state.status === 'loading') {
    return (
      <PublicLoadingCard label="Chargement de la categorie..." theme={theme} />
    );
  }

  if (state.status === 'error') {
    return <Alert severity="error">{state.message}</Alert>;
  }

  if (!state.content) {
    return (
      <RoutePlaceholder
        title="Categorie introuvable"
        details={`Aucune categorie publiee pour /c/${
          params.categorySlug ?? ':categorySlug'
        }.`}
        theme={theme}
      />
    );
  }

  return (
    <StorefrontCard title={state.content.category.title} theme={theme}>
      <Stack spacing={3}>
        <SectionLead
          title={`/c/${state.content.category.slug}`}
          description={state.content.category.summary}
        />
        <Divider />

        {state.content.products.length === 0 ? (
          <InsetPanel theme={theme}>
            <Typography sx={{ color: theme.mutedTextColor }}>
              Aucun produit publie dans cette categorie pour le moment.
            </Typography>
          </InsetPanel>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))',
              },
            }}
          >
            {state.content.products.map((product) => (
              <ProductSummaryCard
                key={product.id}
                product={product}
                theme={theme}
              />
            ))}
          </Box>
        )}
      </Stack>
    </StorefrontCard>
  );
}

/**
 * Page publique de produit branchee sur le catalogue publie.
 */
function ProductPage({ theme }: PublicPageProps) {
  const params = useParams();
  const [state, setState] = useState<
    AsyncContentState<StorefrontProductContent>
  >({ status: 'loading' });

  useEffect(() => {
    let active = true;

    setState({ status: 'loading' });

    void getProductContentBySlug(params.productSlug)
      .then((content) => {
        if (active) setState({ status: 'ready', content });
      })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : 'Unable to load product';
        if (active) setState({ status: 'error', message });
      });

    return () => {
      active = false;
    };
  }, [params.productSlug]);

  if (state.status === 'loading') {
    return <PublicLoadingCard label="Chargement du produit..." theme={theme} />;
  }

  if (state.status === 'error') {
    return <Alert severity="error">{state.message}</Alert>;
  }

  if (!state.content) {
    return (
      <RoutePlaceholder
        title="Produit introuvable"
        details={`Aucun produit publie pour /p/${
          params.productSlug ?? ':productSlug'
        }.`}
        theme={theme}
      />
    );
  }

  return (
    <StorefrontCard title={state.content.title} theme={theme}>
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: '0.9fr 1.1fr' },
          alignItems: 'start',
        }}
      >
        <InsetPanel theme={theme} tint="accent">
          {state.content.imageUrl ? (
            <Box
              component="img"
              src={state.content.imageUrl}
              alt={state.content.title}
              sx={{
                display: 'block',
                width: '100%',
                aspectRatio: '4 / 3',
                objectFit: 'cover',
                borderRadius: 2,
                border: `1px solid ${alpha(theme.accentColor, 0.1)}`,
              }}
            />
          ) : (
            <Stack spacing={1.25}>
              <Typography variant="h6">Image produit</Typography>
              <Typography sx={{ color: theme.mutedTextColor }}>
                Aucune image n'est encore associee a ce produit.
              </Typography>
            </Stack>
          )}
        </InsetPanel>

        <Stack spacing={2.5}>
          <SectionLead
            title={`/p/${state.content.slug}`}
            description={state.content.summary}
          />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label={formatPrice(state.content.price, state.content.currency)}
              color="primary"
            />
            <Chip
              label={state.content.inStock ? 'En stock' : 'Rupture'}
              variant="outlined"
            />
            {state.content.categorySlug ? (
              <Chip
                component={RouterLink}
                to={`/c/${state.content.categorySlug}`}
                clickable
                label={`/c/${state.content.categorySlug}`}
                variant="outlined"
              />
            ) : null}
          </Stack>
          <Divider />
          <Button
            variant="contained"
            size="large"
            disabled={!state.content.inStock}
          >
            Ajouter au panier
          </Button>
        </Stack>
      </Box>
    </StorefrontCard>
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
