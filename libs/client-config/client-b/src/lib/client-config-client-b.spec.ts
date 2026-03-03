import { clientConfigClientB, getClientConfigClientB } from './client-config-client-b.js';

describe('clientConfigClientB', () => {
  it('should work', () => {
    expect(clientConfigClientB.clientId).toEqual('client-b');
    expect(getClientConfigClientB().enabledChannels).toContain('facebook');
  });
});
