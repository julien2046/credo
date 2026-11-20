import { useEffect } from 'react';
import { Alert, Box, Button, Divider, Stack, Typography } from '@mui/material';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { Link } from 'react-router';
import { formatPrice } from '@credo/shared';
import { useCart } from '../cart/cart-provider';
import { DeliveryForm } from './delivery-form';
import { useTestCheckout } from './use-test-checkout';

export function DeliveryPage({ feeCents }: { feeCents: number | null }) {
  const { ready, items, verification, canProceed, refresh, total, currency } =
    useCart();
  const hasItems = items.length > 0;
  useEffect(() => {
    if (ready && hasItems && feeCents !== null) void refresh();
  }, [ready, hasItems, feeCents, refresh]);

  const cart = JSON.stringify(
    items.map(({ id, quantity }) => ({ id, quantity }))
  );

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
        <DeliveryCheckout
          key={cart}
          cart={cart}
          currency={currency}
          cartTotal={total}
        />
      )}
    </Stack>
  );
}

function DeliveryCheckout({
  cart,
  currency,
  cartTotal,
}: {
  cart: string;
  currency: string;
  cartTotal: number;
}) {
  const { quote, error, phase, requestEstimate, reset, pay } =
    useTestCheckout(cart);
  const money = (cents: number) => formatPrice(cents / 100, currency);
  return (
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
      <DeliveryForm
        onEstimate={requestEstimate}
        onEdit={reset}
        estimating={phase === 'estimating'}
        paying={phase === 'paying'}
      />
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
          <Typography>
            {money(quote?.subtotalCents ?? Math.round(cartTotal * 100))}
          </Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between" gap={2}>
          <Typography>Livraison</Typography>
          <Typography>
            {quote ? money(quote.deliveryCents) : 'À estimer'}
          </Typography>
        </Stack>
        <Divider />
        {quote && (
          <Stack
            role="status"
            direction="row"
            justifyContent="space-between"
            gap={2}
          >
            <Typography fontWeight={700}>Total estimé avant taxes</Typography>
            <Typography fontWeight={700}>{money(quote.totalCents)}</Typography>
          </Stack>
        )}
        <Typography variant="body2" color="text.secondary">
          Mode test : aucun débit réel. Taxes non calculées.
        </Typography>
        {error && <Alert severity="warning">{error}</Alert>}
        {quote?.paymentEnabled && (
          <Button
            variant="contained"
            startIcon={<CreditCard size={18} />}
            disabled={phase !== 'idle'}
            onClick={() => void pay()}
          >
            {phase === 'paying' ? 'Ouverture de Stripe…' : 'Payer en mode test'}
          </Button>
        )}
        {quote && !quote.paymentEnabled && (
          <Typography>Paiement test non activé pour cette boutique.</Typography>
        )}
      </Stack>
    </Box>
  );
}

export function CheckoutReturn({ cancelled }: { cancelled: boolean }) {
  return (
    <Stack spacing={2} alignItems="flex-start">
      <Typography variant="h4" component="h1">
        {cancelled ? 'Paiement interrompu' : 'Retour de Stripe'}
      </Typography>
      <Typography>
        Aucune commande créée dans la boutique. Votre panier est conservé.
      </Typography>
      <Button component={Link} to="/cart" startIcon={<ArrowLeft size={18} />}>
        Retour au panier
      </Button>
    </Stack>
  );
}
