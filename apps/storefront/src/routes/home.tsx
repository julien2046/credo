import { useEffect, useState } from 'react';
import { Box, Link, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import { getHomeSelection, type StorefrontProductContent } from '@credo/feature';
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
            <Link key={product.id} component={RouterLink} to={'/p/' + encodeURIComponent(product.slug)}
              underline="none" color="inherit" sx={{ '&:hover h2': { textDecoration: 'underline' } }}>
              <Box sx={{ aspectRatio: '4 / 5', bgcolor: 'action.hover', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                {product.imageUrl ? <Box component="img" src={product.imageUrl} alt=""
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                  <Typography aria-hidden="true" sx={{ fontFamily: storefront.theme.accentFontFamily, fontSize: 52, color: 'primary.main' }}>
                    {product.title.charAt(0)}
                  </Typography>}
              </Box>
              <Typography component="h2" sx={{ mt: 1.5, fontSize: 19, fontWeight: 600, overflowWrap: 'anywhere' }}>{product.title}</Typography>
              <Typography variant="body2" color="text.secondary">{new Intl.NumberFormat(storefront.clientConfig.locale,
                { style: 'currency', currency: product.currency }).format(product.price)}</Typography>
            </Link>
          ))}
        </Box>
      ) : <Typography role="status" color="text.secondary">{failed ? 'Le catalogue est momentanément indisponible.' :
        products ? 'Aucun produit publié pour le moment.' : 'Chargement du catalogue…'}</Typography>}
    </Box>
  );
}
