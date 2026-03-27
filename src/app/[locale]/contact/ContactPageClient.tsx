'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { CheckCircle, Mail, MapPin, Phone } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { PageBreadcrumb } from '@/components/ui/PageBreadcrumb';

interface ContactFormData {
  name: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  companyName?: string;
  address?: string;
  description: string;
}

const inputClass =
  'h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text-base placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';
const inputErrorClass =
  'h-11 w-full rounded-xl border border-error bg-background px-3 text-sm text-text-base placeholder:text-text-muted focus:border-error focus:outline-none focus:ring-1 focus:ring-error';
const labelClass = 'mb-1.5 block text-sm font-medium text-text-base';

export function ContactPageClient() {
  const t = useTranslations('contactPage');
  const f = useTranslations('contactPage.form');
  const tNav = useTranslations('nav');

  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>();

  async function onSubmit(data: ContactFormData) {
    setServerError(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      setSuccess(true);
      reset();
    } catch {
      setServerError(f('error'));
    }
  }

  return (
    <section className="py-8 sm:py-12">
      <Container>
        <PageBreadcrumb crumbs={[{ label: tNav('home'), href: '/' }]} title={t('title')} />

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* ─── Form ─────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-card-border bg-card p-6 sm:p-8">
            <p className="mb-6 text-sm text-text-muted">{t('subtitle')}</p>

            {success ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <CheckCircle className="h-12 w-12 text-success" strokeWidth={1.5} />
                <p className="text-sm text-text-base">{f('success')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className={labelClass}>
                      {f('name')} <span className="text-error">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      placeholder={f('namePlaceholder')}
                      className={errors.name ? inputErrorClass : inputClass}
                      {...register('name', { required: true })}
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-error">
                        {f('fieldRequired', { field: f('name') })}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="lastName" className={labelClass}>
                      {f('lastName')} <span className="text-error">*</span>
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      placeholder={f('lastNamePlaceholder')}
                      className={errors.lastName ? inputErrorClass : inputClass}
                      {...register('lastName', { required: true })}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-xs text-error">
                        {f('fieldRequired', { field: f('lastName') })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="phoneNumber" className={labelClass}>
                      {f('phoneNumber')} <span className="text-error">*</span>
                    </label>
                    <input
                      id="phoneNumber"
                      type="tel"
                      placeholder={f('phoneNumberPlaceholder')}
                      className={errors.phoneNumber ? inputErrorClass : inputClass}
                      {...register('phoneNumber', { required: true })}
                    />
                    {errors.phoneNumber && (
                      <p className="mt-1 text-xs text-error">
                        {f('fieldRequired', { field: f('phoneNumber') })}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="email" className={labelClass}>
                      {f('email')} <span className="text-error">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder={f('emailPlaceholder')}
                      className={errors.email ? inputErrorClass : inputClass}
                      {...register('email', {
                        required: true,
                        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      })}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-error">
                        {f('fieldInvalid', { field: f('email') })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="companyName" className={labelClass}>
                      {f('companyName')}
                    </label>
                    <input
                      id="companyName"
                      type="text"
                      placeholder={f('companyNamePlaceholder')}
                      className={inputClass}
                      {...register('companyName')}
                    />
                  </div>
                  <div>
                    <label htmlFor="address" className={labelClass}>
                      {f('contactAddress')}
                    </label>
                    <input
                      id="address"
                      type="text"
                      placeholder={f('contactAddressPlaceholder')}
                      className={inputClass}
                      {...register('address')}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className={labelClass}>
                    {f('message')} <span className="text-error">*</span>
                  </label>
                  <textarea
                    id="description"
                    rows={5}
                    placeholder={f('messagePlaceholder')}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm text-text-base placeholder:text-text-muted focus:outline-none focus:ring-1 resize-none bg-background ${errors.description ? 'border-error focus:border-error focus:ring-error' : 'border-border focus:border-primary focus:ring-primary'}`}
                    {...register('description', { required: true })}
                  />
                  {errors.description && (
                    <p className="mt-1 text-xs text-error">
                      {f('fieldRequired', { field: f('message') })}
                    </p>
                  )}
                </div>

                {serverError && <p className="text-sm text-error">{serverError}</p>}

                <p className="text-xs text-text-muted">{f('required')}</p>

                <Button type="submit" size="lg" fullWidth loading={isSubmitting} className="mt-1">
                  {f('send')}
                </Button>
              </form>
            )}
          </div>

          {/* ─── İletişim bilgileri ────────────────────────────────────────── */}
          <div className="flex flex-col gap-4 order-first lg:order-0">
            <div className="flex items-center gap-4 rounded-2xl border border-card-border bg-card p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Phone className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                  {t('phone')}
                </p>
                <a
                  href="tel:+905375407666"
                  className="text-sm font-medium text-text-base hover:text-primary transition-colors"
                >
                  +90 537 540 76 66
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-card-border bg-card p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                  {t('email')}
                </p>
                <a
                  href="mailto:info@carkzimpara.com"
                  className="text-sm font-medium text-text-base hover:text-primary transition-colors"
                >
                  info@carkzimpara.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-card-border bg-card p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                  {t('address')}
                </p>
                <p className="text-sm font-medium text-text-base whitespace-pre-line">
                  {t('addressValue')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Harita ───────────────────────────────────────────────────────── */}
        <div className="mt-8">
          <h2 className="mb-4 text-base font-semibold text-text-base">{t('findOnMap')}</h2>
          <div className="overflow-hidden rounded-2xl border border-card-border">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3020.536825598886!2d29.41465287621882!3d40.79419577138143!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cadf34e07fc1bf%3A0x69de3154197dcf1a!2zw4dhcmsgWsSxbXBhcmE!5e0!3m2!1str!2str!4v1774469230040!5m2!1str!2str"
              width="100%"
              height="450"
              allowFullScreen
              loading="lazy"
              style={{ border: 0 }}
              referrerPolicy="no-referrer-when-downgrade"
              title={t('findOnMap')}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
