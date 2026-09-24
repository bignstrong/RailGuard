// Атрибуция: откуда пришёл покупатель. Первая (rg_ft) и последняя значимая (rg_lt) точки входа — cookie на 90 дней.
// Модель как у Метрики «последний значимый переход»: прямой заход не затирает последний источник.
// В cookie только метки и referrer, без идентификаторов; в заказ попадает вместе с согласием на обработку ПДн.

export type Touch = {
  source: string;
  medium: string;
  campaign?: string;
  content?: string;
  term?: string;
  referrer?: string;
  landing: string;
  yclid?: string;
  gclid?: string;
  at: string;
};

export const CHANNELS = ['ads', 'search', 'social', 'classified', 'forum', 'email', 'referral', 'tagged', 'direct'] as const;
export type Channel = (typeof CHANNELS)[number];
export const CHANNEL_LABEL: Record<Channel, string> = {
  ads: 'Реклама',
  search: 'Поиск',
  social: 'Соцсети и мессенджеры',
  classified: 'Доски объявлений',
  forum: 'Форумы',
  email: 'Email',
  referral: 'Ссылки с сайтов',
  tagged: 'Прочие UTM',
  direct: 'Прямые заходы',
};

// Порядок важен: почта Яндекса и Mail.ru раньше поисковиков на тех же доменах.
const HOSTS: [RegExp, Channel][] = [
  [/^(mail\.yandex\.ru|e\.mail\.ru|mail\.google\.com)$/, 'email'],
  [/(^|\.)(yandex\.[a-z.]+|ya\.ru|google\.[a-z.]+|bing\.com|duckduckgo\.com|go\.mail\.ru|rambler\.ru)$/, 'search'],
  [/(^|\.)(t\.me|telegram\.(org|me)|vk\.com|vk\.ru|ok\.ru|dzen\.ru|youtube\.com|youtu\.be|rutube\.ru|whatsapp\.com)$/, 'social'],
  [/(^|\.)(avito\.ru|drom\.ru|auto\.ru)$/, 'classified'],
  [/(^|\.)drive2\.(ru|com)$|forum/, 'forum'],
];
const MEDIUM: Record<string, Channel> = {
  cpc: 'ads',
  ppc: 'ads',
  paid: 'ads',
  display: 'ads',
  social: 'social',
  messenger: 'social',
  video: 'social',
  classified: 'classified',
  forum: 'forum',
  email: 'email',
};

const hostOf = (url?: string) => {
  try {
    return url ? new URL(url).hostname.replace(/^www\./, '').toLowerCase() : '';
  } catch {
    return '';
  }
};

export function channelOf(t?: Touch | null): Channel {
  if (!t) return 'direct';
  if (t.yclid || t.gclid) return 'ads';
  const medium = t.medium.toLowerCase();
  if (medium !== '(none)' && medium !== 'referral') return MEDIUM[medium] ?? 'tagged';
  const host = hostOf(t.referrer);
  if (!host) return 'direct';
  return HOSTS.find(([re]) => re.test(host))?.[1] ?? 'referral';
}

// Касание из текущего URL и referrer; null — внутренний переход (перезагрузка, наш же домен).
export function touchFromLocation(href: string, referrer: string, now = new Date()): Touch | null {
  const url = new URL(href);
  const q = (k: string) => url.searchParams.get(k)?.slice(0, 100) || undefined;
  const refHost = hostOf(referrer);
  const own = refHost === url.hostname.replace(/^www\./, '');
  const yclid = q('yclid');
  const gclid = q('gclid');
  const utmSource = q('utm_source');
  if (!utmSource && !yclid && !gclid && own) return null;
  const refSource = refHost && !own ? refHost : '';
  return {
    source: utmSource ?? (yclid ? 'yandex' : gclid ? 'google' : refSource || '(direct)'),
    medium: q('utm_medium') ?? (yclid || gclid ? 'cpc' : refSource ? 'referral' : '(none)'),
    campaign: q('utm_campaign'),
    content: q('utm_content'),
    term: q('utm_term'),
    referrer: refSource ? referrer.slice(0, 200) : undefined,
    landing: (url.pathname + url.search).slice(0, 200),
    yclid,
    gclid,
    at: now.toISOString(),
  };
}

const COOKIE_DAYS = 90;

function readCookie(name: string): Touch | null {
  const raw = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1];
  try {
    return raw ? JSON.parse(decodeURIComponent(raw)) : null;
  } catch {
    return null;
  }
}

function writeCookie(name: string, t: Touch) {
  document.cookie = `${name}=${encodeURIComponent(JSON.stringify(t))}; path=/; max-age=${COOKIE_DAYS * 86400}; samesite=lax; secure`;
}

export function readAttribution(): { ft: Touch | null; lt: Touch | null } {
  return { ft: readCookie('rg_ft'), lt: readCookie('rg_lt') };
}

// Возвращает канал визита: текущий источник, если он значимый, иначе последний значимый из cookie.
function captureTouch(): Channel {
  const t = touchFromLocation(location.href, document.referrer);
  const { ft, lt } = readAttribution();
  if (t && !ft) writeCookie('rg_ft', t);
  const significant = !!t && channelOf(t) !== 'direct';
  if (t && (significant || !lt)) writeCookie('rg_lt', t);
  return channelOf(significant ? t : lt ?? t);
}

// Счётчики воронки: агрегаты по дням без cookie и IP, поэтому работают и без согласия на Метрику.
// Каждое событие шлётся не чаще раза за сессию (для товара — раз за сессию на товар).
export const FUNNEL_EVENTS = ['visit', 'view', 'add', 'cart'] as const;
export type FunnelEvent = (typeof FUNNEL_EVENTS)[number];

export function countEvent(e: FunnelEvent, product = '') {
  try {
    // Эффекты страницы срабатывают раньше эффекта _app: канал сессии фиксируем при первом же событии.
    if (e !== 'visit' && !sessionStorage.getItem('rg_ch')) startSession();
    const key = `rg_e_${e}_${product}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    const ch = sessionStorage.getItem('rg_ch') || 'direct';
    fetch('/api/t', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ e, ch, p: product }) }).catch(() => {});
  } catch {}
}

// Вход на сайт: канал сессии фиксируется на первой странице и дальше не меняется.
export function startSession() {
  try {
    if (sessionStorage.getItem('rg_ch')) return;
    sessionStorage.setItem('rg_ch', captureTouch());
  } catch {
    return;
  }
  countEvent('visit');
}

export function deviceOf(ua: string): 'mobile' | 'tablet' | 'desktop' {
  if (/iPad|Tablet|PlayBook|Silk|Android(?!.*Mobile)/i.test(ua)) return 'tablet';
  if (/Mobi|iPhone|iPod|Android|Opera Mini|IEMobile/i.test(ua)) return 'mobile';
  return 'desktop';
}
