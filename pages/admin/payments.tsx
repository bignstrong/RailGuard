import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import NextLink from 'next/link';
import { useState } from 'react';
import styled from 'styled-components';
import { AdminNav, AdminPage, Btn, Card, fmtDate, Input, Pill, Select, Table } from 'components/AdminUi';
import { adminBase, getAdminSession } from 'lib/adminAuth';
import type { AdminSession } from 'lib/adminSession';
import { formatPrice } from 'lib/catalog';
import { CHECKOUT_ALLOWED, checkoutProvider, loadPaymentSettings } from 'lib/payments';
import { isConfigured, PAY_STATUS_LABEL, PaymentSettings, PayStatus, PROVIDER_LABEL, ProviderKey, PROVIDERS, TAX_SYSTEMS, VATS } from 'lib/paymentsShared';
import prisma from 'lib/prisma';

type Row = { id: string; orderId: string; provider: string; amount: number; status: PayStatus; url: string | null; error: string | null; createdAt: string };
type Props = {
  base: string;
  session: AdminSession;
  settings: PaymentSettings; // секреты не уходят на клиент: вместо них пусто
  saved: Record<ProviderKey, boolean>;
  live: ProviderKey | null;
  checkoutAllowed: boolean;
  rows: Row[];
  totals: { paid: number; paidCount: number; pending: number; refunded: number };
  site: string;
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const base = adminBase();
  const session = await getAdminSession(ctx);
  if (!session) return { redirect: { destination: `${base}/login`, permanent: false } };
  const s = await loadPaymentSettings();
  const since = new Date(Date.now() - 30 * 86400000);
  const [payments, paid, pending, refunded] = await Promise.all([
    prisma.payment.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
    prisma.payment.aggregate({ where: { status: 'succeeded', createdAt: { gte: since } }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.payment.count({ where: { status: 'pending' } }),
    prisma.payment.aggregate({ where: { status: 'refunded', createdAt: { gte: since } }, _sum: { amount: true } }),
  ]);
  return {
    props: {
      base,
      session,
      settings: { ...s, yookassa: { ...s.yookassa, secretKey: '' }, cloudpayments: { ...s.cloudpayments, apiSecret: '' } },
      saved: { yookassa: isConfigured(s, 'yookassa'), cloudpayments: isConfigured(s, 'cloudpayments') },
      live: checkoutProvider(s),
      checkoutAllowed: CHECKOUT_ALLOWED(),
      rows: payments.map((p) => ({ id: p.id, orderId: p.orderId, provider: p.provider, amount: p.amount / 100, status: p.status as PayStatus, url: p.url, error: p.error, createdAt: p.createdAt.toISOString() })),
      totals: { paid: (paid._sum.amount ?? 0) / 100, paidCount: paid._count._all, pending, refunded: (refunded._sum.amount ?? 0) / 100 },
      site: (process.env.NEXT_PUBLIC_SITE_URL || 'https://railguard.ru').replace(/\/+$/, ''),
    },
  };
};

const STATUS_STYLE: Record<PayStatus, { background: string; color: string }> = {
  succeeded: { background: 'rgba(22, 163, 74, 0.12)', color: '#15803d' },
  pending: { background: 'rgba(var(--accent), 0.12)', color: 'rgb(var(--accent))' },
  refunded: { background: 'rgba(var(--ink), 0.08)', color: 'rgb(var(--ink))' },
  canceled: { background: 'rgba(var(--ink), 0.06)', color: 'rgba(var(--ink), 0.6)' },
  failed: { background: 'rgba(185, 28, 28, 0.1)', color: '#b91c1c' },
};

const Summary = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
  gap: 1.2rem;
  margin-bottom: 2rem;

  div {
    padding: 1.4rem 1.6rem;
    border-radius: 0.8rem;
    border: 1px solid rgba(var(--ink), 0.1);
  }
  small {
    display: block;
    font-size: 1.3rem;
    color: rgba(var(--ink), 0.65);
  }
  strong {
    font-size: 2.4rem;
    font-weight: 600;
  }
  span {
    color: rgba(var(--ink), 0.65);
  }
`;

const Banner = styled.p<{ $on: boolean }>`
  margin: 0 0 2rem;
  padding: 1.2rem 1.6rem;
  border-radius: 0.8rem;
  background: ${(p) => (p.$on ? 'rgba(22, 163, 74, 0.1)' : 'rgba(var(--ink), 0.05)')};
  color: ${(p) => (p.$on ? '#15803d' : 'rgba(var(--ink), 0.75)')};
`;

const Form = styled.div`
  display: grid;
  gap: 1.8rem;

  fieldset {
    border: 1px solid rgba(var(--ink), 0.1);
    border-radius: 0.8rem;
    padding: 1.4rem 1.6rem;
    margin: 0;
    display: grid;
    gap: 1rem;
    min-width: 0;
  }
  legend {
    padding: 0 0.6rem;
    font-weight: 600;
  }
  label {
    display: grid;
    gap: 0.4rem;
    font-size: 1.35rem;
    color: rgba(var(--ink), 0.7);
  }
  label input,
  label select {
    min-width: 0;
    width: 100%;
    max-width: 48rem;
  }
  .check {
    display: flex;
    gap: 0.8rem;
    align-items: center;
    color: rgb(var(--ink));
    font-size: 1.5rem;
  }
  .check input {
    width: auto;
  }
  .row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr));
    gap: 1rem;
  }
  code {
    font-size: 1.3rem;
    padding: 0.2rem 0.6rem;
    border-radius: 0.4rem;
    background: rgba(var(--ink), 0.06);
    overflow-wrap: anywhere;
  }
