'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

import { usePathname, useRouter } from '@/i18n/navigation';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';

import type { ProductFilter } from '@/lib/shopify/queries/collection';

interface FilterPanelProps {
  filters: ProductFilter[];
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

  const activeFilters = searchParams.getAll('filter');

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
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('filter');
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function toggleGroup(id: string) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  if (filters.length === 0) return null;

  const activeCount = activeFilters.length;

  // ─── İçerik ────────────────────────────────────────────────────────────────
  const panelContent = (
    <div className="flex flex-col gap-4">
      {/* Başlık + Temizle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text-base">
          {t('filters')}
          {activeCount > 0 && (
            <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-micro font-semibold text-white">
              {activeCount}
            </span>
          )}
        </span>
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-text-muted transition-colors hover:text-primary"
          >
            {t('clearFilters')}
          </button>
        )}
      </div>

      {/* Filtre grupları */}
      {filters
        .filter((group) => group.type === 'LIST' || group.type === 'BOOLEAN')
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

              {isGroupOpen && (
                <div className="mt-3 flex flex-col gap-2">
                  {group.values.map((value) => {
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
                        <span className="shrink-0 text-xs text-text-muted">({value.count})</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );

  return (
    // Tek container: mobilde tam genişlik, desktopda w-56 sidebar
    <div className="lg:w-56 lg:shrink-0">
      {/* ─── Mobil toggle butonu ─────────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls="filter-panel-mobile"
        className="flex items-center gap-2 rounded-lg border border-card-border bg-card px-3 py-1.5 text-sm text-text-base transition-colors hover:border-primary hover:text-primary lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        {isOpen ? t('hideFilters') : t('showFilters')}
        {activeCount > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-micro font-semibold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {/* ─── Mobil açılır panel ──────────────────────────────────────────────── */}
      {isOpen && (
        <div id="filter-panel-mobile" className="mt-3 rounded-xl border border-border bg-card p-4 lg:hidden">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold text-text-base">{t('filters')}</span>
            <button
              onClick={() => setIsOpen(false)}
              aria-label={t('hideFilters')}
              className="text-text-muted hover:text-text-base"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {panelContent}
        </div>
      )}

      {/* ─── Desktop sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden lg:block">{panelContent}</aside>
    </div>
  );
}
