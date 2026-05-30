'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarClock, ChevronDown, LogOut } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function initials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Props = { userName?: string | null; userImage?: string | null };

type NavLink = { href: string; label: string };
type NavGroup = { label: string; items: NavLink[] };
type NavEntry = NavLink | NavGroup;

const isGroup = (entry: NavEntry): entry is NavGroup => 'items' in entry;

// Related scheduling views are grouped under a single "Schedule" dropdown.
const NAV: NavEntry[] = [
  { href: '/overview', label: 'Home' },
  {
    label: 'Schedule',
    items: [
      { href: '/heatmap', label: 'Heatmap' },
      { href: '/my-slots', label: 'My Slots' },
      { href: '/appointments', label: 'Appointments' },
    ],
  },
  { href: '/org', label: 'Org' },
];

const linkClasses = (active: boolean) =>
  cn(
    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
    active
      ? 'bg-secondary text-secondary-foreground'
      : 'text-muted-foreground hover:text-foreground'
  );

export function Navbar({ userName, userImage }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push('/auth/sign-in');
    router.refresh();
  }

  return (
    <nav className="bg-background/80 sticky top-0 z-20 border-b backdrop-blur">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <span className="flex items-center gap-2 font-semibold justify-self-start">
          <CalendarClock className="size-5 text-primary" />
          <span className="hidden sm:inline">Slot Scheduler</span>
        </span>

        <div className="flex items-center gap-1 justify-self-center">
          {NAV.map((entry) => {
            if (!isGroup(entry)) {
              return (
                <Link key={entry.href} href={entry.href} className={linkClasses(pathname === entry.href)}>
                  {entry.label}
                </Link>
              );
            }
            const active = entry.items.some((item) => pathname === item.href);
            return (
              <DropdownMenu key={entry.label}>
                <DropdownMenuTrigger
                  className={cn(linkClasses(active), 'flex items-center gap-1 outline-hidden')}
                >
                  {entry.label}
                  <ChevronDown className="size-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="min-w-[10rem]">
                  {entry.items.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        href={item.href}
                        className={cn(pathname === item.href && 'bg-secondary text-secondary-foreground')}
                      >
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
        </div>

        <div className="flex items-center gap-3 justify-self-end">
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
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
