// Runs once at server startup (Next.js instrumentation hook).
// Applies a database-agnostic IPv4 network fix for broken-IPv6 environments.
// The Node-only logic lives in lib/prefer-ipv4 and is imported dynamically so
// the Edge bundle never pulls in node:dns / undici.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.PREFER_IPV4 === 'false') return;

  const { preferIpv4 } = await import('./lib/prefer-ipv4');
  preferIpv4();
}
