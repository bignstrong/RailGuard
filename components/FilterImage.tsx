import Image from 'next/image';
import styled from 'styled-components';
import { media } from 'utils/media';

export default function FilterImage() {
  return (
    <ImageWrapper>
      <BackgroundDecoration />
      <ImageContainer>
        <StyledImage
          src="/webp/corpus_black.webp"
          alt="RailGuard фильтр тонкой очистки"
          width={300}
          height={400}
          priority
          quality={85}
        />
      </ImageContainer>
    </ImageWrapper>
  );
}

const ImageWrapper = styled.div`
  width: 100%;
  max-width: 600px;
  position: relative;
  perspective: 1500px;
  display: flex;
  justify-content: center;
  align-items: center;

  ${media('<=desktop')} {
    max-width: 500px;
    perspective: 1200px;
  }

  ${media('<=tablet')} {
    max-width: 400px;
    perspective: 800px;
  }

  ${media('<=phone')} {
    max-width: 100%;
    perspective: 600px;
    padding: 0 2rem;
  }
`;

const StyledImage = styled(Image)`
  object-fit: contain;
  max-width: 100%;
  height: auto;
  filter: drop-shadow(0 25px 50px rgba(0, 0, 0, 0.35));
  transform-style: preserve-3d;
  transition: all 0.5s ease;
  border-radius: 12px;

  ${media('<=desktop')} {
    filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.3));
  }

  ${media('<=tablet')} {
    filter: none;
  }

  ${media('<=phone')} {
    filter: none;
    border-radius: 8px;
  }
`;

const ImageContainer = styled.div`
  transform: rotateY(-12deg) rotateX(4deg);
  transition: all 0.5s ease;
  transform-style: preserve-3d;
  position: relative;
  z-index: 2;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;

  ${media('<=desktop')} {
    transform: rotateY(-8deg) rotateX(3deg);
  }

  ${media('<=tablet')} {
    transform: rotateY(-5deg) rotateX(2deg);
  }

  ${media('<=phone')} {
    transform: rotateY(-3deg) rotateX(1deg);
  }

  ${media('>tablet')} {
    &:hover {
      transform: scale(1.03) rotateY(-5deg) rotateX(2deg);

      ${StyledImage} {
        filter: drop-shadow(0 0 20px rgba(var(--primary), 0.3)) drop-shadow(0 25px 50px rgba(0, 0, 0, 0.35));
      }

      ${media('<=desktop')} {
        transform: scale(1.02) rotateY(-4deg) rotateX(1.5deg);
      }
    }
  }
`;

const BackgroundDecoration = styled.div`
  position: absolute;
  top: 13%;
  right: 0%;
  width: 75%;
  height: 75%;
  background: linear-gradient(135deg, rgba(var(--primary), 0.15) 0%, rgba(var(--primary), 0.05) 100%);
  border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
  z-index: 1;
  animation: morphBackground 15s ease-in-out infinite;
  backdrop-filter: blur(10px);

  @keyframes morphBackground {
    0% {
      border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
    }
    50% {
      border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%;
    }
    100% {
      border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
    }
  }

  ${media('<=desktop')} {
    width: 65%;
    height: 65%;
    right: 0%;
    top: 15%;
  }

  ${media('<=tablet')} {
    width: 55%;
    height: 55%;
    right: 0;
    top: 18%;
    opacity: 0.8;
  }

  ${media('<=phone')} {
    width: 45%;
    height: 45%;
    right: 5%;
    top: 20%;
    opacity: 0.6;
    animation: none;
    border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
    background: linear-gradient(135deg, rgba(var(--primary), 0.1) 0%, rgba(var(--primary), 0.03) 100%);
  }
`;

const Certification = styled.div`
  position: absolute;
  bottom: 5%;
  right: 5%;
  background: rgba(255, 255, 255, 0.95);
  padding: 1rem 2rem;
  border-radius: 2rem;
  font-weight: bold;
  color: rgb(var(--primary));
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 3;
  font-size: 1.6rem;

  ${media('<=tablet')} {
    font-size: 1.4rem;
    padding: 0.8rem 1.6rem;
  }

  ${media('<=phone')} {
    font-size: 1.2rem;
    padding: 0.6rem 1.2rem;
    right: 50%;
    transform: translateX(50%);
    white-space: nowrap;
    bottom: 2%;
  }
`;
