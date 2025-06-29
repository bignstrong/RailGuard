import React from 'react';
import styled, { keyframes } from 'styled-components';
import { media } from 'utils/media';
import { useClipboard } from '../hooks/useClipboard';
import Button from './Button';
import CloseIcon from './CloseIcon';
import Container from './Container';
import Overlay from './Overlay';

interface OrderSuccessModalProps {
  orderId: string;
  onClose: () => void;
}

export default function OrderSuccessModal({ orderId, onClose }: OrderSuccessModalProps) {
  const clipboard = useClipboard();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    clipboard.copy(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Overlay>
      <Container>
        <ModalWrapper>
          <CloseIconContainer>
            <CloseIcon onClick={onClose} />
          </CloseIconContainer>
          <SuccessIcon>✓</SuccessIcon>
          <Title>Заказ успешно оформлен!</Title>
          <OrderNumberBlock>
            <OrderNumberLabel>Номер заказа</OrderNumberLabel>
            <OrderNumberRow>
              <OrderNumberValue>{orderId}</OrderNumberValue>
              <CopyButton onClick={handleCopy} title="Скопировать номер заказа">
                {copied ? <CopiedText>Скопировано!</CopiedText> : <CopyIcon>📋</CopyIcon>}
              </CopyButton>
            </OrderNumberRow>
          </OrderNumberBlock>
          <Description>
            Мы получили ваш заказ и свяжемся с вами в ближайшее время для подтверждения. Вы можете сохранить номер для ващего удобства.
          </Description>
          <CloseButton onClick={onClose}>Закрыть</CloseButton>
        </ModalWrapper>
      </Container>
    </Overlay>
  );
}

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: none; }
`;

const ModalWrapper = styled.div`
  background: rgb(var(--modalBackground));
  border-radius: 1.2rem;
  padding: 6rem 4rem 3rem 4rem;
  max-width: 44rem;
  min-width: 320px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  box-shadow: var(--shadow-lg);
  animation: ${fadeIn} 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  color: rgb(var(--text));
  margin: 8vh auto;
  overflow: hidden;

  ${media('<=tablet')} {
    padding: 4rem 1.5rem 2rem 1.5rem;
    min-width: 0;
    width: 100%;
    margin: 4vh auto;
  }
`;

const CloseIconContainer = styled.div`
  position: absolute;
  right: 2rem;
  top: 2rem;
  z-index: 2;
  cursor: pointer;
  svg {
    width: 2.2rem;
    height: 2.2rem;
  }
`;

const SuccessIcon = styled.div`
  width: 5rem;
  height: 5rem;
  background: rgb(var(--primary));
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(255, 107, 0, 0.08);
`;

const Title = styled.h2`
  font-size: 2.1rem;
  color: rgb(var(--text));
  margin-bottom: 1.2rem;
  text-align: center;
  font-weight: bold;
`;

const OrderNumberBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
`;

const OrderNumberLabel = styled.div`
  font-size: 1.2rem;
  color: rgb(var(--text));
  margin-bottom: 0.5rem;
  letter-spacing: 0.04em;
`;

const OrderNumberRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  ${media('<=tablet')} {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const OrderNumberValue = styled.span`
  font-size: 2rem;
  color: rgb(var(--text));
  font-weight: bold;
  letter-spacing: 0.06em;
  background: rgba(var(--primary), 0.08);
  border-radius: 0.6rem;
  padding: 0.5rem 1.2rem;
  user-select: all;
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0.2rem 0.5rem;
  font-size: 1.5rem;
  color: rgb(var(--primary));
  transition: color 0.2s;
  outline: none;
  &:hover,
  &:focus {
    color: rgb(var(--primary));
    opacity: 0.8;
  }
`;

const CopyIcon = styled.span`
  font-size: 1.5rem;
  opacity: 0.7;
`;

const CopiedText = styled.span`
  font-size: 1.2rem;
  color: rgb(var(--success));
  margin-left: 0.3rem;
  transition: opacity 0.2s;
`;

const Description = styled.p`
  font-size: 1.4rem;
  color: rgb(var(--text));
  text-align: center;
  margin-bottom: 2rem;
  line-height: 1.5;
`;

const CloseButton = styled(Button)`
  width: 100%;
  max-width: 20rem;
  font-size: 1.2rem;
  padding: 1.3rem 0;
  border-radius: 0.6rem;
  margin-top: 1.5rem;
  background: rgb(var(--primary));
  color: #fff;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  box-shadow: var(--shadow-lg);
  transition: background 0.2s, box-shadow 0.2s;
  &:hover {
    background: rgb(var(--primary), 0.85);
    box-shadow: 0 0 0 3px rgba(var(--primary), 0.15);
  }
`;
