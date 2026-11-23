import { z } from 'zod';

const cents = z.number().int().nonnegative().safe();
const cad = z.literal('cad');
const text = z.string().min(1);
const sessionSchema = z.object({
  id: text,
  livemode: z.literal(false),
  mode: z.literal('payment'),
  status: z.literal('complete'),
  payment_status: z.literal('paid'),
  currency: cad,
  amount_total: cents,
  metadata: z.object({ credoScope: text, quoteId: text }),
  customer_email: z.string().email(),
  payment_intent: z.object({
    id: text,
    status: z.literal('succeeded'),
    livemode: z.literal(false),
    currency: cad,
    amount_received: cents,
    shipping: z.object({
      name: text,
      address: z.object({
        line1: text,
        line2: z.string().nullish(),
        city: text,
        postal_code: text,
        state: z.literal('QC'),
        country: z.literal('CA'),
      }),
    }),
  }),
});
const linePageSchema = z.object({
  // Checkout accepts at most 50 products plus one delivery line. Never save a partial page.
  has_more: z.literal(false),
  data: z
    .array(
      z.object({
        description: text,
        quantity: z.number().int().min(1).max(99),
        currency: cad,
        amount_total: cents,
        price: z.object({
          currency: cad,
          unit_amount: cents,
          product: z.object({
            metadata: z.object({
              productId: text.optional(),
              kind: text.optional(),
            }),
          }),
        }),
      })
    )
    .min(2)
    .max(51),
});

export function paidOrder(
  sessionId: string,
  scope: string,
  eventId: string,
  timestamp: number,
  rawSession: unknown,
  rawLines: unknown
) {
  const session = sessionSchema.parse(rawSession);
  const intent = session.payment_intent;
  if (
    session.id !== sessionId ||
    session.metadata.credoScope !== scope ||
    intent.amount_received !== session.amount_total
  )
    throw new Error('UNEXPECTED_PAYMENT');

  const lines: {
    productId: string;
    name: string;
    unitCents: number;
    quantity: number;
  }[] = [];
  let deliveryCents: number | undefined;
  let subtotalCents = 0;
  for (const line of linePageSchema.parse(rawLines).data) {
    const unitCents = line.price.unit_amount;
    const { productId, kind } = line.price.product.metadata;
    if (unitCents * line.quantity !== line.amount_total)
      throw new Error('LINE_TOTAL_MISMATCH');
    if (
      kind === 'delivery' &&
      !productId &&
      line.quantity === 1 &&
      deliveryCents === undefined
    ) {
      deliveryCents = unitCents;
    } else if (
      productId &&
      !kind &&
      !lines.some((l) => l.productId === productId)
    ) {
      lines.push({
        productId,
        name: line.description,
        unitCents,
        quantity: line.quantity,
      });
      subtotalCents += line.amount_total;
    } else throw new Error('UNEXPECTED_LINE');
  }
  if (
    !lines.length ||
    deliveryCents === undefined ||
    subtotalCents + deliveryCents !== session.amount_total
  )
    throw new Error('ORDER_TOTAL_MISMATCH');

  return {
    id: session.id,
    status: 'PAID' as const,
    testMode: true,
    currency: 'CAD',
    quoteId: session.metadata.quoteId,
    paymentIntentId: intent.id,
    stripeEventId: eventId,
    paidAt: new Date(timestamp * 1000).toISOString(),
    subtotalCents,
    deliveryCents,
    totalCents: session.amount_total,
    lines,
    email: session.customer_email,
    shipping: intent.shipping,
  };
}
export type PaidOrder = ReturnType<typeof paidOrder>;
