interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'spin' | 'dots';
  color?: 'primary' | 'white' | 'current';
  label?: string;
}

const spinSizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
};

const dotSizeClasses = {
  sm: 'h-1 w-1',
  md: 'h-1.5 w-1.5',
  lg: 'h-2 w-2',
};

const colorClasses = {
  primary: 'border-primary border-t-transparent',
  white: 'border-white border-t-transparent',
  current: 'border-current border-t-transparent',
};

const dotColorClasses = {
  primary: 'bg-primary',
  white: 'bg-white',
  current: 'bg-current',
};

export function Spinner({
  size = 'md',
  className = '',
  type = 'spin',
  color = 'primary',
  label,
}: SpinnerProps) {
  if (type === 'dots') {
    return (
      <span
        role="status"
        aria-label={label}
        className={['flex items-center gap-1', className].filter(Boolean).join(' ')}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={['rounded-full', dotSizeClasses[size], dotColorClasses[color]].join(' ')}
            style={{ animation: `navDot 1s ease-in-out ${i * 0.15}s infinite` }}
          />
        ))}
      </span>
    );
  }

  return (
    <span
      role="status"
      aria-label={label}
      className={[
        'inline-block animate-spin rounded-full',
        spinSizeClasses[size],
        colorClasses[color],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
