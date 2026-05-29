'use client';

import { useState } from 'react';

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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (start >= end) {
      setError('Start time must be before end time');
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
      onSuccess();
    } else {
      const msg = await res.text();
      setError(msg || 'Something went wrong');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Day</label>
        <select
          value={day}
          onChange={(e) => setDay(Number(e.target.value))}
          className="w-full border rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {DAYS.map((d, i) => (
            <option key={d} value={i}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">From</label>
          <select
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full border rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">To</label>
          <select
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full border rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Label (optional)</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="e.g. Morning focus block"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 font-medium"
        >
          {loading ? 'Saving...' : initial ? 'Update Slot' : 'Add Slot'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:bg-gray-100 font-medium"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
