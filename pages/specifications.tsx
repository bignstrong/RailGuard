import Page from 'components/Page';
import SliderArrow from 'components/SliderArrow';
import { useLightbox } from 'contexts/lightbox.context';
import NextImage from 'next/image';
import { useState } from 'react';
import styled from 'styled-components';
import { media } from 'utils/media';

const FILTER_BODY_SPECS = [
  { title: 'Материал корпуса', value: 'нержавеющая сталь' },
  { title: 'Габариты', value: '90-120 мм (длина), 30-35 мм (диаметр)' },
  { title: 'Вес', value: '430 г' },
  { title: 'Резьба', value: 'M12×1,5 или M14×1,5' },
  { title: 'Рабочее давление', value: 'до 2000 бар (2200 кг/см²)' },
  { title: 'Давление опрессовки', value: '180–220 МПа (1800–2200 бар)' },
];

const FILTER_ELEMENT_SPECS = [
  { title: 'Тип системы', value: 'Common Rail (Bosch CP4, Denso, Delphi и др.)' },
  { title: 'Тонкость фильтрации', value: '2–12 мкм (рекомендуемая — 10 мкм)' },
  { title: 'Площадь фильтрации', value: '1850–2000 мм²' },
  { title: 'Материал фильтра', value: 'хлопковый линт (альфа-целлюлоза)' },
  { title: 'Ресурс', value: 'до 100 000 км' },
  { title: 'Интервал обслуживания', value: '15-20 тыс. км' },
];

const FILTER_BODY_IMAGES = [
  { src: '/Filter.png', alt: 'Корпус фильтра' },
  { src: '/diaFilter.png', alt: 'Диагностика фильтра' },
  { src: '/Scheme.png', alt: 'Схема фильтра' },
];

const FILTER_ELEMENT_IMAGES = [
  { src: '/FilterInfografika.png', alt: 'Инфографика фильтра' },
  { src: '/installation-scheme.svg', alt: 'Схема установки' },
  { src: '/Filter.png', alt: 'Фильтр в разрезе' },
];

const INSTALLATION_IMAGES = [
  { src: '/installation-scheme.svg', alt: 'Схема установки' },
  { src: '/Scheme.png', alt: 'Схема подключения' },
  { src: '/FilterInfografika.png', alt: 'Инфографика установки' },
];

