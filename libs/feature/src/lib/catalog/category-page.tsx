import { Box, Divider, Stack, Typography } from '@mui/material';
import type { StorefrontTheme } from '@credo/shared';
import { InsetPanel, SectionLead, StorefrontCard } from '@credo/ui';
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
    <StorefrontCard title={content.category.title} theme={theme}>
      <Stack spacing={3}>
        <SectionLead
          title={`/c/${content.category.slug}`}
          description={content.category.summary}
        />
        <Divider />

        {content.products.length === 0 ? (
          <InsetPanel theme={theme}>
            <Typography sx={{ color: theme.mutedTextColor }}>
              Aucun produit publie dans cette categorie pour le moment.
            </Typography>
          </InsetPanel>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))',
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
    </StorefrontCard>
  );
}
