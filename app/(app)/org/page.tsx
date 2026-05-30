'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, Key, LogIn, Plus, Trash2, Users } from 'lucide-react';

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
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

function shareOnWhatsApp(text: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function initials(name?: string | null) {
  if (!name) return '?';
  const p = name.trim().split(/\s+/);
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase();
}

const STARTER_TEAM_PRESETS = ['Engineering', 'UI/UX', 'Testing', 'Finance', 'Product', 'Design', 'Marketing', 'Operations'];

export default function OrgPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const activeTeamId = (session?.session as { activeTeamId?: string } | undefined)?.activeTeamId ?? null;
  const { data: orgs } = authClient.useListOrganizations();
  const { data: activeOrg, isPending } = authClient.useActiveOrganization();
  // `teams` is present on the full org at runtime (teams enabled) but not on the
  // hook's inferred type — read it through a typed accessor.
  const teams = ((activeOrg as { teams?: { id: string; name: string }[] } | null)?.teams) ?? [];
  const myUserId = session?.user?.id;
  const myRole = activeOrg?.members?.find((m) => m.userId === myUserId)?.role ?? null;
  const isAdmin = myRole === 'owner' || myRole === 'admin';
  const isOwner = myRole === 'owner';

  const [orgName, setOrgName] = useState('');
  const [starterTeams, setStarterTeams] = useState<string[]>(['Engineering', 'UI/UX', 'Testing']);
  const [customTeam, setCustomTeam] = useState('');
  const [teamName, setTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteTeam, setInviteTeam] = useState<string>('none');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [busy, setBusy] = useState(false);

  type JoinCode = {
    id: string; code: string; orgId: string; teamId: string | null;
    productId: string | null; role: string; expiresAt: string | null;
    maxUses: number | null; uses: number; createdAt: string;
    createdBy: { name: string };
  };
  const [joinCodes, setJoinCodes] = useState<JoinCode[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [codeTeam, setCodeTeam] = useState('none');
  const [codeProduct, setCodeProduct] = useState('none');
  const [codeExpiry, setCodeExpiry] = useState('');
  const [codeMaxUses, setCodeMaxUses] = useState('');

  useEffect(() => {
    if (!activeOrg || !isAdmin) return;
    fetch('/api/join-codes').then((r) => r.json()).then(setJoinCodes).catch(() => {});
    fetch('/api/products').then((r) => r.json()).then((data) =>
      setProducts(data.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })))
    ).catch(() => {});
  }, [activeOrg?.id, isAdmin]);

  function toggleStarter(name: string) {
    setStarterTeams((prev) => (prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]));
  }
  function addCustomTeam() {
    const n = customTeam.trim();
    if (n && !starterTeams.includes(n)) setStarterTeams((prev) => [...prev, n]);
    setCustomTeam('');
  }

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await authClient.organization.create({ name: orgName, slug: slugify(orgName) });
    if (error || !data) {
      toast.error(error?.message ?? 'Could not create organization');
      setBusy(false);
      return;
    }
    await authClient.organization.setActive({ organizationId: data.id });
    // Create the chosen starter teams (no auto default team).
    for (const name of starterTeams) {
      await authClient.organization.createTeam({ name, organizationId: data.id });
    }
    toast.success(`Created ${orgName}${starterTeams.length ? ` with ${starterTeams.length} team(s)` : ''}`);
    setOrgName('');
    setBusy(false);
  }

  async function joinWithCode(e: React.FormEvent) {
    e.preventDefault();
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) return;
    setBusy(true);
    const res = await fetch('/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) {
      const text = await res.text();
      toast.error(text || 'Invalid or expired code');
      setBusy(false);
      return;
    }
    const { orgId, orgName, alreadyMember } = (await res.json().catch(() => ({}))) as {
      orgId?: string;
      orgName?: string;
      alreadyMember?: boolean;
    };
    if (orgId) await authClient.organization.setActive({ organizationId: orgId });
    toast.success(
      alreadyMember
        ? `You're already a member${orgName ? ` of ${orgName}` : ''}.`
        : `Joined${orgName ? ` ${orgName}` : ''}!`
    );
    setJoinCodeInput('');
    setBusy(false);
    router.refresh();
  }

  async function createTeam(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await authClient.organization.createTeam({ name: teamName });
    if (error) toast.error(error.message ?? 'Could not create team');
    else { toast.success(`Created team ${teamName}`); setTeamName(''); }
    setBusy(false);
  }

  async function createInviteLink(): Promise<string | null> {
    setBusy(true);
    const { data, error } = await authClient.organization.inviteMember({
      email: inviteEmail,
      role: 'member',
      teamId: inviteTeam === 'none' ? undefined : inviteTeam,
    });
    setBusy(false);
    if (error || !data) {
      toast.error(error?.message ?? 'Could not create invitation');
      return null;
    }
    setInviteEmail('');
    return `${window.location.origin}/auth/accept-invitation?id=${data.id}`;
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    const link = await createInviteLink();
    if (!link) return;
    await navigator.clipboard.writeText(link).catch(() => {});
    toast.success('Invite link copied — share it with the intern', { description: link });
  }

  async function inviteViaWhatsApp() {
    const link = await createInviteLink();
    if (!link) return;
    shareOnWhatsApp(
      `Hi! You've been invited to join *${activeOrg?.name}* on Slot Scheduler.\n\nAccept your invitation here: ${link}`
    );
  }

  async function generateCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch('/api/join-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId: codeTeam !== 'none' ? codeTeam : undefined,
        productId: codeProduct !== 'none' ? codeProduct : undefined,
        expiresInDays: codeExpiry ? Number(codeExpiry) : undefined,
        maxUses: codeMaxUses ? Number(codeMaxUses) : undefined,
      }),
    });
    if (!res.ok) {
      toast.error('Could not generate code');
    } else {
      const code: JoinCode = await res.json();
      setJoinCodes((prev) => [code, ...prev]);
      toast.success(`Code ${code.code} created`);
      setCodeTeam('none'); setCodeProduct('none'); setCodeExpiry(''); setCodeMaxUses('');
    }
    setBusy(false);
  }

  async function revokeCode(id: string, code: string) {
    if (!confirm(`Revoke code ${code}? Anyone who has it will no longer be able to join.`)) return;
    const res = await fetch(`/api/join-codes/${id}`, { method: 'DELETE' });
    if (res.ok) setJoinCodes((prev) => prev.filter((c) => c.id !== id));
    else toast.error('Could not revoke code');
  }

  async function changeRole(memberId: string, role: string) {
    const { error } = await authClient.organization.updateMemberRole({ memberId, role });
    if (error) toast.error(error.message ?? 'Could not change role');
    else { toast.success(role === 'owner' ? 'Ownership transferred' : `Role set to ${role}`); router.refresh(); }
  }

  async function deleteOrg() {
    if (!activeOrg) return;
    if (!confirm(`Delete "${activeOrg.name}"? This permanently removes its teams, products and invitations.`)) return;
    const { error } = await authClient.organization.delete({ organizationId: activeOrg.id });
    if (error) toast.error(error.message ?? 'Could not delete organization');
    else { toast.success('Organization deleted'); router.refresh(); }
  }

  if (isPending) return null;

  const joinCard = (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <LogIn className="size-4" /> Join an organization
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={joinWithCode} className="flex flex-wrap items-end gap-2">
          <div className="min-w-[200px] flex-1 space-y-2">
            <Label htmlFor="joinCode">Join code</Label>
            <Input
              id="joinCode"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="e.g. AB3X7YKZ"
              maxLength={12}
              autoComplete="off"
            />
          </div>
          <Button type="submit" variant="outline" disabled={busy || !joinCodeInput.trim()}>
            <LogIn className="size-4" /> Join
          </Button>
        </form>
        <p className="text-muted-foreground mt-2 text-xs">
          Enter a join code shared by an admin to join their organization.
        </p>
      </CardContent>
    </Card>
  );

  return (
    <main className="mx-auto max-w-3xl">

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
        <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create your organization</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createOrg} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Name</Label>
                <Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} required placeholder="Acme Interns" />
              </div>

              <div className="space-y-2">
                <Label>Starter teams</Label>
                <p className="text-muted-foreground text-xs">Pick the teams to create now — you can add more later.</p>
                <div className="flex flex-wrap gap-2">
                  {STARTER_TEAM_PRESETS.map((name) => {
                    const on = starterTeams.includes(name);
                    return (
                      <button
                        type="button"
                        key={name}
                        onClick={() => toggleStarter(name)}
                        className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors ${on ? 'bg-secondary border-transparent' : 'hover:bg-muted'}`}
                      >
                        {on && <Check className="size-3" />} {name}
                      </button>
                    );
                  })}
                  {starterTeams
                    .filter((t) => !STARTER_TEAM_PRESETS.includes(t))
                    .map((name) => (
                      <button
                        type="button"
                        key={name}
                        onClick={() => toggleStarter(name)}
                        className="bg-secondary flex items-center gap-1 rounded-full border border-transparent px-3 py-1 text-sm"
                      >
                        <Check className="size-3" /> {name}
                      </button>
                    ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={customTeam}
                    onChange={(e) => setCustomTeam(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); addCustomTeam(); }
                    }}
                    placeholder="Add a custom team…"
                    className="max-w-xs"
                  />
                  <Button type="button" variant="outline" onClick={addCustomTeam} disabled={!customTeam.trim()}>
                    <Plus className="size-4" /> Add
                  </Button>
                </div>
              </div>

              <Button type="submit" disabled={busy || !orgName.trim()}>
                <Plus className="size-4" /> Create organization
              </Button>
            </form>
          </CardContent>
        </Card>
        {joinCard}
        </div>
      ) : (
        <div className="space-y-6">
          {joinCard}
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
            isAdmin={isAdmin}
            onChanged={() => router.refresh()}
          />

          {/* Products (cross-cutting axis) */}
          <ProductManagement members={activeOrg.members ?? []} isAdmin={isAdmin} />

          {/* Invite */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invite a member</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={invite} className="space-y-3">
                <div className="flex flex-wrap gap-2">
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
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="outline" disabled={busy || !inviteEmail.trim()}>
                    <Copy className="size-4" /> Copy link
                  </Button>
                  <Button
                    type="button"
                    disabled={busy || !inviteEmail.trim()}
                    className="bg-[#25D366] text-white hover:bg-[#1ebe5d]"
                    onClick={inviteViaWhatsApp}
                  >
                    <WhatsAppIcon className="size-4" /> WhatsApp
                  </Button>
                </div>
              </form>
              <p className="text-muted-foreground mt-2 text-xs">
                An email is sent to the invitee automatically. The accept link is also copied to your clipboard as a backup.
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
                    <span className="text-muted-foreground hidden text-sm sm:inline">{m.user.email}</span>
                    {isAdmin && m.userId !== myUserId ? (
                      <Select value={m.role} onValueChange={(r) => changeRole(m.id, r)}>
                        <SelectTrigger size="sm" className="ml-auto w-[150px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">member</SelectItem>
                          <SelectItem value="admin">admin</SelectItem>
                          {isOwner && <SelectItem value="owner">owner (transfer)</SelectItem>}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className="ml-auto">{m.role}</Badge>
                    )}
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#25D366]"
                        onClick={() => {
                          const link = `${window.location.origin}/auth/accept-invitation?id=${i.id}`;
                          shareOnWhatsApp(
                            `Hi! You've been invited to join *${activeOrg.name}* on Slot Scheduler.\n\nAccept your invitation here: ${link}`
                          );
                        }}
                      >
                        <WhatsAppIcon className="size-4" /> WhatsApp
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Join Codes — admin only */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="size-4" /> Join codes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-xs">
                  Share a code so people can join without a per-email invite. Codes can optionally also add them to a team or product.
                  Anyone with the URL <code className="bg-muted rounded px-1">/join</code> can enter a code to join.
                </p>

                {/* Existing codes */}
                {joinCodes.length > 0 && (
                  <ul className="space-y-2">
                    {joinCodes.map((jc) => {
                      const teamName = teams.find((t) => t.id === jc.teamId)?.name;
                      const productName = products.find((p) => p.id === jc.productId)?.name;
                      const scopeLabel = [
                        teamName && `Team: ${teamName}`,
                        productName && `Product: ${productName}`,
                      ].filter(Boolean).join(' · ') || 'Org only';
                      const expired = jc.expiresAt && new Date(jc.expiresAt) < new Date();
                      return (
                        <li key={jc.id} className="flex flex-wrap items-center gap-2 text-sm">
                          <code className="bg-muted rounded px-2 py-0.5 font-mono font-semibold tracking-wider">
                            {jc.code}
                          </code>
                          <Badge variant="outline" className="text-xs">{scopeLabel}</Badge>
                          <span className="text-muted-foreground text-xs">
                            {jc.uses}{jc.maxUses != null ? `/${jc.maxUses}` : ''} uses
                            {jc.expiresAt && ` · expires ${new Date(jc.expiresAt).toLocaleDateString()}`}
                            {expired && ' (expired)'}
                          </span>
                          <div className="ml-auto flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const url = `${window.location.origin}/join`;
                                navigator.clipboard.writeText(`${url}\nCode: ${jc.code}`).then(() =>
                                  toast.success('Join link + code copied')
                                );
                              }}
                            >
                              <Copy className="size-3" /> Copy
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[#25D366]"
                              onClick={() => {
                                const url = `${window.location.origin}/join`;
                                shareOnWhatsApp(
                                  `Hi! Join *${activeOrg.name}* on Slot Scheduler 🗓️\n\n1. Open: ${url}\n2. Enter code: *${jc.code}*`
                                );
                              }}
                            >
                              <WhatsAppIcon className="size-3" /> WhatsApp
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => revokeCode(jc.id, jc.code)}
                            >
                              <Trash2 className="size-3" /> Revoke
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* Generate new code */}
                <form onSubmit={generateCode} className="space-y-3 pt-2 border-t">
                  <p className="text-xs font-medium">Generate new code</p>
                  <div className="flex flex-wrap gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Team scope</Label>
                      <Select value={codeTeam} onValueChange={setCodeTeam}>
                        <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Org only</SelectItem>
                          {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {products.length > 0 && (
                      <div className="space-y-1">
                        <Label className="text-xs">Product scope</Label>
                        <Select value={codeProduct} onValueChange={setCodeProduct}>
                          <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label className="text-xs">Expires in (days)</Label>
                      <Input
                        type="number" min={1} value={codeExpiry}
                        onChange={(e) => setCodeExpiry(e.target.value)}
                        placeholder="∞" className="h-8 w-[100px] text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Max uses</Label>
                      <Input
                        type="number" min={1} value={codeMaxUses}
                        onChange={(e) => setCodeMaxUses(e.target.value)}
                        placeholder="∞" className="h-8 w-[100px] text-xs"
                      />
                    </div>
                  </div>
                  <Button type="submit" variant="outline" size="sm" disabled={busy}>
                    <Key className="size-3" /> Generate code
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Danger zone — owner only */}
          {isOwner && (
            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle className="text-destructive text-base">Danger zone</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-muted-foreground text-sm">
                  Permanently delete {activeOrg.name} and all of its teams, products and invitations.
                </p>
                <Button variant="destructive" onClick={deleteOrg}>
                  <Trash2 className="size-4" /> Delete organization
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </main>
  );
}
