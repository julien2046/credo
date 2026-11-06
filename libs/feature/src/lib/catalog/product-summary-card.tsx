import { Link as RouterLink } from 'react-router';
import { Box, Card, CardActionArea, CardContent, Typography } from '@mui/material';
import { formatPrice, type StorefrontTheme } from '@credo/shared';
import type { StorefrontProductContent } from '../routing/storefront-content';

export function ProductSummaryCard({
  product, theme,
}: {
  product: StorefrontProductContent;
  theme: StorefrontTheme;
}) {
  return (
    <Card variant="outlined" sx={{ borderRadius: '8px', height: '100%', minWidth: 0,
      bgcolor: theme.surface, borderColor: theme.borderColor,
      '&:hover': { borderColor: theme.accentColor } }}>
      <CardActionArea component={RouterLink} to={'/p/' + encodeURIComponent(product.slug)}
        aria-label={'Voir le produit : ' + product.title}
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
        <Box sx={{ aspectRatio: '1', bgcolor: 'action.hover', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
          {product.imageUrl ? (
            <Box component="img" src={product.imageUrl} alt="" loading="lazy"
              sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <Typography variant="body2" color="text.secondary">Photo à venir</Typography>
          )}
        </Box>
        <CardContent sx={{ flex: 1, p: { xs: 1.5, sm: 2 } }}>
          <Typography component="h2" sx={{ fontSize: 18, fontWeight: 600, overflowWrap: 'anywhere', mb: 1 }}>
            {product.title}
          </Typography>
          <Typography sx={{ fontWeight: 700 }}>{formatPrice(product.price, product.currency)}</Typography>
          <Typography variant="caption" sx={{ color: theme.mutedTextColor }}>
            {product.inStock ? 'En stock' : 'Rupture de stock'}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
