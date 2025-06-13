import Container from 'components/Container'
import MDXRichText from 'components/MDXRichText'
import { GetStaticPropsContext } from 'next'
import Head from 'next/head'
import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { formatDate } from 'utils/formatDate'
import { media } from 'utils/media'
import { getReadTime } from 'utils/readTime'
import Header from 'views/SingleArticlePage/Header'
import MetadataHead from 'views/SingleArticlePage/MetadataHead'
import OpenGraphHead from 'views/SingleArticlePage/OpenGraphHead'
import ShareWidget from 'views/SingleArticlePage/ShareWidget'
import StructuredDataHead from 'views/SingleArticlePage/StructuredDataHead'

export default function SingleArticlePage(props: { slug: string; data: any }) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [readTime, setReadTime] = useState('');

  useEffect(() => {
    calculateReadTime();
    lazyLoadPrismTheme();

    function calculateReadTime() {
      const currentContent = contentRef.current;
      if (currentContent) {
        setReadTime(getReadTime(currentContent.textContent || ''));
      }
    }

    function lazyLoadPrismTheme() {
      const prismThemeLinkEl = document.querySelector('link[data-id="prism-theme"]');

      if (!prismThemeLinkEl) {
        const headEl = document.querySelector('head');
        if (headEl) {
          const newEl = document.createElement('link');
          newEl.setAttribute('data-id', 'prism-theme');
          newEl.setAttribute('rel', 'stylesheet');
          newEl.setAttribute('href', '/prism-theme.css');
          newEl.setAttribute('media', 'print');
          newEl.setAttribute('onload', "this.media='all'; this.onload=null;");
          headEl.appendChild(newEl);
        }
      }
    }
  }, []);

  const { slug, data } = props;
  const content = data?.body || '';
  const title = data?.title || 'Заголовок статьи';
  const description = data?.description || 'Описание статьи';
  const date = data?.date || new Date().toISOString();
  const tags = data?.tags || '';
  const imageUrl = data?.imageUrl || '';
  const meta = { title, description, date, tags, imageUrl, author: '' };
  const formattedDate = formatDate(new Date(date));
  const absoluteImageUrl = imageUrl.replace(/\/\//, '/');

  return (
    <>
      <Head>
        <noscript>
          <link rel="stylesheet" href="/prism-theme.css" />
        </noscript>
      </Head>
      <OpenGraphHead slug={slug} {...meta} />
      <StructuredDataHead slug={slug} {...meta} />
      <MetadataHead {...meta} />
      <CustomContainer id="content" ref={contentRef}>
        <ShareWidget title={title} slug={slug} />
        <Header title={title} formattedDate={formattedDate} imageUrl={absoluteImageUrl} readTime={readTime} />
        <MDXRichText content={content} />
      </CustomContainer>
    </>
  );
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: false,
  };
}

export async function getStaticProps({ params }: GetStaticPropsContext<{ slug: string }>) {
  return {
    props: {
      slug: params?.slug || '',
      data: {},
    },
  };
}

const CustomContainer = styled(Container)`
  position: relative;
  max-width: 90rem;
  margin: 10rem auto;

  ${media('<=tablet')} {
    margin: 5rem auto;
  }
`;
