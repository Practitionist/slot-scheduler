import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { computeHeatmap } from '@/lib/utils';
import { WeeklyHeatmap } from '@/components/WeeklyHeatmap';
import { Navbar } from '@/components/Navbar';

export const revalidate = 30;

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

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

  const slotsWithUser = slots.map((s) => ({
    id: s.id,
    userId: s.userId,
    userName: s.user.name,
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    label: s.label,
  }));

  const cells = computeHeatmap(slotsWithUser);
  const maxCount = Math.max(...cells.map((c) => c.count), 1);

  const uniqueInterns = new Set(slots.map((s) => s.userId)).size;

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <Navbar userName={session?.user?.name} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Group Availability</h1>
        <p className="text-sm text-gray-500 mt-1">
          {uniqueInterns} intern{uniqueInterns !== 1 ? 's' : ''} have shared availability &middot; hover cells to see who is free
        </p>
      </div>

      <div className="bg-white rounded-lg border p-4 shadow-sm">
        <WeeklyHeatmap cells={cells} maxCount={maxCount} />
      </div>
    </main>
  );
}
