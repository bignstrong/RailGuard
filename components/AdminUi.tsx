import NextLink from 'next/link';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import type { AdminSession } from 'lib/adminSession';

// Минимальный UI админки. Без сайта вокруг: _app рендерит /admin/* голыми.
export const AdminPage = styled.main`
  max-width: 120rem;
  margin: 0 auto;
  padding: 2rem 1.6rem 6rem;
  font-size: 1.5rem;
  color: rgb(var(--ink));
`;

export const AdminHeader = styled.header`
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;

  h1 {
    font-size: 2.4rem;
    margin: 0;
  }
  nav {
    display: flex;
    gap: 1.6rem;
    align-items: center;
  }
  a {
    color: rgb(var(--accent));
  }
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

export const fmtDate = (iso: string) => new Date(iso).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });

type NavKey = 'orders' | 'stats' | 'utm' | 'users' | 'compatibility' | 'site' | 'settings';

export function AdminNav({ base, session, active, title }: { base: string; session: AdminSession; active: NavKey; title: string }) {
  const router = useRouter();
  async function logout() {
    await fetch(`${base}/api/logout`, { method: 'POST' });
    router.replace(`${base}/login`);
  }
  const link = (key: NavKey, href: string, label: string) => (active === key ? <b>{label}</b> : <NextLink href={href}>{label}</NextLink>);
  return (
    <AdminHeader>
      <h1>{title}</h1>
      <nav>
        {link('orders', base || '/', 'Заказы')}
        {link('site', `${base}/site`, 'Сайт')}
        {link('stats', `${base}/stats`, 'Статистика')}
        {link('utm', `${base}/utm`, 'UTM')}
        {session.role === 'admin' && link('users', `${base}/users`, 'Пользователи')}
        {link('compatibility', `${base}/compatibility`, 'Совместимость')}
        {link('settings', `${base}/settings`, 'Настройки')}
        <span style={{ opacity: 0.7 }}>{session.user}</span>
        <Btn type="button" onClick={logout}>
          Выйти
        </Btn>
      </nav>
    </AdminHeader>
  );
}
