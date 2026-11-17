import NextLink from 'next/link';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import Container from 'components/Container';
import { getSiteInfo, SiteInfo } from 'lib/siteClient';
import { media } from 'utils/media';
import { NAV_ITEMS } from './Navbar';

const GUIDES = [
  { title: 'Износ форсунок Common Rail', href: '/articles/injectors' },
  { title: 'Стружка в топливной системе', href: '/articles/tnvd' },
];

const LEGAL = [
  { title: 'Политика конфиденциальности', href: '/privacy-policy' },
  { title: 'Условия использования', href: '/terms-of-use' },
  { title: 'Политика cookies', href: '/cookies-policy' },
];

export default function Footer() {
  const [contacts, setContacts] = useState<SiteInfo['contacts'] | null>(null);

  useEffect(() => {
    getSiteInfo().then((d) => setContacts(d.contacts));
  }, []);

  const hasContacts = !!contacts && !!(contacts.phone || contacts.email || contacts.telegram || contacts.hours);

  return (
    <Wrapper>
      <Container>
        <Columns>
          <Column>
            <Heading>Компания</Heading>
            {NAV_ITEMS.map((i) => (
              <NextLink key={i.href} href={i.href}>
                {i.title}
              </NextLink>
            ))}
          </Column>
          <Column>
            <Heading>Полезное</Heading>
            {GUIDES.map((i) => (
              <NextLink key={i.href} href={i.href}>
                {i.title}
              </NextLink>
            ))}
          </Column>
          <Column>
            <Heading>Правовая информация</Heading>
            {LEGAL.map((i) => (
              <NextLink key={i.href} href={i.href}>
                {i.title}
              </NextLink>
            ))}
          </Column>
          {hasContacts && contacts && (
            <Column>
              <Heading>Контакты</Heading>
              {contacts.phone && <a href={`tel:${contacts.phone.replace(/[^+\d]/g, '')}`}>{contacts.phone}</a>}
              {contacts.email && <a href={`mailto:${contacts.email}`}>{contacts.email}</a>}
              {contacts.telegram && <a href={contacts.telegram}>{contacts.telegram.replace('https://t.me/', '@')}</a>}
              {contacts.hours && <span>{contacts.hours}</span>}
            </Column>
          )}
        </Columns>
        <Copyright>
          © {new Date().getFullYear()} RailGuard{contacts?.legal && ` · ${contacts.legal}`}
        </Copyright>
      </Container>
    </Wrapper>
  );
}

const Wrapper = styled.footer`
  padding: 6rem 0 3rem;
  background: rgb(var(--ink));
  color: rgb(var(--bg));
  font-size: 1.5rem;
`;

const Columns = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4rem 8rem;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  a {
    opacity: 0.7;
  }
  a:hover {
    opacity: 1;
  }

  ${media('<=phone')} {
    flex: 0 0 100%;
  }
`;

const Heading = styled.p`
  font-weight: 700;
  font-size: 1.7rem;
  margin-bottom: 0.6rem;
`;

const Copyright = styled.p`
  margin-top: 5rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(var(--bg), 0.15);
  opacity: 0.6;
`;
