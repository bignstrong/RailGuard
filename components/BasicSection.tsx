import { PropsWithChildren, ReactNode } from 'react';
import styled from 'styled-components';
import { media } from 'utils/media';
import Container from './Container';
import OverTitle from './OverTitle';
import RichText from './RichText';

interface BasicSectionProps {
  image: ReactNode;
  title: string;
  overTitle: string;
  reversed?: boolean;
}

export default function BasicSection({ image, title, overTitle, reversed, children }: PropsWithChildren<BasicSectionProps>) {
  return (
    <Wrapper $reversed={reversed}>
      <ImageContainer>{image}</ImageContainer>
      <ContentContainer>
        <OverTitle>{overTitle}</OverTitle>
        <Title>{title}</Title>
        <RichText>{children}</RichText>
      </ContentContainer>
    </Wrapper>
  );
}

const Title = styled.h2`
  font-size: 4.4rem;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 2rem 0 3rem;

  ${media('<=tablet')} {
    font-size: 3.2rem;
    margin-bottom: 2rem;
  }
`;

const ImageContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ContentContainer = styled.div`
  flex: 1;
`;

const Wrapper = styled(Container)<{ $reversed?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6rem;
  flex-direction: ${(p) => (p.$reversed ? 'row-reverse' : 'row')};

  ${media('<=desktop')} {
    flex-direction: column;
    gap: 3rem;

    ${ImageContainer} {
      order: 2;
      width: 100%;
    }
  }
`;
