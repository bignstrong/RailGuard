import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { FormEvent, useState } from 'react';
import { AdminNav, AdminPage, Btn, Card, fmtDate, Input, Select, Table, Toolbar } from 'components/AdminUi';
import { adminBase, getAdminSession, OWNER_LOGIN } from 'lib/adminAuth';
import type { AdminSession } from 'lib/adminSession';
import prisma from 'lib/prisma';

type User = { id: string; login: string; role: string; disabled: boolean; totpEnabled: boolean; createdAt: string; lastLoginAt: string | null };
type Props = { base: string; session: AdminSession; users: User[]; owner: string };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const base = adminBase();
  const session = await getAdminSession(ctx);
  if (!session) return { redirect: { destination: `${base}/login`, permanent: false } };
  if (session.role !== 'admin') return { redirect: { destination: base || '/', permanent: false } };
  const users = await prisma.adminUser.findMany({ orderBy: { createdAt: 'asc' } });
  return {
    props: {
      base,
      session,
      owner: OWNER_LOGIN,
      users: users.map((u) => ({
        id: u.id,
        login: u.login,
        role: u.role,
        disabled: u.disabled,
        totpEnabled: u.totpEnabled,
        createdAt: u.createdAt.toISOString(),
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      })),
    },
  };
};

type Secret = { login: string; password: string };

export default function AdminUsers({ base, session, users: initial, owner }: Props) {
  const [users, setUsers] = useState(initial);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'manager'>('manager');
  const [error, setError] = useState('');
  const [secret, setSecret] = useState<Secret | null>(null);

  const api = (path: string, init: RequestInit) => fetch(`${base}/api/users${path}`, { ...init, headers: { 'Content-Type': 'application/json' } });

  async function create(e: FormEvent) {
    e.preventDefault();
    setError('');
    const res = await api('', { method: 'POST', body: JSON.stringify({ login, password, role }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.message || 'Ошибка');
    setUsers((u) => [...u, { id: data.id, login, role, disabled: false, totpEnabled: false, createdAt: new Date().toISOString(), lastLoginAt: null }]);
    setSecret({ login, password });
    setLogin('');
    setPassword('');
  }
  async function patch(u: User, body: Record<string, unknown>) {
    const res = await api(`/${u.id}`, { method: 'PATCH', body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return alert(data.message || 'Ошибка');
    setUsers((list) =>
      list.map((x) =>
        x.id === u.id
          ? { ...x, ...('role' in body ? { role: body.role as string } : {}), ...('disabled' in body ? { disabled: body.disabled as boolean } : {}), ...('resetTotp' in body ? { totpEnabled: false } : {}) }
          : x,
      ),
    );
  }
  async function remove(u: User) {
    if (!window.confirm(`Удалить пользователя ${u.login}?`)) return;
    const res = await api(`/${u.id}`, { method: 'DELETE' });
    if (!res.ok) return alert('Не удалось удалить');
    setUsers((list) => list.filter((x) => x.id !== u.id));
  }
  function resetPassword(u: User) {
    const pw = window.prompt(`Новый пароль для ${u.login} (не короче 12 символов):`);
    if (pw) patch(u, { password: pw });
  }

  return (
    <AdminPage>
      <Head>
        <title>Пользователи</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminNav base={base} session={session} active="users" title="Пользователи" />

      {secret && (
        <Card style={{ borderLeft: '4px solid rgb(var(--primary))' }}>
          <h2>Пароль для {secret.login} — показывается один раз</h2>
          <p>
            <code>{secret.password}</code>
          </p>
          <p style={{ opacity: 0.7 }}>Двухфакторную защиту пользователь включает сам в «Настройках».</p>
          <p>
            <Btn type="button" onClick={() => setSecret(null)}>
              Скрыть
            </Btn>
          </p>
        </Card>
      )}

      <Card>
        <h2>Новый пользователь</h2>
        <Toolbar onSubmit={create}>
          <Input placeholder="Логин" value={login} onChange={(e) => setLogin(e.target.value)} required minLength={3} />
          <Input type="text" placeholder="Пароль (12+ символов)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={12} autoComplete="off" />
          <Select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'manager')}>
            <option value="manager">Менеджер</option>
            <option value="admin">Администратор</option>
          </Select>
          <Btn type="submit">Создать</Btn>
        </Toolbar>
        {error && <p style={{ color: 'rgb(var(--error))' }}>{error}</p>}
        <p style={{ opacity: 0.7 }}>Менеджер: заказы, статистика, экспорт. Администратор: плюс удаление заказов и пользователи.</p>
      </Card>

      <Table>
        <thead>
          <tr>
            <th>Логин</th>
            <th>Роль</th>
            <th>2FA</th>
            <th>Создан</th>
            <th>Последний вход</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} style={{ opacity: u.disabled ? 0.5 : 1 }}>
              <td>
                {u.login} {u.login === owner && <small>(владелец)</small>} {u.disabled && <small>(отключён)</small>}
              </td>
              <td>
                <Select value={u.role} onChange={(e) => patch(u, { role: e.target.value })} disabled={u.login === session.user || u.login === owner}>
                  <option value="manager">Менеджер</option>
                  <option value="admin">Администратор</option>
                </Select>
              </td>
              <td>{u.totpEnabled ? 'вкл' : 'выкл'}</td>
              <td>{fmtDate(u.createdAt)}</td>
              <td>{u.lastLoginAt ? fmtDate(u.lastLoginAt) : 'ещё не входил'}</td>
              <td style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <Btn type="button" onClick={() => resetPassword(u)}>
                  Пароль
                </Btn>
                <Btn type="button" onClick={() => patch(u, { resetTotp: true })} disabled={!u.totpEnabled}>
                  Выключить 2FA
                </Btn>
                <Btn type="button" onClick={() => patch(u, { disabled: !u.disabled })} disabled={u.login === session.user || u.login === owner}>
                  {u.disabled ? 'Включить' : 'Отключить'}
                </Btn>
                <Btn type="button" $danger onClick={() => remove(u)} disabled={u.login === session.user || u.login === owner}>
                  Удалить
                </Btn>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </AdminPage>
  );
}
