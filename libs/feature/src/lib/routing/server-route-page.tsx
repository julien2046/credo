import { Alert, Stack, Typography } from '@mui/material';
import type { StorefrontTheme } from '@credo/shared';
import { StorefrontCard } from '@credo/ui';

export type ServerRoutePageProps = {
  pathLabel: string;
  theme: StorefrontTheme;
};

/**
 * Placeholder pour les routes API qui doivent vivre côté backend.
 */
export function ServerRoutePage({
  pathLabel,
  theme,
}: ServerRoutePageProps) {
  return (
    <StorefrontCard title="Route server reservee" theme={theme}>
      <Stack spacing={2}>
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          {pathLabel} doit etre implemente cote backend, pas dans la SPA.
        </Alert>
        <Typography sx={{ color: theme.mutedTextColor }}>
          Garde ici uniquement une explication visuelle. La logique réelle doit
          vivre dans une function, une API ou un webhook.
        </Typography>
      </Stack>
    </StorefrontCard>
  );
}
