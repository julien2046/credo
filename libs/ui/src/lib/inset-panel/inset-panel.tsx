import type { ReactNode } from 'react';
import { Card as MuiCard, CardContent } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { StorefrontTheme } from '@credo/shared';

export type InsetPanelProps = {
  theme: StorefrontTheme;
  tint?: 'neutral' | 'accent';
  children: ReactNode;
};

/**
 * Encadre un sous-bloc fonctionnel avec un fond léger et une bordure nette.
 */
export function InsetPanel({
  theme,
  tint = 'neutral',
  children,
}: InsetPanelProps) {
  return (
    <MuiCard
      variant="outlined"
      sx={{
        borderRadius: 2.5,
        borderColor: alpha(theme.accentColor, 0.12),
        backgroundColor:
          tint === 'accent'
            ? alpha(theme.accentColor, 0.05)
            : alpha(theme.surface, 0.84),
      }}
    >
      <CardContent sx={{ p: 3 }}>{children}</CardContent>
    </MuiCard>
  );
}
