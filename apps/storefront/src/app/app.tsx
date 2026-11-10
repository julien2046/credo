import {
  Link,
  NavLink,
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
import { ShoppingBag } from 'lucide-react';

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
          <Box component="header" sx={{ display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0, 1fr) auto', md: 'minmax(0, 1fr) auto minmax(0, 1fr)' },
            alignItems: 'center', columnGap: 2, rowGap: 1, pt: 2, pb: { xs: 1, md: 2 },
            borderBottom: 1, borderColor: 'divider' }}>
            <Stack>
              {isAdminRoute && <Typography variant="overline" color="primary">Administration</Typography>}
              <Typography component={Link} to={isAdminRoute ? '/admin' : '/'} sx={{ fontFamily: theme.accentFontFamily, fontSize: 26,
                fontWeight: 700, textDecoration: 'none', color: 'text.primary',
                overflowWrap: 'anywhere', lineHeight: 1.2 }}>{clientConfig.brandName}</Typography>
            </Stack>
            {!isAdminRoute && (
              <Box sx={{ gridColumn: { xs: '1 / -1', md: '2' }, gridRow: { xs: 2, md: 1 } }}>
                <ShopNavigation />
              </Box>
            )}
            <Box sx={{ justifySelf: 'end', gridColumn: { xs: 2, md: 3 }, gridRow: 1 }}>
              {isAdminRoute ? (
                <Button component={Link} variant="outlined" to="/">Voir la boutique</Button>
              ) : (
                <Button component={NavLink} to="/cart" startIcon={<ShoppingBag size={20} />}
                  sx={{ minHeight: 44, px: 2, borderRadius: '6px', color: 'text.primary',
                    border: 1, borderColor: 'divider', whiteSpace: 'nowrap',
                    '&.active': { bgcolor: 'action.selected', borderColor: 'primary.main' } }}>
                  Panier
                </Button>
              )}
            </Box>
          </Box>
          {isAdminRoute && auth.status === 'signedIn' && (
            <Stack component="nav" aria-label="Administration" direction="row" flexWrap="wrap" sx={{ py: 1, gap: 0.5, borderBottom: 1, borderColor: 'divider', '& .active': { bgcolor: 'action.selected', color: 'text.primary' } }}>
              <Button component={NavLink} end to="/admin">Tableau de bord</Button>
              <Button component={NavLink} end to="/admin/products">Produits</Button>
              <Button component={NavLink} end to="/admin/categories">Catégories</Button>
              <Button component={NavLink} end to="/admin/promos">Promotions</Button>
              <Button sx={{ ml: { md: 'auto' } }} color="inherit" onClick={handleSignOut}>Déconnexion</Button>
            </Stack>
          )}
          <Box component="main" aria-busy={navigation.state === 'loading'} sx={{ py: { xs: 3, md: 5 }, minHeight: '65vh' }}>
            {navigation.state === 'loading' && <Typography role="status">Chargement...</Typography>}
            <Outlet context={{ auth, currency: clientConfig.currency, signInNode, theme }} />
          </Box>
          <Stack component="footer" direction="row" alignItems="center" justifyContent="space-between"
            sx={{ py: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2">{clientConfig.brandName}</Typography>
            {!isAdminRoute && <Button component={Link} to="/admin" color="inherit">Espace marchand</Button>}
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
