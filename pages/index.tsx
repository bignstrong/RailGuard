import BasicSection from 'components/BasicSection';
import { EnvVars } from 'env';
import Head from 'next/head';
import Image from 'next/image';
import styled from 'styled-components';
import Cta from 'views/HomePage/Cta';
// import Features from 'views/HomePage/Features';
// import FeaturesGallery from 'views/HomePage/FeaturesGallery';
import Hero from 'views/HomePage/Hero';
// import Partners from 'views/HomePage/Partners';
// import ScrollableBlogPosts from 'views/HomePage/ScrollableBlogPosts';

export default function Homepage() {
  return (
    <>
      <Head>
        <title>{EnvVars.SITE_NAME}</title>
        <meta name="description" content="RailGuard - страж давления и чистоты" />
        <meta
          name="keywords"
          content="Топливный фильтр высокого давленя, RailGuard, фильтр, Common Rail, топливная система, защита, дизель, фильтрация, авто"
        />
        <link rel="canonical" href="https://railguard.ru/" />
        <meta name="robots" content="index,follow" />
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="RailGuard" />
        <meta property="og:description" content="RailGuard - Топливный фильтр высокого давления для дизельных двигателей Common Rail" />
        <meta property="og:site_name" content="RailGuard" />
        <meta property="og:url" content="https://railguard.ru/" />
        <meta property="og:image" content="/og-image.png" />
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="RailGuard" />
        <meta name="twitter:description" content="RailGuard - страж давления и чистоты" />
        <meta name="twitter:image" content="/og-image.png" />
      </Head>
      <HomepageWrapper>
        <WhiteBackgroundContainer>
          <Hero />
          {/* <Partners /> */}
          <BasicSection
            imageComponent={
              <ImageWrapper>
                <StyledImage
                  src="/FilterInfografika.png"
                  alt="Фильтр высокого давления инфографика"
                  width={200}
                  height={650}
                  quality={90}
                  priority
                />
              </ImageWrapper>
            }
            title="Фильтр высокого давления – надёжная защита топливной системы!"
            overTitle="Для дизельных двигателей Common Rail"
          >
            <p>
              Если двигатель не заводится на горячую, вышел из строя регулятор давления топлива, а форсунки стали &quot;лить в обратку&quot;
              — причина в металлической стружке от топливных насосов и абразиве, проскочившем через основной фильтр.{' '}
              <strong>
                Наш фильтр с площадью фильтрации 2000 мм² и тонкостью 8-12 мкм устанавливается после основного фильтра для окончательной
                очистки топлива.
              </strong>
            </p>
          </BasicSection>
          <BasicSection
            imageComponent={
              <ImageWrapper>
                <StyledImage src="/Scheme.png" alt="Фильтр высокого давления инфографика" width={200} height={650} quality={90} priority />
              </ImageWrapper>
            }
            title="RailGuard — надёжная защита топливной системы"
            overTitle="Преимущества для вас"
            reversed
          >
            <ul>
              <li>Дополнительная фильтрация металлической стружки и абразива, которые могут пройти через основной фильтр</li>
              <li>Защита форсунок и регулятора давления от преждевременного износа</li>
              <li>Прочный корпус из стали, выдерживающий давление до 1800 бар</li>
              <li>Подходит для большинства дизельных двигателей Common Rail объёмом до 2,7 л</li>
              <li>Простое обслуживание: замена вместе с основным фильтром</li>
            </ul>
            <p>
              <strong>Ограниченный сток — успейте заказать сейчас!</strong>
            </p>
          </BasicSection>
        </WhiteBackgroundContainer>
        <DarkerBackgroundContainer>
          <Cta />
          {/* <FeaturesGallery />
          <Features />
          <ScrollableBlogPosts posts={posts} /> */}
        </DarkerBackgroundContainer>
      </HomepageWrapper>
    </>
  );
}

const HomepageWrapper = styled.div`
  & > :last-child {
    margin-bottom: 15rem;
  }
`;

const DarkerBackgroundContainer = styled.div`
  background: rgb(var(--background));

  & > *:not(:first-child) {
    margin-top: 15rem;
  }
`;

const WhiteBackgroundContainer = styled.div`
  background: rgb(var(--secondBackground));

  & > :last-child {
    padding-bottom: 15rem;
  }

  & > *:not(:first-child) {
    margin-top: 15rem;
  }
`;

const ImageWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;

  @media (max-width: 768px) {
    max-width: 250px;
  }
`;

const StyledImage = styled(Image)`
  width: 100%;
  object-fit: contain;
`;

export async function getStaticProps() {
  return {
    props: {},
  };
}
