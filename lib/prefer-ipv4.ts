// Node-only network fix (kept in its own module so the Edge bundle never sees
// node:dns / undici). Imported dynamically from instrumentation.ts.
//
// Why: many home/ISP networks publish IPv6 (AAAA) records but have no working
// IPv6 route. Node 20+ `fetch` (undici Happy Eyeballs) and raw TCP connects then
// try the v6 address and hang with ETIMEDOUT, while IPv4 works fine. This is a
// runtime/network issue, not a database one — fixing it here keeps it
// database-agnostic (Neon HTTP today; Supabase/Postgres or Mongo over TCP later).
import dns from 'node:dns';
import { Agent, fetch as undiciFetch } from 'undici';

export function preferIpv4() {
  // TCP-based drivers (pg, mongodb, supabase direct) honor DNS result order.
  dns.setDefaultResultOrder('ipv4first');

  // undici ignores dns-result-order and does its own resolution, and Next.js
  // overrides the global undici dispatcher — so pin globalThis.fetch to an
  // IPv4 dispatcher. This also covers OAuth token exchanges and supabase-js.
  const ipv4Agent = new Agent({ connect: { family: 4 } });
  globalThis.fetch = ((input: Parameters<typeof undiciFetch>[0], init?: Parameters<typeof undiciFetch>[1]) =>
    undiciFetch(input, { ...init, dispatcher: ipv4Agent })) as unknown as typeof fetch;

  console.log('[instrumentation] IPv4 preferred for DNS + fetch (set PREFER_IPV4=false to disable)');
}
