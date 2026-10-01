import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import styled from 'styled-components';
import { AdminNav, AdminPage, Btn, Card, fmtDate, fmtPhone, Input, Pill, PREFERRED, Select, StatusSelect } from 'components/AdminUi';
import { adminBase, getAdminSession } from 'lib/adminAuth';
import type { AdminSession } from 'lib/adminSession';
import { ORDER_STATUSES, OrderStatus, STATUS_LABEL } from 'lib/adminShared';
import { Channel, CHANNEL_LABEL, Touch } from 'lib/attribution';
import { formatPrice } from 'lib/catalog';
import { loadPaymentSettings } from 'lib/payments';
import { isConfigured, PAY_STATUS_LABEL, PayStatus, PROVIDER_LABEL, ProviderKey } from 'lib/paymentsShared';
import prisma from 'lib/prisma';

type Item = { id: string; title: string; price: number; oldPrice?: number; quantity: number };
type Props = {
  base: string;
  session: AdminSession;
  payProvider: ProviderKey | null;
  order: { id: string; createdAt: string; updatedAt: string; status: string; totalPrice: number; items: Item[]; contact: Record<string, string>; note: string | null; channel: string | null; device: string | null; customer: { id: string; orders: number } | null; payments: { id: string; provider: string; amount: number; status: string; url: string | null; error: string | null; createdAt: string }[]; attribution: { ft?: Touch | null; lt?: Touch | null; ymClientId?: string } | null };
};

const touchText = (t?: Touch | null) =>
  t
    ? [`${t.source} / ${t.medium}`, t.campaign && `кампания ${t.campaign}`, t.term && `запрос ${t.term}`, t.yclid && 'yclid', `вход ${t.landing}`, fmtDate(t.at)].filter(Boolean).join(' · ')
    : '—';

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const base = adminBase();
  const session = await getAdminSession(ctx);
  if (!session) return { redirect: { destination: `${base}/login`, permanent: false } };
  const o = await prisma.order.findUnique({ where: { id: String(ctx.params?.id) }, include: { customer: { select: { id: true, _count: { select: { orders: true } } } }, payments: { orderBy: { createdAt: 'desc' } } } });
  const pay = await loadPaymentSettings();
  if (!o) return { notFound: true };
  return {
    props: {
      base,
      session,
      payProvider: pay.provider && isConfigured(pay, pay.provider) ? pay.provider : null,
      order: {
        id: o.id,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        status: o.status,
        totalPrice: o.totalPrice,
        items: (o.items ?? []) as Item[],
        contact: (o.contact ?? {}) as Record<string, string>,
        note: o.note,
        channel: o.channel,
        device: o.device,
        customer: o.customer && { id: o.customer.id, orders: o.customer._count.orders },
        payments: o.payments.map((p) => ({ id: p.id, provider: p.provider, amount: p.amount / 100, status: p.status, url: p.url, error: p.error, createdAt: p.createdAt.toISOString() })),
        attribution: (o.attribution ?? null) as Props['order']['attribution'],
      },
    },
  };
};

const DEVICE_LABEL: Record<string, string> = { mobile: 'Телефон', tablet: 'Планшет', desktop: 'Компьютер' };
// Следующий шаг по заказу — одна главная кнопка.
const NEXT_STEP: Record<string, [OrderStatus, string]> = { pending: ['processing', 'Взять в работу'], processing: ['completed', 'Отметить выполненным'] };
const STEPS: OrderStatus[] = ['pending', 'processing', 'completed'];

// ───────── стили ─────────

const Back = styled(NextLink)`
  display: inline-block;
  margin: -1.2rem 0 1.2rem;
  font-size: 1.4rem;
  color: rgba(var(--ink), 0.6);
  text-decoration: none;

  &:hover {
    color: rgb(var(--ink));
  }
`;

