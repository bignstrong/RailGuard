import NextImage from 'next/image';
import { PropsWithChildren, ReactNode } from 'react';
import styled from 'styled-components';
import { media } from 'utils/media';
import Container from './Container';
import OverTitle from './OverTitle';
import RichText from './RichText';

export interface BasicSectionProps {
  imageUrl?: string;
  imageComponent?: ReactNode;
  title: string;
  overTitle: string;
  reversed?: boolean;
}

export default function BasicSection({
  imageUrl,
  imageComponent,
  title,
  overTitle,
  reversed,
  children,
}: PropsWithChildren<BasicSectionProps>) {
  return (
    <BasicSectionWrapper reversed={reversed}>
      <ImageContainer>
        {imageUrl && <NextImage src={imageUrl} alt={title} layout="fill" objectFit="cover" />}
        {imageComponent}
      </ImageContainer>
      <ContentContainer>
        <CustomOverTitle>{overTitle}</CustomOverTitle>
        <Title>{title}</Title>
        <RichText>{children}</RichText>
      </ContentContainer>
    </BasicSectionWrapper>
  );
}

const Title = styled.h1`
  font-size: 5.2rem;
  font-weight: bold;
  line-height: 1.1;
  margin-bottom: 4rem;
  letter-spacing: -0.03em;

  ${media('<=tablet')} {
    font-size: 4.6rem;
    margin-bottom: 2rem;
  }
`;

const CustomOverTitle = styled(OverTitle)`
  margin-bottom: 2rem;
`;

const ImageContainer = styled.div`
  flex: 1;
  position: relative;

  ${media('<=desktop')} {
    width: 100%;
    order: 2;
  }
`;

const ContentContainer = styled.div`
  flex: 1;

  ${media('<=desktop')} {
    order: 1;
  }
`;

type Props = Pick<BasicSectionProps, 'reversed'>;
const BasicSectionWrapper = styled(Container)`
  display: flex;
  align-items: center;
  flex-direction: ${(p: Props) => (p.reversed ? 'row-reverse' : 'row')};

  ${ImageContainer} {
    margin: ${(p: Props) => (p.reversed ? '0 0 0 5rem' : '0 5rem 0 0')};
  }

  ${media('<=desktop')} {
    flex-direction: column;

    ${ImageContainer} {
      margin: 2.5rem 0 0 0;
    }
  }
`;
