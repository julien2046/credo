import {
  Routes,
  useLocation,
} from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Container,
  CssBaseline,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { alpha, createTheme, ThemeProvider } from '@mui/material/styles';
import type {
  StorefrontClientConfig,
  StorefrontTheme,
} from '@credo/shared';
import {
  AuthCard,
  renderStorefrontRoutes,
  useStorefrontAuth,
} from '@credo/feature';
import { MetricTile, NavigationGroup, StorefrontCard } from '@credo/ui';

/**
 * Composant racine storefront: routing public/admin + auth OTP + rendu thème.
 */
export function App({
  clientConfig,
  theme,
}: {
  clientConfig: StorefrontClientConfig;
  theme: StorefrontTheme;
}) {
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
                <StorefrontCard title="Session storefront" theme={theme}>
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
                </StorefrontCard>

                <Routes>
                  {renderStorefrontRoutes({
                    auth,
                    currency: clientConfig.currency,
                    signInNode,
                    theme,
                  })}
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
