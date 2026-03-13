interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={['animate-pulse rounded bg-gray-light', className].filter(Boolean).join(' ')}
      aria-hidden="true"
    />
  );
}
