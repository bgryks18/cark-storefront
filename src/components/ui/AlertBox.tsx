import { AlertCircle, AlertTriangle } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

export type AlertBoxVariant = 'danger' | 'warning';

interface AlertBoxProps {
  children: React.ReactNode;
  className?: string;
  /** @default danger — kırmızı; warning sarı/amber bilgilendirme */
  variant?: AlertBoxVariant;
}

export function AlertBox({ children, className, variant = 'danger' }: AlertBoxProps) {
  const isWarning = variant === 'warning';

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2.5 rounded-xl border px-4 py-3',
        isWarning
          ? 'border-warning-border bg-warning-bg'
          : 'border-error-border bg-error-bg',
        className,
      )}
    >
      {isWarning ? (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error" aria-hidden />
      )}
      <p
        className={cn(
          'text-sm leading-snug',
          isWarning ? 'text-warning-text' : 'text-error-text',
        )}
      >
        {children}
      </p>
    </div>
  );
}
