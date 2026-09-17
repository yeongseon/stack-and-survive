const amountFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

/** Presentation only: one simulation credit represents $1K of simulated business value. */
export function formatMoney(credits: number): string {
  if (!Number.isFinite(credits)) return '—';
  const value = Math.abs(credits);
  const amount = amountFormat.format(value >= 1 ? value : value * 1000);
  return `${credits < 0 && amount !== '0' ? '-' : ''}$${amount}${value >= 1 ? 'K' : ''}`;
}

export function formatMoneyRate(credits: number, period: 's' | 'min' = 's'): string {
  if (!Number.isFinite(credits)) return '—';
  if (period === 'min') return `${formatMoney(credits)}/min`;
  const amount = amountFormat.format(Math.abs(credits) * 1000);
  return `${credits < 0 && amount !== '0' ? '-' : ''}$${amount}/s`;
}

export function formatMoneyDelta(credits: number): string {
  const money = formatMoney(credits);
  return credits > 0 && money !== '$0' && money !== '—' ? `+${money}` : money;
}

export function formatMoneyReason(reason: string | null): string | null {
  return reason?.replace(/(\d+(?:\.\d+)?) remaining credits\b/g, (_, amount: string) => `${formatMoney(Number(amount))} remaining`) ?? null;
}

export const simulatedMoneyNote = 'Dollar amounts are simulated business values, not actual Azure prices. One internal credit is displayed as $1K.';
