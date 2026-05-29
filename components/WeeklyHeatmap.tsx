'use client';

import type { HeatmapCell, SlotUser } from '@/lib/heatmap';
import { generateTimeSlots } from '@/lib/heatmap';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Props = { cells: HeatmapCell[]; maxCount: number };

export function WeeklyHeatmap({ cells, maxCount }: Props) {
  const timeSlots = generateTimeSlots();

  const cellMap = new Map<string, HeatmapCell>();
  for (const cell of cells) {
    cellMap.set(`${cell.day}-${cell.slotStart}`, cell);
  }

  function colorStyle(count: number): React.CSSProperties {
    if (count === 0 || maxCount === 0) return {};
    // Emerald, opacity scaled by relative availability.
    const ratio = Math.max(0.18, count / maxCount);
    return { backgroundColor: `color-mix(in oklab, var(--color-emerald-600) ${ratio * 100}%, transparent)` };
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[640px] gap-px" style={{ gridTemplateColumns: '64px repeat(7, 1fr)' }}>
        {/* Header */}
        <div />
        {DAYS.map((d) => (
          <div key={d} className="text-muted-foreground py-1 text-center text-xs font-semibold">
            {d}
          </div>
        ))}

        {/* Rows */}
        {timeSlots.map((slotStart) => (
          <div key={slotStart} className="contents">
            <div className="text-muted-foreground pr-2 text-right text-[11px] leading-7 tabular-nums">
              {slotStart}
            </div>
            {DAYS.map((_, dayIndex) => {
              const cell = cellMap.get(`${dayIndex}-${slotStart}`);
              const count = cell?.count ?? 0;
              const base = (
                <div
                  className={cn(
                    'h-7 rounded-[3px] border transition-colors',
                    count === 0 ? 'bg-card border-border/60' : 'border-transparent'
                  )}
                  style={colorStyle(count)}
                />
              );

              if (!cell || count === 0) {
                return <div key={`${dayIndex}-${slotStart}`}>{base}</div>;
              }

              return (
                <Tooltip key={`${dayIndex}-${slotStart}`}>
                  <TooltipTrigger asChild>
                    <button type="button" className="block w-full cursor-default">
                      {base}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[220px]">
                    <p className="mb-1.5 font-semibold">
                      {DAYS[dayIndex]} {slotStart} · {count} available
                    </p>
                    <ul className="space-y-1">
                      {cell.users.slice(0, 8).map((u: SlotUser, i) => (
                        <li key={`${u.name}-${i}`} className="flex items-center gap-2">
                          <Avatar className="size-5">
                            {u.image ? <AvatarImage src={u.image} alt={u.name} /> : null}
                            <AvatarFallback className="text-[9px]">{initials(u.name)}</AvatarFallback>
                          </Avatar>
                          <span className="truncate">{u.name}</span>
                        </li>
                      ))}
                    </ul>
                    {cell.users.length > 8 && (
                      <Badge variant="secondary" className="mt-1.5">
                        +{cell.users.length - 8} more
                      </Badge>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="text-muted-foreground mt-4 flex items-center gap-3 text-xs">
        <span>Fewer</span>
        <div className="flex gap-1">
          {[0, 0.25, 0.5, 0.75, 1].map((r) => (
            <div
              key={r}
              className="size-4 rounded-sm border"
              style={r === 0 ? {} : { backgroundColor: `color-mix(in oklab, var(--color-emerald-600) ${Math.max(18, r * 100)}%, transparent)` }}
            />
          ))}
        </div>
        <span>More available</span>
      </div>
    </div>
  );
}
