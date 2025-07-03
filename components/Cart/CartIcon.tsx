import { useCart } from 'contexts/cart.context';
import styled from 'styled-components';
import { media } from 'utils/media';

export default function CartIcon() {
  const { totalItems, toggleCart } = useCart();

  return (
    <>
      <IconWrapper onClick={toggleCart}>
        <IconContainer>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M7 18C5.9 18 5.01 18.9 5.01 20C5.01 21.1 5.9 22 7 22C8.1 22 9 21.1 9 20C9 18.9 8.1 18 7 18ZM1 2V4H3L6.6 11.59L5.25 14.04C5.09 14.32 5 14.65 5 15C5 16.1 5.9 17 7 17H19V15H7.42C7.28 15 7.17 14.89 7.17 14.75L7.2 14.63L8.1 13H15.55C16.3 13 16.96 12.59 17.3 11.97L20.88 5.48C20.96 5.34 21 5.17 21 5C21 4.45 20.55 4 20 4H5.21L4.27 2H1ZM17 18C15.9 18 15.01 18.9 15.01 20C15.01 21.1 15.9 22 17 22C18.1 22 19 21.1 19 20C19 18.9 18.1 18 17 18Z"
              fill="white"
            />
          </svg>
          {totalItems > 0 && <Badge>{totalItems}</Badge>}
        </IconContainer>
      </IconWrapper>
    </>
  );
}

const IconWrapper = styled.button`
  background-color: rgb(var(--primary));
  border: none;
  border-radius: 0.5rem;
  padding: 1rem 2rem;
  cursor: pointer;
  color: white;
  font-size: 1.3rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  font-weight: 700;
  outline: none;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgb(var(--primary), 0.9);
  }

  &:active {
    transform: scale(0.95);
  }

  ${media('<=desktop')} {
    padding: 0.8rem 1rem;
    margin: 0 1rem;
  }
`;

const IconContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Badge = styled.span`
  position: absolute;
  top: -0.8rem;
  right: -1.2rem;
  background: rgb(var(--danger));
  color: white;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
  animation: badgePop 0.3s ease-out;

  @keyframes badgePop {
    0% {
      transform: scale(0);
    }
    80% {
      transform: scale(1.2);
    }
    100% {
      transform: scale(1);
    }
  }
`;
