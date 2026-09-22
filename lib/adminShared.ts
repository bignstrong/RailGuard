// Константы админки без Node-зависимостей: импортируются и на клиенте, и на сервере.
export const ORDER_STATUSES = ['pending', 'processing', 'completed', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Новый',
  processing: 'В работе',
  completed: 'Выполнен',
  cancelled: 'Отменён',
};
