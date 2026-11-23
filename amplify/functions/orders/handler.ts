import Stripe from 'stripe';
import { digest } from '../checkout/quote';
import { paidOrder } from './paid-order';
import { orderRepository } from './repository';

type Request = {
  body?: string;
  isBase64Encoded?: boolean;
  headers: Record<string, string | undefined>;
};
type Dependencies = {
  secret: string;
  scope: string;
  load: (id: string) => Promise<{ session: unknown; lines: unknown }>;
  orders: ReturnType<typeof orderRepository>;
};

export function orderWebhook({ secret, scope, load, orders }: Dependencies) {
  return async ({ body, isBase64Encoded, headers }: Request) => {
    const signature = Object.entries(headers).find(
      ([key]) => key.toLowerCase() === 'stripe-signature'
    )?.[1];
    if (!signature || !body) return { statusCode: 400 };
    let event: Stripe.Event;
    try {
      // Verification requires the original bytes, not re-serialized JSON.
      event = Stripe.webhooks.constructEvent(
        Buffer.from(body, isBase64Encoded ? 'base64' : 'utf8'),
        signature,
        secret
      );
    } catch {
      return { statusCode: 400 };
    }
    if (
      event.livemode !== false ||
      (event.type !== 'checkout.session.completed' &&
        event.type !== 'checkout.session.async_payment_succeeded')
    )
      return { statusCode: 200 };
    const session = event.data.object;
    if (
      session.object !== 'checkout.session' ||
      session.livemode !== false ||
      session.mode !== 'payment' ||
      session.payment_status !== 'paid' ||
      session.metadata?.credoScope !== scope
    )
      return { statusCode: 200 };
    try {
      if (!(await orders.exists(session.id))) {
        const snapshot = await load(session.id);
        await orders.insert(
          paidOrder(
            session.id,
            scope,
            event.id,
            event.created,
            snapshot.session,
            snapshot.lines
          )
        );
      }
      return { statusCode: 200 };
    } catch (err) {
      // Retryable. Do not log raw Stripe payloads, addresses or credentials.
      console.error(
        'Order confirmation failed',
        event.id,
        err instanceof Error ? err.name : 'UnknownError'
      );
      return { statusCode: 500 };
    }
  };
}

export async function handler(request: Request) {
  const {
    STRIPE_TEST_SECRET_KEY: key,
    STRIPE_TEST_WEBHOOK_SECRET: secret,
    CHECKOUT_SCOPE: scope,
    ORDERS_TABLE: table,
  } = process.env;
  if (
    !key?.startsWith('sk_test_') ||
    !secret?.startsWith('whsec_') ||
    !scope ||
    !table
  )
    return { statusCode: 503 };
  const stripe = new Stripe(key, { timeout: 8000, maxNetworkRetries: 0 });
  return orderWebhook({
    secret,
    scope: digest(scope),
    orders: orderRepository(table),
    async load(id) {
      const session = await stripe.checkout.sessions.retrieve(id, {
        expand: ['payment_intent'],
      });
      const lines = await stripe.checkout.sessions.listLineItems(id, {
        limit: 100,
        expand: ['data.price.product'],
      });
      return { session, lines };
    },
  })(request);
}
