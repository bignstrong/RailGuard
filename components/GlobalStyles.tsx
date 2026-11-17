import { createGlobalStyle } from 'styled-components';

// Три цвета на весь сайт: белый фон, тёмно-синий текст/блоки, оранжевый акцент. Всё остальное — их прозрачность.
export const GlobalStyle = createGlobalStyle`
  @font-face {
    font-family: 'Poppins';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url('/fonts/poppins-400.woff2?v=20261117') format('woff2');
  }
  @font-face {
    font-family: 'Poppins';
    font-style: normal;
    font-weight: 700;
    font-display: swap;
    src: url('/fonts/poppins-700.woff2?v=20261117') format('woff2');
  }

  :root {
    --bg: 255,255,255;
    --ink: 10,18,30;
    --accent: 255,107,0;
    /* Текстный оранжевый: #FF6B00 на белом даёт 2,86:1, этот — 6,0:1. Заливки остаются на --accent. */
    --accent-text: 178,58,0;
    --font: 'Poppins', sans-serif;
    --line: 1px solid rgba(var(--ink), 0.12);
    --z-sticky: 7777;
    --z-navbar: 8888;
    --z-modal: 9999;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  body, h1, h2, h3, h4, p, figure, blockquote, dl, dd {
    margin: 0;
  }

  html {
    -webkit-font-smoothing: antialiased;
    text-size-adjust: 100%;
    /* 10 px основа. Не сжимать на телефоне: от этого зависят размеры полей и тап-целей. */
    font-size: 62.5%;
    scroll-behavior: smooth;
  }

  body {
    min-height: 100vh;
    line-height: 1.5;
    font-family: var(--font);
    font-size: 1.6rem;
    color: rgb(var(--ink));
    background: rgb(var(--bg));
  }

  img, picture {
    max-width: 100%;
    display: block;
  }

  input, button, textarea, select {
    font: inherit;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  :focus-visible {
    outline: 2px solid rgb(var(--ink));
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
`;
