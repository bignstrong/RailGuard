import styled from 'styled-components';
import { media } from 'utils/media';

const SectionTitle = styled.h2`
  font-size: 4.4rem;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  text-align: center;

  ${media('<=tablet')} {
    font-size: 3.4rem;
  }
`;

export default SectionTitle;
