import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return new Response('Unauthorized', { status: 401 });
  const uid = session.user.id;

  const appointments = await prisma.appointment.findMany({
    where: { OR: [{ organizerId: uid }, { attendees: { some: { userId: uid } } }] },
    orderBy: { startsAt: 'asc' },
    select: {
      id: true,
      title: true,
      description: true,
      startsAt: true,
      endsAt: true,
      timezone: true,
      organizer: { select: { id: true, name: true, image: true } },
      attendees: {
        select: { userId: true, status: true, user: { select: { name: true, image: true } } },
      },
    },
  });

  // Annotate each with the viewer's own role/RSVP so the UI can show controls.
  const mapped = appointments.map((a) => {
    const mine = a.attendees.find((x) => x.userId === uid);
    return {
      ...a,
      isOrganizer: a.organizer.id === uid,
      myStatus: mine?.status ?? null,
    };
  });

  return NextResponse.json(mapped);
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const body = await req.json();
  const { title, description, startsAt, endsAt, timezone, attendeeIds } = body;

  if (typeof title !== 'string' || !title.trim()) return new Response('Title is required', { status: 400 });
  if (typeof timezone !== 'string' || !timezone) return new Response('Timezone is required', { status: 400 });

  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return new Response('Invalid date/time', { status: 400 });
  if (end <= start) return new Response('End must be after start', { status: 400 });

  const ids: string[] = Array.isArray(attendeeIds)
    ? [...new Set(attendeeIds.filter((x) => typeof x === 'string' && x !== session.user.id))]
    : [];

  const appointment = await prisma.appointment.create({
    data: {
      organizerId: session.user.id,
      title: title.trim(),
      description: description?.trim() || null,
      startsAt: start,
      endsAt: end,
      timezone,
      attendees: { create: ids.map((userId) => ({ userId, status: 'pending' })) },
    },
  });

  return NextResponse.json(appointment, { status: 201 });
}
