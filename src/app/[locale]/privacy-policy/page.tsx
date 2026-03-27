import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { Container } from '@/components/ui/Container';
import { PageBreadcrumb } from '@/components/ui/PageBreadcrumb';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'privacyPolicy' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.carkzimpara.com';
  const path = '/privacy-policy';

  return {
    title: t('title'),
    description: t('metaDescription'),
    alternates: {
      canonical: `${siteUrl}${locale === 'en' ? '/en' : ''}${path}`,
      languages: {
        tr: `${siteUrl}${path}`,
        en: `${siteUrl}/en${path}`,
      },
    },
  };
}

export default async function PrivacyPolicyPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'privacyPolicy' });
  return (
    <section className="py-4">
      <Container>
        <PageBreadcrumb crumbs={[]} title={t('title')} />

        <article>
          <p className="mb-4 text-sm text-text-muted">{t('lastUpdated')}</p>

          <div className="space-y-8">
            <div className="prose-policy">
              <p>{t('intro')}</p>
              <p>{t('introAcceptance')}</p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-bold text-black-dark">
                {t('sections.personalInfo.title')}
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-text-base">
                {t('sections.personalInfo.description')}
              </p>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-text-base">
                <li>
                  <strong>{t('sections.personalInfo.items.contact.label')}</strong>{' '}
                  {t('sections.personalInfo.items.contact.desc')}
                </li>
                <li>
                  <strong>{t('sections.personalInfo.items.financial.label')}</strong>{' '}
                  {t('sections.personalInfo.items.financial.desc')}
                </li>
                <li>
                  <strong>{t('sections.personalInfo.items.account.label')}</strong>{' '}
                  {t('sections.personalInfo.items.account.desc')}
                </li>
                <li>
                  <strong>{t('sections.personalInfo.items.transaction.label')}</strong>{' '}
                  {t('sections.personalInfo.items.transaction.desc')}
                </li>
                <li>
                  <strong>{t('sections.personalInfo.items.communication.label')}</strong>{' '}
                  {t('sections.personalInfo.items.communication.desc')}
                </li>
                <li>
                  <strong>{t('sections.personalInfo.items.device.label')}</strong>{' '}
                  {t('sections.personalInfo.items.device.desc')}
                </li>
                <li>
                  <strong>{t('sections.personalInfo.items.usage.label')}</strong>{' '}
                  {t('sections.personalInfo.items.usage.desc')}
                </li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-bold text-black-dark">
                {t('sections.sources.title')}
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-text-base">
                {t('sections.sources.description')}
              </p>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-text-base">
                <li>
                  <strong>{t('sections.sources.items.direct.label')}</strong>{' '}
                  {t('sections.sources.items.direct.desc')}
                </li>
                <li>
                  <strong>{t('sections.sources.items.automatic.label')}</strong>{' '}
                  {t('sections.sources.items.automatic.desc')}
                </li>
                <li>
                  <strong>{t('sections.sources.items.providers.label')}</strong>{' '}
                  {t('sections.sources.items.providers.desc')}
                </li>
                <li>
                  <strong>{t('sections.sources.items.partners.label')}</strong>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-bold text-black-dark">
                {t('sections.howWeUse.title')}
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-text-base">
                {t('sections.howWeUse.description')}
              </p>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-text-base">
                <li>
                  <strong>{t('sections.howWeUse.items.providing.label')}</strong>{' '}
                  {t('sections.howWeUse.items.providing.desc')}
                </li>
                <li>
                  <strong>{t('sections.howWeUse.items.marketing.label')}</strong>{' '}
                  {t('sections.howWeUse.items.marketing.desc')}
                </li>
                <li>
                  <strong>{t('sections.howWeUse.items.security.label')}</strong>{' '}
                  {t('sections.howWeUse.items.security.desc')}
                </li>
                <li>
                  <strong>{t('sections.howWeUse.items.communication.label')}</strong>{' '}
                  {t('sections.howWeUse.items.communication.desc')}
                </li>
                <li>
                  <strong>{t('sections.howWeUse.items.legal.label')}</strong>{' '}
                  {t('sections.howWeUse.items.legal.desc')}
                </li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-bold text-black-dark">
                {t('sections.sharing.title')}
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-text-base">
                {t('sections.sharing.description')}
              </p>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-text-base">
                <li>{t('sections.sharing.items.serviceProviders')}</li>
                <li>{t('sections.sharing.items.marketingPartners')}</li>
                <li>{t('sections.sharing.items.yourDirection')}</li>
                <li>{t('sections.sharing.items.affiliates')}</li>
                <li>{t('sections.sharing.items.legalObligations')}</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-bold text-black-dark">
                {t('sections.shopify.title')}
              </h2>
              <p className="text-sm leading-relaxed text-text-base">
                {t('sections.shopify.description')}
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-bold text-black-dark">
                {t('sections.thirdParty.title')}
              </h2>
              <p className="text-sm leading-relaxed text-text-base">
                {t('sections.thirdParty.description')}
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-bold text-black-dark">
                {t('sections.children.title')}
              </h2>
              <p className="text-sm leading-relaxed text-text-base">
                {t('sections.children.description')}
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-bold text-black-dark">
                {t('sections.security.title')}
              </h2>
              <p className="mb-3 text-sm leading-relaxed text-text-base">
                {t('sections.security.description1')}
              </p>
              <p className="text-sm leading-relaxed text-text-base">
                {t('sections.security.description2')}
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-bold text-black-dark">
                {t('sections.rights.title')}
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-text-base">
                {t('sections.rights.description')}
              </p>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-text-base">
                <li>
                  <strong>{t('sections.rights.items.access.label')}</strong>{' '}
                  {t('sections.rights.items.access.desc')}
                </li>
                <li>
                  <strong>{t('sections.rights.items.deletion.label')}</strong>{' '}
                  {t('sections.rights.items.deletion.desc')}
                </li>
                <li>
                  <strong>{t('sections.rights.items.correction.label')}</strong>{' '}
                  {t('sections.rights.items.correction.desc')}
                </li>
                <li>
                  <strong>{t('sections.rights.items.portability.label')}</strong>{' '}
                  {t('sections.rights.items.portability.desc')}
                </li>
                <li>
                  <strong>{t('sections.rights.items.preferences.label')}</strong>{' '}
                  {t('sections.rights.items.preferences.desc')}
                </li>
              </ul>
              <p className="mt-4 text-sm leading-relaxed text-text-base">
                {t('sections.rights.exercising')}
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-bold text-black-dark">
                {t('sections.complaints.title')}
              </h2>
              <p className="text-sm leading-relaxed text-text-base">
                {t('sections.complaints.description')}
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-bold text-black-dark">
                {t('sections.transfers.title')}
              </h2>
              <p className="mb-3 text-sm leading-relaxed text-text-base">
                {t('sections.transfers.description1')}
              </p>
              <p className="text-sm leading-relaxed text-text-base">
                {t('sections.transfers.description2')}
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-bold text-black-dark">
                {t('sections.changes.title')}
              </h2>
              <p className="text-sm leading-relaxed text-text-base">
                {t('sections.changes.description')}
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-bold text-black-dark">
                {t('sections.contact.title')}
              </h2>
              <p className="text-sm leading-relaxed text-text-base">
                {t('sections.contact.description')}
              </p>
            </div>
          </div>
        </article>
      </Container>
    </section>
  );
}
