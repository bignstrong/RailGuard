import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { AdminHeader, AdminPage, Btn, Card, fmtDate, Select, Status, Table } from 'components/AdminUi';
import { adminBase, isAdminRequest } from 'lib/adminAuth';
import { ORDER_STATUSES, OrderStatus, STATUS_LABEL } from 'lib/adminShared';
import { formatPrice } from 'lib/catalog';
import prisma from 'lib/prisma';

type Item = { id: string; title: string; price: number; quantity: number };
type Props = {
  base: string;
  order: { id: string; createdAt: string; updatedAt: string; status: string; totalPrice: number; items: Item[]; contact: Record<string, string> };
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const base = adminBase();
  if (!(await isAdminRequest(ctx))) return { redirect: { destination: `${base}/login`, permanent: false } };
  const o = await prisma.order.findUnique({ where: { id: String(ctx.params?.id) } });
  if (!o) return { notFound: true };
  return {
    props: {
      base,
      order: {
        id: o.id,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        status: o.status,
        totalPrice: o.totalPrice,
        items: (o.items ?? []) as Item[],
        contact: (o.contact ?? {}) as Record<string, string>,
      },
    },
  };
};

export default function AdminOrder({ base, order }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const c = order.contact;

  async function changeStatus(next: string) {
    const res = await fetch(`${base}/api/orders/${order.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) });
    if (!res.ok) return alert('Не удалось изменить статус');
    setStatus(next);
  }
  async function remove() {
    if (!window.confirm('Удалить заказ безвозвратно? Персональные данные клиента будут стёрты.')) return;
    const res = await fetch(`${base}/api/orders/${order.id}`, { method: 'DELETE' });
    if (!res.ok) return alert('Не удалось удалить');
    router.replace(base);
  }

  return (
    <AdminPage>
      <Head>
        <title>Заказ {order.id.slice(-6)}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminHeader>
        <h1>Заказ …{order.id.slice(-6)}</h1>
        <nav>
          <NextLink href={base}>← Все заказы</NextLink>
        </nav>
      </AdminHeader>
      <Card>
        <h2>
          <Status $s={status}>{STATUS_LABEL[status as OrderStatus] ?? status}</Status>{' '}
          <Select value={status} onChange={(e) => changeStatus(e.target.value)}>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </h2>
        <dl>
          <dt>ID</dt>
          <dd>{order.id}</dd>
          <dt>Создан</dt>
          <dd>{fmtDate(order.createdAt)}</dd>
          <dt>Обновлён</dt>
          <dd>{fmtDate(order.updatedAt)}</dd>
          <dt>Телефон</dt>
          <dd>
            <a href={`tel:+7${c.phone}`}>+7{c.phone}</a>
          </dd>
          <dt>Email</dt>
          <dd>
            <a href={`mailto:${c.email}`}>{c.email}</a>
          </dd>
          <dt>Как связаться</dt>
          <dd>{c.preferredContact}</dd>
          <dt>Согласие на ПДн</dt>
          <dd>{c.consentAt ? fmtDate(c.consentAt) : 'нет отметки'}</dd>
        </dl>
      </Card>
      <Card>
        <h2>Товары</h2>
        <Table>
          <thead>
            <tr>
              <th>Товар</th>
              <th>Цена</th>
              <th>Кол-во</th>
              <th>Сумма</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i, n) => (
              <tr key={n}>
                <td>{i.title}</td>
                <td>{formatPrice(i.price)}</td>
                <td>{i.quantity}</td>
                <td>{formatPrice(i.price * i.quantity)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={3}>
                <b>Итого</b>
              </td>
              <td>
                <b>{formatPrice(order.totalPrice)}</b>
              </td>
            </tr>
          </tbody>
        </Table>
      </Card>
      <Btn type="button" $danger onClick={remove}>
        Удалить заказ
      </Btn>
    </AdminPage>
  );
}
