// Guards every "return to where I was" hop in the auth journey.
// Only same-origin, absolute *path* redirects are allowed — anything that could
// bounce the user to another site (`//evil.com`, `https://…`, `/\evil.com`) or
// back to an auth page (which would loop) is rejected and the fallback is used.
const AUTH_PATHS = ['/auth/sign-in', '/auth/sign-up'];

export function safeReturnTo(
  value: string | null | undefined,
  fallback = '/overview'
): string {
  if (!value) return fallback;
  // Must be a root-relative path, not a protocol-relative or backslash trick.
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return fallback;
  }
  // Never send the user back to an auth screen — that's how loops happen.
  const path = value.split('?')[0];
  if (AUTH_PATHS.some((p) => path === p)) return fallback;
  return value;
}
