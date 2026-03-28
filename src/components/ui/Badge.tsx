import { useTranslations } from 'next-intl';

interface BadgeProps {
  count: number;
  max?: number;
  className?: string;
}

export function Badge({ count, max = 99, className = '' }: BadgeProps) {
  const tCommon = useTranslations('common');
  if (count <= 0) return null;

  const label = count > max ? `${max}+` : String(count);

  return (
    <span
      aria-label={tCommon('cartWithCount', { count })}
      className={[
        'absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center md:-right-1.5 md:-top-1.5 md:h-5 md:min-w-5',
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
