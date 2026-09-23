import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { FormEvent, useState } from 'react';
import { AdminNav, AdminPage, Btn, Card, fmtDate, Input, Table } from 'components/AdminUi';
import { adminBase, getAdminSession } from 'lib/adminAuth';
import { type AdminSession, SESSION_TTL_SEC } from 'lib/adminSession';
import prisma from 'lib/prisma';

type LoginRow = { id: string; login: string; ok: boolean; ip: string; lastIp: string; ua: string; createdAt: string; lastSeenAt: string; state: 'active' | 'revoked' | 'expired' | 'failed'; newIp: boolean };
type Props = { base: string; session: AdminSession; totpEnabled: boolean; logins: LoginRow[] };

// Браузер и ОС из User-Agent — только для глаз, полный UA в подсказке.
function uaShort(ua: string): string {
  const b = /YaBrowser/.test(ua) ? 'Яндекс Браузер' : /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : /curl|python|Go-http|bot/i.test(ua) ? 'скрипт/бот' : '?';
  const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
  return os ? `${b}, ${os}` : b;
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const base = adminBase();
  const session = await getAdminSession(ctx);
  if (!session) return { redirect: { destination: `${base}/login`, permanent: false } };
  const [u, rows] = await Promise.all([
    prisma.adminUser.findUnique({ where: { login: session.user }, select: { totpEnabled: true } }),
    // admin видит входы всех пользователей, manager — только свои
    prisma.adminLogin.findMany({ where: session.role === 'admin' ? {} : { login: session.user }, orderBy: { createdAt: 'desc' }, take: 100 }),
  ]);
  const now = Date.now();
  const logins: LoginRow[] = rows.map((r, i) => ({
    id: r.id,
    login: r.login,
    ok: r.ok,
    ip: r.ip,
    lastIp: r.lastIp ?? r.ip,
    ua: r.userAgent,
    createdAt: r.createdAt.toISOString(),
    lastSeenAt: (r.lastSeenAt ?? r.createdAt).toISOString(),
    state: !r.ok ? 'failed' : r.revokedAt ? 'revoked' : now - r.createdAt.getTime() > SESSION_TTL_SEC * 1000 ? 'expired' : 'active',
    // успешный вход с IP, которого нет в более старых успешных входах этого пользователя (в пределах выборки)
    newIp: r.ok && !rows.slice(i + 1).some((o) => o.ok && o.login === r.login && o.ip === r.ip) && rows.slice(i + 1).some((o) => o.ok && o.login === r.login),
  }));
  return { props: { base, session, totpEnabled: !!u?.totpEnabled, logins } };
};