`;

const Muted = styled.p`
  margin: 0;
  font-size: 1.3rem;
  color: rgba(var(--ink), 0.6);
`;

const Scroll = styled.div`
  overflow-x: auto;

  td,
  th {
    white-space: nowrap;
  }
  td small {
    display: block;
    color: #b91c1c;
    white-space: normal;
    max-width: 32rem;
  }
  button {
    font: inherit;
    font-size: 1.3rem;
    padding: 0.4rem 0.8rem;
    border-radius: 0.4rem;
    border: 1px solid rgba(var(--ink), 0.15);
    background: transparent;
    color: rgb(var(--ink));
    cursor: pointer;
    margin-right: 0.4rem;
  }
  button:disabled {
    opacity: 0.5;
  }
`;

export default function AdminPayments({ base, session, settings, saved, live, checkoutAllowed, rows: initialRows, totals, site }: Props) {
  const [s, setS] = useState(settings);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState(initialRows);
  const [busy, setBusy] = useState<string | null>(null);
  const isAdmin = session.role === 'admin';
  const set = (patch: Partial<PaymentSettings>) => setS((v) => ({ ...v, ...patch }));

  async function save() {
    if (s.enabled && !s.provider) return setMsg({ ok: false, text: 'Выберите шлюз, прежде чем включать оплату на сайте' });
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`${base}/api/payments/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return setMsg({ ok: false, text: body.message || 'Не удалось сохранить' });
      window.location.reload();
    } catch {
      setMsg({ ok: false, text: 'Нет связи с сервером' });
    } finally {
      setSaving(false);
    }
  }

  async function act(id: string, action: 'refresh' | 'refund') {
    if (action === 'refund' && !window.confirm('Вернуть деньги покупателю полностью? Отменить возврат будет нельзя.')) return;
    setBusy(id);
    try {
      const res = await fetch(`${base}/api/payments/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return alert(body.message || 'Шлюз не ответил');
      setRows((r) => r.map((p) => (p.id === id ? { ...p, status: body.status } : p)));
    } catch {
      alert('Нет связи с сервером');
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminPage>
      <Head>
        <title>Оплата</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminNav base={base} session={session} active="payments" title="Оплата" />

      <Banner $on={!!live}>
        {live
          ? `Онлайн-оплата включена: после оформления заказа покупатель уходит на страницу ${PROVIDER_LABEL[live]}.`
          : 'Покупатели оформляют заказ как раньше, без оплаты на сайте. Ссылку на оплату можно отправить вручную из карточки заказа.'}
      </Banner>

      <Summary>
        <div>
          <small>Оплачено за 30 дней</small>
          <strong>{formatPrice(totals.paid)}</strong> <span>· {totals.paidCount} шт.</span>
        </div>
        <div>
          <small>Ждут оплаты</small>
          <strong>{totals.pending}</strong>
        </div>
        <div>
          <small>Возвраты за 30 дней</small>
          <strong>{formatPrice(totals.refunded)}</strong>
        </div>
      </Summary>

      <Card>
        <h2>Платежи</h2>
        <Scroll>
          <Table>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Заказ</th>
                <th>Шлюз</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6}>Платежей пока нет</td>
                </tr>
              )}
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>{fmtDate(p.createdAt)}</td>
                  <td>
                    <NextLink href={`${base}/orders/${p.orderId}`}>#{p.orderId.slice(-6).toUpperCase()}</NextLink>
                  </td>
                  <td>{PROVIDER_LABEL[p.provider as ProviderKey] ?? p.provider}</td>
                  <td>{formatPrice(p.amount)}</td>
                  <td>
                    <Pill style={{ marginLeft: 0, ...STATUS_STYLE[p.status] }}>{PAY_STATUS_LABEL[p.status] ?? p.status}</Pill>
                    {p.error && <small>{p.error}</small>}
                  </td>
                  <td>
                    {p.status === 'pending' && p.url && (
                      <button type="button" onClick={() => navigator.clipboard?.writeText(p.url!)}>
                        Копировать ссылку
                      </button>
                    )}
                    {p.status !== 'failed' && (
                      <button type="button" disabled={busy === p.id} onClick={() => act(p.id, 'refresh')}>
                        Обновить
                      </button>
                    )}
                    {isAdmin && p.status === 'succeeded' && (
                      <button type="button" disabled={busy === p.id} onClick={() => act(p.id, 'refund')} style={{ color: '#b91c1c' }}>
                        Возврат
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Scroll>
      </Card>

      <Card>
        <h2>Настройки</h2>
        {!isAdmin && <Muted style={{ marginBottom: '1.2rem' }}>Менять настройки может только администратор.</Muted>}
        <fieldset disabled={!isAdmin} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
          <Form>
            <label className="check">
              <input type="checkbox" checked={s.enabled} disabled={!checkoutAllowed} onChange={(e) => set({ enabled: e.target.checked })} />
              Принимать онлайн-оплату на сайте (после оформления заказа — сразу на оплату)
            </label>
            {!checkoutAllowed && (
              <Muted>
                Оплата для покупателей заблокирована на сервере. Чтобы её открыть, добавьте в .env на сервере <code>PAYMENTS_CHECKOUT=on</code> и перезапустите сайт.
              </Muted>
            )}

            <label>
              Шлюз
              <Select value={s.provider} onChange={(e) => set({ provider: e.target.value as PaymentSettings['provider'] })}>
                <option value="">Не выбран</option>
                {PROVIDERS.map((p) => (
                  <option key={p} value={p}>
                    {PROVIDER_LABEL[p]}
                    {saved[p] ? ' — ключи сохранены' : ''}
                  </option>
                ))}
              </Select>
            </label>

            <fieldset>
              <legend>ЮKassa</legend>
              <div className="row">
                <label>
                  shopId
                  <Input value={s.yookassa.shopId} onChange={(e) => set({ yookassa: { ...s.yookassa, shopId: e.target.value } })} autoComplete="off" />
                </label>
                <label>
                  Секретный ключ
                  <Input
                    type="password"
                    value={s.yookassa.secretKey}
                    onChange={(e) => set({ yookassa: { ...s.yookassa, secretKey: e.target.value } })}
                    placeholder={saved.yookassa ? 'сохранён — оставьте пустым' : 'live_… или test_…'}
                    autoComplete="new-password"
                  />
                </label>
              </div>
              <Muted>
                В личном кабинете ЮKassa → Интеграция → HTTP-уведомления укажите <code>{site}/api/payments/yookassa</code> и отметьте события payment.succeeded,
                payment.canceled, refund.succeeded. Для проверки — ключи тестового магазина.
              </Muted>
            </fieldset>

            <fieldset>
              <legend>CloudPayments</legend>
              <div className="row">
                <label>
                  Public ID
                  <Input value={s.cloudpayments.publicId} onChange={(e) => set({ cloudpayments: { ...s.cloudpayments, publicId: e.target.value } })} autoComplete="off" />
                </label>
                <label>
                  Пароль для API
                  <Input
                    type="password"
                    value={s.cloudpayments.apiSecret}
                    onChange={(e) => set({ cloudpayments: { ...s.cloudpayments, apiSecret: e.target.value } })}
                    placeholder={saved.cloudpayments ? 'сохранён — оставьте пустым' : ''}
                    autoComplete="new-password"
                  />
                </label>
              </div>
              <Muted>
                В личном кабинете CloudPayments → Настройки сайта → Уведомления включите Pay, Fail и Refund с адресом <code>{site}/api/payments/cloudpayments</code>{' '}
                (метод POST, кодировка UTF-8). Для проверки — тестовый сайт в личном кабинете.
              </Muted>
            </fieldset>

            <fieldset>
              <legend>Чеки 54-ФЗ</legend>
              <label className="check">
                <input type="checkbox" checked={s.receipt} onChange={(e) => set({ receipt: e.target.checked })} />
                Передавать чек в шлюз (нужна подключённая онлайн-касса: «Чеки от ЮKassa» или касса CloudKassir)
              </label>
              <div className="row">
                <label>
                  Система налогообложения
                  <Select value={s.tax} onChange={(e) => set({ tax: e.target.value as PaymentSettings['tax'] })}>
                    {Object.entries(TAX_SYSTEMS).map(([k, [label]]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </label>
                <label>
                  НДС
                  <Select value={s.vat} onChange={(e) => set({ vat: e.target.value as PaymentSettings['vat'] })}>
                    {Object.entries(VATS).map(([k, [label]]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>
            </fieldset>

            {isAdmin && (
              <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                <Btn type="button" disabled={saving} onClick={save}>
                  Сохранить
                </Btn>
                {msg && <span style={{ color: msg.ok ? '#15803d' : '#b91c1c', fontSize: '1.35rem' }}>{msg.text}</span>}
              </div>
            )}
            <Muted>Ключи хранятся в базе зашифрованными и после сохранения не показываются. Чтобы удалить ключи, сотрите shopId или Public ID и сохраните.</Muted>
          </Form>
        </fieldset>
      </Card>
    </AdminPage>
  );
}
