import { Link as RouterLink } from 'react-router';
import { Box, Button, Chip, Divider, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { formatPrice, type StorefrontTheme } from '@credo/shared';
import { InsetPanel, SectionLead, StorefrontCard } from '@credo/ui';
import type { StorefrontProductContent } from '../routing/storefront-content';

export function ProductPage({
  content,
  theme,
}: {
  content: StorefrontProductContent;
  theme: StorefrontTheme;
}) {
  return (
    <StorefrontCard title={content.title} theme={theme}>
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: '0.9fr 1.1fr' },
          alignItems: 'start',
        }}
      >
        <InsetPanel theme={theme} tint="accent">
          {content.imageUrl ? (
            <Box
              component="img"
              src={content.imageUrl}
              alt={content.title}
              sx={{
                display: 'block',
                width: '100%',
                aspectRatio: '4 / 3',
                objectFit: 'cover',
                borderRadius: 2,
                border: `1px solid ${alpha(theme.accentColor, 0.1)}`,
              }}
            />
          ) : (
            <Stack spacing={1.25}>
              <Typography variant="h6">Image produit</Typography>
              <Typography sx={{ color: theme.mutedTextColor }}>
                Aucune image n'est encore associee a ce produit.
              </Typography>
            </Stack>
          )}
        </InsetPanel>

        <Stack spacing={2.5}>
          <SectionLead
            title={`/p/${content.slug}`}
            description={content.summary}
          />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label={formatPrice(content.price, content.currency)}
              color="primary"
            />
            <Chip
              label={content.inStock ? 'En stock' : 'Rupture'}
              variant="outlined"
            />
            {content.categorySlug ? (
              <Chip
                component={RouterLink}
                to={`/c/${content.categorySlug}`}
                clickable
                label={`/c/${content.categorySlug}`}
                variant="outlined"
              />
            ) : null}
          </Stack>
          <Divider />
          <Button variant="contained" size="large" disabled={!content.inStock}>
            Ajouter au panier
          </Button>
        </Stack>
      </Box>
    </StorefrontCard>
  );
}
