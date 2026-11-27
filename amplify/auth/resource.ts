import { defineAuth } from '@aws-amplify/backend';
import { MERCHANT_GROUP } from '@credo/shared';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  groups: [MERCHANT_GROUP],
  loginWith: {
    phone: {
      otpLogin: true,
    },
  },
  accountRecovery: 'PHONE_ONLY_WITHOUT_MFA',
  passwordlessOptions: {
    preferredChallenge: 'SMS_OTP',
  },
});
