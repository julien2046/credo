import { resolveClientId, resolveThemeId, shared } from './shared.js';

describe('shared', () => {
  it('should work', () => {
    expect(shared()).toEqual('shared');
  });

  it('should resolve unknown client ids to client-a', () => {
    expect(resolveClientId('unknown')).toBe('client-a');
    expect(resolveThemeId(undefined)).toBe('client-a');
  });
});
