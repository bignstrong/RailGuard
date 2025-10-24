import AutofitGrid from 'components/AutofitGrid';
import BasicCard from 'components/BasicCard';
import Link from 'components/Link';
import { useCart } from 'contexts/cart.context';
import { useLightbox } from 'contexts/lightbox.context';
import { useToast } from 'contexts/toast.context';
import Head from 'next/head';
import NextImage from 'next/image';
import { useState } from 'react';
import styled from 'styled-components';
import { media } from 'utils/media';

interface ProductCardProps {
  id: string;
  title: string;
  price: string;
  oldPrice?: string;
  description: string;
  image: string;
  actionLabel?: string;
  inStock?: boolean;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
  reviews?: Array<{
    author: string;
    rating: number;
    body: string;
  }>;
  shippingDetails?: {
    shippingRate: number;
    deliveryDays: string;
  };
  returnPolicy?: {
    merchantReturnDays: number;
    returnPolicyCategory: string;
    applicableCountry: string;
  };
  priceValidUntil?: string;
}

function ProductCard({
  id,
  title,
  price,
  oldPrice,
  description,
  image,
  actionLabel = 'В корзину',
  inStock = true,
  aggregateRating,
  reviews,
  shippingDetails,
  returnPolicy,
  priceValidUntil,
}: ProductCardProps) {
  const { addItem, items, toggleCart } = useCart();
  const { showToast } = useToast();
  const [isPressed, setIsPressed] = useState(false);
  const { openLightbox } = useLightbox();

  const itemInCart = items.find((item) => item.id === id);
  const quantity = itemInCart ? itemInCart.quantity : 0;

  const oldPriceNum = oldPrice ? parseInt(oldPrice.replace(/[^\d]/g, '')) : 0;
  const priceNum = parseInt(price.replace(/[^\d]/g, ''));
  const discount = oldPriceNum > 0 ? Math.round(((oldPriceNum - priceNum) / oldPriceNum) * 100) : 0;

  const handleAddToCart = () => {
    setIsPressed(true);
    addItem({
      id,
      title,
      price: parseInt(price.replace(/[^\d]/g, '')),
      oldPrice: oldPrice ? parseInt(oldPrice.replace(/[^\d]/g, '')) : undefined,
      image,
    });
    showToast(`${title} добавлен в корзину`, 'success', () => toggleCart());

    // Возвращаем кнопку в нормальное состояние через 200мс
    setTimeout(() => {
      setIsPressed(false);
    }, 200);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openLightbox(image, [image]);
  };

  // Формируем отзывы для schema.org
  const reviewList = (reviews || []).map((r) => ({
    '@type': 'Review',
    reviewRating: {
      '@type': 'Rating',
      ratingValue: r.rating.toString(),
    },
    author: {
      '@type': 'Person',
      name: r.author,
    },
    reviewBody: r.body,
  }));

  // Формируем shippingDetails для schema.org
  const shippingDetailsObj = shippingDetails
    ? {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: shippingDetails.shippingRate.toString(),
          currency: 'RUB',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          businessDays: shippingDetails.deliveryDays,
        },
      }
    : undefined;

  // Формируем returnPolicy для schema.org
  const returnPolicyObj = returnPolicy
    ? {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: returnPolicy.applicableCountry,
        returnPolicyCategory: returnPolicy.returnPolicyCategory,
        merchantReturnDays: returnPolicy.merchantReturnDays,
      }
    : undefined;

  const productJsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: title,
    image: [image],
    description: description,
    sku: id,
    aggregateRating: aggregateRating
      ? {
          '@type': 'AggregateRating',
          ratingValue: aggregateRating.ratingValue.toString(),
          reviewCount: aggregateRating.reviewCount.toString(),
        }
      : undefined,
    review: reviewList.length > 0 ? reviewList : undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'RUB',
      price: price.replace(/[^\d]/g, ''),
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: typeof window !== 'undefined' ? window.location.href : '',
      priceValidUntil: priceValidUntil || '2025-12-31',
      shippingDetails: shippingDetailsObj,
      hasMerchantReturnPolicy: returnPolicyObj,
    },
  };

  return (
    <CardWrapper outOfStock={!inStock}>
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      </Head>
      <ImageContainer onClick={handleImageClick}>
        {discount > 0 && <DiscountBadge>{`-${discount}%`}</DiscountBadge>}
        <NextImage src={image} alt={title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" style={{ objectFit: 'contain' }} loading="lazy" quality={85} />
      </ImageContainer>
      <Content>
        <Title>{title}</Title>
        <Description>{description}</Description>
        {(id === 'fto-cr-standard' || id === 'cr-10-cartridge') && (
          <LearnMoreLinkWrapper>
            <Link href={id === 'fto-cr-standard' ? '/specifications#filter-body' : '/specifications#filter-element'}>Узнать больше</Link>
          </LearnMoreLinkWrapper>
        )}
        <PriceContainer>
          <PriceTag>{price}</PriceTag>
          {oldPrice && <OldPriceTag>{oldPrice}</OldPriceTag>}
        </PriceContainer>
        <StockStatus inStock={inStock}>{inStock ? 'В наличии' : 'Нет в наличии'}</StockStatus>
        <CartButton onClick={handleAddToCart} isPressed={isPressed} disabled={!inStock}>
          <ButtonText>{actionLabel}</ButtonText>
          {quantity > 0 && <QuantityBadge>{quantity}</QuantityBadge>}
        </CartButton>
        <NoticeWrapper>
          <InfoIcon tabIndex={0}>
            i
            <Tooltip>
              Производитель может изменять форму и цвет изделия без ухудшения его функциональности. Для получения самой актуальной
              информации о товаре, пожалуйста, уточняйте детали у продавца.
            </Tooltip>
          </InfoIcon>
        </NoticeWrapper>
      </Content>
    </CardWrapper>
  );
}

