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

// Цвета статусов: заливка в статистике и в селекте статуса на странице заказов.
export const STATUS_COLOR: Record<string, string> = {
  pending: 'rgb(var(--accent))',
  processing: 'rgb(var(--ink))',
  completed: 'rgba(var(--ink), 0.45)',
  cancelled: 'rgba(var(--ink), 0.15)',
};

// Строка списка заказов: её отдают и SSR страницы, и поток новых заказов (SSE).
export const ORDER_ROW_SELECT = {
  id: true,
  createdAt: true,
  status: true,
  totalPrice: true,
  contact: true,
  items: true,
  note: true,
  payments: { where: { status: 'succeeded' }, select: { id: true }, take: 1 },
} as const;
export type OrderRow = {
  id: string;
  createdAt: string;
  status: string;
  totalPrice: number;
  phone: string;
  email: string;
  preferredContact: string;
  items: { title: string; quantity: number }[];
  hasNote: boolean;
  paid: boolean;
};
export function toOrderRow(o: { id: string; createdAt: Date; status: string; totalPrice: number; contact: unknown; items: unknown; note: string | null; payments?: unknown[] }): OrderRow {
  const c = (o.contact ?? {}) as Record<string, string>;
  const items = ((o.items ?? []) as { title?: string; quantity?: number }[]).map((i) => ({ title: i.title ?? '', quantity: i.quantity ?? 0 }));
  return {
    id: o.id,
    createdAt: o.createdAt.toISOString(),
    status: o.status,
    totalPrice: o.totalPrice,
    phone: c.phone ?? '',
    email: c.email ?? '',
    preferredContact: c.preferredContact ?? '',
    items,
    hasNote: !!o.note,
    paid: !!o.payments?.length,
  };
}
