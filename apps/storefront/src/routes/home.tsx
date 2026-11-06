import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { getHomeSelection, ProductSummaryCard, type StorefrontProductContent } from '@credo/feature';
import { storefront } from '../app/storefront-runtime';

export default function HomeRoute() {
  const [products, setProducts] = useState<StorefrontProductContent[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    getHomeSelection().then(items => { if (active) setProducts(items); },
      () => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);
  return (
    <Box component="section" aria-labelledby="collection-heading">
      <Typography component="h1" id="collection-heading" sx={{
        fontFamily: storefront.theme.accentFontFamily, fontSize: { xs: 36, md: 54 },
        lineHeight: 1.12, mb: { xs: 3, md: 4 },
      }}>La sélection</Typography>
      {products?.length ? (
        <Box sx={{ display: 'grid', gap: { xs: 2, md: 3 }, gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))',
        } }}>
          {products.map(product => (
            <ProductSummaryCard key={product.id} product={product} theme={storefront.theme} />
          ))}
        </Box>
      ) : <Typography role="status" color="text.secondary">{failed ? 'Le catalogue est momentanément indisponible.' :
        products ? 'Aucun produit publié pour le moment.' : 'Chargement du catalogue…'}</Typography>}
    </Box>
  );
}
