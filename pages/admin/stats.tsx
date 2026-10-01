import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import styled from 'styled-components';
import { AdminNav, AdminPage, Btn, Card, Input, Table, Toolbar } from 'components/AdminUi';
import { adminBase, getAdminSession } from 'lib/adminAuth';
import type { AdminSession } from 'lib/adminSession';
import { ORDER_STATUSES, OrderStatus, STATUS_LABEL } from 'lib/adminShared';
import { Channel, CHANNEL_LABEL, CHANNELS, Touch } from 'lib/attribution';
import { CATALOG, formatPrice, isProductId } from 'lib/catalog';
import prisma from 'lib/prisma';

const PRESETS = ['7', '30', '90', '365', 'all'] as const;
type Preset = (typeof PRESETS)[number];
const PRESET_LABEL: Record<Preset, string> = { '7': '7 дней', '30': '30 дней', '90': '90 дней', '365': 'Год', all: 'Всё время' };
type Grain = 'day' | 'week' | 'month';
const GRAIN_LABEL: Record<Grain, string> = { day: 'по дням', week: 'по неделям', month: 'по месяцам' };

type CartItem = { id: string; title: string; price: number; quantity: number };
// Одна строка отчёта: визиты и корзины — сессии (DailyStat), остальное — заказы. Выручка без отменённых.
type Agg = { visits: number; adds: number; orders: number; completed: number; cancelled: number; revenue: number; doneRevenue: number };
type Row = Agg & { key: string; label: string };
type ItemRow = { title: string; views: number; adds: number; orders: number; quantity: number; revenue: number };
type StatusRow = { status: string; label: string; count: number; sum: number };
type Props = {
  base: string;
  session: AdminSession;
  preset: Preset | 'custom';
  from: string;
  to: string;
  prevFrom: string | null;
  grain: Grain;
  trend: Row[];
  prevTrend: Row[] | null;
  total: Agg;
  prevTotal: Agg | null;
  channelRows: Row[];
  sourceRows: Row[];
  deviceRows: Row[];
  itemRows: ItemRow[];
  statusRows: StatusRow[];
  heat: number[][];
  buyers: { total: number; repeat: number };
};

