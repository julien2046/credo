import { render } from '@testing-library/react';

import OrgThemesClientB from './themes-client-b';

describe('OrgThemesClientB', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<OrgThemesClientB />);
    expect(baseElement).toBeTruthy();
  });
});
