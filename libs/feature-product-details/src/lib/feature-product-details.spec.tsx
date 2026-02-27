import { render } from '@testing-library/react';

import OrgFeatureProductDetails from './feature-product-details';

describe('OrgFeatureProductDetails', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<OrgFeatureProductDetails />);
    expect(baseElement).toBeTruthy();
  });
});
