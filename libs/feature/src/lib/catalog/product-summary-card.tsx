import { Link as RouterLink } from 'react-router';
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { formatPrice, type StorefrontTheme } from '@credo/shared';
import type { StorefrontProductContent } from '../routing/storefront-content';

export function ProductSummaryCard({
  product,
  theme,
}: {
  product: StorefrontProductContent;
  theme: StorefrontTheme;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2.5,
        borderColor: alpha(theme.accentColor, 0.14),
        backgroundColor: alpha(theme.surface, 0.9),
      }}
    >
      <Stack spacing={1.5}>
        {product.imageUrl ? (
          <Box
            component="img"
            src={product.imageUrl}
            alt={product.title}
            sx={{
              display: 'block',
              width: '100%',
              aspectRatio: '4 / 3',
              objectFit: 'cover',
              borderRadius: 2,
              border: `1px solid ${alpha(theme.accentColor, 0.1)}`,
            }}
          />
        ) : null}
        <Stack spacing={0.75}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {product.title}
          </Typography>
          <Typography sx={{ color: theme.mutedTextColor }}>
            {product.summary}
          </Typography>
        </Stack>
        <Stack
          direction="row"
          spacing={1}
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography sx={{ fontWeight: 800 }}>
            {formatPrice(product.price, product.currency)}
          </Typography>
          <Chip
            label={product.inStock ? 'En stock' : 'Rupture'}
            color={product.inStock ? 'primary' : 'default'}
            size="small"
          />
        </Stack>
        <Button
          component={RouterLink}
          to={`/p/${product.slug}`}
          variant="outlined"
        >
          Voir le produit
        </Button>
      </Stack>
    </Paper>
  );
}
