import { Controller } from 'react-hook-form';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { formatPrice, type StorefrontTheme } from '@credo/shared';
import { InsetPanel, SectionLead, StorefrontCard } from '@credo/ui';
import { useAdminCatalog } from './catalog/use-admin-catalog';

export type AdminCatalogProps = {
  theme: StorefrontTheme;
  currency: string;
};

/**
 * Backoffice catalogue v1 avec organisations, categories et produits publiables.
 */
export function AdminCatalog({ theme, currency }: AdminCatalogProps) {
  const {
    actionId,
    cancelCategoryEdit,
    cancelProductEdit,
    categories,
    categoriesById,
    categoryControl,
    categoryFormErrors,
    editCategoryControl,
    editCategoryFormErrors,
    editProductCategories,
    editProductControl,
    editProductFormErrors,
    editingCategory,
    editingProduct,
    error,
    handleCategoryDelete,
    handleCategoryEditSubmit,
    handleCategoryFormSubmit,
    handleCategorySubmit,
    handleEditCategoryFormSubmit,
    handleEditProductFormSubmit,
    handleOrganizationSubmit,
    handleProductDelete,
    handleProductEditSubmit,
    handleProductFormSubmit,
    handleProductSubmit,
    handleProductUpdate,
    isCategorySubmitting,
    isEditCategorySubmitting,
    isEditProductSubmitting,
    isProductSubmitting,
    loading,
    organizationName,
    organizationSlug,
    organizations,
    organizationsById,
    productCategories,
    productControl,
    productFormErrors,
    products,
    registerCategory,
    registerEditCategory,
    registerEditProduct,
    registerProduct,
    selectedCategoryOrganizationId,
    selectedProductCategoryId,
    selectedProductOrganizationId,
    setOrganizationName,
    setOrganizationSlug,
    startCategoryEdit,
    startProductEdit,
  } = useAdminCatalog({ currency });

  return (
    <Stack spacing={3}>
      <StorefrontCard title="Catalogue admin" theme={theme}>
        <Stack spacing={3}>
          <SectionLead
            title="Catalogue v1"
            description="Cree les boutiques, categories et produits publiables qui alimenteront les pages publiques et le futur prerender SEO."
          />

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label={`${organizations.length} organisation(s)`}
              variant="outlined"
            />
            <Chip
              label={`${categories.length} categorie(s)`}
              variant="outlined"
            />
            <Chip label={`${products.length} produit(s)`} variant="outlined" />
            <Chip label={currency} color="primary" />
            <Chip label={theme.name} variant="outlined" />
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', xl: 'repeat(3, 1fr)' },
            }}
          >
            <InsetPanel theme={theme} tint="accent">
              <Stack spacing={2.5}>
                <SectionLead
                  title="Ajouter une organisation"
                  description="Cree la boutique racine avec un slug stable."
                />
                <Box
                  component="form"
                  onSubmit={handleOrganizationSubmit}
                  sx={{ display: 'grid', gap: 2 }}
                >
                  <TextField
                    label="Nom de l'organisation"
                    value={organizationName}
                    onChange={(event) =>
                      setOrganizationName(event.currentTarget.value)
                    }
                    fullWidth
                  />
                  <TextField
                    label="Slug"
                    value={organizationSlug}
                    onChange={(event) =>
                      setOrganizationSlug(event.currentTarget.value)
                    }
                    placeholder="ma-boutique"
                    helperText="Laisse vide pour le generer depuis le nom."
                    fullWidth
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    sx={{
                      py: 1.3,
                      fontFamily: theme.accentFontFamily,
                      fontWeight: 700,
                    }}
                  >
                    Creer l'organisation
                  </Button>
                </Box>
              </Stack>
            </InsetPanel>

            <InsetPanel theme={theme}>
              <Stack spacing={2.5}>
                <SectionLead
                  title="Ajouter une categorie"
                  description="Les categories creent les futures routes publiques /c/:categorySlug."
                />
                <Box
                  component="form"
                  onSubmit={handleCategoryFormSubmit(handleCategorySubmit)}
                  sx={{ display: 'grid', gap: 2 }}
                >
                  <TextField
                    label="Nom de la categorie"
                    {...registerCategory('name', {
                      required: 'Le nom de la categorie est requis.',
                    })}
                    error={Boolean(categoryFormErrors.name)}
                    helperText={categoryFormErrors.name?.message}
                    fullWidth
                  />
                  <TextField
                    label="Slug"
                    {...registerCategory('slug')}
                    placeholder="nouveautes"
                    helperText="Laisse vide pour le generer depuis le nom."
                    fullWidth
                  />
                  <TextField
                    label="Description"
                    {...registerCategory('description')}
                    multiline
                    minRows={2}
                    fullWidth
                  />
                  <Controller
                    name="organizationId"
                    control={categoryControl}
                    rules={{
                      required: 'Choisis une organisation.',
                    }}
                    render={({ field }) => (
                      <TextField
                        select
                        label="Organisation"
                        helperText={
                          categoryFormErrors.organizationId?.message ??
                          (organizations.length === 0
                            ? "Cree d'abord une organisation."
                            : 'La categorie sera rattachee a cette boutique.')
                        }
                        error={Boolean(categoryFormErrors.organizationId)}
                        fullWidth
                        {...field}
                      >
                        <MenuItem value="">Choisir une organisation</MenuItem>
                        {organizations.map((organization) => (
                          <MenuItem
                            key={organization.id}
                            value={organization.id}
                          >
                            {organization.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={
                      isCategorySubmitting ||
                      !selectedCategoryOrganizationId ||
                      organizations.length === 0
                    }
                    variant="contained"
                    size="large"
                    sx={{
                      py: 1.3,
                      fontFamily: theme.accentFontFamily,
                      fontWeight: 700,
                    }}
                  >
                    {isCategorySubmitting
                      ? 'Creation...'
                      : 'Creer la categorie'}
                  </Button>
                </Box>
              </Stack>
            </InsetPanel>

            <InsetPanel theme={theme}>
              <Stack spacing={2.5}>
                <SectionLead
                  title="Ajouter un produit"
                  description="Produit publiable avec slug, categorie, image et donnees utiles au SEO."
                />
                <Box
                  component="form"
                  onSubmit={handleProductFormSubmit(handleProductSubmit)}
                  sx={{ display: 'grid', gap: 2 }}
                >
                  <TextField
                    label="Nom du produit"
                    {...registerProduct('name', {
                      required: 'Le nom du produit est requis.',
                    })}
                    error={Boolean(productFormErrors.name)}
                    helperText={productFormErrors.name?.message}
                    fullWidth
                  />
                  <TextField
                    label="Slug"
                    {...registerProduct('slug')}
                    placeholder="produit-vedette"
                    helperText="Laisse vide pour le generer depuis le nom."
                    fullWidth
                  />
                  <TextField
                    label="Description"
                    {...registerProduct('description')}
                    multiline
                    minRows={3}
                    fullWidth
                  />
                  <TextField
                    label="Image URL"
                    {...registerProduct('imageUrl')}
                    placeholder="https://..."
                    fullWidth
                  />
                  <TextField
                    label="Prix"
                    type="number"
                    inputProps={{ min: 0, step: 0.01 }}
                    {...registerProduct('price', {
                      required: 'Le prix est requis.',
                      validate: (value) => {
                        const numericPrice = Number(value);

                        if (!Number.isFinite(numericPrice)) {
                          return 'Le prix doit etre un nombre.';
                        }

                        if (numericPrice < 0) {
                          return 'Le prix doit etre positif.';
                        }

                        return true;
                      },
                    })}
                    error={Boolean(productFormErrors.price)}
                    helperText={productFormErrors.price?.message}
                    fullWidth
                  />
                  <Controller
                    name="organizationId"
                    control={productControl}
                    rules={{
                      required: 'Choisis une organisation.',
                    }}
                    render={({ field }) => (
                      <TextField
                        select
                        label="Organisation"
                        helperText={
                          productFormErrors.organizationId?.message ??
                          (organizations.length === 0
                            ? "Cree d'abord une organisation."
                            : 'Filtre les categories disponibles.')
                        }
                        error={Boolean(productFormErrors.organizationId)}
                        fullWidth
                        {...field}
                      >
                        <MenuItem value="">Choisir une organisation</MenuItem>
                        {organizations.map((organization) => (
                          <MenuItem
                            key={organization.id}
                            value={organization.id}
                          >
                            {organization.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                  <Controller
                    name="categoryId"
                    control={productControl}
                    rules={{
                      required: 'Choisis une categorie.',
                    }}
                    render={({ field }) => (
                      <TextField
                        select
                        label="Categorie"
                        helperText={
                          productFormErrors.categoryId?.message ??
                          (productCategories.length === 0
                            ? "Cree d'abord une categorie pour cette boutique."
                            : 'La route categorie utilisera son slug.')
                        }
                        error={Boolean(productFormErrors.categoryId)}
                        fullWidth
                        {...field}
                      >
                        <MenuItem value="">Choisir une categorie</MenuItem>
                        {productCategories.map((category) => (
                          <MenuItem key={category.id} value={category.id}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                  <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                    <Controller
                      name="inStock"
                      control={productControl}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Switch
                              checked={field.value}
                              onChange={(_, checked) => field.onChange(checked)}
                            />
                          }
                          label="En stock"
                        />
                      )}
                    />
                    <Controller
                      name="published"
                      control={productControl}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Switch
                              checked={field.value}
                              onChange={(_, checked) => field.onChange(checked)}
                            />
                          }
                          label="Publie"
                        />
                      )}
                    />
                  </Stack>
                  <Button
                    type="submit"
                    disabled={
                      isProductSubmitting ||
                      !selectedProductOrganizationId ||
                      !selectedProductCategoryId ||
                      productCategories.length === 0
                    }
                    variant="contained"
                    size="large"
                    sx={{
                      py: 1.3,
                      fontFamily: theme.accentFontFamily,
                      fontWeight: 700,
                    }}
                  >
                    {isProductSubmitting ? 'Creation...' : 'Creer le produit'}
                  </Button>
                </Box>
              </Stack>
            </InsetPanel>
          </Box>
        </Stack>
      </StorefrontCard>

      {loading ? (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <CircularProgress size={20} />
          <Typography>Chargement des donnees...</Typography>
        </Paper>
      ) : null}

      {error ? <Alert severity="error">{error}</Alert> : null}

      {editingCategory ? (
        <StorefrontCard title="Modifier la categorie" theme={theme}>
          <Stack spacing={2.5}>
            <SectionLead
              title={editingCategory.name ?? 'Categorie'}
              description="Mets a jour le nom, le slug, la description ou le rattachement boutique."
            />
            <Box
              component="form"
              onSubmit={handleEditCategoryFormSubmit(handleCategoryEditSubmit)}
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              }}
            >
              <TextField
                label="Nom de la categorie"
                {...registerEditCategory('name', {
                  required: 'Le nom de la categorie est requis.',
                })}
                error={Boolean(editCategoryFormErrors.name)}
                helperText={editCategoryFormErrors.name?.message}
                fullWidth
              />
              <TextField
                label="Slug"
                {...registerEditCategory('slug')}
                helperText="Laisse vide pour le regénérer depuis le nom."
                fullWidth
              />
              <TextField
                label="Description"
                {...registerEditCategory('description')}
                multiline
                minRows={2}
                fullWidth
              />
              <Controller
                name="organizationId"
                control={editCategoryControl}
                rules={{
                  required: 'Choisis une organisation.',
                }}
                render={({ field }) => (
                  <TextField
                    select
                    label="Organisation"
                    helperText={editCategoryFormErrors.organizationId?.message}
                    error={Boolean(editCategoryFormErrors.organizationId)}
                    fullWidth
                    {...field}
                  >
                    <MenuItem value="">Choisir une organisation</MenuItem>
                    {organizations.map((organization) => (
                      <MenuItem key={organization.id} value={organization.id}>
                        {organization.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={
                    isEditCategorySubmitting ||
                    actionId === `category:${editingCategory.id}`
                  }
                >
                  Enregistrer
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={cancelCategoryEdit}
                >
                  Annuler
                </Button>
              </Stack>
            </Box>
          </Stack>
        </StorefrontCard>
      ) : null}

      {editingProduct ? (
        <StorefrontCard title="Modifier le produit" theme={theme}>
          <Stack spacing={2.5}>
            <SectionLead
              title={editingProduct.name ?? 'Produit'}
              description="Mets a jour les donnees catalogue, SEO, stock et publication."
            />
            <Box
              component="form"
              onSubmit={handleEditProductFormSubmit(handleProductEditSubmit)}
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              }}
            >
              <TextField
                label="Nom du produit"
                {...registerEditProduct('name', {
                  required: 'Le nom du produit est requis.',
                })}
                error={Boolean(editProductFormErrors.name)}
                helperText={editProductFormErrors.name?.message}
                fullWidth
              />
              <TextField
                label="Slug"
                {...registerEditProduct('slug')}
                helperText="Laisse vide pour le regénérer depuis le nom."
                fullWidth
              />
              <TextField
                label="Description"
                {...registerEditProduct('description')}
                multiline
                minRows={3}
                fullWidth
              />
              <TextField
                label="Image URL"
                {...registerEditProduct('imageUrl')}
                fullWidth
              />
              <TextField
                label="Prix"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                {...registerEditProduct('price', {
                  required: 'Le prix est requis.',
                  validate: (value) => {
                    const numericPrice = Number(value);

                    if (!Number.isFinite(numericPrice)) {
                      return 'Le prix doit etre un nombre.';
                    }

                    if (numericPrice < 0) {
                      return 'Le prix doit etre positif.';
                    }

                    return true;
                  },
                })}
                error={Boolean(editProductFormErrors.price)}
                helperText={editProductFormErrors.price?.message}
                fullWidth
              />
              <Controller
                name="organizationId"
                control={editProductControl}
                rules={{
                  required: 'Choisis une organisation.',
                }}
                render={({ field }) => (
                  <TextField
                    select
                    label="Organisation"
                    helperText={editProductFormErrors.organizationId?.message}
                    error={Boolean(editProductFormErrors.organizationId)}
                    fullWidth
                    {...field}
                  >
                    <MenuItem value="">Choisir une organisation</MenuItem>
                    {organizations.map((organization) => (
                      <MenuItem key={organization.id} value={organization.id}>
                        {organization.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Controller
                name="categoryId"
                control={editProductControl}
                rules={{
                  required: 'Choisis une categorie.',
                }}
                render={({ field }) => (
                  <TextField
                    select
                    label="Categorie"
                    helperText={
                      editProductFormErrors.categoryId?.message ??
                      (editProductCategories.length === 0
                        ? "Cree d'abord une categorie pour cette boutique."
                        : 'La route categorie utilisera son slug.')
                    }
                    error={Boolean(editProductFormErrors.categoryId)}
                    fullWidth
                    {...field}
                  >
                    <MenuItem value="">Choisir une categorie</MenuItem>
                    {editProductCategories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <Controller
                  name="inStock"
                  control={editProductControl}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(_, checked) => field.onChange(checked)}
                        />
                      }
                      label="En stock"
                    />
                  )}
                />
                <Controller
                  name="published"
                  control={editProductControl}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(_, checked) => field.onChange(checked)}
                        />
                      }
                      label="Publie"
                    />
                  )}
                />
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={
                    isEditProductSubmitting ||
                    actionId === `product:${editingProduct.id}` ||
                    editProductCategories.length === 0
                  }
                >
                  Enregistrer
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={cancelProductEdit}
                >
                  Annuler
                </Button>
              </Stack>
            </Box>
          </Stack>
        </StorefrontCard>
      ) : null}

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
              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  border: `1px dashed ${alpha(theme.accentColor, 0.16)}`,
                  backgroundColor: alpha(theme.surface, 0.7),
                }}
              >
                <Typography sx={{ color: theme.mutedTextColor }}>
                  Aucune organisation pour le moment.
                </Typography>
              </Paper>
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
              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  border: `1px dashed ${alpha(theme.accentColor, 0.16)}`,
                  backgroundColor: alpha(theme.surface, 0.7),
                }}
              >
                <Typography sx={{ color: theme.mutedTextColor }}>
                  Aucune categorie pour le moment.
                </Typography>
              </Paper>
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
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 700 }}
                        >
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
                          onClick={() => startCategoryEdit(category)}
                        >
                          Modifier
                        </Button>
                        <Button
                          color="error"
                          variant="outlined"
                          disabled={categoryHasProducts || isBusy}
                          onClick={() => void handleCategoryDelete(category)}
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
              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  border: `1px dashed ${alpha(theme.accentColor, 0.16)}`,
                  backgroundColor: alpha(theme.surface, 0.7),
                }}
              >
                <Typography sx={{ color: theme.mutedTextColor }}>
                  Aucun produit pour le moment.
                </Typography>
              </Paper>
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
                          onClick={() => startProductEdit(product)}
                        >
                          Modifier
                        </Button>
                        <Button
                          variant="outlined"
                          disabled={isBusy}
                          onClick={() =>
                            void handleProductUpdate(product, {
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
                            void handleProductUpdate(product, {
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
                          onClick={() => void handleProductDelete(product)}
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
    </Stack>
  );
}
