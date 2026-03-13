import { type SubmitEvent, useEffect, useState } from 'react';
import {
  Link as RouterLink,
  Route,
  Routes,
  useParams,
} from 'react-router-dom';
import {
  confirmSignIn,
  fetchAuthSession,
  getCurrentUser,
  signIn,
  signOut,
} from 'aws-amplify/auth';
import {
  Alert,
  Box,
  Button,
  Card as MuiCard,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, createTheme, ThemeProvider } from '@mui/material/styles';
import { dataClient } from '@credo/platform-amplify';
import type {
  AdminCatalogProps,
  AdminGuardProps,
  AppProps,
  AuthState,
  CardProps,
  Organization,
  OtpStep,
  Product,
  RoutePlaceholderProps,
  ServerRoutePageProps,
  SignInCardProps,
  ThemeOnlyProps,
} from './app.types';
import { getErrorMessage, resolveRoleFromSession } from './app.utils';

/**
 * Affiche une section visuelle standard (carte) avec titre et contenu.
 */
function Card({ title, theme, children }: CardProps) {
  return (
    <MuiCard
      elevation={0}
      sx={{
        borderRadius: 4,
        border: `1px solid ${theme.borderColor}`,
        backgroundColor: theme.surface,
        boxShadow: `0 18px 40px ${alpha(theme.textColor, 0.08)}`,
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
 * Gère le flux de connexion OTP (demande et validation du code email).
 */
function SignInCard({
  theme,
  otpStep,
  email,
  code,
  error,
  loading,
  onChangeEmail,
  onChangeCode,
  onRequestCode,
  onConfirmCode,
}: SignInCardProps) {
  return (
    <Card title="Connexion admin (email OTP)" theme={theme}>
      {otpStep === 'request-code' ? (
        <Box
          component="form"
          onSubmit={onRequestCode}
          sx={{ display: 'grid', gap: 2 }}
        >
          <TextField
            id="email"
            label="Email"
            type="email"
            required
            fullWidth
            value={email}
            onChange={(event) => onChangeEmail(event.target.value)}
            placeholder="you@shop.com"
            variant="outlined"
          />
          <Button
            type="submit"
            disabled={loading || !email.trim()}
            variant="contained"
            size="large"
            sx={{
              borderRadius: 999,
              py: 1.3,
              fontFamily: theme.accentFontFamily,
              fontWeight: 700,
            }}
          >
            {loading ? 'Envoi...' : 'Envoyer un code'}
          </Button>
        </Box>
      ) : (
        <Box
          component="form"
          onSubmit={onConfirmCode}
          sx={{ display: 'grid', gap: 2 }}
        >
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            Un code a ete envoye a <strong>{email}</strong>.
          </Alert>
          <TextField
            id="otp-code"
            label="Code OTP"
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
              borderRadius: 999,
              py: 1.3,
              fontFamily: theme.accentFontFamily,
              fontWeight: 700,
            }}
          >
            {loading ? 'Validation...' : 'Valider le code'}
          </Button>
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 2, borderRadius: 3 }}>
          {error}
        </Alert>
      )}
    </Card>
  );
}

/**
 * Backoffice produits/organisations avec listing et création via Amplify Data.
 */
