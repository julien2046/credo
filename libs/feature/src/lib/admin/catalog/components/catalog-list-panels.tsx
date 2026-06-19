import {
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { Category, Organization, Product } from '@credo/data-access';
import { formatPrice, type StorefrontTheme } from '@credo/shared';
import { SectionLead, StorefrontCard } from '@credo/ui';

type CatalogListPanelsProps = {
  actionId: string | null;
  categories: Category[];
  categoriesById: Map<string, Category>;
  currency: string;
  loading: boolean;
  onCategoryDelete: (category: Category) => Promise<void>;
  onCategoryEdit: (category: Category) => void;
  onProductDelete: (product: Product) => Promise<void>;
  onProductEdit: (product: Product) => void;
  onProductUpdate: (
    product: Product,
    patch: Partial<Pick<Product, 'inStock' | 'published'>>
  ) => Promise<void>;
  organizations: Organization[];
  organizationsById: Map<string, Organization>;
  products: Product[];
  theme: StorefrontTheme;
};

type EmptyStateProps = {
  children: string;
  theme: StorefrontTheme;
};

function EmptyState({ children, theme }: EmptyStateProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 2.5,
        border: `1px dashed ${alpha(theme.accentColor, 0.16)}`,
        backgroundColor: alpha(theme.surface, 0.7),
      }}
    >
      <Typography sx={{ color: theme.mutedTextColor }}>{children}</Typography>
    </Paper>
  );
}

