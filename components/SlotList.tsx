'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { SlotForm } from './SlotForm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
    if (res.ok) {
      toast.success('Slot deleted');
      onRefresh();
    } else {
      toast.error('Could not delete slot.');
    }
  }

  if (slots.length === 0) {
    return (
      <Card className="border-dashed p-8 text-center">
        <p className="text-muted-foreground text-sm">
          No slots yet. Add your first availability window above.
        </p>
      </Card>
    );
  }

  return (
    <ul className="space-y-2">
      {slots.map((slot) => (
        <li key={slot.id}>
          <Card className="p-4">
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
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="w-12 justify-center">
                    {DAYS[slot.dayOfWeek]}
                  </Badge>
                  <span className="font-medium tabular-nums">
                    {slot.startTime} – {slot.endTime}
                  </span>
                  {slot.label && (
                    <span className="text-muted-foreground text-sm">({slot.label})</span>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditingId(slot.id)}>
                    <Pencil className="size-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(slot.id)}
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </li>
      ))}
    </ul>
  );
}