const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' });
const hourFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Moscow', hour: '2-digit', hourCycle: 'h23' });
const dayKey = (d: Date) => dayFmt.format(d);
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const addDays = (day: string, n: number) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const weekday = (day: string) => (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7; // 0 = понедельник
const bucketOf = (day: string, grain: Grain) => (grain === 'day' ? day : grain === 'week' ? addDays(day, -weekday(day)) : day.slice(0, 7));
const mskStart = (day: string) => new Date(`${day}T00:00:00+03:00`);

const emptyAgg = (): Agg => ({ visits: 0, adds: 0, orders: 0, completed: 0, cancelled: 0, revenue: 0, doneRevenue: 0 });
const sumAgg = (rows: Agg[]) =>
  rows.reduce((a, r) => {
    for (const k of Object.keys(a) as (keyof Agg)[]) a[k] += r[k];
    return a;
  }, emptyAgg());
function addOrder(a: Agg, o: { status: string; totalPrice: number }) {
  a.orders += 1;
  if (o.status === 'cancelled') a.cancelled += 1;
  else a.revenue += o.totalPrice;
  if (o.status === 'completed') {
    a.completed += 1;
    a.doneRevenue += o.totalPrice;
  }
}

type OrderLite = { createdAt: Date; totalPrice: number; status: string };
type StatLite = { day: string; event: string; product: string; count: number };
// Ряд по корзинам времени: пустые дни/недели/месяцы тоже есть, чтобы на графике были нули, а не дыры.
function series(first: string, last: string, grain: Grain, orders: OrderLite[], stats: StatLite[]): Row[] {
  const map = new Map<string, Row>();
  for (let d = first; d <= last; d = addDays(d, 1)) {
    const b = bucketOf(d, grain);
    if (!map.has(b)) map.set(b, { key: b, label: b, ...emptyAgg() });
  }
  for (const s of stats) {
    const r = map.get(bucketOf(s.day, grain));
    if (!r) continue;
    if (s.event === 'visit') r.visits += s.count;
    else if (s.event === 'add' && !s.product) r.adds += s.count;
  }
  for (const o of orders) {
    const r = map.get(bucketOf(dayKey(o.createdAt), grain));
    if (r) addOrder(r, o);
  }
  return [...map.values()];
}

const DEVICE_LABEL: Record<string, string> = { mobile: 'Телефон', tablet: 'Планшет', desktop: 'Компьютер' };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const base = adminBase();
  const session = await getAdminSession(ctx);
  if (!session) return { redirect: { destination: `${base}/login`, permanent: false } };

  const today = dayKey(new Date());
  const q = ctx.query as Record<string, string | undefined>;
  let preset: Preset | 'custom' = PRESETS.includes(q.period as Preset) ? (q.period as Preset) : '30';
  let from: string;
  let to = today;
  if (q.from && q.to && DAY_RE.test(q.from) && DAY_RE.test(q.to)) {
    preset = 'custom';
    to = q.to > today ? today : q.to;
    from = q.from > to ? to : q.from;
  } else if (preset === 'all') {
    const [o, s] = await Promise.all([
      prisma.order.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
      prisma.dailyStat.findFirst({ orderBy: { day: 'asc' }, select: { day: true } }),
    ]);
    from = [o && dayKey(o.createdAt), s?.day, today].filter((d): d is string => !!d).sort()[0];
  } else from = addDays(today, -(Number(preset) - 1));

  const span = Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1;
  const grain: Grain = span <= 45 ? 'day' : span <= 200 ? 'week' : 'month';
  // Сравнение — с таким же отрезком сразу перед выбранным.
  const prevFrom = preset === 'all' ? null : addDays(from, -span);
  const loadFrom = prevFrom ?? from;

  // ponytail: заказы за оба периода грузятся целиком и считаются в памяти; при десятках тысяч заказов — SQL GROUP BY.
  const [allOrders, allStats, earlier] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: mskStart(loadFrom), lt: mskStart(addDays(to, 1)) } },
      select: { createdAt: true, totalPrice: true, status: true, channel: true, device: true, attribution: true, items: true, contact: true },
    }),
    prisma.dailyStat.findMany({ where: { day: { gte: loadFrom, lte: to } } }),
    // Телефоны прошлых покупателей — чтобы отличить повторную покупку от новой.
    prisma.order.findMany({ where: { createdAt: { lt: mskStart(from) }, status: { not: 'cancelled' } }, select: { contact: true } }),
  ]);
  const orders = allOrders.filter((o) => dayKey(o.createdAt) >= from);
  const stats = allStats.filter((s) => s.day >= from);

  const trend = series(from, to, grain, orders, stats);
  const prevTrend = prevFrom
    ? series(prevFrom, addDays(from, -1), grain, allOrders.filter((o) => dayKey(o.createdAt) < from), allStats.filter((s) => s.day < from))
    : null;

  const getRow = (map: Map<string, Row>, key: string, label: string) => {
    let row = map.get(key);
    if (!row) map.set(key, (row = { key, label, ...emptyAgg() }));
    return row;
  };
  const channels = new Map<string, Row>();
  const sources = new Map<string, Row>();
  const devices = new Map<string, Row>();
  const items = new Map<string, ItemRow>();
  const statuses = new Map<string, StatusRow>();
  const channelRow = (key: string) => getRow(channels, key, CHANNEL_LABEL[key as Channel] ?? 'Нет данных (заказы до учёта источников)');
  const itemRow = (id: string, title?: string) => {
    let row = items.get(id);
    if (!row) items.set(id, (row = { title: isProductId(id) ? CATALOG[id].title : title ?? id, views: 0, adds: 0, orders: 0, quantity: 0, revenue: 0 }));
    return row;
  };
  CHANNELS.forEach(channelRow);

  for (const s of stats) {
    if (s.event === 'visit') channelRow(s.channel).visits += s.count;
    else if (s.event === 'add' && !s.product) channelRow(s.channel).adds += s.count;
    else if (s.event === 'add') itemRow(s.product).adds += s.count;
    else if (s.event === 'view') itemRow(s.product).views += s.count;
  }

  const heat = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  const phoneOf = (c: unknown) => (c as { phone?: string } | null)?.phone;
  const earlierPhones = new Set(earlier.map((o) => phoneOf(o.contact)));
  const buyerOrders = new Map<string, number>();

  for (const o of orders) {
    const st = statuses.get(o.status) ?? { status: o.status, label: STATUS_LABEL[o.status as OrderStatus] ?? o.status, count: 0, sum: 0 };
    st.count += 1;
    st.sum += o.totalPrice;
    statuses.set(o.status, st);

    addOrder(channelRow(o.channel ?? 'unknown'), o);
    const dev = o.device ?? 'unknown';
    addOrder(getRow(devices, dev, DEVICE_LABEL[dev] ?? 'Нет данных'), o);
    const lt = (o.attribution as { lt?: Touch | null } | null)?.lt;
    const src = lt ? [lt.source, lt.medium, lt.campaign].filter(Boolean).join(' / ') : 'нет данных';
    addOrder(getRow(sources, src, src), o);
    heat[weekday(dayKey(o.createdAt))][Number(hourFmt.format(o.createdAt))] += 1;

    if (o.status === 'cancelled') continue;
    const phone = phoneOf(o.contact);
    if (phone) buyerOrders.set(phone, (buyerOrders.get(phone) ?? 0) + 1);
    for (const it of (o.items ?? []) as CartItem[]) {
      const row = itemRow(it.id, it.title);
      row.orders += 1;
      row.quantity += it.quantity;
      row.revenue += it.price * it.quantity;
    }
  }

  const byRevenue = <T extends { revenue: number; orders: number }>(a: T, b: T) => b.revenue - a.revenue || b.orders - a.orders;
  return {
    props: {
      base,
      session,
      preset,
      from,
      to,
      prevFrom,
      grain,
      trend,
      prevTrend,
      total: sumAgg(trend),
      prevTotal: prevTrend && sumAgg(prevTrend),
      channelRows: [...channels.values()].filter((r) => r.visits || r.orders).sort((a, b) => byRevenue(a, b) || b.visits - a.visits),
      sourceRows: [...sources.values()].sort(byRevenue),
      deviceRows: [...devices.values()].sort(byRevenue),
      itemRows: [...items.values()].sort((a, b) => byRevenue(a, b) || b.adds - a.adds),
      statusRows: [...statuses.values()].sort((a, b) => ORDER_STATUSES.indexOf(a.status as OrderStatus) - ORDER_STATUSES.indexOf(b.status as OrderStatus)),
      heat,
      buyers: { total: buyerOrders.size, repeat: [...buyerOrders].filter(([p, n]) => n > 1 || earlierPhones.has(p)).length },
    },
  };
};

