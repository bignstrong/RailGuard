import Image from 'next/image';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import type { AdminSession } from 'lib/adminSession';
import { STATUS_COLOR } from 'lib/adminShared';

// Минимальный UI админки. Без сайта вокруг: _app рендерит /admin/* голыми.
export const AdminPage = styled.main`
  max-width: 120rem;
  margin: 0 auto;
  padding: 2rem 1.6rem 6rem;
  font-size: 1.5rem;
  color: rgb(var(--ink));
`;

export const AdminHeader = styled.header`
  position: sticky;
  top: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas: 'brand links user';
  align-items: center;
  gap: 0.8rem 2.4rem;
  margin: -2rem -1.6rem 2.4rem;
  padding: 1.2rem 1.6rem;
  background: rgb(var(--bg));
  border-bottom: 1px solid rgba(var(--ink), 0.08);

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: 'brand user' 'links links';
  }
`;

const Brand = styled(NextLink)`
  grid-area: brand;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-weight: 700;
  font-size: 1.7rem;
  color: rgb(var(--ink));
  text-decoration: none;

`;

const Links = styled.nav`
  grid-area: links;
  display: flex;
  gap: 0.2rem;
  overflow-x: auto;
  scrollbar-width: none;

  a {
    position: relative;
    padding: 0.7rem 1.2rem;
    border-radius: 0.6rem;
    font-size: 1.4rem;
    white-space: nowrap;
    color: rgba(var(--ink), 0.6);
    text-decoration: none;
    transition: color 0.15s, background 0.15s;
  }
  a:hover {
    color: rgb(var(--ink));
    background: rgba(var(--ink), 0.04);
  }
  a[aria-current='page'] {
    color: rgb(var(--ink));
    font-weight: 600;
    background: rgba(var(--ink), 0.06);
  }
  a[aria-current='page']::after {
    content: '';
    position: absolute;
    left: 1.2rem;
    right: 1.2rem;
    bottom: 0.2rem;
    height: 2px;
    border-radius: 1px;
    background: rgb(var(--accent));
  }
`;

const User = styled.div`
  grid-area: user;
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.4rem;
  color: rgba(var(--ink), 0.7);

  i {
    display: grid;
    place-items: center;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    font-style: normal;
    font-weight: 600;
    text-transform: uppercase;
    color: rgb(var(--accent));
    background: rgba(var(--accent), 0.12);
  }
  button {
    font: inherit;
    padding: 0.6rem 1.2rem;
    border-radius: 0.6rem;
    border: 1px solid rgba(var(--ink), 0.15);
    background: transparent;
    color: rgb(var(--ink));
    cursor: pointer;
  }
  button:hover {
    border-color: rgba(var(--ink), 0.4);
  }
  @media (max-width: 480px) {
    span {
      display: none;
    }
  }
`;

const Title = styled.h1`
  font-size: 2.6rem;
  margin: 0 0 2rem;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: rgb(var(--bg));
  border: 1px solid rgba(var(--ink), 0.12);
  border-radius: 0.6rem;
  overflow: hidden;

  th,
  td {
    text-align: left;
    padding: 1rem 1.2rem;
    border-bottom: 1px solid rgba(var(--ink), 0.08);
    vertical-align: top;
  }
  th {
    font-weight: 600;
    background: rgba(var(--ink), 0.04);
  }
  tr:last-child td {
    border-bottom: 0;
  }
  a {
    color: rgb(var(--accent));
  }
`;

export const Toolbar = styled.form`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-bottom: 1.6rem;
`;

export const Input = styled.input`
  padding: 0.8rem 1rem;
  font: inherit;
  border: 1px solid rgba(var(--ink), 0.2);
  border-radius: 0.5rem;
  background: rgb(var(--bg));
  color: rgb(var(--ink));
  min-width: 22rem;
`;

export const Select = styled.select`
  padding: 0.7rem 1rem;
  font: inherit;
  border: 1px solid rgba(var(--ink), 0.2);
  border-radius: 0.5rem;
  background: rgb(var(--bg));
  color: rgb(var(--ink));
`;

export const Btn = styled.button<{ $danger?: boolean }>`
  padding: 0.8rem 1.4rem;
  font: inherit;
  border: 0;
  border-radius: 0.5rem;
  cursor: pointer;
  color: rgb(var(--bg));
  background: ${(p) => (p.$danger ? 'rgb(var(--accent))' : 'rgb(var(--ink))')};

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

export const Card = styled.section`
  background: rgb(var(--bg));
  border: 1px solid rgba(var(--ink), 0.12);
  border-radius: 0.6rem;
  padding: 2rem;
  margin-bottom: 2rem;

  h2 {
    font-size: 1.8rem;
    margin: 0 0 1.2rem;
  }
  dl {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 0.6rem 1.6rem;
    margin: 0;
  }
  dt {
    opacity: 0.7;
  }
  dd {
    margin: 0;
  }
