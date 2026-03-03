export const clientIds = ['client-a', 'client-b'] as const;

export type ClientId = (typeof clientIds)[number];
export type ThemeId = ClientId;
export type EnabledChannel = 'instagram' | 'facebook' | 'newsletter';

export type StorefrontClientConfig = {
  clientId: ClientId;
  themeId: ThemeId;
  brandName: string;
  brandTagline: string;
  locale: string;
  currency: string;
  enabledChannels: EnabledChannel[];
  styleGuide: string;
  domainLabel: string;
};

export type StorefrontTheme = {
  id: ThemeId;
  name: string;
  fontFamily: string;
  accentFontFamily: string;
  background: string;
  surface: string;
  textColor: string;
  mutedTextColor: string;
  accentColor: string;
  accentContrastColor: string;
  borderColor: string;
};

export function shared(): string {
  return 'shared';
}

export function isClientId(value: string | undefined): value is ClientId {
  return typeof value === 'string' && clientIds.includes(value as ClientId);
}

export function resolveClientId(
  value: string | undefined,
  fallback: ClientId = 'client-a'
): ClientId {
  return isClientId(value) ? value : fallback;
}

export function resolveThemeId(
  value: string | undefined,
  fallback: ThemeId = 'client-a'
): ThemeId {
  return isClientId(value) ? value : fallback;
}
