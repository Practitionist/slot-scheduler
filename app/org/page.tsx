'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { Navbar } from '@/components/Navbar';
import { TeamManagement } from '@/components/TeamManagement';
import { ProductManagement } from '@/components/ProductManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function initials(name?: string | null) {
  if (!name) return '?';
  const p = name.trim().split(/\s+/);
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export default function OrgPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const activeTeamId = (session?.session as { activeTeamId?: string } | undefined)?.activeTeamId ?? null;
  const { data: orgs } = authClient.useListOrganizations();
  const { data: activeOrg, isPending } = authClient.useActiveOrganization();
  // `teams` is present on the full org at runtime (teams enabled) but not on the
  // hook's inferred type — read it through a typed accessor.
  const teams = ((activeOrg as { teams?: { id: string; name: string }[] } | null)?.teams) ?? [];

  const [orgName, setOrgName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteTeam, setInviteTeam] = useState<string>('none');
  const [busy, setBusy] = useState(false);

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await authClient.organization.create({ name: orgName, slug: slugify(orgName) });
    if (error) toast.error(error.message ?? 'Could not create organization');
    else {
      await authClient.organization.setActive({ organizationId: data!.id });
      toast.success(`Created ${orgName}`);
      setOrgName('');
    }
    setBusy(false);
  }

  async function createTeam(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await authClient.organization.createTeam({ name: teamName });
    if (error) toast.error(error.message ?? 'Could not create team');
    else { toast.success(`Created team ${teamName}`); setTeamName(''); }
    setBusy(false);
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await authClient.organization.inviteMember({
      email: inviteEmail,
      role: 'member',
      teamId: inviteTeam === 'none' ? undefined : inviteTeam,
    });
    if (error || !data) {
      toast.error(error?.message ?? 'Could not create invitation');
    } else {
      const link = `${window.location.origin}/auth/accept-invitation?id=${data.id}`;
      await navigator.clipboard.writeText(link).catch(() => {});
      toast.success('Invite link copied — share it with the intern', { description: link });
      setInviteEmail('');
    }
    setBusy(false);
  }

  if (isPending) return null;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Navbar />

      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Organization</h1>
        {orgs && orgs.length > 0 && (
          <Select
            value={activeOrg?.id ?? ''}
            onValueChange={(id) => authClient.organization.setActive({ organizationId: id })}
          >
            <SelectTrigger size="sm" className="w-[220px]">
              <SelectValue placeholder="Switch organization" />
            </SelectTrigger>
            <SelectContent>
              {orgs.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {!activeOrg ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create your organization</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createOrg} className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="orgName">Name</Label>
                <Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} required placeholder="Acme Interns" />
              </div>
              <Button type="submit" disabled={busy || !orgName.trim()}>
                <Plus className="size-4" /> Create
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Teams */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Teams</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {teams.length > 0 ? (
                  teams.map((t) => (
                    <Badge key={t.id} variant="secondary" className="gap-1">
                      <Users className="size-3" /> {t.name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No teams yet.</p>
                )}
              </div>
              <form onSubmit={createTeam} className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="teamName">New team</Label>
                  <Input id="teamName" value={teamName} onChange={(e) => setTeamName(e.target.value)} required placeholder="Frontend" />
                </div>
                <Button type="submit" variant="outline" disabled={busy || !teamName.trim()}>
                  <Plus className="size-4" /> Add team
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Team membership */}
          <TeamManagement
            teams={teams}
            members={activeOrg.members ?? []}
            activeTeamId={activeTeamId}
            onChanged={() => router.refresh()}
          />

          {/* Products (cross-cutting axis) */}
          <ProductManagement members={activeOrg.members ?? []} />

          {/* Invite */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invite a member</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={invite} className="flex flex-wrap items-end gap-2">
                <div className="min-w-[200px] flex-1 space-y-2">
                  <Label htmlFor="inviteEmail">Email</Label>
                  <Input id="inviteEmail" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required placeholder="intern@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Team (optional)</Label>
                  <Select value={inviteTeam} onValueChange={setInviteTeam}>
                    <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No team</SelectItem>
                      {teams.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={busy || !inviteEmail.trim()}>
                  <Copy className="size-4" /> Create invite link
                </Button>
              </form>
              <p className="text-muted-foreground mt-2 text-xs">
                No email is sent yet — the accept link is copied to your clipboard to share.
              </p>
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Members ({activeOrg.members?.length ?? 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {activeOrg.members?.map((m) => (
                  <li key={m.id} className="flex items-center gap-3">
                    <Avatar className="size-7">
                      {m.user.image ? <AvatarImage src={m.user.image} alt={m.user.name} /> : null}
                      <AvatarFallback className="text-xs">{initials(m.user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{m.user.name}</span>
                    <span className="text-muted-foreground text-sm">{m.user.email}</span>
                    <Badge variant="outline" className="ml-auto">{m.role}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Pending invitations */}
          {activeOrg.invitations && activeOrg.invitations.filter((i) => i.status === 'pending').length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pending invitations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {activeOrg.invitations.filter((i) => i.status === 'pending').map((i) => (
                    <li key={i.id} className="flex items-center gap-3 text-sm">
                      <span>{i.email}</span>
                      <Badge variant="secondary" className="ml-auto">{i.status}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const link = `${window.location.origin}/auth/accept-invitation?id=${i.id}`;
                          navigator.clipboard.writeText(link).then(() => toast.success('Invite link copied'));
                        }}
                      >
                        <Copy className="size-4" /> Copy link
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </main>
  );
}
