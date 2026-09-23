const YANDEX_COUNTER_ID = 103169989;

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

declare global {
  interface Window {
    ym?: (counterId: number, method: string, ...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}
