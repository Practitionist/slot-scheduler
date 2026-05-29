// Single source of truth for which OAuth providers are actually usable.
// Server-only (reads process.env). A provider is "enabled" only when BOTH its
// client id and secret are present — so a half-configured provider never shows
// a button (which would otherwise dead-end / loop on the OAuth redirect).

export type OAuthProvider = 'google' | 'github';

export function enabledOAuthProviders(): OAuthProvider[] {
  const providers: OAuthProvider[] = [];
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) providers.push('google');
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) providers.push('github');
  return providers;
}
