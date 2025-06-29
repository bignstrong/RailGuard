import Button from 'components/Button';
import CloseIcon from 'components/CloseIcon';
import { useCart } from 'contexts/cart.context';
import { useToast } from 'contexts/toast.context';
import { useRouter } from 'next/router';
import React, { useCallback, useState } from 'react';
import InputMask from 'react-input-mask';
import styled from 'styled-components';
import { media } from 'utils/media';
import Link from '../Link';
import OrderSuccessModal from '../OrderSuccessModal';

interface CheckoutForm {
  phone: string;
  email: string;
  preferredContact: 'phone' | 'whatsapp' | 'telegram';
}

interface ContactOptionProps {
  isSelected: boolean;
}

interface IconWrapperProps {
  isSelected: boolean;
}

const EmptyCartWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem;
  gap: 2rem;
`;

const EmptyCartIcon = styled.div`
  svg {
    width: 8rem;
    height: 8rem;
    opacity: 0.3;
  }
`;

const EmptyCartMessage = styled.p`
  font-size: 1.8rem;
  color: rgb(var(--text-secondary));
  line-height: 1.6;

  a {
    text-decoration: underline;
    color: rgb(var(--primary));
  }
`;

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
    <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 0 0-1.02.24l-2.2 2.2a15.045 15.045 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1A11.36 11.36 0 0 1 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM19 12h2a9 9 0 0 0-9-9v2c3.87 0 7 3.13 7 7z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const TelegramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.325.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const cleanPhone = (input: string) => {
  let value = input.replace(/\D/g, '');
  if (value.startsWith('8')) value = value.slice(1);
  if (value.startsWith('7')) value = value.slice(1);
  if (value.length > 10) value = value.slice(-10);
  return value;
};

// Функция для форматирования 10 цифр в маску
function formatPhone(phone: string) {
  const nums = phone.replace(/\D/g, '').slice(0, 10);
  if (!nums) return '';
  let res = '+7 (';
  res += nums.slice(0, 3);
  if (nums.length >= 3) res += ') ';
  if (nums.length >= 4) res += nums.slice(3, 6);
  if (nums.length >= 7) res += '-' + nums.slice(6, 8);
  if (nums.length >= 9) res += '-' + nums.slice(8, 10);
  return res;
}

export default function Cart() {
  const { items, isCartOpen, totalPrice, totalOldPrice, removeItem, updateQuantity, toggleCart, clearCart } = useCart();
  const { showToast } = useToast();
  const [form, setForm] = useState<CheckoutForm>({
    phone: '',
    email: '',
    preferredContact: 'phone',
  });
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const router = useRouter();

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, phone: cleanPhone(e.target.value) }));
  }, []);

  const handlePhonePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    let paste = e.clipboardData.getData('Text');
    const cleaned = cleanPhone(paste);
    setForm((prev) => ({ ...prev, phone: cleaned }));
    e.preventDefault();
  }, []);
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, email: e.target.value }));
  }, []);

  const validatePhoneNumber = (phone: string) => {
    // Проверяем, что нет символов _ (все цифры введены)
    return phone && !phone.includes('_');
  };

  const handlePricingClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    toggleCart();
    setTimeout(() => {
      router.push('/pricing');
    }, 400); // 400 мс под анимацию закрытия
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePhoneNumber(form.phone)) {
      showToast('Пожалуйста, введите корректный номер телефона', 'error');
      return;
    }

    try {
      const orderData = {
        items,
        contact: form,
        totalPrice,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const data = await response.json();

      // Clear cart but don't close it yet
      clearCart();
      // Show success modal with order ID
      setSuccessOrderId(data.orderId);
    } catch (error) {
      console.error('Error submitting order:', error);
      showToast('Произошла ошибка при оформлении заказа. Пожалуйста, попробуйте еще раз.', 'error');
    }
  };

  const handleCloseSuccessModal = () => {
    setSuccessOrderId(null);
    toggleCart(); // Close cart after closing success modal
  };

  if (!isCartOpen) return null;

  return (
    <>
      <Overlay isOpen={isCartOpen} onClick={toggleCart}>
        <CartWrapper isOpen={isCartOpen} onClick={(e) => e.stopPropagation()}>
          <Header>
            <Title>Корзина</Title>
            <CloseButton onClick={toggleCart}>
              <CloseIcon />
            </CloseButton>
          </Header>
          <Content>
            {items.length === 0 ? (
              <EmptyCartWrapper>
                <EmptyCartIcon>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </EmptyCartIcon>
                <EmptyCartMessage>
                  Ваша корзина пуста, но это не{' '}
                  <Link href="/pricing" onClick={handlePricingClick}>
                    проблема
                  </Link>
                  !
                </EmptyCartMessage>
              </EmptyCartWrapper>
            ) : (
              <>
                <ItemsList>
                  {items.map((item) => (
                    <CartItem key={item.id}>
                      <ItemImage src={item.image} alt={item.title} />
                      <ItemInfo>
                        <ItemTitle>{item.title}</ItemTitle>
                        <PriceWrapper>
                          <ItemPrice>{item.price.toLocaleString('ru-RU')}₽</ItemPrice>
                          {item.oldPrice && <ItemOldPrice>{item.oldPrice.toLocaleString('ru-RU')}₽</ItemOldPrice>}
                        </PriceWrapper>
                      </ItemInfo>
                      <ItemActions>
                        <QuantityControl>
                          <QuantityButton onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</QuantityButton>
                          <QuantityDisplay>{item.quantity}</QuantityDisplay>
                          <QuantityButton onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</QuantityButton>
                        </QuantityControl>
                        <RemoveButton onClick={() => removeItem(item.id)}>Удалить</RemoveButton>
                      </ItemActions>
                    </CartItem>
                  ))}
                </ItemsList>

                <Summary>
                  <SummaryRow>
                    <span>Товары</span>
                    <PriceWrapper>
                      <ItemPrice>{totalPrice.toLocaleString('ru-RU')}₽</ItemPrice>
                      {totalOldPrice && totalOldPrice > totalPrice && <ItemOldPrice>{totalOldPrice.toLocaleString('ru-RU')}₽</ItemOldPrice>}
                    </PriceWrapper>
                  </SummaryRow>
                  {totalOldPrice && totalOldPrice > totalPrice && (
                    <SummaryRow highlight>
                      <span>Скидка</span>
                      <span>-{(totalOldPrice - totalPrice).toLocaleString('ru-RU')}₽</span>
                    </SummaryRow>
                  )}
                  <TotalPrice>
                    <span>Итого:</span>
                    <span>{totalPrice.toLocaleString('ru-RU')}₽</span>
                  </TotalPrice>
                </Summary>

                <CheckoutForm onSubmit={handleSubmit}>
                  <FormGroup>
                    <Label>Как с вами связаться?</Label>
                    <ContactOptions>
                      <ContactOption isSelected={form.preferredContact === 'phone'}>
                        <HiddenRadio
                          type="radio"
                          name="preferredContact"
                          value="phone"
                          checked={form.preferredContact === 'phone'}
                          onChange={(e) => setForm({ ...form, preferredContact: e.target.value as 'phone' | 'whatsapp' | 'telegram' })}
                        />
                        <IconWrapper isSelected={form.preferredContact === 'phone'}>
                          <PhoneIcon />
                        </IconWrapper>
                        <span>Телефон</span>
                      </ContactOption>
                      <ContactOption isSelected={form.preferredContact === 'whatsapp'}>
                        <HiddenRadio
                          type="radio"
                          name="preferredContact"
                          value="whatsapp"
                          checked={form.preferredContact === 'whatsapp'}
                          onChange={(e) => setForm({ ...form, preferredContact: e.target.value as 'phone' | 'whatsapp' | 'telegram' })}
                        />
                        <IconWrapper isSelected={form.preferredContact === 'whatsapp'}>
                          <WhatsAppIcon />
                        </IconWrapper>
                        <span>WhatsApp</span>
                      </ContactOption>
                      <ContactOption isSelected={form.preferredContact === 'telegram'}>
                        <HiddenRadio
                          type="radio"
                          name="preferredContact"
                          value="telegram"
                          checked={form.preferredContact === 'telegram'}
                          onChange={(e) => setForm({ ...form, preferredContact: e.target.value as 'phone' | 'whatsapp' | 'telegram' })}
                        />
                        <IconWrapper isSelected={form.preferredContact === 'telegram'}>
                          <TelegramIcon />
                        </IconWrapper>
                        <span>Telegram</span>
                      </ContactOption>
                    </ContactOptions>
                  </FormGroup>
                  <FormGroup>
                    <Label htmlFor="phone">Номер телефона</Label>
                    <InputMask
                      mask="+7 (999) 999-99-99"
                      value={formatPhone(form.phone)}
                      onChange={handlePhoneChange}
                      onPaste={handlePhonePaste}
                      maskChar="_"
                    >
                      {(inputProps: any) => (
                        <PhoneInput id="phone" type="tel" required placeholder="+7 (___) ___-__-__" inputMode="tel" {...inputProps} />
                      )}
                    </InputMask>
                  </FormGroup>
                  <FormGroup>
                    <Label htmlFor="email">Email</Label>
                    <EmailInput
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={handleEmailChange}
                      placeholder="example@mail.com"
                      required
                    />
                  </FormGroup>
                  <SubmitButton as="button" type="submit">
                    Оформить заказ
                  </SubmitButton>
                </CheckoutForm>
              </>
            )}
          </Content>
        </CartWrapper>
      </Overlay>
      {successOrderId && <OrderSuccessModal orderId={successOrderId} onClose={handleCloseSuccessModal} />}
    </>
  );
}

const Overlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: var(--z-modal);
  opacity: ${(p) => (p.isOpen ? 1 : 0)};
  visibility: ${(p) => (p.isOpen ? 'visible' : 'hidden')};
  transition: opacity 0.3s ease, visibility 0.3s ease;
`;

