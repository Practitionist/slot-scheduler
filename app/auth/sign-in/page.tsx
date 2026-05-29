import { AuthForm } from '@/components/AuthForm';
import { enabledOAuthProviders } from '@/lib/oauth';

export default function SignInPage() {
  return <AuthForm mode="sign-in" providers={enabledOAuthProviders()} />;
}
