import NextLink from 'next/link';
import styled from 'styled-components';

const Link = styled(NextLink)`
  color: rgb(var(--accent));
  border-bottom: 1px solid currentColor;

  &:hover {
    opacity: 0.8;
  }
`;

export default Link;
