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
    color: rgba(var(--ink), 0.4);
  }

  &:focus {
    outline: none;
    border-color: rgb(var(--accent));
  }
`;

export default Input;
