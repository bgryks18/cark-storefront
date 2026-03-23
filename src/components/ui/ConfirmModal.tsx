'use client';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import type { ConfirmOptions } from '@/contexts/ModalContext';

import { AlertBox } from '@/components/ui/AlertBox';

interface ConfirmModalProps {
  config: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
}

const ANIMATION_MS = 200;

export function ConfirmModal({ config, onConfirm, onCancel }: ConfirmModalProps) {
  const t = useTranslations('common');
  const { title, message, confirmLabel = t('confirm'), cancelLabel = t('cancel'), variant = 'default', action } = config;

  const [isVisible, setIsVisible] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isConfirming) handleClose(onCancel);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel, isConfirming]);

  function handleClose(callback: () => void) {
    setIsVisible(false);
    setTimeout(callback, ANIMATION_MS);
  }

  async function handleConfirmClick() {
    if (!action) {
      handleClose(onConfirm);
      return;
    }
    setIsConfirming(true);
    setError(null);
    try {
      await action();
      handleClose(onConfirm);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bir hata oluştu.');
      setIsConfirming(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={() => !isConfirming && handleClose(onCancel)}
      />

      {/* Panel */}
      <div
        className={`relative w-full max-w-sm rounded-2xl border border-card-border bg-card p-6 shadow-xl transition-all duration-200 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <h2 id="modal-title" className="text-base font-semibold text-text-base">
          {title}
        </h2>

        {message && (
          <p className="mt-2 text-sm text-text-muted">{message}</p>
        )}

        {error && (
          <AlertBox className="mt-3">{error}</AlertBox>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => handleClose(onCancel)}
            disabled={isConfirming}
            className="h-9 cursor-pointer rounded-lg px-4 text-sm font-medium text-text-muted transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirmClick}
            disabled={isConfirming}
            className={`relative h-9 min-w-20 cursor-pointer rounded-lg px-4 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-80 ${
              variant === 'danger'
                ? 'bg-error hover:bg-red-dark'
                : 'bg-primary hover:bg-primary-dark'
            }`}
          >
            {isConfirming ? (
              <span className="flex items-center justify-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-white"
                    style={{ animation: `navDot 1s ease-in-out ${i * 0.15}s infinite` }}
                  />
                ))}
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
