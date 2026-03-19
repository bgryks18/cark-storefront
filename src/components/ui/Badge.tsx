interface BadgeProps {
  count: number;
  max?: number;
  className?: string;
}

export function Badge({ count, max = 99, className = '' }: BadgeProps) {
  if (count <= 0) return null;

  const label = count > max ? `${max}+` : String(count);

  return (
    <span
      aria-label={`${count} ürün`}
      className={[
        'absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center',
        'rounded-full bg-primary px-1 text-tiny font-bold leading-none text-white',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {label}
    </span>
  );
}
