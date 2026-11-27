import { defineStorage } from '@aws-amplify/backend';
import { MERCHANT_GROUP } from '@credo/shared';

export const storage = defineStorage({
  name: 'catalogAssets',
  access: (allow) => ({
    'catalog/product-images/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read']),
      allow.groups([MERCHANT_GROUP]).to(['read', 'write', 'delete']),
    ],
  }),
});
