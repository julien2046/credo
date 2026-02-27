import { render } from '@testing-library/react';

import OrgClientConfigClientA from './client-config-client-a';

describe('OrgClientConfigClientA', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<OrgClientConfigClientA />);
    expect(baseElement).toBeTruthy();
  });
});
