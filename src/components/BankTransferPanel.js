import React, { useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Text, TextInput } from "../i18n";
export function BankTransferPanel({ cash, bank, amountDraft, setAmountDraft, onDeposit, onWithdraw, formatMoney, recentTransfers = [], feedback }) {
  const [direction, setDirection] = useState("deposit");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const lock = useRef(false);
  const withdraw = direction === "withdraw";
  const available = Math.max(0, Math.floor(Number(withdraw ? bank : cash) || 0));
  const draft = String(amountDraft || "").replace(/[^\d]/g, "");
  const amount = Number(draft);
  const valid = Number.isSafeInteger(amount) && amount > 0 && amount <= available;
  const verb = withdraw ? "Wypłać" : "Wpłać";
  async function transfer() {
    if (!valid || lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try { await (withdraw ? onWithdraw : onDeposit)?.(); }
    catch (err) { setError(err?.message || "Nie udało się wykonać przelewu."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <View style={s.wrap}>
    <View style={s.balances}>
      <View style={s.balance}><Text style={s.muted}>Przy sobie</Text><Text style={s.value}>{formatMoney(cash)}</Text></View>
      <View style={s.balance}><Text style={s.muted}>W banku</Text><Text style={s.value}>{formatMoney(bank)}</Text></View>
    </View>
    <View accessibilityRole="tablist" style={s.row}>
      {[['deposit', 'Wpłata'], ['withdraw', 'Wypłata']].map(([id, label]) => <Pressable key={id} accessibilityRole="tab" accessibilityState={{ selected: direction === id, disabled: busy }} disabled={busy} onPress={() => { setDirection(id); setError(""); }} style={[s.tab, direction === id && s.selected]}><Text style={s.text}>{label}</Text></Pressable>)}
    </View>
    <Text style={s.route}>{withdraw ? "Bank → Gotówka przy sobie" : "Gotówka przy sobie → Bank"}</Text>
    <Text style={s.muted}>Kwota · dostępne {formatMoney(available)}</Text>
    <TextInput accessibilityLabel="Kwota przelewu" value={draft} editable={!busy} onChangeText={(text) => setAmountDraft(text.replace(/[^\d]/g, ""))} keyboardType="number-pad" maxLength={15} placeholder="Wpisz kwotę" placeholderTextColor="#8f8474" style={s.input} />
    <View style={s.row}>
      {[1000, 5000, 10000, available].map((value, index) => <Pressable key={index} accessibilityRole="button" disabled={busy || value <= 0 || value > available} onPress={() => setAmountDraft(String(value))} style={[s.preset, (busy || value <= 0 || value > available) && s.disabled]}><Text style={s.text}>{index === 3 ? "MAX" : `${value / 1000} tys.`}</Text></Pressable>)}
    </View>
    <Text style={s.muted}>{amount > available ? "Kwota przekracza dostępne środki." : available === 0 ? (withdraw ? "Nie masz środków w banku." : "Nie masz gotówki do wpłaty.") : "Wybór kwoty nie wysyła pieniędzy. Potwierdź poniżej."}</Text>
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !valid || busy, busy }} disabled={!valid || busy} onPress={transfer} style={[s.confirm, (!valid || busy) && s.disabled]}><Text style={s.confirmText}>{busy ? "Przetwarzanie…" : `${verb}${valid ? ` ${formatMoney(amount)}` : ""}`}</Text></Pressable>
    {error ? <Text accessibilityLiveRegion="polite" style={s.error}>{error}</Text> : null}
    {feedback?.amount > 0 ? <Text accessibilityLiveRegion="polite" style={s.success}>{feedback.type === "withdraw" ? "Wypłacono" : "Wpłacono"} {formatMoney(feedback.amount)}.</Text> : null}
    {recentTransfers.length > 0 ? <>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: historyOpen }} onPress={() => setHistoryOpen(!historyOpen)} style={s.history}><Text style={s.muted}>{historyOpen ? "Zwiń historię ▴" : "Ostatnie przelewy ▾"}</Text></Pressable>
      {historyOpen ? recentTransfers.slice(0, 3).map((entry) => <Text key={entry.id} style={s.muted}>{entry.type === "withdraw" ? "Bank → Gotówka" : "Gotówka → Bank"} · {formatMoney(entry.amount)}</Text>) : null}
    </> : null}
  </View>;
}
const s = StyleSheet.create({
  wrap: { gap: 10 }, row: { flexDirection: "row", gap: 6 }, balances: { flexDirection: "row", gap: 8 },
  balance: { flex: 1, minWidth: 0, backgroundColor: "#13120f", borderRadius: 12, padding: 12, gap: 6 },
  value: { color: "#f3d99e", fontSize: 19, fontWeight: "800" }, muted: { color: "#b9ae9c", fontSize: 12, lineHeight: 17 },
  tab: { flex: 1, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: "#393225", justifyContent: "center", alignItems: "center" }, selected: { backgroundColor: "#302616", borderColor: "#c4a05e" }, text: { color: "#ecdbc0", fontSize: 12, fontWeight: "700" },
  route: { color: "#ecd1a1", fontSize: 14, fontWeight: "700" }, input: { minHeight: 48, backgroundColor: "#15130f", borderColor: "#78603a", borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, color: "#fff1da", fontSize: 20 },
  preset: { flex: 1, minHeight: 44, justifyContent: "center", alignItems: "center", borderRadius: 10, backgroundColor: "#272116" },
  confirm: { minHeight: 48, borderRadius: 12, padding: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#dfbf85" }, confirmText: { color: "#21190e", fontSize: 15, fontWeight: "800" },
  disabled: { opacity: 0.4 }, error: { color: "#ef9a98", fontSize: 12 }, success: { color: "#b5d7a7", fontSize: 12 }, history: { minHeight: 44, justifyContent: "center" },
});
