import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/tr';

dayjs.extend(localizedFormat);

function toDayjsLocale(locale: string) {
  return locale === 'tr' ? 'tr' : 'en';
}

/** 22 Mart 2026 / March 22, 2026 */
export function formatDate(date: string | Date, locale: string): string {
  return dayjs(date).locale(toDayjsLocale(locale)).format('LL');
}

/** 22 Mar 2026 / Mar 22, 2026 */
export function formatDateShort(date: string | Date, locale: string): string {
  return dayjs(date).locale(toDayjsLocale(locale)).format('ll');
}

/** 22 Mart 2026 17:30 / March 22, 2026 5:30 PM */
export function formatDateTime(date: string | Date, locale: string): string {
  return dayjs(date).locale(toDayjsLocale(locale)).format('LLL');
}

/** Mart 2026 / March 2026 */
export function formatMonthYear(date: string | Date, locale: string): string {
  return dayjs(date).locale(toDayjsLocale(locale)).format('MMMM YYYY');
}
