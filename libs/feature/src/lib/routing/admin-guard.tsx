import { StorefrontCard } from '@credo/ui';
import { Typography } from '@mui/material';
import type { AdminGuardProps } from '../auth/auth.types';

/**
 * Protège les routes admin selon l'état de session.
 */
export function AdminGuard({
  auth,
  theme,
  children,
  signInNode,
}: AdminGuardProps) {
  if (auth.status === 'loading') {
    return (
      <Typography role="status">Vérification de la session...</Typography>
    );
  }

  if (auth.status === 'signedOut') {
    return signInNode;
  }

  if (!auth.isMerchant) {
    return (
      <StorefrontCard title="Accès réservé aux marchands" theme={theme}>
        <Typography>Ce compte ne dispose pas des droits d’administration de la boutique.</Typography>
      </StorefrontCard>
    );
  }

  return children;
}
