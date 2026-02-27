import { render } from '@testing-library/react';

import OrgClientConfigClientB from './client-config-client-b';

describe('OrgClientConfigClientB', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<OrgClientConfigClientB />);
    expect(baseElement).toBeTruthy();
  });
});
