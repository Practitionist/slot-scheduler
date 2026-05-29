'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export function Navbar({ userName }: { userName?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push('/sign-in');
    router.refresh();
  }

  return (
    <nav className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
      <div className="flex gap-6">
        <Link
          href="/dashboard"
          className={`font-medium hover:text-green-600 ${pathname === '/dashboard' ? 'text-green-600' : 'text-gray-700'}`}
        >
          Heatmap
        </Link>
        <Link
          href="/my-slots"
          className={`font-medium hover:text-green-600 ${pathname === '/my-slots' ? 'text-green-600' : 'text-gray-700'}`}
        >
          My Slots
        </Link>
      </div>
      <div className="flex items-center gap-3">
        {userName && <span className="text-sm text-gray-500">{userName}</span>}
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-600 hover:text-red-600 font-medium"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
