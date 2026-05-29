import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const { id } = await params;
  const { status } = await req.json();
  if (status !== 'accepted' && status !== 'declined') {
    return new Response('status must be accepted or declined', { status: 400 });
  }

  // Only an invited attendee may respond (composite unique appointmentId+userId).
  const attendee = await prisma.appointmentAttendee.findFirst({
    where: { appointmentId: id, userId: session.user.id },
  });
  if (!attendee) return new Response('Not found', { status: 404 });

  const updated = await prisma.appointmentAttendee.update({
    where: { id: attendee.id },
    data: { status, respondedAt: new Date() },
  });

  return new Response(JSON.stringify(updated), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
