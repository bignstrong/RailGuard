import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { AdminNav, AdminPage, Btn, Card, Input, Select, Table } from 'components/AdminUi';
import { adminBase, getAdminSession } from 'lib/adminAuth';
import type { AdminSession } from 'lib/adminSession';
import { CHANNEL_LABEL, channelOf } from 'lib/attribution';

// Шаблоны меток: source/medium согласованы с каналами lib/attribution.ts (medium определяет канал в статистике).
const PRESETS = [
  { name: 'Telegram-канал', source: 'telegram', medium: 'social' },
  { name: 'Авито', source: 'avito', medium: 'classified' },
  { name: 'Дром', source: 'drom', medium: 'classified' },
  { name: 'Форум (drive2 и др.)', source: 'drive2', medium: 'forum' },
  { name: 'Письмо СТО', source: 'sto', medium: 'email' },
  { name: 'YouTube', source: 'youtube', medium: 'social' },
  { name: 'Дзен', source: 'dzen', medium: 'social' },
  // Макросы Директа подставляет сам Директ: https://yandex.ru/support/direct/statistics/url-tags.html
  { name: 'Яндекс Директ', source: 'yandex', medium: 'cpc', campaign: '{campaign_id}', content: '{ad_id}', term: '{keyword}' },
];

type Props = { base: string; session: AdminSession; site: string };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const base = adminBase();
  const session = await getAdminSession(ctx);
  if (!session) return { redirect: { destination: `${base}/login`, permanent: false } };
  return { props: { base, session, site: 'https://railguard.ru' } };
};

export default function AdminUtm({ base, session, site }: Props) {
  const [f, setF] = useState({ page: '/', source: 'telegram', medium: 'social', campaign: '', content: '', term: '' });
  const [copied, setCopied] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value.trim() });

  const url = new URL(f.page.startsWith('/') ? f.page : `/${f.page}`, site);
  (['source', 'medium', 'campaign', 'content', 'term'] as const).forEach((k) => f[k] && url.searchParams.set(`utm_${k}`, f[k].toLowerCase().includes('{') ? f[k] : f[k].toLowerCase()));
  // Фигурные скобки макросов Директа оставляем как есть, иначе Директ их не распознает.
  const link = url.toString().replace(/%7B/g, '{').replace(/%7D/g, '}');
  const channel = CHANNEL_LABEL[channelOf({ source: f.source, medium: f.medium || '(none)', landing: '/', at: '' })];

  return (
    <AdminPage>
      <Head>
        <title>UTM</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminNav base={base} session={session} active="utm" title="Генератор UTM-ссылок" />
      <Card>
        <p>
          Шаблон:{' '}
          <Select
            onChange={(e) => {
              const p = PRESETS[Number(e.target.value)];
              if (p) setF({ ...f, source: p.source, medium: p.medium, campaign: p.campaign ?? '', content: p.content ?? '', term: p.term ?? '' });
            }}
            defaultValue="0"
          >
            {PRESETS.map((p, i) => (
              <option key={p.name} value={i}>
                {p.name}
              </option>
            ))}
          </Select>
        </p>
        <Table>
          <tbody>
            {(
              [
                ['page', 'Страница', '/pricing/profi-start-kit'],
                ['source', 'utm_source — площадка', 'avito'],
                ['medium', 'utm_medium — тип канала', 'classified'],
                ['campaign', 'utm_campaign — кампания', 'start_kit_sep'],
                ['content', 'utm_content — объявление/пост', 'post_1'],
                ['term', 'utm_term — ключевая фраза', ''],
              ] as const
            ).map(([k, label, ph]) => (
              <tr key={k}>
                <td>{label}</td>
                <td>
                  <Input value={f[k]} onChange={set(k)} placeholder={ph} style={{ width: '100%' }} />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <p style={{ wordBreak: 'break-all', marginTop: '1.6rem' }}>
          <b>{link}</b>
        </p>
        <p style={{ opacity: 0.7 }}>В статистике попадёт в канал «{channel}». Латиница, без пробелов; одна кампания — одно название.</p>
        <Btn type="button" onClick={() => navigator.clipboard?.writeText(link).then(() => setCopied(true))}>
          {copied ? 'Скопировано' : 'Скопировать'}
        </Btn>
      </Card>
    </AdminPage>
  );
}
