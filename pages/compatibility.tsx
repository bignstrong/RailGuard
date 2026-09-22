import type { GetServerSideProps } from 'next';
import NextLink from 'next/link';
import styled from 'styled-components';
import Page from 'components/Page';
import prisma from 'lib/prisma';
import { media } from 'utils/media';

type Row = { brand: string; model: string; engine: string; years: string | null; note: string | null };
type Props = { published: boolean; rows: Row[] };

// Таблица живёт в БД и публикуется тумблером в админке. Страница есть всегда: пока список не готов — заглушка.
export const getServerSideProps: GetServerSideProps<Props> = async ({ res }) => {
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  const flag = await prisma.setting.findUnique({ where: { key: 'compatibility' } });
  const published = flag?.value === 'on';
  const rows = published
    ? await prisma.vehicle.findMany({
        orderBy: [{ brand: 'asc' }, { model: 'asc' }, { engine: 'asc' }],
        select: { brand: true, model: true, engine: true, years: true, note: true },
      })
    : [];
  return { props: { published, rows } };
};

export default function CompatibilityPage({ published, rows }: Props) {
  const brands = [...new Set(rows.map((r) => r.brand))];
  return (
    <Page
      title="Совместимость"
      description="На какие двигатели Common Rail ставится фильтр RailGuard"
      canonical="https://railguard.ru/compatibility"
    >
      <Intro>
        RailGuard подходит для большинства двигателей Common Rail объёмом до 2,7 л. Резьба подключения M14×1,5, по заказу M12×1,5. Если
        вашего двигателя нет в списке — напишите нам, уточним по каталожному номеру ТНВД.
      </Intro>

      {!published || rows.length === 0 ? (
        <Placeholder>
          <b>Список двигателей готовится.</b> Совместимость проверяем по каждому мотору вместе с технологом, поэтому публикуем только
          подтверждённые позиции. Пока — спросите менеджера: <NextLink href="/delivery#contacts">контакты</NextLink>.
        </Placeholder>
      ) : (
        brands.map((brand) => (
          <Group key={brand}>
            <h2>{brand}</h2>
            <Table>
              <thead>
                <tr>
                  <th>Модель</th>
                  <th>Двигатель</th>
                  <th>Годы</th>
                  <th>Примечание</th>
                </tr>
              </thead>
              <tbody>
                {rows
                  .filter((r) => r.brand === brand)
                  .map((r, i) => (
                    <tr key={i}>
                      <td>{r.model}</td>
                      <td>{r.engine}</td>
                      <td>{r.years || '—'}</td>
                      <td>{r.note || 'Подходит'}</td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          </Group>
        ))
      )}
    </Page>
  );
}

const Intro = styled.p`
  max-width: 80rem;
  margin: 0 auto 5rem;
  font-size: 1.8rem;
  line-height: 1.6;
  color: rgba(var(--ink), 0.8);
  text-align: center;
`;

const Placeholder = styled.p`
  max-width: 70rem;
  margin: 0 auto;
  padding: 3rem;
  border: 2px solid rgb(var(--accent));
  border-radius: 0.4rem;
  font-size: 1.7rem;
  line-height: 1.6;
  text-align: center;

  a {
    color: rgb(var(--accent));
    border-bottom: 1px solid currentColor;
  }
`;

const Group = styled.section`
  max-width: 90rem;
  margin: 0 auto 5rem;

  h2 {
    font-size: 2.6rem;
    margin-bottom: 1.6rem;
    padding-bottom: 0.8rem;
    border-bottom: 3px solid rgb(var(--accent));
    display: inline-block;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 1.6rem;

  th,
  td {
    padding: 1.2rem 1.4rem;
    border-bottom: var(--line);
    text-align: left;
    vertical-align: top;
  }
  th {
    font-size: 1.3rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: rgba(var(--ink), 0.6);
  }

  ${media('<=tablet')} {
    thead {
      display: none;
    }
    tr {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.4rem 1.2rem;
      padding: 1.2rem 0;
      border-bottom: var(--line);
    }
    td {
      padding: 0;
      border: 0;
    }
    td:first-child {
      grid-column: 1 / -1;
      font-weight: 700;
    }
  }
`;
