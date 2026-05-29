'use client';

import { useCallback, useEffect, useState } from 'react';
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { CalendarPlus, Check, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const VIEWER_TZ =
  typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Asia/Kolkata';

type Attendee = { userId: string; status: string; user: { name: string; image: string | null } };
type Appointment = {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  timezone: string;
  organizer: { id: string; name: string; image: string | null };
  attendees: Attendee[];
  isOrganizer: boolean;
  myStatus: string | null;
};

function initials(name?: string | null) {
  if (!name) return '?';
  const p = name.trim().split(/\s+/);
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase();
}
const STATUS_VARIANT: Record<string, 'secondary' | 'default' | 'outline'> = {
  accepted: 'default',
  pending: 'secondary',
  declined: 'outline',
};

export default function AppointmentsPage() {
  const { data: activeOrg } = authClient.useActiveOrganization();
  const { data: session } = authClient.useSession();
  const members = (activeOrg?.members ?? []).filter((m) => m.user && m.userId !== session?.user?.id);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    const res = await fetch('/api/appointments');
    if (res.ok) setAppointments(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function toggleAttendee(id: string) {
    setAttendeeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!start || !end) return;
    setBusy(true);
    // datetime-local is wall-clock in the viewer's tz -> convert to absolute UTC.
    const startsAt = fromZonedTime(start, VIEWER_TZ).toISOString();
    const endsAt = fromZonedTime(end, VIEWER_TZ).toISOString();
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, startsAt, endsAt, timezone: VIEWER_TZ, attendeeIds }),
    });
    setBusy(false);
    if (res.ok) {
      toast.success('Appointment created');
      setTitle(''); setStart(''); setEnd(''); setAttendeeIds([]);
      load();
    } else {
      toast.error((await res.text()) || 'Could not create appointment');
    }
  }

  async function respond(id: string, status: 'accepted' | 'declined') {
    const res = await fetch(`/api/appointments/${id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) { toast.success(`Marked ${status}`); load(); }
    else toast.error('Could not respond');
  }

  async function remove(id: string) {
    if (!confirm('Delete this appointment?')) return;
    const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Appointment deleted'); load(); }
    else toast.error('Could not delete');
  }

  return (
    <main className="mx-auto max-w-2xl">

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          One-off meetings with RSVP · times shown in your timezone ({VIEWER_TZ})
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">New appointment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={create} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="1:1 with mentor" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start">Starts</Label>
                <Input id="start" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">Ends</Label>
                <Input id="end" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Attendees{members.length === 0 ? ' (join an org to invite people)' : ''}</Label>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => {
                  const on = attendeeIds.includes(m.userId);
                  return (
                    <button
                      type="button"
                      key={m.userId}
                      onClick={() => toggleAttendee(m.userId)}
                      className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-sm transition-colors ${on ? 'bg-secondary border-transparent' : 'hover:bg-muted'}`}
                    >
                      <Avatar className="size-5">
                        {m.user.image ? <AvatarImage src={m.user.image} alt={m.user.name} /> : null}
                        <AvatarFallback className="text-[9px]">{initials(m.user.name)}</AvatarFallback>
                      </Avatar>
                      {m.user.name}
                      {on && <Check className="size-3" />}
                    </button>
                  );
                })}
              </div>
            </div>
            <Button type="submit" disabled={busy}>
              <CalendarPlus className="size-4" /> Create appointment
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : appointments.length === 0 ? (
        <Card className="border-dashed p-8 text-center">
          <p className="text-muted-foreground text-sm">No appointments yet.</p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {appointments.map((a) => (
            <li key={a.id}>
              <Card className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{a.title}</p>
                    <p className="text-muted-foreground text-sm tabular-nums">
                      {formatInTimeZone(new Date(a.startsAt), VIEWER_TZ, 'EEE d MMM, HH:mm')}
                      {' – '}
                      {formatInTimeZone(new Date(a.endsAt), VIEWER_TZ, 'HH:mm')}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Organizer: {a.organizer.name}
                    </p>
                  </div>
                  {a.isOrganizer && (
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => remove(a.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>

                {a.attendees.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {a.attendees.map((at) => (
                      <Badge key={at.userId} variant={STATUS_VARIANT[at.status] ?? 'secondary'} className="gap-1 font-normal">
                        {at.user.name} · {at.status}
                      </Badge>
                    ))}
                  </div>
                )}

                {a.myStatus && a.myStatus !== 'accepted' && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => respond(a.id, 'accepted')}>
                      <Check className="size-4" /> Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => respond(a.id, 'declined')}>
                      <X className="size-4" /> Decline
                    </Button>
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
