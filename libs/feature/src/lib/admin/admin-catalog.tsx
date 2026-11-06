import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import type { StorefrontTheme } from '@credo/shared';
import { useState } from 'react';
import {
  CategoryCreateForm,
  OrganizationCreateForm,
  ProductCreateForm,
} from './catalog/components/catalog-create-forms';
import {
  CategoryEditForm,
  ProductEditForm,
} from './catalog/components/catalog-edit-forms';
import { CatalogListPanels } from './catalog/components/catalog-list-panels';
import { useAdminCatalog } from './catalog/use-admin-catalog';

export type AdminCatalogProps = {
  theme: StorefrontTheme;
  currency: string;
  section: 'products' | 'categories';
};

/**
 * Assemble le backoffice catalogue avec les donnees et actions du hook metier.
 */
export function AdminCatalog({ theme, currency, section }: AdminCatalogProps) {
  const [form, setForm] = useState<'item' | 'organization' | null>(null);
  const isProducts = section === 'products';
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
    editProductImageFileName,
    editProductImageUploadProgress,
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
    handleEditProductImageFileChange,
    handleProductImageFileChange,
    handleProductSubmit,
    handleProductUpdate,
    isCategorySubmitting,
    isEditCategorySubmitting,
    isEditProductSubmitting,
    isOrganizationSubmitting,
    isProductSubmitting,
    loading,
    organizationName,
    organizationSlug,
    organizations,
    organizationsById,
    productCategories,
    productControl,
    productFormErrors,
    productImageFileName,
    productImageUploadProgress,
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
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="overline" color="text.secondary">Catalogue</Typography>
          <Typography component="h1" variant="h4">{isProducts ? 'Produits' : 'Catégories'}</Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" aria-expanded={form === 'organization'} onClick={() => setForm(form === 'organization' ? null : 'organization')}>Ajouter une boutique</Button>
          <Button variant="contained" aria-expanded={form === 'item'} onClick={() => setForm(form === 'item' ? null : 'item')}>
            {isProducts ? 'Ajouter un produit' : 'Ajouter une catégorie'}
          </Button>
        </Stack>
      </Stack>
      {form === 'organization' && (
            <OrganizationCreateForm
              name={organizationName}
              isSubmitting={isOrganizationSubmitting}
              onNameChange={setOrganizationName}
              onSlugChange={setOrganizationSlug}
              onSubmit={handleOrganizationSubmit}
              slug={organizationSlug}
              theme={theme}
            />
      )}
      {form === 'item' && !isProducts && (
            <CategoryCreateForm
              control={categoryControl}
              errors={categoryFormErrors}
              isSubmitting={isCategorySubmitting}
              onSubmit={handleCategoryFormSubmit(handleCategorySubmit)}
              organizations={organizations}
              register={registerCategory}
              selectedOrganizationId={selectedCategoryOrganizationId}
              theme={theme}
            />
      )}
      {form === 'item' && isProducts && (
            <ProductCreateForm
              categories={productCategories}
              control={productControl}
              errors={productFormErrors}
              imageFileName={productImageFileName}
              imageUploadProgress={productImageUploadProgress}
              isSubmitting={isProductSubmitting}
              onImageFileChange={handleProductImageFileChange}
              onSubmit={handleProductFormSubmit(handleProductSubmit)}
              organizations={organizations}
              register={registerProduct}
              selectedCategoryId={selectedProductCategoryId}
              selectedOrganizationId={selectedProductOrganizationId}
              theme={theme}
            />
      )}

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
        <CategoryEditForm
          actionId={actionId}
          control={editCategoryControl}
          editingCategory={editingCategory}
          errors={editCategoryFormErrors}
          isSubmitting={isEditCategorySubmitting}
          onCancel={cancelCategoryEdit}
          onSubmit={handleEditCategoryFormSubmit(handleCategoryEditSubmit)}
          organizations={organizations}
          register={registerEditCategory}
          theme={theme}
        />
      ) : null}

      {editingProduct ? (
        <ProductEditForm
          actionId={actionId}
          categories={editProductCategories}
          control={editProductControl}
          editingProduct={editingProduct}
          errors={editProductFormErrors}
          imageFileName={editProductImageFileName}
          imageUploadProgress={editProductImageUploadProgress}
          isSubmitting={isEditProductSubmitting}
          onCancel={cancelProductEdit}
          onImageFileChange={handleEditProductImageFileChange}
          onSubmit={handleEditProductFormSubmit(handleProductEditSubmit)}
          organizations={organizations}
          register={registerEditProduct}
          theme={theme}
        />
      ) : null}

      <CatalogListPanels
        section={section}
        actionId={actionId}
        categories={categories}
        categoriesById={categoriesById}
        currency={currency}
        loading={loading}
        onCategoryDelete={handleCategoryDelete}
        onCategoryEdit={startCategoryEdit}
        onProductDelete={handleProductDelete}
        onProductEdit={startProductEdit}
        onProductUpdate={handleProductUpdate}
        organizations={organizations}
        organizationsById={organizationsById}
        products={products}
        theme={theme}
      />
    </Stack>
  );
}