// ───────── форматирование ─────────

type Kind = 'money' | 'count' | 'pct';
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const fmtDay = (day: string, year = false) => {
  const [y, m, d] = day.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}${year ? ` ${y}` : ''}`;
};
const fmtBucket = (b: string, grain: Grain, long = false) =>
  grain === 'month' ? `${MONTHS[Number(b.slice(5, 7)) - 1]} ${b.slice(0, 4)}` : grain === 'week' && long ? `неделя с ${fmtDay(b)}` : fmtDay(b);
const compact = new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 });
const fmt = (v: number, kind: Kind, short = false) =>
  kind === 'pct' ? `${(v * 100).toFixed(1)}%` : kind === 'money' ? (short ? `${compact.format(v)} ₽` : formatPrice(Math.round(v))) : short ? compact.format(v) : v.toLocaleString('ru-RU');
const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : '—');
const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10;
  const m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
};

// Шкала: шаг округляем до 1/2/5 × 10^n, сетка из четырёх делений.
function niceTop(max: number, kind: Kind) {
  const raw = Math.max(max, kind === 'pct' ? 0.01 : 1) / 4;
  const p = 10 ** Math.floor(Math.log10(raw));
  const n = raw / p;
  const step = Math.max((n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p, kind === 'count' ? 1 : 0);
  return step * 4;
}

type Kpi = { label: string; kind: Kind; get: (a: Agg) => number; goodUp?: boolean; hero?: boolean };
const KPIS: Kpi[] = [
  { label: 'Выручка', kind: 'money', get: (a) => a.revenue, hero: true },
  { label: 'Заказы', kind: 'count', get: (a) => a.orders },
  { label: 'Средний чек', kind: 'money', get: (a) => (a.orders - a.cancelled ? a.revenue / (a.orders - a.cancelled) : 0) },
  { label: 'Конверсия визит → заказ', kind: 'pct', get: (a) => (a.visits ? a.orders / a.visits : 0) },
  { label: 'Визиты', kind: 'count', get: (a) => a.visits },
  { label: 'Выручка выполненных', kind: 'money', get: (a) => a.doneRevenue },
  { label: 'Доля отмен', kind: 'pct', get: (a) => (a.orders ? a.cancelled / a.orders : 0), goodUp: false },
];

const METRICS = [
  { key: 'revenue', label: 'Выручка', kind: 'money' },
  { key: 'orders', label: 'Заказы', kind: 'count' },
  { key: 'visits', label: 'Визиты', kind: 'count' },
  { key: 'adds', label: 'Корзины', kind: 'count' },
] as const;
type MetricKey = (typeof METRICS)[number]['key'];

const STATUS_COLOR: Record<string, string> = {
  pending: 'rgb(var(--accent))',
  processing: 'rgb(var(--ink))',
  completed: 'rgba(var(--ink), 0.45)',
  cancelled: 'rgba(var(--ink), 0.15)',
};

// ───────── стили ─────────

const Muted = styled.p`
  color: rgba(var(--ink), 0.65);
  font-size: 1.3rem;
  margin: 0 0 1.2rem;
