import type { ReactNode, SubmitEvent } from 'react';
import type { StorefrontClientConfig, StorefrontTheme } from '@credo/shared';

export type Organization = {
  id: string;
  name: string | null;
  slug: string | null;
};

export type Product = {
  id: string;
  name: string | null;
  description: string | null;
  price: number | null;
  currency: string | null;
  inStock: boolean | null;
  organizationId: string | null;
};

export type UserRole = 'MERCHANT' | 'CUSTOMER';
export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';
export type OtpStep = 'request-code' | 'confirm-code';

export type AuthState = {
  status: AuthStatus;
  role: UserRole | null;
  email: string | null;
};

export type AppProps = {
  clientConfig: StorefrontClientConfig;
  theme: StorefrontTheme;
};

export type CardProps = {
  title: string;
  theme: StorefrontTheme;
  children: ReactNode;
};

export type SignInCardProps = {
  theme: StorefrontTheme;
  otpStep: OtpStep;
  email: string;
  code: string;
  error: string | null;
  loading: boolean;
  onChangeEmail: (value: string) => void;
  onChangeCode: (value: string) => void;
  onRequestCode: (event: SubmitEvent<HTMLFormElement>) => Promise<void>;
  onConfirmCode: (event: SubmitEvent<HTMLFormElement>) => Promise<void>;
};

export type AdminCatalogProps = {
  theme: StorefrontTheme;
  currency: string;
};

export type RoutePlaceholderProps = {
  title: string;
  details: string;
  theme: StorefrontTheme;
};

export type ThemeOnlyProps = {
  theme: StorefrontTheme;
};

export type ServerRoutePageProps = {
  pathLabel: string;
  theme: StorefrontTheme;
};

export type AdminGuardProps = {
  auth: AuthState;
  theme: StorefrontTheme;
  children: ReactNode;
  signInNode: ReactNode;
};
