import { render, screen } from '@testing-library/react';
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

import App from './app';

describe('App', () => {
  it('should render successfully', async () => {
    const { baseElement } = render(
      <App clientConfig={clientConfigClientA} theme={clientATheme} />
    );
    await screen.findByText(/aucune organisation pour le moment/i);
    expect(baseElement).toBeTruthy();
  });

  it('should render the branded heading', async () => {
    render(<App clientConfig={clientConfigClientA} theme={clientATheme} />);
    await screen.findByText(/aucune organisation pour le moment/i);
    expect(
      screen.getByRole('heading', {
        name: /credo atelier/i,
      })
    ).toBeTruthy();
  });
});
