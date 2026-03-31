import { type SubmitEvent, useEffect, useState } from 'react';
import {
  confirmSignUp,
  confirmSignIn,
  getCurrentUser,
  signIn,
  signUp,
  signOut,
  type SignInOutput,
} from 'aws-amplify/auth';
import type {
  AuthMode,
  AuthState,
  OtpStep,
  SignUpStep,
  StorefrontAuthHookResult,
} from './auth.types';

/**
 * Centralise l'état et les transitions du flux d'authentification storefront.
 */
export function useStorefrontAuth(): StorefrontAuthHookResult {
  const [auth, setAuth] = useState<AuthState>({
    status: 'loading',
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
   * Remet à zéro les états de saisie transitoires.
   */
  const resetFlowState = () => {
    setOtpStep('request-code');
    setSignUpStep('collect-phone');
    setAuthCode('');
    setAuthError(null);
    setAuthInfoMessage(null);
  };

  /**
   * Bascule entre connexion et création de compte.
   */
  const setAuthMode = (mode: AuthMode) => {
    setAuthModeState(mode);
    resetFlowState();
  };

  /**
   * Recharge l'état de session Cognito.
   */
  const refreshSession = async () => {
    try {
      const user = await getCurrentUser();

      setAuth({
        status: 'signedIn',
        identifier: user?.signInDetails?.loginId ?? user?.username ?? null,
      });
    } catch {
      setAuth({
        status: 'signedOut',
        identifier: null,
      });
    }
  };

  useEffect(() => {
    void refreshSession();
  }, []);

  /**
   * Gère les étapes Cognito du flow USER_AUTH pour fiabiliser le SMS OTP.
   */
  const handleNextSignInStep = async (nextStep: SignInOutput['nextStep']) => {
    switch (nextStep.signInStep) {
      case 'DONE':
        await refreshSession();
        return;
      case 'CONFIRM_SIGN_IN_WITH_SMS_CODE':
        setOtpStep('confirm-code');
        setAuthInfoMessage('Un code SMS a ete envoye a votre numero.');
        return;
      case 'CONTINUE_SIGN_IN_WITH_FIRST_FACTOR_SELECTION': {
        const availableChallenges = nextStep.availableChallenges ?? [];

        if (!availableChallenges.includes('SMS_OTP')) {
          const challengeList =
            availableChallenges.length > 0
              ? availableChallenges.join(', ')
              : 'aucun';

          setAuthError(
            `SMS OTP n'est pas disponible pour ce compte. Challenges disponibles: ${challengeList}.`
          );
          return;
        }

        const selectionResult = await confirmSignIn({
          challengeResponse: 'SMS_OTP',
        });

        await handleNextSignInStep(selectionResult.nextStep);
        return;
      }
      default:
        setAuthError(`Etape de connexion non supportee: ${nextStep.signInStep}`);
    }
  };

  /**
   * Démarre la connexion passwordless par SMS OTP.
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

      await handleNextSignInStep(result.nextStep);
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

      resetFlowState();
      await handleNextSignInStep(result.nextStep);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Code OTP invalide.';
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  /**
   * Crée un compte passwordless avec numéro de téléphone.
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
   * Confirme le compte créé avec le code SMS de vérification.
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
   * Termine la session utilisateur et réinitialise l'état local d'auth.
   */
  const handleSignOut = async () => {
    setAuthError(null);
    setAuthInfoMessage(null);

    await signOut();
    resetFlowState();
    setAuth({
      status: 'signedOut',
      identifier: null,
    });
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
