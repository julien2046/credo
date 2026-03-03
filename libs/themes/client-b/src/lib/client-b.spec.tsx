import { render, screen } from '@testing-library/react';

import CredoClientB, { clientBTheme } from './client-b';

describe('CredoClientB', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<CredoClientB />);
    expect(baseElement).toBeTruthy();
  });

  it('should expose the theme metadata', () => {
    render(<CredoClientB />);
    expect(screen.getByText(clientBTheme.name)).toBeTruthy();
  });
});