function ImageSlider({ images }: { images: { src: string; alt: string }[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { openLightbox } = useLightbox();
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleImageClick = () => {
    openLightbox(
      images[currentIndex].src,
      images.map((img) => img.src),
    );
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextImage();
    }
    if (isRightSwipe) {
      prevImage();
    }
  };

  return (
    <SliderContainer>
      <ImageContainer
        onClick={handleImageClick}
        style={{ cursor: 'pointer' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <NextImage src={images[currentIndex].src} alt={images[currentIndex].alt} layout="fill" objectFit="contain" draggable={false} />
      </ImageContainer>
      <SliderArrow direction="left" onClick={prevImage} />
      <SliderArrow direction="right" onClick={nextImage} />
      <SliderDots>
        {images.map((_, index) => (
          <SliderDot key={index} active={index === currentIndex} onClick={() => setCurrentIndex(index)} />
        ))}
      </SliderDots>
    </SliderContainer>
  );
}

export default function SpecificationsPage() {
  return (
    <Page title="Характеристики" description="Технические характеристики и преимущества фильтра высокого давления Common Rail">
      <Wrapper>
        <Section>
          <SectionTitle>Корпус фильтра</SectionTitle>
          <ContentGrid>
            <ImageColumn>
              <ImageSlider images={FILTER_BODY_IMAGES} />
            </ImageColumn>
            <SpecsColumn>
              <SpecsGrid>
                {FILTER_BODY_SPECS.map((spec) => (
                  <SpecRow key={spec.title}>
                    <SpecTitle>{spec.title}</SpecTitle>
                    <SpecValue>{spec.value}</SpecValue>
                  </SpecRow>
                ))}
              </SpecsGrid>
            </SpecsColumn>
          </ContentGrid>
        </Section>

        <Section>
          <SectionTitle>Фильтрующий элемент</SectionTitle>
          <ContentGrid>
            <ImageColumn>
              <ImageSlider images={FILTER_ELEMENT_IMAGES} />
            </ImageColumn>
            <SpecsColumn>
              <SpecsGrid>
                {FILTER_ELEMENT_SPECS.map((spec) => (
                  <SpecRow key={spec.title}>
                    <SpecTitle>{spec.title}</SpecTitle>
                    <SpecValue>{spec.value}</SpecValue>
                  </SpecRow>
                ))}
              </SpecsGrid>
            </SpecsColumn>
          </ContentGrid>
        </Section>

        <Section>
          <SectionTitle>Схема установки</SectionTitle>
          <ContentGrid>
            <ImageColumn>
              <ImageSlider images={INSTALLATION_IMAGES} />
            </ImageColumn>
            <SpecsColumn>
              <InstallationList>
                <li>Установка строго по направлению потока топлива (стрелка на корпусе)</li>
                <li>Жёсткая фиксация корпуса к двигателю во избежание вибраций</li>
                <li>Проверка соответствия резьбы на ТНВД и рейке</li>
                <li>Выбор длины трубок (200 или 300 мм) в зависимости от точек подключения</li>
                <li>Регулярная проверка каждые 15-20 тыс. км</li>
                <li>Замена основного топливного фильтра перед установкой</li>
              </InstallationList>
            </SpecsColumn>
          </ContentGrid>
        </Section>
      </Wrapper>
    </Page>
  );
}

const Wrapper = styled.div`
  max-width: 140rem;
  margin: 0 auto;
  padding: 5rem 2rem;
`;

const Section = styled.div`
  margin-bottom: 8rem;

  ${media('<=tablet')} {
    margin-bottom: 4rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;

  ${media('<=tablet')} {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: 3.2rem;
  font-weight: bold;
  color: rgb(var(--text));
  margin-bottom: 3rem;
  text-align: center;
  position: relative;

  &:after {
    content: '';
    position: absolute;
    bottom: -1rem;
    left: 50%;
    transform: translateX(-50%);
    width: 6rem;
    height: 0.3rem;
    background-color: rgb(var(--primary));
    border-radius: 0.2rem;
  }

  ${media('<=tablet')} {
    font-size: 2.8rem;
    margin-bottom: 2rem;
  }
`;

const ImageColumn = styled.div`
  position: relative;
  grid-column: 1;

  ${media('<=tablet')} {
    grid-column: auto;
  }
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 40rem;
  border-radius: 0.6rem;
  overflow: hidden;
  box-shadow: var(--shadow-md);
  user-select: none;
  -webkit-user-drag: none;
  touch-action: pan-y pinch-zoom;

  ${media('<=tablet')} {
    min-height: 30rem;
  }
`;

const SpecsColumn = styled.div`
  grid-column: 2;

  ${media('<=tablet')} {
    grid-column: auto;
  }
`;

const SpecsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SpecRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(var(--secondary), 0.1);
  border-radius: 0.6rem;

  ${media('<=tablet')} {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
`;

const SpecTitle = styled.div`
  font-weight: bold;
  color: rgb(var(--text));
  font-size: 1.8rem;
`;

const SpecValue = styled.div`
  color: rgb(var(--text));
  font-size: 1.6rem;
`;

const InstallationList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 1.8rem;

  li {
    margin: 1rem 0;
    padding-left: 2rem;
    position: relative;

    &:before {
      content: '•';
      color: rgb(var(--primary));
      position: absolute;
      left: 0;
      font-size: 2rem;
      line-height: 1.2;
    }
  }
`;

const SliderContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const SliderDots = styled.div`
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  z-index: 2;
  padding: 0.8rem 1.6rem;
  border-radius: 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const SliderDot = styled.button<{ active: boolean }>`
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
  border: none;
  background: ${({ active }) => (active ? 'rgb(var(--primary))' : 'rgba(255, 255, 255, 0.5)')};
  cursor: pointer;
  padding: 0;
  transition: all 0.2s ease-in-out;

  &:hover {
    transform: scale(1.2);
    background: ${({ active }) => (active ? 'rgb(var(--primary))' : 'rgba(255, 255, 255, 0.7)')};
  }
`;
