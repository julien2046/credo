import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Organization: a
    .model({
      name: a.string().required(),
      slug: a.string().required(),
      products: a.hasMany('Product', 'organizationId'),
    })
    .authorization((allow) => [allow.authenticated()]),

  Product: a
    .model({
      name: a.string().required(),
      description: a.string(),
      price: a.float().required(),
      currency: a.string().default('EUR'),
      imageUrl: a.string(),
      inStock: a.boolean().default(true),
      organizationId: a.id().required(),
      organization: a.belongsTo('Organization', 'organizationId'),
    })
    .authorization((allow) => [allow.authenticated()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
