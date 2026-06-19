import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form';
import {
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import type { Category, Organization } from '@credo/data-access';
import type {
  CategoryFormValues,
  ProductFormValues,
} from '../use-admin-catalog';
import { validateCatalogPrice } from '../catalog-validation';

type CategoryFormFieldsProps = {
  control: Control<CategoryFormValues>;
  errors: FieldErrors<CategoryFormValues>;
  organizations: Organization[];
  register: UseFormRegister<CategoryFormValues>;
  showOrganizationHint?: boolean;
  showSlugPlaceholder?: boolean;
  slugHelperText?: string;
};

/** Champs partages par les formulaires de creation et d'edition categorie. */
export function CategoryFormFields({
  control,
  errors,
  organizations,
  register,
  showOrganizationHint = true,
  showSlugPlaceholder = true,
  slugHelperText = 'Laisse vide pour le generer depuis le nom.',
}: CategoryFormFieldsProps) {
  return (
    <>
      <TextField
        label="Nom de la categorie"
        {...register('name', {
          required: 'Le nom de la categorie est requis.',
        })}
        error={Boolean(errors.name)}
        helperText={errors.name?.message}
        fullWidth
      />
      <TextField
        label="Slug"
        {...register('slug')}
        placeholder={showSlugPlaceholder ? 'nouveautes' : undefined}
        helperText={slugHelperText}
        fullWidth
      />
      <TextField
        label="Description"
        {...register('description')}
        multiline
        minRows={2}
        fullWidth
      />
      <Controller
        name="organizationId"
        control={control}
        rules={{
          required: 'Choisis une organisation.',
        }}
        render={({ field }) => (
          <TextField
            select
            label="Organisation"
            helperText={
              errors.organizationId?.message ??
              (showOrganizationHint
                ? organizations.length === 0
                  ? "Cree d'abord une organisation."
                  : 'La categorie sera rattachee a cette boutique.'
                : undefined)
            }
            error={Boolean(errors.organizationId)}
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
    </>
  );
}

type ProductFormFieldsProps = {
  categories: Category[];
  control: Control<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  organizations: Organization[];
  register: UseFormRegister<ProductFormValues>;
  showImagePlaceholder?: boolean;
  showOrganizationHint?: boolean;
  showSlugPlaceholder?: boolean;
  slugHelperText?: string;
};

/** Champs partages par les formulaires de creation et d'edition produit. */
export function ProductFormFields({
  categories,
  control,
  errors,
  organizations,
  register,
  showImagePlaceholder = true,
  showOrganizationHint = true,
  showSlugPlaceholder = true,
  slugHelperText = 'Laisse vide pour le generer depuis le nom.',
}: ProductFormFieldsProps) {
  return (
    <>
      <TextField
        label="Nom du produit"
        {...register('name', {
          required: 'Le nom du produit est requis.',
        })}
        error={Boolean(errors.name)}
        helperText={errors.name?.message}
        fullWidth
      />
      <TextField
        label="Slug"
        {...register('slug')}
        placeholder={showSlugPlaceholder ? 'produit-vedette' : undefined}
        helperText={slugHelperText}
        fullWidth
      />
      <TextField
        label="Description"
        {...register('description')}
        multiline
        minRows={3}
        fullWidth
      />
      <TextField
        label="Image URL"
        {...register('imageUrl')}
        placeholder={showImagePlaceholder ? 'https://...' : undefined}
        fullWidth
      />
      <TextField
        label="Prix"
        type="number"
        inputProps={{ min: 0, step: 0.01 }}
        {...register('price', {
          required: 'Le prix est requis.',
          validate: validateCatalogPrice,
        })}
        error={Boolean(errors.price)}
        helperText={errors.price?.message}
        fullWidth
      />
      <Controller
        name="organizationId"
        control={control}
        rules={{
          required: 'Choisis une organisation.',
        }}
        render={({ field }) => (
          <TextField
            select
            label="Organisation"
            helperText={
              errors.organizationId?.message ??
              (showOrganizationHint
                ? organizations.length === 0
                  ? "Cree d'abord une organisation."
                  : 'Filtre les categories disponibles.'
                : undefined)
            }
            error={Boolean(errors.organizationId)}
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
        control={control}
        rules={{
          required: 'Choisis une categorie.',
        }}
        render={({ field }) => (
          <TextField
            select
            label="Categorie"
            helperText={
              errors.categoryId?.message ??
              (categories.length === 0
                ? "Cree d'abord une categorie pour cette boutique."
                : 'La route categorie utilisera son slug.')
            }
            error={Boolean(errors.categoryId)}
            fullWidth
            {...field}
          >
            <MenuItem value="">Choisir une categorie</MenuItem>
            {categories.map((category) => (
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
          control={control}
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
          control={control}
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
    </>
  );
}
