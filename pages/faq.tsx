import Head from 'next/head';
import Page from 'components/Page';
import { FAQ } from 'views/PricingPage/FaqSection';
import FaqSection from 'views/PricingPage/FaqSection';

export default function FaqPage() {
  const faqPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(([question, answerText]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answerText,
      },
    })),
  };

  return (
    <Page
      title="Часто задаваемые вопросы"
      description="Ответы на популярные вопросы о фильтре высокого давления RailGuard для двигателей Common Rail"
      canonical="https://railguard.ru/faq"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema).replace(/</g, '\\u003c') }}
        />
      </Head>
      <FaqSection />
    </Page>
  );
}
