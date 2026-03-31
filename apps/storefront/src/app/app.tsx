import { type ReactNode, type SubmitEvent, useEffect, useState } from 'react';
import {
  Link as RouterLink,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  Box,
  Button,
  Card as MuiCard,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  CssBaseline,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, createTheme, ThemeProvider } from '@mui/material/styles';
import type { StorefrontTheme } from '@credo/shared';
import { getDataClient } from '@credo/platform-amplify';
import type {
  AuthCardProps,
  AdminCatalogProps,
  AdminGuardProps,
  AppProps,
  CardProps,
  Organization,
  Product,
  ProductFormValues,
  RoutePlaceholderProps,
  ServerRoutePageProps,
} from './app.types';
import { getErrorMessage } from './app.utils';
import { renderStorefrontPublicRoutes } from './storefront-public-routes';
import { useStorefrontAuth } from './use-storefront-auth';

/**
 * Affiche une section visuelle standard (carte) avec titre et contenu.
 */
function Card({ title, theme, children }: CardProps) {
  return (
    <MuiCard
      variant="outlined"
      sx={{
        borderRadius: 3,
        borderColor: alpha(theme.accentColor, 0.12),
        backgroundColor: alpha(theme.surface, 0.96),
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
          {title}
        </Typography>
        {children}
      </CardContent>
    </MuiCard>
  );
}

/**
 * Affiche une carte metrque compacte pour clarifier l'etat du storefront.
 */
function MetricTile({
  label,
  value,
  supportingText,
  theme,
  accent = false,
}: {
  label: string;
  value: string;
  supportingText?: string;
  theme: StorefrontTheme;
  accent?: boolean;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        minHeight: 142,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 3,
        borderColor: alpha(theme.accentColor, 0.12),
        background: accent
          ? `linear-gradient(160deg, ${alpha(theme.accentColor, 0.08)} 0%, ${alpha(
              theme.surface,
              0.98
            )} 100%)`
          : alpha(theme.surface, 0.94),
      }}
    >
      <Typography
        variant="overline"
        sx={{
          color: theme.mutedTextColor,
          letterSpacing: '0.08em',
          fontWeight: 700,
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="h4"
        sx={{
          fontSize: { xs: 26, md: 32 },
          lineHeight: 1.05,
          fontFamily: theme.accentFontFamily,
        }}
      >
        {value}
      </Typography>
      {supportingText ? (
        <Typography sx={{ color: theme.mutedTextColor }}>
          {supportingText}
        </Typography>
      ) : null}
    </Paper>
  );
}

/**
 * Regroupe les liens de navigation du storefront dans une surface plus lisible.
 */
function NavigationGroup({
  title,
  eyebrow,
  description,
  links,
  theme,
}: {
  title: string;
  eyebrow: string;
  description: string;
  links: Array<{
    to: string;
    label: string;
    variant: 'contained' | 'outlined';
  }>;
  theme: StorefrontTheme;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 3,
        borderColor: alpha(theme.accentColor, 0.12),
        backgroundColor: alpha(theme.surface, 0.95),
      }}
    >
      <Stack spacing={2}>
        <Box>
          <Typography
            variant="overline"
            sx={{
              color: theme.mutedTextColor,
              letterSpacing: '0.08em',
              fontWeight: 700,
            }}
          >
            {eyebrow}
          </Typography>
          <Typography variant="h6" sx={{ mt: 0.25, mb: 0.75 }}>
            {title}
          </Typography>
          <Typography sx={{ color: theme.mutedTextColor }}>
            {description}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
          {links.map((link) => (
            <Button
              key={link.to}
              component={RouterLink}
              to={link.to}
              variant={link.variant}
              size="large"
              sx={{
                minWidth: 0,
                px: 2,
                py: 1.1,
                fontFamily: theme.accentFontFamily,
              }}
            >
              {link.label}
            </Button>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

/**
 * Affiche un en-tete de section simple, proche du ton de RUThereV2.
 */
function SectionLead({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Box>
      <Typography variant="h6">{title}</Typography>
      <Typography sx={{ color: 'text.secondary' }}>{description}</Typography>
    </Box>
  );
}

/**
 * Encadre un sous-bloc fonctionnel avec un fond léger et une bordure nette.
 */
function InsetPanel({
  theme,
  tint = 'neutral',
  children,
}: {
  theme: StorefrontTheme;
  tint?: 'neutral' | 'accent';
  children: ReactNode;
}) {
  return (
    <MuiCard
      variant="outlined"
      sx={{
        borderRadius: 2.5,
        borderColor: alpha(theme.accentColor, 0.12),
        backgroundColor:
          tint === 'accent'
            ? alpha(theme.accentColor, 0.05)
            : alpha(theme.surface, 0.84),
      }}
    >
      <CardContent sx={{ p: 3 }}>{children}</CardContent>
    </MuiCard>
  );
}

/**
 * Gère les flux passwordless de creation de compte et de connexion par SMS.
 */
function AuthCard({
  theme,
  authMode,
  otpStep,
  signUpStep,
  phoneNumber,
  code,
  error,
  infoMessage,
  loading,
  onChangePhoneNumber,
  onChangeCode,
  onSwitchMode,
  onRequestOtp,
  onConfirmOtp,
  onRequestSignUp,
  onConfirmSignUp,
}: AuthCardProps) {
  const isSignIn = authMode === 'sign-in';
  const isRequestOtp = isSignIn && otpStep === 'request-code';
  const isConfirmOtp = isSignIn && otpStep === 'confirm-code';
  const isRequestSignUp = authMode === 'sign-up' && signUpStep === 'collect-phone';
  const isConfirmSignUp =
    authMode === 'sign-up' && signUpStep === 'confirm-sign-up';
  const currentStepTitle = isRequestOtp
    ? 'Connexion par SMS'
    : isConfirmOtp
      ? 'Confirmation du code SMS'
      : isRequestSignUp
        ? 'Creation du compte marchand'
        : 'Validation du compte';
  const currentStepDetails = isRequestOtp
    ? 'Saisis un numero en format international pour recevoir un OTP.'
    : isConfirmOtp
      ? 'Entre le code envoye par SMS pour terminer la connexion.'
      : isRequestSignUp
        ? 'Le compte est cree a partir du numero de telephone saisi.'
        : 'Confirme le compte avec le code recu avant la premiere connexion.';

  return (
    <Card title="Authentification passwordless" theme={theme}>
      <Stack spacing={2.5}>
        <Typography sx={{ color: theme.mutedTextColor }}>
          Flux court terme pour acceder au backoffice via OTP SMS, sans mot de
          passe.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button
            variant={isSignIn ? 'contained' : 'outlined'}
            onClick={() => onSwitchMode('sign-in')}
            disabled={loading}
            fullWidth
          >
            Se connecter
          </Button>
          <Button
            variant={authMode === 'sign-up' ? 'contained' : 'outlined'}
            onClick={() => onSwitchMode('sign-up')}
            disabled={loading}
            fullWidth
          >
            Creer un compte
          </Button>
        </Stack>

        <Paper
          variant="outlined"
          sx={{
            p: 2.25,
            borderRadius: 2.5,
            borderColor: alpha(theme.accentColor, 0.12),
            backgroundColor: alpha(theme.accentColor, 0.08),
          }}
        >
          <Typography
            variant="overline"
            sx={{
              color: theme.mutedTextColor,
              letterSpacing: '0.08em',
              fontWeight: 700,
            }}
          >
            Etape active
          </Typography>
          <Typography variant="h6" sx={{ mt: 0.25, mb: 0.5 }}>
            {currentStepTitle}
          </Typography>
          <Typography sx={{ color: theme.mutedTextColor }}>
            {currentStepDetails}
          </Typography>
        </Paper>

        {infoMessage && (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            {infoMessage}
          </Alert>
        )}

        {isRequestOtp ? (
          <Box
            component="form"
            onSubmit={onRequestOtp}
            sx={{ display: 'grid', gap: 2 }}
          >
            <TextField
              id="phone-number-sign-in"
              label="Numero de telephone"
              type="tel"
              required
              fullWidth
              value={phoneNumber}
              onChange={(event) => onChangePhoneNumber(event.target.value)}
              placeholder="+15145551234"
              variant="outlined"
              helperText="Format recommande: +15145551234"
            />
            <Button
              type="submit"
              disabled={loading || !phoneNumber.trim()}
              variant="contained"
              size="large"
              sx={{
                py: 1.3,
                fontFamily: theme.accentFontFamily,
                fontWeight: 700,
              }}
            >
              {loading ? 'Envoi...' : 'Recevoir un code SMS'}
            </Button>
          </Box>
        ) : null}

        {isConfirmOtp ? (
          <Box
            component="form"
            onSubmit={onConfirmOtp}
            sx={{ display: 'grid', gap: 2 }}
          >
            <TextField
              id="sms-otp-code"
              label="Code SMS"
              required
              fullWidth
              value={code}
              onChange={(event) => onChangeCode(event.target.value)}
              placeholder="123456"
              variant="outlined"
            />
            <Button
              type="submit"
              disabled={loading || !code.trim()}
              variant="contained"
              size="large"
              sx={{
                py: 1.3,
                fontFamily: theme.accentFontFamily,
                fontWeight: 700,
              }}
            >
              {loading ? 'Validation...' : 'Valider le code SMS'}
            </Button>
          </Box>
        ) : null}

        {isRequestSignUp ? (
          <Box
            component="form"
            onSubmit={onRequestSignUp}
            sx={{ display: 'grid', gap: 2 }}
          >
            <TextField
              id="phone-number-sign-up"
              label="Numero de telephone"
              type="tel"
              required
              fullWidth
              value={phoneNumber}
              onChange={(event) => onChangePhoneNumber(event.target.value)}
              placeholder="+15145551234"
              variant="outlined"
              helperText="Le compte sera cree avec ce numero."
            />
            <Button
              type="submit"
              disabled={loading || !phoneNumber.trim()}
              variant="contained"
              size="large"
              sx={{
                py: 1.3,
                fontFamily: theme.accentFontFamily,
                fontWeight: 700,
              }}
            >
              {loading ? 'Creation...' : 'Creer le compte'}
            </Button>
          </Box>
        ) : null}

        {isConfirmSignUp ? (
          <Box
            component="form"
            onSubmit={onConfirmSignUp}
            sx={{ display: 'grid', gap: 2 }}
          >
            <TextField
              id="sign-up-code"
              label="Code de confirmation"
              required
              fullWidth
              value={code}
              onChange={(event) => onChangeCode(event.target.value)}
              placeholder="123456"
              variant="outlined"
            />
            <Button
              type="submit"
              disabled={loading || !code.trim()}
              variant="contained"
              size="large"
              sx={{
                py: 1.3,
                fontFamily: theme.accentFontFamily,
                fontWeight: 700,
              }}
            >
              {loading ? 'Confirmation...' : 'Confirmer le compte'}
            </Button>
          </Box>
        ) : null}

        {error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        )}
      </Stack>
    </Card>
  );
}

/**
 * Backoffice produits/organisations avec listing et création via Amplify Data.
 */
function AdminCatalog({ theme, currency }: AdminCatalogProps) {
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
    event: SubmitEvent<HTMLFormElement>
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
      <Card title="Catalogue admin" theme={theme}>
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
                    onChange={(event) => setOrganizationName(event.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Slug"
                    value={organizationSlug}
                    onChange={(event) => setOrganizationSlug(event.target.value)}
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
      </Card>

      {loading && (
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
      )}

      {error && <Alert severity="error">{error}</Alert>}

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
        }}
      >
        <Card title="Organisations stockees" theme={theme}>
          <Stack spacing={2}>
            <SectionLead
              title="Lecture rapide DynamoDB"
              description="Verifie ce qui a ete ecrit cote Amplify Data apres creation."
            />
            <Divider />

            {!loading && organizations.length === 0 && (
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
            )}
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
        </Card>

        <Card title="Produits stockes" theme={theme}>
          <Stack spacing={2}>
            <SectionLead
              title="Catalogue courant"
              description="Vue synthétique des produits enregistrés et de leur rattachement."
            />
            <Divider />

            {!loading && products.length === 0 && (
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
            )}
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
        </Card>
      </Box>
    </Stack>
  );
}

/**
 * Affiche une page placeholder simple pour les routes non implémentées.
 */
function RoutePlaceholder({ title, details, theme }: RoutePlaceholderProps) {
  return (
    <Card title={title} theme={theme}>
      <Stack spacing={2}>
        <Chip
          label="Zone fonctionnelle"
          variant="outlined"
          sx={{ alignSelf: 'flex-start' }}
        />
        <Typography sx={{ color: theme.mutedTextColor }}>{details}</Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2.5,
            border: `1px dashed ${alpha(theme.accentColor, 0.16)}`,
            backgroundColor: alpha(theme.accentColor, 0.06),
          }}
        >
          <Typography sx={{ color: theme.mutedTextColor }}>
            La structure de page est en place. La prochaine étape consiste à
            brancher le vrai contenu métier et, pour les routes publiques, le
            futur prerender SEO.
          </Typography>
        </Paper>
      </Stack>
    </Card>
  );
}

/**
 * Placeholder pour les routes API qui doivent vivre côté backend.
 */
function ServerRoutePage({ pathLabel, theme }: ServerRoutePageProps) {
  return (
    <Card title="Route server reservee" theme={theme}>
      <Stack spacing={2}>
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          {pathLabel} doit etre implemente cote backend, pas dans la SPA.
        </Alert>
        <Typography sx={{ color: theme.mutedTextColor }}>
          Garde ici uniquement une explication visuelle. La logique réelle doit
          vivre dans une function, une API ou un webhook.
        </Typography>
      </Stack>
    </Card>
  );
}

/**
 * Protège les routes admin selon l'état de session.
 */
function AdminGuard({ auth, theme, children, signInNode }: AdminGuardProps) {
  if (auth.status === 'loading') {
    return (
      <RoutePlaceholder
        title="Authentification"
        details="Verification de la session..."
        theme={theme}
      />
    );
  }

  if (auth.status === 'signedOut') {
    return signInNode;
  }

  return children;
}

/**
 * Composant racine storefront: routing public/admin + auth OTP + rendu thème.
 */
export function App({ clientConfig, theme }: AppProps) {
  const location = useLocation();
  const {
    auth,
    authMode,
    otpStep,
    signUpStep,
    phoneNumber,
    authCode,
    authLoading,
    authError,
    authInfoMessage,
    setAuthMode,
    setPhoneNumber,
    setAuthCode,
    handleRequestOtp,
    handleConfirmOtp,
    handleRequestSignUp,
    handleConfirmSignUp,
    handleSignOut,
  } = useStorefrontAuth();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const muiTheme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: theme.accentColor,
        contrastText: theme.accentContrastColor,
      },
      background: {
        default: alpha(theme.accentColor, 0.06),
        paper: theme.surface,
      },
      text: {
        primary: theme.textColor,
        secondary: theme.mutedTextColor,
      },
      divider: theme.borderColor,
    },
    shape: {
      borderRadius: 10,
    },
    typography: {
      fontFamily: theme.fontFamily,
      h1: {
        fontFamily: theme.accentFontFamily,
        fontWeight: 800,
      },
      h5: {
        fontFamily: theme.accentFontFamily,
      },
      button: {
        textTransform: 'none',
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          outlined: {
            borderColor: alpha(theme.accentColor, 0.12),
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 10,
            fontWeight: 700,
          },
          contained: {
            boxShadow: 'none',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 700,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          size: 'small',
        },
      },
    },
  });

  const signInNode = (
    <AuthCard
      theme={theme}
      authMode={authMode}
      otpStep={otpStep}
      signUpStep={signUpStep}
      phoneNumber={phoneNumber}
      code={authCode}
      error={authError}
      infoMessage={authInfoMessage}
      loading={authLoading}
      onChangePhoneNumber={setPhoneNumber}
      onChangeCode={setAuthCode}
      onSwitchMode={setAuthMode}
      onRequestOtp={handleRequestOtp}
      onConfirmOtp={handleConfirmOtp}
      onRequestSignUp={handleRequestSignUp}
      onConfirmSignUp={handleConfirmSignUp}
    />
  );

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          py: { xs: 3, md: 5 },
          backgroundImage: `radial-gradient(circle at top left, ${alpha(
            theme.accentColor,
            0.22
          )}, transparent 34%), ${theme.background}`,
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={3}>
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 3.5,
                borderColor: alpha(theme.accentColor, 0.16),
                background: `linear-gradient(135deg, ${alpha(
                  theme.accentColor,
                  0.16
                )} 0%, ${theme.background} 42%, ${theme.surface} 100%)`,
              }}
            >
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                >
                  <Box>
                    <Typography variant="h3" component="h1">
                      Credo Storefront
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ maxWidth: 720, mt: 1, color: theme.mutedTextColor }}
                    >
                      {clientConfig.brandName} · {clientConfig.brandTagline}
                    </Typography>
                    <Typography variant="body1" sx={{ color: theme.mutedTextColor }}>
                      Storefront React + Amplify Gen 2 avec OTP téléphone.
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip label={theme.name} color="primary" />
                    <Chip label="SMS OTP" variant="outlined" />
                    <Chip label="Storefront public + admin" variant="outlined" />
                  </Stack>
                </Stack>

                <Typography variant="body2" sx={{ color: theme.mutedTextColor }}>
                  Référence visuelle réalignée sur `RUThereV2`: hero simple,
                  grille principale à deux colonnes, cartes sobres et état de
                  session clair.
                </Typography>
              </Stack>
            </Paper>

            <Box
              sx={{
                display: 'grid',
                gap: 3,
                gridTemplateColumns: { xs: '1fr', lg: '1.15fr 0.85fr' },
                alignItems: 'start',
              }}
            >
              <Stack spacing={3}>
                <Card title="Session storefront" theme={theme}>
                  <Stack spacing={2.5}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      spacing={1.5}
                    >
                      <Box>
                        <Typography variant="h6">Etat de session</Typography>
                        <Typography sx={{ color: theme.mutedTextColor }}>
                          Contrôle rapide de la session Cognito et des droits
                          admin.
                        </Typography>
                      </Box>

                      <Chip
                        label={
                          auth.status === 'signedIn'
                            ? 'Connecte'
                            : auth.status === 'loading'
                              ? 'Verification'
                              : 'Hors session'
                        }
                        color={auth.status === 'signedIn' ? 'primary' : 'default'}
                        variant={auth.status === 'signedIn' ? 'filled' : 'outlined'}
                      />
                    </Stack>

                    <Box
                      sx={{
                        display: 'grid',
                        gap: 2,
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                      }}
                    >
                      <MetricTile
                        label="Acces admin"
                        value={auth.status === 'signedIn' ? 'Actif' : 'Bloque'}
                        supportingText="Dans ce mode basique, toute session ouverte peut acceder au backoffice."
                        theme={theme}
                        accent={auth.status === 'signedIn'}
                      />
                      <MetricTile
                        label="Identifiant"
                        value={auth.identifier ?? 'Non renseigne'}
                        supportingText="Numero ou login remonté par Cognito."
                        theme={theme}
                      />
                    </Box>

                    {auth.status === 'signedIn' ? (
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1.5}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                      >
                        <Typography sx={{ color: theme.mutedTextColor }}>
                          Session ouverte. Les routes admin sont accessibles tant
                          que l'utilisateur est authentifié.
                        </Typography>
                        <Button onClick={handleSignOut} variant="outlined">
                          Sign out
                        </Button>
                      </Stack>
                    ) : (
                      <Typography sx={{ color: theme.mutedTextColor }}>
                        La carte OTP reste disponible sur les routes admin, et
                        également ici en lecture rapide hors backoffice.
                      </Typography>
                    )}
                  </Stack>
                </Card>

                <Routes>
                  {renderStorefrontPublicRoutes({
                    theme,
                    PlaceholderComponent: RoutePlaceholder,
                  })}

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
                        <AdminCatalog theme={theme} currency={clientConfig.currency} />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/categories"
                    element={
                      <AdminGuard auth={auth} theme={theme} signInNode={signInNode}>
                        <RoutePlaceholder
                          title="Admin Categories"
                          details="Gestion des categories"
                          theme={theme}
                        />
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
                      <ServerRoutePage
                        pathLabel="/api/stripe/webhook"
                        theme={theme}
                      />
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
                </Routes>
              </Stack>

              <Stack spacing={3}>
                <NavigationGroup
                  title="Navigation publique"
                  eyebrow="Storefront"
                  description="Les pages vitrine, categories, produits et promos restent les premières candidates au prerender."
                  theme={theme}
                  links={[
                    { to: '/', label: '/', variant: 'outlined' },
                    { to: '/c/featured', label: '/c/:categorySlug', variant: 'outlined' },
                    { to: '/p/demo-product', label: '/p/:productSlug', variant: 'outlined' },
                    { to: '/promo/summer', label: '/promo/:promoSlug', variant: 'outlined' },
                    { to: '/cart', label: '/cart', variant: 'outlined' },
                  ]}
                />
                <NavigationGroup
                  title="Navigation admin"
                  eyebrow="Backoffice"
                  description="Le backoffice reste dynamique et protégé, avec un accès par OTP téléphone."
                  theme={theme}
                  links={[
                    { to: '/admin', label: '/admin', variant: 'contained' },
                    { to: '/admin/products', label: '/admin/products', variant: 'contained' },
                    { to: '/admin/categories', label: '/admin/categories', variant: 'outlined' },
                    { to: '/admin/promos', label: '/admin/promos', variant: 'outlined' },
                  ]}
                />

                {!isAdminRoute && auth.status === 'signedOut' ? signInNode : null}
              </Stack>
            </Box>
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
