'use client';

import { forwardRef } from 'react';

import { cn } from '@/lib/utils/cn';

import { Spinner } from './Spinner';

export type ButtonVariant = 'contained' | 'outlined';
export type ButtonColor = 'primary' | 'secondary' | 'danger' | 'warning';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const containedClasses: Record<ButtonColor, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark focus-visible:ring-primary',
  secondary: 'bg-gray-light text-black hover:bg-gray-light-hover focus-visible:ring-gray',
  danger: 'bg-red text-white hover:bg-red-dark focus-visible:ring-red',
  warning: 'bg-warning text-white hover:opacity-90 focus-visible:ring-warning',
};

const outlinedClasses: Record<ButtonColor, string> = {
  primary: 'border border-primary text-primary bg-transparent hover:bg-primary-hover focus-visible:ring-primary',
  secondary: 'border border-gray text-black bg-transparent hover:bg-gray-light focus-visible:ring-gray',
  danger: 'border border-red text-red bg-transparent hover:bg-red/10 focus-visible:ring-red',
  warning: 'border border-warning text-warning bg-transparent hover:bg-warning/10 focus-visible:ring-warning',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-5 text-sm',
  lg: 'h-12 px-7 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'contained',
      color = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const variantClass = variant === 'contained' ? containedClasses[color] : outlinedClasses[color];

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-60',
          variantClass,
          sizeClasses[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {loading && (
          <Spinner
            type="dots"
            size="sm"
            color={variant === 'contained' ? 'white' : color === 'primary' ? 'primary' : 'current'}
          />
        )}
        {!loading && children}
      </button>
    );
  },
);

Button.displayName = 'Button';
