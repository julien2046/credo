import { render } from '@testing-library/react';

import OrgThemesClientA from './themes-client-a';

describe('OrgThemesClientA', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<OrgThemesClientA />);
    expect(baseElement).toBeTruthy();
  });
});
