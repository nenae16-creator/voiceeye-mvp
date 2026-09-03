export function pct(n: number | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

export function gate(actual: number, limit: number) {
  return actual <= limit ? "pass" : "fail";
}
