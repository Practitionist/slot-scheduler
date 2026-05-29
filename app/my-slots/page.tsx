'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { SlotList } from '@/components/SlotList';
import { SlotForm } from '@/components/SlotForm';
import type { AvailabilitySlot } from '@/app/generated/prisma/client';

export default function MySlotsPage() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadSlots() {
    const res = await fetch('/api/slots/me');
    if (res.ok) {
      setSlots(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => {
    loadSlots();
  }, []);

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <Navbar />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Availability</h1>
          <p className="text-sm text-gray-500 mt-1">Set your weekly recurring availability (IST)</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium"
        >
          {showForm ? 'Cancel' : '+ Add Slot'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-lg p-4 mb-6 shadow-sm">
          <h2 className="font-semibold mb-4">New Availability Slot</h2>
          <SlotForm
            onSuccess={() => {
              setShowForm(false);
              loadSlots();
            }}
          />
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : (
        <SlotList slots={slots} onRefresh={loadSlots} />
      )}
    </main>
  );
}
