export const PREMIUM_PACKS = [
  { id: "pocket", tokens: 10, amount: 990, currency: "pln", label: "10 żetonów · 9,90 zł" },
  { id: "signature", tokens: 30, amount: 2490, currency: "pln", label: "30 żetonów · 24,90 zł" },
];
export const GANG_IDENTITIES = [
  { id: "street", name: "Uliczny znak", mark: "◆", color: "#b7becb", cost: 0 },
  { id: "noir", name: "Czarny syndykat", mark: "♠", color: "#c4b5fd", cost: 4 },
  { id: "crown", name: "Złota korona", mark: "♛", color: "#f4c96a", cost: 6 },
];
export function recordPremiumChange(player, delta, reason, now = Date.now()) {
  if (!Number.isSafeInteger(delta)) throw new Error("Invalid premium delta");
  player.contacts ||= {};
  player.contacts.walletHistory = [{ delta, reason, at: now, balance: Number(player.profile.premiumTokens || 0) }, ...(player.contacts.walletHistory || [])].slice(0, 40);
}
export function spendPremium(player, amount, reason, now = Date.now()) {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error("Invalid premium price");
  const balance = Number(player.profile.premiumTokens || 0);
  if (balance < amount) throw Object.assign(new Error(`Potrzebujesz ${amount} żetonów.`), { statusCode: 400 });
  player.profile.premiumTokens = balance - amount;
  if (amount) recordPremiumChange(player, -amount, reason, now);
}
