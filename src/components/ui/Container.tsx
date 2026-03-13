import { cn } from '@/lib/utils/cn';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

/**
 * Tüm sayfalarda tutarlı max-genişlik + yatay padding sağlar.
 * max-w-7xl (1280px) + px-4/sm:px-6/lg:px-8
 */
export function Container({ children, className, as: Tag = 'div' }: ContainerProps) {
  return (
    <Tag
      className={cn(
        'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
