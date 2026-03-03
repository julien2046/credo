import { clientConfigClientA } from '@credo/client-config-client-a';
import { clientConfigClientB } from '@credo/client-config-client-b';
import {
  resolveClientId,
  resolveThemeId,
  type ClientId,
  type StorefrontClientConfig,
  type StorefrontTheme,
  type ThemeId,
} from '@credo/shared';
import { clientATheme } from '@credo/themes-client-a';
import { clientBTheme } from '@credo/themes-client-b';

type StorefrontEnv = {
  readonly CLIENT_ID?: string;
  readonly THEME_ID?: string;
};

export type StorefrontBootstrap = {
  clientConfig: StorefrontClientConfig;
  theme: StorefrontTheme;
};

const clientConfigRegistry: Record<ClientId, StorefrontClientConfig> = {
  'client-a': clientConfigClientA,
  'client-b': clientConfigClientB,
};

const themeRegistry: Record<ThemeId, StorefrontTheme> = {
  'client-a': clientATheme,
  'client-b': clientBTheme,
};

export function resolveStorefrontBootstrap(): StorefrontBootstrap {
  const env = import.meta.env as ImportMetaEnv & StorefrontEnv;
  const clientId = resolveClientId(env.CLIENT_ID);
  const requestedThemeId = resolveThemeId(env.THEME_ID, clientConfigRegistry[clientId].themeId);

  return {
    clientConfig: clientConfigRegistry[clientId],
    theme: themeRegistry[requestedThemeId],
  };
}
