const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
export function rouletteOutcome(number, choice, stake) {
  if (!Number.isInteger(number) || number < 0 || number > 36 || !["red", "black", "green"].includes(choice) || !Number.isSafeInteger(stake) || stake <= 0) throw new Error("Nieprawidłowy zakład ruletki.");
  const color = number === 0 ? "green" : RED.has(number) ? "red" : "black";
  const win = color === choice;
  const multiplier = choice === "green" ? 36 : 2;
  const totalReturn = win ? stake * multiplier : 0;
  return { number, color, choice, win, multiplier, stake, totalReturn, net: totalReturn - stake };
}
