import {
  ConditionalCheckFailedException,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import type { PaidOrder } from './paid-order';

const db = new DynamoDBClient({});
export function orderRepository(table: string) {
  return {
    async exists(id: string) {
      const { Item } = await db.send(
        new GetItemCommand({
          TableName: table,
          Key: { id: { S: id } },
          ProjectionExpression: 'id',
          ConsistentRead: true,
        })
      );
      return !!Item;
    },
    async insert(order: PaidOrder) {
      try {
        await db.send(
          new PutItemCommand({
            TableName: table,
            ConditionExpression: 'attribute_not_exists(id)',
            Item: {
              id: { S: order.id },
              status: { S: order.status },
              testMode: { BOOL: order.testMode },
              currency: { S: order.currency },
              paidAt: { S: order.paidAt },
              email: { S: order.email },
              quoteId: { S: order.quoteId },
              paymentIntentId: { S: order.paymentIntentId },
              stripeEventId: { S: order.stripeEventId },
              subtotalCents: { N: String(order.subtotalCents) },
              deliveryCents: { N: String(order.deliveryCents) },
              totalCents: { N: String(order.totalCents) },
              lines: {
                L: order.lines.map((l) => ({
                  M: {
                    productId: { S: l.productId },
                    name: { S: l.name },
                    unitCents: { N: String(l.unitCents) },
                    quantity: { N: String(l.quantity) },
                  },
                })),
              },
              shipping: {
                M: {
                  name: { S: order.shipping.name },
                  line1: { S: order.shipping.address.line1 },
                  line2: { S: order.shipping.address.line2 ?? '' },
                  city: { S: order.shipping.address.city },
                  postalCode: { S: order.shipping.address.postal_code },
                  province: { S: order.shipping.address.state },
                  country: { S: order.shipping.address.country },
                },
              },
            },
          })
        );
      } catch (err) {
        // Distinct successful Stripe events and concurrent deliveries can race on the same session.
        if (!(err instanceof ConditionalCheckFailedException)) throw err;
      }
    },
  };
}
