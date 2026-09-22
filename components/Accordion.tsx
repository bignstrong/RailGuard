import { PropsWithChildren } from 'react';
import styled from 'styled-components';
import RichText from './RichText';

// Нативный <details>: без JS и анимационных библиотек.
export default function Accordion({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <Details>
      <summary>{title}</summary>
      <RichText>{children}</RichText>
    </Details>
  );
}

const Details = styled.details`
  border: var(--line);
  border-radius: 0.4rem;
  padding: 0 2rem;

  summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 2rem;
    padding: 2rem 0;
    font-size: 1.9rem;
    font-weight: 700;
    cursor: pointer;
    list-style: none;

    &::-webkit-details-marker {
      display: none;
    }
    &::after {
      content: '+';
      flex-shrink: 0;
      color: rgb(var(--accent));
      font-size: 2.4rem;
      line-height: 1;
    }
  }

  &[open] summary::after {
    content: '−';
  }

  ${RichText} {
    padding-bottom: 2rem;
    font-size: 1.6rem;
  }
`;
