import type { FormEventHandler } from 'react';
import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import { Box, Button, Stack, TextField } from '@mui/material';
import type { Category, Organization } from '@credo/data-access';
import type { StorefrontTheme } from '@credo/shared';
import { InsetPanel, SectionLead } from '@credo/ui';
import type {
  CategoryFormValues,
  ProductFormValues,
} from '../use-admin-catalog';
import { CategoryFormFields, ProductFormFields } from './catalog-form-fields';

type OrganizationCreateFormProps = {
  isSubmitting: boolean;
  name: string;
  onNameChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  slug: string;
  theme: StorefrontTheme;
};

export function OrganizationCreateForm({
  isSubmitting,
  name,
  onNameChange,
  onSlugChange,
  onSubmit,
  slug,
  theme,
}: OrganizationCreateFormProps) {
  return (
    <InsetPanel theme={theme} tint="accent">
      <Stack spacing={2.5}>
        <SectionLead
          title="Ajouter une organisation"
          description="Cree la boutique racine avec un slug stable."
        />
        <Box
          component="form"
          onSubmit={onSubmit}
          sx={{ display: 'grid', gap: 2 }}
        >
          <TextField
            label="Nom de l'organisation"
            value={name}
            onChange={(event) => onNameChange(event.currentTarget.value)}
            fullWidth
          />
          <TextField
            label="Slug"
            value={slug}
            onChange={(event) => onSlugChange(event.currentTarget.value)}
            placeholder="ma-boutique"
            helperText="Laisse vide pour le generer depuis le nom."
            fullWidth
          />
          <Button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            variant="contained"
            size="large"
            sx={{
              py: 1.3,
              fontFamily: theme.accentFontFamily,
              fontWeight: 700,
            }}
          >
            {isSubmitting ? 'Creation...' : "Creer l'organisation"}
          </Button>
        </Box>
      </Stack>
    </InsetPanel>
  );
}

type CategoryCreateFormProps = {
  control: Control<CategoryFormValues>;
  errors: FieldErrors<CategoryFormValues>;
  isSubmitting: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
  organizations: Organization[];
  register: UseFormRegister<CategoryFormValues>;
  selectedOrganizationId: string;
  theme: StorefrontTheme;
};

export function CategoryCreateForm({
  control,
  errors,
  isSubmitting,
  onSubmit,
  organizations,
  register,
  selectedOrganizationId,
  theme,
}: CategoryCreateFormProps) {
  return (
    <InsetPanel theme={theme}>
      <Stack spacing={2.5}>
        <SectionLead
          title="Ajouter une categorie"
          description="Les categories creent les futures routes publiques /c/:categorySlug."
        />
        <Box
          component="form"
          onSubmit={onSubmit}
          sx={{ display: 'grid', gap: 2 }}
        >
          <CategoryFormFields
            control={control}
            errors={errors}
            organizations={organizations}
            register={register}
          />
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              !selectedOrganizationId ||
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
            {isSubmitting ? 'Creation...' : 'Creer la categorie'}
          </Button>
        </Box>
      </Stack>
    </InsetPanel>
  );
}

type ProductCreateFormProps = {
  categories: Category[];
  control: Control<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  imageFileName: string | null;
  imageUploadProgress: number | null;
  isSubmitting: boolean;
  onImageFileChange: (file: File | null) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  organizations: Organization[];
  register: UseFormRegister<ProductFormValues>;
  selectedCategoryId: string;
  selectedOrganizationId: string;
  theme: StorefrontTheme;
};

export function ProductCreateForm({
  categories,
  control,
  errors,
  imageFileName,
  imageUploadProgress,
  isSubmitting,
  onImageFileChange,
  onSubmit,
  organizations,
  register,
  selectedCategoryId,
  selectedOrganizationId,
  theme,
}: ProductCreateFormProps) {
  return (
    <InsetPanel theme={theme}>
      <Stack spacing={2.5}>
        <SectionLead
          title="Ajouter un produit"
          description="Produit publiable avec slug, categorie, image et donnees utiles au SEO."
        />
        <Box
          component="form"
          onSubmit={onSubmit}
          sx={{ display: 'grid', gap: 2 }}
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
          />
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              !selectedOrganizationId ||
              !selectedCategoryId ||
              categories.length === 0
            }
            variant="contained"
            size="large"
            sx={{
              py: 1.3,
              fontFamily: theme.accentFontFamily,
              fontWeight: 700,
            }}
          >
            {isSubmitting ? 'Creation...' : 'Creer le produit'}
          </Button>
        </Box>
      </Stack>
    </InsetPanel>
  );
}
