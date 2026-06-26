import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'catalogAssets',
  access: (allow) => ({
    'catalog/product-images/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
  }),
});