/** Listes de lecture et actions rapides du catalogue admin. */
export function CatalogListPanels({
  actionId,
  categories,
  categoriesById,
  currency,
  loading,
  onCategoryDelete,
  onCategoryEdit,
  onProductDelete,
  onProductEdit,
  onProductUpdate,
  organizations,
  organizationsById,
  products,
  theme,
}: CatalogListPanelsProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 3,
        gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' },
      }}
    >
      <StorefrontCard title="Organisations stockees" theme={theme}>
        <Stack spacing={2}>
          <SectionLead
            title="Boutiques racines"
            description="Chaque organisation porte les categories et produits d'une boutique."
          />
          <Divider />
          {!loading && organizations.length === 0 ? (
            <EmptyState theme={theme}>
              Aucune organisation pour le moment.
            </EmptyState>
          ) : null}
          <Stack spacing={1.5}>
            {organizations.map((organization) => (
              <Paper
                key={organization.id}
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  backgroundColor: alpha(theme.surface, 0.86),
                }}
              >
                <Stack spacing={1.25}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {organization.name ?? 'Organisation sans nom'}
                  </Typography>
                  <Typography sx={{ color: theme.mutedTextColor }}>
                    /{organization.slug ?? 'slug-manquant'}
                  </Typography>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Stack>
      </StorefrontCard>

      <StorefrontCard title="Categories stockees" theme={theme}>
        <Stack spacing={2}>
          <SectionLead
            title="Routes categorie"
            description="Les slugs alimenteront les pages publiques /c/:categorySlug."
          />
          <Divider />
          {!loading && categories.length === 0 ? (
            <EmptyState theme={theme}>
              Aucune categorie pour le moment.
            </EmptyState>
          ) : null}
          <Stack spacing={1.5}>
            {categories.map((category) => {
              const organization = category.organizationId
                ? organizationsById.get(category.organizationId)
                : undefined;
              const categoryHasProducts = products.some(
                (product) => product.categoryId === category.id
              );
              const isBusy = actionId === `category:${category.id}`;

              return (
                <Paper
                  key={category.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    backgroundColor: alpha(theme.surface, 0.86),
                  }}
                >
                  <Stack spacing={1.25}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1.5}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {category.name ?? 'Categorie sans nom'}
                      </Typography>
                      <Chip label="/c" variant="outlined" size="small" />
                    </Stack>
                    <Typography sx={{ color: theme.mutedTextColor }}>
                      /c/{category.slug ?? 'slug-manquant'}
                      {organization ? ` · ${organization.name}` : ''}
                    </Typography>
                    {category.description ? (
                      <Typography sx={{ color: theme.mutedTextColor }}>
                        {category.description}
                      </Typography>
                    ) : null}
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Button
                        variant="outlined"
                        disabled={isBusy}
                        onClick={() => onCategoryEdit(category)}
                      >
                        Modifier
                      </Button>
                      <Button
                        color="error"
                        variant="outlined"
                        disabled={categoryHasProducts || isBusy}
                        onClick={() => void onCategoryDelete(category)}
                      >
                        {isBusy ? 'Suppression...' : 'Supprimer'}
                      </Button>
                    </Stack>
                    {categoryHasProducts ? (
                      <Typography
                        variant="caption"
                        sx={{ color: theme.mutedTextColor }}
                      >
                        Supprime ou deplace les produits avant de supprimer la
                        categorie.
                      </Typography>
                    ) : null}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        </Stack>
      </StorefrontCard>

      <StorefrontCard title="Produits stockes" theme={theme}>
        <Stack spacing={2}>
          <SectionLead
            title="Catalogue courant"
            description="Les produits publies seront visibles sur les pages publiques."
          />
          <Divider />
          {!loading && products.length === 0 ? (
            <EmptyState theme={theme}>Aucun produit pour le moment.</EmptyState>
          ) : null}
          <Stack spacing={1.5}>
            {products.map((product) => {
              const organization = product.organizationId
                ? organizationsById.get(product.organizationId)
                : undefined;
              const category = product.categoryId
                ? categoriesById.get(product.categoryId)
                : undefined;
              const isBusy = actionId === `product:${product.id}`;

              return (
                <Paper
                  key={product.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    backgroundColor: alpha(theme.surface, 0.86),
                  }}
                >
                  <Stack spacing={1.25}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1.5}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                    >
                      <Box>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 700 }}
                        >
                          {product.name ?? 'Produit sans nom'}
                        </Typography>
                        <Typography sx={{ color: theme.mutedTextColor }}>
                          {formatPrice(
                            product.price,
                            product.currency ?? currency
                          )}
                          {organization ? ` · ${organization.name}` : ''}
                        </Typography>
                      </Box>
                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        <Chip
                          label={product.published ? 'Publie' : 'Brouillon'}
                          color={product.published ? 'primary' : 'default'}
                          size="small"
                        />
                        <Chip
                          label={
                            product.inStock === false ? 'Rupture' : 'En stock'
                          }
                          variant="outlined"
                          size="small"
                        />
                      </Stack>
                    </Stack>
                    <Typography sx={{ color: theme.mutedTextColor }}>
                      /p/{product.slug ?? 'slug-manquant'}
                      {category ? ` · /c/${category.slug}` : ''}
                    </Typography>
                    {product.imageUrl ? (
                      <Typography sx={{ color: theme.mutedTextColor }}>
                        Image: {product.imageUrl}
                      </Typography>
                    ) : null}
                    {product.description ? (
                      <Typography sx={{ color: theme.mutedTextColor }}>
                        {product.description}
                      </Typography>
                    ) : null}
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Button
                        variant="outlined"
                        disabled={isBusy}
                        onClick={() => onProductEdit(product)}
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="outlined"
                        disabled={isBusy}
                        onClick={() =>
                          void onProductUpdate(product, {
                            published: !product.published,
                          })
                        }
                      >
                        {product.published ? 'Depublier' : 'Publier'}
                      </Button>
                      <Button
                        variant="outlined"
                        disabled={isBusy}
                        onClick={() =>
                          void onProductUpdate(product, {
                            inStock: product.inStock === false,
                          })
                        }
                      >
                        {product.inStock === false
                          ? 'Remettre en stock'
                          : 'Marquer rupture'}
                      </Button>
                      <Button
                        color="error"
                        variant="outlined"
                        disabled={isBusy}
                        onClick={() => void onProductDelete(product)}
                      >
                        {isBusy ? 'Action...' : 'Supprimer'}
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        </Stack>
      </StorefrontCard>
    </Box>
  );
}
