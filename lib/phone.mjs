// Телефон храним как 10 цифр без +7; маска только для отображения. Чистый JS, чтобы тест шёл голым node.
/** @param {string} s */
export const phoneDigits = (s) => s.replace(/\D/g, '').replace(/^[78]/, '').slice(0, 10);

/** @param {string} d */
export const formatPhone = (d) =>
  d && `+7 (${d.slice(0, 3)}${d.length > 3 ? `) ${d.slice(3, 6)}` : ''}${d.length > 6 ? `-${d.slice(6, 8)}` : ''}${d.length > 8 ? `-${d.slice(8)}` : ''}`;
