import NextLink from 'next/link';
import { FormEvent, KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import Button from 'components/Button';
import { CloseIcon, MinusIcon, PlusIcon } from 'components/Icons';
import Input from 'components/Input';
import { useCart } from 'contexts/cart.context';
import { useToast } from 'contexts/toast.context';
import { countEvent, readAttribution } from 'lib/attribution';
import { formatPrice } from 'lib/catalog';
import { formatPhone, phoneDigits } from 'lib/phone.mjs';
import { track, ymClientId } from 'lib/track';
import { media } from 'utils/media';

const CONTACTS = [
  ['phone', 'Телефон'],
  ['whatsapp', 'WhatsApp'],
  ['telegram', 'Telegram'],
] as const;

export default function Cart() {
  const { items, isCartOpen, totalPrice, totalOldPrice, removeItem, updateQuantity, replaceItems, toggleCart, clearCart } = useCart();
  const showToast = useToast();
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    if (!isCartOpen) return;
    track('cart_open');
    countEvent('cart');
    lastFocus.current = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && toggleCart();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    // Пока корзина открыта, остальное содержимое страницы недоступно для фокуса и скринридера.
    const chrome = Array.from(document.querySelectorAll<HTMLElement>('header, main, footer, section')).filter(
      (el) => !el.contains(panelRef.current),
    );
    chrome.forEach((el) => el.setAttribute('inert', ''));
    panelRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      chrome.forEach((el) => el.removeAttribute('inert'));
      const target = lastFocus.current?.isConnected ? lastFocus.current : document.querySelector<HTMLElement>('header button[aria-label^="Корзина"]');
      target?.focus();
    };
  }, [isCartOpen, toggleCart]);

  // Цены в localStorage могли устареть (правка в админке): при открытии корзины берём актуальные,
  // закончившиеся товары убираем — сервер их всё равно не примет.
  useEffect(() => {
    if (!isCartOpen) return;
    let cancelled = false;
    fetch('/api/site', { cache: 'no-store' })
      .then((r) => r.json())
      .then(({ products }: { products?: Record<string, { price: number; oldPrice: number; inStock: boolean }> }) => {
        if (cancelled || !products) return;
        const current = itemsRef.current;
        const next = current
          .filter((i) => products[i.id]?.inStock)
          .map((i) => ({ ...i, price: products[i.id].price, oldPrice: products[i.id].oldPrice }));
        const removed = next.length < current.length;
        const repriced = current.some((i) => products[i.id]?.inStock && (i.price !== products[i.id].price || i.oldPrice !== products[i.id].oldPrice));
        if (!removed && !repriced) return;
        replaceItems(next);
        if (removed) showToast('Товар закончился и удалён из корзины', 'error');
        if (repriced) showToast('Цена обновилась — проверьте сумму', 'error');
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isCartOpen, replaceItems, showToast]);

  function trapFocus(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  if (!isCartOpen) return null;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (phone.length !== 10) return showToast('Введите номер телефона полностью', 'error');
    const form = new FormData(e.currentTarget);
    setSending(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(({ id, quantity }) => ({ id, quantity })),
          contact: { phone, email: form.get('email'), preferredContact: form.get('preferredContact') },
          consent: form.get('consent') === 'on',
          attribution: { ...readAttribution(), ymClientId: await ymClientId() },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return showToast(data.message || 'Не удалось оформить заказ. Попробуйте ещё раз.', 'error');
      clearCart();
      setOrderId(data.orderId);
      track('order_submit', {
        value: totalPrice,
        currency: 'RUB',
        items: items.length,
      });
      // Онлайн-оплата включена в админке — уводим на страницу шлюза. Иначе показываем номер заказа, как раньше.
      if (data.paymentUrl) window.location.href = data.paymentUrl;
    } catch {
      showToast('Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.', 'error');
    } finally {
      setSending(false);
    }
  }

  const discount = (totalOldPrice ?? 0) - totalPrice;

  return (
    <Overlay onClick={toggleCart}>
      <Panel ref={panelRef} tabIndex={-1} onKeyDown={trapFocus} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Корзина" aria-modal="true">
        <Header>
          <h2>Корзина</h2>
          <IconButton type="button" aria-label="Закрыть" onClick={toggleCart}>
            <CloseIcon />
          </IconButton>
        </Header>
        <Body>
          {orderId ? (
            <Center>
              <h3>Заказ оформлен</h3>
              <p>
                Номер заказа: <OrderId>{orderId}</OrderId>
              </p>
              <p>Мы свяжемся с вами в ближайшее время для подтверждения.</p>
              <Button type="button" onClick={() => navigator.clipboard?.writeText(orderId).then(() => showToast('Номер скопирован'))} $outline>
                Скопировать номер
              </Button>
              <Button type="button" onClick={toggleCart}>
                Закрыть
              </Button>
            </Center>
          ) : items.length === 0 ? (
            <Center>
              <p>Корзина пуста.</p>
              <Button as={NextLink} href="/pricing" onClick={toggleCart}>
                В каталог →
              </Button>
            </Center>
          ) : (
            <>
              {items.map((item) => (
                <Item key={item.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt="" width={64} height={64} />
                  <div>
                    <b>{item.title}</b>
                    <Price>
                      {formatPrice(item.price)} {(item.oldPrice ?? 0) > item.price && <s>{formatPrice(item.oldPrice as number)}</s>}
                    </Price>
                  </div>
                  <Qty>
                    <IconButton type="button" aria-label="Меньше" onClick={() => (item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeItem(item.id))}>
                      <MinusIcon />
                    </IconButton>
                    <span>{item.quantity}</span>
                    <IconButton type="button" aria-label="Больше" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      <PlusIcon />
                    </IconButton>
                  </Qty>
                </Item>
              ))}
              <Summary>
                {discount > 0 && (
                  <Row>
                    <span>Скидка</span>
                    <span>−{formatPrice(discount)}</span>
                  </Row>
                )}
                <Row $total>
                  <span>Итого</span>
                  <span>{formatPrice(totalPrice)}</span>
                </Row>
              </Summary>
              <Form onSubmit={submit}>
                <fieldset>
                  <legend>Как с вами связаться?</legend>
                  <Contacts>
                    {CONTACTS.map(([value, label], i) => (
                      <label key={value}>
                        <input type="radio" name="preferredContact" value={value} defaultChecked={i === 0} />
                        {label}
                      </label>
                    ))}
                  </Contacts>
                </fieldset>
                <label>
                  Телефон
                  <Input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    placeholder="+7 (___) ___-__-__"
                    value={formatPhone(phone)}
                    onChange={(e) => setPhone(phoneDigits(e.target.value))}
                  />
                </label>
                <label>
                  Email
                  <Input
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    maxLength={120}
                    placeholder="example@mail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <Consent>
                  <input type="checkbox" name="consent" required />
                  <span>
                    Даю согласие на обработку персональных данных в соответствии с{' '}
                    <NextLink href="/privacy-policy" target="_blank">
                      политикой конфиденциальности
                    </NextLink>
                  </span>
                </Consent>
                <Trust>
                  <span>Доставка 1–3 дня по центральным регионам. Бесплатно от 5 000 ₽.</span>
                  <span>Возврат неустановленного товара — 14 дней.</span>
                  <NextLink href="/delivery" onClick={toggleCart}>
                    Условия доставки и оплаты
                  </NextLink>
                </Trust>
                <Button type="submit" disabled={sending}>
                  {sending ? 'Отправляем…' : 'Оформить заказ'}
                </Button>
              </Form>
            </>
          )}
        </Body>
      </Panel>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: rgba(var(--ink), 0.5);
`;

const Panel = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 44rem;
  display: flex;
  flex-direction: column;
  background: rgb(var(--bg));
  border-left: var(--line);

  &:focus {
    outline: none;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2rem;
  border-bottom: var(--line);

  h2 {
    font-size: 2.2rem;
  }
`;

const IconButton = styled.button`
  width: 4.4rem;
  height: 4.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: var(--line);
  border-radius: 0.4rem;
  background: none;
  color: rgb(var(--ink));
  font-size: 1.8rem;
  line-height: 1;
  cursor: pointer;

  &:hover {
    border-color: rgb(var(--accent-text));
    color: rgb(var(--accent-text));
  }
`;

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  font-size: 1.5rem;
`;

const Center = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.6rem;
  padding: 4rem 0;
  text-align: center;
  font-size: 1.6rem;

  h3 {
    font-size: 2.2rem;
  }
`;

const OrderId = styled.code`
  font-weight: 700;
  color: rgb(var(--accent-text));
  user-select: all;
`;

const Item = styled.div`
  display: grid;
  grid-template-columns: 6.4rem 1fr auto;
  gap: 1.6rem;
  align-items: center;
  padding: 1.6rem 0;
  border-bottom: var(--line);

  img {
    width: 6.4rem;
    height: 6.4rem;
    object-fit: contain;
    border: var(--line);
    border-radius: 0.4rem;
  }
  b {
    display: block;
    margin-bottom: 0.4rem;
  }
`;

const Price = styled.span`
  color: rgb(var(--accent-text));
  font-weight: 700;

  s {
    margin-left: 0.6rem;
    font-weight: 400;
    color: rgba(var(--ink), 0.6);
  }
`;

const Qty = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  span {
    min-width: 2rem;
    text-align: center;
  }
`;

const Summary = styled.div`
  padding: 1.6rem 0;
`;

const Row = styled.div<{ $total?: boolean }>`
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0;
  font-size: ${(p) => (p.$total ? '2rem' : '1.5rem')};
  font-weight: ${(p) => (p.$total ? 700 : 400)};
  opacity: ${(p) => (p.$total ? 1 : 0.7)};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  padding-top: 1.6rem;
  border-top: var(--line);

  fieldset {
    border: 0;
    padding: 0;
    margin: 0;
  }
  legend,
  & > label {
    display: block;
    font-weight: 700;
    margin-bottom: 0.6rem;
  }
  & > label input {
    margin-top: 0.6rem;
    font-weight: 400;
  }

  ${media('<=tablet')} {
    padding-bottom: 4rem;
  }
`;

const Contacts = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.8rem;

  label {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    padding: 1rem;
    border: var(--line);
    border-radius: 0.4rem;
    cursor: pointer;
    font-weight: 400;

    &:has(input:checked) {
      border-color: rgb(var(--accent-text));
      color: rgb(var(--accent-text));
    }
  }
  input {
    accent-color: rgb(var(--accent-text));
  }
`;

const Consent = styled.label`
  display: flex;
  gap: 0.8rem;
  align-items: flex-start;
  font-size: 1.3rem;
  line-height: 1.4;
  cursor: pointer;

  input {
    margin-top: 0.3rem;
    accent-color: rgb(var(--accent-text));
  }
  a {
    border-bottom: 1px solid currentColor;
  }
`;

const Trust = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding-top: 1.2rem;
  border-top: var(--line);
  font-size: 1.3rem;
  line-height: 1.4;
  color: rgba(var(--ink), 0.75);

  a {
    color: rgb(var(--accent-text));
    text-decoration: underline;
  }
`;
