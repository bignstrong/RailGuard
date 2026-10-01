import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { AdminNav, AdminPage, Btn, fmtDate, fmtPhone, Input, Pill, PREFERRED, StatusSelect } from 'components/AdminUi';
import { adminBase, getAdminSession } from 'lib/adminAuth';
import type { AdminSession } from 'lib/adminSession';
import { ORDER_ROW_SELECT, ORDER_STATUSES, OrderRow, OrderStatus, STATUS_LABEL, toOrderRow } from 'lib/adminShared';
import { formatPrice } from 'lib/catalog';
import prisma from 'lib/prisma';

type Props = {
  base: string;
  session: AdminSession;
  orders: OrderRow[];
  q: string;
  status: string;
  customer: { id: string; phone: string; email: string } | null;
  subscribers: number;
  counts: Record<string, number>;
  today: { orders: number; revenue: number };
  serverNow: string;
};

const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' });

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const base = adminBase();
  const session = await getAdminSession(ctx);
  if (!session) return { redirect: { destination: `${base}/login`, permanent: false } };
  const q = String(ctx.query.q || '').trim().slice(0, 100);
  const status = String(ctx.query.status || '');
  const customerId = String(ctx.query.customer || '');
  const customer = customerId ? await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true, phone: true, email: true } }) : null;
  const where = {
    ...(ORDER_STATUSES.includes(status as OrderStatus) ? { status } : {}),
    ...(customer ? { customerId: customer.id } : {}),
    ...(q
      ? {
          OR: [
            { id: { contains: q } },
            { contact: { path: ['phone'], string_contains: q.replace(/\D/g, '') || q } },
            { contact: { path: ['email'], string_contains: q.toLowerCase() } },
          ],
        }
      : {}),
  };
  const now = new Date();
  const todayStart = new Date(`${dayFmt.format(now)}T00:00:00+03:00`);
  const [orders, subscribers, grouped, today] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200, select: ORDER_ROW_SELECT }),
    prisma.subscriber.count(),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.order.aggregate({ where: { createdAt: { gte: todayStart }, status: { not: 'cancelled' } }, _count: { _all: true }, _sum: { totalPrice: true } }),
  ]);
  return {
    props: {
      base,
      session,
      q,
      status,
      customer,
      subscribers,
      counts: Object.fromEntries(grouped.map((g) => [g.status, g._count._all])),
      today: { orders: today._count._all, revenue: today._sum.totalPrice ?? 0 },
      orders: orders.map(toOrderRow),
      serverNow: now.toISOString(),
    },
  };
};

// ───────── форматирование ─────────

const timeFmt = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit' });
const shortFmt = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', day: 'numeric', month: 'short' });
function ago(iso: string, now: number) {
  const d = new Date(iso);
  const min = Math.floor((now - d.getTime()) / 60000);
  if (min < 1) return 'только что';
  if (min < 60) return `${min} мин назад`;
  const day = dayFmt.format(d);
  if (day === dayFmt.format(now)) return `сегодня в ${timeFmt.format(d)}`;
  if (day === dayFmt.format(now - 86400000)) return `вчера в ${timeFmt.format(d)}`;
  return `${shortFmt.format(d)}, ${timeFmt.format(d)}`;
}

// Короткий двойной сигнал без аудиофайла. Браузер может не дать звук до первого клика по странице — тогда молча пропускаем.
function beep() {
  try {
    const ctx = new AudioContext();
    [0, 0.18].forEach((t, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = i ? 1046 : 784;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.16);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.17);
    });
    setTimeout(() => ctx.close(), 600);
  } catch {}
}

// ───────── стили ─────────

const Summary = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
  gap: 1.2rem;
  margin-bottom: 2rem;
`;

const Stat = styled.div<{ $accent?: boolean }>`
  padding: 1.4rem 1.6rem;
  border-radius: 0.8rem;
  border: 1px solid ${(p) => (p.$accent ? 'rgba(var(--accent), 0.35)' : 'rgba(var(--ink), 0.1)')};
  background: ${(p) => (p.$accent ? 'rgba(var(--accent), 0.06)' : 'rgb(var(--bg))')};

  small {
    display: block;
    font-size: 1.3rem;
    color: rgba(var(--ink), 0.65);
  }
  strong {
    font-size: 2.6rem;
    font-weight: 600;
  }
  span {
    margin-left: 0.6rem;
    color: rgba(var(--ink), 0.65);
  }
  a {
    color: rgb(var(--accent));
    font-size: 1.3rem;
  }
