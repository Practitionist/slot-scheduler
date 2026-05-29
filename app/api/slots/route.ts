import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const slots = await prisma.availabilitySlot.findMany({
    select: {
      id: true,
      userId: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      label: true,
      user: { select: { name: true } },
    },
  });

  const mapped = slots.map((s) => ({
    id: s.id,
    userId: s.userId,
    userName: s.user.name,
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    label: s.label,
  }));

  return NextResponse.json(mapped);
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const body = await req.json();
  const { dayOfWeek, startTime, endTime, label } = body;

  if (typeof dayOfWeek !== 'number' || dayOfWeek < 0 || dayOfWeek > 6) {
    return new Response('Invalid day', { status: 400 });
  }
  if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
    return new Response('Invalid time format (use HH:MM)', { status: 400 });
  }
  if (startTime >= endTime) {
    return new Response('startTime must be before endTime', { status: 400 });
  }

  try {
    const slot = await prisma.availabilitySlot.create({
      data: { userId: session.user.id, dayOfWeek, startTime, endTime, label: label || null },
    });
    return NextResponse.json(slot, { status: 201 });
  } catch (e: any) {
    if (e?.code === 'P2002') return new Response('Slot already exists', { status: 409 });
    throw e;
  }
}
