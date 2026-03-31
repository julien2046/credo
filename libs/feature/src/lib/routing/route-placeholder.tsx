import { Chip, Paper, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { StorefrontTheme } from '@credo/shared';
import { StorefrontCard } from '@credo/ui';

export type RoutePlaceholderProps = {
  title: string;
  details: string;
  theme: StorefrontTheme;
};

/**
 * Affiche une page placeholder simple pour les routes non implémentées.
 */
export function RoutePlaceholder({
  title,
  details,
  theme,
}: RoutePlaceholderProps) {
  return (
    <StorefrontCard title={title} theme={theme}>
      <Stack spacing={2}>
        <Chip
          label="Zone fonctionnelle"
          variant="outlined"
          sx={{ alignSelf: 'flex-start' }}
        />
        <Typography sx={{ color: theme.mutedTextColor }}>{details}</Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2.5,
            border: `1px dashed ${alpha(theme.accentColor, 0.16)}`,
            backgroundColor: alpha(theme.accentColor, 0.06),
          }}
        >
          <Typography sx={{ color: theme.mutedTextColor }}>
            La structure de page est en place. La prochaine étape consiste à
            brancher le vrai contenu métier et, pour les routes publiques, le
            futur prerender SEO.
          </Typography>
        </Paper>
      </Stack>
    </StorefrontCard>
  );
}
