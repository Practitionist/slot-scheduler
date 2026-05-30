'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { friendlyAuthError } from '@/lib/auth-errors';
import { safeReturnTo } from '@/lib/safe-redirect';
import { SocialAuthButtons } from '@/components/SocialAuthButtons';
import type { OAuthProvider } from '@/lib/oauth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type Props = {
  mode: 'sign-in' | 'sign-up';
  providers: OAuthProvider[];
  /** Where to land after auth succeeds (e.g. back to `/join?code=…`). */
  returnTo?: string;
};

export function AuthForm({ mode, providers, returnTo }: Props) {
  const isSignUp = mode === 'sign-up';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const destination = safeReturnTo(returnTo);
  // Carry the destination across the sign-in ⇄ sign-up toggle so the user never
  // loses their place mid-funnel.
  const toggleHref =
    (isSignUp ? '/auth/sign-in' : '/auth/sign-up') +
    (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = isSignUp
      ? await authClient.signUp.email({
          name,
          email,
          password,
          // Capture the intern's tz so heatmap overlaps are DST-correct.
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
        })
      : await authClient.signIn.email({ email, password });

    setLoading(false);

    if (result.error) {
      toast.error(friendlyAuthError(result.error, `${isSignUp ? 'Sign up' : 'Sign in'} failed. Please try again.`));
    } else {
      toast.success(isSignUp ? 'Account created!' : 'Welcome back!');
      router.push(destination);
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{isSignUp ? 'Create account' : 'Welcome back'}</CardTitle>
          <CardDescription>
            {isSignUp ? 'Join the intern availability scheduler' : 'Sign in to your intern scheduler account'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {providers.length > 0 && (
            <>
              <SocialAuthButtons providers={providers} callbackURL={destination} />
              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-muted-foreground text-xs">or</span>
                <Separator className="flex-1" />
              </div>
            </>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isSignUp ? 8 : undefined}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading
                ? isSignUp
                  ? 'Creating account…'
                  : 'Signing in…'
                : isSignUp
                  ? 'Sign up'
                  : 'Sign in'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-muted-foreground text-sm">
            {isSignUp ? 'Already have an account? ' : 'No account? '}
            <Link
              href={toggleHref}
              className="text-foreground font-medium underline-offset-4 hover:underline"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
