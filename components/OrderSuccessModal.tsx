import styled from 'styled-components';
import { media } from 'utils/media';
import Button from './Button';
import CloseIcon from './CloseIcon';
import Overlay from './Overlay';

interface OrderSuccessModalProps {
  orderId: string;
  onClose: () => void;
}

export default function OrderSuccessModal({ orderId, onClose }: OrderSuccessModalProps) {
  return (
    <Overlay>
      <ModalWrapper>
        <CloseIconContainer>
          <CloseIcon onClick={onClose} />
        </CloseIconContainer>
        <SuccessIcon>✓</SuccessIcon>
        <Title>Заказ успешно оформлен!</Title>
        <OrderNumber>Номер заказа: {orderId}</OrderNumber>
        <Description>
          Мы получили ваш заказ и свяжемся с вами в ближайшее время для подтверждения.
          Вы можете сохранить номер заказа для отслеживания его статуса.
        </Description>
        <CloseButton onClick={onClose}>Закрыть</CloseButton>
      </ModalWrapper>
    </Overlay>
  );
}

const ModalWrapper = styled.div`
  background: rgb(var(--background));
  border-radius: 1.5rem;
  padding: 3rem;
  max-width: 50rem;
  width: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  
  ${media('<=tablet')} {
    padding: 2rem;
  }
`;

const CloseIconContainer = styled.div`
  position: absolute;
  right: 2rem;
  top: 2rem;
  cursor: pointer;
  
  svg {
    width: 2rem;
    height: 2rem;
  }
`;

const SuccessIcon = styled.div`
  width: 6rem;
  height: 6rem;
  background: rgb(var(--primary));
  color: rgb(var(--textSecondary));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  margin-bottom: 2rem;
`;

const Title = styled.h2`
  font-size: 2.4rem;
  color: rgb(var(--text));
  margin-bottom: 1rem;
  text-align: center;
`;

const OrderNumber = styled.div`
  font-size: 1.8rem;
  color: rgb(var(--primary));
  font-weight: bold;
  margin-bottom: 2rem;
  padding: 1rem 2rem;
  background: rgba(var(--primary), 0.1);
  border-radius: 0.8rem;
`;

const Description = styled.p`
  font-size: 1.6rem;
  color: rgb(var(--text));
  text-align: center;
  margin-bottom: 2rem;
  line-height: 1.5;
`;

const CloseButton = styled(Button)`
  width: 100%;
  max-width: 20rem;
`; 