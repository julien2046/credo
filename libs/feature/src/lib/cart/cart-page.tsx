import { Link } from 'react-router';
import { useEffect } from 'react';
import { Alert, Box, Button, Divider, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatPrice } from '@credo/shared';
import { useCart } from './cart-provider';
import { MAX_QUANTITY } from './cart-state';

export function CartPage() {
  const cart = useCart();
  const { ready, refresh } = cart;
  useEffect(() => {
    if (ready) void refresh();
  }, [ready, refresh]);
  return <Stack spacing={3}>
    <Typography component="h1" variant="h4">Panier</Typography>
    {cart.storageError && <Alert severity="warning">Le panier ne peut pas être conservé dans ce navigateur.</Alert>}
    {!cart.ready ? <Typography role="status">Chargement du panier...</Typography> :
      !cart.items.length ? <Stack spacing={2} alignItems="flex-start">
        <Typography>Votre panier est vide.</Typography>
        <Button component={Link} to="/" variant="outlined">Continuer mes achats</Button>
      </Stack> : <>
        {cart.verification === 'checking' && <Typography role="status">Vérification des prix et disponibilités...</Typography>}
        {cart.verification === 'error' && <Alert severity="warning">
          Impossible de vérifier le catalogue. Votre panier est conservé ; les prix et disponibilités ne sont pas confirmés.
        </Alert>}
        <Button onClick={() => void refresh()} disabled={cart.verification === 'checking'} sx={{ alignSelf: 'flex-start' }}>Actualiser le panier</Button>
        <Stack divider={<Divider />}>
          {cart.items.map(item => <Box key={item.id} sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, py: 2, alignItems: 'center' }}>
            <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
              {item.availability === 'unavailable' ? <Typography>{item.title}</Typography> :
                <Typography component={Link} to={'/p/' + encodeURIComponent(item.slug)} color="text.primary" sx={{ overflowWrap: 'anywhere' }}>{item.title}</Typography>}
              <Typography variant="body2" color="text.secondary">{formatPrice(item.price, item.currency)} / unité</Typography>
              {item.availability === 'unavailable' && <Typography color="error" variant="body2">Produit indisponible, exclu du sous-total.</Typography>}
              {item.availability === 'out-of-stock' && <Typography color="error" variant="body2">Rupture de stock, exclu du sous-total.</Typography>}
              {item.previousPrice !== undefined && <Typography variant="body2" color="text.secondary">
                Prix actualisé : ancien prix {formatPrice(item.previousPrice, item.currency)}.
              </Typography>}
            </Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton aria-label={'Diminuer : ' + item.title} disabled={item.quantity === 1 || item.availability !== 'available' || cart.verification !== 'verified'} onClick={() => cart.setQuantity(item.id, item.quantity - 1)}><Minus size={18} /></IconButton>
              <Typography aria-label={'Quantité : ' + item.title} sx={{ width: 28, textAlign: 'center' }}>{item.quantity}</Typography>
              <IconButton aria-label={'Augmenter : ' + item.title} disabled={item.quantity === MAX_QUANTITY || item.availability !== 'available' || cart.verification !== 'verified'} onClick={() => cart.setQuantity(item.id, item.quantity + 1)}><Plus size={18} /></IconButton>
            </Stack>
            <Typography sx={{ minWidth: 90, textAlign: 'right', fontWeight: 600 }}>{formatPrice(Math.round(item.price * 100) * item.quantity / 100, item.currency)}</Typography>
            <Tooltip title="Retirer du panier"><IconButton aria-label={'Retirer : ' + item.title} onClick={() => cart.remove(item.id)}><Trash2 size={18} /></IconButton></Tooltip>
          </Box>)}
        </Stack>
        <Stack spacing={1} sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }} alignItems="flex-end">
          <Typography variant="h6">{cart.verification === 'verified' ? 'Sous-total disponible' : 'Sous-total non confirmé'} : {formatPrice(cart.total, cart.currency)}</Typography>
          <Typography variant="body2" color="text.secondary">Hors taxes et livraison. Prix et disponibilités à confirmer.</Typography>
          <Typography variant="body2">Le paiement en ligne n’est pas encore disponible.</Typography>
          <Button component={Link} to="/">Continuer mes achats</Button>
        </Stack>
      </>}
  </Stack>;
}
