import { render, screen } from '@testing-library/react';

import CredoClientA, { clientATheme } from './client-a';

describe('CredoClientA', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<CredoClientA />);
    expect(baseElement).toBeTruthy();
  });

  it('should expose the theme metadata', () => {
    render(<CredoClientA />);
    expect(screen.getByText(clientATheme.name)).toBeTruthy();
  });
});
