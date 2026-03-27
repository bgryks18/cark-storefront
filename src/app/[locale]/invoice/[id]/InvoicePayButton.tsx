'use client';

import { useTranslations } from 'next-intl';

import { useMutation } from '@tanstack/react-query';

import { AlertBox } from '@/components/ui/AlertBox';

interface Props {
  draftOrderId: string;
  disabled?: boolean;
}

export function InvoicePayButton({ draftOrderId, disabled = false }: Props) {
  const t = useTranslations('invoice');

  const paytrInitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/paytr/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftOrderId }),
      });
      const data = (await res.json()) as { paytrUrl?: string; error?: string };
      if (!res.ok || !data.paytrUrl) throw new Error(data.error ?? t('connectionError'));
      return data.paytrUrl;
    },
    onSuccess: (paytrUrl) => {
      window.location.href = paytrUrl;
    },
  });

  return (
    <div>
      <button
        type="button"
        onClick={() => paytrInitMutation.mutate()}
        disabled={paytrInitMutation.isPending || disabled}
        className="mt-6 flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-primary text-base font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-80"
      >
        {paytrInitMutation.isPending ? t('paying') : t('pay')}
      </button>
      {paytrInitMutation.error && (
        <AlertBox className="mt-4">{paytrInitMutation.error.message}</AlertBox>
      )}
    </div>
  );
}
