export interface SqlQuery {
  text: string;
  values: unknown[];
}

export function sql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): SqlQuery {
  const text = strings.reduce((acc, str, i) => {
    return acc + str + (i < values.length ? `$${i + 1}` : '');
  }, '');
  return { text, values };
}
