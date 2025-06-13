import BasicSection from 'components/BasicSection'
import { EnvVars } from 'env'
import { InferGetStaticPropsType } from 'next'
import Head from 'next/head'
import styled from 'styled-components'
import { getAllPosts } from 'utils/postsFetcher'
import Cta from 'views/HomePage/Cta'
import Features from 'views/HomePage/Features'
import FeaturesGallery from 'views/HomePage/FeaturesGallery'
import Hero from 'views/HomePage/Hero'
// import Partners from 'views/HomePage/Partners';
import ScrollableBlogPosts from 'views/HomePage/ScrollableBlogPosts'
import Testimonials from 'views/HomePage/Testimonials'

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
            imageUrl="/demo-illustration-1.svg"
            title="🔥 Фильтр высокого давления – абразиву и стружке не пройти!"
            overTitle="Для дизельных двигателей Common Rail"
          >
            <p>
              Если ваш двигатель не заводится на горячую, а форсунки быстро выходят из строя — причина часто в металлической стружке и
              абразиве, которые проходят даже через основной фильтр.{' '}
              <strong>Наш фильтр задерживает частицы до 10 мкм и защищает ТНВД и форсунки от износа.</strong>
            </p>
          </BasicSection>
          <BasicSection
            imageUrl="/demo-illustration-2.svg"
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
          <FeaturesGallery />
          <Features />
          <Testimonials />
          <ScrollableBlogPosts posts={posts} />
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

export async function getStaticProps() {
  return {
    props: {
      posts: await getAllPosts(),
    },
  };
}
