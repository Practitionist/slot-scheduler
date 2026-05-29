export type SlotWithUser = {
  id: string;
  userId: string;
  userName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  label: string | null;
};

export type HeatmapCell = {
  day: number;
  slotStart: string;
  count: number;
  users: string[];
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

export function computeHeatmap(slots: SlotWithUser[]): HeatmapCell[] {
  const timeSlots = generateTimeSlots();
  const cells: HeatmapCell[] = [];

  for (let day = 0; day <= 6; day++) {
    for (const slotStart of timeSlots) {
      const cellStartMin = timeToMinutes(slotStart);
      const cellEndMin = cellStartMin + 30;
      const matchingUsers: string[] = [];

      for (const slot of slots) {
        if (slot.dayOfWeek !== day) continue;
        const sStart = timeToMinutes(slot.startTime);
        const sEnd = timeToMinutes(slot.endTime);
        if (sStart < cellEndMin && sEnd > cellStartMin) {
          matchingUsers.push(slot.userName);
        }
      }

      cells.push({ day, slotStart, count: matchingUsers.length, users: matchingUsers });
    }
  }

  return cells;
}
