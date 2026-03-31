import {
  Box,
  Button,
  Alert,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { StorefrontCard } from '@credo/ui';
import type { AuthCardProps } from './auth.types';

/**
 * Gère les flux passwordless de création de compte et de connexion par SMS.
 */
export function AuthCard({
  theme,
  authMode,
  otpStep,
  signUpStep,
  phoneNumber,
  code,
  error,
  infoMessage,
  loading,
  onChangePhoneNumber,
  onChangeCode,
  onSwitchMode,
  onRequestOtp,
  onConfirmOtp,
  onRequestSignUp,
  onConfirmSignUp,
}: AuthCardProps) {
  const isSignIn = authMode === 'sign-in';
  const isRequestOtp = isSignIn && otpStep === 'request-code';
  const isConfirmOtp = isSignIn && otpStep === 'confirm-code';
  const isRequestSignUp = authMode === 'sign-up' && signUpStep === 'collect-phone';
  const isConfirmSignUp =
    authMode === 'sign-up' && signUpStep === 'confirm-sign-up';
  const currentStepTitle = isRequestOtp
    ? 'Connexion par SMS'
    : isConfirmOtp
      ? 'Confirmation du code SMS'
      : isRequestSignUp
        ? 'Creation du compte marchand'
        : 'Validation du compte';
  const currentStepDetails = isRequestOtp
    ? 'Saisis un numero en format international pour recevoir un OTP.'
    : isConfirmOtp
      ? 'Entre le code envoye par SMS pour terminer la connexion.'
      : isRequestSignUp
        ? 'Le compte est cree a partir du numero de telephone saisi.'
        : 'Confirme le compte avec le code recu avant la premiere connexion.';

  return (
    <StorefrontCard title="Authentification passwordless" theme={theme}>
      <Stack spacing={2.5}>
        <Typography sx={{ color: theme.mutedTextColor }}>
          Flux court terme pour acceder au backoffice via OTP SMS, sans mot de
          passe.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button
            variant={isSignIn ? 'contained' : 'outlined'}
            onClick={() => onSwitchMode('sign-in')}
            disabled={loading}
            fullWidth
          >
            Se connecter
          </Button>
          <Button
            variant={authMode === 'sign-up' ? 'contained' : 'outlined'}
            onClick={() => onSwitchMode('sign-up')}
            disabled={loading}
            fullWidth
          >
            Creer un compte
          </Button>
        </Stack>

        <Paper
          variant="outlined"
          sx={{
            p: 2.25,
            borderRadius: 2.5,
            borderColor: alpha(theme.accentColor, 0.12),
            backgroundColor: alpha(theme.accentColor, 0.08),
          }}
        >
          <Typography
            variant="overline"
            sx={{
              color: theme.mutedTextColor,
              letterSpacing: '0.08em',
              fontWeight: 700,
            }}
          >
            Etape active
          </Typography>
          <Typography variant="h6" sx={{ mt: 0.25, mb: 0.5 }}>
            {currentStepTitle}
          </Typography>
          <Typography sx={{ color: theme.mutedTextColor }}>
            {currentStepDetails}
          </Typography>
        </Paper>

        {infoMessage ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            {infoMessage}
          </Alert>
        ) : null}

        {isRequestOtp ? (
          <Box
            component="form"
            onSubmit={onRequestOtp}
            sx={{ display: 'grid', gap: 2 }}
          >
            <TextField
              id="phone-number-sign-in"
              label="Numero de telephone"
              type="tel"
              required
              fullWidth
              value={phoneNumber}
              onChange={(event) => onChangePhoneNumber(event.currentTarget.value)}
              placeholder="+15145551234"
              variant="outlined"
              helperText="Format recommande: +15145551234"
            />
            <Button
              type="submit"
              disabled={loading || !phoneNumber.trim()}
              variant="contained"
              size="large"
              sx={{
                py: 1.3,
                fontFamily: theme.accentFontFamily,
                fontWeight: 700,
              }}
            >
              {loading ? 'Envoi...' : 'Recevoir un code SMS'}
            </Button>
          </Box>
        ) : null}

        {isConfirmOtp ? (
          <Box
            component="form"
            onSubmit={onConfirmOtp}
            sx={{ display: 'grid', gap: 2 }}
          >
            <TextField
              id="sms-otp-code"
              label="Code SMS"
              required
              fullWidth
              value={code}
              onChange={(event) => onChangeCode(event.currentTarget.value)}
              placeholder="123456"
              variant="outlined"
            />
            <Button
              type="submit"
              disabled={loading || !code.trim()}
              variant="contained"
              size="large"
              sx={{
                py: 1.3,
                fontFamily: theme.accentFontFamily,
                fontWeight: 700,
              }}
            >
              {loading ? 'Validation...' : 'Valider le code SMS'}
            </Button>
          </Box>
        ) : null}

        {isRequestSignUp ? (
          <Box
            component="form"
            onSubmit={onRequestSignUp}
            sx={{ display: 'grid', gap: 2 }}
          >
            <TextField
              id="phone-number-sign-up"
              label="Numero de telephone"
              type="tel"
              required
              fullWidth
              value={phoneNumber}
              onChange={(event) => onChangePhoneNumber(event.currentTarget.value)}
              placeholder="+15145551234"
              variant="outlined"
              helperText="Le compte sera cree avec ce numero."
            />
            <Button
              type="submit"
              disabled={loading || !phoneNumber.trim()}
              variant="contained"
              size="large"
              sx={{
                py: 1.3,
                fontFamily: theme.accentFontFamily,
                fontWeight: 700,
              }}
            >
              {loading ? 'Creation...' : 'Creer le compte'}
            </Button>
          </Box>
        ) : null}

        {isConfirmSignUp ? (
          <Box
            component="form"
            onSubmit={onConfirmSignUp}
            sx={{ display: 'grid', gap: 2 }}
          >
            <TextField
              id="sign-up-code"
              label="Code de confirmation"
              required
              fullWidth
              value={code}
              onChange={(event) => onChangeCode(event.currentTarget.value)}
              placeholder="123456"
              variant="outlined"
            />
            <Button
              type="submit"
              disabled={loading || !code.trim()}
              variant="contained"
              size="large"
              sx={{
                py: 1.3,
                fontFamily: theme.accentFontFamily,
                fontWeight: 700,
              }}
            >
              {loading ? 'Confirmation...' : 'Confirmer le compte'}
            </Button>
          </Box>
        ) : null}

        {error ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        ) : null}
      </Stack>
    </StorefrontCard>
  );
}
