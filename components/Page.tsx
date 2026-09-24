import Head from 'next/head';
import { PropsWithChildren } from 'react';
import styled from 'styled-components';
import { EnvVars } from 'env';
import Container from './Container';
import SectionTitle from './SectionTitle';

export interface PageProps {
  title: string;
  description?: string;
  canonical?: string;
  // Хлебные крошки между главной и текущей страницей (для товара — «Каталог»). Только разметка, для сниппета.
  crumbs?: { name: string; url: string }[];
}

export default function Page({ title, description, canonical, crumbs = [], children }: PropsWithChildren<PageProps>) {
  const fullTitle = `${title} | ${EnvVars.SITE_NAME}`;
  const ogImage = `${EnvVars.URL}og-image.png`;
  const url = canonical || EnvVars.URL;
  // BreadcrumbList по правилам Яндекса (JSON-LD, name/url/position, до 3 элементов) и Google (item).
  const chain = [{ name: 'Главная', url: EnvVars.URL }, ...crumbs, { name: title, url }];
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: chain.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url, url: c.url })),
  };
  return (
    <>
      <Head>
        <title>{fullTitle}</title>
        {description && <meta name="description" content={description} />}
        <link rel="canonical" href={url} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={fullTitle} />
        {description && <meta property="og:description" content={description} />}
        <meta property="og:site_name" content={EnvVars.SITE_NAME} />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="ru_RU" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={fullTitle} />
        {description && <meta name="twitter:description" content={description} />}
        <meta name="twitter:image" content={ogImage} />
        {canonical && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replace(/</g, '\\u003c') }} />}
      </Head>
      <Header>
        <Container>
          <Title as="h1">{title}</Title>
          {description && <Description>{description}</Description>}
        </Container>
      </Header>
      <Container>
        <Body>{children}</Body>
      </Container>
    </>
  );
}

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--ink));
  color: rgb(var(--bg));
  min-height: 32rem;
  padding: 6rem 0;
`;

const Title = styled(SectionTitle)`
  margin-bottom: 2rem;
`;

const Description = styled.p`
  font-size: 1.8rem;
  opacity: 0.8;
  text-align: center;
  max-width: 60rem;
  margin: 0 auto;
`;

const Body = styled.div`
  margin: 8rem 0;
`;
