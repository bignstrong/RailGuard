import { EventEmitter } from 'node:events';
import type { OrderRow } from 'lib/adminShared';

// Новые заказы → открытые вкладки админки (pages/api/admin/orders/stream.ts).
// Шина на globalThis: у каждого API-роута свой бандл, а процесс один.
// ponytail: в памяти одного процесса; при нескольких репликах web — Postgres LISTEN/NOTIFY.
const g = globalThis as typeof globalThis & { orderBus?: EventEmitter };
const bus = (g.orderBus ??= new EventEmitter().setMaxListeners(0));

export const emitOrder = (row: OrderRow) => bus.emit('order', row);
export function onOrder(fn: (row: OrderRow) => void) {
  bus.on('order', fn);
  return () => void bus.off('order', fn);
}
