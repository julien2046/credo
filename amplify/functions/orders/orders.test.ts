import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ConditionalCheckFailedException,
  DynamoDBClient,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import Stripe from 'stripe';
import { orderWebhook } from './handler';
import { paidOrder, type PaidOrder } from './paid-order';
import { orderRepository } from './repository';

const scope = 'test-shop';
const secret = 'whsec_fixture_only';
const session = {
  id: 'cs_test_one',
  object: 'checkout.session',
  mode: 'payment',
  status: 'complete',
  livemode: false,
  payment_status: 'paid',
  amount_total: 5995,
  currency: 'cad',
  customer_email: 'test@example.org',
  metadata: { credoScope: scope, quoteId: 'demo' },
  payment_intent: {
    id: 'pi_demo',
    status: 'succeeded',
    amount_received: 5995,
    livemode: false,
    currency: 'cad',
    shipping: {
      name: 'Test',
      address: {
        line1: '10 rue Test',
        city: 'Montréal',
        state: 'QC',
        postal_code: 'H2X1Y4',
        country: 'CA',
      },
    },
  },
};
const product = {
  description: 'Lampe',
  quantity: 2,
  amount_total: 5000,
  currency: 'cad',
  price: {
    unit_amount: 2500,
    currency: 'cad',
    product: { metadata: { productId: 'p1' } },
  },
};
const shipping = {
  description: 'Frais',
  quantity: 1,
  amount_total: 995,
  currency: 'cad',
  price: {
    unit_amount: 995,
    currency: 'cad',
    product: { metadata: { kind: 'delivery' } },
  },
};
const snapshot = {
  session,
  lines: { has_more: false, data: [product, shipping] },
};
const completed = {
  type: 'checkout.session.completed',
  id: 'evt_one',
  object: 'event',
  livemode: false,
  created: 1700000000,
  data: { object: session },
};
function signed(event: unknown = completed, base64 = false) {
  const raw = JSON.stringify(event);
  return {
    body: base64 ? Buffer.from(raw).toString('base64') : raw,
    isBase64Encoded: base64,
    headers: {
      'Stripe-Signature': Stripe.webhooks.generateTestHeaderString({
        payload: raw,
        secret,
      }),
    },
  };
}
function setup() {
  const saved = new Map<string, PaidOrder>();
  const deps = {
    secret,
    scope,
    load: async (id: string) => {
      assert.equal(id, session.id);
      return snapshot;
    },
    orders: {
      exists: async (id: string) => saved.has(id),
      insert: async (o: PaidOrder) => {
        assert.ok(!saved.has(o.id));
        saved.set(o.id, o);
      },
    },
  };
  return { saved, deps };
}

test('creates one complete test order from a signed paid session, independently of the browser', async () => {
  const { saved, deps } = setup();
  const handle = orderWebhook(deps);
  assert.equal((await handle(signed(completed, true))).statusCode, 200);
  const order = saved.get(session.id);
  assert.ok(order);
  assert.deepEqual(order.lines, [
    { productId: 'p1', name: 'Lampe', quantity: 2, unitCents: 2500 },
  ]);
  assert.deepEqual(
    [
      order.status,
      order.currency,
      order.subtotalCents,
      order.deliveryCents,
      order.totalCents,
      order.testMode,
    ],
    ['PAID', 'CAD', 5000, 995, 5995, true]
  );
  assert.equal(order.email, session.customer_email);
  assert.deepEqual(order.shipping, session.payment_intent.shipping);
  assert.equal(order.paymentIntentId, 'pi_demo');
  for (const event of [
    completed,
    {
      ...completed,
      type: 'checkout.session.async_payment_succeeded',
      id: 'evt_two',
    },
  ]) {
    assert.equal((await handle(signed(event))).statusCode, 200);
  }
  assert.equal(saved.size, 1);
  assert.equal(saved.get(session.id)?.stripeEventId, 'evt_one');
});

