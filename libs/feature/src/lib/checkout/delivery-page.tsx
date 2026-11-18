import { useEffect, useState } from 'react';
import { Alert, Box, Button, Divider, Stack, Typography } from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { formatPrice } from '@credo/shared';
import { useCart } from '../cart/cart-provider';
import { DeliveryForm } from './delivery-form';

export function DeliveryPage({ feeCents }: { feeCents: number | null }) {
  const { ready, items, verification, canProceed, refresh, total, currency } =
    useCart();
  const [estimated, setEstimated] = useState(false);
  const hasItems = items.length > 0;
  useEffect(() => {
    if (ready && hasItems && feeCents !== null) void refresh();
  }, [ready, hasItems, feeCents, refresh]);

  const money = (cents: number) => formatPrice(cents / 100, currency);
  const subtotalCents = Math.round(total * 100);

  return (
    <Stack spacing={3}>
      <Button
        component={Link}
        to="/cart"
        startIcon={<ArrowLeft size={18} />}
        sx={{ alignSelf: 'flex-start' }}
      >
        Retour au panier
      </Button>
      <Typography component="h1" variant="h4">
        Livraison
      </Typography>
      {feeCents === null ? (
        <Alert severity="info">
          La livraison n’est pas configurée pour cette boutique.
        </Alert>
      ) : !ready ? (
        <Typography role="status">Chargement du panier…</Typography>
      ) : !hasItems ? (
        <Typography>Votre panier est vide.</Typography>
      ) : verification === 'checking' || verification === 'idle' ? (
        <Typography role="status">Vérification du panier…</Typography>
      ) : verification === 'error' ? (
        <Alert
          severity="warning"
          action={
            <Button color="inherit" onClick={() => void refresh()}>
              Réessayer
            </Button>
          }
        >
          Impossible de vérifier le panier pour le moment.
        </Alert>
      ) : !canProceed ? (
        <Alert severity="warning">
          Retirez les articles indisponibles du panier pour continuer.
        </Alert>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              md: 'minmax(0, 1fr) minmax(0, 340px)',
            },
            gap: { xs: 4, md: 6 },
            alignItems: 'start',
          }}
        >
          <DeliveryForm onEstimateChange={setEstimated} />
          <Stack
            component="section"
            aria-labelledby="delivery-summary"
            spacing={1.5}
            sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}
          >
            <Typography id="delivery-summary" component="h2" variant="h6">
              Récapitulatif
            </Typography>
            <Stack direction="row" justifyContent="space-between" gap={2}>
              <Typography>Articles</Typography>
              <Typography>{money(subtotalCents)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" gap={2}>
              <Typography>Livraison</Typography>
              <Typography>
                {estimated ? money(feeCents) : 'À estimer'}
              </Typography>
            </Stack>
            <Divider />
            {estimated && (
              <Stack
                role="status"
                direction="row"
                justifyContent="space-between"
                gap={2}
              >
                <Typography fontWeight={700}>
                  Total estimé avant taxes
                </Typography>
                <Typography fontWeight={700}>
                  {money(subtotalCents + feeCents)}
                </Typography>
              </Stack>
            )}
            <Typography variant="body2" color="text.secondary">
              Tarif de démonstration. Aucun paiement ni commande.
            </Typography>
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