`;

export const Status = styled.span<{ $s: string }>`
  display: inline-block;
  padding: 0.2rem 0.8rem;
  border-radius: 1rem;
  font-size: 1.3rem;
  color: rgb(var(--bg));
  background: ${(p) => {
    const styles = {
      pending: 'rgb(var(--accent))',
      processing: 'rgb(var(--ink))',
      completed: 'rgba(var(--ink), 0.6)',
      cancelled: 'transparent',
    };
    return styles[p.$s as keyof typeof styles] || 'rgba(var(--ink), 0.6)';
  }};
  ${(p) =>
    p.$s === 'cancelled'
      ? `color: rgba(var(--ink), 0.6); border: 1px solid rgba(var(--ink), 0.3);`
      : ''}
`;

export const PREFERRED: Record<string, string> = { phone: 'Звонок', whatsapp: 'WhatsApp', telegram: 'Telegram' };
export const fmtPhone = (p: string) => (p.length === 10 ? `+7 ${p.slice(0, 3)} ${p.slice(3, 6)}-${p.slice(6, 8)}-${p.slice(8)}` : p);

// Статус как цветная кнопка-селект: список заказов и карточка заказа.
export const StatusSelect = styled.select<{ $s: string }>`
  width: 100%;
  font: inherit;
  font-size: 1.35rem;
  font-weight: 600;
  padding: 0.6rem 2.6rem 0.6rem 1.2rem;
  border-radius: 2rem;
  border: 1px solid ${(p) => (p.$s === 'cancelled' ? 'rgba(var(--ink), 0.25)' : 'transparent')};
  appearance: none;
  cursor: pointer;
  color: ${(p) => (p.$s === 'cancelled' || p.$s === 'completed' ? 'rgb(var(--ink))' : 'rgb(var(--bg))')};
  background: ${(p) => (p.$s === 'cancelled' ? 'transparent' : p.$s === 'completed' ? 'rgba(var(--ink), 0.12)' : STATUS_COLOR[p.$s] ?? 'rgba(var(--ink), 0.3)')}
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23888' stroke-width='1.5'/%3E%3C/svg%3E")
    no-repeat right 1rem center;

  &:disabled {
    opacity: 0.6;
  }
  option {
    color: rgb(var(--ink));
    background: rgb(var(--bg));
  }
`;

export const Pill = styled.span`
  display: inline-block;
  margin-left: 0.6rem;
  padding: 0.1rem 0.7rem;
  border-radius: 1rem;
  font-size: 1.15rem;
  font-weight: 400;
  background: rgba(var(--ink), 0.06);
  color: rgba(var(--ink), 0.75);
  vertical-align: middle;
`;

export const fmtDate = (iso: string) => new Date(iso).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });

type NavKey = 'orders' | 'customers' | 'payments' | 'stats' | 'utm' | 'users' | 'compatibility' | 'site' | 'settings';

export function AdminNav({ base, session, active, title }: { base: string; session: AdminSession; active: NavKey; title: string }) {
  const router = useRouter();
  async function logout() {
    await fetch(`${base}/api/logout`, { method: 'POST' });
    router.replace(`${base}/login`);
  }
  const link = (key: NavKey, href: string, label: string) => (
    <NextLink href={href} aria-current={active === key ? 'page' : undefined}>
      {label}
    </NextLink>
  );
  return (
    <>
      <AdminHeader>
        <Brand href={base || '/'}>
          <Image src="/webp/Logo.webp" alt="" width={26} height={26} />
          RailGuard
        </Brand>
        <Links aria-label="Разделы админки">
          {link('orders', base || '/', 'Заказы')}
          {link('customers', `${base}/customers`, 'Покупатели')}
          {link('payments', `${base}/payments`, 'Оплата')}
          {link('stats', `${base}/stats`, 'Статистика')}
          {link('site', `${base}/site`, 'Сайт')}
          {link('compatibility', `${base}/compatibility`, 'Совместимость')}
          {link('utm', `${base}/utm`, 'UTM')}
          {session.role === 'admin' && link('users', `${base}/users`, 'Пользователи')}
          {link('settings', `${base}/settings`, 'Настройки')}
        </Links>
        <User>
          <i aria-hidden="true">{session.user.slice(0, 1)}</i>
          <span>{session.user}</span>
          <button type="button" onClick={logout}>
            Выйти
          </button>
        </User>
      </AdminHeader>
      <Title>{title}</Title>
    </>
  );
}