export default function AdminSettings({ base, session, totpEnabled: initial, logins: initialLogins }: Props) {
  const [totpEnabled, setTotpEnabled] = useState(initial);
  const [setup, setSetup] = useState<{ totpSecret: string; otpauth: string } | null>(null);
  const [code, setCode] = useState('');
  const [disablePw, setDisablePw] = useState('');
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [logins, setLogins] = useState(initialLogins);

  async function call(body: Record<string, unknown>) {
    const res = await fetch(`${base}/api/settings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setMsg({ ok: false, text: data.message || 'Ошибка' });
    return res.ok ? data : null;
  }
  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (await call({ action: 'password', current: cur, next })) {
      setMsg({ ok: true, text: 'Пароль изменён' });
      setCur('');
      setNext('');
    }
  }
  async function startTotp() {
    setMsg(null);
    const d = await call({ action: 'totp-setup' });
    if (d) setSetup(d);
  }
  async function confirmTotp(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (await call({ action: 'totp-enable', code })) {
      setTotpEnabled(true);
      setSetup(null);
      setCode('');
      setMsg({ ok: true, text: 'Двухфакторная защита включена. При входе понадобится код из приложения.' });
    }
  }
  async function revoke(id: string) {
    setMsg(null);
    if (await call({ action: 'revoke', id })) setLogins((l) => l.map((r) => (r.id === id ? { ...r, state: 'revoked' } : r)));
  }
  async function revokeOthers() {
    setMsg(null);
    if (await call({ action: 'revoke-others' })) {
      setLogins((l) => l.map((r) => (r.login === session.user && r.state === 'active' && r.id !== session.sid ? { ...r, state: 'revoked' } : r)));
      setMsg({ ok: true, text: 'Остальные сессии завершены' });
    }
  }
  async function disableTotp(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (await call({ action: 'totp-disable', password: disablePw })) {
      setTotpEnabled(false);
      setDisablePw('');
      setMsg({ ok: true, text: 'Двухфакторная защита выключена' });
    }
  }

  return (
    <AdminPage style={{ maxWidth: '72rem' }}>
      <Head>
        <title>Настройки</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminNav base={base} session={session} active="settings" title="Настройки" />
      {msg && <p style={{ color: msg.ok ? 'rgb(var(--ink))' : 'rgb(var(--accent))' }}>{msg.text}</p>}

      <Card>
        <h2>Двухфакторная защита (TOTP)</h2>
        <p>
          Сейчас: <b>{totpEnabled ? 'включена' : 'выключена'}</b>. Код из Google Authenticator / Яндекс Ключ спрашивается при каждом входе.
        </p>
        {!totpEnabled && !setup && (
          <Btn type="button" onClick={startTotp}>
            Включить
          </Btn>
        )}
        {!totpEnabled && setup && (
          <form onSubmit={confirmTotp}>
            <p>
              1. Добавь в приложение вручную секрет <code>{setup.totpSecret}</code>
              <br />
              или ссылкой: <code style={{ wordBreak: 'break-all' }}>{setup.otpauth}</code>
            </p>
            <p>2. Введи код из приложения, чтобы подтвердить:</p>
            <p style={{ display: 'flex', gap: '0.8rem' }}>
              <Input inputMode="numeric" maxLength={6} placeholder="000000" value={code} onChange={(e) => setCode(e.target.value)} required style={{ minWidth: '12rem' }} />
              <Btn type="submit">Подтвердить</Btn>
              <Btn type="button" onClick={() => setSetup(null)} style={{ background: 'transparent', color: 'rgb(var(--ink))', border: '1px solid rgba(var(--ink), 0.3)' }}>
                Отмена
              </Btn>
            </p>
          </form>
        )}
        {totpEnabled && (
          <form onSubmit={disableTotp} style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
            <Input type="password" autoComplete="current-password" placeholder="Пароль для подтверждения" value={disablePw} onChange={(e) => setDisablePw(e.target.value)} required />
            <Btn type="submit" $danger>
              Выключить
            </Btn>
          </form>
        )}
      </Card>

      <Card as="form" onSubmit={changePassword}>
        <h2>Сменить пароль</h2>
        <p>
          <Input type="password" autoComplete="current-password" placeholder="Текущий пароль" value={cur} onChange={(e) => setCur(e.target.value)} required style={{ width: '100%' }} />
        </p>
        <p>
          <Input type="password" autoComplete="new-password" placeholder="Новый пароль (12+ символов)" value={next} onChange={(e) => setNext(e.target.value)} required minLength={12} style={{ width: '100%' }} />
        </p>
        <Btn type="submit">Сохранить</Btn>
      </Card>

      <Card>
        <h2>Сессии и входы</h2>
        <p>
          Последние 100 входов{session.role === 'admin' ? ' всех пользователей' : ''}, хранятся 90 дней. Незнакомый IP или браузер — завершите сессию и смените пароль. При смене пароля остальные ваши сессии завершаются сами.
        </p>
        <p>
          <Btn type="button" onClick={revokeOthers}>
            Завершить все мои сессии, кроме этой
          </Btn>
        </p>
        <div style={{ overflowX: 'auto' }}>
          <Table>
            <thead>
              <tr>
                <th>Вход</th>
                <th>Пользователь</th>
                <th>IP</th>
                <th>Браузер</th>
                <th>Статус</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {logins.map((r) => (
                <tr key={r.id} style={r.state === 'failed' ? { opacity: 0.75 } : undefined}>
                  <td>{fmtDate(r.createdAt)}</td>
                  <td>{r.login}</td>
                  <td>
                    {r.ip}
                    {r.lastIp !== r.ip && <div style={{ opacity: 0.7 }}>сейчас: {r.lastIp}</div>}
                    {r.newIp && <div style={{ color: 'rgb(var(--accent))' }}>новый IP</div>}
                  </td>
                  <td title={r.ua}>{uaShort(r.ua)}</td>
                  <td>
                    {r.id === session.sid
                      ? 'это вы'
                      : { active: `активна, был ${fmtDate(r.lastSeenAt)}`, revoked: 'завершена', expired: 'истекла', failed: 'неудачная попытка' }[r.state]}
                  </td>
                  <td>
                    {r.state === 'active' && r.id !== session.sid && (
                      <Btn type="button" $danger onClick={() => revoke(r.id)}>
                        Завершить
                      </Btn>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>
    </AdminPage>
  );
}
