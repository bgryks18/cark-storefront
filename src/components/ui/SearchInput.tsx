'use client';

import { useRef } from 'react';
import { Search, X } from 'lucide-react';

import { useRouter, usePathname } from '@/i18n/navigation';

interface SearchInputProps {
  defaultValue?: string;
  placeholder?: string;
}

export function SearchInput({ defaultValue = '', placeholder }: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = inputRef.current?.value.trim();
    if (q) {
      router.push(`${pathname}?q=${encodeURIComponent(q)}`);
    } else {
      router.push(pathname);
    }
  }

  function handleClear() {
    if (inputRef.current) inputRef.current.value = '';
    router.push(pathname);
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      <input
        ref={inputRef}
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-card-border bg-card pl-11 pr-11 text-base text-text-base placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {defaultValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-text-base"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
