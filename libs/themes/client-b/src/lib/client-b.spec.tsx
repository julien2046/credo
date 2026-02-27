import { render } from '@testing-library/react';

import CredoClientB from './client-b';

describe('CredoClientB', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<CredoClientB />);
    expect(baseElement).toBeTruthy();
  });
});
