import { EnvVars } from 'env';
import Head from 'next/head';
import { PropsWithChildren } from 'react';
import styled from 'styled-components';
import { media } from 'utils/media';
import Container from './Container';
import SectionTitle from './SectionTitle';

export interface PageProps {
  title: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  robots?: string;
  ogImage?: string;
}

export default function Page({ title, description, keywords, canonical, robots, ogImage, children }: PropsWithChildren<PageProps>) {
  const siteName = EnvVars.SITE_NAME;
  const siteUrl = EnvVars.URL;
  const ogImageUrl = ogImage || `${EnvVars.OG_IMAGES_URL}og-image.png`;
  const canonicalUrl = canonical || siteUrl;
  return (
    <>
      <Head>
        <title>
          {title} | {siteName}
        </title>
        {description && <meta name="description" content={description} />}
        {keywords && <meta name="keywords" content={keywords} />}
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content={robots || 'index,follow'} />
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${title} | ${siteName}`} />
        {description && <meta property="og:description" content={description} />}
        <meta property="og:site_name" content={siteName} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={ogImageUrl} />
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${title} | ${siteName}`} />
        {description && <meta name="twitter:description" content={description} />}
        <meta name="twitter:image" content={ogImageUrl} />
      </Head>
      <Wrapper>
        <HeaderContainer>
          <Container>
            <Title>{title}</Title>
            {description && <Description>{description}</Description>}
          </Container>
        </HeaderContainer>
        <Container>
          <ChildrenWrapper>{children}</ChildrenWrapper>
        </Container>
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  background: rgb(var(--background));
`;

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--secondary));
  min-height: 40rem;
`;

const Title = styled(SectionTitle)`
  color: rgb(var(--textSecondary));
  margin-bottom: 2rem;
`;

const Description = styled.div`
  font-size: 1.8rem;
  color: rgba(var(--textSecondary), 0.8);
  text-align: center;
  max-width: 60%;
  margin: auto;

  ${media('<=tablet')} {
    max-width: 100%;
  }
`;

const ChildrenWrapper = styled.div`
  margin-top: 10rem;
  margin-bottom: 10rem;
`;
