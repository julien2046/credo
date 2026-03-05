import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { clientConfigClientA } from '@credo/client-config-client-a';
import { clientATheme } from '@credo/themes-client-a';
import { vi } from 'vitest';

vi.mock('aws-amplify/data', () => ({
  generateClient: () => ({
    models: {
      Organization: {
        list: vi.fn().mockResolvedValue({ data: [], errors: undefined }),
        create: vi.fn().mockResolvedValue({ data: {}, errors: undefined }),
      },
      Product: {
        list: vi.fn().mockResolvedValue({ data: [], errors: undefined }),
        create: vi.fn().mockResolvedValue({ data: {}, errors: undefined }),
      },
    },
  }),
}));

vi.mock('aws-amplify/auth', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({
    username: 'merchant@example.com',
    signInDetails: { loginId: 'merchant@example.com' },
  }),
  fetchAuthSession: vi.fn().mockResolvedValue({
    tokens: {
      idToken: {
        payload: {
          'cognito:groups': ['MERCHANT'],
        },
      },
    },
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

    expect(screen.getByText(/route publique \//i)).toBeTruthy();
  });

  it('should render protected admin products route for merchant', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/products']}>
        <App clientConfig={clientConfigClientA} theme={clientATheme} />
      </MemoryRouter>
    );

    await screen.findByRole('heading', {
      name: /catalogue amplify/i,
    });

    expect(
      await screen.findByText(/aucune organisation pour le moment/i)
    ).toBeTruthy();
  });
});
