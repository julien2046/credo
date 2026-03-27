import { type SubmitEvent, useEffect, useState } from 'react';
import { Link as RouterLink, Route, Routes } from 'react-router-dom';
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
import { getDataClient } from '@credo/platform-amplify';
import type {
  AuthCardProps,
  AdminCatalogProps,
  AdminGuardProps,
  AppProps,
  CardProps,
  Organization,
  Product,
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

  return (
    <Card title="Authentification passwordless" theme={theme}>
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <Button
          variant={isSignIn ? 'contained' : 'outlined'}
          onClick={() => onSwitchMode('sign-in')}
          disabled={loading}
        >
          Se connecter
        </Button>
        <Button
          variant={authMode === 'sign-up' ? 'contained' : 'outlined'}
          onClick={() => onSwitchMode('sign-up')}
          disabled={loading}
        >
          Creer un compte
        </Button>
      </Stack>

      {infoMessage && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 3 }}>
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
              borderRadius: 999,
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
              borderRadius: 999,
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
              borderRadius: 999,
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
              borderRadius: 999,
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
  const dataClient = getDataClient();
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
                  {auth.status === 'signedIn' && auth.identifier && (
                    <Chip label={auth.identifier} variant="outlined" />
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
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
