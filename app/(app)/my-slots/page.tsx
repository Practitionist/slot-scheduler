'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { SlotList } from '@/components/SlotList';
import { SlotForm } from '@/components/SlotForm';
import { TimezoneSelect } from '@/components/TimezoneSelect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { AvailabilitySlot } from '@/app/generated/prisma/client';

export default function MySlotsPage() {
  const router = useRouter();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  async function deleteAccount() {
    if (!confirm('Delete your account? This permanently removes your data. If you own an organization with other members, transfer ownership first.')) return;
    const { error } = await authClient.deleteUser();
    if (error) toast.error(error.message ?? 'Could not delete account');
    else { toast.success('Account deleted'); router.push('/'); router.refresh(); }
  }

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
    <main className="mx-auto max-w-2xl">

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

      <Card className="border-destructive/40 mt-8">
        <CardHeader>
          <CardTitle className="text-destructive text-base">Danger zone</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">
            Delete your account and all your data. This can’t be undone.
          </p>
          <Button variant="destructive" onClick={deleteAccount}>
            <Trash2 className="size-4" /> Delete account
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
