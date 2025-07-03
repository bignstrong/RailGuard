import { useLightbox } from 'contexts/lightbox.context';
import { useNewsletterModalContext } from 'contexts/newsletter-modal.context';
import { ScrollPositionEffectProps, useScrollPosition } from 'hooks/useScrollPosition';
import dynamic from 'next/dynamic';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useRef, useState } from 'react';
import styled from 'styled-components';
import { NavItems, SingleNavItem } from 'types';
import { media } from 'utils/media';
import Button from './Button';
import CartIcon from './Cart/CartIcon';
import Container from './Container';
import Drawer from './Drawer';
import { HamburgerIcon } from './HamburgerIcon';
import Logo from './Logo';

const ColorSwitcher = dynamic(() => import('../components/ColorSwitcher'), { ssr: false });

type NavbarProps = { items: NavItems };
type ScrollingDirections = 'up' | 'down' | 'none';
type NavbarContainerProps = { hidden: boolean; transparent: boolean };

interface NavItemLinkProps {
  outlined?: boolean;
}

export default function Navbar({ items }: NavbarProps) {
  const router = useRouter();
  const { toggle } = Drawer.useDrawer();
  const [scrollingDirection, setScrollingDirection] = useState<ScrollingDirections>('none');
  const { imageUrl } = useLightbox();

  let lastScrollY = useRef(0);
  const lastRoute = useRef('');
  const stepSize = useRef(50);

  useScrollPosition(scrollPositionCallback, [router.asPath], undefined, undefined, 50);

  function scrollPositionCallback({ currPos }: ScrollPositionEffectProps) {
    const routerPath = router.asPath;
    const hasRouteChanged = routerPath !== lastRoute.current;

    if (hasRouteChanged) {
      lastRoute.current = routerPath;
      setScrollingDirection('none');
      return;
    }

    const currentScrollY = currPos.y;
    const isScrollingUp = currentScrollY > lastScrollY.current;
    const scrollDifference = Math.abs(lastScrollY.current - currentScrollY);
    const hasScrolledWholeStep = scrollDifference >= stepSize.current;
    const isInNonCollapsibleArea = lastScrollY.current > -50;

    if (isInNonCollapsibleArea) {
      setScrollingDirection('none');
      lastScrollY.current = currentScrollY;
      return;
    }

    if (!hasScrolledWholeStep) {
      lastScrollY.current = currentScrollY;
      return;
    }

    setScrollingDirection(isScrollingUp ? 'up' : 'down');
    lastScrollY.current = currentScrollY;
  }

  const isNavbarHidden = scrollingDirection === 'down' || !!imageUrl;
  const isTransparent = scrollingDirection === 'none' && !imageUrl;

  return (
    <NavbarContainer hidden={isNavbarHidden} transparent={isTransparent}>
      <Content>
        <Left>
          <NextLink href="/" passHref legacyBehavior>
            <LogoAnchor>
              <Logo />
            </LogoAnchor>
          </NextLink>
        </Left>
        <Right>
          <NavItemList>
            {items.map((singleItem) => (
              <NavItem key={singleItem.href} {...singleItem} />
            ))}
          </NavItemList>
          <NavActions>
            <ColorSwitcherContainer>
              <ColorSwitcher />
            </ColorSwitcherContainer>
            <CartIconWrapper>
              <CartIcon />
            </CartIconWrapper>

            <HamburgerMenuWrapper>
              <HamburgerIcon aria-label="Toggle menu" onClick={toggle} />
            </HamburgerMenuWrapper>
          </NavActions>
        </Right>
      </Content>
    </NavbarContainer>
  );
}

function NavItem({ href, title, outlined }: SingleNavItem) {
  const { setIsModalOpened } = useNewsletterModalContext();

  function showNewsletterModal() {
    setIsModalOpened(true);
  }

  if (outlined) {
    return <CustomButton onClick={showNewsletterModal}>{title}</CustomButton>;
  }

  return (
    <NavItemWrapper outlined={outlined}>
      <NextLink href={href} passHref legacyBehavior>
        <NavItemAnchor outlined={outlined}>{title}</NavItemAnchor>
      </NextLink>
    </NavItemWrapper>
  );
}

const CustomButton = styled(Button)`
  padding: 0.75rem 1.5rem;
  line-height: 1.8;
`;

const NavItemList = styled.div`
  display: flex;
  list-style: none;

  ${media('<desktop')} {
    display: none;
  }
`;

const HamburgerMenuWrapper = styled.div`
  ${media('>=desktop')} {
    display: none;
  }
`;

const LogoAnchor = styled.a`
  display: flex;
  margin-right: auto;
  text-decoration: none !important;
  color: rgb(var(--logoColor));
  border-bottom: none !important;
  background: none !important;
  box-shadow: none !important;
  span,
  img {
    text-decoration: none !important;
    border-bottom: none !important;
    background: none !important;
    box-shadow: none !important;
  }
`;

const NavItemWrapper = styled.li<Partial<SingleNavItem>>`
  background-color: ${(p) => (p.outlined ? 'rgb(var(--primary))' : 'transparent')};
  border-radius: 0.5rem;
  font-size: 1.3rem;
  text-transform: uppercase;
  line-height: 2;

  &:hover {
    background-color: ${(p) => (p.outlined ? 'rgb(var(--primary), 0.8)' : 'transparent')};
    transition: background-color 0.2s;
  }

  &:not(:last-child) {
    margin-right: 2rem;
  }
`;

const NavItemAnchor = styled.a<NavItemLinkProps>`
  display: flex;
  color: ${(p) => (p.outlined ? 'rgb(var(--textSecondary))' : 'rgb(var(--text), 0.75)')};
  letter-spacing: 0.025em;
  text-decoration: none;
  padding: 0.75rem 1.5rem;
  font-weight: 700;
`;

const NavbarContainer = styled.div<NavbarContainerProps>`
  display: flex;
  position: sticky;
  top: 0;
  padding: 1.5rem 0;
  width: 100%;
  height: 8rem;
  z-index: var(--z-navbar);

  background-color: rgb(var(--navbarBackground));
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 5%);
  visibility: ${(p) => (p.hidden ? 'hidden' : 'visible')};
  transform: ${(p) => (p.hidden ? `translateY(-8rem) translateZ(0) scale(1)` : 'translateY(0) translateZ(0) scale(1)')};

  transition-property: transform, visibility, height, box-shadow, background-color;
  transition-duration: 0.15s;
  transition-timing-function: ease-in-out;
`;

const Content = styled(Container)`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  flex: 1;

  ${LogoAnchor} {
    margin-right: auto;
  }
`;

const Right = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
`;

const NavActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const CartIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ColorSwitcherContainer = styled.div`
  width: 4rem;
  margin: 0 1rem;

  ${media('<desktop')} {
    display: none;
  }
`;