`;

const Filters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem 2rem;
  align-items: center;
  margin-bottom: 0.8rem;

  form {
    margin: 0;
  }
  input[type='date'] {
    min-width: 0;
  }
`;

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;

  a {
    padding: 0.6rem 1.2rem;
    border-radius: 2rem;
    border: 1px solid rgba(var(--ink), 0.2);
    color: rgb(var(--ink));
    text-decoration: none;
    font-size: 1.4rem;
  }
  a[aria-current='true'] {
    background: rgb(var(--ink));
    border-color: rgb(var(--ink));
    color: rgb(var(--bg));
  }
`;

const Links = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.6rem;
  margin-left: auto;
  font-size: 1.3rem;

  a {
    color: rgb(var(--accent));
  }
`;

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.6rem;
  margin: 2rem 0;

  @media (min-width: 900px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

const Tile = styled.section<{ $hero?: boolean }>`
  grid-column: ${(p) => (p.$hero ? 'span 2' : 'auto')};
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 1.6rem 1.8rem 1.2rem;
  border: 1px solid rgba(var(--ink), 0.12);
  border-radius: 0.8rem;
  background: rgb(var(--bg));
  min-width: 0;

  h3 {
    margin: 0;
    font-size: 1.3rem;
    font-weight: 400;
    color: rgba(var(--ink), 0.7);
  }
  strong {
    font-size: ${(p) => (p.$hero ? '4.8rem' : '2.8rem')};
    line-height: 1.15;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  svg {
    margin-top: auto;
    display: block;
  }
`;

const Delta = styled.span<{ $tone: 'good' | 'bad' | 'flat' }>`
  font-size: 1.3rem;
  color: ${(p) => (p.$tone === 'good' ? '#15803d' : p.$tone === 'bad' ? '#b91c1c' : 'rgba(var(--ink), 0.6)')};

  small {
    color: rgba(var(--ink), 0.55);
    font-size: 1.2rem;
  }
`;

const Grid2 = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 42rem), 1fr));
  gap: 2rem;
  margin-bottom: 2rem;

  > section {
    margin: 0;
    min-width: 0;
  }
`;

const CardHead = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 1.2rem;

  h2 {
    margin: 0;
  }
`;

const Tabs = styled.div`
  display: inline-flex;
  padding: 0.3rem;
  border-radius: 0.8rem;
  background: rgba(var(--ink), 0.06);

  button {
    font: inherit;
    font-size: 1.4rem;
    border: 0;
    padding: 0.5rem 1.2rem;
    border-radius: 0.6rem;
    background: transparent;
    color: rgb(var(--ink));
    cursor: pointer;
  }
  button[aria-pressed='true'] {
    background: rgb(var(--bg));
    box-shadow: 0 1px 3px rgba(var(--ink), 0.15);
    font-weight: 600;
  }
`;

const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1.6rem;
  font-size: 1.3rem;
  color: rgba(var(--ink), 0.7);
  margin-bottom: 1rem;

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
  }
  i {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border-radius: 0.2rem;
  }
`;

const Chart = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: 24rem auto;
  column-gap: 0.8rem;
  font-size: 1.2rem;
  color: rgba(var(--ink), 0.6);
`;

const YAxis = styled.div`
  position: relative;
  min-width: 4.4rem;
  text-align: right;
  font-variant-numeric: tabular-nums;

  span {
    position: absolute;
    right: 0;
    transform: translateY(50%);
    white-space: nowrap;
  }
`;

const Plot = styled.div`
  position: relative;
  display: flex;
  align-items: flex-end;
  border-bottom: 1px solid rgba(var(--ink), 0.25);

  > hr {
    position: absolute;
    left: 0;
    right: 0;
    margin: 0;
    border: 0;
    border-top: 1px solid rgba(var(--ink), 0.08);
  }
  > svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: visible;
  }
`;

const Col = styled.div<{ $active: boolean }>`
  position: relative;
  flex: 1;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 1px;
  background: ${(p) => (p.$active ? 'rgba(var(--ink), 0.05)' : 'transparent')};

  span {
    width: 100%;
    max-width: 2.4rem;
    border-radius: 0.4rem 0.4rem 0 0;
    background: rgb(var(--accent));
    opacity: ${(p) => (p.$active ? 1 : 0.85)};
  }
`;

const XAxis = styled.div`
  grid-column: 2;
  display: flex;
  padding-top: 0.6rem;

  span {
    flex: 1;
    min-width: 0;
    text-align: center;
    white-space: nowrap;
    overflow: visible;
  }
`;

