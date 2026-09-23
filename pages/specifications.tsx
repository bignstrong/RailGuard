import Image from 'next/image';
import styled from 'styled-components';
import BasicCard from 'components/BasicCard';
import Page from 'components/Page';
import RichText from 'components/RichText';
import { useLightbox } from 'contexts/lightbox.context';
import { media } from 'utils/media';

export const SPEC_SECTIONS = [
  {
    id: 'filter-body',
    title: 'Корпус фильтра',
    images: ['/webp/corpus.webp', '/webp/corpus_2.webp'],
    specs: [
      ['Материал корпуса', 'Сталь'],
      ['Габариты', '120×35 мм'],
      ['Вес', '430 г'],
      ['Резьба', 'M14×1,5 (M12×1,5 опц.)'],
      ['Давление опрессовки', '180 МПа (1800 бар)'],
      ['Монтаж', 'Жёсткая фиксация к двигателю'],
    ],
  },
  {
    id: 'filter-element',
    title: 'Фильтрующий элемент',
    images: ['/webp/element_2.webp', '/webp/element.webp', '/webp/element_3.webp'],
    specs: [
      ['Тип системы', 'Common Rail'],
      ['Тонкость фильтрации', '8–12 мкм'],
      ['Площадь фильтрации', '≈2000 мм²'],
      ['Применение', 'Двигатели до 2,7 л'],
      ['Обслуживание', 'Менять с основным фильтром'],
      ['Особенности', 'Каждый фильтр опрессован'],
    ],
  },
];

export default function SpecificationsPage() {
  const { open } = useLightbox();
  return (
    <Page
      title="Характеристики"
      description="Технические характеристики и преимущества фильтра высокого давления Common Rail"
      canonical="https://railguard.ru/specifications"
    >
      {SPEC_SECTIONS.map((s) => (
        <Section key={s.id} id={s.id}>
          <Title>{s.title}</Title>
          <Grid>
            <Gallery>
              {s.images.map((src, i) => (
                <Thumb key={src} type="button" onClick={() => open(s.images, i)} aria-label={`${s.title}, фото ${i + 1}`}>
                  <Image src={src} alt={`${s.title} — фото ${i + 1}`} fill sizes="(max-width: 768px) 50vw, 25vw" style={{ objectFit: 'contain' }} />
                </Thumb>
              ))}
            </Gallery>
            <Specs>
              {s.specs.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </Specs>
          </Grid>
        </Section>
      ))}

      <Section>
        <Title>Описание и назначение</Title>
        <BasicCard as={RichText}>
          <h3>Что это и где ставится</h3>
          <p>
            Фильтр устанавливают на двигатели Common Rail между ТНВД и рампой форсунок, сразу после основного фильтра. Он задерживает
            металлическую стружку от ТНВД/ТННД и мелкий абразив, прошедший через основной фильтр.
          </p>
          <h3>Как обслуживать</h3>
          <ul>
            <li>Менять фильтрующий элемент одновременно с основным топливным фильтром при каждом ТО.</li>
            <li>Устанавливать по стрелке направления потока топлива.</li>
            <li>Жёстко фиксировать корпус к двигателю, чтобы вибрация не повредила магистраль.</li>
          </ul>
          <h3>Прочее</h3>
          <ul>
            <li>Подходит почти ко всем моторам Common Rail независимо от марки автомобиля.</li>
            <li>Остальные вопросы — нашему менеджеру.</li>
          </ul>
        </BasicCard>
      </Section>
    </Page>
  );
}

const Section = styled.section`
  scroll-margin-top: 8rem;

  & + & {
    margin-top: 10rem;
  }

  h3 {
    font-size: 2rem;
    color: rgb(var(--ink));
    margin: 2.4rem 0 0.8rem;

    &:first-child {
      margin-top: 0;
    }
  }
`;

const Title = styled.h2`
  font-size: 3.2rem;
  font-weight: 700;
  margin-bottom: 3rem;
  padding-bottom: 1.2rem;
  border-bottom: 3px solid rgb(var(--accent));
  display: inline-block;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: start;

  ${media('<=tablet')} {
    grid-template-columns: 1fr;
  }
`;

const Gallery = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;

  & > :first-child {
    grid-column: 1 / -1;
    height: 36rem;
  }
`;

const Thumb = styled.button`
  position: relative;
  height: 18rem;
  border: var(--line);
  border-radius: 0.4rem;
  background: none;
  cursor: zoom-in;

  &:hover {
    border-color: rgb(var(--accent));
  }
`;

const Specs = styled.dl`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  div {
    display: flex;
    justify-content: space-between;
    gap: 2rem;
    padding: 1.2rem 1.6rem;
    border: var(--line);
    border-radius: 0.4rem;
    font-size: 1.6rem;
  }
  dt {
    font-weight: 700;
  }
  dd {
    text-align: right;
  }
`;
