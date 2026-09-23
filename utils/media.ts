// Замена css-in-js-media: те же брейкпоинты и синтаксис media('<=tablet').
const BREAKPOINTS = { smallPhone: 320, phone: 375, tablet: 768, desktop: 1024, largeDesktop: 1440 };
type Breakpoint = keyof typeof BREAKPOINTS;
type Query = `${'<' | '<=' | '>' | '>='}${Breakpoint}`;

export function media(...queries: Query[]): string {
  return `@media ${queries
    .map((q) => {
      const [, op, name] = q.match(/^([<>]=?)(\w+)$/)!;
      const px = BREAKPOINTS[name as Breakpoint] + (op === '<' ? -1 : op === '>' ? 1 : 0);
      return `(${op[0] === '>' ? 'min' : 'max'}-width: ${px}px)`;
    })
    .join(' and ')}`;
}
