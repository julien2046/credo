import { type SubmitEvent, useEffect, useState } from 'react';
import {
  confirmSignUp,
  confirmSignIn,
  fetchAuthSession,
  getCurrentUser,
  signIn,
  signUp,
  signOut,
} from 'aws-amplify/auth';
import type {
  AuthMode,
  AuthState,
  OtpStep,
  SignUpStep,
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
    identifier: null,
  });
  const [authMode, setAuthModeState] = useState<AuthMode>('sign-in');
  const [otpStep, setOtpStep] = useState<OtpStep>('request-code');
  const [signUpStep, setSignUpStep] = useState<SignUpStep>('collect-phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfoMessage, setAuthInfoMessage] = useState<string | null>(null);

  /**
   * Remet a zero les etats de saisie transitoires.
   */
  const resetFlowState = () => {
    setOtpStep('request-code');
    setSignUpStep('collect-phone');
    setAuthCode('');
    setAuthError(null);
    setAuthInfoMessage(null);
  };

  /**
   * Bascule entre connexion et creation de compte.
   */
  const setAuthMode = (mode: AuthMode) => {
    setAuthModeState(mode);
    resetFlowState();
  };

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
        identifier: user?.signInDetails?.loginId ?? user?.username ?? null,
      });
    } catch {
      setAuth({
        status: 'signedOut',
        role: null,
        identifier: null,
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
    setAuthInfoMessage(null);
    setAuthLoading(true);

    try {
      const result = await signIn({
        username: phoneNumber.trim(),
        options: {
          authFlowType: 'USER_AUTH',
          preferredChallenge: 'SMS_OTP',
        },
      });

      const step = result.nextStep.signInStep;

      if (step === 'DONE') {
        await refreshSession();
        return;
      }

      if (step === 'CONFIRM_SIGN_IN_WITH_SMS_CODE') {
        setOtpStep('confirm-code');
        setAuthInfoMessage('Un code SMS a ete envoye a votre numero.');
        return;
      }

      setAuthError(`Etape de connexion non supportee: ${step}`);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Impossible de lancer la connexion SMS OTP.';
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
    setAuthInfoMessage(null);
    setAuthLoading(true);

    try {
      const result = await confirmSignIn({
        challengeResponse: authCode.trim(),
      });

      if (result.nextStep.signInStep !== 'DONE') {
        setAuthError(
          `Etape de connexion non finalisee: ${result.nextStep.signInStep}`
        );
        return;
      }

      resetFlowState();
      await refreshSession();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Code OTP invalide.';
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  /**
   * Cree un compte passwordless avec numero de telephone.
   */
  const handleRequestSignUp = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setAuthInfoMessage(null);
    setAuthLoading(true);

    try {
      const result = await signUp({
        username: phoneNumber.trim(),
        options: {
          userAttributes: {
            phone_number: phoneNumber.trim(),
          },
        },
      });

      if (result.nextStep.signUpStep === 'DONE') {
        setAuthModeState('sign-in');
        setAuthInfoMessage(
          'Compte cree. Vous pouvez maintenant demander un code de connexion.'
        );
        return;
      }

      if (result.nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setSignUpStep('confirm-sign-up');
        setAuthInfoMessage('Confirmez votre compte avec le code SMS recu.');
        return;
      }

      setAuthError(
        `Etape de creation de compte non supportee: ${result.nextStep.signUpStep}`
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Impossible de creer le compte.';
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  /**
   * Confirme le compte cree avec le code SMS de verification.
   */
  const handleConfirmSignUp = async (
    event: SubmitEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setAuthError(null);
    setAuthInfoMessage(null);
    setAuthLoading(true);

    try {
      const result = await confirmSignUp({
        username: phoneNumber.trim(),
        confirmationCode: authCode.trim(),
      });

      if (result.nextStep.signUpStep === 'DONE') {
        setAuthModeState('sign-in');
        resetFlowState();
        setAuthInfoMessage(
          'Compte confirme. Vous pouvez maintenant demander un code de connexion.'
        );
        return;
      }

      setAuthError(
        `Etape de confirmation non supportee: ${result.nextStep.signUpStep}`
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Impossible de confirmer le compte.';
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
      identifier: null,
    });
    resetFlowState();
  };

  return {
    auth,
    authMode,
    otpStep,
    signUpStep,
    phoneNumber,
    authCode,
    authLoading,
    authError,
    authInfoMessage,
    setAuthMode,
    setPhoneNumber,
    setAuthCode,
    handleRequestOtp,
    handleConfirmOtp,
    handleRequestSignUp,
    handleConfirmSignUp,
    handleSignOut,
  };
}
