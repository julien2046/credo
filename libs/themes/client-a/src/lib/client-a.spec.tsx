import { render } from '@testing-library/react';

import CredoClientA from './client-a';

describe('CredoClientA', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<CredoClientA />);
    expect(baseElement).toBeTruthy();
  });
});
