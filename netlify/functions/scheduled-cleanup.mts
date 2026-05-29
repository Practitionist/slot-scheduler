// Netlify Scheduled Function — runs daily and triggers the secret-guarded
// cleanup route on this site. Scheduling lives here; the cleanup logic lives in
// the Next route so it has first-class Prisma access.
export default async () => {
  const base = process.env.URL ?? 'http://localhost:3000';
  const res = await fetch(`${base}/api/cron/cleanup`, {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.CRON_SECRET ?? ''}` },
  });
  console.log('[scheduled-cleanup]', res.status, await res.text());
};

export const config = { schedule: '@daily' };
