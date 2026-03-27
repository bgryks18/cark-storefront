'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { useMutation } from '@tanstack/react-query';
import { Loader, Plus, Tag, X } from 'lucide-react';

import {
  applyInvoiceDiscountAction,
  removeInvoiceDiscountAction,
} from '@/lib/actions/invoiceDiscountActions';
import { formatPrice } from '@/lib/shopify/normalize';

import { InvoicePayButton } from './InvoicePayButton';

interface SummaryState {
  subtotal: number;
  shipping: { title: string; price: number } | null;
  discountAmount: number;
  total: number;
  appliedCode: string | null;
}

interface Props {
  draftOrderId: string;
  allowDiscountCodes: boolean;
  canRemoveDiscount: boolean;
  initial: SummaryState;
}

export function InvoiceSummaryCard({
  draftOrderId,
  allowDiscountCodes,
  canRemoveDiscount,
  initial,
}: Props) {
  const t = useTranslations('invoice');
  const [summary, setSummary] = useState<SummaryState>(initial);
  const [canRemove, setCanRemove] = useState(canRemoveDiscount);
  const [discountInput, setDiscountInput] = useState('');
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);

  const applyMutation = useMutation({
    mutationFn: async (code: string) => {
      const result = await applyInvoiceDiscountAction(draftOrderId, code);
      if (!result.ok) throw new Error(result.error);
      return result.summary;
    },
    onMutate: () => {
      setDiscountError(null);
    },
    onSuccess: (data) => {
      setSummary(data);
      setCanRemove(true);
      setDiscountInput('');
      setDiscountOpen(false);
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('read_discounts')) {
        setDiscountError(msg);
        return;
      }
      // Cart ekranındaki davranışla uyum: apply hatalarını tek bir kullanıcı mesajına indir.
      setDiscountError(t('discountInvalid'));
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      const result = await removeInvoiceDiscountAction(draftOrderId);
      if (!result.ok) throw new Error(result.error);
      return result.summary;
    },
    onMutate: () => {
      setDiscountError(null);
    },
    onSuccess: (data) => {
      setSummary(data);
      setCanRemove(false);
    },
    onError: (err) => {
      setDiscountError(err instanceof Error ? err.message : t('connectionError'));
    },
  });

  const isPending = applyMutation.isPending || removeMutation.isPending;
  const hasExistingDiscount = Boolean(summary.appliedCode) || summary.discountAmount > 0;

  function applyDiscount() {
    const code = discountInput.trim().toUpperCase();
    if (!code) return;
    applyMutation.mutate(code);
  }

  function removeDiscount() {
    removeMutation.mutate();
  }

  return (
    <div className="rounded-2xl border border-card-border bg-surface p-6">
      <div className="space-y-2 border-b border-card-border pb-4">
        <div className="flex justify-between text-sm text-text-muted">
          <span>{t('subtotal')}</span>
          <span>{formatPrice(summary.subtotal)}</span>
        </div>
        {summary.shipping && (
          <div className="flex justify-between text-sm text-text-muted">
            <span>
              {t('shipping')} ({summary.shipping.title})
            </span>
            <span>{formatPrice(summary.shipping.price)}</span>
          </div>
        )}
        {summary.discountAmount > 0 && (
          <div className="flex justify-between text-sm text-success">
            <span>{t('discount')}</span>
            <span>-{formatPrice(summary.discountAmount)}</span>
          </div>
        )}
      </div>
      <div className="flex justify-between border-b border-card-border py-4 text-base font-bold text-text-base">
        <span>{t('total')}</span>
        <span>{formatPrice(summary.total)}</span>
      </div>

      <div className="mt-4 border-b border-card-border pb-4">
        {summary.appliedCode ? (
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            <Tag className="h-3 w-3 shrink-0" />
            {summary.appliedCode}
            {summary.discountAmount > 0 && (
              <span className="text-success">-{formatPrice(summary.discountAmount)}</span>
            )}
            {canRemove && (
              <button
                onClick={removeDiscount}
                disabled={isPending}
                className="ml-0.5 cursor-pointer opacity-60 transition-opacity hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPending ? (
                  <Loader className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
              </button>
            )}
          </div>
        ) : hasExistingDiscount ? (
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            <Tag className="h-3 w-3 shrink-0" />
            {t('discount')}
            <span className="text-success">-{formatPrice(summary.discountAmount)}</span>
          </div>
        ) : allowDiscountCodes ? (
          <button
            onClick={() => {
              setDiscountOpen((o) => !o);
              setDiscountError(null);
            }}
            className="flex w-full cursor-pointer items-center justify-between text-sm text-text-muted transition-colors hover:text-text-base"
          >
            <span>{t('discount')}</span>
            <Plus className={`h-4 w-4 transition-transform ${discountOpen ? 'rotate-45' : ''}`} />
          </button>
        ) : (
          <p className="text-xs text-text-muted">{t('discountNotAllowed')}</p>
        )}

        {!hasExistingDiscount && allowDiscountCodes && (
          <div
            className={[
              'grid transition-[grid-template-rows] duration-200 ease-in-out',
              discountOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
            ].join(' ')}
          >
            <div className="overflow-hidden">
              <div className="mt-2 flex flex-col gap-1.5">
                <input
                  type="text"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyDiscount()}
                  placeholder={t('discountCodePlaceholder')}
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-text-base placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={applyDiscount}
                  disabled={isPending || !discountInput.trim()}
                  className="flex h-11 w-full cursor-pointer items-center justify-center rounded-lg bg-primary text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? <Loader className="h-4 w-4 animate-spin" /> : t('applyDiscount')}
                </button>
              </div>
            </div>
          </div>
        )}

        {discountError && <p className="mt-2 text-xs text-error">{discountError}</p>}
      </div>

      <div className="mt-4">
        <InvoicePayButton draftOrderId={draftOrderId} disabled={isPending || summary.total <= 0} />
      </div>
    </div>
  );
}
