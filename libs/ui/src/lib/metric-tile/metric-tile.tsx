import { Paper, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { StorefrontTheme } from '@credo/shared';

export type MetricTileProps = {
  label: string;
  value: string;
  supportingText?: string;
  theme: StorefrontTheme;
  accent?: boolean;
};

/**
 * Affiche une carte métrique compacte pour clarifier l'état du storefront.
 */
export function MetricTile({
  label,
  value,
  supportingText,
  theme,
  accent = false,
}: MetricTileProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        minHeight: 142,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 3,
        borderColor: alpha(theme.accentColor, 0.12),
        background: accent
          ? `linear-gradient(160deg, ${alpha(theme.accentColor, 0.08)} 0%, ${alpha(
              theme.surface,
              0.98
            )} 100%)`
          : alpha(theme.surface, 0.94),
      }}
    >
      <Typography
        variant="overline"
        sx={{
          color: theme.mutedTextColor,
          letterSpacing: '0.08em',
          fontWeight: 700,
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="h4"
        sx={{
          fontSize: { xs: 26, md: 32 },
          lineHeight: 1.05,
          fontFamily: theme.accentFontFamily,
        }}
      >
        {value}
      </Typography>
      {supportingText ? (
        <Typography sx={{ color: theme.mutedTextColor }}>
          {supportingText}
        </Typography>
      ) : null}
    </Paper>
  );
}
