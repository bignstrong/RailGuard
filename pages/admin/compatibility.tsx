import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { FormEvent, useState } from 'react';
import { AdminNav, AdminPage, Btn, Card, Input, Table, Toolbar } from 'components/AdminUi';
import { adminBase, getAdminSession } from 'lib/adminAuth';
import type { AdminSession } from 'lib/adminSession';
import prisma from 'lib/prisma';

type Vehicle = { id: string; brand: string; model: string; engine: string; years: string | null; note: string | null; createdAt: string };
type Props = { base: string; session: AdminSession; vehicles: Vehicle[]; published: boolean };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const base = adminBase();
  const session = await getAdminSession(ctx);
  if (!session) return { redirect: { destination: `${base}/login`, permanent: false } };
  const vehicles = await prisma.vehicle.findMany({ orderBy: [{ brand: 'asc' }, { model: 'asc' }] });
  const setting = await prisma.setting.findUnique({ where: { key: 'compatibility' } });
  return {
    props: {
      base,
      session,
      vehicles: vehicles.map((v) => ({
        id: v.id,
        brand: v.brand,
        model: v.model,
        engine: v.engine,
        years: v.years,
        note: v.note,
        createdAt: v.createdAt.toISOString(),
      })),
      published: setting?.value === 'on',
    },
  };
};

export default function AdminCompatibility({ base, session, vehicles: initial, published: initialPublished }: Props) {
  const [vehicles, setVehicles] = useState(initial);
  const [published, setPublished] = useState(initialPublished);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [engine, setEngine] = useState('');
  const [years, setYears] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const api = (path: string, init: RequestInit) => fetch(`${base}/api/vehicles${path}`, { ...init, headers: { 'Content-Type': 'application/json' } });

  async function togglePublished() {
    const res = await api('', { method: 'PUT', body: JSON.stringify({ published: !published }) });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return alert(data.message || 'Ошибка');
    }
    setPublished(!published);
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    setError('');
    const res = await api('', {
      method: 'POST',
      body: JSON.stringify({
        brand,
        model,
        engine,
        years: years || undefined,
        note: note || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.message || 'Ошибка');
    setVehicles((list) => [{ id: data.id, brand, model, engine, years: data.years, note: data.note, createdAt: data.createdAt }, ...list]);
    setBrand('');
    setModel('');
    setEngine('');
    setYears('');
    setNote('');
  }

  async function remove(v: Vehicle) {
    if (!window.confirm(`Удалить ${v.brand} ${v.model}?`)) return;
    const res = await api('', { method: 'DELETE', body: JSON.stringify({ id: v.id }) });
    if (!res.ok) return alert('Не удалось удалить');
    setVehicles((list) => list.filter((x) => x.id !== v.id));
  }

  return (
    <AdminPage>
      <Head>
        <title>Совместимость</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminNav base={base} session={session} active="compatibility" title="Совместимость" />

      <Card>
        <h2>Страница /compatibility</h2>
        <p>Статус: {published ? 'опубликована' : 'скрыта (на сайте показывается заглушка «список готовится»)'}</p>
        <p style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
          <Btn type="button" onClick={togglePublished}>
            {published ? 'Скрыть' : 'Опубликовать'}
          </Btn>
          <a href="/compatibility" target="_blank" rel="noreferrer">
            Открыть страницу
          </a>
        </p>
      </Card>

      <Card>
        <h2>Добавить двигатель</h2>
        <Toolbar onSubmit={create}>
          <Input placeholder="Марка" value={brand} onChange={(e) => setBrand(e.target.value)} required />
          <Input placeholder="Модель" value={model} onChange={(e) => setModel(e.target.value)} required />
          <Input placeholder="Двигатель" value={engine} onChange={(e) => setEngine(e.target.value)} required />
          <Input placeholder="Годы (необязательно)" value={years} onChange={(e) => setYears(e.target.value)} />
          <Input placeholder="Примечание (например «резьба M12×1,5»)" value={note} onChange={(e) => setNote(e.target.value)} />
          <Btn type="submit">Добавить</Btn>
        </Toolbar>
        {error && <p style={{ color: 'rgb(var(--accent))' }}>{error}</p>}
      </Card>

      {vehicles.length === 0 ? (
        <Card>
          <p>Пока пусто. Добавьте первый двигатель.</p>
        </Card>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Марка</th>
              <th>Модель</th>
              <th>Двигатель</th>
              <th>Годы</th>
              <th>Примечание</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id}>
                <td>{v.brand}</td>
                <td>{v.model}</td>
                <td>{v.engine}</td>
                <td>{v.years || '—'}</td>
                <td>{v.note || '—'}</td>
                <td>
                  <Btn type="button" $danger onClick={() => remove(v)}>
                    Удалить
                  </Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </AdminPage>
  );
}
