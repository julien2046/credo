import type { FormEventHandler } from 'react';
import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import { Box, Button, Stack } from '@mui/material';
import type { Category, Organization, Product } from '@credo/data-access';
import type { StorefrontTheme } from '@credo/shared';
import { SectionLead, StorefrontCard } from '@credo/ui';
import type {
  CategoryFormValues,
  ProductFormValues,
} from '../use-admin-catalog';
import { CategoryFormFields, ProductFormFields } from './catalog-form-fields';

type CategoryEditFormProps = {
  actionId: string | null;
  control: Control<CategoryFormValues>;
  editingCategory: Category;
  errors: FieldErrors<CategoryFormValues>;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  organizations: Organization[];
  register: UseFormRegister<CategoryFormValues>;
  theme: StorefrontTheme;
};

export function CategoryEditForm({
  actionId,
  control,
  editingCategory,
  errors,
  isSubmitting,
  onCancel,
  onSubmit,
  organizations,
  register,
  theme,
}: CategoryEditFormProps) {
  return (
    <StorefrontCard title="Modifier la categorie" theme={theme}>
      <Stack spacing={2.5}>
        <SectionLead
          title={editingCategory.name ?? 'Categorie'}
          description="Mets a jour le nom, le slug, la description ou le rattachement boutique."
        />
        <Box
          component="form"
          onSubmit={onSubmit}
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          }}
        >
          <CategoryFormFields
            control={control}
            errors={errors}
            organizations={organizations}
            register={register}
            showOrganizationHint={false}
            showSlugPlaceholder={false}
            slugHelperText="Laisse vide pour le regenerer depuis le nom."
          />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              type="submit"
              variant="contained"
              disabled={
                isSubmitting || actionId === `category:${editingCategory.id}`
              }
            >
              Enregistrer
            </Button>
            <Button type="button" variant="outlined" onClick={onCancel}>
              Annuler
            </Button>
          </Stack>
        </Box>
      </Stack>
    </StorefrontCard>
  );
}

type ProductEditFormProps = {
  actionId: string | null;
  categories: Category[];
  control: Control<ProductFormValues>;
  editingProduct: Product;
  errors: FieldErrors<ProductFormValues>;
  imageFileName: string | null;
  imageUploadProgress: number | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onImageFileChange: (file: File | null) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  organizations: Organization[];
  register: UseFormRegister<ProductFormValues>;
  theme: StorefrontTheme;
};

export function ProductEditForm({
  actionId,
  categories,
  control,
  editingProduct,
  errors,
  imageFileName,
  imageUploadProgress,
  isSubmitting,
  onCancel,
  onImageFileChange,
  onSubmit,
  organizations,
  register,
  theme,
}: ProductEditFormProps) {
  return (
    <StorefrontCard title="Modifier le produit" theme={theme}>
      <Stack spacing={2.5}>
        <SectionLead
          title={editingProduct.name ?? 'Produit'}
          description="Mets a jour les donnees catalogue, SEO, stock et publication."
        />
        <Box
          component="form"
          onSubmit={onSubmit}
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          }}
        >
          <ProductFormFields
            categories={categories}
            control={control}
            errors={errors}
            imageFileName={imageFileName}
            imageUploadProgress={imageUploadProgress}
            onImageFileChange={onImageFileChange}
            organizations={organizations}
            register={register}
            showImagePlaceholder={false}
            showOrganizationHint={false}
            showSlugPlaceholder={false}
            slugHelperText="Laisse vide pour le regenerer depuis le nom."
          />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              type="submit"
              variant="contained"
              disabled={
                isSubmitting ||
                actionId === `product:${editingProduct.id}` ||
                categories.length === 0
              }
            >
              Enregistrer
            </Button>
            <Button type="button" variant="outlined" onClick={onCancel}>
              Annuler
            </Button>
          </Stack>
        </Box>
      </Stack>
    </StorefrontCard>
  );
}
