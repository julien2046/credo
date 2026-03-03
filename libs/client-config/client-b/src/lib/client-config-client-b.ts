import type { StorefrontClientConfig } from '@credo/shared';

export const clientConfigClientB: StorefrontClientConfig = {
  clientId: 'client-b',
  themeId: 'client-b',
  brandName: 'Maison Nord',
  brandTagline: 'Variation client pour valider le single-tenant avec une identite distincte.',
  locale: 'fr-CA',
  currency: 'CAD',
  enabledChannels: ['facebook', 'newsletter'],
  styleGuide: 'Ton direct, plus commerce de proximite, mise en avant du panier.',
  domainLabel: 'maison-nord.local',
};

export function getClientConfigClientB(): StorefrontClientConfig {
  return clientConfigClientB;
}
