import { render, screen } from '@testing-library/react';
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
  it('should render successfully', () => {
    const { baseElement } = render(<App />);
    expect(baseElement).toBeTruthy();
  });

  it('should render the amplify test heading', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', {
        name: /test amplify data \(organization \+ product\)/i,
      })
    ).toBeTruthy();
  });
});
