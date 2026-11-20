import { createHash } from 'node:crypto';
import { z } from 'zod';
import { validateQuebecPostalCode } from '@credo/shared';

const cart = z
  .array(
    z
      .object({
        id: z.string().min(1).max(128),
        quantity: z.number().int().min(1).max(99),
      })
      .strict()
  )
  .min(1)
  .max(50);
const text = z.string().trim().min(1).max(150);
const postal = z
  .string()
  .max(10)
  .refine((v) => validateQuebecPostalCode(v) === true)
  .transform((v) => v.trim().toUpperCase().replace(' ', ''));
const delivery = z
  .object({
    name: text,
    email: z.string().trim().email().max(254),
    address: text,
    city: text,
    unit: z.string().trim().max(100).default(''),
    postalCode: postal,
  })
  .strict();
export type Delivery = z.infer<typeof delivery>;

export function parseJson<T>(
  input: unknown,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>
): T {
  if (typeof input !== 'string' || input.length > 12000)
    throw new Error('INVALID_INPUT');
  try {
    return schema.parse(JSON.parse(input));
  } catch {
    throw new Error('INVALID_INPUT');
  }
}

export const readDelivery = (input: unknown) => parseJson(input, delivery);
export const digest = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
export type Product = {
  id: string;
  name?: string;
  price?: number;
  currency?: string;
  inStock?: boolean;
  published?: boolean;
};
export type ReadProducts = (ids: string[]) => Promise<Product[]>;

export async function priceCart(
  input: unknown,
  postalCode: unknown,
  fee: string | undefined,
  readProducts: ReadProducts
) {
  const address = postal.safeParse(postalCode);
  if (!address.success) throw new Error('INVALID_INPUT');
  const deliveryCents = Number(fee);
  if (!fee || !Number.isSafeInteger(deliveryCents) || deliveryCents < 0)
    throw new Error('DELIVERY_DISABLED');
  const items = parseJson(input, cart);
  const ids = items.map(({ id }) => id);
  if (new Set(ids).size !== ids.length) throw new Error('INVALID_INPUT');
  const byId = new Map((await readProducts(ids)).map((p) => [p.id, p]));
  const lines = items.map(({ id, quantity }) => {
    const p = byId.get(id);
    if (
      !p?.published ||
      !p.inStock ||
      p.currency !== 'CAD' ||
      !p.name?.trim() ||
      typeof p.price !== 'number' ||
      !Number.isFinite(p.price) ||
      p.price < 0
    ) {
      throw new Error('CART_UNAVAILABLE');
    }
    const unitCents = Math.round(p.price * 100);
    if (Math.abs(p.price * 100 - unitCents) > 0.000001)
      throw new Error('CART_UNAVAILABLE');
    return { id, name: p.name, quantity, unitCents };
  });
  const subtotalCents = lines.reduce(
    (sum, l) => sum + l.unitCents * l.quantity,
    0
  );
  const totalCents = subtotalCents + deliveryCents;
  if (totalCents < 50 || totalCents > 99999999)
    throw new Error('CART_UNAVAILABLE');
  return {
    lines,
    subtotalCents,
    deliveryCents,
    totalCents,
    quoteId: digest(['CAD', address.data, deliveryCents, lines]),
  };
}
export type PricedCart = Awaited<ReturnType<typeof priceCart>>;
