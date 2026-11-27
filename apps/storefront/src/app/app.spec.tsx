import { cleanup, render, screen, act, fireEvent, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { clientConfigClientA } from '@credo/client-config-client-a';
import { clientATheme } from '@credo/themes-client-a';
import { vi } from 'vitest';
import App from './app';
import { HydrateFallback } from '../root';
import HomeRoute from '../routes/home';
import StorefrontDynamicRoute from '../routes/storefront-dynamic';
import ProductRoute, {
  clientLoader as productLoader,
  ErrorBoundary as ProductErrorBoundary,
  meta as productRouteMeta,
} from '../routes/product';
import CategoryRoute, {
  clientLoader as categoryLoader,
  ErrorBoundary as CategoryErrorBoundary,
} from '../routes/category';
import { getCurrentUser } from 'aws-amplify/auth';

const catalog = vi.hoisted(() => ({
  organizations: vi.fn(),
  categories: vi.fn(),
  products: vi.fn(),
  quote: vi.fn(),
  pay: vi.fn(),
}));
const fetchSession = vi.hoisted(() => vi.fn());
const sessionWithGroups = (groups: unknown, sub = 'merchant') => ({
  tokens: { accessToken: { payload: { sub, 'cognito:groups': groups } } },
});

vi.mock('aws-amplify/data', () => ({
  generateClient: () => ({
    mutations: { startTestCheckout: catalog.pay },
    queries: {
      listPublicCategoryPage: catalog.categories,
      listPublicProductPage: catalog.products,
      quoteCheckout: catalog.quote,
    },
    models: {
      Organization: {
        list: catalog.organizations,
        create: vi.fn().mockResolvedValue({ data: {}, errors: undefined }),
      },
      Category: {
        list: vi.fn().mockResolvedValue({ data: [], errors: undefined }),
        create: vi.fn().mockResolvedValue({ data: {}, errors: undefined }),
        update: vi.fn().mockResolvedValue({ data: {}, errors: undefined }),
        delete: vi.fn().mockResolvedValue({ data: {}, errors: undefined }),
      },
      Product: {
        list: vi.fn().mockResolvedValue({ data: [], errors: undefined }),
        create: vi.fn().mockResolvedValue({ data: {}, errors: undefined }),
        update: vi.fn().mockResolvedValue({ data: {}, errors: undefined }),
        delete: vi.fn().mockResolvedValue({ data: {}, errors: undefined }),
      },
    },
  }),
}));

vi.mock('aws-amplify/storage', () => ({
  getUrl: vi.fn().mockResolvedValue({
    url: new URL('https://assets.example.com/product.jpg'),
  }),
  uploadData: vi.fn(() => ({
    result: Promise.resolve({
      path: 'catalog/product-images/product.jpg',
    }),
  })),
}));

vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: fetchSession,
  getCurrentUser: vi.fn().mockResolvedValue({
    username: 'merchant@example.com',
    signInDetails: { loginId: 'merchant@example.com' },
  }),
  signIn: vi.fn(),
  confirmSignIn: vi.fn(),
  signOut: vi.fn().mockResolvedValue(undefined),
}));

function renderRoute(path: string) {
  const router = createMemoryRouter(
    [
      {
        element: (
          <App clientConfig={clientConfigClientA} theme={clientATheme} />
        ),
        HydrateFallback,
        children: [
          { index: true, Component: HomeRoute },
          {
            path: 'p/:productSlug',
            loader: productLoader,
            Component: ProductRoute,
            ErrorBoundary: ProductErrorBoundary,
          },
          {
            path: 'c/:categorySlug',
            loader: categoryLoader,
            Component: CategoryRoute,
            ErrorBoundary: CategoryErrorBoundary,
          },
          { path: '*', Component: StorefrontDynamicRoute },
        ],
      },
    ],
    { initialEntries: [path] }
  );
  render(<RouterProvider router={router} />);
  return router;
}

