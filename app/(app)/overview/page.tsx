import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { formatInTimeZone } from 'date-fns-tz';
import { CalendarCheck, CalendarClock, Clock, ArrowRight, Building2, CalendarPlus } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/auth/sign-in');

  const userId = session.user.id;
  const viewerTz = session.user.timezone ?? 'Asia/Kolkata';
  const activeOrgId = session.session?.activeOrganizationId ?? null;

  const [slotCount, upcoming, org] = await Promise.all([
    prisma.availabilitySlot.count({ where: { userId } }),
    prisma.appointment.findMany({
      where: {
        startsAt: { gte: new Date() },
        OR: [{ organizerId: userId }, { attendees: { some: { userId } } }],
      },
      orderBy: { startsAt: 'asc' },
      take: 4,
      select: { id: true, title: true, startsAt: true, timezone: true, organizer: { select: { name: true } } },
    }),
    activeOrgId
      ? prisma.organization.findUnique({
          where: { id: activeOrgId },
          select: { name: true, _count: { select: { members: true, teams: true, products: true } } },
        })
      : Promise.resolve(null),
  ]);

  const firstName = session.user.name?.split(/\s+/)[0] ?? 'there';

  return (
    <main>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back, {firstName} 👋</h1>
        <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="secondary" className="font-normal">Your timezone: {viewerTz}</Badge>
          {org && <Badge variant="outline" className="font-normal">{org.name}</Badge>}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Availability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="text-primary size-4" /> Your availability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              {slotCount > 0
                ? `You have ${slotCount} weekly slot${slotCount !== 1 ? 's' : ''} set.`
                : 'You haven’t shared any availability yet — add a few windows so you show up on the heatmap.'}
            </p>
            <Button asChild variant={slotCount > 0 ? 'outline' : 'default'} size="sm">
              <Link href="/my-slots">{slotCount > 0 ? 'Manage slots' : 'Add availability'} <ArrowRight className="size-4" /></Link>
            </Button>
          </CardContent>
        </Card>

        {/* Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="text-primary size-4" /> Group heatmap
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              See when people overlap across timezones — with the golden-hours best-meeting window highlighted.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/heatmap">Open heatmap <ArrowRight className="size-4" /></Link>
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck className="text-primary size-4" /> Upcoming appointments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 ? (
              <p className="text-muted-foreground text-sm">No upcoming appointments.</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{a.title}</span>
                    <span className="text-muted-foreground shrink-0 tabular-nums">
                      {formatInTimeZone(a.startsAt, viewerTz, 'EEE d MMM, HH:mm')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="outline" size="sm">
              <Link href="/appointments"><CalendarPlus className="size-4" /> Appointments</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Organization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="text-primary size-4" /> Organization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              {org
                ? `${org.name} · ${org._count.members} member${org._count.members !== 1 ? 's' : ''}, ${org._count.teams} team${org._count.teams !== 1 ? 's' : ''}, ${org._count.products} product${org._count.products !== 1 ? 's' : ''}.`
                : 'You’re not in an organization yet. Create one or accept an invite to group interns into teams and products.'}
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/org">{org ? 'Manage org' : 'Create or join an org'} <ArrowRight className="size-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