function AdminCatalog({ theme, currency }: AdminCatalogProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [organizationName, setOrganizationName] = useState('');
  const [organizationSlug, setOrganizationSlug] = useState('');
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    setSelectedOrganizationId((current) => {
      if (
        current &&
        nextOrganizations.some((organization) => organization.id === current)
      ) {
        return current;
      }

      return nextOrganizations[0]?.id ?? '';
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
  const handleProductSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = productName.trim();
    const description = productDescription.trim();
    const price = Number(productPrice);

    if (!name || !selectedOrganizationId || Number.isNaN(price)) return;

    setError(null);

    try {
      const result = await dataClient.models.Product.create({
        name,
        price,
        currency,
        organizationId: selectedOrganizationId,
        ...(description ? { description } : {}),
      });
      const message = getErrorMessage(result?.errors);

      if (message) {
        setError(message);
        return;
      }

      setProductName('');
      setProductDescription('');
      setProductPrice('');
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
      <Card title="Catalogue Amplify (Organization + Product)" theme={theme}>
        <Typography sx={{ color: theme.mutedTextColor }}>
          Meme logique metier partagee, variation limitee a la couleur du theme.
        </Typography>
      </Card>

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
        }}
      >
        <Card title="Ajouter une organisation" theme={theme}>
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
              fullWidth
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              sx={{
                borderRadius: 999,
                py: 1.3,
                fontFamily: theme.accentFontFamily,
                fontWeight: 700,
              }}
            >
              Creer l'organisation
            </Button>
          </Box>
        </Card>

        <Card title="Ajouter un produit" theme={theme}>
          <Box
            component="form"
            onSubmit={handleProductSubmit}
            sx={{ display: 'grid', gap: 2 }}
          >
            <TextField
              label="Nom du produit"
              value={productName}
              onChange={(event) => setProductName(event.target.value)}
              fullWidth
            />
            <TextField
              label="Description"
              value={productDescription}
              onChange={(event) => setProductDescription(event.target.value)}
              fullWidth
            />
            <TextField
              label="Prix"
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
              value={productPrice}
              onChange={(event) => setProductPrice(event.target.value)}
              fullWidth
            />
            <TextField
              select
              label="Organisation"
              value={selectedOrganizationId}
              onChange={(event) => setSelectedOrganizationId(event.target.value)}
              fullWidth
            >
              <MenuItem value="">Choisir une organisation</MenuItem>
              {organizations.map((organization) => (
                <MenuItem key={organization.id} value={organization.id}>
                  {organization.name}
                </MenuItem>
              ))}
            </TextField>
            <Button
              type="submit"
              disabled={!selectedOrganizationId}
              variant="contained"
              size="large"
              sx={{
                borderRadius: 999,
                py: 1.3,
                fontFamily: theme.accentFontFamily,
                fontWeight: 700,
              }}
            >
              Creer le produit
            </Button>
          </Box>
        </Card>
      </Box>

      {loading && (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 3,
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
        <Card title="Organisations" theme={theme}>
          {!loading && organizations.length === 0 && (
            <Typography sx={{ color: theme.mutedTextColor }}>
              Aucune organisation pour le moment.
            </Typography>
          )}
          <List disablePadding>
            {organizations.map((organization, index) => (
              <Box key={organization.id}>
                <ListItem disableGutters sx={{ py: 1.25 }}>
                  <ListItemText
                    primary={organization.name}
                    secondary={organization.slug}
                  />
                  <Chip label="Organisation" variant="outlined" size="small" />
                </ListItem>
                {index < organizations.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        </Card>

        <Card title="Produits" theme={theme}>
          {!loading && products.length === 0 && (
            <Typography sx={{ color: theme.mutedTextColor }}>
              Aucun produit pour le moment.
            </Typography>
          )}
          <List disablePadding>
            {products.map((product, index) => {
              const organization = product.organizationId
                ? organizationsById.get(product.organizationId)
                : undefined;

              return (
                <Box key={product.id}>
                  <ListItem disableGutters sx={{ py: 1.25 }}>
                    <ListItemText
                      primary={product.name}
                      secondary={`${product.price} ${product.currency ?? currency}${
                        organization ? ` · ${organization.name}` : ''
                      }`}
                    />
                    <Chip
                      label={product.inStock === false ? 'Rupture' : 'Actif'}
                      color={product.inStock === false ? 'default' : 'primary'}
                      size="small"
                    />
                  </ListItem>
                  {index < products.length - 1 && <Divider />}
                </Box>
              );
            })}
          </List>
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
      <Typography sx={{ color: theme.mutedTextColor }}>{details}</Typography>
    </Card>
  );
}

/**
 * Placeholder pour la route publique de catégorie.
 */
function CategoryPage({ theme }: ThemeOnlyProps) {
  const params = useParams();
  return (
    <RoutePlaceholder
      title="Categorie"
      details={`Route publique /c/${params.categorySlug ?? ':categorySlug'}`}
      theme={theme}
    />
  );
}

/**
 * Placeholder pour la route publique de produit.
 */
function ProductPage({ theme }: ThemeOnlyProps) {
  const params = useParams();
  return (
    <RoutePlaceholder
      title="Produit"
      details={`Route publique /p/${params.productSlug ?? ':productSlug'}`}
      theme={theme}
    />
  );
}

/**
 * Placeholder pour la route publique de promotion.
 */
function PromoPage({ theme }: ThemeOnlyProps) {
  const params = useParams();
  return (
    <RoutePlaceholder
      title="Promo"
      details={`Route publique /promo/${params.promoSlug ?? ':promoSlug'}`}
      theme={theme}
    />
  );
}

/**
 * Placeholder pour les routes API qui doivent vivre côté backend.
 */
function ServerRoutePage({ pathLabel, theme }: ServerRoutePageProps) {
  return (
    <RoutePlaceholder
      title="Route server reservee"
      details={`${pathLabel} doit etre implemente cote backend (function/API), pas dans la SPA.`}
      theme={theme}
    />
  );
}

/**
 * Protège les routes admin selon l'état de session et le rôle MERCHANT.
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

  if (auth.role !== 'MERCHANT') {
    return (
      <RoutePlaceholder
        title="Acces refuse"
        details="Le role MERCHANT est requis pour /admin/*."
        theme={theme}
      />
    );
  }

  return children;
}

/**
 * Composant racine storefront: routing public/admin + auth OTP + rendu thème.
 */
export function App({ clientConfig, theme }: AppProps) {
  const [auth, setAuth] = useState<AuthState>({
    status: 'loading',
    role: null,
    email: null,
  });
  const [otpStep, setOtpStep] = useState<OtpStep>('request-code');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  /**
   * Recharge l'état de session Cognito et déduit le rôle applicatif.
   */
  const refreshSession = async () => {
    try {
      const user = await getCurrentUser();
      const session = await fetchAuthSession();
      const payload = (session.tokens?.idToken?.payload ?? {}) as Record<
        string,
        unknown
      >;
      const role = resolveRoleFromSession(payload);

      setAuth({
        status: 'signedIn',
        role,
        email: user?.signInDetails?.loginId ?? user?.username ?? null,
      });
    } catch {
      setAuth({
        status: 'signedOut',
        role: null,
        email: null,
      });
    }
  };

  useEffect(() => {
    void refreshSession();
  }, []);

  /**
   * Démarre la connexion passwordless par email OTP.
   */
  const handleRequestOtp = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const result = await signIn({
        username: email.trim(),
        options: {
          authFlowType: 'USER_AUTH',
          preferredChallenge: 'EMAIL_OTP',
        },
      });

      const step = result.nextStep.signInStep;

      if (step === 'DONE') {
        await refreshSession();
        return;
      }

      if (step === 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE') {
        setOtpStep('confirm-code');
        return;
      }

      setAuthError(`Etape de connexion non supportee: ${step}`);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Impossible de lancer la connexion OTP.';
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  /**
   * Valide le code OTP saisi et finalise la connexion.
   */
  const handleConfirmOtp = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const result = await confirmSignIn({
        challengeResponse: otpCode.trim(),
      });

      if (result.nextStep.signInStep !== 'DONE') {
        setAuthError(
          `Etape de connexion non finalisee: ${result.nextStep.signInStep}`
        );
        return;
      }

      setOtpCode('');
      setOtpStep('request-code');
      await refreshSession();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Code OTP invalide.';
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  /**
   * Termine la session utilisateur et réinitialise l'état local d'auth.
   */
  const handleSignOut = async () => {
    await signOut();
    setAuth({
      status: 'signedOut',
      role: null,
      email: null,
    });
    setOtpStep('request-code');
    setOtpCode('');
  };

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
      borderRadius: 18,
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
  });

  const signInNode = (
    <SignInCard
      theme={theme}
      otpStep={otpStep}
      email={email}
      code={otpCode}
      error={authError}
      loading={authLoading}
      onChangeEmail={setEmail}
      onChangeCode={setOtpCode}
      onRequestCode={handleRequestOtp}
      onConfirmCode={handleConfirmOtp}
    />
  );

  return (
    <ThemeProvider theme={muiTheme}>
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
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 5,
                border: `1px solid ${alpha(theme.borderColor, 0.9)}`,
                background: `linear-gradient(135deg, ${alpha(
                  theme.accentColor,
                  0.18
                )} 0%, ${theme.background} 45%, ${theme.surface} 100%)`,
                boxShadow: `0 30px 70px ${alpha(theme.textColor, 0.12)}`,
              }}
            >
              <Stack spacing={2}>
                <Chip
                  label="Boutique e-commerce single-tenant"
                  sx={{
                    alignSelf: 'flex-start',
                    fontFamily: theme.accentFontFamily,
                    letterSpacing: '0.04em',
                    fontWeight: 700,
                  }}
                />
                <Box>
                  <Typography variant="h1" sx={{ fontSize: { xs: 36, md: 52 } }}>
                    Credo Storefront
                  </Typography>
                  <Typography variant="h6" sx={{ color: theme.mutedTextColor }}>
                    {clientConfig.brandName} · {clientConfig.brandTagline}
                  </Typography>
                </Box>
                <Typography sx={{ maxWidth: 720, color: theme.mutedTextColor }}>
                  Meme contenu et meme logique metier, seule la palette change
                  selon le client. Les blocs ci-dessous sont volontairement nets
                  pour mieux visualiser les zones fonctionnelles.
                </Typography>
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 4,
                border: `1px solid ${theme.borderColor}`,
                backgroundColor: alpha(theme.surface, 0.94),
              }}
            >
              <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
                <Button component={RouterLink} to="/" variant="outlined">
                  /
                </Button>
                <Button component={RouterLink} to="/c/featured" variant="outlined">
                  /c/:categorySlug
                </Button>
                <Button
                  component={RouterLink}
                  to="/p/demo-product"
                  variant="outlined"
                >
                  /p/:productSlug
                </Button>
                <Button
                  component={RouterLink}
                  to="/promo/summer"
                  variant="outlined"
                >
                  /promo/:promoSlug
                </Button>
                <Button component={RouterLink} to="/cart" variant="outlined">
                  /cart
                </Button>
                <Button component={RouterLink} to="/admin" variant="contained">
                  /admin
                </Button>
                <Button
                  component={RouterLink}
                  to="/admin/products"
                  variant="contained"
                >
                  /admin/products
                </Button>
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 4,
                border: `1px solid ${theme.borderColor}`,
                backgroundColor: alpha(theme.surface, 0.96),
              }}
            >
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={1.5}
                alignItems={{ xs: 'flex-start', md: 'center' }}
                justifyContent="space-between"
              >
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={`Auth: ${auth.status}`} color="default" />
                  {auth.status === 'signedIn' && auth.role && (
                    <Chip label={`Role: ${auth.role}`} color="primary" />
                  )}
                  {auth.status === 'signedIn' && auth.email && (
                    <Chip label={auth.email} variant="outlined" />
                  )}
                </Stack>
                {auth.status === 'signedIn' && (
                  <Button onClick={handleSignOut} variant="outlined">
                    Sign out
                  </Button>
                )}
              </Stack>
            </Paper>

            <Routes>
              <Route
                path="/"
                element={
                  <RoutePlaceholder
                    title="Home"
                    details="Route publique /"
                    theme={theme}
                  />
                }
              />
              <Route
                path="/c/:categorySlug"
                element={<CategoryPage theme={theme} />}
              />
              <Route
                path="/p/:productSlug"
                element={<ProductPage theme={theme} />}
              />
              <Route
                path="/promo/:promoSlug"
                element={<PromoPage theme={theme} />}
              />
              <Route
                path="/cart"
                element={
                  <RoutePlaceholder
                    title="Panier"
                    details="Route publique /cart"
                    theme={theme}
                  />
                }
              />

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
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
