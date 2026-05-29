import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const slots = await prisma.availabilitySlot.findMany({
    where: { userId: session.user.id },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });

  return NextResponse.json(slots);
}