const Top = styled.section`
  display: flex;
  flex-wrap: wrap;
  gap: 1.6rem 2.4rem;
  align-items: center;
  justify-content: space-between;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(var(--ink), 0.1);
  border-radius: 0.8rem;
  background: rgb(var(--bg));

  small {
    display: block;
    font-size: 1.3rem;
    color: rgba(var(--ink), 0.6);
  }
  strong {
    font-size: 3.2rem;
    font-weight: 700;
    line-height: 1.2;
  }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  align-items: center;

  select {
    width: auto;
  }
`;

const Ghost = styled.button`
  font: inherit;
  padding: 0.8rem 1.4rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(var(--ink), 0.15);
  background: transparent;
  color: rgb(var(--ink));
  cursor: pointer;

  &:hover {
    border-color: rgba(var(--ink), 0.4);
  }
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

const Accent = styled(Btn)`
  background: rgb(var(--accent));
`;

const Steps = styled.ol`
  display: flex;
  gap: 0.6rem;
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 1.25rem;
  color: rgba(var(--ink), 0.5);

  li {
    flex: 1;
  }
  li::before {
    content: '';
    display: block;
    height: 0.4rem;
    margin-bottom: 0.6rem;
    border-radius: 0.2rem;
    background: rgba(var(--ink), 0.1);
  }
  li[data-done='true'] {
    color: rgb(var(--ink));
  }
  li[data-done='true']::before {
    background: rgb(var(--accent));
  }
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: 2rem;
  align-items: start;

  > div > section {
    margin-bottom: 2rem;
  }
  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Lines = styled.div`
  > div {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.2rem 1.6rem;
    padding: 1.2rem 0;
    border-bottom: 1px solid rgba(var(--ink), 0.08);
  }
  small {
    color: rgba(var(--ink), 0.6);
    font-size: 1.3rem;
  }
  s {
    margin-left: 0.6rem;
  }
  b {
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
`;

const Total = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-top: 1.4rem;

  span {
    color: rgba(var(--ink), 0.65);
  }
  b {
    font-size: 2.2rem;
  }
`;

const Phone = styled.a`
  display: block;
  font-size: 2.2rem;
  font-weight: 600;
  color: rgb(var(--ink));
  text-decoration: none;
`;

const ContactBtns = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin: 1.2rem 0 1.6rem;

  a {
    padding: 0.6rem 1.2rem;
    border-radius: 0.5rem;
    border: 1px solid rgba(var(--ink), 0.15);
    color: rgb(var(--ink));
    text-decoration: none;
    font-size: 1.4rem;
  }
  a[data-preferred='true'] {
    border-color: rgb(var(--accent));
    background: rgba(var(--accent), 0.08);
    font-weight: 600;
  }
`;

const Facts = styled.dl`
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 0.6rem 1.6rem;
  margin: 0;
  font-size: 1.4rem;

  dt {
    color: rgba(var(--ink), 0.6);
  }
  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }
`;

const EditForm = styled.div`
  display: grid;
  gap: 0.8rem;
  margin-top: 1.4rem;

  input,
  select {
    min-width: 0;
    width: 100%;
  }
  div {
    display: flex;
    gap: 0.8rem;
    align-items: center;
  }
`;

const Note = styled.textarea`
  width: 100%;
  font: inherit;
  padding: 1rem 1.2rem;
  border: 1px solid rgba(var(--ink), 0.15);
  border-radius: 0.6rem;
  background: rgba(var(--ink), 0.02);
  color: rgb(var(--ink));
  resize: vertical;

  &:focus {
    outline: none;
    border-color: rgba(var(--ink), 0.4);
    background: rgb(var(--bg));
  }
`;

const Msg = styled.span<{ $ok: boolean }>`
  font-size: 1.3rem;
  color: ${(p) => (p.$ok ? '#15803d' : '#b91c1c')};
`;

const Danger = styled.button`
  font: inherit;
  font-size: 1.3rem;
  padding: 0;
  border: 0;
  background: none;
  color: #b91c1c;
  cursor: pointer;
  text-decoration: underline;
`;

// ───────── страница ─────────

