export const parseValueUnit = (value: string) => {
  const reg = /^([\d.]+)(\w+)$/;
  const valarr = reg.exec(value ?? '');
  if (!valarr) return { number: 0, unit: '' };
  const [, number, unit = ''] = valarr;
  console.log(valarr, value);
  return { number: parseFloat(number ?? ''), unit };
};
export const formatMoney = (value: number) => value / 1_000_000;
