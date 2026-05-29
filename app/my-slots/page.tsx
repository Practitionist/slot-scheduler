'use client';

import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { SlotList } from '@/components/SlotList';
import { SlotForm } from '@/components/SlotForm';
import { TimezoneSelect } from '@/components/TimezoneSelect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
    <main className="mx-auto max-w-2xl p-6">
      <Navbar />

      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">My Availability</h1>
          <p className="text-muted-foreground text-sm">
            Set your weekly recurring availability in your own timezone.
          </p>
          <TimezoneSelect />
        </div>
        <Button onClick={() => setShowForm((v) => !v)} variant={showForm ? 'outline' : 'default'}>
          {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
          {showForm ? 'Cancel' : 'Add slot'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">New availability slot</CardTitle>
          </CardHeader>
          <CardContent>
            <SlotForm
              onSuccess={() => {
                setShowForm(false);
                loadSlots();
              }}
            />
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <SlotList slots={slots} onRefresh={loadSlots} />
      )}
    </main>
  );
}
