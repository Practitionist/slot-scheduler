'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Loader2, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Status = 'idle' | 'joining' | 'success' | 'error';

function JoinInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: session, isPending: sessionPending } = authClient.useSession();

  const urlCode = (params.get('code') ?? '').toUpperCase();
  const [code, setCode] = useState(urlCode);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [joinedOrg, setJoinedOrg] = useState<string | null>(null);
  // Auto-join must fire at most once per page load, or a failed attempt would
  // loop forever while the code stays in the URL.
  const autoAttempted = useRef(false);

  const isAuthed = !!session?.user;

  const doJoin = useCallback(
    async (rawCode: string) => {
      const value = rawCode.trim().toUpperCase();
      if (!value) return;
      setStatus('joining');
      setError('');

      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: value }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        setError(text || 'Something went wrong. Please try again.');
        setStatus('error');
        return;
      }

      const { orgId, orgName, alreadyMember } = (await res.json().catch(() => ({}))) as {
        orgId?: string;
        orgName?: string;
        alreadyMember?: boolean;
      };
      // Make the joined org the active one so /overview opens straight into it.
      if (orgId) await authClient.organization.setActive({ organizationId: orgId }).catch(() => {});
      setJoinedOrg(orgName ?? null);
      setStatus('success');
      toast.success(
        alreadyMember
          ? `You're already a member${orgName ? ` of ${orgName}` : ''}.`
          : `Joined${orgName ? ` ${orgName}` : ''}!`
      );
      router.push('/overview');
      router.refresh();
    },
    [router]
  );

  // Once signed in with a code in the URL, complete the join automatically so
  // the round-trip through sign-up feels seamless.
  useEffect(() => {
    if (sessionPending || !isAuthed || !urlCode || autoAttempted.current) return;
    autoAttempted.current = true;
    void doJoin(urlCode);
  }, [sessionPending, isAuthed, urlCode, doJoin]);

  const shell = (children: React.ReactNode) => (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">{children}</Card>
    </div>
  );

  // 1. Session still resolving — avoid a flash of the wrong state.
  if (sessionPending) {
    return shell(
      <CardContent className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading…
      </CardContent>
    );
  }

  // 2. Joined — confirmation while we route to the app.
  if (status === 'success') {
    return shell(
      <>
        <CardHeader className="text-center">
          <CheckCircle2 className="mx-auto size-8 text-primary" />
          <CardTitle>You&apos;re in{joinedOrg ? `: ${joinedOrg}` : ''}</CardTitle>
          <CardDescription>Taking you to your dashboard…</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full" variant="outline">
            <Link href="/overview">Go to dashboard</Link>
          </Button>
        </CardContent>
      </>
    );
  }

  // 3. Signed out — collect the code, then funnel through auth carrying it back.
  if (!isAuthed) {
    const trimmed = code.trim().toUpperCase();
    const goAuth = (base: string) => {
      const returnTo = `/join?code=${encodeURIComponent(trimmed)}`;
      router.push(`${base}?returnTo=${encodeURIComponent(returnTo)}`);
    };

    return shell(
      <>
        <CardHeader>
          <CardTitle>Join an organization</CardTitle>
          <CardDescription>
            Enter your join code, then sign in or create an account — we&apos;ll bring you right back to finish joining.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (trimmed) goAuth('/auth/sign-up');
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="code">Join code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. AB3X7YKZ"
                maxLength={12}
                autoComplete="off"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Button type="submit" className="w-full" disabled={!trimmed}>
                <UserPlus className="size-4" /> Create account & join
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={!trimmed}
                onClick={() => goAuth('/auth/sign-in')}
              >
                <LogIn className="size-4" /> I already have an account
              </Button>
            </div>
          </form>
          {!trimmed && (
            <p className="text-muted-foreground text-center text-xs">Enter a code to continue.</p>
          )}
        </CardContent>
      </>
    );
  }

  // 4. Signed in — manual entry, retry after an error, or the auto-join in flight.
  return shell(
    <>
      <CardHeader>
        <CardTitle>Join an organization</CardTitle>
        <CardDescription>Enter the join code you received from your team admin.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void doJoin(code);
          }}
          className="space-y-4"
        >
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (status === 'error') setStatus('idle');
            }}
            placeholder="e.g. AB3X7YKZ"
            maxLength={12}
            autoComplete="off"
            autoFocus
          />
          {status === 'error' && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={status === 'joining' || !code.trim()}>
            {status === 'joining' && <Loader2 className="size-4 animate-spin" />}
            {status === 'joining' ? 'Joining…' : status === 'error' ? 'Try again' : 'Join'}
          </Button>
        </form>
      </CardContent>
    </>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinInner />
    </Suspense>
  );
}
