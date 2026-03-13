import { type SubmitEvent, useEffect, useState } from 'react';
import {
  confirmSignIn,
  fetchAuthSession,
  getCurrentUser,
  signIn,
  signOut,
} from 'aws-amplify/auth';
import type {
  AuthState,
  OtpStep,
  StorefrontAuthHookResult,
} from './app.types';
import { resolveRoleFromSession } from './app.utils';

/**
 * Centralise l'etat et les transitions du flux d'authentification storefront.
 */
export function useStorefrontAuth(): StorefrontAuthHookResult {
  const [auth, setAuth] = useState<AuthState>({
    status: 'loading',
    role: null,
    email: null,
  });
  const [otpStep, setOtpStep] = useState<OtpStep>('request-code');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  /**
   * Recharge l'etat de session Cognito et deduit le role applicatif.
   */
  const refreshSession = async () => {
    try {
      const user = await getCurrentUser();
      const session = await fetchAuthSession();
      const payload = (session.tokens?.idToken?.payload ?? {}) as Record<
        string,
        unknown
      >;
      const role = resolveRoleFromSession(payload);

      setAuth({
        status: 'signedIn',
        role,
        email: user?.signInDetails?.loginId ?? user?.username ?? null,
      });
    } catch {
      setAuth({
        status: 'signedOut',
        role: null,
        email: null,
      });
    }
  };

  useEffect(() => {
    void refreshSession();
  }, []);

  /**
   * Demarre la connexion passwordless par email OTP.
   */
  const handleRequestOtp = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const result = await signIn({
        username: email.trim(),
        options: {
          authFlowType: 'USER_AUTH',
          preferredChallenge: 'EMAIL_OTP',
        },
      });

      const step = result.nextStep.signInStep;

      if (step === 'DONE') {
        await refreshSession();
        return;
      }

      if (step === 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE') {
        setOtpStep('confirm-code');
        return;
      }

      setAuthError(`Etape de connexion non supportee: ${step}`);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Impossible de lancer la connexion OTP.';
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  /**
   * Valide le code OTP saisi et finalise la connexion.
   */
  const handleConfirmOtp = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const result = await confirmSignIn({
        challengeResponse: otpCode.trim(),
      });

      if (result.nextStep.signInStep !== 'DONE') {
        setAuthError(
          `Etape de connexion non finalisee: ${result.nextStep.signInStep}`
        );
        return;
      }

      setOtpCode('');
      setOtpStep('request-code');
      await refreshSession();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Code OTP invalide.';
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  /**
   * Termine la session utilisateur et reinitialise l'etat local d'auth.
   */
  const handleSignOut = async () => {
    await signOut();
    setAuth({
      status: 'signedOut',
      role: null,
      email: null,
    });
    setOtpStep('request-code');
    setOtpCode('');
  };

  return {
    auth,
    otpStep,
    email,
    otpCode,
    authLoading,
    authError,
    setEmail,
    setOtpCode,
    handleRequestOtp,
    handleConfirmOtp,
    handleSignOut,
  };
}
