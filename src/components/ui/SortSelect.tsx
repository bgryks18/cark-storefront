'use client';

import { useSearchParams } from 'next/navigation';

import { usePathname, useRouter } from '@/i18n/navigation';
import { ChevronDown } from 'lucide-react';

interface SortOption {
  value: string;
  label: string;
}

interface SortSelectProps {
  options: SortOption[];
  currentSort: string;
  label: string;
}

export function SortSelect({ options, currentSort, label }: SortSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    // Mevcut filter param'larını koru
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== options[0]?.value) {
      params.set('sort', value);
    } else {
      params.delete('sort');
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-text-muted">{label}</label>
      <div className="relative">
        <select
          value={currentSort}
          onChange={handleChange}
          className="h-10 appearance-none rounded-xl border border-card-border bg-card pl-3 pr-9 text-sm text-text-base outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
          aria-hidden
        />
      </div>
    </div>
  );
}
