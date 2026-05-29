import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@slotscheduler.app';

function warn(fn: string) {
  console.warn(`[email] RESEND_API_KEY not set — skipping ${fn}`);
}

export async function sendInvitationEmail({
  to,
  orgName,
  acceptUrl,
}: {
  to: string;
  orgName: string;
  acceptUrl: string;
}) {
  if (!resend) { warn('sendInvitationEmail'); return; }
  await resend.emails.send({
    from: FROM,
    to,
    subject: `You've been invited to join ${orgName} on Slot Scheduler`,
    html: `
      <p>Hi,</p>
      <p>You've been invited to join <strong>${orgName}</strong> on Slot Scheduler.</p>
      <p><a href="${acceptUrl}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">Accept Invitation</a></p>
      <p>This link expires in 48 hours. If you did not expect this invitation, you can ignore it.</p>
    `,
  });
}

export async function sendAppointmentInviteEmail({
  to,
  appointmentTitle,
  organizerName,
  startsAt,
  endsAt,
  timezone,
  description,
}: {
  to: string;
  appointmentTitle: string;
  organizerName: string;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  description?: string | null;
}) {
  if (!resend) { warn('sendAppointmentInviteEmail'); return; }
  const fmt = (d: Date) =>
    d.toLocaleString('en-US', { timeZone: timezone, dateStyle: 'medium', timeStyle: 'short' });
  await resend.emails.send({
    from: FROM,
    to,
    subject: `You're invited: ${appointmentTitle}`,
    html: `
      <p>Hi,</p>
      <p><strong>${organizerName}</strong> has invited you to <strong>${appointmentTitle}</strong>.</p>
      <p>
        <strong>When:</strong> ${fmt(startsAt)} – ${fmt(endsAt)} (${timezone})<br/>
        ${description ? `<strong>Details:</strong> ${description}<br/>` : ''}
      </p>
      <p>Log in to Slot Scheduler to accept or decline.</p>
    `,
  });
}

export async function sendAppointmentReminderEmail({
  to,
  appointmentTitle,
  startsAt,
  timezone,
}: {
  to: string;
  appointmentTitle: string;
  startsAt: Date;
  timezone: string;
}) {
  if (!resend) { warn('sendAppointmentReminderEmail'); return; }
  const fmt = (d: Date) =>
    d.toLocaleString('en-US', { timeZone: timezone, dateStyle: 'medium', timeStyle: 'short' });
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Reminder: ${appointmentTitle} is coming up`,
    html: `
      <p>Hi,</p>
      <p>This is a reminder that <strong>${appointmentTitle}</strong> starts at <strong>${fmt(startsAt)} (${timezone})</strong>.</p>
      <p>See you there!</p>
    `,
  });
}
