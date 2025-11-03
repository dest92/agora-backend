export function sql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): { text: string; values: unknown[] } {
  const text = strings.reduce((acc, str, i) => {
    return acc + str + (i < values.length ? `$${i + 1}` : '');
  }, '');
  return { text, values };
}
