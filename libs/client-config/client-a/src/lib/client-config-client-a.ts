import type { StorefrontClientConfig } from '@credo/shared';

export const clientConfigClientA: StorefrontClientConfig = {
  clientId: 'client-a',
  themeId: 'client-a',
  brandName: 'Credo Atelier',
  brandTagline: 'Boutique e-commerce de reference pour valider le socle produit.',
  locale: 'fr-CA',
  currency: 'CAD',
  enabledChannels: ['instagram', 'newsletter'],
  styleGuide: 'Editorial premium, produits mis en avant avec un ton rassurant.',
  domainLabel: 'demo.credo.local',
};

export function getClientConfigClientA(): StorefrontClientConfig {
  return clientConfigClientA;
}