beforeEach(() => {
  localStorage.clear();
  fetchSession.mockReset().mockResolvedValue(sessionWithGroups(undefined));
  catalog.organizations.mockReset().mockResolvedValue({ data: [] });
  catalog.quote.mockReset().mockResolvedValue({ data: {
    subtotalCents: 5400, deliveryCents: 995, totalCents: 6395, quoteId: 'test-quote', paymentEnabled: true,
  } });
  catalog.pay.mockReset();
  catalog.categories.mockResolvedValue({
    data: {
      items: [
        { id: 'c1', name: 'Mobilier', slug: 'mobilier', organizationId: 'o1' },
      ],
      nextToken: null,
    },
  });
  catalog.products.mockResolvedValue({
    data: {
      items: [
        {
          id: 'p1',
          name: 'Chaise verte',
          slug: 'chaise-verte',
          price: 25,
          currency: 'CAD',
          categoryId: 'c1',
          inStock: true,
        },
      ],
      nextToken: null,
    },
  });
  vi.mocked(getCurrentUser).mockResolvedValue({
    username: 'merchant@example.com',
    userId: 'merchant',
  });
});

afterEach(cleanup);

describe('App', () => {
  it('validates delivery details and estimates the total without storing customer data', async () => {
    localStorage.setItem('credo:cart:v1:client-a', JSON.stringify([
      { id: 'p1', title: 'Chaise verte', slug: 'chaise-verte', price: 25, currency: 'CAD', quantity: 2 },
    ]));
    const router = renderRoute('/cart');
    fireEvent.click(await screen.findByRole('link', { name: 'Continuer vers la livraison' }));
    const estimate = await screen.findByRole('button', { name: 'Estimer les frais' });
    expect(router.state.location.pathname).toBe('/checkout');

    fireEvent.click(estimate);
    expect((await screen.findAllByText('Ce champ est requis.')).length).toBe(5);

    function fill(label: RegExp, value: string) {
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    }
    fill(/^Courriel/, 'client@example.com');
    fill(/^Nom complet/, 'Client Test');
    fill(/^Adresse/, '10 rue Exemple');
    fill(/^Ville/, 'Montréal');
    fill(/^Code postal/, 'M5V 3A8');
    fireEvent.click(estimate);
    expect(await screen.findByText('La livraison est limitée au Québec.')).toBeTruthy();
    expect(screen.queryByText('Total estimé avant taxes')).toBeNull();

    fill(/^Code postal/, 'h2x1y4');
    fireEvent.click(estimate);
    expect(await screen.findByText('Total estimé avant taxes')).toBeTruthy();
    expect(screen.getByText(/63,95/)).toBeTruthy();
    expect(catalog.quote).toHaveBeenCalledWith({
      cart: JSON.stringify([{ id: 'p1', quantity: 2 }]), postalCode: 'h2x1y4',
    }, { authMode: 'apiKey' });
    const pay = screen.getByRole('button', { name: 'Payer en mode test' });
    catalog.pay.mockResolvedValueOnce({ errors: [{ message: 'QUOTE_CHANGED' }] });
    fireEvent.click(pay);
    expect(await screen.findByText(/Le panier a changé/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Payer en mode test' })).toBeNull();
    expect(catalog.pay.mock.calls[0][0]).toMatchObject({
      quoteId: 'test-quote', cart: JSON.stringify([{ id: 'p1', quantity: 2 }]),
      delivery: expect.stringContaining('client@example.com'),
    });
    fireEvent.click(estimate);
    await screen.findByRole('button', { name: 'Payer en mode test' });
    expect(localStorage.getItem('credo:cart:v1:client-a')).not.toContain('client@example.com');
    expect(router.state.location.search).toBe('');

    fill(/^Ville/, 'Québec');
    expect(screen.queryByText('Total estimé avant taxes')).toBeNull();
  });

  it.each(['/checkout/retour', '/checkout/annule'])('never treats a return URL as a paid order: %s', async path => {
    renderRoute(path);
    expect(await screen.findByText(/Votre panier est conservé/)).toBeTruthy();
    expect(catalog.pay).not.toHaveBeenCalled();
  });

  it('rechecks the catalogue on direct visits and blocks unavailable carts', async () => {
    localStorage.setItem('credo:cart:v1:client-a', JSON.stringify([
      { id: 'withdrawn', title: 'Produit retiré', slug: 'retire', price: 25, currency: 'CAD', quantity: 1 },
    ]));
    renderRoute('/checkout');
    expect(await screen.findByText('Retirez les articles indisponibles du panier pour continuer.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Estimer les frais' })).toBeNull();
  });

  it('shows a return link when checkout has no items', async () => {
    renderRoute('/checkout');
    expect(await screen.findByText('Votre panier est vide.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Retour au panier' }).getAttribute('href')).toBe('/cart');
  });

  it('refreshes saved prices and reports withdrawn products', async () => {
    localStorage.setItem('credo:cart:v1:client-a', JSON.stringify([
      { id: 'p1', title: 'Chaise verte', slug: 'ancien', price: 10, currency: 'CAD', quantity: 2 },
      { id: 'deleted', title: 'Produit retiré', slug: 'retire', price: 100, currency: 'CAD', quantity: 1 },
    ]));
    renderRoute('/cart');
    expect(await screen.findByText(/Prix actualisé : ancien prix/)).toBeTruthy();
    expect(screen.getByText('Produit indisponible, exclu du sous-total.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Augmenter : Produit retiré' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('link', { name: 'Chaise verte' }).getAttribute('href')).toBe('/p/chaise-verte');
    await waitFor(() => expect(JSON.parse(localStorage.getItem('credo:cart:v1:client-a') ?? '[]')[0].price).toBe(25));
  });

  it('preserves the cart on a network error and permits retrying', async () => {
    localStorage.setItem('credo:cart:v1:client-a', JSON.stringify([
      { id: 'p1', title: 'Chaise verte', slug: 'chaise-verte', price: 10, currency: 'CAD', quantity: 2 },
    ]));
    catalog.products.mockRejectedValueOnce(new Error('offline'));
    renderRoute('/cart');
    expect(await screen.findByText(/Impossible de vérifier le catalogue/)).toBeTruthy();
    expect(screen.getByLabelText('Quantité : Chaise verte').textContent).toBe('2');
    expect(JSON.parse(localStorage.getItem('credo:cart:v1:client-a') ?? '[]')[0].price).toBe(10);
    fireEvent.click(screen.getByRole('button', { name: 'Actualiser le panier' }));
    expect(await screen.findByText(/Prix actualisé : ancien prix/)).toBeTruthy();
    expect(screen.queryByText(/Impossible de vérifier le catalogue/)).toBeNull();
  });

  it('does not restore a removed line when a pending verification completes', async () => {
    localStorage.setItem('credo:cart:v1:client-a', JSON.stringify([
      { id: 'p1', title: 'Chaise verte', slug: 'chaise-verte', price: 10, currency: 'CAD', quantity: 2 },
    ]));
    let finish!: (value: unknown) => void;
    catalog.products.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    renderRoute('/cart');
    await screen.findByText('Vérification des prix et disponibilités...');
    fireEvent.click(screen.getByRole('button', { name: 'Retirer : Chaise verte' }));
    await act(async () => finish({ data: { items: [], nextToken: null } }));
    expect(screen.getByText('Votre panier est vide.')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem('credo:cart:v1:client-a') ?? '[]')).toEqual([]);
  });

  it('does not offer adding an out-of-stock product', async () => {
    catalog.products.mockResolvedValue({ data: { items: [{
      id: 'p1', name: 'Chaise verte', slug: 'chaise-verte', price: 25,
      currency: 'CAD', categoryId: 'c1', inStock: false,
    }], nextToken: null } });
    renderRoute('/p/chaise-verte');
    expect((await screen.findByRole('button', { name: 'Ajouter au panier' })).hasAttribute('disabled')).toBe(true);
  });

  it('does not read another shop cart', async () => {
    localStorage.setItem('credo:cart:v1:client-b', JSON.stringify([{
      id: 'p1', title: 'Autre boutique', slug: 'autre', price: 25, currency: 'CAD', quantity: 1,
    }]));
    renderRoute('/cart');
    expect(await screen.findByText('Votre panier est vide.')).toBeTruthy();
  });

  it('adds, changes quantity, restores and removes a cart item', async () => {
    renderRoute('/p/chaise-verte');
    const add = await screen.findByRole('button', { name: 'Ajouter au panier' });
    await waitFor(() => expect(add.hasAttribute('disabled')).toBe(false));
    fireEvent.click(add);
    expect(await screen.findByRole('status')).toHaveProperty('textContent', 'Produit ajouté au panier.');
    fireEvent.click(screen.getByRole('link', { name: 'Panier' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Augmenter : Chaise verte' }));
    expect(screen.getByLabelText('Quantité : Chaise verte').textContent).toBe('2');
    expect(JSON.parse(localStorage.getItem('credo:cart:v1:client-a') ?? '[]')[0].quantity).toBe(2);
    cleanup();
    renderRoute('/cart');
    expect((await screen.findByLabelText('Quantité : Chaise verte')).textContent).toBe('2');
    fireEvent.click(screen.getByRole('button', { name: 'Diminuer : Chaise verte' }));
    expect(screen.getByLabelText('Quantité : Chaise verte').textContent).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: 'Retirer : Chaise verte' }));
    expect(await screen.findByText('Votre panier est vide.')).toBeTruthy();
  });

  it('opens the cart from the storefront header', async () => {
    renderRoute('/');
    const cart = screen.getByRole('link', { name: 'Panier' });
    expect(cart.getAttribute('href')).toBe('/cart');
    fireEvent.click(cart);
    expect(await screen.findByRole('heading', { name: 'Panier' })).toBeTruthy();
    expect(cart.getAttribute('aria-current')).toBe('page');
  });

  it('switches between the shop and merchant navigation', async () => {
    fetchSession.mockResolvedValue(sessionWithGroups(['MERCHANT']));
    renderRoute('/');
    expect(screen.getByRole('navigation', { name: 'Boutique' })).toBeTruthy();
    fireEvent.click(await screen.findByRole('link', { name: 'Espace marchand' }));
    expect(await screen.findByRole('navigation', { name: 'Administration' })).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'Boutique' })).toBeNull();
    fireEvent.click(screen.getByRole('link', { name: 'Voir la boutique' }));
    expect(await screen.findByRole('heading', { name: 'La sélection' })).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'Administration' })).toBeNull();
  });

  it('searches all public pages by product name and opens a matching product', async () => {
    const product = { id: 'p2', name: 'Étagère en chêne', slug: 'etagere-chene', currency: 'CAD', price: 42, inStock: true };
    catalog.products.mockClear().mockImplementation(async ({ nextToken }) => ({
      data: nextToken ? { items: [product], nextToken: null } : { items: [], nextToken: 'next' },
    }));
    const router = renderRoute('/promo/summer');
    fireEvent.click(await screen.findByRole('button', { name: 'Rechercher un produit' }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Rechercher un produit' }));
    const field = dialog.getByRole('searchbox', { name: 'Nom du produit' });
    fireEvent.change(field, { target: { value: 'chaise' } });
    expect(await dialog.findByText('Aucun produit trouvé.')).toBeTruthy();
    fireEvent.change(field, { target: { value: 'CHENE etag' } });
    const link = await dialog.findByRole('link', { name: /Étagère en chêne/ });
    expect(catalog.products).toHaveBeenCalledTimes(2);
    fireEvent.click(link);
    expect(await screen.findByRole('heading', { name: product.name })).toBeTruthy();
    expect(router.state.location.pathname).toBe('/p/etagere-chene');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('preserves the search term on retry and reveals more matches without reloading the catalogue', async () => {
    const items = Array.from({ length: 21 }, (_, i) => ({
      id: 'p' + i, name: 'Table ' + i, slug: 'table-' + i, currency: 'CAD', price: i + 1, inStock: true,
    }));
    catalog.products.mockClear().mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ data: { items, nextToken: null } });
    renderRoute('/promo/summer');
    fireEvent.click(await screen.findByRole('button', { name: 'Rechercher un produit' }));
    const dialog = within(await screen.findByRole('dialog'));
    fireEvent.change(dialog.getByRole('searchbox'), { target: { value: 'table' } });
    fireEvent.click(await dialog.findByRole('button', { name: 'Réessayer' }));
    expect(await dialog.findByText('21 produits')).toBeTruthy();
    expect(dialog.getAllByRole('link')).toHaveLength(20);
    fireEvent.click(dialog.getByRole('button', { name: 'Afficher plus de résultats' }));
    expect(dialog.getAllByRole('link')).toHaveLength(21);
    expect(catalog.products).toHaveBeenCalledTimes(2);
    fireEvent.click(dialog.getByRole('button', { name: 'Fermer la recherche' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('navigates to an actual category from the shop menu', async () => {
    renderRoute('/');
    fireEvent.click(await screen.findByRole('button', { name: 'Catégories' }));
    const category = await screen.findByRole('menuitem', { name: 'Mobilier' });
    expect(category.getAttribute('href')).toBe('/c/mobilier');
    fireEvent.click(category);
    expect(await screen.findByRole('heading', { name: 'Mobilier' })).toBeTruthy();
  });

  it('builds route metadata from React Router loaderData', () => {
    const meta = productRouteMeta({
      loaderData: { id: 'p1', slug: 'chaise', title: 'Chaise SEO', summary: 'Description SEO',
        categorySlug: null, imageUrl: null, price: 20, currency: 'CAD', inStock: true },
      params: { productSlug: 'chaise' },
      matches: [],
      location: { pathname: '/p/chaise', search: '', hash: '', state: null, key: 'test' },
    });
    expect(meta).toContainEqual({ title: 'Chaise SEO | Credo Atelier' });
    expect(meta).toContainEqual({ name: 'description', content: 'Description SEO' });
  });

  it('should render public home route', async () => {
    renderRoute('/');

    await screen.findByRole('heading', {
      name: 'La sélection',
    });

    expect((await screen.findByRole('link', { name: /Chaise verte/ })).getAttribute('href')).toBe('/p/chaise-verte');
  });

  it('opens the products admin for a member of the MERCHANT group', async () => {
    fetchSession.mockResolvedValue(sessionWithGroups(['OTHER', 'MERCHANT']));
    renderRoute('/admin/products');

    await screen.findByRole('heading', {
      name: 'Produits',
    });

    expect(
      await screen.findByRole('button', { name: 'Ajouter un produit' })
    ).toBeTruthy();
  });

  it.each(['/admin', '/admin/products', '/admin/categories', '/admin/promos', '/admin/newsletters', '/admin/unknown'])(
    'denies a signed-in account without a group at %s before loading merchant data', async path => {
      renderRoute(path);
      expect(await screen.findByRole('heading', { name: 'Accès réservé aux marchands' })).toBeTruthy();
      expect(screen.queryByRole('navigation', { name: 'Administration' })).toBeNull();
      expect(catalog.organizations).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('link', { name: 'Voir la boutique' }));
      expect(await screen.findByRole('heading', { name: 'La sélection' })).toBeTruthy();
      expect(screen.queryByRole('link', { name: 'Espace marchand' })).toBeNull();
    }
  );

  it.each([
    sessionWithGroups(['MERCHANT_HELPER']),
    sessionWithGroups('MERCHANT'),
    sessionWithGroups(['MERCHANT'], 'another-user'),
    {},
  ])('does not grant access from unrelated or malformed claims', async session => {
    fetchSession.mockResolvedValue(session);
    renderRoute('/admin/products');
    expect(await screen.findByRole('heading', { name: 'Accès réservé aux marchands' })).toBeTruthy();
    expect(catalog.organizations).not.toHaveBeenCalled();
  });

  it('keeps the backoffice closed if the session cannot be read and allows signing out', async () => {
    fetchSession.mockRejectedValue(new Error('Session unavailable'));
    renderRoute('/admin');
    expect(await screen.findByRole('heading', { name: 'Accès réservé aux marchands' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Déconnexion' }));
    expect(await screen.findByRole('heading', { name: 'Connexion par SMS' })).toBeTruthy();
  });

  it('loads a product directly, then a category through navigation', async () => {
    const router = renderRoute('/p/chaise-verte');
    expect(
      await screen.findByRole('heading', { name: 'Chaise verte' })
    ).toBeTruthy();
    expect(catalog.products).toHaveBeenCalledWith(
      { nextToken: null },
      { authMode: 'apiKey' }
    );
    await act(() => router.navigate('/c/mobilier'));
    expect(
      await screen.findByRole('heading', { name: 'Mobilier' })
    ).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Voir le produit : Chaise verte' }).getAttribute('href')
    ).toBe('/p/chaise-verte');
  });

  it.each(['/p/absent', '/c/absente'])(
    'handles missing content at %s',
    async (path) => {
      renderRoute(path);
      expect(
        await screen.findByRole('heading', { name: /introuvable/i })
      ).toBeTruthy();
      expect(
        screen.getByRole('link', { name: 'Credo Atelier' })
      ).toBeTruthy();
    }
  );

  it('distinguishes a backend error from missing content', async () => {
    catalog.products.mockRejectedValueOnce(new Error('Backend unavailable'));
    renderRoute('/p/chaise-verte');
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      expect.stringContaining('Impossible de charger')
    );
  });

  it('keeps the catalogue admin protected for signed-out visitors', async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('Signed out'));
    renderRoute('/admin/products');
    expect(
      await screen.findByRole('heading', { name: 'Connexion par SMS' })
    ).toBeTruthy();
    expect(
      screen.queryByRole('heading', { name: 'Produits' })
    ).toBeNull();
  });

  it('preserves dynamic pages and unknown routes', async () => {
    const router = renderRoute('/cart');
    expect(await screen.findByRole('heading', { name: 'Panier' })).toBeTruthy();
    await act(() => router.navigate('/unknown'));
    expect(await screen.findByRole('heading', { name: '404' })).toBeTruthy();
  });
});
