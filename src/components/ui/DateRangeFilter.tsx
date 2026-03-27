'use client';

import { X } from 'lucide-react';

import { DateInput } from './DateInput';

interface DateRangeFilterProps {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  labelFrom?: string;
  labelTo?: string;
  clearLabel?: string;
}

export function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
  labelFrom,
  labelTo,
  clearLabel,
}: DateRangeFilterProps) {
  const hasFilter = from !== '' || to !== '';

  function handleClear() {
    onFromChange('');
    onToChange('');
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <DateInput
        label={labelFrom}
        value={from}
        max={to || undefined}
        onChange={(e) => onFromChange(e.target.value)}
        className="flex-1"
      />
      <DateInput
        label={labelTo}
        value={to}
        min={from || undefined}
        onChange={(e) => onToChange(e.target.value)}
        className="flex-1"
      />
      {hasFilter && (
        <button
          type="button"
          onClick={handleClear}
          className="flex h-10 items-center gap-1 rounded-xl border border-border px-3 text-sm text-text-muted transition-colors hover:bg-primary-hover hover:text-text-base"
          title={clearLabel}
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          {clearLabel}
        </button>
      )}
    </div>
  );
}
