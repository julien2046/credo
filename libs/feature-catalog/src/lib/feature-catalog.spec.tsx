import { render } from '@testing-library/react';

import OrgFeatureCatalog from './feature-catalog';

describe('OrgFeatureCatalog', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<OrgFeatureCatalog />);
    expect(baseElement).toBeTruthy();
  });
});
