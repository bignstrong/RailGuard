import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { AdminNav, AdminPage, Btn, Card, fmtDate, Input, Select, Status, Table } from 'components/AdminUi';
import { adminBase, getAdminSession } from 'lib/adminAuth';
import type { AdminSession } from 'lib/adminSession';
import { ORDER_STATUSES, OrderStatus, STATUS_LABEL } from 'lib/adminShared';
import { formatPrice } from 'lib/catalog';
import prisma from 'lib/prisma';

type Item = { id: string; title: string; price: number; quantity: number };
type Props = {
  base: string;
  session: AdminSession;
  order: { id: string; createdAt: string; updatedAt: string; status: string; totalPrice: number; items: Item[]; contact: Record<string, string>; note: string | null };
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const base = adminBase();
  const session = await getAdminSession(ctx);
  if (!session) return { redirect: { destination: `${base}/login`, permanent: false } };
  const o = await prisma.order.findUnique({ where: { id: String(ctx.params?.id) } });
  if (!o) return { notFound: true };
  return {
    props: {
      base,
      session,
      order: {
        id: o.id,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        status: o.status,
        totalPrice: o.totalPrice,
        items: (o.items ?? []) as Item[],
        contact: (o.contact ?? {}) as Record<string, string>,
        note: o.note,
      },
    },
  };
};

export default function AdminOrder({ base, session, order }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const c = order.contact;

  const [phone, setPhone] = useState(c.phone ?? '');
  const [email, setEmail] = useState(c.email ?? '');
  const [preferredContact, setPreferredContact] = useState(c.preferredContact || 'phone');
  const [contactMsg, setContactMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [contactSaving, setContactSaving] = useState(false);

  const [note, setNote] = useState(order.note ?? '');
  const [noteMsg, setNoteMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [noteSaving, setNoteSaving] = useState(false);

  async function changeStatus(next: string) {
    const res = await fetch(`${base}/api/orders/${order.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) });
    if (!res.ok) return alert('Не удалось изменить статус');
    setStatus(next);
  }

  async function saveContact() {
    setContactSaving(true);
    setContactMsg(null);
    const res = await fetch(`${base}/api/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact: { phone, email, preferredContact } }),
    });
    setContactSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setContactMsg({ ok: false, text: body?.message || 'Не удалось сохранить контакты' });
      return;
    }
    setContactMsg({ ok: true, text: `Сохранено, ${fmtDate(new Date().toISOString())}` });
  }

  async function saveNote() {
    setNoteSaving(true);
    setNoteMsg(null);
    const res = await fetch(`${base}/api/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    });
    setNoteSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setNoteMsg({ ok: false, text: body?.message || 'Не удалось сохранить заметку' });
      return;
    }
    setNoteMsg({ ok: true, text: `Сохранено, ${fmtDate(new Date().toISOString())}` });
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
      <AdminNav base={base} session={session} active="orders" title={`Заказ …${order.id.slice(-6)}`} />
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
        <h2 style={{ marginTop: '2rem' }}>Изменить контакты</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', alignItems: 'center' }}>
          <Input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Телефон, 10 цифр" maxLength={10} />
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
          <Select value={preferredContact} onChange={(e) => setPreferredContact(e.target.value)}>
            <option value="phone">Звонок</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="telegram">Telegram</option>
          </Select>
          <Btn type="button" disabled={contactSaving} onClick={saveContact}>
            Сохранить
          </Btn>
          {contactMsg && <span style={{ color: contactMsg.ok ? 'rgb(var(--accent))' : 'rgb(var(--accent))' }}>{contactMsg.text}</span>}
        </div>
      </Card>
      <Card>
        <h2>Заметка</h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={2000}
          rows={4}
          style={{ width: '100%', font: 'inherit', padding: '0.8rem 1rem', border: '1px solid rgba(var(--ink), 0.2)', borderRadius: '0.5rem', background: 'rgb(var(--bg))', color: 'rgb(var(--ink))', resize: 'vertical' }}
        />
        <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <Btn type="button" disabled={noteSaving} onClick={saveNote}>
            Сохранить
          </Btn>
          {noteMsg && <span style={{ color: noteMsg.ok ? 'rgb(var(--accent))' : 'rgb(var(--accent))' }}>{noteMsg.text}</span>}
        </div>
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
      {session.role === 'admin' && (
        <Btn type="button" $danger onClick={remove}>
          Удалить заказ
        </Btn>
      )}
    </AdminPage>
  );
}
