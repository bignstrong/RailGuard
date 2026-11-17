import styled from 'styled-components';

const Input = styled.input`
  width: 100%;
  padding: 1.4rem 1.6rem;
  border: var(--line);
  border-radius: 0.4rem;
  background: rgb(var(--bg));
  color: rgb(var(--ink));
  font-size: 1.6rem;

  &::placeholder {
    color: rgba(var(--ink), 0.6);
  }

  &:focus {
    outline: 2px solid rgb(var(--accent-text));
    outline-offset: 1px;
    border-color: rgb(var(--accent-text));
  }
`;

export default Input;
