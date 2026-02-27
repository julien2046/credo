import { render } from '@testing-library/react';

import OrgFeatureCart from './feature-cart';

describe('OrgFeatureCart', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<OrgFeatureCart />);
    expect(baseElement).toBeTruthy();
  });
});
