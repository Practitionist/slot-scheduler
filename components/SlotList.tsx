'use client';

import { useState } from 'react';
import { SlotForm } from './SlotForm';
import type { AvailabilitySlot } from '@/app/generated/prisma/client';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type Props = {
  slots: AvailabilitySlot[];
  onRefresh: () => void;
};

export function SlotList({ slots, onRefresh }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm('Delete this availability slot?')) return;
    const res = await fetch(`/api/slots/${id}`, { method: 'DELETE' });
    if (res.ok) onRefresh();
  }

  if (slots.length === 0) {
    return (
      <p className="text-gray-500 text-sm">
        No slots yet. Add your first availability window above.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {slots.map((slot) => (
        <li key={slot.id} className="bg-white border rounded-lg p-4">
          {editingId === slot.id ? (
            <SlotForm
              initial={{
                id: slot.id,
                dayOfWeek: slot.dayOfWeek,
                startTime: slot.startTime,
                endTime: slot.endTime,
                label: slot.label,
              }}
              onSuccess={() => {
                setEditingId(null);
                onRefresh();
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="font-medium">{DAYS[slot.dayOfWeek]}</span>
                <span className="ml-2 text-gray-700">
                  {slot.startTime} – {slot.endTime}
                </span>
                {slot.label && (
                  <span className="ml-2 text-gray-400 text-sm">({slot.label})</span>
                )}
              </div>
              <div className="flex gap-3 shrink-0">
                <button
                  onClick={() => setEditingId(slot.id)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(slot.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
