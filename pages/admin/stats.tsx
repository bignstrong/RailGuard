import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import styled from 'styled-components';
import { AdminNav, AdminPage, Btn, Card, Select, Table, Toolbar } from 'components/AdminUi';
import { adminBase, getAdminSession } from 'lib/adminAuth';
import type { AdminSession } from 'lib/adminSession';
import { ORDER_STATUSES, OrderStatus, STATUS_LABEL } from 'lib/adminShared';
import { Channel, CHANNEL_LABEL, CHANNELS, Touch } from 'lib/attribution';
import { CATALOG, formatPrice, isProductId } from 'lib/catalog';
import prisma from 'lib/prisma';

const PERIODS = ['7', '30', '90', '365', 'all'] as const;
type Period = (typeof PERIODS)[number];
const PERIOD_LABEL: Record<Period, string> = { '7': '7 дней', '30': '30 дней', '90': '90 дней', '365': '365 дней', all: 'Всё время' };
type Grain = 'day' | 'week' | 'month';
const GRAIN_LABEL: Record<Grain, string> = { day: 'По дням', week: 'По неделям (с понедельника)', month: 'По месяцам' };

type CartItem = { id: string; title: string; price: number; quantity: number };
type StatusRow = { status: string; label: string; count: number; sum: number };
// Строка отчёта по заказам: всего, выполнено, выручка без отменённых, выручка выполненных.
type Agg = { orders: number; completed: number; revenue: number; doneRevenue: number };
type ChannelRow = Agg & { key: string; label: string; visits: number; adds: number };
type NamedRow = Agg & { label: string };
type ItemRow = { title: string; views: number; adds: number; orders: number; quantity: number; revenue: number };
type TrendRow = Agg & { label: string; visits: number };
type Funnel = { visits: number; adds: number; orders: number; completed: number };
type Kpis = { orders: number; revenue: number; doneRevenue: number; avgCheck: number; cancelled: number; pending: number };
type Props = {
  base: string;
  session: AdminSession;
  period: Period;
  grain: Grain;
  kpis: Kpis;
  funnel: Funnel;
  statusRows: StatusRow[];
  channelRows: ChannelRow[];
  sourceRows: NamedRow[];
  deviceRows: NamedRow[];
  itemRows: ItemRow[];
  trendRows: TrendRow[];
};

const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' });
const dayKey = (d: Date) => dayFmt.format(d);
const weekKey = (day: string) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};
const bucketOf = (day: string, grain: Grain) => (grain === 'day' ? day : grain === 'week' ? weekKey(day) : day.slice(0, 7));

