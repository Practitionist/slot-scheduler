'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Full IANA list straight from the runtime — no extra dependency needed.
const ZONES =
  typeof Intl.supportedValuesOf === 'function'
    ? Intl.supportedValuesOf('timeZone')
    : ['Asia/Kolkata', 'America/New_York', 'Europe/London', 'UTC'];

export function TimezoneSelect() {
  const { data: session, isPending } = authClient.useSession();
  const [tz, setTz] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const current = session?.user?.timezone;
    if (current && !tz) setTz(current);
  }, [session, tz]);

  async function selectTz(next: string) {
    setTz(next);
    setOpen(false);
    setSaving(true);
    const { error } = await authClient.updateUser({ timezone: next });
    setSaving(false);
    if (error) toast.error('Could not save your timezone.');
    else toast.success(`Timezone set to ${next}`);
  }

  if (isPending) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm">Your timezone:</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" role="combobox" aria-expanded={open} className="justify-between font-normal">
            {tz || 'Select timezone'}
            {saving ? (
              <Loader2 className="size-4 animate-spin opacity-70" />
            ) : (
              <ChevronsUpDown className="size-4 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search timezone…" />
            <CommandList>
              <CommandEmpty>No timezone found.</CommandEmpty>
              <CommandGroup>
                {ZONES.map((z) => (
                  <CommandItem key={z} value={z} onSelect={selectTz}>
                    <Check className={cn('size-4', z === tz ? 'opacity-100' : 'opacity-0')} />
                    {z}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
