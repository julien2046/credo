import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Category, Organization, Product } from '@credo/data-access';
import {
  createCategory,
  createOrganization,
  createProduct,
  deleteCategory,
  deleteProduct,
  listAdminCatalog,
  updateCategory,
  updateProduct,
} from '@credo/data-access';
import { getDataClient } from '@credo/platform-amplify';
import { normalizeSlug } from '@credo/shared';
import {
  categoryContainsProducts,
  getCategoryMoveBlocker,
  getProductCategoryBlocker,
  getProductPublishBlocker,
  hasDuplicateCategorySlug,
  hasDuplicateOrganizationSlug,
  hasDuplicateProductSlug,
} from './catalog-rules';
import { parseCatalogPrice } from './catalog-validation';

export type CategoryFormValues = {
  name: string;
  slug: string;
  description: string;
  organizationId: string;
};

export type ProductFormValues = {
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

export type UseAdminCatalogOptions = {
  currency: string;
};

function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

/**
 * Centralise l'etat et les mutations du catalogue admin.
 */
export function useAdminCatalog({ currency }: UseAdminCatalogOptions) {
  const dataClient = getDataClient();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [organizationName, setOrganizationName] = useState('');
  const [organizationSlug, setOrganizationSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [isOrganizationSubmitting, setIsOrganizationSubmitting] =
    useState(false);
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

    const snapshot = await listAdminCatalog(dataClient);
    const nextOrganizations = snapshot.organizations;
    const nextCategories = snapshot.categories;
    const nextProducts = snapshot.products;

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
    dataClient,
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
        setError(getErrorMessage(err, 'Unable to load data'));
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

    if (!name) {
      setError("Le nom de l'organisation est requis.");
      return;
    }

    if (!slug) {
      setError(
        "Le slug de l'organisation doit contenir au moins une lettre ou un chiffre."
      );
      return;
    }

    if (hasDuplicateOrganizationSlug(organizations, { slug })) {
      setError(`Le slug organisation "${slug}" existe deja.`);
      return;
    }

    setError(null);
    setIsOrganizationSubmitting(true);

    try {
      await createOrganization(dataClient, {
        name,
        slug,
      });

      setOrganizationName('');
      setOrganizationSlug('');
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to save organization'));
    } finally {
      setIsOrganizationSubmitting(false);
    }
  };

  /**
   * Cree une categorie rattachee a une organisation.
   */
  const handleCategorySubmit = async (values: CategoryFormValues) => {
    const name = values.name.trim();
    const slug = normalizeSlug(values.slug || values.name);
    const description = values.description.trim();

    if (!name || !slug || !values.organizationId) {
      setError(
        'Complete le nom, le slug et la boutique avant de creer la categorie.'
      );
      return;
    }

    if (
      hasDuplicateCategorySlug(categories, {
        organizationId: values.organizationId,
        slug,
      })
    ) {
      setError(`Le slug categorie "${slug}" existe deja pour cette boutique.`);
      return;
    }

    setError(null);

    try {
      await createCategory(dataClient, {
        name,
        slug,
        organizationId: values.organizationId,
        ...(description ? { description } : {}),
      });

      resetCategory({
        name: '',
        slug: '',
        description: '',
        organizationId: values.organizationId,
      });
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to save category'));
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
    const price = parseCatalogPrice(values.price);

    if (
      !name ||
      !slug ||
      !values.organizationId ||
      !values.categoryId ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      setError(
        'Complete le nom, le slug, le prix, la boutique et la categorie avant de creer le produit.'
      );
      return;
    }

    const categoryBlocker = getProductCategoryBlocker(
      categories,
      values.categoryId,
      values.organizationId
    );

    if (categoryBlocker) {
      setError(categoryBlocker);
      return;
    }

    if (hasDuplicateProductSlug(products, { slug })) {
      setError(`Le slug produit "${slug}" existe deja.`);
      return;
    }

    setError(null);

    try {
      await createProduct(dataClient, {
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
      setError(getErrorMessage(err, 'Unable to save product'));
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

  const cancelCategoryEdit = () => {
    setEditingCategoryId(null);
  };

  const cancelProductEdit = () => {
    setEditingProductId(null);
  };

  const handleCategoryEditSubmit = async (values: CategoryFormValues) => {
    if (!editingCategory) return;

    const name = values.name.trim();
    const slug = normalizeSlug(values.slug || values.name);
    const description = values.description.trim();

    if (!name || !slug || !values.organizationId) {
      setError(
        'Complete le nom, le slug et la boutique avant de modifier la categorie.'
      );
      return;
    }

    if (
      hasDuplicateCategorySlug(categories, {
        excludeId: editingCategory.id,
        organizationId: values.organizationId,
        slug,
      })
    ) {
      setError(`Le slug categorie "${slug}" existe deja pour cette boutique.`);
      return;
    }

    const categoryMoveBlocker = getCategoryMoveBlocker(
      editingCategory,
      products,
      values.organizationId
    );

    if (categoryMoveBlocker) {
      setError(categoryMoveBlocker);
      return;
    }

    setActionId(`category:${editingCategory.id}`);
    setError(null);

    try {
      await updateCategory(dataClient, {
        id: editingCategory.id,
        name,
        slug,
        description: description || null,
        organizationId: values.organizationId,
      });

      setEditingCategoryId(null);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to update category'));
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
    const price = parseCatalogPrice(values.price);

    if (
      !name ||
      !slug ||
      !values.organizationId ||
      !values.categoryId ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      setError(
        'Complete le nom, le slug, le prix, la boutique et la categorie avant de modifier le produit.'
      );
      return;
    }

    const categoryBlocker = getProductCategoryBlocker(
      categories,
      values.categoryId,
      values.organizationId
    );

    if (categoryBlocker) {
      setError(categoryBlocker);
      return;
    }

    if (
      hasDuplicateProductSlug(products, {
        excludeId: editingProduct.id,
        slug,
      })
    ) {
      setError(`Le slug produit "${slug}" existe deja.`);
      return;
    }

    setActionId(`product:${editingProduct.id}`);
    setError(null);

    try {
      await updateProduct(dataClient, {
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

      setEditingProductId(null);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to update product'));
    } finally {
      setActionId(null);
    }
  };

  const handleProductUpdate = async (
    product: Product,
    patch: Partial<Pick<Product, 'inStock' | 'published'>>
  ) => {
    if (!product.id) return;

    if (patch.published === true) {
      const publishBlocker = getProductPublishBlocker(product, categories);

      if (publishBlocker) {
        setError(publishBlocker);
        return;
      }
    }

    setActionId(`product:${product.id}`);
    setError(null);

    try {
      await updateProduct(dataClient, {
        id: product.id,
        ...patch,
      });

      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to update product'));
    } finally {
      setActionId(null);
    }
  };

  const handleProductDelete = async (product: Product) => {
    if (!product.id) return;

    setActionId(`product:${product.id}`);
    setError(null);

    try {
      await deleteProduct(dataClient, {
        id: product.id,
      });

      if (editingProductId === product.id) {
        setEditingProductId(null);
      }

      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to delete product'));
    } finally {
      setActionId(null);
    }
  };

  const handleCategoryDelete = async (category: Category) => {
    if (!category.id) return;

    const hasProducts = categoryContainsProducts(products, category.id);

    if (hasProducts) {
      setError(
        'Cette categorie contient encore des produits. Supprime ou deplace les produits avant.'
      );
      return;
    }

    setActionId(`category:${category.id}`);
    setError(null);

    try {
      await deleteCategory(dataClient, {
        id: category.id,
      });

      if (editingCategoryId === category.id) {
        setEditingCategoryId(null);
      }

      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to delete category'));
    } finally {
      setActionId(null);
    }
  };

  return {
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
  };
}
