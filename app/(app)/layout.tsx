import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar userName={session?.user?.name} userImage={session?.user?.image} />
      <div className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