export default function CatalogSection() {
  return (
    <Wrapper>
      <CategoryTitle>Топливные фильтры и картриджи</CategoryTitle>
      <AutofitGrid>
        <ProductCard
          id="fto-cr-standard"
          title="Корпус фильтра"
          price="12 000₽"
          oldPrice="18 000₽"
          description="Базовый корпус фильтра высокого давления для Common Rail систем"
          image="/webp/corpus.webp"
          inStock={true}
          aggregateRating={{ ratingValue: 4.9, reviewCount: 17 }}
          reviews={[
            { author: 'Иван', rating: 5, body: 'Очень доволен качеством!' },
            { author: 'Мария', rating: 5, body: 'Работает отлично, рекомендую.' },
          ]}
          shippingDetails={{ shippingRate: 0, deliveryDays: '1-3' }}
          returnPolicy={{ merchantReturnDays: 14, returnPolicyCategory: 'https://schema.org/Refundable', applicableCountry: 'RU' }}
          priceValidUntil="2025-12-31"
        />
        <ProductCard
          id="cr-10-cartridge"
          title="Фильтрующий элемент"
          price="1 200₽"
          oldPrice="3 000₽"
          description="Сменный фильтрующий элемент из хлопкового линта"
          image="/webp/element_2.webp"
          inStock={true}
          aggregateRating={{ ratingValue: 5.0, reviewCount: 9 }}
          reviews={[{ author: 'Пётр', rating: 5, body: 'Меняю регулярно, фильтрует отлично.' }]}
          shippingDetails={{ shippingRate: 0, deliveryDays: '1-3' }}
          returnPolicy={{ merchantReturnDays: 14, returnPolicyCategory: 'https://schema.org/Refundable', applicableCountry: 'RU' }}
          priceValidUntil="2025-12-31"
        />
      </AutofitGrid>

      <CategoryTitle>Комплекты и специальные наборы</CategoryTitle>
      <SpecialOffersGrid>
        <SpecialOfferCard>
          <ProductCard
            id="profi-start-kit"
            title="Комплект «Старт»"
            price="14 000₽"
            oldPrice="24 000₽"
            description="Комплект состоящий из корпуса и двух фильтрующих элементов"
            image="/webp/start.webp"
            actionLabel="В корзину"
            inStock={true}
            aggregateRating={{ ratingValue: 4.8, reviewCount: 5 }}
            reviews={[{ author: 'Сергей', rating: 5, body: 'Всё в комплекте, удобно!' }]}
            shippingDetails={{ shippingRate: 0, deliveryDays: '1-3' }}
            returnPolicy={{ merchantReturnDays: 14, returnPolicyCategory: 'https://schema.org/Refundable', applicableCountry: 'RU' }}
            priceValidUntil="2025-12-31"
          />
        </SpecialOfferCard>
        <ProductCard
          id="sto-bulk-kit"
          title="Оптовый набор СТО"
          price="60 000₽"
          oldPrice="120 000₽"
          description="Специальное предложение для автосервисов"
          image="/webp/large.webp"
          actionLabel="В корзину"
          inStock={true}
          aggregateRating={{ ratingValue: 5.0, reviewCount: 2 }}
          reviews={[{ author: 'СТО «АвтоПрофи»', rating: 5, body: 'Выгодно для сервиса, берём не первый раз.' }]}
          shippingDetails={{ shippingRate: 0, deliveryDays: '1-3' }}
          returnPolicy={{ merchantReturnDays: 14, returnPolicyCategory: 'https://schema.org/Refundable', applicableCountry: 'RU' }}
          priceValidUntil="2025-12-31"
        />
      </SpecialOffersGrid>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  padding-top: 5rem;
  padding-bottom: 5rem;
`;

const CategoryTitle = styled.h2`
  font-size: 3.2rem;
  font-weight: bold;
  color: rgb(var(--text-primary));
  text-align: center;
  margin: 5rem 0 5rem;
  position: relative;
  padding-bottom: 2rem;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 8rem;
    height: 4px;
    background-color: rgb(var(--primary));
    border-radius: 2px;
  }
`;

const CardWrapper = styled(BasicCard)<{ outOfStock?: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 65rem;
  padding: 0;
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: transform 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease;
  border-radius: 1.5rem;
  opacity: ${(p) => (p.outOfStock ? 0.65 : 1)};

  &:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
  }

  ${media('<=tablet')} {
    min-height: 60rem;
  }
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 35rem;
  overflow: hidden;
  background: rgb(var(--background));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-in;

  ${media('<=tablet')} {
    height: 30rem;
  }
`;

const DiscountBadge = styled.div`
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  background: #e53935;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.8rem;
  font-size: 1.6rem;
  font-weight: bold;
  z-index: 1;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
`;

const Content = styled.div`
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex-grow: 1;
`;

const Title = styled.h3`
  font-size: 2.2rem;
  margin: 0;
  color: rgb(var(--text));
  line-height: 1.5;
`;

const Description = styled.p`
  font-size: 1.6rem;
  color: rgb(var(--text-secondary));
  margin: 0;
  line-height: 1.5;
`;

const PriceContainer = styled.div`
  display: flex;
  align-items: baseline;
  gap: 1rem;
`;

const PriceTag = styled.div`
  font-size: 2.8rem;
  font-weight: bold;
  color: rgb(var(--primary));
  margin: 0;
`;

const OldPriceTag = styled.div`
  font-size: 2rem;
  color: rgba(var(--text), 0.6);
  text-decoration: line-through;
`;

const StockStatus = styled.div<{ inStock: boolean }>`
  font-size: 1.6rem;
  font-weight: 500;
  color: ${(p) => (p.inStock ? 'rgb(var(--success))' : 'rgb(var(--error))')};
  margin-top: auto;
  padding-top: 1.5rem;
`;

const SpecialOffersGrid = styled(AutofitGrid)`
  margin-top: 3rem;
  justify-content: center;
  gap: 1rem;
  transition: all 0.2s ease;
  margin-top: 1rem;
  position: relative;
`;

const SpecialOfferCard = styled.div`
  ${CardWrapper} {
    border: 2px solid rgb(var(--primary));
    position: relative;

    &:before {
      content: 'Лучший выбор';
      position: absolute;
      top: 2rem;
      right: -3.5rem;
      background: rgb(var(--primary));
      color: rgb(var(--text-over-primary));
      padding: 0.5rem 4rem;
      transform: rotate(45deg);
      font-size: 1.4rem;
      font-weight: bold;
    }
  }
`;

const CartButton = styled.button<{ isPressed: boolean }>`
  width: 100%;
  padding: 1.4rem;
  font-size: 1.6rem;
  font-weight: bold;
  color: rgb(var(--textSecondary));
  background: rgb(var(--primary));
  border: none;
  border-radius: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  transition: all 0.2s ease;
  margin-top: auto;
  position: relative;
`;

const ButtonText = styled.span`
  position: relative;
  z-index: 1;
  color: white;
`;

const QuantityBadge = styled.span`
  position: absolute;
  top: -0.8rem;
  right: -0.8rem;
  background: #ff0000;
  color: white;
  border-radius: 50%;
  width: 2.4rem;
  height: 2.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(255, 0, 0, 0.5);
  animation: badgePop 0.3s ease-out;
`;

const LearnMoreLinkWrapper = styled.div`
  margin-top: -0.5rem;
  margin-bottom: 0.5rem;
  font-size: 1.3rem;
  text-align: left;
  width: fit-content;
`;

const NoticeWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  margin-top: 1.5rem;
  min-height: 2.2rem;
`;

const InfoIcon = styled.span`
  display: inline-block;
  position: relative;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgb(var(--cardBackground));
  color: rgba(var(--text), 0.35);
  font-size: 13px;
  font-weight: bold;
  text-align: center;
  line-height: 18px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  border: 1px solid rgba(var(--text), 0.08);
  margin-left: 2px;
  margin-bottom: 2px;
  outline: none;

  &:hover,
  &:focus {
    background: rgb(var(--cardBackground));
    color: rgba(var(--text), 0.6);
    border-color: rgba(var(--text), 0.18);
  }

  &:hover > div,
  &:focus > div {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(-8px) scale(1);
  }
`;

const Tooltip = styled.div`
  opacity: 0;
  pointer-events: none;
  position: absolute;
  left: 50%;
  bottom: 120%;
  transform: translateX(-50%) translateY(0) scale(0.98);
  min-width: 260px;
  max-width: 320px;
  background: #222;
  color: #fff;
  font-size: 1.3rem;
  border-radius: 6px;
  padding: 1rem 1.2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.13);
  z-index: 10;
  transition: opacity 0.2s, transform 0.2s;
  text-align: left;
  line-height: 1.5;
  white-space: normal;
`;
