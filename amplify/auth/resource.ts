import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    phone: {
      otpLogin: true,
    },
  },
  groups: ['MERCHANT', 'CUSTOMER'],
  accountRecovery: 'PHONE_ONLY_WITHOUT_MFA',
  passwordlessOptions: {
    preferredChallenge: 'SMS_OTP',
  },
});
