import Head from 'next/head';
import Image from 'next/image';
import styled from 'styled-components';
import BasicSection from 'components/BasicSection';
import { EnvVars } from 'env';
import Cta from 'views/HomePage/Cta';
import Hero from 'views/HomePage/Hero';

const DESCRIPTION = 'RailGuard — топливный фильтр высокого давления для двигателей Common Rail. Тонкость фильтрации 8–12 мкм, до 1800 бар.';

export default function Homepage() {
  return (
    <>
      <Head>
        <title>RailGuard — топливный фильтр высокого давления для Common Rail</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={EnvVars.URL} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="RailGuard" />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:site_name" content="RailGuard" />
        <meta property="og:url" content={EnvVars.URL} />
        <meta property="og:image" content={`${EnvVars.URL}og-image.png`} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <Hero />
      <Sections>
        <BasicSection
          image={<Image src="/webp/FilterInfografika.webp" alt="Схема работы фильтра высокого давления" width={512} height={512} />}
          title="Фильтр высокого давления — надёжная защита топливной системы"
          overTitle="Для двигателей Common Rail"
        >
          <p>
            Если двигатель не заводится на горячую, вышел из строя регулятор давления топлива, а форсунки стали «лить в обратку» — причина в
            металлической стружке от топливных насосов и абразиве, проскочившем через основной фильтр.
          </p>
          <p>
            <strong>
              Наш фильтр с площадью фильтрации около 2000 мм² и тонкостью 8–12 мкм устанавливается после основного фильтра для окончательной
              очистки топлива.
            </strong>
          </p>
          <Note>Иллюстрация показывает принцип работы и не является точным изображением изделия.</Note>
        </BasicSection>
        <BasicSection
          image={<Image src="/webp/Scheme.webp" alt="Схема установки фильтра" width={400} height={922} />}
          title="Преимущества RailGuard"
          overTitle="Что вы получаете"
          reversed
        >
          <ul>
            <li>Фильтрация топлива от продуктов износа ТННД и ТНВД и абразива, прошедшего через основной фильтр</li>
            <li>Защита форсунок и регулятора давления от преждевременного износа</li>
            <li>Стальной корпус, выдерживающий давление до 1800 бар</li>
            <li>Подходит для большинства двигателей Common Rail объёмом до 2,7 л</li>
            <li>Простое обслуживание: замена вместе с основным фильтром</li>
          </ul>
        </BasicSection>
      </Sections>
      <Cta />
    </>
  );
}

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12rem;
  padding: 12rem 0;

  img {
    width: auto;
    max-width: 100%;
    max-height: 52rem;
  }
`;

const Note = styled.p`
  margin-top: 2rem;
  font-size: 1.3rem;
  opacity: 0.6;
`;
