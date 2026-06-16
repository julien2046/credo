import { util } from '@aws-appsync/utils';

export function request() {
  return {
    operation: 'Scan',
    filter: {
      expression: '#published = :published AND attribute_exists(#slug)',
      expressionNames: {
        '#published': 'published',
        '#slug': 'slug',
      },
      expressionValues: util.dynamodb.toMapValues({
        ':published': true,
      }),
    },
    limit: 200,
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }

  return (ctx.result.items ?? [])
    .filter(
      (product) =>
        product.id &&
        product.name &&
        product.slug &&
        product.published === true &&
        product.price !== null &&
        product.price !== undefined
    )
    .map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description ?? null,
      price: product.price,
      currency: product.currency ?? null,
      imageUrl: product.imageUrl ?? null,
      inStock: product.inStock ?? null,
      organizationId: product.organizationId,
      categoryId: product.categoryId ?? null,
    }));
}
