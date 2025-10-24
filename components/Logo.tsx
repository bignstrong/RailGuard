// components/Logo.tsx

import Image from 'next/image';
import styled from 'styled-components';

export default function Logo() {
  return (
    <LogoWrapper>
      <Image src="/webp/Logo.webp" alt="Логотип" width={64} height={64} />
      <BrandName>RailGuard</BrandName>
    </LogoWrapper>
  );
}

const LogoWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  text-decoration: none;
`;

const BrandName = styled.span`
  font-size: 2.2rem;
  font-weight: bold;
  letter-spacing: 0.05em;
  color: var(--logoColor, #222);
  transition: color 0.2s;
  text-decoration: none;

  html[data-theme='dark'] & {
    color: #fff;
  }
`;
