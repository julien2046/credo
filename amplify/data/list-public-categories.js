import { util } from '@aws-appsync/utils';

export function request(ctx) {
  return {
    operation: 'Scan',
    filter: {
      expression: 'attribute_exists(#slug)',
      expressionNames: {
        '#slug': 'slug',
      },
    },
    limit: 200,
    nextToken: ctx.args.nextToken ?? null,
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }

  const items = (ctx.result.items ?? [])
    .filter((category) => category.id && category.name && category.slug)
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? null,
      organizationId: category.organizationId,
    }));

  return ctx.info.fieldName === 'listPublicCategoryPage'
    ? { items, nextToken: ctx.result.nextToken ?? null }
    : items;
}
