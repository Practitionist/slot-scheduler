import { AuthForm } from '@/components/AuthForm';
import { enabledOAuthProviders } from '@/lib/oauth';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  return <AuthForm mode="sign-in" providers={enabledOAuthProviders()} returnTo={returnTo} />;
}
