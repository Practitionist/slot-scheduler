'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarClock, LogOut } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';

function initials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Props = { userName?: string | null; userImage?: string | null };

const LINKS = [
  { href: '/dashboard', label: 'Heatmap' },
  { href: '/my-slots', label: 'My Slots' },
  { href: '/appointments', label: 'Appointments' },
  { href: '/org', label: 'Org' },
];

export function Navbar({ userName, userImage }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push('/auth/sign-in');
    router.refresh();
  }

  return (
    <nav className="mb-8 flex items-center justify-between border-b pb-4">
      <div className="flex items-center gap-6">
        <span className="flex items-center gap-2 font-semibold">
          <CalendarClock className="size-5 text-primary" />
          Slot Scheduler
        </span>
        <div className="flex gap-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {userName && (
          <span className="flex items-center gap-2 text-sm">
            <Avatar className="size-7">
              {userImage ? <AvatarImage src={userImage} alt={userName} /> : null}
              <AvatarFallback className="text-xs">{initials(userName)}</AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground hidden sm:inline">{userName}</span>
          </span>
        )}
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </nav>
  );
}
