import Link from 'next/link';
import { headers } from 'next/headers';
import { CalendarClock, Clock, Globe2, Users, CalendarCheck, ArrowRight } from 'lucide-react';
import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

const FEATURES = [
  {
    icon: Globe2,
    title: 'Timezone-aware',
    body: 'Everyone sets availability in their own timezone; overlaps stay correct across DST and continents.',
  },
  {
    icon: Clock,
    title: 'Golden-hours heatmap',
    body: 'See exactly when the most people are free — the best window for a distributed team to meet.',
  },
  {
    icon: Users,
    title: 'Orgs, teams & products',
    body: 'Group interns by team or product (matrix-friendly) and scope the heatmap to any slice.',
  },
  {
    icon: CalendarCheck,
    title: 'Appointments + RSVP',
    body: 'Book one-off meetings with attendees who accept or decline — times shown in each viewer’s zone.',
  },
];

export default async function LandingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const signedIn = Boolean(session?.user);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between p-6">
        <span className="flex items-center gap-2 font-semibold">
          <CalendarClock className="text-primary size-5" /> Slot Scheduler
        </span>
        <nav className="flex items-center gap-2">
          {signedIn ? (
            <Button asChild>
              <Link href="/dashboard">Open app <ArrowRight className="size-4" /></Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/auth/sign-in">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/sign-up">Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6">
        <section className="flex flex-col items-center gap-6 py-16 text-center md:py-24">
          <span className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs font-medium">
            Scheduling for distributed intern teams
          </span>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance md:text-6xl">
            Find the time everyone’s free — across teams, timezones and continents.
          </h1>
          <p className="text-muted-foreground max-w-xl text-lg text-pretty">
            Interns share their weekly availability in their own timezone. Slot Scheduler overlays
            everyone onto one heatmap and highlights the golden hours to meet.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href={signedIn ? '/dashboard' : '/auth/sign-up'}>
                {signedIn ? 'Open the heatmap' : 'Get started free'} <ArrowRight className="size-4" />
              </Link>
            </Button>
            {!signedIn && (
              <Button asChild size="lg" variant="outline">
                <Link href="/auth/sign-in">I already have an account</Link>
              </Button>
            )}
          </div>
        </section>

        {/* Features */}
        <section className="grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-card rounded-xl border p-5">
              <f.icon className="text-primary mb-3 size-6" />
              <h3 className="mb-1 font-semibold">{f.title}</h3>
              <p className="text-muted-foreground text-sm">{f.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="text-muted-foreground mx-auto w-full max-w-6xl border-t p-6 text-sm">
        Slot Scheduler · built for interns worldwide
      </footer>
    </div>
  );
}
