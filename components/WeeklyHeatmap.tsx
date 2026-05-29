'use client';

import { useState } from 'react';
import type { HeatmapCell } from '@/lib/utils';
import { generateTimeSlots } from '@/lib/utils';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type Props = { cells: HeatmapCell[]; maxCount: number };

export function WeeklyHeatmap({ cells, maxCount }: Props) {
  const [tooltip, setTooltip] = useState<{
    cell: HeatmapCell;
    x: number;
    y: number;
  } | null>(null);

  const timeSlots = generateTimeSlots();

  const cellMap = new Map<string, HeatmapCell>();
  for (const cell of cells) {
    cellMap.set(`${cell.day}-${cell.slotStart}`, cell);
  }

  function getColorClass(count: number): string {
    if (count === 0 || maxCount === 0) return 'bg-white border-gray-100';
    const ratio = count / maxCount;
    if (ratio < 0.25) return 'bg-green-100 border-green-200';
    if (ratio < 0.5) return 'bg-green-300 border-green-400';
    if (ratio < 0.75) return 'bg-green-500 border-green-600';
    return 'bg-green-700 border-green-800';
  }

  return (
    <div className="relative overflow-x-auto">
      <div
        className="grid gap-px"
        style={{ gridTemplateColumns: '72px repeat(7, 1fr)' }}
      >
        {/* Header */}
        <div />
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-semibold py-1 text-gray-600">
            {d}
          </div>
        ))}

        {/* Rows */}
        {timeSlots.map((slotStart) => (
          <>
            <div
              key={`label-${slotStart}`}
              className="text-right pr-2 text-xs text-gray-400 leading-7 tabular-nums"
            >
              {slotStart}
            </div>
            {DAYS.map((_, dayIndex) => {
              const cell = cellMap.get(`${dayIndex}-${slotStart}`);
              const count = cell?.count ?? 0;
              return (
                <div
                  key={`${dayIndex}-${slotStart}`}
                  className={`h-7 border cursor-default transition-colors ${getColorClass(count)}`}
                  onMouseEnter={(e) => {
                    if (cell) setTooltip({ cell, x: e.clientX, y: e.clientY });
                  }}
                  onMouseMove={(e) => {
                    setTooltip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : null));
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })}
          </>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 text-xs text-gray-500">
        <span>Fewer</span>
        <div className="flex gap-1">
          {['bg-white border border-gray-100', 'bg-green-100', 'bg-green-300', 'bg-green-500', 'bg-green-700'].map(
            (cls, i) => (
              <div key={i} className={`w-4 h-4 rounded-sm ${cls}`} />
            )
          )}
        </div>
        <span>More available</span>
      </div>

      {/* Tooltip */}
      {tooltip && tooltip.cell.count > 0 && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none max-w-[200px]"
          style={{
            top: tooltip.y + 14,
            left: Math.min(tooltip.x + 14, (typeof window !== 'undefined' ? window.innerWidth : 9999) - 220),
          }}
        >
          <p className="font-semibold mb-1">
            {tooltip.cell.count} intern{tooltip.cell.count !== 1 ? 's' : ''} available
          </p>
          <ul className="space-y-0.5">
            {tooltip.cell.users.slice(0, 10).map((name) => (
              <li key={name} className="truncate">
                {name}
              </li>
            ))}
            {tooltip.cell.users.length > 10 && (
              <li className="text-gray-400">+{tooltip.cell.users.length - 10} more</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
