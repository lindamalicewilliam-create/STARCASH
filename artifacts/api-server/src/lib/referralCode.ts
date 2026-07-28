export function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "STAR";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function generateCouponCode(): string {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "@#$!*";
  const all = lower + digits + special;

  // Guarantee at least one digit and one special char, rest are mixed
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)];
  const parts = [
    pick(digits),
    pick(special),
    ...Array.from({ length: 8 }, () => pick(all)),
  ];
  // Shuffle so the guaranteed chars aren't always at the start
  for (let i = parts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [parts[i], parts[j]] = [parts[j], parts[i]];
  }
  return parts.join("");
}
