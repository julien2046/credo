import Stripe from 'stripe';
import { digest, type Delivery, type PricedCart } from './quote';

export function testSettings(env: NodeJS.ProcessEnv) {
  const key = env.STRIPE_TEST_SECRET_KEY;
  if (!key?.startsWith('sk_test_') || !env.CHECKOUT_RETURN_ORIGIN) return null;
  try {
    const url = new URL(env.CHECKOUT_RETURN_ORIGIN);
    if (
      url.href !== url.origin + '/' ||
      !(
        url.protocol === 'https:' ||
        (url.protocol === 'http:' && url.hostname === 'localhost')
      )
    )
      return null;
    return { key, origin: url.origin };
  } catch {
    return null;
  }
}

export function sessionRequest(
  quote: PricedCart,
  d: Delivery,
  origin: string,
  attempt: string
) {
  const params: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    allowed_payment_method_types: ['card'],
    locale: 'fr-CA',
    automatic_tax: { enabled: false },
    adaptive_pricing: { enabled: false },
    success_url: origin + '/checkout/retour',
    cancel_url: origin + '/checkout/annule',
    customer_email: d.email,
    metadata: { quoteId: quote.quoteId },
    payment_intent_data: {
      shipping: {
        name: d.name,
        address: {
          line1: d.address,
          line2: d.unit || undefined,
          city: d.city,
          state: 'QC',
          postal_code: d.postalCode,
          country: 'CA',
        },
      },
    },
    line_items: [
      ...quote.lines.map((l) => ({
        quantity: l.quantity,
        price_data: {
          currency: 'cad',
          unit_amount: l.unitCents,
          product_data: { name: l.name, metadata: { productId: l.id } },
        },
      })),
      {
        quantity: 1,
        price_data: {
          currency: 'cad',
          unit_amount: quote.deliveryCents,
          product_data: { name: 'Livraison au Québec' },
        },
      },
    ],
  };
  return { params, idempotencyKey: digest([attempt, params]) };
}

export async function openStripe(
  quote: PricedCart,
  delivery: Delivery,
  attempt: string
) {
  const config = testSettings(process.env);
  if (!config) throw new Error('PAYMENT_DISABLED');
  const stripe = new Stripe(config.key, {
    timeout: 8000,
    maxNetworkRetries: 0,
  });
  const { params, idempotencyKey } = sessionRequest(
    quote,
    delivery,
    config.origin,
    attempt
  );
  try {
    const session = await stripe.checkout.sessions.create(params, {
      idempotencyKey,
    });
    if (
      !session.livemode &&
      session.url?.startsWith('https://checkout.stripe.com/')
    )
      return session.url;
  } catch {
    /* Never forward provider errors containing customer data. */
  }
  throw new Error('PAYMENT_UNAVAILABLE');
}
