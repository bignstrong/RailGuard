import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import styled from 'styled-components';
import { AdminNav, AdminPage, Btn, Card, Select, Table, Toolbar } from 'components/AdminUi';
import { adminBase, getAdminSession } from 'lib/adminAuth';
import type { AdminSession } from 'lib/adminSession';
import { ORDER_STATUSES, OrderStatus, STATUS_LABEL } from 'lib/adminShared';
import { CATALOG, formatPrice, isProductId } from 'lib/catalog';
import prisma from 'lib/prisma';

const PERIODS = ['7', '30', '90', '365', 'all'] as const;
type Period = (typeof PERIODS)[number];
const PERIOD_LABEL: Record<Period, string> = { '7': '7 дней', '30': '30 дней', '90': '90 дней', '365': '365 дней', all: 'Всё время' };

type CartItem = { id: string; title: string; price: number; quantity: number };
type StatusRow = { status: string; label: string; count: number; sum: number };
type ItemRow = { title: string; quantity: number; revenue: number };
type TrendRow = { label: string; count: number; revenue: number };
type Kpis = { orders: number; revenue: number; avgCheck: number; cancelled: number; pending: number };
type Props = { base: string; session: AdminSession; period: Period; isDaily: boolean; kpis: Kpis; statusRows: StatusRow[]; itemRows: ItemRow[]; trendRows: TrendRow[] };

const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' });
const dayKey = (d: Date) => dayFmt.format(d);
const monthKey = (d: Date) => dayKey(d).slice(0, 7);

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const base = adminBase();
  const session = await getAdminSession(ctx);
  if (!session) return { redirect: { destination: `${base}/login`, permanent: false } };

  const period = (PERIODS.includes(ctx.query.period as Period) ? ctx.query.period : '30') as Period;
  const periodDays = period === 'all' ? null : Number(period);
  const now = new Date();
  const periodWhere = periodDays ? { createdAt: { gte: new Date(now.getTime() - periodDays * 86400000) } } : {};
  const isDaily = period === '7' || period === '30';

  const trendDays = isDaily ? (periodDays as number) : 380;
  const trendStart = new Date(now.getTime() - trendDays * 86400000);

  const [grouped, itemOrders, trendOrders] = await Promise.all([
    prisma.order.groupBy({ by: ['status'], where: periodWhere, _count: { _all: true }, _sum: { totalPrice: true } }),
    prisma.order.findMany({ where: { ...periodWhere, status: { not: 'cancelled' } }, select: { items: true } }),
    prisma.order.findMany({ where: { createdAt: { gte: trendStart } }, select: { createdAt: true, totalPrice: true, status: true } }),
  ]);

  const ordersTotal = grouped.reduce((s, g) => s + g._count._all, 0);
  const revenue = grouped.filter((g) => g.status !== 'cancelled').reduce((s, g) => s + (g._sum.totalPrice ?? 0), 0);
  const cancelled = grouped.find((g) => g.status === 'cancelled')?._count._all ?? 0;
  const pending = grouped.find((g) => g.status === 'pending')?._count._all ?? 0;
  const nonCancelled = ordersTotal - cancelled;
  const kpis: Kpis = { orders: ordersTotal, revenue, avgCheck: nonCancelled ? revenue / nonCancelled : 0, cancelled, pending };

  const statusRows: StatusRow[] = grouped
    .map((g) => ({ status: g.status, label: STATUS_LABEL[g.status as OrderStatus] ?? g.status, count: g._count._all, sum: g._sum.totalPrice ?? 0 }))
    .sort((a, b) => ORDER_STATUSES.indexOf(a.status as OrderStatus) - ORDER_STATUSES.indexOf(b.status as OrderStatus));

  const itemMap = new Map<string, ItemRow>();
  for (const o of itemOrders) {
    for (const it of (o.items ?? []) as CartItem[]) {
      const key = it.id || it.title;
      const title = isProductId(it.id) ? CATALOG[it.id].title : it.title;
      const row = itemMap.get(key) ?? { title, quantity: 0, revenue: 0 };
      row.quantity += it.quantity;
      row.revenue += it.price * it.quantity;
      itemMap.set(key, row);
    }
  }
  const itemRows = [...itemMap.values()].sort((a, b) => b.revenue - a.revenue);

  const labels: string[] = [];
  if (isDaily) {
    for (let i = trendDays - 1; i >= 0; i--) labels.push(dayKey(new Date(now.getTime() - i * 86400000)));
  } else {
    const [y, m] = monthKey(now).split('-').map(Number);
    for (let i = 11; i >= 0; i--) {
      let yy = y;
      let mm = m - i;
      while (mm <= 0) {
        mm += 12;
        yy -= 1;
      }
      labels.push(`${yy}-${String(mm).padStart(2, '0')}`);
    }
  }
  const trendMap = new Map<string, { count: number; revenue: number }>();
  for (const o of trendOrders) {
    const key = isDaily ? dayKey(o.createdAt) : monthKey(o.createdAt);
    const row = trendMap.get(key) ?? { count: 0, revenue: 0 };
    row.count += 1;
    if (o.status !== 'cancelled') row.revenue += o.totalPrice;
    trendMap.set(key, row);
  }
  const trendRows: TrendRow[] = labels.map((label) => ({ label, ...(trendMap.get(label) ?? { count: 0, revenue: 0 }) }));

  return { props: { base, session, period, isDaily, kpis, statusRows, itemRows, trendRows } };
};

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

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p style={{ opacity: 0.7, margin: '0 0 0.6rem' }}>{label}</p>
      <h2 style={{ margin: 0 }}>{value}</h2>
    </Card>
  );
}

export default function AdminStats({ base, session, period, isDaily, kpis, statusRows, itemRows, trendRows }: Props) {
  const [p, setP] = useState(period);
  const maxTrendRevenue = Math.max(...trendRows.map((r) => r.revenue), 1);

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
      </Toolbar>

      <KpiGrid>
        <Kpi label="Заказов" value={String(kpis.orders)} />
        <Kpi label="Выручка" value={formatPrice(kpis.revenue)} />
        <Kpi label="Средний чек" value={formatPrice(Math.round(kpis.avgCheck))} />
        <Kpi label="Отменено" value={String(kpis.cancelled)} />
        <Kpi label="Новых" value={String(kpis.pending)} />
      </KpiGrid>

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

      <Card>
        <h2>Товары</h2>
        <Table>
          <thead>
            <tr>
              <th>Товар</th>
              <th>Кол-во</th>
              <th>Выручка</th>
            </tr>
          </thead>
          <tbody>
            {itemRows.length === 0 && (
              <tr>
                <td colSpan={3}>Нет данных за период</td>
              </tr>
            )}
            {itemRows.map((r) => (
              <tr key={r.title}>
                <td>{r.title}</td>
                <td>{r.quantity}</td>
                <td>{formatPrice(r.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card>
        <h2>{isDaily ? 'По дням' : 'По месяцам'}</h2>
        <Table>
          <thead>
            <tr>
              <th>Период</th>
              <th>Заказов</th>
              <th>Выручка</th>
            </tr>
          </thead>
          <tbody>
            {trendRows.map((r) => (
              <tr key={r.label}>
                <td>{r.label}</td>
                <td>{r.count}</td>
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
    </AdminPage>
  );
}
