'use client';

import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type ScopeOption = { value: string; label: string };

type Props = { current: string; options: ScopeOption[] };

export function ScopePicker({ current, options }: Props) {
  const router = useRouter();
  return (
    <Select value={current} onValueChange={(v) => router.push(`/dashboard?scope=${encodeURIComponent(v)}`)}>
      <SelectTrigger size="sm" className="w-[200px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Show availability for</SelectLabel>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
