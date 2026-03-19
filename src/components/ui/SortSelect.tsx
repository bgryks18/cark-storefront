'use client';

import { useSearchParams } from 'next/navigation';

import { usePathname, useRouter } from '@/i18n/navigation';

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
    <div className="flex items-center gap-2">
      <label className="shrink-0 text-sm text-text-muted">{label}</label>
      <select
        value={currentSort}
        onChange={handleChange}
        className="rounded-lg border border-card-border bg-card px-3 py-1.5 text-sm text-text-base outline-none focus:border-primary focus:ring-1 focus:ring-primary"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