`;

const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.2rem;

  form {
    display: flex;
    gap: 0.6rem;
    flex: 1 1 32rem;
    max-width: 48rem;
  }
  form input {
    flex: 1;
    min-width: 0;
  }
`;

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;

  a {
    display: inline-flex;
    gap: 0.6rem;
    align-items: center;
    padding: 0.6rem 1.2rem;
    border-radius: 2rem;
    border: 1px solid rgba(var(--ink), 0.15);
    color: rgb(var(--ink));
    text-decoration: none;
    font-size: 1.4rem;
  }
  a b {
    font-weight: 400;
    color: rgba(var(--ink), 0.55);
  }
  a[aria-current='page'] {
    background: rgb(var(--ink));
    border-color: rgb(var(--ink));
    color: rgb(var(--bg));
  }
  a[aria-current='page'] b {
    color: rgba(var(--bg), 0.7);
  }
`;

const Live = styled.span<{ $on: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.3rem;
  color: rgba(var(--ink), 0.65);

  &::before {
    content: '';
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 50%;
    background: ${(p) => (p.$on ? '#16a34a' : 'rgba(var(--ink), 0.3)')};
    box-shadow: ${(p) => (p.$on ? '0 0 0 3px rgba(22, 163, 74, 0.18)' : 'none')};
  }
  button {
    font: inherit;
    border: 0;
    background: none;
    color: rgb(var(--accent));
    cursor: pointer;
    padding: 0;
  }
`;

const flash = keyframes`
  from { background: rgba(var(--accent), 0.18); }
  to { background: transparent; }
`;

const List = styled.div`
  border: 1px solid rgba(var(--ink), 0.1);
  border-radius: 0.8rem;
  overflow: hidden;
  background: rgb(var(--bg));
`;

const COLS = '14rem minmax(0, 1.2fr) minmax(0, 1.4fr) 11rem 15rem';

const ListHead = styled.div`
  display: grid;
  grid-template-columns: ${COLS};
  gap: 1.6rem;
  padding: 1rem 1.6rem;
  font-size: 1.25rem;
  color: rgba(var(--ink), 0.6);
  background: rgba(var(--ink), 0.03);
  border-bottom: 1px solid rgba(var(--ink), 0.08);

  span:nth-child(4) {
    text-align: right;
  }
  @media (max-width: 860px) {
    display: none;
  }
`;

const Item = styled.div<{ $pending: boolean; $fresh: boolean }>`
  display: grid;
  grid-template-columns: ${COLS};
  gap: 1.6rem;
  align-items: center;
  padding: 1.4rem 1.6rem;
  border-bottom: 1px solid rgba(var(--ink), 0.07);
  box-shadow: ${(p) => (p.$pending ? 'inset 3px 0 0 rgb(var(--accent))' : 'none')};
  cursor: pointer;
  animation: ${(p) => (p.$fresh ? flash : 'none')} 4s ease-out;

  &:last-child {
    border-bottom: 0;
  }
  &:hover {
    background: rgba(var(--ink), 0.025);
  }
  small {
    display: block;
    font-size: 1.25rem;
    color: rgba(var(--ink), 0.6);
    margin-top: 0.2rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  > div {
    min-width: 0;
  }
  a {
    font-weight: 600;
    color: rgb(var(--ink));
    text-decoration: none;
  }
  a:hover {
    color: rgb(var(--accent));
  }

  @media (max-width: 860px) {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.8rem 1.2rem;

    > div:nth-child(3) {
      grid-column: 1 / -1;
    }
  }
`;

const Sum = styled.div`
  text-align: right;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
`;

const Toast = styled.div`
  position: fixed;
  right: 1.6rem;
  bottom: 1.6rem;
  z-index: 20;
  display: flex;
  gap: 1.6rem;
  align-items: center;
  max-width: calc(100vw - 3.2rem);
  padding: 1.4rem 1.6rem;
  border-radius: 0.8rem;
  background: rgb(var(--ink));
  color: rgb(var(--bg));
  box-shadow: 0 10px 30px rgba(var(--ink), 0.3);
  font-size: 1.4rem;

  b {
    color: rgb(var(--accent));
  }
  a {
    color: rgb(var(--bg));
    font-weight: 600;
    white-space: nowrap;
  }
  button {
    border: 0;
    background: none;
    color: rgba(var(--bg), 0.6);
    font-size: 2rem;
    line-height: 1;
    cursor: pointer;
  }
`;

