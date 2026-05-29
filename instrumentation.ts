// Runs once at server startup (Next.js instrumentation hook).
// Applies a database-agnostic IPv4 network fix for broken-IPv6 environments.
// The Node-only logic lives in lib/prefer-ipv4 and is imported dynamically so
// the Edge bundle never pulls in node:dns / undici.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  // Opt-IN only. Patching globalThis.fetch is needed where the network advertises
  // IPv6 but can't route it (e.g. some home/ISP networks). It must stay OFF on
  // cloud runtimes (Netlify functions) where it can break the platform's own
  // fetch and 500 SSR pages. Default off; set PREFER_IPV4=true in local .env only.
  if (process.env.PREFER_IPV4 !== 'true') return;

  const { preferIpv4 } = await import('./lib/prefer-ipv4');
  preferIpv4();
}
