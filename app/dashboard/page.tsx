import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { computeHeatmap } from '@/lib/heatmap';
import { WeeklyHeatmap } from '@/components/WeeklyHeatmap';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const revalidate = 30;

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const viewerTimezone = session?.user?.timezone ?? 'Asia/Kolkata';

  const slots = await prisma.availabilitySlot.findMany({
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
    <main className="mx-auto max-w-6xl p-6">
      <Navbar userName={session?.user?.name} userImage={session?.user?.image} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Group Availability</h1>
        <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span>
            {uniqueInterns} intern{uniqueInterns !== 1 ? 's' : ''} have shared availability
          </span>
          <span aria-hidden>·</span>
          <Badge variant="secondary" className="font-normal">
            Times in {viewerTimezone}
          </Badge>
          <span aria-hidden>·</span>
          <span>hover cells to see who&rsquo;s free</span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weekly heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyHeatmap cells={cells} maxCount={maxCount} />
        </CardContent>
      </Card>
    </main>
  );
}
