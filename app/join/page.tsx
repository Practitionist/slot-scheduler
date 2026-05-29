'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
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

    toast.success('Joined successfully!');
    router.push('/overview');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Join an organization</CardTitle>
          <CardDescription>Enter the join code you received from your team admin.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. AB3X7YKZ"
              maxLength={12}
              autoComplete="off"
              autoFocus
            />
            <Button type="submit" className="w-full" disabled={busy || !code}>
              {busy ? 'Joining…' : 'Join'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
