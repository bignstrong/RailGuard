import styled from 'styled-components';
import { media } from 'utils/media';

const RichText = styled.div`
  font-size: 1.8rem;
  line-height: 1.6;
  color: rgba(var(--ink), 0.8);

  p + p, ul + p, p + ul {
    margin-top: 1.6rem;
  }

  strong, b {
    color: rgb(var(--ink));
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      position: relative;
      padding-left: 2rem;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 1em;
        width: 0.8rem;
        height: 2px;
        background: rgb(var(--accent));
      }
    }
  }

  ${media('<=desktop')} {
    font-size: 1.6rem;
  }
`;

export default RichText;
