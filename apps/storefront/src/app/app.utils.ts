export const getErrorMessage = (errors: unknown): string | null => {
  if (!Array.isArray(errors) || errors.length === 0) return null;

  return errors
    .map((item) =>
      typeof item === 'object' && item && 'message' in item
        ? String((item as { message?: string }).message ?? 'Unknown error')
        : 'Unknown error'
    )
    .join(', ');
};