export default function AdminOrder({ base, session, payProvider, order }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [statusSaving, setStatusSaving] = useState(false);
  const c = order.contact;
  const short = order.id.slice(-6).toUpperCase();

  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(c.phone ?? '');
  const [email, setEmail] = useState(c.email ?? '');
  const [preferredContact, setPreferredContact] = useState(c.preferredContact || 'phone');
  const [contactMsg, setContactMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [contactSaving, setContactSaving] = useState(false);

  const [note, setNote] = useState(order.note ?? '');
  const [savedNote, setSavedNote] = useState(order.note ?? '');
  const [noteMsg, setNoteMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [noteSaving, setNoteSaving] = useState(false);

  async function changeStatus(next: string) {
    setStatusSaving(true);
    try {
      const res = await fetch(`${base}/api/orders/${order.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) });
      if (!res.ok) return alert('Не удалось изменить статус');
      setStatus(next);
    } catch {
      alert('Нет связи с сервером');
    } finally {
      setStatusSaving(false);
    }
  }

  async function saveContact() {
    setContactSaving(true);
    setContactMsg(null);
    try {
      const res = await fetch(`${base}/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: { phone, email, preferredContact } }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setContactMsg({ ok: false, text: body?.message || 'Не удалось сохранить контакты' });
        return;
      }
      setContactMsg({ ok: true, text: 'Контакты сохранены' });
      setEditing(false);
      // Перечитать props: блок с контактами показывает данные с сервера.
      router.replace(router.asPath, undefined, { scroll: false });
    } catch {
      setContactMsg({ ok: false, text: 'Нет связи с сервером' });
    } finally {
      setContactSaving(false);
    }
  }

  async function saveNote() {
    setNoteSaving(true);
    setNoteMsg(null);
    try {
      const res = await fetch(`${base}/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setNoteMsg({ ok: false, text: body?.message || 'Не удалось сохранить заметку' });
        return;
      }
      setSavedNote(note);
      setNoteMsg({ ok: true, text: `Сохранено в ${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}` });
    } catch {
      setNoteMsg({ ok: false, text: 'Нет связи с сервером' });
    } finally {
      setNoteSaving(false);
    }
  }

  const [payments, setPayments] = useState(order.payments);
  const [payBusy, setPayBusy] = useState(false);
  const [payMsg, setPayMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function createPayLink() {
    setPayBusy(true);
    setPayMsg(null);
    try {
      const res = await fetch(`${base}/api/payments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: order.id }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return setPayMsg({ ok: false, text: body.message || 'Шлюз не ответил' });
      await navigator.clipboard?.writeText(body.url).catch(() => {});
      setPayMsg({ ok: true, text: 'Ссылка создана и скопирована — отправьте её покупателю' });
      setPayments((p) => [{ id: body.id, provider: payProvider ?? '', amount: order.totalPrice, status: 'pending', url: body.url, error: null, createdAt: new Date().toISOString() }, ...p]);
    } catch {
      setPayMsg({ ok: false, text: 'Нет связи с сервером' });
    } finally {
      setPayBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm('Удалить заказ безвозвратно? Персональные данные клиента будут стёрты.')) return;
    try {
      const res = await fetch(`${base}/api/orders/${order.id}`, { method: 'DELETE' });
      if (!res.ok) return alert('Не удалось удалить');
      router.replace(base || '/');
    } catch {
      alert('Нет связи с сервером');
    }
  }

  const next = NEXT_STEP[status];
  const qty = order.items.reduce((s, i) => s + i.quantity, 0);
  const contacts: [string, string, string][] = [
    ['phone', 'Позвонить', `tel:+7${c.phone}`],
    ['whatsapp', 'WhatsApp', `https://wa.me/7${c.phone}`],
    ['telegram', 'Telegram', `https://t.me/+7${c.phone}`],
    ['email', 'Написать', `mailto:${c.email}`],
  ];

  return (
    <AdminPage>
      <Head>
        <title>Заказ #{short}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminNav base={base} session={session} active="orders" title={`Заказ #${short}`} />
      <Back href={base || '/'}>← Все заказы</Back>

      <Top>
        <div>
          <small>
            {fmtDate(order.createdAt)} · {qty} шт.
          </small>
          <strong>{formatPrice(order.totalPrice)}</strong>
        </div>
        <Actions>
          {next && (
            <Accent type="button" disabled={statusSaving} onClick={() => changeStatus(next[0])}>
              {next[1]}
            </Accent>
          )}
          {status !== 'cancelled' && status !== 'completed' && (
            <Ghost type="button" disabled={statusSaving} onClick={() => changeStatus('cancelled')}>
              Отменить
            </Ghost>
          )}
          <StatusSelect $s={status} value={status} disabled={statusSaving} onChange={(e) => changeStatus(e.target.value)} aria-label="Статус заказа">
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </StatusSelect>
        </Actions>
        {status === 'cancelled' ? (
          <Steps>
            <li data-done="true">Заказ отменён</li>
          </Steps>
        ) : (
          <Steps>
            {STEPS.map((s) => (
              <li key={s} data-done={STEPS.indexOf(s) <= STEPS.indexOf(status as OrderStatus)}>
                {STATUS_LABEL[s]}
              </li>
            ))}
          </Steps>
        )}
      </Top>

      <Layout>
        <div>
          <Card>
            <h2>Состав заказа</h2>
            <Lines>
              {order.items.map((i, n) => (
                <div key={n}>
                  <span>{i.title}</span>
                  <b>{formatPrice(i.price * i.quantity)}</b>
                  <small>
                    {i.quantity} × {formatPrice(i.price)}
                    {i.oldPrice && i.oldPrice > i.price ? <s>{formatPrice(i.oldPrice)}</s> : null}
                  </small>
                </div>
              ))}
            </Lines>
            <Total>
              <span>Итого</span>
              <b>{formatPrice(order.totalPrice)}</b>
            </Total>
          </Card>

          <Card>
            <h2>Заметка</h2>
            <Note value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} rows={4} placeholder="Видна только в админке: договорённости, трек-номер, детали доставки" />
            <div style={{ marginTop: '0.8rem', display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
              <Btn type="button" disabled={noteSaving || note === savedNote} onClick={saveNote}>
                Сохранить
              </Btn>
              {noteMsg && <Msg $ok={noteMsg.ok}>{noteMsg.text}</Msg>}
              {!noteMsg && note !== savedNote && <Msg $ok={false}>Есть несохранённые изменения</Msg>}
            </div>
          </Card>

          <Card>
            <h2>Оплата</h2>
            {payments.length === 0 && <Facts as="p" style={{ display: 'block', margin: '0 0 1.2rem', color: 'rgba(var(--ink), 0.6)' }}>Онлайн-платежей по заказу нет.</Facts>}
            <Lines>
              {payments.map((p) => (
                <div key={p.id}>
                  <span>
                    {PROVIDER_LABEL[p.provider as ProviderKey] ?? p.provider} · {PAY_STATUS_LABEL[p.status as PayStatus] ?? p.status}
                  </span>
                  <b>{formatPrice(p.amount)}</b>
                  <small>
                    {fmtDate(p.createdAt)}
                    {p.error && ` · ${p.error}`}
                    {p.status === 'pending' && p.url && (
                      <>
                        {' · '}
                        <a href="#" onClick={(e) => (e.preventDefault(), navigator.clipboard?.writeText(p.url!))} style={{ color: 'rgb(var(--accent))' }}>
                          копировать ссылку
                        </a>
                      </>
                    )}
                  </small>
                </div>
              ))}
            </Lines>
            <div style={{ marginTop: '1.2rem', display: 'flex', flexWrap: 'wrap', gap: '1.2rem', alignItems: 'center' }}>
              {payProvider ? (
                <Ghost type="button" disabled={payBusy || payments.some((p) => p.status === 'succeeded')} onClick={createPayLink}>
                  Создать ссылку на оплату ({PROVIDER_LABEL[payProvider]})
                </Ghost>
              ) : (
                <Msg $ok={false} style={{ color: 'rgba(var(--ink), 0.6)' }}>
                  Шлюз не настроен — раздел <NextLink href={`${base}/payments`}>«Оплата»</NextLink>
                </Msg>
              )}
              {payMsg && <Msg $ok={payMsg.ok}>{payMsg.text}</Msg>}
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <h2>Покупатель</h2>
            <Phone href={`tel:+7${c.phone}`}>{fmtPhone(c.phone ?? '')}</Phone>
            <a href={`mailto:${c.email}`} style={{ color: 'rgba(var(--ink), 0.7)' }}>
              {c.email}
            </a>
            <ContactBtns>
              {contacts.map(([key, label, url]) => (
                <a key={key} href={url} target={url.startsWith('http') ? '_blank' : undefined} rel="noreferrer" data-preferred={key === c.preferredContact}>
                  {label}
                </a>
              ))}
            </ContactBtns>
            <Facts>
              <dt>Предпочитает</dt>
              <dd>{PREFERRED[c.preferredContact] ?? c.preferredContact ?? '—'}</dd>
              <dt>Согласие на ПДн</dt>
              <dd>{c.consentAt ? fmtDate(c.consentAt) : 'нет отметки'}</dd>
              <dt>Заказов всего</dt>
              <dd>
                {order.customer ? (
                  <NextLink href={`${base || '/'}?customer=${order.customer.id}`} style={{ color: 'rgb(var(--accent))' }}>
                    {order.customer.orders} — показать все
                  </NextLink>
                ) : (
                  '—'
                )}
                {order.customer && order.customer.orders > 1 && <Pill>постоянный</Pill>}
              </dd>
            </Facts>
            {!editing ? (
              <Ghost type="button" style={{ marginTop: '1.4rem' }} onClick={() => setEditing(true)}>
                Изменить контакты
              </Ghost>
            ) : (
              <EditForm>
                <Input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Телефон, 10 цифр" maxLength={10} aria-label="Телефон" />
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" aria-label="Email" />
                <Select value={preferredContact} onChange={(e) => setPreferredContact(e.target.value)} aria-label="Как связаться">
                  <option value="phone">Звонок</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telegram">Telegram</option>
                </Select>
                <div>
                  <Btn type="button" disabled={contactSaving} onClick={saveContact}>
                    Сохранить
                  </Btn>
                  <Ghost type="button" onClick={() => setEditing(false)}>
                    Отмена
                  </Ghost>
                </div>
              </EditForm>
            )}
            {contactMsg && (
              <p style={{ margin: '1rem 0 0' }}>
                <Msg $ok={contactMsg.ok}>{contactMsg.text}</Msg>
              </p>
            )}
          </Card>

          <Card>
            <h2>Откуда пришёл</h2>
            <Facts>
              <dt>Канал</dt>
              <dd>{order.channel ? CHANNEL_LABEL[order.channel as Channel] ?? order.channel : 'нет данных'}</dd>
              <dt>Последний</dt>
              <dd>{touchText(order.attribution?.lt)}</dd>
              <dt>Первый</dt>
              <dd>{touchText(order.attribution?.ft)}</dd>
              <dt>Устройство</dt>
              <dd>{order.device ? DEVICE_LABEL[order.device] ?? order.device : '—'}</dd>
              <dt>ClientID</dt>
              <dd>{order.attribution?.ymClientId ?? <Pill style={{ marginLeft: 0 }}>нет согласия на cookie</Pill>}</dd>
            </Facts>
          </Card>

          <Facts style={{ padding: '0 0.4rem', fontSize: '1.3rem', color: 'rgba(var(--ink), 0.6)' }}>
            <dt>ID</dt>
            <dd>{order.id}</dd>
            <dt>Обновлён</dt>
            <dd>{fmtDate(order.updatedAt)}</dd>
          </Facts>
          {session.role === 'admin' && (
            <p style={{ margin: '1.6rem 0.4rem 0' }}>
              <Danger type="button" onClick={remove}>
                Удалить заказ
              </Danger>
            </p>
          )}
        </div>
      </Layout>
    </AdminPage>
  );
}
