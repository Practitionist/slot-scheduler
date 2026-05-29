// Netlify Scheduled Function — runs daily at 08:00 UTC and fires the
// reminder sweep. Logic lives in the Next route for first-class Prisma access.
export default async () => {
  const base = process.env.URL ?? 'http://localhost:3000';
  const res = await fetch(`${base}/api/cron/reminders`, {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.CRON_SECRET ?? ''}` },
  });
  console.log('[appointment-reminders]', res.status, await res.text());
};

export const config = { schedule: '0 8 * * *' };
