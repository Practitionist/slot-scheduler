'use client';

import { useCallback, useEffect, useState } from 'react';
import { Boxes, Plus, Trash2, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type OrgMember = { userId: string; user: { name: string; email: string; image?: string | null } };
type Product = { id: string; name: string; memberIds: string[] };

function initials(name?: string | null) {
  if (!name) return '?';
  const p = name.trim().split(/\s+/);
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export function ProductManagement({ members, isAdmin }: { members: OrgMember[]; isAdmin: boolean }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState('');
  const [pick, setPick] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const res = await fetch('/api/products');
    if (res.ok) setProducts(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (res.ok) { toast.success(`Created product ${name}`); setName(''); load(); }
    else toast.error((await res.text()) || 'Could not create product');
  }

  async function setMember(productId: string, userId: string, action: 'add' | 'remove') {
    const res = await fetch(`/api/products/${productId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action }),
    });
    if (res.ok) { toast.success(action === 'add' ? 'Added to product' : 'Removed from product'); setPick((p) => ({ ...p, [productId]: '' })); load(); }
    else toast.error((await res.text()) || 'Could not update product membership');
  }

  async function remove(productId: string) {
    if (!confirm('Delete this product?')) return;
    const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Product deleted'); load(); }
    else toast.error('Could not delete product');
  }

  const memberOf = (uid: string) => members.find((m) => m.userId === uid)?.user;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Boxes className="size-4" /> Products
          <span className="text-muted-foreground text-xs font-normal">
            (cross-cutting — a person can be in any number of products and teams)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {isAdmin && (
          <form onSubmit={create} className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="productName">New product</Label>
              <Input id="productName" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Payments" />
            </div>
            <Button type="submit" variant="outline" disabled={!name.trim()}>
              <Plus className="size-4" /> Add product
            </Button>
          </form>
        )}

        {products.length === 0 ? (
          <p className="text-muted-foreground text-sm">No products yet.</p>
        ) : (
          products.map((p) => {
            const candidates = members.filter((m) => !p.memberIds.includes(m.userId));
            return (
              <div key={p.id} className="space-y-2 border-b pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{p.name}</span>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto text-destructive hover:text-destructive"
                      onClick={() => remove(p.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>

                {p.memberIds.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No members yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {p.memberIds.map((uid) => {
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
                              onClick={() => setMember(p.id, uid, 'remove')}
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
                    <Select value={pick[p.id] ?? ''} onValueChange={(v) => setPick((prev) => ({ ...prev, [p.id]: v }))}>
                      <SelectTrigger size="sm" className="w-[220px]">
                        <SelectValue placeholder="Add a member…" />
                      </SelectTrigger>
                      <SelectContent>
                        {candidates.map((m) => (
                          <SelectItem key={m.userId} value={m.userId}>{m.user.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => setMember(p.id, pick[p.id], 'add')} disabled={!pick[p.id]}>
                      <Plus className="size-4" /> Add
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
