import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { clientConfigClientA } from '@credo/client-config-client-a';
import { clientATheme } from '@credo/themes-client-a';
import { vi } from 'vitest';

vi.mock('aws-amplify/data', () => ({
  generateClient: () => ({
    queries: {
      listPublicCategories: vi
        .fn()
        .mockResolvedValue({ data: [], errors: undefined }),
      listPublicProducts: vi
        .fn()
        .mockResolvedValue({ data: [], errors: undefined }),
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

import App from './app';

describe('App', () => {
  it('should render public home route', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App clientConfig={clientConfigClientA} theme={clientATheme} />
      </MemoryRouter>
    );

    await screen.findByRole('heading', {
      name: /credo storefront/i,
    });

    expect(screen.getByText(/page vitrine publique/i)).toBeTruthy();
  });

  it('should render protected admin products route for authenticated user', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/products']}>
        <App clientConfig={clientConfigClientA} theme={clientATheme} />
      </MemoryRouter>
    );

    await screen.findByRole('heading', {
      name: /catalogue admin/i,
    });

    expect(
      await screen.findByText(/aucune organisation pour le moment/i)
    ).toBeTruthy();
  });
});
