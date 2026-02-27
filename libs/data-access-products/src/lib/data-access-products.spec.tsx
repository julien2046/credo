import { render } from '@testing-library/react';

import OrgDataAccessProducts from './data-access-products';

describe('OrgDataAccessProducts', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<OrgDataAccessProducts />);
    expect(baseElement).toBeTruthy();
  });
});
