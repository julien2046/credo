import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
import type { Category, Organization, Product } from '@credo/data-access';
import { getErrorMessage, type StorefrontTheme } from '@credo/shared';
import { getDataClient } from '@credo/platform-amplify';
import { InsetPanel, SectionLead, StorefrontCard } from '@credo/ui';

type CategoryFormValues = {
  name: string;
  slug: string;
  description: string;
  organizationId: string;
};

type ProductFormValues = {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  price: string;
  organizationId: string;
  categoryId: string;
  inStock: boolean;
  published: boolean;
};

export type AdminCatalogProps = {
  theme: StorefrontTheme;
  currency: string;
};

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatPrice(value: number | null, currency: string) {
  if (value === null) return `0 ${currency}`;

  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * Backoffice catalogue v1 avec organisations, categories et produits publiables.
 */
export function AdminCatalog({ theme, currency }: AdminCatalogProps) {
  const dataClient = getDataClient();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [organizationName, setOrganizationName] = useState('');
  const [organizationSlug, setOrganizationSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    control: categoryControl,
    formState: {
      errors: categoryFormErrors,
      isSubmitting: isCategorySubmitting,
    },
    handleSubmit: handleCategoryFormSubmit,
    getValues: getCategoryValues,
    register: registerCategory,
    reset: resetCategory,
    setValue: setCategoryValue,
    watch: watchCategory,
  } = useForm<CategoryFormValues>({
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      organizationId: '',
    },
  });

  const {
    control: productControl,
    formState: { errors: productFormErrors, isSubmitting: isProductSubmitting },
    handleSubmit: handleProductFormSubmit,
    getValues: getProductValues,
    register: registerProduct,
    reset: resetProduct,
    setValue: setProductValue,
    watch: watchProduct,
  } = useForm<ProductFormValues>({
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      imageUrl: '',
      price: '',
      organizationId: '',
      categoryId: '',
      inStock: true,
      published: false,
    },
  });

  const {
    control: editCategoryControl,
    formState: {
      errors: editCategoryFormErrors,
      isSubmitting: isEditCategorySubmitting,
    },
    handleSubmit: handleEditCategoryFormSubmit,
    register: registerEditCategory,
    reset: resetEditCategory,
  } = useForm<CategoryFormValues>({
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      organizationId: '',
    },
  });

  const {
    control: editProductControl,
    formState: {
      errors: editProductFormErrors,
      isSubmitting: isEditProductSubmitting,
    },
    handleSubmit: handleEditProductFormSubmit,
    register: registerEditProduct,
    reset: resetEditProduct,
    setValue: setEditProductValue,
    watch: watchEditProduct,
  } = useForm<ProductFormValues>({
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      imageUrl: '',
      price: '',
      organizationId: '',
      categoryId: '',
      inStock: true,
      published: false,
    },
  });

  const selectedCategoryOrganizationId = watchCategory('organizationId');
  const selectedProductOrganizationId = watchProduct('organizationId');
  const selectedProductCategoryId = watchProduct('categoryId');
  const selectedEditProductOrganizationId = watchEditProduct('organizationId');
  const selectedEditProductCategoryId = watchEditProduct('categoryId');

  const organizationsById = useMemo(
    () =>
      new Map(
        organizations.map((organization) => [organization.id, organization])
      ),
    [organizations]
  );
  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );
  const productCategories = useMemo(
    () =>
      categories.filter(
        (category) => category.organizationId === selectedProductOrganizationId
      ),
    [categories, selectedProductOrganizationId]
  );
  const editProductCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.organizationId === selectedEditProductOrganizationId
      ),
    [categories, selectedEditProductOrganizationId]
  );
  const editingCategory = useMemo(
    () =>
      editingCategoryId
        ? categories.find((category) => category.id === editingCategoryId) ??
          null
        : null,
    [categories, editingCategoryId]
  );
  const editingProduct = useMemo(
    () =>
      editingProductId
        ? products.find((product) => product.id === editingProductId) ?? null
        : null,
    [products, editingProductId]
  );

  /**
   * Charge les donnees catalogue et maintient les selections courantes valides.
   */
  const loadData = useCallback(async () => {
    setError(null);

    const [orgResult, categoryResult, productResult] = await Promise.all([
      dataClient.models.Organization.list(),
      dataClient.models.Category.list(),
      dataClient.models.Product.list(),
    ]);

    const nextError = [
      getErrorMessage(orgResult?.errors),
      getErrorMessage(categoryResult?.errors),
      getErrorMessage(productResult?.errors),
    ]
      .filter(Boolean)
      .join(', ');

    if (nextError) {
      setError(nextError);
      return;
    }

    const nextOrganizations = Array.isArray(orgResult?.data)
      ? (orgResult.data as Organization[])
      : [];
    const nextCategories = Array.isArray(categoryResult?.data)
      ? (categoryResult.data as Category[])
      : [];
    const nextProducts = Array.isArray(productResult?.data)
      ? (productResult.data as Product[])
      : [];

    setOrganizations(nextOrganizations);
    setCategories(nextCategories);
    setProducts(nextProducts);

    const currentCategoryOrganizationId = getCategoryValues('organizationId');
    const currentProductOrganizationId = getProductValues('organizationId');
    const currentProductCategoryId = getProductValues('categoryId');
    const nextCategoryOrganizationId =
      currentCategoryOrganizationId &&
      nextOrganizations.some(
        (organization) => organization.id === currentCategoryOrganizationId
      )
        ? currentCategoryOrganizationId
        : nextOrganizations[0]?.id ?? '';
    const nextProductOrganizationId =
      currentProductOrganizationId &&
      nextOrganizations.some(
        (organization) => organization.id === currentProductOrganizationId
      )
        ? currentProductOrganizationId
        : nextOrganizations[0]?.id ?? '';
    const nextProductCategoryId =
      currentProductCategoryId &&
      nextCategories.some(
        (category) =>
          category.id === currentProductCategoryId &&
          category.organizationId === nextProductOrganizationId
      )
        ? currentProductCategoryId
        : nextCategories.find(
            (category) => category.organizationId === nextProductOrganizationId
          )?.id ?? '';

    setCategoryValue('organizationId', nextCategoryOrganizationId, {
      shouldDirty: false,
      shouldValidate: false,
    });
    setProductValue('organizationId', nextProductOrganizationId, {
      shouldDirty: false,
      shouldValidate: false,
    });
    setProductValue('categoryId', nextProductCategoryId, {
      shouldDirty: false,
      shouldValidate: false,
    });
  }, [
    dataClient.models.Category,
    dataClient.models.Organization,
    dataClient.models.Product,
    getCategoryValues,
    getProductValues,
    setCategoryValue,
    setProductValue,
  ]);

  useEffect(() => {
    void (async () => {
      try {
        await loadData();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to load data';
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadData]);

  useEffect(() => {
    const nextCategoryId =
      productCategories.find(
        (category) => category.id === selectedProductCategoryId
      )?.id ??
      productCategories[0]?.id ??
      '';

    if (nextCategoryId !== selectedProductCategoryId) {
      setProductValue('categoryId', nextCategoryId, {
        shouldDirty: false,
        shouldValidate: false,
      });
    }
  }, [productCategories, selectedProductCategoryId, setProductValue]);

  useEffect(() => {
    const nextCategoryId =
      editProductCategories.find(
        (category) => category.id === selectedEditProductCategoryId
      )?.id ??
      editProductCategories[0]?.id ??
      '';

    if (nextCategoryId !== selectedEditProductCategoryId) {
      setEditProductValue('categoryId', nextCategoryId, {
        shouldDirty: false,
        shouldValidate: false,
      });
    }
  }, [
    editProductCategories,
    selectedEditProductCategoryId,
    setEditProductValue,
  ]);

  /**
   * Cree une organisation puis recharge le catalogue.
   */
  const handleOrganizationSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const name = organizationName.trim();
    const slug = normalizeSlug(organizationSlug || organizationName);
    if (!name || !slug) return;

    if (organizations.some((organization) => organization.slug === slug)) {
      setError(`Le slug organisation "${slug}" existe deja.`);
      return;
    }

    setError(null);

    try {
      const result = await dataClient.models.Organization.create({
        name,
        slug,
      });
      const message = getErrorMessage(result?.errors);

      if (message) {
        setError(message);
        return;
      }

      setOrganizationName('');
      setOrganizationSlug('');
      await loadData();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to save organization';
      setError(message);
    }
  };

  /**
   * Cree une categorie rattachee a une organisation.
   */
  const handleCategorySubmit = async (values: CategoryFormValues) => {
    const name = values.name.trim();
    const slug = normalizeSlug(values.slug || values.name);
    const description = values.description.trim();

    if (!name || !slug || !values.organizationId) return;

    if (
      categories.some(
        (category) =>
          category.organizationId === values.organizationId &&
          category.slug === slug
      )
    ) {
      setError(`Le slug categorie "${slug}" existe deja pour cette boutique.`);
      return;
    }

    setError(null);

    try {
      const result = await dataClient.models.Category.create({
        name,
        slug,
        organizationId: values.organizationId,
        ...(description ? { description } : {}),
      });
      const message = getErrorMessage(result?.errors);

      if (message) {
        setError(message);
        return;
      }

      resetCategory({
        name: '',
        slug: '',
        description: '',
        organizationId: values.organizationId,
      });
      await loadData();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to save category';
      setError(message);
    }
  };

  /**
   * Cree un produit SEO-ready rattache a une categorie.
   */
  const handleProductSubmit = async (values: ProductFormValues) => {
    const name = values.name.trim();
    const slug = normalizeSlug(values.slug || values.name);
    const description = values.description.trim();
    const imageUrl = values.imageUrl.trim();
    const price = Number(values.price);

    if (
      !name ||
      !slug ||
      !values.organizationId ||
      !values.categoryId ||
      !Number.isFinite(price)
    ) {
      return;
    }

    if (products.some((product) => product.slug === slug)) {
      setError(`Le slug produit "${slug}" existe deja.`);
      return;
    }

    setError(null);

    try {
      const result = await dataClient.models.Product.create({
        name,
        slug,
        price,
        currency,
        organizationId: values.organizationId,
        categoryId: values.categoryId,
        inStock: values.inStock,
        published: values.published,
        ...(description ? { description } : {}),
        ...(imageUrl ? { imageUrl } : {}),
      });
      const message = getErrorMessage(result?.errors);

      if (message) {
        setError(message);
        return;
      }

      resetProduct({
        name: '',
        slug: '',
        description: '',
        imageUrl: '',
        price: '',
        organizationId: values.organizationId,
        categoryId: values.categoryId,
        inStock: true,
        published: false,
      });
      await loadData();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to save product';
      setError(message);
    }
  };

  const startCategoryEdit = (category: Category) => {
    setEditingProductId(null);
    setEditingCategoryId(category.id);
    resetEditCategory({
      name: category.name ?? '',
      slug: category.slug ?? '',
      description: category.description ?? '',
      organizationId: category.organizationId ?? '',
    });
  };

  const startProductEdit = (product: Product) => {
    setEditingCategoryId(null);
    setEditingProductId(product.id);
    resetEditProduct({
      name: product.name ?? '',
      slug: product.slug ?? '',
      description: product.description ?? '',
      imageUrl: product.imageUrl ?? '',
      price: product.price === null ? '' : String(product.price),
      organizationId: product.organizationId ?? '',
      categoryId: product.categoryId ?? '',
      inStock: product.inStock !== false,
      published: Boolean(product.published),
    });
  };

  const handleCategoryEditSubmit = async (values: CategoryFormValues) => {
    if (!editingCategory) return;

    const name = values.name.trim();
    const slug = normalizeSlug(values.slug || values.name);
    const description = values.description.trim();

    if (!name || !slug || !values.organizationId) return;

    if (
      categories.some(
        (category) =>
          category.id !== editingCategory.id &&
          category.organizationId === values.organizationId &&
          category.slug === slug
      )
    ) {
      setError(`Le slug categorie "${slug}" existe deja pour cette boutique.`);
      return;
    }

    setActionId(`category:${editingCategory.id}`);
    setError(null);

    try {
      const result = await dataClient.models.Category.update({
        id: editingCategory.id,
        name,
        slug,
        description: description || null,
        organizationId: values.organizationId,
      });
      const message = getErrorMessage(result?.errors);

      if (message) {
        setError(message);
        return;
      }

      setEditingCategoryId(null);
      await loadData();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to update category';
      setError(message);
    } finally {
      setActionId(null);
    }
  };

  const handleProductEditSubmit = async (values: ProductFormValues) => {
    if (!editingProduct) return;

    const name = values.name.trim();
    const slug = normalizeSlug(values.slug || values.name);
    const description = values.description.trim();
    const imageUrl = values.imageUrl.trim();
    const price = Number(values.price);

    if (
      !name ||
      !slug ||
      !values.organizationId ||
      !values.categoryId ||
      !Number.isFinite(price)
    ) {
      return;
    }

    if (
      products.some(
        (product) => product.id !== editingProduct.id && product.slug === slug
      )
    ) {
      setError(`Le slug produit "${slug}" existe deja.`);
      return;
    }

    setActionId(`product:${editingProduct.id}`);
    setError(null);

    try {
      const result = await dataClient.models.Product.update({
        id: editingProduct.id,
        name,
        slug,
        description: description || null,
        imageUrl: imageUrl || null,
        price,
        currency,
        organizationId: values.organizationId,
        categoryId: values.categoryId,
        inStock: values.inStock,
        published: values.published,
      });
      const message = getErrorMessage(result?.errors);

      if (message) {
        setError(message);
        return;
      }

      setEditingProductId(null);
      await loadData();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to update product';
      setError(message);
    } finally {
      setActionId(null);
    }
  };

  const handleProductUpdate = async (
    product: Product,
    patch: Partial<Pick<Product, 'inStock' | 'published'>>
  ) => {
    if (!product.id) return;

    setActionId(`product:${product.id}`);
    setError(null);

    try {
      const result = await dataClient.models.Product.update({
        id: product.id,
        ...patch,
      });
      const message = getErrorMessage(result?.errors);

      if (message) {
        setError(message);
        return;
      }

      await loadData();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to update product';
      setError(message);
    } finally {
      setActionId(null);
    }
  };

  const handleProductDelete = async (product: Product) => {
    if (!product.id) return;

    setActionId(`product:${product.id}`);
    setError(null);

    try {
      const result = await dataClient.models.Product.delete({
        id: product.id,
      });
      const message = getErrorMessage(result?.errors);

      if (message) {
        setError(message);
        return;
      }

      await loadData();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to delete product';
      setError(message);
    } finally {
      setActionId(null);
    }
  };

  const handleCategoryDelete = async (category: Category) => {
    if (!category.id) return;

    const hasProducts = products.some(
      (product) => product.categoryId === category.id
    );

    if (hasProducts) {
      setError(
        'Cette categorie contient encore des produits. Supprime ou deplace les produits avant.'
      );
      return;
    }

    setActionId(`category:${category.id}`);
    setError(null);

    try {
      const result = await dataClient.models.Category.delete({
        id: category.id,
      });
      const message = getErrorMessage(result?.errors);

      if (message) {
        setError(message);
        return;
      }

      await loadData();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to delete category';
      setError(message);
    } finally {
      setActionId(null);
    }
  };

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
                  onClick={() => setEditingCategoryId(null)}
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
                  onClick={() => setEditingProductId(null)}
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
