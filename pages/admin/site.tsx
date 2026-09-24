import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { FormEvent, useState } from 'react';
import styled from 'styled-components';
import { AdminNav, AdminPage, Btn, Card, Input, Table } from 'components/AdminUi';
import { adminBase, getAdminSession } from 'lib/adminAuth';
import type { AdminSession } from 'lib/adminSession';
import { CATALOG, ProductId } from 'lib/catalog';
import type { SiteConfig } from 'lib/site';
import { loadSite } from 'lib/site';

type Props = { base: string; session: AdminSession; site: SiteConfig };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const base = adminBase();
  const session = await getAdminSession(ctx);
  if (!session) return { redirect: { destination: `${base}/login`, permanent: false } };
  const site = await loadSite();
  return { props: { base, session, site } };
};

const Textarea = styled.textarea`
  padding: 0.8rem 1rem;
  font: inherit;
  border: 1px solid rgba(var(--ink), 0.2);
  border-radius: 0.5rem;
  background: rgb(var(--bg));
  color: rgb(var(--ink));
  resize: vertical;
  min-height: 8rem;
  width: 100%;
  box-sizing: border-box;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.6rem;
  margin-bottom: 1.2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;

  label {
    font-size: 1.3rem;
    font-weight: 500;
    margin-bottom: 0.4rem;
    color: rgb(var(--ink));
  }

  small {
    font-size: 1.2rem;
    color: rgba(var(--ink), 0.6);
    margin-top: 0.3rem;
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin: 0;

  input {
    cursor: pointer;
  }
`;

const Message = styled.p<{ $error?: boolean }>`
  color: ${(p) => (p.$error ? 'rgb(var(--accent))' : 'rgba(var(--ink), 0.7)')};
  margin: 1rem 0 0;
`;

const Hint = styled.p`
  font-size: 1.2rem;
  color: rgba(var(--ink), 0.6);
  margin-top: 0.8rem;
`;

const Note = styled.div`
  background: rgba(var(--accent), 0.1);
  border: 1px solid rgba(var(--accent), 0.3);
  border-radius: 0.5rem;
  padding: 1rem;
  font-size: 1.3rem;
  color: rgb(var(--ink));
  margin-bottom: 1.6rem;
`;

