import styled from 'styled-components';
import { media } from 'utils/media';

export default function ContactPageStub() {
  return <div style={{ padding: '5rem', textAlign: 'center', fontSize: '2rem' }}>Страница в разработке</div>;
}

const ContactContainer = styled.div`
  display: flex;

  ${media('<=tablet')} {
    flex-direction: column;
  }
`;
