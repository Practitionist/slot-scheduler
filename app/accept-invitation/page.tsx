'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
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
      router.push('/dashboard');
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join organization</CardTitle>
          <CardDescription>
            {invitationId
              ? 'You were invited to join an organization on Slot Scheduler.'
              : 'This invitation link is missing its token.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={accept} disabled={!invitationId || loading || done}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {done ? 'Joined' : 'Accept invitation'}
          </Button>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-muted-foreground text-xs">
            You must be signed in as the invited email for this to work.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={null}>
      <AcceptInner />
    </Suspense>
  );
}
