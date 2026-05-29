import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const { id } = await params;
  // Organizer-only delete.
  const existing = await prisma.appointment.findFirst({
    where: { id, organizerId: session.user.id },
  });
  if (!existing) return new Response('Not found', { status: 404 });

  await prisma.appointment.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
