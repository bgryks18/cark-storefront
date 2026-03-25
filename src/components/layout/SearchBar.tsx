'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import debounce from 'lodash/debounce';
import { Loader, Search, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { Link, useRouter } from '@/i18n/navigation';
import { getPredictiveSearch } from '@/lib/shopify/queries/search';
import { formatMoney } from '@/lib/shopify/normalize';
import type { PredictiveSearchResult } from '@/lib/shopify/types';

export function SearchBar() {
  const locale = useLocale();
  const tNav = useTranslations('nav');
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PredictiveSearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dışarı tıklanınca kapat
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Escape ile kapat
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Arama aç → input'a focus
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  function open() {
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
    setQuery('');
    setResults(null);
  }

  // Debounced search
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce(async (q: string) => {
      if (!q.trim()) {
        setResults(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getPredictiveSearch(q, locale);
        setResults(data);
      } finally {
        setLoading(false);
      }
    }, 300),
    [locale],
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    if (value.trim()) {
      setLoading(true);
      debouncedSearch(value);
    } else {
      debouncedSearch.cancel();
      setResults(null);
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    close();
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  const hasProducts = (results?.products?.length ?? 0) > 0;
  const hasCollections = (results?.collections?.length ?? 0) > 0;
  const hasQueries = (results?.queries?.length ?? 0) > 0;
  const hasResults = hasProducts || hasCollections || hasQueries;
  const showDropdown = isOpen && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative">
      {/* Arama ikonu butonu */}
      {!isOpen && (
        <button
          onClick={open}
          className="flex h-9 w-9 items-center justify-center rounded text-black-dark transition-colors hover:bg-primary-hover"
          aria-label="Arama"
        >
          <Search className="h-5 w-5" />
        </button>
      )}

      {/* Genişleyen input */}
      {isOpen && (
        <form
          onSubmit={handleSubmit}
          className="flex flex-row-reverse items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-150"
        >
          <button
            type="button"
            onClick={close}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-text-muted transition-colors hover:bg-primary-hover hover:text-text-base"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              ref={inputRef}
              value={query}
              onChange={handleChange}
              placeholder="Ürün ara..."
              className="h-9 w-56 rounded-lg border border-card-border bg-card pl-9 pr-3 text-sm text-text-base placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:w-72"
            />
            {loading && (
              <Loader className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-text-muted" />
            )}
          </div>
        </form>
      )}

      {/* Dropdown sonuçlar */}
      {showDropdown && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-card-border bg-surface shadow-xl sm:w-96">
          {!loading && !hasResults && (
            <p className="px-4 py-6 text-center text-sm text-text-muted">
              &ldquo;{query}&rdquo; için sonuç bulunamadı
            </p>
          )}

          {/* Öneri sorgular */}
          {hasQueries && (
            <div className="border-b border-border p-2">
              {results!.queries.slice(0, 3).map((q) => (
                <button
                  key={q.text}
                  onClick={() => {
                    close();
                    router.push(`/search?q=${encodeURIComponent(q.text)}`);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-base hover:bg-primary-hover hover:text-primary"
                >
                  <Search className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                  <span dangerouslySetInnerHTML={{ __html: q.styledText }} />
                </button>
              ))}
            </div>
          )}

          {hasCollections && (
            <div className="border-b border-border p-2">
              <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                {tNav('collections')}
              </p>
              {results!.collections.map((col) => (
                <Link
                  key={col.id}
                  href={`/collections/${col.handle}`}
                  onClick={close}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-primary-hover"
                >
                  {col.image && (
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-skeleton">
                      <Image src={col.image.url} alt={col.title} fill className="object-cover" sizes="32px" />
                    </div>
                  )}
                  <span className="text-sm text-text-base">{col.title}</span>
                </Link>
              ))}
            </div>
          )}

          {hasProducts && (
            <div className="p-2">
              <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                {tNav('products')}
              </p>
              {results!.products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.handle}`}
                  onClick={close}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-primary-hover"
                >
                  {product.featuredImage && (
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-skeleton">
                      <Image
                        src={product.featuredImage.url}
                        alt={product.title}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-text-base">{product.title}</p>
                    <p className="text-xs font-medium text-primary">
                      {formatMoney(product.priceRange.minVariantPrice)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Enter → tüm sonuçlar */}
          {hasResults && (
            <div className="border-t border-border p-2">
              <button
                onClick={handleSubmit as unknown as React.MouseEventHandler}
                className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary-hover"
              >
                &ldquo;{query}&rdquo; için tüm sonuçları gör
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
