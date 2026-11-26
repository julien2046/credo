import { useId, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { ChevronRight, X } from 'lucide-react';
import { Link } from 'react-router';
import { formatPrice } from '@credo/shared';
import { useProductSearch } from './use-product-search';

const pageSize = 20;

export function ProductSearchDialog({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(pageSize);
  const { status, results, retry } = useProductSearch(query);

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby={titleId}
      scroll="paper"
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ pr: 2 }}
      >
        <DialogTitle id={titleId}>Rechercher un produit</DialogTitle>
        <Tooltip title="Fermer">
          <IconButton onClick={onClose} aria-label="Fermer la recherche">
            <X size={20} />
          </IconButton>
        </Tooltip>
      </Stack>
      <Box sx={{ px: 3, pt: 1, pb: 2 }}>
        <TextField
          autoFocus
          fullWidth
          type="search"
          label="Nom du produit"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setLimit(pageSize);
          }}
        />
      </Box>
      <DialogContent
        dividers
        sx={{ display: !query.trim() && status !== 'error' ? 'none' : 'block' }}
      >
        {status === 'error' ? (
          <Alert
            severity="warning"
            action={
              <Button color="inherit" onClick={retry}>
                Réessayer
              </Button>
            }
          >
            Le catalogue est momentanément indisponible.
          </Alert>
        ) : (
          <>
            <Typography role="status" variant="body2" color="text.secondary">
              {status === 'loading'
                ? 'Chargement du catalogue…'
                : !query.trim()
                ? ''
                : results.length
                ? `${results.length} produit${results.length > 1 ? 's' : ''}`
                : 'Aucun produit trouvé.'}
            </Typography>
            {results.length > 0 && (
              <List disablePadding>
                {results.slice(0, limit).map((product) => (
                  <ListItem key={product.id} disablePadding divider>
                    <ListItemButton
                      component={Link}
                      to={'/p/' + encodeURIComponent(product.slug)}
                      onClick={onClose}
                      sx={{ px: 0.5, gap: 1, overflowWrap: 'anywhere' }}
                    >
                      <ListItemText
                        primary={product.name}
                        secondary={
                          product.inStock === false
                            ? 'Rupture de stock'
                            : undefined
                        }
                      />
                      <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                        {formatPrice(product.price, product.currency ?? 'EUR')}
                      </Typography>
                      <ChevronRight size={16} aria-hidden="true" />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
            {results.length > limit && (
              <Button onClick={() => setLimit((n) => n + pageSize)}>
                Afficher plus de résultats
              </Button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
