'use client';

import { useEffect } from 'react';

import { useTranslations } from 'next-intl';

import type { ConfirmOptions } from '@/contexts/ModalContext';

interface ConfirmModalProps {
  config: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ config, onConfirm, onCancel }: ConfirmModalProps) {
  const t = useTranslations('common');
  const { title, message, confirmLabel = t('confirm'), cancelLabel = t('cancel'), variant = 'default' } = config;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm rounded-2xl border border-card-border bg-card p-6 shadow-xl">
        <h2 id="modal-title" className="text-base font-semibold text-text-base">
          {title}
        </h2>

        {message && (
          <p className="mt-2 text-sm text-text-muted">{message}</p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="h-9 rounded-lg px-4 text-sm font-medium text-text-muted transition-colors hover:bg-surface-hover"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`h-9 rounded-lg px-4 text-sm font-medium text-white transition-colors ${
              variant === 'danger'
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-primary hover:bg-primary-dark'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
