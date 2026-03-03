import { clientConfigClientA, getClientConfigClientA } from './client-config-client-a.js';

describe('clientConfigClientA', () => {
  it('should work', () => {
    expect(clientConfigClientA.clientId).toEqual('client-a');
    expect(getClientConfigClientA().brandName).toContain('Credo');
  });
});
