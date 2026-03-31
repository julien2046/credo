import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { Organization, Product } from '@credo/data-access';
import { getErrorMessage, type StorefrontTheme } from '@credo/shared';
import { getDataClient } from '@credo/platform-amplify';
import { InsetPanel, SectionLead, StorefrontCard } from '@credo/ui';

type ProductFormValues = {
  name: string;
  description: string;
  price: string;
  organizationId: string;
};

export type AdminCatalogProps = {
  theme: StorefrontTheme;
  currency: string;
};

/**
 * Backoffice produits/organisations avec listing et création via Amplify Data.
 */
export function AdminCatalog({ theme, currency }: AdminCatalogProps) {
  const dataClient = getDataClient();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [organizationName, setOrganizationName] = useState('');
  const [organizationSlug, setOrganizationSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {
    control,
    formState: { errors: productFormErrors, isSubmitting: isProductSubmitting },
    getValues,
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm<ProductFormValues>({
    defaultValues: {
      name: '',
      description: '',
      price: '',
      organizationId: '',
    },
  });
  const selectedOrganizationId = watch('organizationId');

  /**
   * Charge les organisations/produits et maintient la sélection courante valide.
   */
  const loadData = async () => {
    setError(null);

    const [orgResult, productResult] = await Promise.all([
      dataClient.models.Organization.list(),
      dataClient.models.Product.list(),
    ]);

    const orgErrors = getErrorMessage(orgResult?.errors);
    const productErrors = getErrorMessage(productResult?.errors);
    const nextError = [orgErrors, productErrors].filter(Boolean).join(', ');

    if (nextError) {
      setError(nextError);
      return;
    }

    const nextOrganizations = Array.isArray(orgResult?.data)
      ? (orgResult.data as Organization[])
      : [];
    const nextProducts = Array.isArray(productResult?.data)
      ? (productResult.data as Product[])
      : [];

    setOrganizations(nextOrganizations);
    setProducts(nextProducts);

    const currentOrganizationId = getValues('organizationId');
    const nextOrganizationId =
      currentOrganizationId &&
      nextOrganizations.some(
        (organization) => organization.id === currentOrganizationId
      )
        ? currentOrganizationId
        : (nextOrganizations[0]?.id ?? '');

    setValue('organizationId', nextOrganizationId, {
      shouldDirty: false,
      shouldValidate: false,
    });
  };

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
  }, []);

  /**
   * Crée une organisation puis recharge les données de catalogue.
   */
  const handleOrganizationSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const name = organizationName.trim();
    const slug = organizationSlug.trim().toLowerCase();
    if (!name || !slug) return;

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
   * Crée un produit rattaché à l'organisation sélectionnée.
   */
  const handleProductSubmit = async (values: ProductFormValues) => {
    const name = values.name.trim();
    const description = values.description.trim();
    const price = Number(values.price);

    if (!name || !values.organizationId || Number.isNaN(price)) return;

    setError(null);

    try {
      const result = await dataClient.models.Product.create({
        name,
        price,
        currency,
        organizationId: values.organizationId,
        ...(description ? { description } : {}),
      });
      const message = getErrorMessage(result?.errors);

      if (message) {
        setError(message);
        return;
      }

      reset({
        name: '',
        description: '',
        price: '',
        organizationId: values.organizationId,
      });
      await loadData();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to save product';
      setError(message);
    }
  };

  const organizationsById = new Map(
    organizations.map((organization) => [organization.id, organization])
  );

  return (
    <Stack spacing={3}>
      <StorefrontCard title="Catalogue admin" theme={theme}>
        <Stack spacing={3}>
          <SectionLead
            title="Donnees de demonstration"
            description="Utilise ce backoffice pour ecrire quelques organisations et produits dans Amplify Data, puis verifier le rendu du catalogue."
          />

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label={`${organizations.length} organisation(s)`} variant="outlined" />
            <Chip label={`${products.length} produit(s)`} variant="outlined" />
            <Chip label={currency} color="primary" />
            <Chip label={theme.name} variant="outlined" />
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' },
            }}
          >
            <InsetPanel theme={theme} tint="accent">
              <Stack spacing={2.5}>
                <SectionLead
                  title="Ajouter une organisation"
                  description="Cree une boutique racine avec un slug stable pour preparer les futures URLs publiques."
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
                    helperText="Utilise un slug propre pour les futures URLs."
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
                  title="Ajouter un produit"
                  description="Alimente le catalogue et valide le flux front vers Amplify Data."
                />
                <Box
                  component="form"
                  onSubmit={handleSubmit(handleProductSubmit)}
                  sx={{ display: 'grid', gap: 2 }}
                >
                  <TextField
                    label="Nom du produit"
                    {...register('name', {
                      required: 'Le nom du produit est requis.',
                    })}
                    error={Boolean(productFormErrors.name)}
                    helperText={productFormErrors.name?.message}
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
                    label="Prix"
                    type="number"
                    inputProps={{ min: 0, step: 0.01 }}
                    {...register('price', {
                      required: 'Le prix est requis.',
                      validate: (value) => {
                        const numericPrice = Number(value);

                        if (Number.isNaN(numericPrice)) {
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
                    control={control}
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
                            : 'Le produit sera rattache a cette organisation.')
                        }
                        error={Boolean(productFormErrors.organizationId)}
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
                  <Button
                    type="submit"
                    disabled={
                      isProductSubmitting ||
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

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
        }}
      >
        <StorefrontCard title="Organisations stockees" theme={theme}>
          <Stack spacing={2}>
            <SectionLead
              title="Lecture rapide DynamoDB"
              description="Verifie ce qui a ete ecrit cote Amplify Data apres creation."
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
                  <Stack spacing={1.5}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1.5}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {organization.name ?? 'Organisation sans nom'}
                      </Typography>
                      <Chip label="Organisation" variant="outlined" size="small" />
                    </Stack>
                    <Typography sx={{ color: theme.mutedTextColor }}>
                      /{organization.slug ?? 'slug-manquant'}
                    </Typography>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Stack>
        </StorefrontCard>

        <StorefrontCard title="Produits stockes" theme={theme}>
          <Stack spacing={2}>
            <SectionLead
              title="Catalogue courant"
              description="Vue synthétique des produits enregistrés et de leur rattachement."
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
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {product.name ?? 'Produit sans nom'}
                          </Typography>
                          <Typography sx={{ color: theme.mutedTextColor }}>
                            {`${product.price ?? 0} ${product.currency ?? currency}${
                              organization ? ` · ${organization.name}` : ''
                            }`}
                          </Typography>
                        </Box>
                        <Chip
                          label={product.inStock === false ? 'Rupture' : 'Actif'}
                          color={product.inStock === false ? 'default' : 'primary'}
                          size="small"
                        />
                      </Stack>

                      {product.description ? (
                        <Typography sx={{ color: theme.mutedTextColor }}>
                          {product.description}
                        </Typography>
                      ) : null}
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
