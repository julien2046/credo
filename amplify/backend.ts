import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { checkout } from './functions/checkout/resource';
import { stripeWebhook } from './functions/orders/resource';
import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  storage,
  checkout,
  stripeWebhook,
});

const products = backend.data.resources.tables.Product;
products.grant(backend.checkout.resources.lambda, 'dynamodb:BatchGetItem');
backend.checkout.addEnvironment('PRODUCT_TABLE', products.tableName);

// No AppSync model or browser IAM grant: only the signed webhook writes orders.
const scope = backend.stripeWebhook.stack;
const orders = new Table(scope, 'PaidOrders', {
  partitionKey: { name: 'id', type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
});
orders.grant(
  backend.stripeWebhook.resources.lambda,
  'dynamodb:GetItem',
  'dynamodb:PutItem'
);
backend.stripeWebhook.addEnvironment('ORDERS_TABLE', orders.tableName);
// Use the root deployment identity, not CLIENT_ID (which is shared by staging/prod).
backend.checkout.addEnvironment('CHECKOUT_SCOPE', backend.stack.stackId);
backend.stripeWebhook.addEnvironment('CHECKOUT_SCOPE', backend.stack.stackId);

const api = new HttpApi(scope, 'StripeEvents');
const path = '/api/stripe/webhook';
api.addRoutes({
  path,
  methods: [HttpMethod.POST],
  integration: new HttpLambdaIntegration(
    'StripeWebhook',
    backend.stripeWebhook.resources.lambda
  ),
});
backend.addOutput({
  custom: {
    stripeWebhookUrl: api.apiEndpoint + path,
    ordersTableName: orders.tableName,
  },
});
