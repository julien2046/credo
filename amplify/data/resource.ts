import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Organization: a
    .model({
      name: a.string().required(),
      slug: a.string().required(),
      categories: a.hasMany('Category', 'organizationId'),
      products: a.hasMany('Product', 'organizationId'),
    })
    .authorization((allow) => [allow.authenticated()]),

  Category: a
    .model({
      name: a.string().required(),
      slug: a.string().required(),
      description: a.string(),
      organizationId: a.id().required(),
      organization: a.belongsTo('Organization', 'organizationId'),
      products: a.hasMany('Product', 'categoryId'),
    })
    .authorization((allow) => [allow.authenticated()]),

  Product: a
    .model({
      name: a.string().required(),
      slug: a.string(),
      description: a.string(),
      price: a.float().required(),
      currency: a.string().default('EUR'),
      imageUrl: a.string(),
      inStock: a.boolean().default(true),
      published: a.boolean().default(false),
      organizationId: a.id().required(),
      organization: a.belongsTo('Organization', 'organizationId'),
      categoryId: a.id(),
      category: a.belongsTo('Category', 'categoryId'),
    })
    .authorization((allow) => [allow.authenticated()]),

  PublicCategory: a.customType({
    id: a.id().required(),
    name: a.string().required(),
    slug: a.string().required(),
    description: a.string(),
    organizationId: a.id().required(),
  }),

  PublicProduct: a.customType({
    id: a.id().required(),
    name: a.string().required(),
    slug: a.string().required(),
    description: a.string(),
    price: a.float().required(),
    currency: a.string(),
    imageUrl: a.string(),
    inStock: a.boolean(),
    organizationId: a.id().required(),
    categoryId: a.id(),
  }),

  listPublicCategories: a
    .query()
    .returns(a.ref('PublicCategory').array())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(
      a.handler.custom({
        dataSource: a.ref('Category'),
        entry: './list-public-categories.js',
      })
    ),

  listPublicProducts: a
    .query()
    .returns(a.ref('PublicProduct').array())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(
      a.handler.custom({
        dataSource: a.ref('Product'),
        entry: './list-public-products.js',
      })
    ),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
    },
  },
});
