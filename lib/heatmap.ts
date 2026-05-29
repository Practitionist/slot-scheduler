import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';

export type SlotUser = {
  name: string;
  image: string | null;
};

export type SlotWithUser = {
  id: string;
  userName: string;
  userImage: string | null;
  userTimezone: string; // IANA tz the slot's HH:MM are expressed in
  dayOfWeek: number; // 0=Mon ... 6=Sun
  startTime: string; // "HH:MM" in userTimezone
  endTime: string; // "HH:MM" in userTimezone
  label: string | null;
};

export type HeatmapCell = {
  day: number;
  slotStart: string;
  count: number;
  users: SlotUser[];
};

export function generateTimeSlots(startHour = 6, endHour = 23): string[] {
  const slots: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

const DAY_MS = 86_400_000;

// The week we anchor conversions to. Using the *current* week means the UTC
// offset applied to each slot reflects whatever DST rule is in effect right now,
// so the heatmap stays correct as regions enter/leave daylight saving.
function currentWeekMondayUTC(now = new Date()): Date {
  const dow = (now.getUTCDay() + 6) % 7; // 0=Mon ... 6=Sun
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dow));
}

type Segment = { day: number; startMin: number; endMin: number };

// Convert one slot (wall-clock HH:MM in its owner's tz) into the viewer's local
// week as 1–2 (day, minute-range) segments. A slot can land on a different
// weekday and even straddle midnight once converted across far-apart timezones.
function toViewerSegments(slot: SlotWithUser, viewerTz: string, weekMonday: Date): Segment[] {
  const ownerDate = new Date(weekMonday.getTime() + slot.dayOfWeek * DAY_MS)
    .toISOString()
    .slice(0, 10); // "YYYY-MM-DD"

  // owner wall-clock -> absolute UTC instant (DST-aware for the anchored week)
  const startUtc = fromZonedTime(`${ownerDate}T${slot.startTime}:00`, slot.userTimezone);
  const endUtc = fromZonedTime(`${ownerDate}T${slot.endTime}:00`, slot.userTimezone);

  // absolute instant -> viewer-local weekday ('i' = 1=Mon..7=Sun) + minutes
  const startDay = Number(formatInTimeZone(startUtc, viewerTz, 'i')) - 1;
  const startMin = timeToMinutes(formatInTimeZone(startUtc, viewerTz, 'HH:mm'));
  const endDay = Number(formatInTimeZone(endUtc, viewerTz, 'i')) - 1;
  const endMin = timeToMinutes(formatInTimeZone(endUtc, viewerTz, 'HH:mm'));

  if (startDay === endDay && endMin > startMin) {
    return [{ day: startDay, startMin, endMin }];
  }

  // Crossed midnight in the viewer's tz: split into two same-day segments.
  const segs: Segment[] = [{ day: startDay, startMin, endMin: 1440 }];
  if (endMin > 0) segs.push({ day: endDay, startMin: 0, endMin });
  return segs;
}

export function computeHeatmap(
  slots: SlotWithUser[],
  viewerTimezone: string
): HeatmapCell[] {
  const timeSlots = generateTimeSlots();
  const weekMonday = currentWeekMondayUTC();

  // Convert every slot to viewer-local segments once (O(N)) before bucketing.
  const occupancy = slots.map((s) => ({
    user: { name: s.userName, image: s.userImage } as SlotUser,
    segs: toViewerSegments(s, viewerTimezone, weekMonday),
  }));

  const cells: HeatmapCell[] = [];
  for (let day = 0; day <= 6; day++) {
    for (const slotStart of timeSlots) {
      const cellStartMin = timeToMinutes(slotStart);
      const cellEndMin = cellStartMin + 30;
      const users: SlotUser[] = [];

      for (const o of occupancy) {
        for (const seg of o.segs) {
          if (seg.day === day && seg.startMin < cellEndMin && seg.endMin > cellStartMin) {
            users.push(o.user);
            break;
          }
        }
      }

      cells.push({ day, slotStart, count: users.length, users });
    }
  }

  return cells;
}
