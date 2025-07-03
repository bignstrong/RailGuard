import Page from 'components/Page';
import SliderArrow from 'components/SliderArrow';
import { useLightbox } from 'contexts/lightbox.context';
import NextImage from 'next/image';
import { useState } from 'react';
import styled from 'styled-components';
import { media } from 'utils/media';

const FILTER_BODY_SPECS = [
  { title: 'Материал корпуса', value: 'Сталь' },
  { title: 'Габариты', value: '120×35 мм' },
  { title: 'Вес', value: '430 г' },
  { title: 'Резьба', value: 'M14×1,5 (M12×1,5 опц.)' },
  { title: 'Давление опрессовки', value: '180 МПа (1800 бар)' },
  { title: 'Монтаж', value: 'Жёсткая фиксация к двигателю' },
];

const FILTER_ELEMENT_SPECS = [
  { title: 'Тип системы', value: 'Common Rail' },
  { title: 'Тонкость фильтрации', value: '8–12 мкм' },
  { title: 'Площадь фильтрации', value: '≈2000 мм²' },
  { title: 'Применение', value: 'Двигатели до 2.7 л' },
  { title: 'Обслуживание', value: 'Менять с основным фильтром' },
  { title: 'Особенности', value: 'Каждый фильтр опрессован' },
  { title: 'Преимущества', value: 'Защита форсунок и регулятора давления' },
];

const FILTER_BODY_IMAGES = [
  { src: '/withoutBack/corpus.png', alt: 'Корпус фильтра' },
  { src: '/withoutBack/corpus_2.png', alt: 'Корпус фильтра' },
];

const FILTER_ELEMENT_IMAGES = [
  { src: '/withoutBack/element_2.png', alt: 'Инфографика фильтра' },
  { src: '/withoutBack/element.png', alt: 'Схема установки' },
  { src: '/withoutBack/element_3.png', alt: 'Фильтр в разрезе' },
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
          <SectionTitle id="filter-body">Корпус фильтра</SectionTitle>
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
          <SectionTitle id="filter-element">Фильтрующий элемент</SectionTitle>
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
          <SectionTitle>Описание и назначение фильтра</SectionTitle>
          <SpecsColumn>
            <BasicCard>
              <SectionTitle>Что это и где ставится</SectionTitle>
              <RichText>
                Этот фильтр устанавливают на двигатели с системой Common Rail между топливным насосом высокого давления (ТНВД) и рампой
                форсунок, сразу после основного фильтра. Его задача — задерживать металлическую стружку от ТНВД/ТННД и мелкий абразив,
                который мог проскочить через основной фильтр.
              </RichText>
              <SectionTitle>Зачем он нужен</SectionTitle>
              <RichText>
                <ul>
                  <li>
                    Если двигатель долго не заводится на «горячую» или вообще не запускается, а после попытки холодного пуска давление
                    падает и регулятор выходит из строя;
                  </li>
                  <li>
                    Если форсунки быстро начинают «лить в обратку» — значит в топливе есть мелкая металлическая стружка или абразив. Этот
                    фильтр их задержит и продлит срок службы насоса и форсунок.
                  </li>
                </ul>
              </RichText>
              <SectionTitle>Основные характеристики</SectionTitle>
              <RichText>
                <ul>
                  <li>
                    <b>Площадь фильтрации:</b> 2 000 мм² (зона фильтровальной бумаги)
                  </li>
                  <li>
                    <b>Размер пор:</b> 8–12 мкм (удерживает частицы мельче 0,01 мм)
                  </li>
                  <li>
                    <b>Двигатели:</b> подходит для моторов объёмом до 2,7 л (проверено на практике)
                  </li>
                  <li>
                    <b>Прочность корпуса:</b> выдерживает опрессовку 180 МПа (1 800 bar)
                  </li>
                  <li>
                    <b>Резьба подключения:</b> стандарт M14×1,5 (по заказу можно M12×1,5)
                  </li>
                  <li>
                    <b>Габариты:</b> длина 120 мм, максимальный диаметр 35 мм
                  </li>
                  <li>
                    <b>Материал:</b> корпус из стали
                  </li>
                  <li>
                    <b>Вес:</b> 430 г
                  </li>
                </ul>
              </RichText>
              <SectionTitle>Как обслуживать</SectionTitle>
              <RichText>
                <ul>
                  <li>Менять одновременно с основным топливным фильтром при каждом ТО.</li>
                  <li>Устанавливать чётко по стрелке, указывающей направление потока топлива.</li>
                  <li>
                    Жёстко фиксировать корпус к блоку двигателя — чтобы вибрации или масса фильтра не повредили топливные трубки и не
                    разбалансировали систему.
                  </li>
                </ul>
              </RichText>
              <SectionTitle>Прочие моменты</SectionTitle>
              <RichText>
                <ul>
                  <li>Марка автомобиля и производитель фильтра условны, подходят почти ко всем моторам Common Rail.</li>
                  <li>Всё остальное можете спросить у нашего менеджера.</li>
                </ul>
              </RichText>
            </BasicCard>
          </SpecsColumn>
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
  margin-bottom: 0.3em;
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

const BasicCard = styled.div`
  background-color: rgba(var(--secondary), 0.1);
  border-radius: 0.6rem;
  padding: 2rem;
  box-shadow: var(--shadow-md);
`;

const RichText = styled.div`
  font-size: 1.8rem;
  color: rgb(var(--text));
  margin-bottom: 2rem;
`;
