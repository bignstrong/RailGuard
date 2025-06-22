import Button from 'components/Button';
import Input from 'components/Input';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { media } from 'utils/media';
import MailSentState from '../../components/MailSentState';

interface EmailPayload {
  name: string;
  email: string;
  phone: string;
  description: string;
}

export default function FormSection() {
  const [hasSuccessfullySentMail, setHasSuccessfullySentMail] = useState(false);
  const [hasErrored, setHasErrored] = useState(false);
  const { register, handleSubmit, formState } = useForm();
  const { isSubmitSuccessful, isSubmitting, isSubmitted, errors } = formState;

  async function onSubmit(payload: EmailPayload) {
    try {
      const res = await fetch('/api/sendEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject: 'Сообщение с формы контактов', ...payload }),
      });

      if (res.status !== 204) {
        setHasErrored(true);
      }
    } catch {
      setHasErrored(true);
      return;
    }

    setHasSuccessfullySentMail(true);
  }

  const isSent = isSubmitSuccessful && isSubmitted;
  const isDisabled = isSubmitting || isSent;
  const isSubmitDisabled = Object.keys(errors).length > 0 || isDisabled;

  if (hasSuccessfullySentMail) {
    return <MailSentState />;
  }

  return (
    <Wrapper>
      <Title>Напишите нам</Title>
      <Description>
        Заполните форму, и мы свяжемся с вами в ближайшее время. Также вы можете связаться с нами напрямую по контактам слева.
      </Description>
      <Form onSubmit={handleSubmit(onSubmit)}>
        {hasErrored && <ErrorMessage>Не удалось отправить сообщение. Пожалуйста, попробуйте еще раз.</ErrorMessage>}
        <InputGroup>
          <InputStack>
            {errors.name && <ErrorMessage>Укажите ваше имя</ErrorMessage>}
            <Input placeholder="Ваше имя" id="name" disabled={isDisabled} {...register('name', { required: true })} />
          </InputStack>
          <InputStack>
            {errors.email && <ErrorMessage>Укажите email</ErrorMessage>}
            <Input placeholder="Ваш email" id="email" disabled={isDisabled} {...register('email', { required: true })} />
          </InputStack>
        </InputGroup>
        <InputStack>
          {errors.phone && <ErrorMessage>Укажите телефон</ErrorMessage>}
          <Input placeholder="+7 (___) ___-__-__" id="phone" disabled={isDisabled} {...register('phone', { required: true })} />
        </InputStack>
        <InputStack>
          {errors.description && <ErrorMessage>Введите сообщение</ErrorMessage>}
          <Textarea
            as="textarea"
            placeholder="Ваше сообщение..."
            id="description"
            disabled={isDisabled}
            {...register('description', { required: true })}
          />
        </InputStack>
        <Button as="button" type="submit" disabled={isSubmitDisabled}>
          Отправить сообщение
        </Button>
      </Form>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  flex: 2;
  padding: 2rem;
  background: rgb(var(--background));
  border-radius: 0.6rem;
  box-shadow: var(--shadow-sm);

  ${media('<=tablet')} {
    padding: 1.5rem;
  }
`;

const Title = styled.h2`
  font-size: 3rem;
  margin-bottom: 1.5rem;
  color: rgb(var(--text));

  ${media('<=tablet')} {
    font-size: 2.4rem;
    margin-bottom: 1rem;
  }
`;

const Description = styled.p`
  font-size: 1.6rem;
  color: rgb(var(--text-secondary));
  margin-bottom: 3rem;

  ${media('<=tablet')} {
    font-size: 1.4rem;
    margin-bottom: 2rem;
  }
`;

const Form = styled.form`
  & > * {
    margin-bottom: 2rem;
  }
`;

const InputGroup = styled.div`
  display: flex;
  align-items: center;

  & > *:first-child {
    margin-right: 2rem;
  }

  & > * {
    flex: 1;
  }

  ${media('<=tablet')} {
    flex-direction: column;
    & > *:first-child {
      margin-right: 0rem;
      margin-bottom: 2rem;
    }
  }
`;

const InputStack = styled.div`
  display: flex;
  flex-direction: column;

  & > *:not(:first-child) {
    margin-top: 0.5rem;
  }
`;

const ErrorMessage = styled.p`
  color: rgb(var(--errorColor));
  font-size: 1.5rem;
`;

const Textarea = styled(Input)`
  width: 100%;
  min-height: 20rem;
`;
