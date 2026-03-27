import { Fragment } from 'react';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';

export interface BreadcrumbCrumb {
  label: string;
  href: string;
}

interface PageBreadcrumbProps {
  crumbs: BreadcrumbCrumb[];
  title?: string;
}

export function PageBreadcrumb({ crumbs, title }: PageBreadcrumbProps) {
  const tCommon = useTranslations('common');
  return (
    <nav
      className="mb-6 flex flex-wrap items-center gap-2 text-sm"
      aria-label={tCommon('breadcrumb')}
    >
      {crumbs.map((crumb, i) => (
        <Fragment key={i}>
          <Link href={crumb.href} className="text-text-muted hover:text-primary">
            {crumb.label}
          </Link>
          {(i < crumbs.length - 1 || title) && (
            <span className="text-text-muted" aria-hidden>
              /
            </span>
          )}
        </Fragment>
      ))}
      {title && <h1 className="text-2xl font-bold text-black-dark">{title}</h1>}
    </nav>
  );
}
