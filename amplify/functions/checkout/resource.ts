import { defineFunction, secret } from '@aws-amplify/backend';
import { clientConfigClientA } from '@credo/client-config-client-a';
import { clientConfigClientB } from '@credo/client-config-client-b';

const shop = [clientConfigClientA, clientConfigClientB].find(
  (config) => config.clientId === process.env.CLIENT_ID
);
const origin = process.env.CHECKOUT_RETURN_ORIGIN;

export const checkout = defineFunction({
  resourceGroupName: 'data',
  runtime: 22,
  timeoutSeconds: 25,
  environment: {
    DELIVERY_CENTS: String(
      shop?.currency === 'CAD' ? shop.delivery?.quebecFlatRateCents : ''
    ),
    ...(shop && origin && process.env.STRIPE_ORDERS_ENABLED === 'true'
      ? {
          CHECKOUT_RETURN_ORIGIN: origin,
          STRIPE_TEST_SECRET_KEY: secret('STRIPE_TEST_SECRET_KEY'),
        }
      : {}),
  },
});
