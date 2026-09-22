import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FormEvent, useState } from 'react';
import { AdminPage, Btn, Card, Input } from 'components/AdminUi';
import { adminBase, getAdminSession } from 'lib/adminAuth';

type Props = { base: string };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const base = adminBase();
  if (await getAdminSession(ctx)) return { redirect: { destination: base || '/', permanent: false } };
  return { props: { base } };
};

export default function AdminLogin({ base }: Props) {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [needCode, setNeedCode] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${base}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password, code }),
      });
      if (res.ok) {
        router.replace(base);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data.needCode) {
        setNeedCode(true);
        setError(code ? data.message : '');
        return;
      }
      setError(data.message || 'Ошибка входа');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminPage style={{ maxWidth: '44rem', paddingTop: '8rem' }}>
      <Head>
        <title>Вход</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <Card as="form" onSubmit={onSubmit}>
        <h2>Админка RailGuard</h2>
        <p>
          <Input type="text" autoComplete="username" placeholder="Логин" value={login} onChange={(e) => setLogin(e.target.value)} required style={{ width: '100%' }} />
        </p>
        <p>
          <Input type="password" autoComplete="current-password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%' }} />
        </p>
        {needCode && (
          <p>
            <Input type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="Код из приложения (6 цифр)" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} autoFocus required style={{ width: '100%' }} />
          </p>
        )}
        {error && <p style={{ color: 'rgb(var(--accent))' }}>{error}</p>}
        <Btn type="submit" disabled={busy}>
          Войти
        </Btn>
      </Card>
    </AdminPage>
  );
}
