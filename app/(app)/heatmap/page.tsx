import { headers } from 'next/headers';
import type { Prisma } from '@/app/generated/prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { computeHeatmap } from '@/lib/heatmap';
import { WeeklyHeatmap } from '@/components/WeeklyHeatmap';
import { ScopePicker, type ScopeOption } from '@/components/ScopePicker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const revalidate = 30;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const viewerTimezone = session?.user?.timezone ?? 'Asia/Kolkata';
  const activeOrgId = session?.session?.activeOrganizationId ?? null;

  // Build the scope options. Without an active org, only "Everyone" is shown.
  const options: ScopeOption[] = [{ value: 'all', label: 'Everyone' }];
  let orgName: string | null = null;
  if (activeOrgId) {
    const org = await prisma.organization.findUnique({
      where: { id: activeOrgId },
      select: {
        name: true,
        teams: { select: { id: true, name: true }, orderBy: { name: 'asc' } },
        products: { select: { id: true, name: true }, orderBy: { name: 'asc' } },
      },
    });
    if (org) {
      orgName = org.name;
      options.push({ value: 'org', label: `${org.name} (whole org)` });
      for (const t of org.teams) options.push({ value: `team:${t.id}`, label: `Team · ${t.name}` });
      for (const p of org.products) options.push({ value: `product:${p.id}`, label: `Product · ${p.name}` });
    }
  }

  // Resolve the effective scope (default to the org when in one).
  const requested = (await searchParams).scope;
  const scope = requested && options.some((o) => o.value === requested)
    ? requested
    : activeOrgId
      ? 'org'
      : 'all';

  // Membership filter for the chosen scope.
  let where: Prisma.AvailabilitySlotWhereInput = {};
  if (scope === 'org' && activeOrgId) {
    where = { user: { members: { some: { organizationId: activeOrgId } } } };
  } else if (scope.startsWith('team:')) {
    where = { user: { teamMembers: { some: { teamId: scope.slice(5) } } } };
  } else if (scope.startsWith('product:')) {
    where = { user: { productMembers: { some: { productId: scope.slice(8) } } } };
  }

  const slots = await prisma.availabilitySlot.findMany({
    where,
    select: {
      id: true,
      userId: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      label: true,
      user: { select: { name: true, image: true, timezone: true } },
    },
  });

  const slotsWithUser = slots.map((s) => ({
    id: s.id,
    userName: s.user.name,
    userImage: s.user.image,
    userTimezone: s.user.timezone,
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    label: s.label,
  }));

  const cells = computeHeatmap(slotsWithUser, viewerTimezone);
  const maxCount = Math.max(...cells.map((c) => c.count), 1);
  const uniqueInterns = new Set(slots.map((s) => s.userId)).size;

  return (
    <main>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Group Availability</h1>
          <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span>
              {uniqueInterns} intern{uniqueInterns !== 1 ? 's' : ''} in view
            </span>
            <span aria-hidden>·</span>
            <Badge variant="secondary" className="font-normal">
              Times in {viewerTimezone}
            </Badge>
            <span aria-hidden>·</span>
            <span>amber ring = best window</span>
          </p>
        </div>
        {options.length > 1 ? (
          <ScopePicker current={scope} options={options} />
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Weekly heatmap{orgName && scope !== 'all' ? ` · ${orgName}` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyHeatmap cells={cells} maxCount={maxCount} />
        </CardContent>
      </Card>
    </main>
  );
}