const Tip = styled.div`
  position: absolute;
  top: 0;
  z-index: 2;
  min-width: 18rem;
  padding: 1rem 1.2rem;
  border-radius: 0.6rem;
  background: rgb(var(--ink));
  color: rgb(var(--bg));
  font-size: 1.3rem;
  line-height: 1.5;
  pointer-events: none;
  box-shadow: 0 6px 20px rgba(var(--ink), 0.25);

  b {
    display: block;
    margin-bottom: 0.2rem;
  }
  div {
    display: flex;
    justify-content: space-between;
    gap: 1.6rem;
  }
  em {
    font-style: normal;
    opacity: 0.7;
  }
`;

const FunnelStep = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.4rem 1.2rem;
  padding: 0.8rem 0;
  border-bottom: 1px solid rgba(var(--ink), 0.08);

  &:last-child {
    border-bottom: 0;
  }
  b {
    font-variant-numeric: tabular-nums;
  }
  small {
    grid-column: 1 / -1;
    color: rgba(var(--ink), 0.6);
    font-size: 1.25rem;
  }
`;

const Track = styled.div`
  grid-column: 1 / -1;
  height: 0.8rem;
  border-radius: 0.4rem;
  background: rgba(var(--ink), 0.07);

  > div {
    height: 100%;
    border-radius: 0.4rem;
    background: rgb(var(--accent));
  }
`;

const Heat = styled.div`
  display: grid;
  grid-template-columns: 2.4rem repeat(24, minmax(0, 1fr));
  gap: 2px;
  font-size: 1.1rem;
  color: rgba(var(--ink), 0.6);

  > i {
    aspect-ratio: 1;
    min-height: 1rem;
    border-radius: 0.2rem;
  }
  > span {
    line-height: 1;
    align-self: center;
  }
`;

const Stack = styled.div`
  display: flex;
  gap: 2px;
  height: 1.6rem;
  margin-bottom: 1.4rem;

  > i {
    min-width: 0.4rem;
  }
  > i:first-child {
    border-radius: 0.4rem 0 0 0.4rem;
  }
  > i:last-child {
    border-radius: 0 0.4rem 0.4rem 0;
  }
`;

const Figures = styled.dl`
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  gap: 1.2rem !important;
  margin-top: 2rem !important;

  dt {
    font-size: 1.3rem;
  }
  dd {
    font-size: 2.4rem;
    font-weight: 600;
  }
`;

const Scroll = styled.div`
  overflow-x: auto;

  td,
  th {
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  td:first-child {
    white-space: normal;
    min-width: 14rem;
  }
`;

const BarTrack = styled.div`
  height: 0.5rem;
  min-width: 8rem;
  margin-top: 0.4rem;
  border-radius: 0.3rem;
  background: rgba(var(--ink), 0.07);

  > div {
    height: 100%;
    border-radius: 0.3rem;
    background: rgb(var(--accent));
  }
`;

// ───────── компоненты ─────────

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(...values) || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${30 - (v / max) * 28}`).join(' ');
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" width="100%" height="32" aria-hidden="true">
      <polygon points={`0,32 ${pts} 100,32`} fill="rgba(var(--accent), 0.1)" />
      <polyline points={pts} fill="none" stroke="rgb(var(--accent))" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

function deltaOf(cur: number, prev: number, kind: Kind) {
  if (kind === 'pct') {
    const d = (cur - prev) * 100;
    return { v: d, text: `${d > 0 ? '+' : ''}${d.toFixed(1)} п.п.` };
  }
  if (!prev) return cur ? { v: 1, text: 'было 0' } : { v: 0, text: '0%' };
  const d = ((cur - prev) / prev) * 100;
  return { v: d, text: `${d > 0 ? '+' : ''}${Math.round(d)}%` };
}

function KpiTile({ kpi, total, prevTotal, trend }: { kpi: Kpi; total: Agg; prevTotal: Agg | null; trend: Row[] }) {
  const cur = kpi.get(total);
  const d = prevTotal && deltaOf(cur, kpi.get(prevTotal), kpi.kind);
  const up = d && Math.abs(d.v) >= 0.05 ? d.v > 0 : null;
  const tone = up === null ? 'flat' : up === (kpi.goodUp ?? true) ? 'good' : 'bad';
  return (
    <Tile $hero={kpi.hero}>
      <h3>{kpi.label}</h3>
      <strong>{fmt(cur, kpi.kind)}</strong>
      {d && prevTotal && (
        <Delta $tone={tone}>
          {up === null ? '■' : up ? '▲' : '▼'} {d.text} <small>к прошлому периоду ({fmt(kpi.get(prevTotal), kpi.kind)})</small>
        </Delta>
      )}
      <Sparkline values={trend.map((r) => kpi.get(r))} />
    </Tile>
  );
}