export default function AdminSite({ base, session, site: initial }: Props) {
  const [site, setSite] = useState<SiteConfig>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const isAdmin = session.role === 'admin';

  const api = (path: string, init: RequestInit) => fetch(`${base}/api/admin${path}`, { ...init, headers: { 'Content-Type': 'application/json' } });

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setMessage('');
    setSaving(true);
    const res = await api('/site', { method: 'PUT', body: JSON.stringify(site) });
    setSaving(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setMessage(data.message || 'Ошибка при сохранении');
    setMessage('Сохранено');
    setTimeout(() => setMessage(''), 3000);
  }

  const handleAnnouncementChange = (value: string) => setSite({ ...site, announcement: value });
  const handlePhoneChange = (value: string) => setSite({ ...site, contacts: { ...site.contacts, phone: value } });
  const handleEmailChange = (value: string) => setSite({ ...site, contacts: { ...site.contacts, email: value } });
  const handleHoursChange = (value: string) => setSite({ ...site, contacts: { ...site.contacts, hours: value } });
  const handleLegalChange = (value: string) => setSite({ ...site, contacts: { ...site.contacts, legal: value } });
  const handleTelegramChange = (value: string) => setSite({ ...site, contacts: { ...site.contacts, telegram: value } });

  const handleProductChange = (id: ProductId, field: 'price' | 'oldPrice' | 'inStock' | 'hidden', value: string | boolean) => {
    const numValue = typeof value === 'string' ? parseInt(value, 10) || 0 : value;
    setSite({
      ...site,
      products: {
        ...site.products,
        [id]: { ...site.products[id], [field]: numValue },
      },
    });
  };

  return (
    <AdminPage>
      <Head>
        <title>Сайт</title>
        <meta name="robots" content="noindex" />
      </Head>
      <AdminNav base={base} session={session} active="site" title="Сайт" />

      {!isAdmin && (
        <Note>
          Изменять может только администратор. Текущий пользователь: {session.user} (роль: {session.role})
        </Note>
      )}

      <form onSubmit={handleSave}>
        <Card>
          <h2>Объявление на сайте</h2>
          <FormGroup>
            <Textarea
              value={site.announcement}
              onChange={(e) => handleAnnouncementChange(e.target.value)}
              disabled={!isAdmin}
              placeholder="Полоса вверху всех страниц"
            />
            <Hint>Пусто &mdash; полосы нет. Например: &laquo;До 30 сентября скидка 20% на комплект &bdquo;Старт&rdquo;&raquo;</Hint>
          </FormGroup>
        </Card>

        <Card>
          <h2>Контакты (страница Доставка)</h2>
          <FormRow>
            <FormGroup>
              <label>Телефон</label>
              <Input value={site.contacts.phone} onChange={(e) => handlePhoneChange(e.target.value)} disabled={!isAdmin} />
            </FormGroup>
            <FormGroup>
              <label>Email</label>
              <Input value={site.contacts.email} onChange={(e) => handleEmailChange(e.target.value)} disabled={!isAdmin} type="email" />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup>
              <label>Часы работы</label>
              <Input value={site.contacts.hours} onChange={(e) => handleHoursChange(e.target.value)} disabled={!isAdmin} />
            </FormGroup>
            <FormGroup>
              <label>Реквизиты (ИП/ООО, ИНН, ОГРН)</label>
              <Input value={site.contacts.legal} onChange={(e) => handleLegalChange(e.target.value)} disabled={!isAdmin} />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup>
              <label>Telegram (ссылка https://t.me/…)</label>
              <Input value={site.contacts.telegram} onChange={(e) => handleTelegramChange(e.target.value)} disabled={!isAdmin} placeholder="https://t.me/railguard_manager" />
            </FormGroup>
          </FormRow>
          <Hint>Пустые поля на сайте не показываются.</Hint>
        </Card>

        <Card>
          <h2>Уведомления о заказах</h2>
          <FormGroup>
            <label>Кому отправлять письмо о новом заказе (через запятую)</label>
            <Input
              value={site.orderNotifyTo}
              onChange={(e) => setSite({ ...site, orderNotifyTo: e.target.value })}
              disabled={!isAdmin}
              placeholder="owner@example.ru, manager@example.ru"
            />
          </FormGroup>
          <Hint>Письма уходят с ящика, указанного на сервере (SMTP_USER). Пусто — адрес из ORDER_NOTIFY_TO на сервере.</Hint>
        </Card>

        <Card>
          <h2>Товары</h2>
          <Table>
            <thead>
              <tr>
                <th>Товар</th>
                <th>Цена</th>
                <th>Старая цена</th>
                <th>В наличии</th>
                <th>Скрыт</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(CATALOG) as ProductId[]).map((id) => (
                <tr key={id}>
                  <td>{CATALOG[id].title}</td>
                  <td>
                    <Input
                      type="number"
                      value={site.products[id].price}
                      onChange={(e) => handleProductChange(id, 'price', e.target.value)}
                      disabled={!isAdmin}
                      style={{ width: '100%', maxWidth: '10rem' }}
                    />
                  </td>
                  <td>
                    <Input
                      type="number"
                      value={site.products[id].oldPrice}
                      onChange={(e) => handleProductChange(id, 'oldPrice', e.target.value)}
                      disabled={!isAdmin}
                      style={{ width: '100%', maxWidth: '10rem' }}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={site.products[id].inStock}
                      onChange={(e) => handleProductChange(id, 'inStock', e.target.checked)}
                      disabled={!isAdmin}
                      style={{ cursor: isAdmin ? 'pointer' : 'not-allowed' }}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={site.products[id].hidden}
                      onChange={(e) => handleProductChange(id, 'hidden', e.target.checked)}
                      disabled={!isAdmin}
                      style={{ cursor: isAdmin ? 'pointer' : 'not-allowed' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Hint>
            Скрытый товар исчезает из каталога и фида Директа; &laquo;нет в наличии&raquo; остаётся виден, но кнопка выключена. Цены применяются к новым заказам сразу,
            на сайте — в течение минуты.
          </Hint>
        </Card>

        <Card>
          <Btn type="submit" disabled={!isAdmin || saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Btn>
          {message && <Message $error={message.includes('Ошибка')}>{message}</Message>}
        </Card>
      </form>
    </AdminPage>
  );
}
