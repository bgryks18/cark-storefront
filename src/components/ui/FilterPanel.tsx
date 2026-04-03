'use client';

import { useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

import { usePathname, useRouter } from '@/i18n/navigation';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';

import type { ProductFilter } from '@/lib/shopify/queries/collection';
import { cn } from '@/lib/utils/cn';

import { Button } from './Button';

interface FilterPanelProps {
  filters: ProductFilter[];
}

function parsePriceFilter(filterParams: string[]): { min: string; max: string } {
  for (const f of filterParams) {
    try {
      const parsed = JSON.parse(f) as { price?: { min?: number; max?: number } };
      if (parsed.price !== undefined) {
        return {
          min: parsed.price.min !== undefined ? String(parsed.price.min) : '',
          max: parsed.price.max !== undefined ? String(parsed.price.max) : '',
        };
      }
    } catch {
      // ignore
    }
  }
  return { min: '', max: '' };
}

export function FilterPanel({ filters }: FilterPanelProps) {
  const t = useTranslations('collection');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(filters.map((f) => [f.id, true])),
  );
  const [isFiltering, setIsFiltering] = useState(false);
  const mobileWrapRef = useRef<HTMLDivElement>(null);

  const activeFilters = searchParams.getAll('filter');
  const currentPrice = parsePriceFilter(activeFilters);
  const [priceMin, setPriceMin] = useState(currentPrice.min);
  const [priceMax, setPriceMax] = useState(currentPrice.max);

  useEffect(() => {
    const p = parsePriceFilter(searchParams.getAll('filter'));
    setPriceMin(p.min);
    setPriceMax(p.max);
  }, [searchParams]);

  // searchParams değişince (yeni sayfa gelince) 500ms sonra loader'ı kaldır
  useEffect(() => {
    if (!isFiltering) return;
    const timer = setTimeout(() => setIsFiltering(false), 500);
    return () => clearTimeout(timer);
  }, [searchParams, isFiltering]);

  useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(e: MouseEvent) {
      if (mobileWrapRef.current && !mobileWrapRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  function toggleFilter(input: string) {
    const params = new URLSearchParams(searchParams.toString());
    const existing = params.getAll('filter');

    params.delete('filter');
    if (existing.includes(input)) {
      existing.filter((f) => f !== input).forEach((f) => params.append('filter', f));
    } else {
      [...existing, input].forEach((f) => params.append('filter', f));
    }

    const query = params.toString();
    setIsFiltering(true);
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function applyPrice() {
    const params = new URLSearchParams(searchParams.toString());
    const existing = params.getAll('filter').filter((f) => {
      try {
        return !(JSON.parse(f) as Record<string, unknown>).price;
      } catch {
        return true;
      }
    });
    params.delete('filter');
    existing.forEach((f) => params.append('filter', f));

    const min = parseFloat(priceMin);
    const max = parseFloat(priceMax);
    if (!isNaN(min) || !isNaN(max)) {
      const price: { min?: number; max?: number } = {};
      if (!isNaN(min)) price.min = min;
      if (!isNaN(max)) price.max = max;
      params.append('filter', JSON.stringify({ price }));
    }

    const query = params.toString();
    setIsFiltering(true);
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('filter');
    const query = params.toString();
    setIsFiltering(true);
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function toggleGroup(id: string) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  if (filters.length === 0) return null;

  const hasPriceRange = filters.some((f) => f.type === 'PRICE_RANGE');
  const activeCount = activeFilters.length;

  // ─── İçerik ────────────────────────────────────────────────────────────────
  const panelContent = (
    <div className="flex flex-col gap-4">
      {/* Başlık + Temizle */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-text-base">
          {t('filters')}
          {activeCount > 0 && !isFiltering && (
            <span className="rounded-full bg-primary px-1.5 aspect-square text-micro font-semibold text-white inline-flex items-center justify-center ">
              {activeCount}
            </span>
          )}
          {isFiltering && (
            <svg className="h-3.5 w-3.5 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          )}
        </span>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="cursor-pointer text-xs text-text-muted transition-colors hover:text-primary"
          >
            {t('clearFilters')}
          </button>
        )}
      </div>

      {/* Fiyat aralığı */}
      {hasPriceRange && (
        <div className="border-t border-border pt-4">
          <button
            onClick={() => toggleGroup('price')}
            aria-expanded={openGroups['price'] ?? true}
            className="flex w-full items-center justify-between text-sm font-medium text-text-base"
          >
            {t('priceRange')}
            <ChevronDown
              className={`h-4 w-4 text-text-muted transition-transform ${(openGroups['price'] ?? true) ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>
          <div
            className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${(openGroups['price'] ?? true) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
          >
            <div className="overflow-hidden">
              <form
                className="mt-3 flex flex-col gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  applyPrice();
                }}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    placeholder={t('priceMin')}
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="w-full rounded-md border border-card-border bg-surface px-2 py-1.5 text-sm text-text-base placeholder:text-text-muted focus:border-primary focus:outline-none"
                  />
                  <span className="shrink-0 text-text-muted">–</span>
                  <input
                    type="number"
                    min={0}
                    placeholder={t('priceMax')}
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    className="w-full rounded-md border border-card-border bg-surface px-2 py-1.5 text-sm text-text-base placeholder:text-text-muted focus:border-primary focus:outline-none"
                  />
                </div>
                <Button type="submit" size="sm">
                  {t('apply')}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Filtre grupları */}
      {filters
        .filter(
          (group) =>
            (group.type === 'LIST' || group.type === 'BOOLEAN') &&
            group.id !== 'filter.v.availability',
        )
        .map((group) => {
          const isGroupOpen = openGroups[group.id] ?? true;
          return (
            <div key={group.id} className="border-t border-border pt-4">
              <button
                onClick={() => toggleGroup(group.id)}
                aria-expanded={isGroupOpen}
                className="flex w-full items-center justify-between text-sm font-medium text-text-base"
              >
                {group.label}
                <ChevronDown
                  className={`h-4 w-4 text-text-muted transition-transform ${isGroupOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>

              <div
                className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${isGroupOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
              >
                <div className="overflow-hidden">
                  <div className="mt-3 flex flex-col gap-2">
                    {group.values
                      .filter((v) => v.count > 0)
                      .map((value) => {
                        const isActive = activeFilters.includes(value.input);
                        return (
                          <label
                            key={value.id}
                            className="flex cursor-pointer items-center gap-2.5 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={() => toggleFilter(value.input)}
                              className="h-4 w-4 rounded border-card-border text-primary accent-primary"
                            />
                            <span
                              className={`flex-1 ${isActive ? 'font-medium text-text-base' : 'text-text-muted'}`}
                            >
                              {value.label}
                            </span>
                            <span className="shrink-0 text-xs text-text-muted">
                              ({value.count})
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );

  return (
    <div className="min-w-0 w-full lg:w-56 lg:shrink-0 lg:flex-none">
      {/* Mobil: tam genişlik tetikleyici + tam ekran genişliğinde alt sayfa (bottom sheet) */}
      <div ref={mobileWrapRef} className="relative z-20 w-full lg:hidden">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          aria-controls="filter-panel-mobile"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-card-border bg-card px-3 py-2.5 text-sm font-medium text-text-base transition-colors hover:border-primary hover:text-primary sm:justify-start"
        >
          <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden="true" />
          {isOpen ? t('hideFilters') : t('showFilters')}
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-micro font-semibold text-white">
              {activeCount}
            </span>
          )}
        </button>

        {/* Backdrop */}
        <div
          role="presentation"
          aria-hidden={!isOpen}
          className={cn(
            'fixed inset-0 z-90 bg-black/50 transition-opacity duration-200 lg:hidden',
            isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
          onClick={() => setIsOpen(false)}
        />

        {/* Bottom sheet: viewport genişliği — dar sütun yanında sıkışmış panel sorunu biter */}
        <div
          id="filter-panel-mobile"
          aria-hidden={!isOpen}
          inert={!isOpen ? true : undefined}
          className={cn(
            'fixed inset-x-0 bottom-0 z-100 max-h-[min(88vh,32rem)] overflow-y-auto rounded-t-2xl border border-border border-b-0 bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl lg:hidden',
            'transition-[opacity,transform] duration-200 ease-out',
            isOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0',
          )}
        >
          <div className="mx-auto mb-3 flex max-w-2xl items-center justify-between">
            <span className="font-semibold text-text-base">{t('filters')}</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label={t('hideFilters')}
              className="rounded-md p-1 text-text-muted hover:bg-surface hover:text-text-base"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="mx-auto max-w-2xl">{panelContent}</div>
        </div>
      </div>

      <aside className="hidden lg:block">{panelContent}</aside>
    </div>
  );
}
