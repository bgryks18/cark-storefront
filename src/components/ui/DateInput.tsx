'use client';

import { forwardRef } from 'react';

interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <span className="text-xs font-medium text-text-muted">{label}</span>
        )}
        <input
          ref={ref}
          type="date"
          className={[
            'h-10 rounded-xl border border-border bg-card px-3 text-sm text-text-base',
            'focus:border-primary focus:outline-none',
            '[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50',
            className,
          ].join(' ')}
          {...props}
        />
      </div>
    );
  },
);

DateInput.displayName = 'DateInput';
