import { BatchGetItemCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { z } from 'zod';
import { priceCart, readDelivery, type ReadProducts } from './quote';
import { openStripe, testSettings } from './stripe-session';

const db = new DynamoDBClient({});
const readProducts: ReadProducts = async (ids) => {
  const table = process.env.PRODUCT_TABLE;
  if (!table) throw new Error('CATALOG_UNAVAILABLE');
  const result = await db.send(
    new BatchGetItemCommand({
      RequestItems: {
        [table]: {
          Keys: ids.map((id) => ({ id: { S: id } })),
          ConsistentRead: true,
          ProjectionExpression:
            '#id, #n, #price, #currency, #published, #stock',
          ExpressionAttributeNames: {
            '#id': 'id',
            '#n': 'name',
            '#price': 'price',
            '#currency': 'currency',
            '#published': 'published',
            '#stock': 'inStock',
          },
        },
      },
    })
  );
  if (result.UnprocessedKeys?.[table]?.Keys?.length)
    throw new Error('CATALOG_BUSY');
  return (result.Responses?.[table] ?? []).map((p) => ({
    id: p.id?.S ?? '',
    name: p.name?.S,
    price: Number(p.price?.N),
    currency: p.currency?.S,
    published: p.published?.BOOL,
    inStock: p.inStock?.BOOL,
  }));
};

type Event = { fieldName: string; arguments: Record<string, string> };
export function checkoutHandler(read: ReadProducts, open: typeof openStripe) {
  return async ({ fieldName, arguments: args }: Event) => {
    if (fieldName === 'quoteCheckout') {
      const { quoteId, subtotalCents, deliveryCents, totalCents } =
        await priceCart(
          args.cart,
          args.postalCode,
          process.env.DELIVERY_CENTS,
          read
        );
      return {
        quoteId,
        subtotalCents,
        deliveryCents,
        totalCents,
        paymentEnabled: !!testSettings(process.env),
      };
    }
    if (
      fieldName !== 'startTestCheckout' ||
      !z.string().uuid().safeParse(args.attemptId).success ||
      !/^[a-f0-9]{64}$/.test(args.quoteId)
    )
      throw new Error('INVALID_INPUT');
    const delivery = readDelivery(args.delivery);
    const quote = await priceCart(
      args.cart,
      delivery.postalCode,
      process.env.DELIVERY_CENTS,
      read
    );
    if (quote.quoteId !== args.quoteId) throw new Error('QUOTE_CHANGED');
    return open(quote, delivery, args.attemptId);
  };
}
export const handler = checkoutHandler(readProducts, openStripe);
