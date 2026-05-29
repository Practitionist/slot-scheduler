// Translates raw Better Auth / network errors into messages an intern can act on,
// instead of leaking codes like "NeonDbError" or "fetch failed" to the UI.

type AuthError = {
  message?: string;
  status?: number;
  statusText?: string;
  code?: string;
} | null;

export function friendlyAuthError(error: AuthError, fallback = 'Something went wrong. Please try again.'): string {
  if (!error) return fallback;

  const code = error.code?.toUpperCase();
  const status = error.status;

  switch (code) {
    case 'INVALID_EMAIL_OR_PASSWORD':
    case 'INVALID_PASSWORD':
      return 'Incorrect email or password.';
    case 'USER_ALREADY_EXISTS':
      return 'An account with that email already exists — try signing in instead.';
    case 'PASSWORD_TOO_SHORT':
      return 'Please choose a longer password (at least 8 characters).';
    case 'USER_NOT_FOUND':
      return 'No account found with that email.';
  }

  if (status === 401) return 'Incorrect email or password.';
  if (status === 409) return 'An account with that email already exists — try signing in instead.';
  if (status === 429) return 'Too many attempts. Please wait a moment and try again.';

  // No status, or a server/DB failure (e.g. the database is unreachable).
  if (!status || status >= 500) {
    return "We couldn't reach the server right now. Please check your connection and try again in a moment.";
  }

  return fallback;
}
