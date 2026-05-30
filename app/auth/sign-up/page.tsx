import { AuthForm } from '@/components/AuthForm';
import { enabledOAuthProviders } from '@/lib/oauth';

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  return <AuthForm mode="sign-up" providers={enabledOAuthProviders()} returnTo={returnTo} />;
}
