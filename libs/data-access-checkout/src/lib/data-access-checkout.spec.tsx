import { render } from '@testing-library/react';

import OrgDataAccessCheckout from './data-access-checkout';

describe('OrgDataAccessCheckout', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<OrgDataAccessCheckout />);
    expect(baseElement).toBeTruthy();
  });
});
