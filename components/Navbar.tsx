import Image from 'next/image';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useCart } from 'contexts/cart.context';
import { media } from 'utils/media';
import Container from './Container';

export const NAV_ITEMS = [
  { title: 'Каталог', href: '/pricing' },
  { title: 'Характеристики', href: '/specifications' },
  { title: 'Совместимость', href: '/compatibility' },
  { title: 'Доставка', href: '/delivery' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useRouter();
  const { totalItems, toggleCart } = useCart();

  useEffect(() => setOpen(false), [pathname]);

  return (
    <Bar>
      <Content>
        <Logo href="/">
          <Image src="/webp/Logo.webp" alt="" width={40} height={40} />
          RailGuard
        </Logo>
        <Menu $open={open}>
          {NAV_ITEMS.map((item) => (
            <MenuLink key={item.href} href={item.href} $active={pathname === item.href}>
              {item.title}
            </MenuLink>
          ))}
        </Menu>
        <Actions>
          <CartButton type="button" onClick={toggleCart} aria-label="Корзина">
            Корзина{totalItems > 0 && <Badge>{totalItems}</Badge>}
          </CartButton>
          <Burger type="button" aria-label="Меню" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? '✕' : '☰'}
          </Burger>
        </Actions>
      </Content>
    </Bar>
  );
}

const Bar = styled.header`
  position: sticky;
  top: 0;
  z-index: var(--z-navbar);
  height: 7rem;
  background: rgb(var(--bg));
  border-bottom: var(--line);
`;

const Content = styled(Container)`
  display: flex;
  align-items: center;
  height: 100%;
  gap: 3rem;
`;

const Logo = styled(NextLink)`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  margin-right: auto;
`;

const Menu = styled.nav<{ $open: boolean }>`
  display: flex;
  gap: 3rem;

  ${media('<desktop')} {
    display: ${(p) => (p.$open ? 'flex' : 'none')};
    position: absolute;
    top: 7rem;
    left: 0;
    right: 0;
    flex-direction: column;
    gap: 0;
    background: rgb(var(--bg));
    border-bottom: var(--line);
  }
`;

const MenuLink = styled(NextLink)<{ $active: boolean }>`
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${(p) => (p.$active ? 'rgb(var(--accent))' : 'rgba(var(--ink), 0.8)')};

  &:hover {
    color: rgb(var(--accent));
  }

  ${media('<desktop')} {
    padding: 2rem;
    border-top: var(--line);
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 1.6rem;
`;

const CartButton = styled.button`
  position: relative;
  padding: 1rem 1.8rem;
  border: 0;
  border-radius: 0.4rem;
  background: rgb(var(--accent));
  color: rgb(var(--bg));
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;

  &:hover {
    opacity: 0.85;
  }
`;

const Badge = styled.span`
  position: absolute;
  top: -0.8rem;
  right: -0.8rem;
  min-width: 2.2rem;
  height: 2.2rem;
  padding: 0 0.6rem;
  border-radius: 1.1rem;
  background: rgb(var(--ink));
  color: rgb(var(--bg));
  font-size: 1.2rem;
  line-height: 2.2rem;
  text-align: center;
`;

const Burger = styled.button`
  display: none;
  width: 4rem;
  height: 4rem;
  border: 0;
  background: none;
  font-size: 2.4rem;
  line-height: 1;
  cursor: pointer;

  ${media('<desktop')} {
    display: block;
  }
`;
