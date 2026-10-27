import { cleanup, render, screen, act } from '@testing-library/react';
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
  categories: vi.fn(),
  products: vi.fn(),
}));

vi.mock('aws-amplify/data', () => ({
  generateClient: () => ({
    queries: {
      listPublicCategoryPage: catalog.categories,
      listPublicProductPage: catalog.products,
    },
    models: {
      Organization: {
        list: vi.fn().mockResolvedValue({ data: [], errors: undefined }),
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
      name: /credo storefront/i,
    });

    expect(screen.getByText(/page vitrine publique/i)).toBeTruthy();
  });

  it('should render protected admin products route for authenticated user', async () => {
    renderRoute('/admin/products');

    await screen.findByRole('heading', {
      name: /catalogue admin/i,
    });

    expect(
      await screen.findByText(/aucune organisation pour le moment/i)
    ).toBeTruthy();
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
      screen.getByRole('link', { name: 'Voir le produit' }).getAttribute('href')
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
        screen.getByRole('heading', { name: 'Credo Storefront' })
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
      screen.queryByRole('heading', { name: /catalogue admin/i })
    ).toBeNull();
  });

  it('preserves dynamic pages and unknown routes', async () => {
    const router = renderRoute('/cart');
    expect(await screen.findByRole('heading', { name: 'Panier' })).toBeTruthy();
    await act(() => router.navigate('/unknown'));
    expect(await screen.findByRole('heading', { name: '404' })).toBeTruthy();
  });
});
