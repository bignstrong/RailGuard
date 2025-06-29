import NextLink from 'next/link';
import { PropsWithChildren } from 'react';
import styled from 'styled-components';

export interface LinkProps {
  href: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

const StyledLink = styled(NextLink)`
  display: inline;
  width: fit-content;
  text-decoration: none;

  background: linear-gradient(rgb(var(--primary)), rgb(var(--primary)));
  background-position: 0% 100%;
  background-repeat: no-repeat;
  background-size: 100% 0px;
  transition: 100ms;
  transition-property: background-size, text-decoration, color;
  color: rgb(var(--primary));

  &:hover {
    background-size: 100% 100%;
    text-decoration: none;
    color: rgb(var(--background));
  }

  &:active {
    color: rgb(var(--background));
    background-size: 100% 100%;
  }
`;

export default function Link({ href, onClick, children }: PropsWithChildren<LinkProps>) {
  return (
    <StyledLink href={href} onClick={onClick}>
      {children}
    </StyledLink>
  );
}
