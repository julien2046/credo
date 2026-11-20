import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { checkout } from './functions/checkout/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  storage,
  checkout,
});

const products = backend.data.resources.tables.Product;
products.grant(backend.checkout.resources.lambda, 'dynamodb:BatchGetItem');
backend.checkout.addEnvironment('PRODUCT_TABLE', products.tableName);
