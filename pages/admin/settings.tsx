import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { FormEvent, useState } from 'react';
import { AdminNav, AdminPage, Btn, Card, Input } from 'components/AdminUi';
import { adminBase, getAdminSession } from 'lib/adminAuth';
import type { AdminSession } from 'lib/adminSession';
import prisma from 'lib/prisma';

type Props = { base: string; session: AdminSession; totpEnabled: boolean };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const base = adminBase();
  const session = await getAdminSession(ctx);
  if (!session) return { redirect: { destination: `${base}/login`, permanent: false } };
  const u = await prisma.adminUser.findUnique({ where: { login: session.user }, select: { totpEnabled: true } });
  return { props: { base, session, totpEnabled: !!u?.totpEnabled } };
};

export default function AdminSettings({ base, session, totpEnabled: initial }: Props) {
  const [totpEnabled, setTotpEnabled] = useState(initial);
  const [setup, setSetup] = useState<{ totpSecret: string; otpauth: string } | null>(null);
  const [code, setCode] = useState('');
  const [disablePw, setDisablePw] = useState('');
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

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
      {msg && <p style={{ color: msg.ok ? 'rgb(var(--success))' : 'rgb(var(--error))' }}>{msg.text}</p>}

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
              <Btn type="button" onClick={() => setSetup(null)} style={{ background: 'transparent', color: 'inherit', border: '1px solid currentColor' }}>
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
    </AdminPage>
  );
}