const Empty = styled.p`
  padding: 4rem 1.6rem;
  text-align: center;
  color: rgba(var(--ink), 0.6);
  margin: 0;
`;

const Exports = styled.p`
  margin: 1.6rem 0 0;
  font-size: 1.3rem;
  color: rgba(var(--ink), 0.65);

  a {
    color: rgb(var(--accent));
  }
`;

// ───────── страница ─────────

export default function AdminOrders({ base, session, orders, q, status, customer, subscribers, counts: initialCounts, today: initialToday, serverNow }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(orders);
  const [counts, setCounts] = useState(initialCounts);
  const [today, setToday] = useState(initialToday);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<OrderRow | null>(null);
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.parse(serverNow));
  const [notify, setNotify] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const unseen = useRef(0);
  // Уже показанные заказы: поток может прислать дубль (догрузка после переподключения).
  const seen = useRef(new Set<string>());

  // SSR-пропсы меняются при смене фильтра — синхронизируем список и счётчики.
  useEffect(() => {
    setRows(orders);
    setCounts(initialCounts);
    setToday(initialToday);
    orders.forEach((o) => seen.current.add(o.id));
  }, [orders, initialCounts, initialToday]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    setNow(Date.now());
    setNotify(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        unseen.current = 0;
        document.title = 'Заказы';
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // Живой поток новых заказов (SSE). В список заказ попадает, только если подходит под текущий фильтр.
  const latest = orders[0]?.createdAt ?? serverNow;
  useEffect(() => {
    const es = new EventSource(`${base}/api/orders/stream?after=${encodeURIComponent(latest)}`);
    es.onopen = () => setLive(true);
    es.onerror = () => setLive(false);
    es.addEventListener('order', (e) => {
      const row: OrderRow = JSON.parse((e as MessageEvent).data);
      if (seen.current.has(row.id)) return;
      seen.current.add(row.id);
      if (!q && !customer && (!status || status === row.status)) setRows((r) => [row, ...r]);
      setCounts((c) => ({ ...c, [row.status]: (c[row.status] ?? 0) + 1 }));
      setToday((t) => ({ orders: t.orders + 1, revenue: t.revenue + row.totalPrice }));
      setFresh((f) => new Set(f).add(row.id));
      setToast(row);
      beep();
      if (document.visibilityState !== 'visible') {
        unseen.current += 1;
        document.title = `(${unseen.current}) Новый заказ · Заказы`;
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(`Новый заказ на ${formatPrice(row.totalPrice)}`, { body: `${fmtPhone(row.phone)} · ${row.items.map((i) => i.title).join(', ')}`, icon: '/icon-192.png', tag: row.id });
        }
      }
    });
    return () => es.close();
  }, [base, latest, q, status, customer]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 10_000);
    return () => clearTimeout(t);
  }, [toast]);

  async function setStatus(id: string, next: string) {
    const prev = rows.find((o) => o.id === id)?.status;
    setBusy(id);
    try {
      const res = await fetch(`${base}/api/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) });
      if (!res.ok) throw new Error();
      setRows((r) => r.map((o) => (o.id === id ? { ...o, status: next } : o)));
      if (prev) setCounts((c) => ({ ...c, [prev]: Math.max(0, (c[prev] ?? 0) - 1), [next]: (c[next] ?? 0) + 1 }));
    } catch {
      alert('Не удалось изменить статус');
    } finally {
      setBusy(null);
    }
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const href = (s: string) => `${base || '/'}${s ? `?status=${s}` : ''}`;
  const chipHref = (s: string) => {
    const p = new URLSearchParams({ ...(s ? { status: s } : {}), ...(customer ? { customer: customer.id } : {}) }).toString();
    return `${base || '/'}${p ? `?${p}` : ''}`;
  };
  const csvQuery = new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}) }).toString();

  return (
    <AdminPage>
      <Head>
        <title>Заказы</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminNav base={base} session={session} active="orders" title="Заказы" />

      <Summary>
        <Stat $accent={!!counts.pending}>
          <small>Ждут обработки</small>
          <strong>{counts.pending ?? 0}</strong>
          {!!counts.pending && status !== 'pending' && (
            <span>
              <NextLink href={href('pending')}>показать</NextLink>
            </span>
          )}
        </Stat>
        <Stat>
          <small>Сегодня</small>
          <strong>{today.orders}</strong>
          <span>на {formatPrice(today.revenue)}</span>
        </Stat>
        <Stat>
          <small>Всего заказов</small>
          <strong>{total}</strong>
        </Stat>
        <Stat>
          <small>Подписчиков рассылки</small>
          <strong>{subscribers}</strong>
        </Stat>
      </Summary>

      <Controls>
        <Chips>
          <NextLink href={chipHref('')} aria-current={!status ? 'page' : undefined}>
            Все <b>{total}</b>
          </NextLink>
          {ORDER_STATUSES.map((s) => (
            <NextLink key={s} href={chipHref(s)} aria-current={status === s ? 'page' : undefined}>
              {STATUS_LABEL[s]} <b>{counts[s] ?? 0}</b>
            </NextLink>
          ))}
        </Chips>
        <form method="get">
          {status && <input type="hidden" name="status" value={status} />}
          <Input name="q" defaultValue={q} placeholder="Телефон, email или номер заказа" aria-label="Поиск" />
          <Btn type="submit">Найти</Btn>
        </form>
      </Controls>

      <Controls>
        <Live $on={live}>
          {live ? 'Новые заказы появятся сами' : 'Переподключение…'}
          {notify === 'default' && (
            <button type="button" onClick={() => Notification.requestPermission().then(setNotify)}>
              · Включить уведомления
            </button>
          )}
        </Live>
        {(q || customer) && (
          <span style={{ fontSize: '1.3rem' }}>
            {customer ? `Покупатель ${fmtPhone(customer.phone)}, ${customer.email}` : `Поиск «${q}»`} · <NextLink href={href(status)}>сбросить</NextLink>
          </span>
        )}
      </Controls>

      <List>
        <ListHead>
          <span>Заказ</span>
          <span>Покупатель</span>
          <span>Состав</span>
          <span>Сумма</span>
          <span>Статус</span>
        </ListHead>
        {rows.length === 0 && <Empty>{q || status || customer ? 'Ничего не найдено' : 'Заказов пока нет'}</Empty>}
        {rows.map((o) => {
          const qty = o.items.reduce((s, i) => s + i.quantity, 0);
          return (
            <Item key={o.id} $pending={o.status === 'pending'} $fresh={fresh.has(o.id)} onClick={() => router.push(`${base}/orders/${o.id}`)}>
              <div>
                <NextLink href={`${base}/orders/${o.id}`} onClick={(e) => e.stopPropagation()}>
                  #{o.id.slice(-6).toUpperCase()}
                </NextLink>
                {o.paid && <Pill style={{ background: 'rgba(22, 163, 74, 0.12)', color: '#15803d' }}>оплачен</Pill>}
                {o.hasNote && <Pill title="Есть заметка">заметка</Pill>}
                <small title={fmtDate(o.createdAt)}>{ago(o.createdAt, now)}</small>
              </div>
              <div>
                {fmtPhone(o.phone)}
                {o.preferredContact && o.preferredContact !== 'phone' && <Pill>{PREFERRED[o.preferredContact] ?? o.preferredContact}</Pill>}
                <small>{o.email}</small>
              </div>
              <div>
                {o.items[0] ? `${o.items[0].title} × ${o.items[0].quantity}` : '—'}
                <small>{o.items.length > 1 ? `и ещё ${o.items.length - 1} · всего ${qty} шт.` : `${qty} шт.`}</small>
              </div>
              <Sum>{formatPrice(o.totalPrice)}</Sum>
              <div onClick={(e) => e.stopPropagation()}>
                <StatusSelect $s={o.status} value={o.status} disabled={busy === o.id} onChange={(e) => setStatus(o.id, e.target.value)} aria-label="Статус заказа">
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </StatusSelect>
              </div>
            </Item>
          );
        })}
      </List>

      <Exports>
        Выгрузка: {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href={`${base}/api/orders.csv${csvQuery ? `?${csvQuery}` : ''}`}>заказы в CSV</a> ·{' '}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href={`${base}/api/subscribers.csv`}>подписчики в CSV</a>
        {rows.length >= 200 && ' · показаны последние 200 — уточните поиск'}
      </Exports>

      {toast && (
        <Toast role="status">
          <div>
            <b>Новый заказ</b> · {formatPrice(toast.totalPrice)} · {fmtPhone(toast.phone)}
          </div>
          <NextLink href={`${base}/orders/${toast.id}`}>Открыть →</NextLink>
          <button type="button" aria-label="Закрыть" onClick={() => setToast(null)}>
            ×
          </button>
        </Toast>
      )}
    </AdminPage>
  );
}
