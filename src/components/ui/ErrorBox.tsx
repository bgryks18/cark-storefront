import { AlertCircle } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

interface ErrorBoxProps {
  children: React.ReactNode;
  className?: string;
}

export function ErrorBox({ children, className }: ErrorBoxProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-xl border border-error-border bg-error-bg px-4 py-3',
        className,
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
      <p className="text-sm leading-snug text-error-text">{children}</p>
    </div>
  );
}
