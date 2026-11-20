import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { checkoutHandler } from './handler';
import { priceCart, readDelivery, type Product } from './quote';
import { sessionRequest, testSettings } from './stripe-session';

const cart = JSON.stringify([{ id: 'p1', quantity: 2 }]);
const address = {
  name: 'Client Test',
  email: 'client@example.com',
  address: '1 rue Test',
  city: 'Montréal',
  unit: '',
  postalCode: 'h2x 1y4',
};
const product: Product = {
  id: 'p1',
  name: 'Chaise',
  price: 19.95,
  currency: 'CAD',
  published: true,
  inStock: true,
};
const read = async () => [product];
test('uses only catalogue cents and configured delivery, including free delivery', async () => {
  const q = await priceCart(cart, address.postalCode, '995', read);
  assert.deepEqual(
    [q.subtotalCents, q.deliveryCents, q.totalCents],
    [3990, 995, 4985]
  );
  assert.equal(
    (await priceCart(cart, 'H2X1Y4', '995', read)).quoteId,
    q.quoteId
  );
  assert.equal((await priceCart(cart, 'H2X1Y4', '0', read)).totalCents, 3990);
});
test('rejects invalid baskets, destinations and missing shop config before reading products', async () => {
  const never = async () => {
    throw new Error('unexpected read');
  };
  for (const input of [
    '[]',
    '{}',
    '[',
    JSON.stringify([{ id: 'p1', quantity: 1, price: 1 }]),
    JSON.stringify([
      { id: 'p1', quantity: 1 },
      { id: 'p1', quantity: 1 },
    ]),
    ...[0, 1.1, 100].map((quantity) =>
      JSON.stringify([{ id: 'p1', quantity }])
    ),
  ]) {
    await assert.rejects(
      priceCart(input, 'H2X1Y4', '995', never),
      /INVALID_INPUT/
    );
  }
  await assert.rejects(
    priceCart(cart, 'M5V3A8', '995', never),
    /INVALID_INPUT/
  );
  await assert.rejects(
    priceCart(cart, 'H2X1Y4', '', never),
    /DELIVERY_DISABLED/
  );
});
test('rejects missing, unavailable or unpriceable products', async () => {
  for (const patch of [
    { id: 'another-id' },
    { published: false },
    { inStock: false },
    { currency: 'USD' },
    { price: -1 },
    { price: 0.001 },
    { price: 500000 },
  ]) {
    await assert.rejects(
      priceCart(cart, 'H2X1Y4', '995', async () => [{ ...product, ...patch }]),
      /CART_UNAVAILABLE/
    );
  }
});
test('validates test-only settings and server-defined return origin', () => {
  const env = {
    STRIPE_TEST_SECRET_KEY: 'sk_test_example',
    CHECKOUT_RETURN_ORIGIN: 'http://localhost:4200',
  };
  assert.ok(testSettings(env));
  for (const origin of [
    'http://example.org',
    'https://example.org/path',
    'https://user@example.org',
  ]) {
    assert.equal(
      testSettings({ ...env, CHECKOUT_RETURN_ORIGIN: origin }),
      null
    );
  }
  assert.equal(
    testSettings({ ...env, STRIPE_TEST_SECRET_KEY: 'sk_live_example' }),
    null
  );
});
test('builds a test session from the priced lines and validated destination; retries use the same key', async () => {
  const q = await priceCart(cart, address.postalCode, '995', read);
  const d = readDelivery(JSON.stringify(address));
  assert.throws(
    () => readDelivery(JSON.stringify({ ...address, email: 'invalid' })),
    /INVALID_INPUT/
  );
  const attempt = randomUUID();
  const request = sessionRequest(q, d, 'http://localhost:4200', attempt);
  assert.equal(
    request.params.payment_intent_data?.shipping?.address.postal_code,
    'H2X1Y4'
  );
  assert.equal(
    request.params.success_url,
    'http://localhost:4200/checkout/retour'
  );
  assert.deepEqual(
    request.params.line_items?.map((i) => [
      i.price_data?.unit_amount,
      i.quantity,
    ]),
    [
      [1995, 2],
      [995, 1],
    ]
  );
  assert.equal(
    request.idempotencyKey,
    sessionRequest(q, d, 'http://localhost:4200', attempt).idempotencyKey
  );
  assert.notEqual(
    request.idempotencyKey,
    sessionRequest(q, d, 'http://localhost:4200', randomUUID()).idempotencyKey
  );
});
test('rereads the database before redirect; price or stock changes never reach Stripe', async (t) => {
  t.after(() => {
    if (previous === undefined) delete process.env.DELIVERY_CENTS;
    else process.env.DELIVERY_CENTS = previous;
  });
  const previous = process.env.DELIVERY_CENTS;
  process.env.DELIVERY_CENTS = '995';
  let current = { ...product };
  const open = t.mock.fn(async () => 'https://checkout.stripe.com/example');
  const handle = checkoutHandler(async () => [current], open);
  const quote = await handle({
    fieldName: 'quoteCheckout',
    arguments: { cart, postalCode: address.postalCode },
  });
  assert.ok(typeof quote !== 'string');
  const pay = () =>
    handle({
      fieldName: 'startTestCheckout',
      arguments: {
        cart,
        delivery: JSON.stringify(address),
        attemptId: randomUUID(),
        quoteId: quote.quoteId,
      },
    });
  current = { ...current, price: 20 };
  await assert.rejects(pay(), /QUOTE_CHANGED/);
  current.inStock = false;
  await assert.rejects(pay(), /CART_UNAVAILABLE/);
  assert.equal(open.mock.callCount(), 0);
  current = product;
  assert.equal(await pay(), 'https://checkout.stripe.com/example');
  assert.equal(open.mock.callCount(), 1);
});
