'use client';

import { forwardRef } from 'react';

import { cn } from '@/lib/utils/cn';

interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        {label && (
          <span className="text-xs font-medium text-text-muted">{label}</span>
        )}
        <input
          ref={ref}
          type="date"
          className={cn(
            'h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-text-base',
            'focus:border-primary focus:outline-none',
            '[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50',
          )}
          {...props}
        />
      </div>
    );
  },
);

DateInput.displayName = 'DateInput';
