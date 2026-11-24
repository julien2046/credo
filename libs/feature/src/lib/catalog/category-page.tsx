import { useId, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { StorefrontTheme } from '@credo/shared';
import type { StorefrontCategoryPageContent } from '../routing/storefront-content';
import { ProductSummaryCard } from './product-summary-card';
import { selectCategoryProducts, type PriceOrder } from './category-products';

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
        <Typography component="h1" variant="h4">
          {content.category.title}
        </Typography>
        <Typography color="text.secondary">
          {content.category.summary}
        </Typography>

        {content.products.length ? (
          <CategoryProducts
            key={content.category.id}
            products={content.products}
            theme={theme}
          />
        ) : (
          <Typography color="text.secondary">
            Aucun produit publié dans cette catégorie pour le moment.
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

function CategoryProducts({
  products,
  theme,
}: {
  products: StorefrontCategoryPageContent['products'];
  theme: StorefrontTheme;
}) {
  const sortId = useId();
  const [inStockOnly, setInStockOnly] = useState(false);
  const [order, setOrder] = useState<PriceOrder>('catalog');
  const visible = selectCategoryProducts(products, inStockOnly, order);

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 2,
          py: 1.5,
          borderBlock: 1,
          borderColor: 'divider',
        }}
      >
        <Typography
          role="status"
          variant="body2"
          color="text.secondary"
          sx={{ mr: 'auto' }}
        >
          {visible.length} {visible.length > 1 ? 'produits' : 'produit'}
        </Typography>
        <FormControlLabel
          sx={{ m: 0 }}
          control={
            <Checkbox
              checked={inStockOnly}
              onChange={(_, checked) => setInStockOnly(checked)}
            />
          }
          label="En stock seulement"
        />
        <TextField
          select
          size="small"
          id={sortId}
          label="Trier par prix"
          value={order}
          slotProps={{ select: { native: true } }}
          onChange={(event) => setOrder(event.target.value as PriceOrder)}
          sx={{ width: { xs: '100%', sm: 180 } }}
        >
          <option value="catalog">Ordre du catalogue</option>
          <option value="asc">Prix croissant</option>
          <option value="desc">Prix décroissant</option>
        </TextField>
      </Box>
      {visible.length ? (
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
          {visible.map((product) => (
            <ProductSummaryCard
              key={product.id}
              product={product}
              theme={theme}
            />
          ))}
        </Box>
      ) : (
        <Stack spacing={1} alignItems="flex-start">
          <Typography>Aucun produit en stock dans cette catégorie.</Typography>
          <Button onClick={() => setInStockOnly(false)}>
            Afficher tous les produits
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
