import React, { useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import PremiumPanel from "../components/PremiumPanel";
import { CONTACT_SPECIALIZATIONS } from "../../shared/contacts";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { request } from "../game/api/client";
import { CONTACT_CLASSES, CONTACT_COSMETICS, CONTACT_SLOT_MS, normalizeContacts, getContactQuote, contactMilestones } from "../../shared/contacts";
import { DISTRICTS } from "../../shared/districts";
import { getCitySituation } from "../../shared/cityStories";
import CityEventPanel from "../components/CityEventPanel";

export default function ContactsScreen({ game, token, onUser, initial = false }) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const [mode, setMode] = useState("quiet"), [selected, setSelected] = useState(null);
  const [production, setProduction] = useState(false);
  const [showClasses, setShowClasses] = useState(false);
  const [specialist, setSpecialist] = useState(false);
  const [favor, setFavor] = useState(false);
  const now = Date.now(), s = normalizeContacts(game.contacts, now);
  const method = selected || s.classId;
  const activeClass = CONTACT_CLASSES.find((entry) => entry.id === method) || CONTACT_CLASSES[0];
  const source = method === "dealer" && production ? "production" : "market";
  const player = { ...game, profile: game.player };
  const cosmetic = CONTACT_COSMETICS.find((c) => c.id === s.cosmetic);
  const color = cosmetic?.color || (initial ? "#f4c96a" : "#f4f4f5");
  const milestones = contactMilestones(player, now);
  const situations = DISTRICTS.map((district) => getCitySituation(player, district.id, now)).filter(Boolean);
  const title = milestones.filter((m) => m.claimed).at(-1)?.title;
  async function act(action, body = {}) {
    if (busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await request(`/contacts/${action}`, { token, method: "POST", body });
      onUser(response.user); setMessage(response.result.message);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  const button = (label, press, disabled = false, secondary = false) => <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: disabled || busy }} disabled={disabled || busy} onPress={press} style={({ pressed }) => [styles.button, secondary && styles.buttonSecondary, pressed && !disabled && !busy && styles.buttonPressed, (disabled || busy) && styles.buttonDisabled]}><Text style={[styles.buttonText, secondary && styles.buttonTextSecondary, (disabled || busy) && styles.buttonTextDisabled]}>{busy ? "Zapisywanie…" : label}</Text></Pressable>;
  return <ScrollView contentContainerStyle={styles.wrap}>
    <Text style={styles.eyebrow}>{initial ? "PIERWSZY UKŁAD" : "SIEĆ KONTAKTÓW"}</Text>
    <Text style={[styles.title, { color }]}>{initial ? "Jak wejdziesz do miasta?" : "Kontakty miasta"}</Text>
    {(cosmetic || title) && <Text style={[styles.heading, { color }]}>{[title, cosmetic?.name].filter(Boolean).join(" · ")}</Text>}
    <Text style={styles.lead}>{initial ? "Wybierz przewagę i człowieka, który odbierze twój pierwszy telefon. Każda droga prowadzi przez całą grę; zmienia decyzje, koszty i wyjścia z kłopotów." : `${s.completed} zamkniętych umów · ${game.player.premiumTokens || 0} żetonów · Heat ${Math.round(game.player.heat || 0)}`}</Text>
    {initial ? <View style={styles.promise}><MaterialCommunityIcons name="shield-check-outline" size={20} color="#e6c176" /><Text style={styles.promiseText}>Nic sobie nie zamykasz. Kolejne profesje poznasz przez grę, a klasę możesz później zmienić bez utraty postępu.</Text></View> : null}
    {!initial && <CityEventPanel game={game} token={token} onUser={onUser} compact />}
    {!!message && <Text accessibilityLiveRegion="polite" style={styles.notice}>{message}</Text>}
    {!!s.classId && button(showClasses ? "Zamknij teczkę profesji" : `Otwórz teczkę profesji · poznane ${s.learned.length}/5`, () => setShowClasses(!showClasses), false, true)}
    {CONTACT_CLASSES.filter((c) => !s.classId || showClasses || c.id === method).map((c) => <View key={c.id} style={[styles.card, styles.classCard, { borderColor: c.accent }, method === c.id && styles.classCardActive]}>
      <View style={styles.classHeader}>
        <View style={[styles.classIcon, { borderColor: c.accent, backgroundColor: `${c.accent}20` }]}><MaterialCommunityIcons name={c.icon} size={25} color={c.accent} /></View>
        <View style={styles.classIdentity}><Text style={[styles.className, { color: c.accent }]}>{c.name}</Text><Text style={styles.contactName}>{c.contact}{s.classId === c.id ? " · TWOJA KLASA" : ""}</Text></View>
      </View>
      <Text style={styles.classFantasy}>{c.fantasy}</Text>
      <Text style={styles.text}>{c.hook}</Text>
      <View style={styles.strengthRow}>{c.strengths.map((strength) => <View key={strength} style={styles.strengthChip}><Text style={styles.strengthText}>{strength}</Text></View>)}</View>
      <Text style={styles.contactQuote}>„{c.voice}”</Text>
      <Text style={styles.mechanicsLabel}>W GRZE</Text><Text style={styles.mechanicsText}>{c.text}</Text>
      {!s.classId ? button(`Wejdź jako ${c.name}`, () => act("class", { classId: c.id })) : s.learned.includes(c.id) ? <View style={styles.actionStack}>{button(method === c.id ? "Ta metoda jest aktywna" : `Działaj jako ${c.name}`, () => setSelected(c.id), method === c.id)}{s.classId !== c.id && button("Ustaw jako główną klasę · 3 żetony", () => act("class", { classId: c.id }), (game.player.premiumTokens || 0) < 3, true)}</View> : button(`Poznaj kontakt · wymaga ${s.learned.length * 6} zleceń`, () => act("learn", { classId: c.id }), s.completed < s.learned.length * 6)}
    </View>)}
    {!!s.classId && <>
      <View style={[styles.methodBrief, { borderColor: activeClass.accent }]}><Text style={styles.eyebrow}>AKTYWNA METODA · {activeClass.name.toUpperCase()}</Text><Text style={styles.contactQuote}>„{activeClass.voice}”</Text></View>
      <Text style={styles.heading}>Tempo umowy</Text>
      <Text style={styles.text}>{mode === "quiet" ? "Cicho: pewna wypłata i zwykły Heat. Dobra droga, gdy chcesz utrzymać kontrolę." : "Pilnie: 50% większa wypłata i +10 Heat. Przechwycenie zabiera koszt oraz towar."}</Text>
      {button(mode === "quiet" ? "Przyspiesz umowę · więcej zysku i ryzyka" : "Wróć do cichej umowy", () => setMode(mode === "quiet" ? "rush" : "quiet"), false, true)}
      <Text style={styles.heading}>Wypracowany styl · {Math.min(6, s.methods[method] || 0)}/6</Text>
      <Text style={styles.text}>{CONTACT_SPECIALIZATIONS[method]}</Text>
      {button(specialist ? "Specjalizacja aktywna → metoda standardowa" : "Użyj wypracowanej specjalizacji", () => { setSpecialist(!specialist); setFavor(false); }, !specialist && Number(s.methods[method] || 0) < 6)}
      {button(favor ? "Przysługa kontaktu aktywna → metoda standardowa" : "Poproś o przysługę · wymaga 5 zaufania", () => { setFavor(!favor); setSpecialist(false); })}
      {method === "dealer" && button(production ? "Dostawa: własna produkcja → użyj rynku" : "Dostawa: rynek → użyj własnej produkcji", () => setProduction(!production))}
      <Text style={styles.heading}>Sytuacje miasta</Text>
      <Text style={styles.text}>Po dwóch udanych umowach kontakt zaczyna mówić o sprawach, których nie zapisuje się w telefonie. Jedna decyzja tygodniowo wraca w kolejnych zleceniach.</Text>
      {situations.map((situation) => <View key={situation.id} style={styles.card}>
        <Text style={styles.eyebrow}>{DISTRICTS.find((d) => d.id === situation.districtId)?.name} · ZAUFANIE {situation.relation.trust}/20</Text>
        <Text style={styles.heading}>{situation.contact}: {situation.title}</Text>
        <Text style={styles.text}>{situation.text}</Text>
        {situation.relation.lastChoiceId && <Text style={styles.text}>Pamięta poprzednią decyzję: {situation.choices.find((choice) => choice.id === situation.relation.lastChoiceId)?.label || situation.relation.lastChoiceId}.</Text>}
        {situation.resolved ? <Text style={styles.notice}>Sytuacja rozwiązana w tym tygodniu.</Text> : !situation.unlocked ? <Text style={styles.notice}>Zamknij 2 udane umowy w tej dzielnicy.</Text> : situation.choices.map((choice) => <View key={choice.id}>
          <Text style={styles.text}>{choice.text}{choice.masteryBenefit ? ` Specjalizacja: ${choice.masteryBenefit}.` : ""}</Text>
          {button(choice.label, () => act("situation", { districtId: situation.districtId, choiceId: choice.id }), choice.reasons.length > 0)}
          {!!choice.reasons.length && <Text style={styles.notice}>{choice.reasons.join(" · ")}</Text>}
        </View>)}
      </View>)}
      {DISTRICTS.map((d) => {
        const approach = favor ? "favor" : specialist ? "specialist" : "standard";
        const q = getContactQuote(player, d.id, method, mode, now, source, approach);
        if (!q) return null;
        return <View key={d.id} style={[styles.card, styles.districtCard, { borderColor: d.accent }]}>
          <View style={styles.districtHeader}><View style={[styles.districtIcon, { backgroundColor: `${d.accent}1F` }]}><MaterialCommunityIcons name={d.icon} size={22} color={d.accent} /></View><View style={styles.classIdentity}><Text style={[styles.heading, { color: d.accent }]}>{d.name}</Text><Text style={styles.eyebrow}>{q.condition.label} · {q.pressure}</Text></View></View>
          <Text style={styles.classFantasy}>{d.signature}</Text>
          <Text style={styles.text}>{d.streetLine}</Text>
          <Text style={styles.text}>Poziom kontaktu {q.tier} · presja: {q.pressure} · warunki do {new Date(q.condition.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
          <View style={styles.dealRow}><View style={styles.dealStat}><Text style={styles.mechanicsLabel}>WYPŁATA</Text><Text style={styles.dealValue}>${q.reward}</Text></View><View style={styles.dealStat}><Text style={styles.mechanicsLabel}>SZANSA</Text><Text style={styles.dealValue}>{Math.round(q.chance * 100)}%</Text></View><View style={styles.dealStat}><Text style={styles.mechanicsLabel}>HEAT</Text><Text style={styles.dealValue}>{q.heat > 0 ? "+" : ""}{q.heat}</Text></View></View>
          <Text style={styles.mechanicsText}>Wkład: ${q.cost}{q.quantity ? ` + ${q.quantity} × ${q.goods === "spirytus" ? "Spirytus" : "Fajki"} (${q.source === "production" ? "produkcja" : "rynek"})` : ""} · {q.energy} EN{q.damage ? ` · ${q.damage} HP` : ""} · {q.xp} XP</Text>
          {q.pressureOpportunity > 1 && <Text style={styles.notice}>Wysoka presja podbija wypłatę pilnego zlecenia o {Math.round((q.pressureOpportunity - 1) * 100)}%, ale obniża szansę i zwiększa ślad.</Text>}
          {q.consequence && <Text style={styles.notice}>Skutek wcześniejszej decyzji: {q.consequence.label} · pozostało użyć {q.consequence.uses}</Text>}
          {q.bankCost > 0 && <Text style={styles.text}>Z banku: ${q.bankCost} (z prowizją)</Text>}
          {q.approach === "favor" && <Text style={styles.notice}>Przysługa zużyje 1 zaufania także przy niepowodzeniu; obniża wkład i Heat kosztem 16% wypłaty.</Text>}
          {!!q.reasons.length && <Text style={styles.notice}>{q.reasons.join(" · ")}</Text>}
          {button(q.reasons.length ? "Umowa jest teraz niedostępna" : `Zamknij umowę w ${d.shortName}`, () => act("execute", { districtId: d.id, methodId: method, mode, source, approach, slot: Math.floor(now / CONTACT_SLOT_MS) }), q.reasons.length > 0)}
        </View>;
      })}
      <Text style={styles.text}>Po 9 zleceniach i 5 RES kontakt rozwija się na poziom 2; po 24 i 15 RES na poziom 3. Potrzebuje zaplecza: biznesu, fabryki, klubu, 25 sprzedanych towarów lub ukończonej operacji — zależnie od profesji. Zlecenia w dzielnicy gangu liczą się do wspólnego zadania „Sieć kontaktów”.</Text>
      <Text style={styles.heading}>Cele i żetony</Text>
      {button(`Tydzień: ${s.weekCount}/9 · odbierz 2 żetony${s.weekClaimed ? " · odebrane" : ""}`, () => act("weekly"), s.weekCount < 9 || s.weekClaimed)}
      {milestones.map((m) => <View key={m.id} style={styles.card}><Text style={styles.heading}>{m.title}{m.claimed ? " · zdobyty" : ""}</Text><Text style={styles.text}>{m.text}</Text><Text style={styles.text}>{m.progress}</Text>{button(`${m.cost ? "Ufunduj i odbierz" : "Odbierz"} · żetony: ${m.tokens}${m.cost ? ` · $${m.cost}` : ""}`, () => act("milestone", { id: m.id }), !m.ready || m.claimed || game.player.cash < m.cost)}</View>)}
      <Text style={styles.heading}>Wizytówka</Text><Text style={styles.text}>Żetony kupują wygląd i zmianę wypracowanej profesji. Nie kupują energii, pieniędzy ani statystyk.</Text>
      <PremiumPanel game={game} token={token} onUser={onUser} />
      {CONTACT_COSMETICS.map((c) => <View key={c.id}>{button(`${c.name} · ${s.cosmetics.includes(c.id) ? "posiadasz" : `${c.cost} żetony`}`, () => act("cosmetic", { id: c.id }), s.cosmetic === c.id || (!s.cosmetics.includes(c.id) && (game.player.premiumTokens || 0) < c.cost))}</View>)}
      {s.history.length > 0 && <Text style={styles.heading}>Ostatnie umowy</Text>}
      {s.history.map((h, i) => <Text key={`${h.at}-${i}`} style={styles.text}>{DISTRICTS.find((d) => d.id === h.districtId)?.name} · {h.success ? `+$${h.gain}` : "Przechwycono"}</Text>)}
    </>}
  </ScrollView>;
}
const styles = StyleSheet.create({
  wrap: { padding: 18, gap: 14, backgroundColor: "#0b0c0f", flexGrow: 1 },
  eyebrow: { color: "#aa9065", fontSize: 10, fontWeight: "900", letterSpacing: 1.35 },
  title: { fontSize: 28, lineHeight: 33, fontWeight: "900" },
  heading: { color: "#f4efe7", fontSize: 17, lineHeight: 22, fontWeight: "800" },
  lead: { color: "#d0c6b8", fontSize: 15, lineHeight: 23, maxWidth: 720 },
  text: { color: "#c2c5cb", lineHeight: 21 },
  notice: { color: "#f4c96a", lineHeight: 22, padding: 10, borderLeftWidth: 2, borderLeftColor: "#a77c30", backgroundColor: "#201b13" },
  promise: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderWidth: 1, borderColor: "#4c402b", backgroundColor: "#17140f", borderRadius: 12 },
  promiseText: { color: "#d9cbb6", lineHeight: 20, flex: 1 },
  card: { padding: 16, gap: 10, backgroundColor: "#15171b", borderWidth: 1, borderColor: "#30343c", borderRadius: 14 },
  classCard: { borderLeftWidth: 3 },
  classCardActive: { backgroundColor: "#1b1916" },
  classHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  classIcon: { width: 48, height: 48, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  classIdentity: { flex: 1, minWidth: 0, gap: 3 },
  className: { fontSize: 20, fontWeight: "900" },
  contactName: { color: "#b5ad9f", fontSize: 11, fontWeight: "800", letterSpacing: 0.65 },
  classFantasy: { color: "#fff4e2", fontSize: 15, lineHeight: 21, fontWeight: "800" },
  contactQuote: { color: "#c8b38d", fontSize: 13, lineHeight: 20, fontStyle: "italic" },
  strengthRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  strengthChip: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: "#3c414a", backgroundColor: "#1b1e23" },
  strengthText: { color: "#d8d4cc", fontSize: 10, fontWeight: "800" },
  mechanicsLabel: { color: "#918778", fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  mechanicsText: { color: "#aeb3bc", fontSize: 12, lineHeight: 18 },
  actionStack: { gap: 6 },
  methodBrief: { padding: 14, gap: 8, borderLeftWidth: 3, backgroundColor: "#161719", borderRadius: 10 },
  districtCard: { borderTopWidth: 3 },
  districtHeader: { flexDirection: "row", alignItems: "center", gap: 11 },
  districtIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  dealRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  dealStat: { flexGrow: 1, flexBasis: "28%", minWidth: 82, padding: 10, gap: 3, borderRadius: 10, backgroundColor: "#0e1013", borderWidth: 1, borderColor: "#292d34" },
  dealValue: { color: "#f2e5ca", fontSize: 16, fontWeight: "900" },
  button: { minHeight: 48, backgroundColor: "#e6c176", paddingHorizontal: 14, paddingVertical: 13, borderRadius: 10, marginVertical: 3, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#f3d894" },
  buttonSecondary: { backgroundColor: "#202329", borderColor: "#464b55" },
  buttonPressed: { transform: [{ scale: 0.985 }], opacity: 0.9 },
  buttonDisabled: { opacity: 0.58, backgroundColor: "#27282b", borderColor: "#45464a" },
  buttonText: { color: "#171719", fontWeight: "900", textAlign: "center" },
  buttonTextSecondary: { color: "#eee7dc" },
  buttonTextDisabled: { color: "#d5d0c7" },
});