const emptyAgg = (): Agg => ({ orders: 0, completed: 0, revenue: 0, doneRevenue: 0 });
function addOrder(a: Agg, o: { status: string; totalPrice: number }) {
  a.orders += 1;
  if (o.status !== 'cancelled') a.revenue += o.totalPrice;
  if (o.status === 'completed') {
    a.completed += 1;
    a.doneRevenue += o.totalPrice;
  }
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const base = adminBase();
  const session = await getAdminSession(ctx);
  if (!session) return { redirect: { destination: `${base}/login`, permanent: false } };

  const period = (PERIODS.includes(ctx.query.period as Period) ? ctx.query.period : '30') as Period;
  const periodDays = period === 'all' ? null : Number(period);
  const grain: Grain = period === '7' || period === '30' ? 'day' : period === '90' ? 'week' : 'month';
  const now = new Date();
  const fromDay = periodDays ? dayKey(new Date(now.getTime() - (periodDays - 1) * 86400000)) : null;

  // ponytail: заказы и счётчики за период грузятся целиком и считаются в памяти; при десятках тысяч заказов — SQL GROUP BY.
  const [orders, stats] = await Promise.all([
    prisma.order.findMany({
      where: fromDay ? { createdAt: { gte: new Date(`${fromDay}T00:00:00+03:00`) } } : {},
      select: { createdAt: true, totalPrice: true, status: true, channel: true, device: true, attribution: true, items: true },
    }),
    prisma.dailyStat.findMany({ where: fromDay ? { day: { gte: fromDay } } : {} }),
  ]);

  const statusMap = new Map<string, StatusRow>();
  const channelMap = new Map<string, ChannelRow>();
  const sourceMap = new Map<string, NamedRow>();
  const deviceMap = new Map<string, NamedRow>();
  const itemMap = new Map<string, ItemRow>();
  const trendMap = new Map<string, TrendRow>();
  const funnel: Funnel = { visits: 0, adds: 0, orders: 0, completed: 0 };

  const channelRow = (key: string) => {
    let row = channelMap.get(key);
    if (!row) channelMap.set(key, (row = { key, label: CHANNEL_LABEL[key as Channel] ?? 'Нет данных (заказы до учёта источников)', visits: 0, adds: 0, ...emptyAgg() }));
    return row;
  };
  const named = (map: Map<string, NamedRow>, label: string) => {
    let row = map.get(label);
    if (!row) map.set(label, (row = { label, ...emptyAgg() }));
    return row;
  };
  const itemRow = (id: string, title?: string) => {
    let row = itemMap.get(id);
    if (!row) itemMap.set(id, (row = { title: isProductId(id) ? CATALOG[id].title : title ?? id, views: 0, adds: 0, orders: 0, quantity: 0, revenue: 0 }));
    return row;
  };
  const trendRow = (label: string) => {
    let row = trendMap.get(label);
    if (!row) trendMap.set(label, (row = { label, visits: 0, ...emptyAgg() }));
    return row;
  };
  CHANNELS.forEach(channelRow);

  for (const s of stats) {
    if (s.event === 'visit') {
      funnel.visits += s.count;
      channelRow(s.channel).visits += s.count;
      trendRow(bucketOf(s.day, grain)).visits += s.count;
    } else if (s.event === 'add' && !s.product) {
      funnel.adds += s.count;
      channelRow(s.channel).adds += s.count;
    } else if (s.event === 'add') itemRow(s.product).adds += s.count;
    else if (s.event === 'view') itemRow(s.product).views += s.count;
  }

  for (const o of orders) {
    const st = statusMap.get(o.status) ?? { status: o.status, label: STATUS_LABEL[o.status as OrderStatus] ?? o.status, count: 0, sum: 0 };
    st.count += 1;
    st.sum += o.totalPrice;
    statusMap.set(o.status, st);

    funnel.orders += 1;
    if (o.status === 'completed') funnel.completed += 1;
    addOrder(channelRow(o.channel ?? 'unknown'), o);
    addOrder(trendRow(bucketOf(dayKey(o.createdAt), grain)), o);
    addOrder(named(deviceMap, o.device ?? 'нет данных'), o);
    const lt = (o.attribution as { lt?: Touch | null } | null)?.lt;
    addOrder(named(sourceMap, lt ? [lt.source, lt.medium, lt.campaign].filter(Boolean).join(' / ') : 'нет данных'), o);

    if (o.status === 'cancelled') continue;
    for (const it of (o.items ?? []) as CartItem[]) {
      const row = itemRow(it.id, it.title);
      row.orders += 1;
      row.quantity += it.quantity;
      row.revenue += it.price * it.quantity;
    }
  }

  const cancelled = statusMap.get('cancelled')?.count ?? 0;
  const revenue = orders.reduce((s, o) => s + (o.status === 'cancelled' ? 0 : o.totalPrice), 0);
  const kpis: Kpis = {
    orders: orders.length,
    revenue,
    doneRevenue: orders.reduce((s, o) => s + (o.status === 'completed' ? o.totalPrice : 0), 0),
    avgCheck: orders.length - cancelled ? revenue / (orders.length - cancelled) : 0,
    cancelled,
    pending: statusMap.get('pending')?.count ?? 0,
  };

  // Пустые дни/недели/месяцы тоже показываем; для «всего времени» — с первого заказа или визита.
  const today = dayKey(now);
  const firstDay = fromDay ?? [...orders.map((o) => dayKey(o.createdAt)), ...stats.map((s) => s.day)].sort()[0] ?? today;
  const trendRows: TrendRow[] = [];
  for (let d = new Date(`${firstDay}T12:00:00Z`); d.toISOString().slice(0, 10) <= today; d.setUTCDate(d.getUTCDate() + 1)) {
    const label = bucketOf(d.toISOString().slice(0, 10), grain);
    if (trendRows.at(-1)?.label !== label) trendRows.push(trendMap.get(label) ?? { label, visits: 0, ...emptyAgg() });
  }

  const byRevenue = <T extends { revenue: number; orders: number }>(a: T, b: T) => b.revenue - a.revenue || b.orders - a.orders;
  return {
    props: {
      base,
      session,
      period,
      grain,
      kpis,
      funnel,
      statusRows: [...statusMap.values()].sort((a, b) => ORDER_STATUSES.indexOf(a.status as OrderStatus) - ORDER_STATUSES.indexOf(b.status as OrderStatus)),
      channelRows: [...channelMap.values()].filter((r) => r.visits || r.orders).sort((a, b) => byRevenue(a, b) || b.visits - a.visits),
      sourceRows: [...sourceMap.values()].sort(byRevenue),
      deviceRows: [...deviceMap.values()].sort(byRevenue),
      itemRows: [...itemMap.values()].sort((a, b) => byRevenue(a, b) || b.adds - a.adds),
      trendRows: trendRows.reverse(),
    },
  };
};

