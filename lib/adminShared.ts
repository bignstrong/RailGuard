// Константы админки без Node-зависимостей: импортируются и на клиенте, и на сервере.
export const ORDER_STATUSES = ['pending', 'processing', 'completed', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Новый',
  processing: 'В работе',
  completed: 'Выполнен',
  cancelled: 'Отменён',
};

// CSV для Excel: разделитель «;», экранируем кавычки и гасим формулы (= + - @ в начале ячейки).
// Телефоны и числа (+7 999…, -5) формулой не являются — их не трогаем.
export function csvField(v: string): string {
  const safe = /^[=+\-@\t\r]/.test(v) && !/^[+-]?[\d\s()-]+$/.test(v) ? `'${v}` : v;
  return /[;"\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}
