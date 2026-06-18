import type { GraphQLErrorLike } from './catalog.repository.types.js';

export function getCatalogErrorMessage(
  errors: GraphQLErrorLike[] | undefined
): string {
  return (
    errors
      ?.map((error) => error.message)
      .filter((message): message is string => Boolean(message))
      .join(', ') ?? ''
  );
}

export function assertCatalogResult(
  errors: GraphQLErrorLike[] | undefined
): void {
  const message = getCatalogErrorMessage(errors);

  if (message) {
    throw new Error(message);
  }
}
