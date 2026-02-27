import { render } from '@testing-library/react';

import CredoUi from './ui';

describe('CredoUi', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<CredoUi />);
    expect(baseElement).toBeTruthy();
  });
});
