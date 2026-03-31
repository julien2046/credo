import type { AdminGuardProps } from '../auth/auth.types';
import { RoutePlaceholder } from './route-placeholder';

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
