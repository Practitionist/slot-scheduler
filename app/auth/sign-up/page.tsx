import { AuthForm } from '@/components/AuthForm';
import { enabledOAuthProviders } from '@/lib/oauth';

export default function SignUpPage() {
  return <AuthForm mode="sign-up" providers={enabledOAuthProviders()} />;
}
