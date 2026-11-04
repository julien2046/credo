import {
  Link,
  Outlet,
  useNavigation,
  useLocation,
} from 'react-router';
import {
  Box,
  Button,
  Container,
  CssBaseline,
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
  useStorefrontAuth,
} from '@credo/feature';
import { ShopNavigation } from './shop-navigation';

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
  const navigation = useNavigation();
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
  const isAdminRoute = location.pathname === '/admin' || location.pathname.startsWith('/admin/');

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
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.paper', borderTop: 4, borderColor: 'primary.main' }}>
        <Container maxWidth="lg">
          <Stack component="header" direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }}
            justifyContent="space-between" spacing={1} sx={{ py: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Stack>
              {isAdminRoute && <Typography variant="overline" color="primary">Administration</Typography>}
              <Typography component={Link} to={isAdminRoute ? '/admin' : '/'} sx={{ fontFamily: theme.accentFontFamily, fontSize: 26,
                fontWeight: 700, textDecoration: 'none', color: 'text.primary' }}>{clientConfig.brandName}</Typography>
            </Stack>
            {!isAdminRoute && <ShopNavigation />}
            <Button component={Link} variant="outlined" sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}
              to={isAdminRoute ? '/' : '/admin'}>
              {isAdminRoute ? 'Voir la boutique' : 'Espace marchand'}
            </Button>
          </Stack>
          {isAdminRoute && auth.status === 'signedIn' && (
            <Stack component="nav" aria-label="Administration" direction="row" flexWrap="wrap" sx={{ py: 2 }}>
              <Button component={Link} to="/admin">Tableau de bord</Button>
              <Button component={Link} to="/admin/products">Produits</Button>
              <Button component={Link} to="/admin/categories">Catégories</Button>
              <Button component={Link} to="/admin/promos">Promotions</Button>
              <Button onClick={handleSignOut}>Déconnexion</Button>
            </Stack>
          )}
          <Box component="main" aria-busy={navigation.state === 'loading'} sx={{ py: { xs: 3, md: 5 }, minHeight: '65vh' }}>
            {navigation.state === 'loading' && <Typography role="status">Chargement...</Typography>}
            <Outlet context={{ auth, currency: clientConfig.currency, signInNode, theme }} />
          </Box>
          <Stack component="footer" direction="row" alignItems="center" justifyContent="space-between"
            sx={{ py: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2">{clientConfig.brandName}</Typography>
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