const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : '—');

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: 1.6rem;
  margin-bottom: 2rem;
`;

const BarTrack = styled.div`
  background: rgba(var(--ink), 0.08);
  border-radius: 0.3rem;
  margin-top: 0.4rem;
  width: 12rem;
`;

const Bar = styled.div<{ $pct: number }>`
  height: 0.6rem;
  border-radius: 0.3rem;
  background: rgb(var(--accent));
  width: ${(p) => p.$pct}%;
`;

const Hint = styled.p`
  opacity: 0.7;
  font-size: 1.3rem;
  margin: 0 0 1.2rem;
`;

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p style={{ opacity: 0.7, margin: '0 0 0.6rem' }}>{label}</p>
      <h2 style={{ margin: 0 }}>{value}</h2>
    </Card>
  );
}

function AggTable({ title, first, rows }: { title: string; first: string; rows: NamedRow[] }) {
  return (
    <Card>
      <h2>{title}</h2>
      <Table>
        <thead>
          <tr>
            <th>{first}</th>
            <th>Заказов</th>
            <th>Выполнено</th>
            <th>Выручка</th>
            <th>Выручка выполненных</th>
            <th>Средний чек</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={6}>Нет данных за период</td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.label}>
              <td>{r.label}</td>
              <td>{r.orders}</td>
              <td>{r.completed}</td>
              <td>{formatPrice(r.revenue)}</td>
              <td>{formatPrice(r.doneRevenue)}</td>
              <td>{r.orders ? formatPrice(Math.round(r.revenue / r.orders)) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}

export default function AdminStats({ base, session, period, grain, kpis, funnel, statusRows, channelRows, sourceRows, deviceRows, itemRows, trendRows }: Props) {
  const [p, setP] = useState(period);
  const maxTrendRevenue = Math.max(...trendRows.map((r) => r.revenue), 1);
  const steps: [string, number, number | null][] = [
    ['Визиты', funnel.visits, null],
    ['Добавили в корзину', funnel.adds, funnel.visits],
    ['Оформили заказ', funnel.orders, funnel.adds],
    ['Заказ выполнен', funnel.completed, funnel.orders],
  ];

  return (
    <AdminPage>
      <Head>
        <title>Статистика</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminNav base={base} session={session} active="stats" title="Статистика" />
      <Toolbar method="get">
        <Select name="period" value={p} onChange={(e) => setP(e.target.value as Period)}>
          {PERIODS.map((pv) => (
            <option key={pv} value={pv}>
              {PERIOD_LABEL[pv]}
            </option>
          ))}
        </Select>
        <Btn type="submit">Показать</Btn>
        <a href={`${base}/api/metrika.csv?type=crm`}>CSV заказов для Метрики (CRM)</a>
        <a href={`${base}/api/metrika.csv?type=offline`}>CSV офлайн-конверсий</a>
      </Toolbar>

      <KpiGrid>
        <Kpi label="Заказов" value={String(kpis.orders)} />
        <Kpi label="Выручка (без отменённых)" value={formatPrice(kpis.revenue)} />
        <Kpi label="Выручка выполненных" value={formatPrice(kpis.doneRevenue)} />
        <Kpi label="Средний чек" value={formatPrice(Math.round(kpis.avgCheck))} />
        <Kpi label="Конверсия визит → заказ" value={pct(funnel.orders, funnel.visits)} />
        <Kpi label="Отменено" value={String(kpis.cancelled)} />
        <Kpi label="Новых" value={String(kpis.pending)} />
      </KpiGrid>

      <Card>
        <h2>Воронка</h2>
        <Hint>Визиты и корзины — сессии браузера, считаются без cookie с 24.09.2026. Процент — от предыдущего шага.</Hint>
        <Table>
          <tbody>
            {steps.map(([label, value, prev]) => (
              <tr key={label}>
                <td>{label}</td>
                <td>{value}</td>
                <td>{prev === null ? '' : pct(value, prev)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card>
        <h2>Каналы</h2>
        <Hint>Канал — последний значимый переход: прямой заход его не затирает, метки держатся 90 дней.</Hint>
        <Table>
          <thead>
            <tr>
              <th>Канал</th>
              <th>Визиты</th>
              <th>В корзину</th>
              <th>Заказов</th>
              <th>Выполнено</th>
              <th>Выручка</th>
              <th>Выручка выполненных</th>
              <th>Конверсия</th>
            </tr>
          </thead>
          <tbody>
            {channelRows.map((r) => (
              <tr key={r.key}>
                <td>{r.label}</td>
                <td>{r.visits}</td>
                <td>{r.adds}</td>
                <td>{r.orders}</td>
                <td>{r.completed}</td>
                <td>{formatPrice(r.revenue)}</td>
                <td>{formatPrice(r.doneRevenue)}</td>
                <td>{pct(r.orders, r.visits)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <AggTable title="Источники (utm_source / utm_medium / utm_campaign или сайт)" first="Источник" rows={sourceRows} />

      <Card>
        <h2>Товары</h2>
        <Hint>Просмотры и корзины — сессии; заказы и выручка — без отменённых.</Hint>
        <Table>
          <thead>
            <tr>
              <th>Товар</th>
              <th>Просмотры</th>
              <th>В корзину</th>
              <th>Заказов</th>
              <th>Кол-во</th>
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
                <td>{formatPrice(r.revenue)}</td>
                <td>{pct(r.orders, r.adds)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card>
        <h2>{GRAIN_LABEL[grain]}</h2>
        <Table>
          <thead>
            <tr>
              <th>Период</th>
              <th>Визиты</th>
              <th>Заказов</th>
              <th>Выполнено</th>
              <th>Выручка</th>
            </tr>
          </thead>
          <tbody>
            {trendRows.map((r) => (
              <tr key={r.label}>
                <td>{r.label}</td>
                <td>{r.visits}</td>
                <td>{r.orders}</td>
                <td>{r.completed}</td>
                <td>
                  {formatPrice(r.revenue)}
                  <BarTrack>
                    <Bar $pct={(r.revenue / maxTrendRevenue) * 100} />
                  </BarTrack>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <AggTable title="Устройства" first="Устройство" rows={deviceRows} />

      <Card>
        <h2>По статусам</h2>
        <Table>
          <thead>
            <tr>
              <th>Статус</th>
              <th>Заказов</th>
              <th>Сумма</th>
            </tr>
          </thead>
          <tbody>
            {statusRows.map((r) => (
              <tr key={r.status}>
                <td>{r.label}</td>
                <td>{r.count}</td>
                <td>{formatPrice(r.sum)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </AdminPage>
  );
}
