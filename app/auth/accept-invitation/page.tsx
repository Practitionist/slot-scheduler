'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Loader2, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function AcceptInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const invitationId = params.get('id');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function accept() {
    if (!invitationId) return;
    setLoading(true);
    const { error } = await authClient.organization.acceptInvitation({ invitationId });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? 'Could not accept the invitation');
    } else {
      setDone(true);
      toast.success('You joined the organization!');
      router.push('/overview');
      router.refresh();
    }
  }

  const shell = (children: React.ReactNode) => (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">{children}</Card>
    </div>
  );

  // 1. Session still resolving.
  if (sessionPending) {
    return shell(
      <CardContent className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading…
      </CardContent>
    );
  }

  // 2. Broken link — give them somewhere to go instead of a dead button.
  if (!invitationId) {
    return shell(
      <>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Invalid invitation</CardTitle>
          <CardDescription>This invitation link is missing its token. Ask your admin to resend it.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/overview">Go to dashboard</Link>
          </Button>
        </CardContent>
      </>
    );
  }

  // 3. Signed out — send them through auth and back to this exact invitation.
  if (!session?.user) {
    const returnTo = `/auth/accept-invitation?id=${encodeURIComponent(invitationId)}`;
    const authHref = (base: string) => `${base}?returnTo=${encodeURIComponent(returnTo)}`;
    return shell(
      <>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join organization</CardTitle>
          <CardDescription>
            Sign in or create an account with the invited email to accept — we&apos;ll bring you right back.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Button asChild className="w-full">
            <Link href={authHref('/auth/sign-up')}>
              <UserPlus className="size-4" /> Create account & join
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href={authHref('/auth/sign-in')}>
              <LogIn className="size-4" /> I already have an account
            </Link>
          </Button>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-muted-foreground text-center text-xs">
            Use the same email address your invitation was sent to.
          </p>
        </CardFooter>
      </>
    );
  }

  // 4. Joined.
  if (done) {
    return shell(
      <>
        <CardHeader className="text-center">
          <CheckCircle2 className="mx-auto size-8 text-primary" />
          <CardTitle className="text-2xl">You&apos;re in</CardTitle>
          <CardDescription>Taking you to your dashboard…</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/overview">Go to dashboard</Link>
          </Button>
        </CardContent>
      </>
    );
  }

  // 5. Signed in — accept.
  return shell(
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Join organization</CardTitle>
        <CardDescription>You were invited to join an organization on Slot Scheduler.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" onClick={accept} disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          Accept invitation
        </Button>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-muted-foreground text-center text-xs">
          Signed in as {session.user.email}. The invitation must match this email.
        </p>
      </CardFooter>
    </>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={null}>
      <AcceptInner />
    </Suspense>
  );
}
