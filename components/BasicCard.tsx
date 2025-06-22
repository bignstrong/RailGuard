import React from 'react';
import styled from 'styled-components';

interface BasicCardProps {
  className?: string;
  children?: React.ReactNode;
}

export default function BasicCard({ className, children }: BasicCardProps) {
  return <Card className={className}>{children}</Card>;
}

const Card = styled.div`
  display: flex;
  padding: 2.5rem;
  background: rgb(var(--cardBackground));
  box-shadow: var(--shadow-md);
  border-radius: 0.6rem;
  color: rgb(var(--text));
  font-size: 1.6rem;

  & > *:not(:first-child) {
    margin-top: 1rem;
  }
`;
