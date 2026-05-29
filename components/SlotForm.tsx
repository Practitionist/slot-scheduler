'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function generateTimeOptions(): string[] {
  const opts: string[] = [];
  for (let h = 0; h < 24; h++) {
    opts.push(`${String(h).padStart(2, '0')}:00`);
    opts.push(`${String(h).padStart(2, '0')}:30`);
  }
  return opts;
}

const TIME_OPTIONS = generateTimeOptions();

type Initial = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  label?: string | null;
};

type Props = {
  initial?: Initial;
  onSuccess: () => void;
  onCancel?: () => void;
};

export function SlotForm({ initial, onSuccess, onCancel }: Props) {
  const [day, setDay] = useState(initial?.dayOfWeek ?? 0);
  const [start, setStart] = useState(initial?.startTime ?? '09:00');
  const [end, setEnd] = useState(initial?.endTime ?? '17:00');
  const [label, setLabel] = useState(initial?.label ?? '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (start >= end) {
      toast.error('Start time must be before end time.');
      return;
    }

    setLoading(true);
    const method = initial ? 'PUT' : 'POST';
    const url = initial ? `/api/slots/${initial.id}` : '/api/slots';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayOfWeek: day, startTime: start, endTime: end, label: label || null }),
    });

    setLoading(false);

    if (res.ok) {
      toast.success(initial ? 'Slot updated' : 'Slot added');
      onSuccess();
    } else {
      const msg = await res.text();
      toast.error(msg || 'Something went wrong.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Day</Label>
        <Select value={String(day)} onValueChange={(v) => setDay(Number(v))}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DAYS.map((d, i) => (
              <SelectItem key={d} value={String(i)}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>From</Label>
          <Select value={start} onValueChange={setStart}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {TIME_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>To</Label>
          <Select value={end} onValueChange={setEnd}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {TIME_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="label">Label (optional)</Label>
        <Input
          id="label"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Morning focus block"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {initial ? 'Update slot' : 'Add slot'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
