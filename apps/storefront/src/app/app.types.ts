import type { ReactNode, SubmitEvent } from 'react';
import type { StorefrontClientConfig, StorefrontTheme } from '@credo/shared';

export type ProductFormValues = {
  name: string;
  description: string;
  price: string;
  organizationId: string;
};

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';
export type OtpStep = 'request-code' | 'confirm-code';
export type AuthMode = 'sign-in' | 'sign-up';
export type SignUpStep = 'collect-phone' | 'confirm-sign-up';

export type AuthState = {
  status: AuthStatus;
  identifier: string | null;
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

export type AuthCardProps = {
  theme: StorefrontTheme;
  authMode: AuthMode;
  otpStep: OtpStep;
  signUpStep: SignUpStep;
  phoneNumber: string;
  code: string;
  error: string | null;
  infoMessage: string | null;
  loading: boolean;
  onChangePhoneNumber: (value: string) => void;
  onChangeCode: (value: string) => void;
  onSwitchMode: (mode: AuthMode) => void;
  onRequestOtp: (event: SubmitEvent<HTMLFormElement>) => Promise<void>;
  onConfirmOtp: (event: SubmitEvent<HTMLFormElement>) => Promise<void>;
  onRequestSignUp: (event: SubmitEvent<HTMLFormElement>) => Promise<void>;
  onConfirmSignUp: (event: SubmitEvent<HTMLFormElement>) => Promise<void>;
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

export type StorefrontAuthHookResult = {
  auth: AuthState;
  authMode: AuthMode;
  otpStep: OtpStep;
  signUpStep: SignUpStep;
  phoneNumber: string;
  authCode: string;
  authLoading: boolean;
  authError: string | null;
  authInfoMessage: string | null;
  setAuthMode: (mode: AuthMode) => void;
  setPhoneNumber: (value: string) => void;
  setAuthCode: (value: string) => void;
  handleRequestOtp: (event: SubmitEvent<HTMLFormElement>) => Promise<void>;
  handleConfirmOtp: (event: SubmitEvent<HTMLFormElement>) => Promise<void>;
  handleRequestSignUp: (event: SubmitEvent<HTMLFormElement>) => Promise<void>;
  handleConfirmSignUp: (
    event: SubmitEvent<HTMLFormElement>
  ) => Promise<void>;
  handleSignOut: () => Promise<void>;
};
