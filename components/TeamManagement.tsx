'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Star, Trash2, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
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

type Team = { id: string; name: string };
type OrgMember = { userId: string; user: { name: string; email: string; image?: string | null } };

function initials(name?: string | null) {
  if (!name) return '?';
  const p = name.trim().split(/\s+/);
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export function TeamManagement({
  teams,
  members,
  activeTeamId,
  isAdmin,
  onChanged,
}: {
  teams: Team[];
  members: OrgMember[];
  activeTeamId: string | null;
  isAdmin: boolean;
  onChanged: () => void;
}) {
  // teamId -> set of member userIds
  const [byTeam, setByTeam] = useState<Record<string, string[]>>({});
  const [pick, setPick] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const next: Record<string, string[]> = {};
    for (const t of teams) {
      try {
        const res = await authClient.organization.listTeamMembers({ query: { teamId: t.id } });
        const rows = (res?.data ?? res) as Array<{ userId: string }> | undefined;
        next[t.id] = Array.isArray(rows) ? rows.map((r) => r.userId) : [];
      } catch {
        next[t.id] = [];
      }
    }
    setByTeam(next);
  }, [teams]);

  useEffect(() => {
    if (teams.length) load();
  }, [load, teams.length]);

  function memberOf(userId: string) {
    return members.find((m) => m.userId === userId)?.user;
  }

  async function deleteTeam(teamId: string, name: string) {
    if (!confirm(`Delete team "${name}"?`)) return;
    const { error } = await authClient.organization.removeTeam({ teamId });
    if (error) toast.error(error.message ?? 'Could not delete team');
    else { toast.success('Team deleted'); onChanged(); }
  }

  async function addMember(teamId: string) {
    const userId = pick[teamId];
    if (!userId) return;
    const { error } = await authClient.organization.addTeamMember({ teamId, userId });
    if (error) toast.error(error.message ?? 'Could not add member');
    else {
      toast.success('Added to team');
      setPick((p) => ({ ...p, [teamId]: '' }));
      load();
    }
  }

  async function removeMember(teamId: string, userId: string) {
    const { error } = await authClient.organization.removeTeamMember({ teamId, userId });
    if (error) toast.error(error.message ?? 'Could not remove member');
    else {
      toast.success('Removed from team');
      load();
    }
  }

  async function makeActive(teamId: string) {
    const { error } = await authClient.organization.setActiveTeam({ teamId });
    if (error) toast.error(error.message ?? 'Could not switch team');
    else {
      toast.success('Active team switched');
      onChanged();
    }
  }

  if (teams.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Team membership</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {teams.map((t) => {
          const memberIds = byTeam[t.id] ?? [];
          const candidates = members.filter((m) => !memberIds.includes(m.userId));
          const isActive = activeTeamId === t.id;
          return (
            <div key={t.id} className="space-y-2 border-b pb-4 last:border-b-0 last:pb-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{t.name}</span>
                {isActive ? (
                  <Badge className="gap-1"><Star className="size-3" /> active</Badge>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => makeActive(t.id)}>
                    Set active
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto text-destructive hover:text-destructive"
                    onClick={() => deleteTeam(t.id, t.name)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>

              {memberIds.length === 0 ? (
                <p className="text-muted-foreground text-sm">No members yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {memberIds.map((uid) => {
                    const u = memberOf(uid);
                    return (
                      <li key={uid} className="flex items-center gap-2">
                        <Avatar className="size-6">
                          {u?.image ? <AvatarImage src={u.image} alt={u.name} /> : null}
                          <AvatarFallback className="text-[9px]">{initials(u?.name)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{u?.name ?? uid}</span>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-auto text-destructive hover:text-destructive"
                            onClick={() => removeMember(t.id, uid)}
                          >
                            <UserMinus className="size-4" />
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {isAdmin && candidates.length > 0 && (
                <div className="flex items-end gap-2">
                  <Select value={pick[t.id] ?? ''} onValueChange={(v) => setPick((p) => ({ ...p, [t.id]: v }))}>
                    <SelectTrigger size="sm" className="w-[220px]">
                      <SelectValue placeholder="Add a member…" />
                    </SelectTrigger>
                    <SelectContent>
                      {candidates.map((m) => (
                        <SelectItem key={m.userId} value={m.userId}>{m.user.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => addMember(t.id)} disabled={!pick[t.id]}>
                    <Plus className="size-4" /> Add
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
