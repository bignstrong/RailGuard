import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { AdminHeader, AdminPage, Btn, fmtDate, Input, Select, Status, Table, Toolbar } from 'components/AdminUi';
import { adminBase, isAdminRequest } from 'lib/adminAuth';
import { ORDER_STATUSES, OrderStatus, STATUS_LABEL } from 'lib/adminShared';
import { formatPrice } from 'lib/catalog';
import prisma from 'lib/prisma';

type Row = { id: string; createdAt: string; status: string; totalPrice: number; phone: string; email: string; preferredContact: string; itemsCount: number };
type Props = { base: string; orders: Row[]; q: string; status: string; subscribers: number; counts: Record<string, number> };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const base = adminBase();
  if (!(await isAdminRequest(ctx))) return { redirect: { destination: `${base}/login`, permanent: false } };
  const q = String(ctx.query.q || '').trim().slice(0, 100);
  const status = String(ctx.query.status || '');
  const where = {
    ...(ORDER_STATUSES.includes(status as OrderStatus) ? { status } : {}),
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
  const [orders, subscribers, grouped] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 }),
    prisma.subscriber.count(),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);
  return {
    props: {
      base,
      q,
      status,
      subscribers,
      counts: Object.fromEntries(grouped.map((g) => [g.status, g._count._all])),
      orders: orders.map((o) => {
        const c = (o.contact ?? {}) as Record<string, string>;
        const items = (o.items ?? []) as { quantity: number }[];
        return {
          id: o.id,
          createdAt: o.createdAt.toISOString(),
          status: o.status,
          totalPrice: o.totalPrice,
          phone: c.phone ?? '',
          email: c.email ?? '',
          preferredContact: c.preferredContact ?? '',
          itemsCount: items.reduce((s, i) => s + (i.quantity || 0), 0),
        };
      }),
    },
  };
};

export default function AdminOrders({ base, orders, q, status, subscribers, counts }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(orders);

  async function setStatus(id: string, next: string) {
    const res = await fetch(`${base}/api/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) });
    if (!res.ok) return alert('Не удалось изменить статус');
    setRows((r) => r.map((o) => (o.id === id ? { ...o, status: next } : o)));
  }
  async function logout() {
    await fetch(`${base}/api/logout`, { method: 'POST' });
    router.replace(`${base}/login`);
  }

  return (
    <AdminPage>
      <Head>
        <title>Заказы</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminHeader>
        <h1>Заказы</h1>
        <nav>
          <span>Подписчиков: {subscribers}</span>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href={`${base}/api/subscribers.csv`}>CSV подписчиков</a>
          <Btn type="button" onClick={logout}>
            Выйти
          </Btn>
        </nav>
      </AdminHeader>
      <Toolbar method="get">
        <Input name="q" defaultValue={q} placeholder="Поиск: телефон, email, номер заказа" />
        <Select name="status" defaultValue={status}>
          <option value="">Все статусы</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]} ({counts[s] ?? 0})
            </option>
          ))}
        </Select>
        <Btn type="submit">Найти</Btn>
      </Toolbar>
      <Table>
        <thead>
          <tr>
            <th>Дата</th>
            <th>Заказ</th>
            <th>Контакт</th>
            <th>Товаров</th>
            <th>Сумма</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={6}>Ничего не найдено</td>
            </tr>
          )}
          {rows.map((o) => (
            <tr key={o.id}>
              <td>{fmtDate(o.createdAt)}</td>
              <td>
                <NextLink href={`${base}/orders/${o.id}`}>…{o.id.slice(-6)}</NextLink>
              </td>
              <td>
                +7{o.phone}
                <br />
                {o.email}
                <br />
                <small>{o.preferredContact}</small>
              </td>
              <td>{o.itemsCount}</td>
              <td>{formatPrice(o.totalPrice)}</td>
              <td>
                <Status $s={o.status}>{STATUS_LABEL[o.status as OrderStatus] ?? o.status}</Status>{' '}
                <Select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}>
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </Select>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </AdminPage>
  );
}
