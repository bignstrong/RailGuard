// Публичные настройки сайта: один запрос на страницу, общий для шапки и подвала.
export type SiteInfo = {
  announcement: string;
  contacts: { phone: string; email: string; hours: string; legal: string; telegram: string };
};

const FALLBACK: SiteInfo = { announcement: '', contacts: { phone: '', email: 'info@railguard.ru', hours: '', legal: '', telegram: '' } };

let cached: Promise<SiteInfo> | null = null;

export function getSiteInfo(): Promise<SiteInfo> {
  cached ??= fetch('/api/site')
    .then((r) => r.json())
    .then((d: Partial<SiteInfo>) => ({ ...FALLBACK, ...d, contacts: { ...FALLBACK.contacts, ...d?.contacts } }))
    .catch(() => FALLBACK);
  return cached;
}
