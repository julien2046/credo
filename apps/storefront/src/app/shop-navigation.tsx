import { useEffect, useId, useState } from 'react';
import { Button, Menu, MenuItem, Stack } from '@mui/material';
import { Link, NavLink, useLocation } from 'react-router';
import { listPublicCategories, type PublicCategory } from '@credo/data-access';
import { getDataClient } from '@credo/platform-amplify';
import { ChevronDown } from 'lucide-react';

export function ShopNavigation() {
  const id = useId();
  const { pathname } = useLocation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [categories, setCategories] = useState<PublicCategory[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!anchor || categories) return;
    let active = true;
    listPublicCategories(getDataClient()).then(
      (items) => {
        if (active)
          setCategories(
            items.sort((a, b) => a.name.localeCompare(b.name, 'fr-CA'))
          );
      },
      () => {
        if (active) setFailed(true);
      }
    );
    return () => {
      active = false;
    };
  }, [anchor, categories]);

  return (
    <Stack
      component="nav"
      aria-label="Boutique"
      direction="row"
      flexWrap="wrap"
      sx={{
        gap: { xs: 0, sm: 1 },
        justifyContent: 'center',
        '& .MuiButton-root': {
          color: 'text.secondary', minHeight: 44, borderRadius: '4px',
          px: { xs: 1, sm: 1.5 }, fontWeight: 500,
        },
        '& .active': {
          color: 'text.primary',
          textDecoration: 'underline',
          textUnderlineOffset: '4px',
        },
      }}
    >
      <Button component={NavLink} end to="/">
        Accueil
      </Button>
      <Button
        id={id}
        endIcon={<ChevronDown size={16} />}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        aria-controls={anchor ? id + '-menu' : undefined}
        className={pathname.startsWith('/c/') ? 'active' : undefined}
        onClick={(event) => {
          setFailed(false);
          setAnchor(event.currentTarget);
        }}
      >
        Catégories
      </Button>
      <Menu
        id={id + '-menu'}
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{ list: { 'aria-labelledby': id } }}
      >
        {categories?.map((category) => {
          const to = '/c/' + encodeURIComponent(category.slug);
          return (
            <MenuItem
              key={category.id}
              component={Link}
              to={to}
              selected={pathname === to}
              onClick={() => setAnchor(null)}
            >
              {category.name}
            </MenuItem>
          );
        })}
        {!categories?.length && (
          <MenuItem disabled>
            {failed
              ? 'Catalogue indisponible'
              : categories
              ? 'Aucune catégorie'
              : 'Chargement…'}
          </MenuItem>
        )}
      </Menu>
      <Button component={NavLink} to="/promo/summer">
        Promotions
      </Button>
    </Stack>
  );
}
