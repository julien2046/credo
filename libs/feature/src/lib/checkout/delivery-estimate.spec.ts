import {
  getDeliveryFeeCents,
  validateQuebecPostalCode,
} from './delivery-estimate';

describe('delivery estimate', () => {
  it.each(['g1a1a1', ' H2X 1Y4 ', 'J1A 1A1'])(
    'accepts a Quebec postal code in a supported format: %s',
    (code) => expect(validateQuebecPostalCode(code)).toBe(true)
  );

  it('distinguishes an unsupported zone from a malformed postal code', () => {
    expect(validateQuebecPostalCode('M5V 3A8')).toMatch(/Québec/);
    expect(validateQuebecPostalCode('H2X')).toMatch(/format/);
    expect(validateQuebecPostalCode('H2D 1Y4')).toMatch(/format/);
  });

  it('uses the configured CAD fee, including free delivery', () => {
    expect(getDeliveryFeeCents({ quebecFlatRateCents: 995 }, 'CAD')).toBe(995);
    expect(getDeliveryFeeCents({ quebecFlatRateCents: 0 }, 'CAD')).toBe(0);
    expect(getDeliveryFeeCents({ quebecFlatRateCents: 995 }, 'EUR')).toBeNull();
    expect(getDeliveryFeeCents({ quebecFlatRateCents: -1 }, 'CAD')).toBeNull();
    expect(getDeliveryFeeCents(undefined, 'CAD')).toBeNull();
  });
});
