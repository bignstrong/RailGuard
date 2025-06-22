import BasicSection from 'components/BasicSection';
import { EnvVars } from 'env';
import { InferGetStaticPropsType } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import styled from 'styled-components';
import { getAllPosts } from 'utils/postsFetcher';
import Cta from 'views/HomePage/Cta';
// import Features from 'views/HomePage/Features';
// import FeaturesGallery from 'views/HomePage/FeaturesGallery';
import Hero from 'views/HomePage/Hero';
// import Partners from 'views/HomePage/Partners';
// import ScrollableBlogPosts from 'views/HomePage/ScrollableBlogPosts';

export default function Homepage({ posts }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <Head>
        <title>{EnvVars.SITE_NAME}</title>
        <meta name="description" content="RailGuard - страж давления и чистоты" />
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
              Если двигатель не заводится на горячую, вышел из строя регулятор давления топлива, а форсунки стали "лить в обратку" — причина
              в металлической стружке от топливных насосов и абразиве, проскочившем через основной фильтр.{' '}
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
            title="Установите — и забудьте о ремонте топливной системы"
            overTitle="Преимущества для вас"
            reversed
          >
            <ul>
              <li>Ноль повторных ремонтов — забудьте про стружку и поломки на десятки тысяч км</li>
              <li>Экономия: один фильтр — десятки тысяч км без замены</li>
              <li>Монтаж за 5 минут, без спецнавыков</li>
              <li>Рабочее давление до 2000 бар — подходит для всех систем Common Rail</li>
            </ul>
            <p>
              <strong>Ограниченный сток — закажите сейчас и получите скидку 5% при покупке от 3 шт!</strong>
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
    props: {
      posts: await getAllPosts(),
    },
  };
}
