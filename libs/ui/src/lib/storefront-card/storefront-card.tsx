import type { ReactNode } from 'react';
import { Card as MuiCard, CardContent, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { StorefrontTheme } from '@credo/shared';

export type StorefrontCardProps = {
  title: string;
  theme: StorefrontTheme;
  children: ReactNode;
};

/**
 * Carte storefront réutilisable avec titre et contenu principal.
 */
export function StorefrontCard({
  title,
  theme,
  children,
}: StorefrontCardProps) {
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
