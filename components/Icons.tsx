import styled from 'styled-components';

// Линейные иконки Lucide: один стиль, цвет от родителя, без эмодзи в кнопках.
const Svg = styled.svg`
  width: 2rem;
  height: 2rem;
  display: block;
  flex-shrink: 0;
`;

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export const CloseIcon = () => (
  <Svg {...base}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Svg>
);

export const MenuIcon = () => (
  <Svg {...base}>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </Svg>
);

export const MinusIcon = () => (
  <Svg {...base}>
    <path d="M5 12h14" />
  </Svg>
);

export const PlusIcon = () => (
  <Svg {...base}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </Svg>
);

export const ChevronLeftIcon = () => (
  <Svg {...base}>
    <path d="m15 18-6-6 6-6" />
  </Svg>
);

export const ChevronRightIcon = () => (
  <Svg {...base}>
    <path d="m9 18 6-6-6-6" />
  </Svg>
);

export const CheckIcon = () => (
  <Svg {...base}>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
);