const CartWrapper = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  max-width: 40rem;
  height: 100%;
  background: rgb(var(--background));
  box-shadow: -2px 0 4px rgba(0, 0, 0, 0.1);
  z-index: var(--z-modal);
  display: flex;
  flex-direction: column;
  transform: ${(p) => (p.isOpen ? 'translateX(0)' : 'translateX(100%)')};
  transition: transform 0.3s ease;

  ${media('<=tablet')} {
    max-width: 100%;
    right: 0;
    bottom: 0;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  border-bottom: 1px solid rgb(var(--border));
  background: rgb(var(--background));
  position: sticky;
  top: 0;
  z-index: 1;

  ${media('<=tablet')} {
    padding: 1.6rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
`;

const Title = styled.h2`
  font-size: 2.4rem;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: rgb(var(--text));

  &:hover {
    color: rgb(var(--primary));
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  -webkit-overflow-scrolling: touch;

  ${media('<=tablet')} {
    padding: 1.6rem;
  }
`;

const ItemsList = styled.div`
  margin-bottom: 2rem;
`;

const CartItem = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 1.5rem;
  border-bottom: 1px solid rgb(var(--border));
  background: rgb(var(--background));
  border-radius: 0.8rem;
  margin-bottom: 1rem;
  transition: transform 0.2s ease;

  ${media('<=tablet')} {
    padding: 1.2rem;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 1rem;
  }
`;

const ItemImage = styled.img`
  width: 8rem;
  height: 8rem;
  object-fit: contain;
  border-radius: 0.8rem;
  background-color: rgb(var(--background-secondary));
  padding: 0.5rem;
  border: 1px solid rgb(var(--border));

  ${media('<=tablet')} {
    width: 7rem;
    height: 7rem;
  }
`;

const ItemInfo = styled.div`
  flex: 1;
  margin: 0 2rem;

  ${media('<=tablet')} {
    margin: 0 1rem;
    flex-basis: calc(100% - 9rem);
  }
`;

const ItemTitle = styled.h3`
  font-size: 1.6rem;
  margin: 0 0 0.5rem 0;
`;

const PriceWrapper = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.8rem;
`;

const ItemPrice = styled.div`
  font-size: 1.6rem;
  color: rgb(var(--primary));
  font-weight: 500;
`;

const ItemOldPrice = styled.div`
  font-size: 1.4rem;
  color: rgba(var(--text), 0.6);
  text-decoration: line-through;
`;

const ItemActions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;
  margin-left: auto;
  flex-shrink: 0;
  align-self: center;

  ${media('<=tablet')} {
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    align-items: center;
    margin-top: 0.5rem;
  }
`;

const QuantityControl = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgb(var(--background-secondary));
  padding: 0.4rem;
  border-radius: 0.6rem;

  ${media('<=tablet')} {
    order: 1;
  }
`;

const QuantityButton = styled.button`
  background: rgb(var(--background));
  border: none;
  border-radius: 0.4rem;
  width: 2.8rem;
  height: 2.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.6rem;
  color: rgb(var(--text));
  transition: all 0.2s ease;

  &:hover {
    background: rgb(var(--primary));
    color: rgb(var(--background));
  }

  ${media('<=tablet')} {
    width: 2.4rem;
    height: 2.4rem;
  }
`;

const QuantityDisplay = styled.span`
  font-size: 1.4rem;
  min-width: 2rem;
  text-align: center;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: rgb(var(--danger));
  cursor: pointer;
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.4rem;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(var(--danger), 0.1);
  }

  ${media('<=tablet')} {
    order: 2;
    padding: 0.4rem 0.8rem;
  }
`;

const Summary = styled.div`
  margin: 2rem 0;
  padding: 1.5rem;
  border-radius: 0.8rem;
  background: rgb(var(--background-secondary));
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const SummaryRow = styled.div<{ highlight?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.6rem;
  color: ${(p) => (p.highlight ? 'rgba(var(--text), 0.6)' : 'rgb(var(--text))')};

  &:not(:last-child) {
    margin-bottom: 1rem;
  }
`;

const TotalPrice = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 2rem;
  font-weight: bold;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgb(var(--border));

  & > span:last-child {
    color: rgb(var(--primary));
  }

  ${media('<=tablet')} {
    position: sticky;
    bottom: 0;
    margin: 0;
    padding: 1.2rem;
    background: rgb(var(--background));
    border-top: 1px solid rgb(var(--border));
  }
`;

const CheckoutForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-top: 2rem;
  padding: 2rem;
  border-radius: 0.8rem;
  background: rgb(var(--background-secondary));

  ${media('<=tablet')} {
    padding: 1.6rem;
    margin-top: 1.6rem;
    margin-bottom: 8rem;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const Label = styled.label`
  font-size: 1.4rem;
  color: rgb(var(--text));
  font-weight: 500;
`;

const Input = styled.input`
  padding: 1.2rem;
  border: 1px solid rgb(var(--border));
  border-radius: 0.8rem;
  font-size: 1.6rem;
  background: rgb(var(--background));
  transition: all 0.2s ease;
  color: rgb(var(--text));

  &::placeholder {
    color: rgb(var(--text-secondary));
    opacity: 0.8;
  }

  &:focus {
    border-color: rgb(var(--primary));
    outline: none;
    box-shadow: 0 0 0 2px rgba(var(--primary), 0.1);
  }

  ${media('<=tablet')} {
    padding: 1rem;
    font-size: 1.4rem;
  }
`;

const ContactOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.2rem;
  margin-bottom: 2rem;

  ${media('<=tablet')} {
    gap: 1rem;
  }
`;

const IconWrapper = styled.div<IconWrapperProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.6rem;
  height: 3.6rem;
  border-radius: 50%;
  background: ${(props) => (props.isSelected ? 'rgb(var(--primary))' : 'transparent')};
  margin-bottom: 0.8rem;

  svg {
    width: 2rem;
    height: 2rem;
    path {
      fill: ${(props) => (props.isSelected ? '#FFFFFF' : 'rgb(var(--text))')};
    }
  }

  ${media('<=tablet')} {
    width: 3.2rem;
    height: 3.2rem;

    svg {
      width: 1.8rem;
      height: 1.8rem;
    }
  }
`;

const ContactOption = styled.label<ContactOptionProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.2rem 1rem;
  border-radius: 1.2rem;
  background: ${(props) => (props.isSelected ? 'rgba(var(--primary), 0.08)' : 'rgb(var(--background))')};
  border: 2px solid ${(props) => (props.isSelected ? 'rgb(var(--primary))' : 'rgba(var(--border), 0.5)')};
  cursor: pointer;

  span {
    font-size: 1.4rem;
    font-weight: 500;
    color: ${(props) => (props.isSelected ? 'rgb(var(--primary))' : 'rgb(var(--text))')};
    text-align: center;
  }

  ${media('<=tablet')} {
    padding: 1rem 0.8rem;

    span {
      font-size: 1.3rem;
    }
  }
`;

const HiddenRadio = styled.input`
  display: none;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-top: 2rem;
`;

const PhoneInput = styled(Input)`
  font-size: 1.8rem;
  padding: 1.4rem;
  border-radius: 10px;
  border: 2px solid rgb(var(--border));
  transition: all 0.3s ease;
  letter-spacing: 1px;
  font-family: monospace;

  &:focus {
    border-color: rgb(var(--primary));
    box-shadow: 0 0 0 3px rgba(var(--primary), 0.1);
  }

  &::placeholder {
    color: rgba(var(--text), 0.4);
    letter-spacing: normal;
    font-family: inherit;
  }
`;

const EmailInput = styled(Input)`
  font-size: 1.6rem;
  padding: 1.4rem;
  border-radius: 10px;
  border: 2px solid rgb(var(--border));
  transition: all 0.3s ease;

  &:focus {
    border-color: rgb(var(--primary));
    box-shadow: 0 0 0 3px rgba(var(--primary), 0.1);
  }

  &::placeholder {
    color: rgba(var(--text), 0.4);
  }
`;
const SubmitButton = styled(Button)`
  width: 100%;
  margin-top: 2rem;
  padding: 1.4rem;
  font-size: 1.6rem;
  border-radius: 0.8rem;
  background: rgb(var(--primary));
  color: rgb(var(--textSecondary));
  text-transform: none;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(var(--primary), 0.3);
  }

  ${media('<=tablet')} {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    margin: 0;
    border-radius: 0;
    z-index: 2;
  }
`;