test('rejects unsigned, wrong-secret, expired and altered requests before accessing data', async (t) => {
  const { deps } = setup();
  const exists = t.mock.method(deps.orders, 'exists');
  const req = signed();
  const handle = orderWebhook(deps);
  for (const input of [
    { ...req, headers: {} },
    { ...req, body: req.body + ' ' },
    ...[{ secret: 'whsec_other' }, { secret, timestamp: 1600000000 }].map(
      (opts) => ({
        ...req,
        headers: {
          'stripe-signature': Stripe.webhooks.generateTestHeaderString({
            ...opts,
            payload: req.body,
          }),
        },
      })
    ),
  ]) {
    assert.equal((await handle(input)).statusCode, 400);
  }
  assert.equal(exists.mock.callCount(), 0);
});

test('ignores failed, expired, live, unrelated and unpaid events; accepts subsequent delayed payment', async (t) => {
  const { saved, deps } = setup();
  const exists = t.mock.method(deps.orders, 'exists');
  const handle = orderWebhook(deps);
  for (const event of [
    { ...completed, livemode: true },
    { ...completed, type: 'checkout.session.expired' },
    { ...completed, type: 'checkout.session.async_payment_failed' },
    ...[
      { payment_status: 'unpaid' },
      { mode: 'subscription' },
      { livemode: true },
      { metadata: {} },
      { metadata: { credoScope: 'another-shop' } },
    ].map((p) => ({ ...completed, data: { object: { ...session, ...p } } })),
  ]) {
    assert.equal((await handle(signed(event))).statusCode, 200);
  }
  assert.equal(exists.mock.callCount(), 0);
  assert.equal(
    (
      await handle(
        signed({
          ...completed,
          type: 'checkout.session.async_payment_succeeded',
        })
      )
    ).statusCode,
    200
  );
  assert.equal(saved.size, 1);
});

test('fails closed on partial lines, inconsistent totals or an unconfirmed or unrelated session', () => {
  for (const [s, ls] of [
    [{ ...session, payment_status: 'unpaid' }, snapshot.lines],
    [
      { ...session, metadata: { ...session.metadata, credoScope: 'foreign' } },
      snapshot.lines,
    ],
    [{ ...session, amount_total: 4995 }, snapshot.lines],
    [{ ...session, currency: 'usd' }, snapshot.lines],
    [session, { ...snapshot.lines, has_more: true }],
    [
      session,
      { has_more: false, data: [{ ...product, quantity: 1 }, shipping] },
    ],
    [session, { has_more: false, data: [shipping, shipping] }],
  ])
    assert.throws(() =>
      paidOrder(session.id, scope, completed.id, completed.created, s, ls)
    );
});

test('a storage or Stripe outage is retryable; success is acknowledged only after the write', async (t) => {
  const { deps, saved } = setup();
  t.mock.method(console, 'error', () => undefined);
  const handle = orderWebhook(deps);
  t.mock.method(deps, 'load').mock.mockImplementationOnce(async () => {
    throw new Error('offline');
  });
  // Construct after installing the mock as the loader is injected by value.
  assert.equal((await orderWebhook(deps)(signed())).statusCode, 500);
  t.mock.method(deps.orders, 'insert').mock.mockImplementationOnce(async () => {
    throw new Error('busy');
  });
  assert.equal((await handle(signed())).statusCode, 500);
  assert.equal(saved.size, 0);
  assert.equal((await handle(signed())).statusCode, 200);
  assert.equal(saved.size, 1);
});

test('concurrent notifications use conditional database writes and never replace an existing order', async (t) => {
  const store = new Map<string, unknown>();
  t.mock.method(
    DynamoDBClient.prototype,
    'send',
    async (cmd: PutItemCommand) => {
      assert.ok(cmd instanceof PutItemCommand);
      assert.equal(cmd.input.ConditionExpression, 'attribute_not_exists(id)');
      const id = cmd.input.Item?.id.S;
      assert.ok(id);
      if (store.has(id))
        throw new ConditionalCheckFailedException({
          message: 'already there',
          $metadata: {},
        });
      store.set(id, cmd.input.Item);
    }
  );
  const { deps } = setup();
  deps.orders.insert = orderRepository('demo').insert;
  const handle = orderWebhook(deps);
  const responses = await Promise.all([
    handle(signed()),
    handle(signed({ ...completed, id: 'evt_two' })),
  ]);
  assert.deepEqual(
    responses.map((r) => r.statusCode),
    [200, 200]
  );
  assert.equal(store.size, 1);
});
