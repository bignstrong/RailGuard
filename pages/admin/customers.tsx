import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import NextLink from 'next/link';
import styled from 'styled-components';
import { AdminNav, AdminPage, Btn, fmtDate, fmtPhone, Input, Pill, Table } from 'components/AdminUi';
import { adminBase, getAdminSession } from 'lib/adminAuth';
import type { AdminSession } from 'lib/adminSession';
import { formatPrice } from 'lib/catalog';
import prisma from 'lib/prisma';

type Row = { id: string; phone: string; email: string; orders: number; revenue: number; first: string; last: string };
type Props = { base: string; session: AdminSession; rows: Row[]; q: string; total: number; repeat: number };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const base = adminBase();
  const session = await getAdminSession(ctx);
  if (!session) return { redirect: { destination: `${base}/login`, permanent: false } };
  const q = String(ctx.query.q || '').trim().slice(0, 100);
  const digits = q.replace(/\D/g, '');
  const where = q ? { OR: [...(digits ? [{ phone: { contains: digits } }] : []), { email: { contains: q.toLowerCase() } }] } : {};
  // ponytail: покупатели с заказами грузятся целиком (до 500); при тысячах — агрегаты в SQL и пагинация.
  const [customers, total, repeatGroups] = await Promise.all([
    prisma.customer.findMany({ where, take: 500, include: { orders: { select: { totalPrice: true, status: true, createdAt: true } } } }),
    prisma.customer.count(),
    prisma.order.groupBy({ by: ['customerId'], where: { customerId: { not: null } }, having: { customerId: { _count: { gt: 1 } } } }),
  ]);
  const rows = customers
    .map((c) => {
      const dates = c.orders.map((o) => o.createdAt.getTime());
      return {
        id: c.id,
        phone: c.phone,
        email: c.email,
        orders: c.orders.length,
        revenue: c.orders.reduce((s, o) => s + (o.status === 'cancelled' ? 0 : o.totalPrice), 0),
        first: new Date(Math.min(...dates, c.createdAt.getTime())).toISOString(),
        last: new Date(Math.max(...dates, c.createdAt.getTime())).toISOString(),
      };
    })
    .sort((a, b) => b.last.localeCompare(a.last));
  return { props: { base, session, rows, q, total, repeat: repeatGroups.length } };
};

const Summary = styled.p`
  margin: 0 0 1.6rem;
  color: rgba(var(--ink), 0.7);

  b {
    color: rgb(var(--ink));
  }
`;

const Search = styled.form`
  display: flex;
  gap: 0.6rem;
  max-width: 48rem;
  margin-bottom: 1.6rem;

  input {
    flex: 1;
    min-width: 0;
  }
`;

const Scroll = styled.div`
  overflow-x: auto;

  td,
  th {
    white-space: nowrap;
  }
  td small {
    display: block;
    color: rgba(var(--ink), 0.6);
  }
`;

export default function AdminCustomers({ base, session, rows, q, total, repeat }: Props) {
  return (
    <AdminPage>
      <Head>
        <title>Покупатели</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminNav base={base} session={session} active="customers" title="Покупатели" />
      <Summary>
        Всего <b>{total}</b> · вернулись за повторной покупкой <b>{repeat}</b>. Покупатель — это пара «телефон + email»: заказы объединяются, только если совпало и то, и другое.
      </Summary>
      <Search method="get">
        <Input name="q" defaultValue={q} placeholder="Телефон или email" aria-label="Поиск покупателя" />
        <Btn type="submit">Найти</Btn>
      </Search>
      <Scroll>
        <Table>
          <thead>
            <tr>
              <th>Покупатель</th>
              <th>Заказов</th>
              <th>Сумма</th>
              <th>Первый заказ</th>
              <th>Последний</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5}>{q ? 'Никого не нашли' : 'Покупателей пока нет'}</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <NextLink href={`${base || '/'}?customer=${r.id}`}>{fmtPhone(r.phone)}</NextLink>
                  {r.orders > 1 && <Pill>постоянный</Pill>}
                  <small>{r.email}</small>
                </td>
                <td>{r.orders}</td>
                <td>{formatPrice(r.revenue)}</td>
                <td>{fmtDate(r.first)}</td>
                <td>{fmtDate(r.last)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Scroll>
    </AdminPage>
  );
}
