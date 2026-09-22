import { createGlobalStyle } from 'styled-components';

// Три цвета на весь сайт: белый фон, тёмно-синий текст/блоки, оранжевый акцент. Всё остальное — их прозрачность.
export const GlobalStyle = createGlobalStyle`
  @font-face {
    font-family: 'Poppins';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url('/fonts/poppins-400.woff2') format('woff2');
  }
  @font-face {
    font-family: 'Poppins';
    font-style: normal;
    font-weight: 700;
    font-display: swap;
    src: url('/fonts/poppins-700.woff2') format('woff2');
  }

  :root {
    --bg: 255,255,255;
    --ink: 10,18,30;
    --accent: 255,107,0;
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
    font-size: 62.5%;
    scroll-behavior: smooth;

    @media (max-width: 56.25em) { font-size: 60%; }
    @media (max-width: 48.0625em) { font-size: 55%; }
    @media (max-width: 37.5em) { font-size: 50%; }
  }

  body {
    min-height: 100vh;
    line-height: 1.5;
    font-family: var(--font);
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

  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
`;
