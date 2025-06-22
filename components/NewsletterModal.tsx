import { EnvVars } from 'env';
import useEscClose from 'hooks/useEscKey';
import React, { useState } from 'react';
import MailchimpSubscribe, { DefaultFormFields } from 'react-mailchimp-subscribe';
import styled from 'styled-components';
import { media } from 'utils/media';
import Button from './Button';
import CloseIcon from './CloseIcon';
import Container from './Container';
import Input from './Input';
import MailSentState from './MailSentState';
import Overlay from './Overlay';

export interface NewsletterModalProps {
  onClose: () => void;
}

export default function NewsletterModal({ onClose }: NewsletterModalProps) {
  const [email, setEmail] = useState('');

  useEscClose({ onClose });

  function onSubmit(event: React.FormEvent<HTMLFormElement>, enrollNewsletter: (props: DefaultFormFields) => void) {
    event.preventDefault();
    console.log({ email });
    if (email) {
      enrollNewsletter({ EMAIL: email });
    }
  }

  return (
    <MailchimpSubscribe
      url={EnvVars.MAILCHIMP_SUBSCRIBE_URL}
      render={({ subscribe, status, message }) => {
        const hasSignedUp = status === 'success';
        return (
          <Overlay>
            <Container>
              <Card onSubmit={(event: React.FormEvent<HTMLFormElement>) => onSubmit(event, subscribe)}>
                <CloseIconContainer>
                  <CloseIcon onClick={onClose} />
                </CloseIconContainer>
                {hasSignedUp && <MailSentState />}
                {!hasSignedUp && (
                  <>
                    <Title>Получайте первыми новости о скидках и специальных предложениях!</Title>
                    <Description>
                      Подпишитесь на нашу рассылку и получите:
                      <ul>
                        <li>Скидку 5% на первый заказ</li>
                        <li>Эксклюзивные технические обзоры</li>
                        <li>Советы по обслуживанию топливной системы</li>
                        <li>Приоритетный доступ к новым продуктам</li>
                      </ul>
                    </Description>
                    <Row>
                      <CustomInput
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        placeholder="Введите ваш email..."
                        required
                      />
                      <CustomButton as="button" type="submit" disabled={hasSignedUp}>
                        Подписаться
                      </CustomButton>
                    </Row>
                    {message && <ErrorMessage dangerouslySetInnerHTML={{ __html: message as string }} />}
                  </>
                )}
              </Card>
            </Container>
          </Overlay>
        );
      }}
    />
  );
}

const Card = styled.form`
  display: flex;
  position: relative;
  flex-direction: column;
  margin: auto;
  padding: 10rem 5rem;
  background: rgb(var(--modalBackground));
  border-radius: 0.6rem;
  max-width: 70rem;
  overflow: hidden;
  color: rgb(var(--text));

  ${media('<=tablet')} {
    padding: 7.5rem 2.5rem;
  }
`;

const CloseIconContainer = styled.div`
  position: absolute;
  right: 2rem;
  top: 2rem;

  svg {
    cursor: pointer;
    width: 2rem;
  }
`;

const Title = styled.div`
  font-size: 3.2rem;
  font-weight: bold;
  line-height: 1.1;
  letter-spacing: -0.03em;
  text-align: center;
  color: rgb(var(--text));

  ${media('<=tablet')} {
    font-size: 2.6rem;
  }
`;

const ErrorMessage = styled.p`
  color: rgb(var(--errorColor));
  font-size: 1.5rem;
  margin: 1rem 0;
  text-align: center;
`;

const Row = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  margin-top: 3rem;

  ${media('<=tablet')} {
    flex-direction: column;
  }
`;

const CustomButton = styled(Button)`
  height: 100%;
  padding: 1.8rem;
  margin-left: 1.5rem;
  box-shadow: var(--shadow-lg);

  ${media('<=tablet')} {
    width: 100%;
    margin-left: 0;
    margin-top: 1rem;
  }
`;

const CustomInput = styled(Input)`
  width: 60%;
  color: rgb(var(--text));

  &::placeholder {
    color: rgb(var(--text-secondary));
    opacity: 0.8;
  }

  ${media('<=tablet')} {
    width: 100%;
  }
`;

const Description = styled.div`
  font-size: 1.7rem;
  margin: 2.5rem 0 1.5rem 0;
  text-align: center;
  color: rgb(var(--text));
  ul {
    margin: 1.2rem 0 0 0;
    padding: 0;
    list-style: none;
    text-align: left;
    display: inline-block;
  }
  li {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
    position: relative;
    padding-left: 1.5em;
  }
  li:before {
    content: '•';
    color: rgb(255, 107, 0);
    position: absolute;
    left: 0;
    font-size: 1.5em;
    line-height: 1;
  }
`;