function TrendChart({ trend, prevTrend, grain }: { trend: Row[]; prevTrend: Row[] | null; grain: Grain }) {
  const [metric, setMetric] = useState<MetricKey>('revenue');
  const [hover, setHover] = useState<number | null>(null);
  const m = METRICS.find((x) => x.key === metric)!;
  const n = trend.length;
  const values = trend.map((r) => r[metric]);
  // Прошлый период выравниваем по номеру корзины: 1-й день к 1-му дню.
  const prev = prevTrend?.slice(-n).map((r) => r[metric]);
  const top = niceTop(Math.max(...values, ...(prev ?? []), 0), m.kind);
  const every = Math.ceil(n / 8);
  const h = hover !== null ? trend[hover] : null;

  return (
    <Card>
      <CardHead>
        <h2>Динамика {GRAIN_LABEL[grain]}</h2>
        <Tabs role="group" aria-label="Показатель">
          {METRICS.map((x) => (
            <button key={x.key} type="button" aria-pressed={x.key === metric} onClick={() => setMetric(x.key)}>
              {x.label}
            </button>
          ))}
        </Tabs>
      </CardHead>
      {prev && (
        <Legend>
          <span>
            <i style={{ background: 'rgb(var(--accent))' }} />
            Выбранный период
          </span>
          <span>
            <i style={{ background: 'rgba(var(--ink), 0.4)', height: '0.2rem' }} />
            Прошлый период
          </span>
        </Legend>
      )}
      <Chart>
        <YAxis>
          {[0, 1, 2, 3, 4].map((t) => (
            <span key={t} style={{ bottom: `${t * 25}%` }}>
              {fmt((top / 4) * t, m.kind, true)}
            </span>
          ))}
        </YAxis>
        <Plot onMouseLeave={() => setHover(null)}>
          {[1, 2, 3, 4].map((t) => (
            <hr key={t} style={{ bottom: `${t * 25}%` }} />
          ))}
          {values.map((v, i) => (
            <Col key={trend[i].key} $active={hover === i} onMouseEnter={() => setHover(i)} onClick={() => setHover(i)}>
              <span style={{ height: v ? `max(2px, ${(v / top) * 100}%)` : 0 }} />
            </Col>
          ))}
          {prev && prev.length > 1 && (
            <svg viewBox={`0 0 ${n} 100`} preserveAspectRatio="none" aria-hidden="true">
              <polyline
                points={prev.map((v, i) => `${i + 0.5},${100 - (v / top) * 100}`).join(' ')}
                fill="none"
                stroke="rgba(var(--ink), 0.4)"
                strokeWidth="2"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}
          {h && hover !== null && (
            <Tip
              style={
                hover < n / 2
                  ? { left: `calc(${((hover + 1) / n) * 100}% + 0.8rem)` }
                  : { right: `calc(${((n - hover) / n) * 100}% + 0.8rem)` }
              }
            >
              <b>{fmtBucket(h.key, grain, true)}</b>
              <div>
                {m.label} <span>{fmt(values[hover], m.kind)}</span>
              </div>
              {prev?.[hover] !== undefined && (
                <div>
                  <em>Прошлый период</em> <em>{fmt(prev[hover], m.kind)}</em>
                </div>
              )}
              <div>
                <em>Заказы · визиты</em>
                <em>
                  {h.orders} · {h.visits}
                </em>
              </div>
              {metric !== 'revenue' && (
                <div>
                  <em>Выручка</em> <em>{formatPrice(h.revenue)}</em>
                </div>
              )}
            </Tip>
          )}
        </Plot>
        <XAxis aria-hidden="true">
          {trend.map((r, i) => (
            <span key={r.key}>{i % every === 0 ? fmtBucket(r.key, grain) : ''}</span>
          ))}
        </XAxis>
      </Chart>
    </Card>
  );
}

function FunnelCard({ total }: { total: Agg }) {
  const steps: [string, number][] = [
    ['Визиты', total.visits],
    ['Добавили в корзину', total.adds],
    ['Оформили заказ', total.orders],
    ['Заказ выполнен', total.completed],
  ];
  const max = Math.max(total.visits, total.orders, 1);
  return (
    <Card>
      <h2>Воронка</h2>
      <Muted>Визиты и корзины — сессии браузера, без cookie. Процент — от предыдущего шага.</Muted>
      {steps.map(([label, v], i) => (
        <FunnelStep key={label}>
          <span>{label}</span>
          <b>{v.toLocaleString('ru-RU')}</b>
          <Track>
            <div style={{ width: `${(v / max) * 100}%` }} />
          </Track>
          {i > 0 && (
            <small>
              {pct(v, steps[i - 1][1])} от шага «{steps[i - 1][0]}»
              {steps[i - 1][1] > v && ` · ушли ${(steps[i - 1][1] - v).toLocaleString('ru-RU')}`}
            </small>
          )}
        </FunnelStep>
      ))}
    </Card>
  );
}

function HeatCard({ heat }: { heat: number[][] }) {
  const max = Math.max(...heat.flat());
  let peak = [0, 0];
  heat.forEach((row, d) => row.forEach((v, hr) => v > heat[peak[0]][peak[1]] && (peak = [d, hr])));
  const byDay = heat.map((r) => r.reduce((a, b) => a + b, 0));
  const bestDay = byDay.indexOf(Math.max(...byDay));
  return (
    <Card>
      <h2>Когда заказывают</h2>
      <Muted>
        {max
          ? `Пик: ${DAYS[peak[0]]}, ${peak[1]}:00–${peak[1] + 1}:00 · самый активный день — ${DAYS[bestDay]}. Время московское.`
          : 'Заказов за период нет.'}
      </Muted>
      <Heat role="img" aria-label="Заказы по дням недели и часам">
        <span />
        {Array.from({ length: 24 }, (_, hr) => (
          <span key={hr} style={{ textAlign: 'center' }}>
            {hr % 3 === 0 ? hr : ''}
          </span>
        ))}
        {heat.map((row, d) => [
          <span key={`d${d}`}>{DAYS[d]}</span>,
          ...row.map((v, hr) => (
            <i
              key={`${d}-${hr}`}
              title={`${DAYS[d]} ${hr}:00–${hr + 1}:00 — ${v} ${plural(v, 'заказ', 'заказа', 'заказов')}`}
              style={{ background: v ? `rgba(var(--accent), ${0.15 + 0.85 * (v / max)})` : 'rgba(var(--ink), 0.05)' }}
            />
          )),
        ])}
      </Heat>
      {max > 0 && (
        <Legend style={{ marginTop: '1rem', marginBottom: 0 }}>
          <span>
            меньше
            {[0.15, 0.43, 0.72, 1].map((a) => (
              <i key={a} style={{ background: `rgba(var(--accent), ${a})` }} />
            ))}
            больше
          </span>
        </Legend>
      )}
    </Card>
  );
}

function StatusCard({ rows, buyers }: { rows: StatusRow[]; buyers: Props['buyers'] }) {
  const total = rows.reduce((a, r) => a + r.count, 0);
  return (
    <Card>
      <h2>Статусы заказов</h2>
      {total ? (
        <Stack role="img" aria-label="Доли статусов">
          {rows.map((r) => (
            <i key={r.status} style={{ flex: r.count, background: STATUS_COLOR[r.status] ?? 'rgba(var(--ink), 0.3)' }} title={`${r.label}: ${r.count}`} />
          ))}
        </Stack>
      ) : (
        <Muted>Заказов за период нет.</Muted>
      )}
      <Legend style={{ flexDirection: 'column', gap: '0.6rem' }}>
        {rows.map((r) => (
          <span key={r.status} style={{ justifyContent: 'space-between' }}>
            <span>
              <i style={{ background: STATUS_COLOR[r.status] ?? 'rgba(var(--ink), 0.3)' }} />
              {r.label}
            </span>
            <span>
              {r.count} · {pct(r.count, total)} · {formatPrice(r.sum)}
            </span>
          </span>
        ))}
      </Legend>
      <Figures>
        <div>
          <dt>Покупателей</dt>
          <dd>{buyers.total}</dd>
        </div>
        <div>
          <dt>Новых</dt>
          <dd>{buyers.total - buyers.repeat}</dd>
        </div>
        <div>
          <dt>Вернулись</dt>
          <dd>
            {buyers.repeat} <small style={{ fontSize: '1.3rem', fontWeight: 400 }}>{pct(buyers.repeat, buyers.total)}</small>
          </dd>
        </div>
      </Figures>
      <Muted style={{ marginTop: '1rem', marginBottom: 0 }}>
        Покупатель — уникальный телефон в неотменённых заказах. «Вернулись» — заказывали раньше или больше одного раза за период.
      </Muted>
    </Card>
  );
}

function BarCell({ value, max, children }: { value: number; max: number; children: React.ReactNode }) {
  return (
    <td>
      {children}
      <BarTrack>
        <div style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
      </BarTrack>
    </td>
  );
}

function AggTable({ title, first, rows }: { title: string; first: string; rows: Row[] }) {
  const max = Math.max(...rows.map((r) => r.revenue), 0);
  return (
    <Card>
      <h2>{title}</h2>
      <Scroll>
        <Table>
          <thead>
            <tr>
              <th>{first}</th>
              <th>Заказы</th>
              <th>Выполнено</th>
              <th>Выручка</th>
              <th>Средний чек</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5}>Нет данных за период</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.key}>
                <td>{r.label}</td>
                <td>{r.orders}</td>
                <td>{r.completed}</td>
                <BarCell value={r.revenue} max={max}>
                  {formatPrice(r.revenue)}
                </BarCell>
                <td>{r.orders - r.cancelled ? formatPrice(Math.round(r.revenue / (r.orders - r.cancelled))) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Scroll>
    </Card>
  );
}

