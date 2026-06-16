import { util } from '@aws-appsync/utils';

export function request() {
  return {
    operation: 'Scan',
    filter: {
      expression: 'attribute_exists(#slug)',
      expressionNames: {
        '#slug': 'slug',
      },
    },
    limit: 200,
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }

  return (ctx.result.items ?? [])
    .filter((category) => category.id && category.name && category.slug)
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? null,
      organizationId: category.organizationId,
    }));
}
