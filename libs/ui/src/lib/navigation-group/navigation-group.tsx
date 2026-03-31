import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { StorefrontTheme } from '@credo/shared';

export type NavigationGroupProps = {
  title: string;
  eyebrow: string;
  description: string;
  links: Array<{
    to: string;
    label: string;
    variant: 'contained' | 'outlined';
  }>;
  theme: StorefrontTheme;
};

/**
 * Regroupe les liens de navigation du storefront dans une surface plus lisible.
 */
export function NavigationGroup({
  title,
  eyebrow,
  description,
  links,
  theme,
}: NavigationGroupProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 3,
        borderColor: alpha(theme.accentColor, 0.12),
        backgroundColor: alpha(theme.surface, 0.95),
      }}
    >
      <Stack spacing={2}>
        <Box>
          <Typography
            variant="overline"
            sx={{
              color: theme.mutedTextColor,
              letterSpacing: '0.08em',
              fontWeight: 700,
            }}
          >
            {eyebrow}
          </Typography>
          <Typography variant="h6" sx={{ mt: 0.25, mb: 0.75 }}>
            {title}
          </Typography>
          <Typography sx={{ color: theme.mutedTextColor }}>
            {description}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
          {links.map((link) => (
            <Button
              key={link.to}
              component={RouterLink}
              to={link.to}
              variant={link.variant}
              size="large"
              sx={{
                minWidth: 0,
                px: 2,
                py: 1.1,
                fontFamily: theme.accentFontFamily,
              }}
            >
              {link.label}
            </Button>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}
