import { Box, Stack, Typography } from '@mui/material';
import type { StorefrontTheme } from '@credo/shared';
import type { StorefrontCategoryPageContent } from '../routing/storefront-content';
import { ProductSummaryCard } from './product-summary-card';

export function CategoryPage({
  content,
  theme,
}: {
  content: StorefrontCategoryPageContent;
  theme: StorefrontTheme;
}) {
  return (
    <Box component="section">
      <Stack spacing={3}>
        <Typography component="h1" variant="h4">{content.category.title}</Typography>
        <Typography color="text.secondary">{content.category.summary}</Typography>

        {content.products.length === 0 ? (
            <Typography sx={{ color: theme.mutedTextColor }}>
              Aucun produit publie dans cette categorie pour le moment.
            </Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(3, minmax(0, 1fr))',
              },
            }}
          >
            {content.products.map((product) => (
              <ProductSummaryCard
                key={product.id}
                product={product}
                theme={theme}
              />
            ))}
          </Box>
        )}
      </Stack>
    </Box>
  );
}
