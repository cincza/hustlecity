import React, { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View, StyleSheet } from "react-native";
import { ECONOMY_RULES } from "../../shared/economy.js";
import { getCasinoGameConfig } from "../game/selectors/authorityFeedback";

const names = { red: "Czerwone", black: "Czarne", green: "Zero" };
const symbols = { '7': '7', BAR: 'BAR', CHERRY: '🍒', LEMON: '🍋', MASK: '◆', CASH: '$', CROWN: '7', DICE: '◇', SKULL: '×' };
export function CasinoMachinePanel({ mode, state, setState, cash, onSpin, formatMoney }) {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const [, tick] = useState(0);
  useEffect(() => { const id = setInterval(() => tick(n => n + 1), 250); return () => clearInterval(id); }, []);
  const slot = mode === "slot";
  const betKey = slot ? "slotBet" : "rouletteBet";
  const bet = Number(state[betKey] || 0);
  const spinning = state.slotSpinning || state.rouletteSpinning || pending;
  const config = getCasinoGameConfig(state.backendMeta, mode, ECONOMY_RULES.casino[mode]);
  const error = !Number.isSafeInteger(bet) || bet < config.minBet ? `Minimum ${formatMoney(config.minBet)}.` : bet > config.maxBet ? `Maksimum ${formatMoney(config.maxBet)}.` : bet > cash ? "Brakuje gotówki." : state.backendMeta && bet > config.remainingDailyLoss ? "Stawka przekracza pozostały limit strat." : "";
  const result = state.serverGame?.mode === mode ? state.serverGame : null;
  const color = state.rouletteResult?.color;
  const choices = ["red", "black", "green"];
  async function spin() {
    if (lock.current || spinning || error || config.cooldownRemainingMs > 0) return;
    lock.current = true; setPending(true);
    try { await onSpin(); } finally { lock.current = false; setPending(false); }
  }
  const setBet = (value) => setState(prev => ({ ...prev, [betKey]: String(value).replace(/[^0-9]/g, "").slice(0, 9) }));
  return <View style={s.panel}>
    <Text style={s.title}>{slot ? "Automaty" : "Ruletka · jedno zero"}</Text>
    <Text style={s.meta}>Gotówka {formatMoney(cash)} · stawki {formatMoney(config.minBet)}–{formatMoney(config.maxBet)}</Text>
    {slot ? <View style={s.row}>{(state.slotDisplay || ['7', 'BAR', 'CHERRY']).map((symbol, i) => <View key={i} style={s.reel}><Text style={s.symbol}>{symbols[symbol] || symbol}</Text></View>)}</View> : <>
      <View style={[s.ball, { borderColor: color === "red" ? "#b74c4c" : color === "green" ? "#498664" : "#ad8a4d" }]}><Text style={s.number}>{state.rouletteResult || state.rouletteSpinning ? state.rouletteDisplay : "—"}</Text><Text style={s.meta}>{state.rouletteSpinning ? "Losowanie…" : names[color] || "Wybierz kolor"}</Text></View>
      <View style={s.row}>{choices.map(choice => <Pressable key={choice} accessibilityRole="radio" accessibilityState={{ checked: state.rouletteChoice === choice, disabled: spinning }} disabled={spinning} onPress={() => setState(prev => ({ ...prev, rouletteChoice: choice }))} style={[s.choice, state.rouletteChoice === choice && s.active]}><Text style={s.text}>{names[choice]}</Text><Text style={s.meta}>{choice === 'green' ? '×36' : '×2'}</Text></Pressable>)}</View>
    </>}
    <Text style={s.meta}>Stawka za jedno losowanie</Text>
    <TextInput accessibilityLabel="Stawka" keyboardType="number-pad" value={String(state[betKey] || '')} editable={!spinning} onChangeText={setBet} style={s.input} />
    <View style={s.row}>{[config.minBet, 500, 1000].filter((v,i,a) => a.indexOf(v) === i).map(value => <Pressable key={value} accessibilityRole="button" disabled={spinning || value > cash || value > config.maxBet} onPress={() => setBet(value)} style={s.choice}><Text style={s.text}>{formatMoney(value)}</Text></Pressable>)}</View>
    {error ? <Text style={s.warning}>{error}</Text> : null}
    <Pressable accessibilityRole="button" disabled={spinning || Boolean(error) || config.cooldownRemainingMs > 0} onPress={spin} style={[s.spin, (spinning || error || config.cooldownRemainingMs > 0) && { opacity: 0.45 }]}><Text style={s.spinText}>{spinning ? "Losowanie…" : config.cooldownRemainingMs > 0 ? `Kolejne za ${Math.ceil(config.cooldownRemainingMs / 1000)} s` : `Zagraj za ${formatMoney(bet)}`}</Text></Pressable>
    {result && !spinning ? <View accessibilityLiveRegion="polite" style={s.result}><Text style={s.text}>{result.net > 0 ? "Wygrana" : result.net === 0 ? "Zwrot stawki" : "Przegrana"} · bilans {result.net > 0 ? '+' : ''}{formatMoney(result.net)}</Text><Text style={s.meta}>Stawka {formatMoney(result.stake)} · wypłata {formatMoney(result.totalReturn)}</Text></View> : null}
    {!slot && state.rouletteHistory?.length ? <Text style={s.meta}>Ostatnie numery: {state.rouletteHistory.slice(0, 8).map(e => e.number).join(' · ')}</Text> : null}
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: rulesOpen }} onPress={() => setRulesOpen(!rulesOpen)} style={s.rules}><Text style={s.text}>{rulesOpen ? 'Zwiń zasady ▴' : 'Szanse i wypłaty ▾'}</Text></Pressable>
    {rulesOpen ? <View style={{ gap: 6 }}>
      <Text style={s.meta}>Mnożniki oznaczają całą wypłatę, razem ze stawką. Każdy wynik jest niezależny.</Text>
      {slot ? ECONOMY_RULES.casino.slot.outcomes.map(o => <Text key={o.id} style={s.meta}>{o.symbols.join(' / ')} · ×{o.multiplier} · {o.weight / 10}%</Text>) : <Text style={s.meta}>Czerwone: 18/37 · czarne: 18/37 · zero: 1/37. Wypłaty ×2 / ×2 / ×36. Średni zwrot teoretyczny: 97,30%.</Text>}
      {slot ? <Text style={s.meta}>Średni zwrot teoretyczny: 88,8%. Nie gwarantuje zwrotu w pojedynczej sesji.</Text> : null}
    </View> : null}
  </View>;
}
const s = StyleSheet.create({ panel: { padding: 14, gap: 10, borderRadius: 18, borderColor: '#5e4928', borderWidth: 1, backgroundColor: '#14110d' }, title: { color: '#f2d7a0', fontSize: 20, fontWeight: '800' }, meta: { color: '#b9ae9d', fontSize: 12, lineHeight: 18 }, text: { color: '#f3dfbc', fontSize: 13, fontWeight: '700' }, row: { flexDirection: 'row', gap: 6 }, choice: { flex: 1, minHeight: 44, padding: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#55442e', borderRadius: 10 }, active: { backgroundColor: '#3a2d18', borderColor: '#e0b866' }, reel: { flex: 1, minWidth: 0, height: 86, alignItems: 'center', justifyContent: 'center', backgroundColor: '#080808', borderRadius: 12, borderColor: '#715933', borderWidth: 1 }, symbol: { fontSize: 28, color: '#ecca83', fontWeight: '900' }, ball: { alignSelf: 'center', width: 128, height: 128, borderRadius: 64, borderWidth: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: '#090909' }, number: { fontSize: 42, fontWeight: '900', color: '#f1d597' }, input: { minHeight: 48, padding: 12, color: '#ffe6b8', borderColor: '#78603b', borderWidth: 1, borderRadius: 10, fontSize: 19 }, spin: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#debc7e' }, spinText: { color: '#231909', fontWeight: '800', fontSize: 15 }, result: { padding: 12, backgroundColor: '#222018', borderRadius: 10, gap: 5 }, warning: { color: '#e8a39b', fontSize: 12 }, rules: { minHeight: 44, justifyContent: 'center' } });
