import { useCart } from 'contexts/cart.context';
import styled from 'styled-components';
import { media } from 'utils/media';
import Button from './Button';

interface PricingCardProps {
  title: string;
  description: string;
  price: string;
  image: string;
  id: string;
  actionLabel?: string;
}

export default function PricingCard({ title, description, price, image, id, actionLabel = 'В корзину' }: PricingCardProps) {
  const { addToCart } = useCart();
  const numericPrice = parseInt(price.replace(/[^\d]/g, ''));
  const originalPrice = Math.round(numericPrice * 1.15);
  const savings = originalPrice - numericPrice;

  return (
    <Wrapper>
      <ImageContainer>
        <ProductImage src={image} alt={title} />
        <DiscountBadge>-15%</DiscountBadge>
      </ImageContainer>

      <ContentWrapper>
        <Title>{title}</Title>
        <Description>{description}</Description>

        <PriceSection>
          <PriceWrapper>
            <OriginalPrice>{originalPrice}</OriginalPrice>
            <CurrentPrice>{numericPrice}</CurrentPrice>
          </PriceWrapper>
          <SavingsLabel>Ваша экономия: {savings}₽</SavingsLabel>
          <InstallmentPrice>или 3 платежа по {Math.round(numericPrice / 3)}₽</InstallmentPrice>
          <TimerWrapper>До конца акции осталось: 2 дня</TimerWrapper>
        </PriceSection>

        <StockInfo>
          <InStockDot />В наличии
        </StockInfo>

        <ButtonGroup>
          <AddToCartButton onClick={() => addToCart(id)} transparent={false}>
            {actionLabel}
          </AddToCartButton>
          <OneClickButton onClick={() => console.log('one click buy')}>Купить в 1 клик</OneClickButton>
        </ButtonGroup>

        <BonusSection>
          <BonusItem>
            <BonusIcon>🚚</BonusIcon>
            Бесплатная доставка
          </BonusItem>
          <BonusItem>
            <BonusIcon>🔧</BonusIcon>
            Установка в подарок
          </BonusItem>
        </BonusSection>
      </ContentWrapper>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  background: var(--background);
  border-radius: 2rem;
  border: 2px solid var(--border);
  padding: 2.5rem;
  transition: all 0.3s ease-in-out;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    border-color: var(--primary);
  }

  ${media('<=desktop')} {
    padding: 2rem;
  }
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 35rem;
  margin-bottom: 2.5rem;
  border-radius: 1.5rem;
  overflow: hidden;

  ${media('<=tablet')} {
    height: 30rem;
  }
`;

const ProductImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 2rem;
  background: var(--background);
  transition: transform 0.3s ease;

  ${Wrapper}:hover & {
    transform: scale(1.05);
  }
`;

const DiscountBadge = styled.div`
  position: absolute;
  top: 2rem;
  right: 2rem;
  background: var(--primary);
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 3rem;
  font-weight: bold;
  font-size: 1.4rem;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 2rem;
`;

const Title = styled.h3`
  font-size: 2.4rem;
  font-weight: bold;
  color: var(--text);
  margin: 0;
`;

const Description = styled.p`
  font-size: 1.6rem;
  color: var(--text-lighter);
  margin: 0;
  line-height: 1.5;
`;

const PriceSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: rgba(var(--primary-rgb), 0.05);
  padding: 1.5rem;
  border-radius: 1.5rem;
  border: 1px solid rgba(var(--primary-rgb), 0.1);
`;

const PriceWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const CurrentPrice = styled.span`
  font-size: 3.6rem;
  font-weight: bold;
  color: var(--primary);
  display: flex;
  align-items: center;
  gap: 1rem;

  &:after {
    content: '₽';
    font-size: 2.4rem;
  }
`;

const OriginalPrice = styled.span`
  font-size: 2.2rem;
  color: var(--text-lighter);
  text-decoration: line-through;
  position: relative;

  &:after {
    content: '₽';
    font-size: 1.8rem;
  }
`;

const SavingsLabel = styled.div`
  font-size: 1.4rem;
  color: #2ecc71;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:before {
    content: '🎯';
  }
`;

const InstallmentPrice = styled.span`
  font-size: 1.5rem;
  color: var(--text-lighter);
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(var(--primary-rgb), 0.1);
`;

const TimerWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-top: 0.5rem;
  font-size: 1.4rem;
  color: #e74c3c;
  font-weight: 500;

  &:before {
    content: '⏰';
  }
`;

const StockInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 1.4rem;
  color: #2ecc71;
`;

const InStockDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2ecc71;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
`;

const AddToCartButton = styled(Button)`
  width: 100%;
  font-size: 1.6rem;
  padding: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
`;

const OneClickButton = styled(Button)`
  width: 100%;
  font-size: 1.6rem;
  padding: 1.5rem;
  background: transparent;
  border: 2px solid var(--primary);
  color: var(--primary);

  &:hover {
    background: var(--primary);
    color: white;
  }
`;

const BonusSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
`;

const BonusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.4rem;
  color: var(--text-lighter);
`;

const BonusIcon = styled.span`
  font-size: 1.8rem;
`;
