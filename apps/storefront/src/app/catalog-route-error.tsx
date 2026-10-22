import { Alert } from '@mui/material';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { RoutePlaceholder } from '@credo/feature';
import { storefront } from './storefront-runtime';

export function CatalogRouteError({ label }: { label: string }) {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <RoutePlaceholder
        title={`${label} introuvable`}
        details="Ce contenu n'est pas disponible dans le catalogue public."
        theme={storefront.theme}
      />
    );
  }
  return (
    <Alert severity="error">
      Impossible de charger le catalogue. Reessayez dans quelques instants.
    </Alert>
  );
}
