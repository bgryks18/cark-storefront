'use client';

import { createContext, useCallback, useRef, useState } from 'react';

import { ConfirmModal } from '@/components/ui/ConfirmModal';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
}

interface ModalContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

export const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    setConfig(options);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  function handleConfirm() {
    resolverRef.current?.(true);
    resolverRef.current = null;
    setConfig(null);
  }

  function handleCancel() {
    resolverRef.current?.(false);
    resolverRef.current = null;
    setConfig(null);
  }

  return (
    <ModalContext.Provider value={{ confirm }}>
      {children}
      {config && (
        <ConfirmModal
          config={config}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ModalContext.Provider>
  );
}