export default function AdminStats(p: Props) {
  const { base, session, preset, from, to, prevFrom, grain, trend, prevTrend, total, prevTotal, channelRows, itemRows } = p;
  const chMax = Math.max(...channelRows.map((r) => r.revenue), 0);
  const itMax = Math.max(...itemRows.map((r) => r.revenue), 0);
  const empty = !total.orders && !total.visits;

  return (
    <AdminPage>
      <Head>
        <title>Статистика</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminNav base={base} session={session} active="stats" title="Статистика" />

      <Filters>
        <Chips>
          {PRESETS.map((pv) => (
            <a key={pv} href={`?period=${pv}`} aria-current={preset === pv}>
              {PRESET_LABEL[pv]}
            </a>
          ))}
        </Chips>
        <Toolbar method="get" aria-label="Свой период">
          <Input type="date" name="from" defaultValue={from} max={to} required aria-label="С" />
          <Input type="date" name="to" defaultValue={to} required aria-label="По" />
          <Btn type="submit">Показать</Btn>
        </Toolbar>
        <Links>
          <a href={`${base}/api/metrika.csv?type=crm`}>CSV заказов для Метрики</a>
          <a href={`${base}/api/metrika.csv?type=offline`}>CSV офлайн-конверсий</a>
        </Links>
      </Filters>
      <Muted>
        {fmtDay(from, true)} — {fmtDay(to, true)}
        {prevFrom && ` · сравнение с ${fmtDay(prevFrom, true)} — ${fmtDay(addDays(from, -1), true)}`}
      </Muted>

      <KpiGrid>
        {KPIS.map((k) => (
          <KpiTile key={k.label} kpi={k} total={total} prevTotal={prevTotal} trend={trend} />
        ))}
      </KpiGrid>

      {empty && <Muted>За выбранный период нет ни визитов, ни заказов.</Muted>}

      <TrendChart trend={trend} prevTrend={prevTrend} grain={grain} />

      <Grid2>
        <FunnelCard total={total} />
        <HeatCard heat={p.heat} />
      </Grid2>

      <Grid2>
        <StatusCard rows={p.statusRows} buyers={p.buyers} />
        <AggTable title="Устройства" first="Устройство" rows={p.deviceRows} />
      </Grid2>

      <Card>
        <h2>Каналы</h2>
        <Muted>Канал — последний значимый переход: прямой заход его не затирает, метки держатся 90 дней.</Muted>
        <Scroll>
          <Table>
            <thead>
              <tr>
                <th>Канал</th>
                <th>Визиты</th>
                <th>В корзину</th>
                <th>Заказы</th>
                <th>Конверсия</th>
                <th>Выручка</th>
                <th>Выполнено на сумму</th>
              </tr>
            </thead>
            <tbody>
              {channelRows.length === 0 && (
                <tr>
                  <td colSpan={7}>Нет данных за период</td>
                </tr>
              )}
              {channelRows.map((r) => (
                <tr key={r.key}>
                  <td>{r.label}</td>
                  <td>{r.visits}</td>
                  <td>{r.adds}</td>
                  <td>{r.orders}</td>
                  <td>{pct(r.orders, r.visits)}</td>
                  <BarCell value={r.revenue} max={chMax}>
                    {formatPrice(r.revenue)}
                  </BarCell>
                  <td>{formatPrice(r.doneRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Scroll>
      </Card>

      <Card>
        <h2>Товары</h2>
        <Muted>Просмотры и корзины — сессии; заказы и выручка — без отменённых.</Muted>
        <Scroll>
          <Table>
            <thead>
              <tr>
                <th>Товар</th>
                <th>Просмотры</th>
                <th>В корзину</th>
                <th>Заказы</th>
                <th>Штук</th>
                <th>Выручка</th>
                <th>Корзина → заказ</th>
              </tr>
            </thead>
            <tbody>
              {itemRows.length === 0 && (
                <tr>
                  <td colSpan={7}>Нет данных за период</td>
                </tr>
              )}
              {itemRows.map((r) => (
                <tr key={r.title}>
                  <td>{r.title}</td>
                  <td>{r.views}</td>
                  <td>{r.adds}</td>
                  <td>{r.orders}</td>
                  <td>{r.quantity}</td>
                  <BarCell value={r.revenue} max={itMax}>
                    {formatPrice(r.revenue)}
                  </BarCell>
                  <td>{pct(r.orders, r.adds)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Scroll>
      </Card>

      <AggTable title="Источники" first="utm_source / medium / campaign или сайт" rows={p.sourceRows} />
    </AdminPage>
  );
}
