import { prisma } from '@/lib/prisma';
import { sendAppointmentReminderEmail } from '@/lib/email';

// Nightly reminder sweep. Sends one email per accepted attendee for any
// appointment that starts within the next 24 hours.
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const appointments = await prisma.appointment.findMany({
    where: { startsAt: { gte: now, lte: in24h } },
    include: {
      attendees: {
        where: { status: 'accepted' },
        include: { user: { select: { email: true } } },
      },
      organizer: { select: { email: true } },
    },
  });

  let sent = 0;
  for (const appt of appointments) {
    const recipients = [
      appt.organizer.email,
      ...appt.attendees.map((a) => a.user.email),
    ];
    for (const email of recipients) {
      await sendAppointmentReminderEmail({
        to: email,
        appointmentTitle: appt.title,
        startsAt: appt.startsAt,
        timezone: appt.timezone,
      });
      sent++;
    }
  }

  return Response.json({ ok: true, appointmentsFound: appointments.length, emailsSent: sent });
}
