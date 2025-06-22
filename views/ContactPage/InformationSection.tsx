import styled from 'styled-components';
import { media } from 'utils/media';

export default function InformationSection() {
  return (
    <Wrapper>
      <Title>Контактная информация</Title>

      <Section>
        <SectionTitle>Для заказа и консультации:</SectionTitle>
        <ContactItem>
          <Label>Телефон:</Label>
          <Value>
            <a href="tel:+79991234567">+7 (999) 123-45-67</a>
          </Value>
        </ContactItem>
        <ContactItem>
          <Label>WhatsApp:</Label>
          <Value>
            <a href="https://wa.me/79991234567">+7 (999) 123-45-67</a>
          </Value>
        </ContactItem>
        <ContactItem>
          <Label>Email:</Label>
          <Value>
            <a href="mailto:info@railguard.ru">info@railguard.ru</a>
          </Value>
        </ContactItem>
      </Section>

      <Section>
        <SectionTitle>Режим работы:</SectionTitle>
        <ContactItem>
          <Label>Пн-Пт:</Label>
          <Value>9:00 - 18:00</Value>
        </ContactItem>
        <ContactItem>
          <Label>Сб:</Label>
          <Value>10:00 - 15:00</Value>
        </ContactItem>
        <ContactItem>
          <Label>Вс:</Label>
          <Value>Выходной</Value>
        </ContactItem>
      </Section>

      <Section>
        <SectionTitle>Реквизиты:</SectionTitle>
        <ContactItem>
          <Label>ИП:</Label>
          <Value>Иванов Иван Иванович</Value>
        </ContactItem>
        <ContactItem>
          <Label>ИНН:</Label>
          <Value>123456789012</Value>
        </ContactItem>
        <ContactItem>
          <Label>ОГРНИП:</Label>
          <Value>123456789012345</Value>
        </ContactItem>
      </Section>

      <Note>* Техническая поддержка и консультации доступны в рабочее время по телефону, WhatsApp и email.</Note>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  flex: 1;
  margin-right: 3rem;
  margin-bottom: 3rem;
  padding: 2rem;
  background: rgb(var(--background));
  border-radius: 0.6rem;
  box-shadow: var(--shadow-sm);

  ${media('<=tablet')} {
    margin-right: 0;
    padding: 1.5rem;
  }
`;

const Title = styled.h2`
  font-size: 3rem;
  margin-bottom: 3rem;
  color: rgb(var(--text));

  ${media('<=tablet')} {
    font-size: 2.4rem;
    margin-bottom: 2rem;
  }
`;

const Section = styled.div`
  margin-bottom: 3rem;

  &:last-child {
    margin-bottom: 2rem;
  }
`;

const SectionTitle = styled.h3`
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: rgb(var(--text));

  ${media('<=tablet')} {
    font-size: 1.8rem;
    margin-bottom: 1rem;
  }
`;

const ContactItem = styled.div`
  display: flex;
  margin-bottom: 1rem;
  font-size: 1.6rem;

  ${media('<=tablet')} {
    font-size: 1.4rem;
  }
`;

const Label = styled.span`
  min-width: 120px;
  color: rgb(var(--text));
  font-weight: 500;
`;

const Value = styled.span`
  color: rgb(var(--text-secondary));

  a {
    color: rgb(var(--primary));
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: rgb(var(--primary), 0.8);
      text-decoration: underline;
    }
  }
`;

const Note = styled.p`
  font-size: 1.4rem;
  color: rgb(var(--text-secondary));
  font-style: italic;
  margin-top: 2rem;

  ${media('<=tablet')} {
    font-size: 1.2rem;
  }
`;
