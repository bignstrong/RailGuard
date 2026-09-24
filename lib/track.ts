export const YANDEX_COUNTER_ID = 103169989;

export function track(goal: string, params?: Record<string, unknown>) {
  try {
    if (typeof window === 'undefined') return;

    // Yandex Metrika
    if (window.ym) {
      window.ym(YANDEX_COUNTER_ID, 'reachGoal', goal, params);
    }

    // Google Analytics
    if (window.gtag) {
      window.gtag('event', goal, params);
    }
  } catch (err) {
    // Silently ignore errors from tracking
  }
}

type EcomProduct = { id: string; name: string; price: number; quantity?: number };

// Электронная коммерция Метрики (init: ecommerce: 'dataLayer'), формат detail/add/purchase:
// https://yandex.ru/support/metrica/ru/ecommerce/data. Пишем в dataLayer всегда: сам счётчик грузится только после согласия.
export function ecommerce(action: 'detail' | 'add', products: EcomProduct[]): void;
export function ecommerce(action: 'purchase', products: EcomProduct[], orderId: string): void;
export function ecommerce(action: 'detail' | 'add' | 'purchase', products: EcomProduct[], orderId?: string) {
  try {
    const list = products.map((p) => ({ ...p, category: 'Фильтры Common Rail' }));
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      ecommerce: { currencyCode: 'RUB', [action]: action === 'purchase' ? { actionField: { id: orderId }, products: list } : { products: list } },
    });
  } catch {}
}

// ClientID Метрики для офлайн-конверсий; undefined, если счётчик не загружен (нет согласия).
export function ymClientId(): Promise<string | undefined> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.ym) return resolve(undefined);
    const timer = setTimeout(() => resolve(undefined), 500);
    window.ym(YANDEX_COUNTER_ID, 'getClientID', (id: unknown) => {
      clearTimeout(timer);
      resolve(id ? String(id) : undefined);
    });
  });
}

declare global {
  interface Window {
    ym?: (counterId: number, method: string, ...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}
