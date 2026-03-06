import type { UserRole } from './app.types';

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

export const parseGroups = (payload: Record<string, unknown>): string[] => {
  const raw = payload['cognito:groups'];

  if (Array.isArray(raw)) {
    return raw.filter((value): value is string => typeof value === 'string');
  }

  if (typeof raw === 'string' && raw.length > 0) {
    return [raw];
  }

  return [];
};

export const resolveRoleFromSession = (
  payload: Record<string, unknown>
): UserRole => {
  const groups = parseGroups(payload);
  if (groups.includes('MERCHANT')) return 'MERCHANT';
  return 'CUSTOMER';
};
