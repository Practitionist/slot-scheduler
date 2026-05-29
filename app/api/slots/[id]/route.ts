import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const { id } = await params;
  const { dayOfWeek, startTime, endTime, label } = await req.json();

  if (typeof dayOfWeek !== 'number' || dayOfWeek < 0 || dayOfWeek > 6) {
    return new Response('Invalid day', { status: 400 });
  }
  if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
    return new Response('Invalid time format (use HH:MM)', { status: 400 });
  }
  if (startTime >= endTime) {
    return new Response('startTime must be before endTime', { status: 400 });
  }

  const existing = await prisma.availabilitySlot.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return new Response('Not found', { status: 404 });

  const updated = await prisma.availabilitySlot.update({
    where: { id },
    data: { dayOfWeek, startTime, endTime, label: label || null },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const { id } = await params;

  const existing = await prisma.availabilitySlot.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return new Response('Not found', { status: 404 });

  await prisma.availabilitySlot.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
