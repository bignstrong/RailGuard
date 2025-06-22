import ArticleCard from 'components/ArticleCard';
import Container from 'components/Container';
import OverTitle from 'components/OverTitle';
import SectionTitle from 'components/SectionTitle';
import { useResizeObserver } from 'hooks/useResizeObserver';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { A11y } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import { SingleArticle } from 'types';
import { media } from 'utils/media';

interface ScrollableBlogPostsProps {
  posts: SingleArticle[];
}

export default function ScrollableBlogPosts({ posts }: ScrollableBlogPostsProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const { ref, width = 1 } = useResizeObserver<HTMLDivElement>();

  const oneItemWidth = 350;
  const noOfItems = width / oneItemWidth;

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <Section>
      <Container>
        <Content>
          <OverTitle>Полезная информация</OverTitle>
          <SectionTitle>Все что нужно знать о защите топливной системы</SectionTitle>
        </Content>
      </Container>

      <SwiperContainer ref={ref}>
        {hasMounted && (
          <Swiper modules={[A11y]} slidesPerView={noOfItems} spaceBetween={10} loop>
            <SwiperSlide>
              <ArticleCard
                title="Как работает система Common Rail"
                description="Разбираем принцип работы современной топливной системы и почему она нуждается в дополнительной защите"
                imageUrl="/blog/common-rail-system.jpg"
                slug="how-common-rail-works"
              />
            </SwiperSlide>
            <SwiperSlide>
              <ArticleCard
                title="5 признаков проблем с форсунками"
                description="Научитесь распознавать первые признаки неисправности форсунок, чтобы предотвратить дорогостоящий ремонт"
                imageUrl="/blog/injector-problems.jpg"
                slug="injector-problem-signs"
              />
            </SwiperSlide>
            <SwiperSlide>
              <ArticleCard
                title="Сравнение методов защиты ТНВД"
                description="Анализируем эффективность разных способов защиты топливной системы: магниты, сетки, фильтры"
                imageUrl="/blog/protection-comparison.jpg"
                slug="fuel-system-protection-comparison"
              />
            </SwiperSlide>
            <SwiperSlide>
              <ArticleCard
                title="Инструкция по установке RailGuard"
                description="Пошаговое руководство по установке фильтра с фотографиями и видео. Справится даже новичок"
                imageUrl="/blog/installation-guide.jpg"
                slug="railguard-installation-guide"
              />
            </SwiperSlide>
          </Swiper>
        )}
      </SwiperContainer>
    </Section>
  );
}

const Content = styled.div`
  position: relative;

  display: flex;
  flex-direction: column;
  align-items: center;

  & > *:last-child {
    margin-top: 1rem;
  }
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  & > *:not(:first-child) {
    margin-top: 1rem;
  }
`;

const SwiperContainer = styled(Container)`
  max-width: 250em;
  height: 46rem;

  & > *:first-child {
    margin-top: 4rem;
  }

  ${media('<=largeDesktop')} {
    max-width: 100%;
    padding: 0;
  }
`;
