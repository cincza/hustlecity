import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { OPERATION_CATALOG, OPERATION_STAGE_ORDER, OPERATION_STAGE_LABELS, OPERATION_PHASES, normalizeOperationsState, getOperationById, getOperationChoicesForStage, getActiveOperationStage, getOperationCondition, getOperationUnlockReasons, getOperationChoiceLock, getOperationOutcomePreview, getOperationComplicationOptions, isMajorOperation, advanceActiveOperation } from "../../shared/operations.js";
import { getDistrictModifierSummary, DISTRICTS } from "../../shared/districts.js";
import { getGangProjectEffects } from "../../shared/gangProjects.js";
import { getRivalOperationModifier, getRivalView } from "../../shared/rivals.js";

export function OperationsScreen({ game, formatMoney, onStartOperation, onAdvanceOperation, onExecuteOperation, onResolveOperation, onRespondRival, onCancelOperation, online, onOpenSection }) {
  const [now, setNow] = useState(Date.now());
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const lock = useRef(false);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const state = normalizeOperationsState(game.operations);
  const active = state.active;
  const operation = getOperationById(active?.operationId);
  const stage = getActiveOperationStage(active);
  const gangEffects = getGangProjectEffects(game.gang || {});
  const blocked = !online ? "Operacje wymagają połączenia z serwerem." : Number(game.player.jailUntil || 0) > now ? "Operacje dostępne po wyjściu z celi." : Number(game.player.hp || 0) <= 0 ? "Najpierw wróć do zdrowia." : "";
  const expired = active?.expiresAt > 0 && active.expiresAt <= now;
  const previewFor = (target, plan) => {
    const district = getDistrictModifierSummary(game.city, target.districtId);
    const base = getOperationOutcomePreview({ operation: target, activeOperation: plan, player: game.player, districtPressure: district.pressure, districtInfluence: district.influence, gangEffects });
    const rivalModifier = plan?.rivalModifierSnapshot || getRivalOperationModifier(game, target.districtId, now);
    return { ...base, successChance: Math.max(0.12, Math.min(0.92, Number(base.successChance || 0) + Number(rivalModifier.successDelta || 0))), heatGain: Math.max(0, Number(base.heatGain || 0) + Number(rivalModifier.heatDelta || 0)) };
  };
  const preview = active?.complication?.preview || (operation ? previewFor(operation, active) : null);
  const complicationOptions = getOperationComplicationOptions(active, game);
  const rivalView = game.rivalView || getRivalView(game, now);
  const money = (value) => formatMoney(value);
  const range = (values) => values.map(money).join(" – ");
  async function act(callback) {
    if (lock.current) return;
    lock.current = true; setPending(true); setMessage("");
    try { const result = await callback(); setMessage(result?.logMessage || "Plan zapisany."); setConfirmCancel(false); }
    catch (error) { setMessage(error.message || "Nie udało się zapisać akcji. Spróbuj ponownie."); }
    finally { lock.current = false; setPending(false); }
  }
  const button = (label, callback, disabled = false, secondary = false) => <Pressable accessibilityRole="button" accessibilityState={{ disabled: pending || disabled }} disabled={pending || disabled} onPress={callback} style={[s.button, secondary && s.secondary, (pending || disabled) && s.disabled]}><Text style={secondary ? s.text : s.buttonText}>{pending ? "Zapisywanie…" : label}</Text></Pressable>;
  const completed = OPERATION_CATALOG.filter((entry) => state.progress[entry.id]?.wins > 0).length;
  return <View style={s.root}>
    <Text style={s.eyebrow}>WIĘKSZA ROBOTA · {completed}/{OPERATION_CATALOG.length} CELÓW</Text>
    <Text style={s.title}>Sieć operacji</Text>
    <Text style={s.meta}>Skoki finansują zaplecze. Zaplecze otwiera nowe plany. Ukończ roboty w trzech dzielnicach, żeby dotrzeć do Skarbca miasta.</Text>
    {completed === OPERATION_CATALOG.length && <Text style={s.gold}>Miasto zna twoje imię. Wszystkie cele sieci ukończone — kolejne podejścia służą zyskowi i wpływom, nie blokują nowych nagród.</Text>}
    {blocked ? <Text style={s.warning}>{blocked}</Text> : null}
    {message ? <Text accessibilityRole="alert" style={s.notice}>{message}</Text> : null}
    {rivalView.active ? <View style={[s.card, s.rivalCard]}>
      <Text style={s.eyebrow}>OSOBISTA KONSEKWENCJA · {rivalView.active.districtName}</Text>
      <View style={s.rivalIdentity}><View style={s.rivalSigil}><Text style={s.rivalSigilText}>{rivalView.active.rival.sigil}</Text></View><View style={s.rivalCopy}><Text style={s.title}>{rivalView.active.rival.name}</Text><Text style={s.gold}>{rivalView.active.rival.role} · {rivalView.active.stageLabel}</Text></View></View>
      <Text style={s.rivalQuote}>„{rivalView.active.rival.quote}”</Text>
      <Text style={s.meta}>Napięcie konfliktu: {rivalView.active.escalation}/3</Text>
      <Text style={s.text}>Powód: {rivalView.active.cause.label}</Text>
      {rivalView.active.ignored ? <Text style={s.warning}>Zignorowałeś pierwsze ostrzeżenie. Rywal przeszedł do finału.</Text> : null}
      <Text style={s.warning}>Znana konsekwencja: {rivalView.active.knownConsequence}</Text>
      <Text style={s.heading}>Twoja odpowiedź</Text>
      {rivalView.active.options.map((choice) => {
        const costs = [choice.cashCost ? `${money(choice.cashCost)} gotówki` : null, choice.bankCost ? `${money(choice.bankCost)} z banku` : null, choice.trustCost ? `${choice.trustCost} zaufania` : null, choice.quantity ? `${choice.quantity} szt. zasobu` : null, choice.energyCost ? `${choice.energyCost} EN` : null, choice.hpCost ? `${choice.hpCost} HP` : null].filter(Boolean).join(" · ") || "bez dodatkowego kosztu";
        return <View key={choice.id} style={s.choice}><Text style={s.heading}>{choice.title}</Text><Text style={s.meta}>{choice.summary}</Text><Text style={s.text}>Koszt: {costs}</Text>{choice.reasons?.length ? <Text style={s.warning}>{choice.reasons.join(" · ")}</Text> : null}{button(`Wybierz: ${choice.title}`, () => act(() => onRespondRival(choice.id)), Boolean(blocked || choice.reasons?.length))}</View>;
      })}
    </View> : rivalView.history?.length ? <View style={s.card}><Text style={s.heading}>Miasto pamięta</Text><Text style={s.meta}>Ostatni konflikt: {rivalView.history[0].rivalName} · {rivalView.history[0].success ? "zamknięty na twoich warunkach" : "przetrwany wysokim kosztem"}. Powód: {rivalView.history[0].cause?.label}</Text></View> : null}
    {operation ? <View style={s.card}>
      <Text style={s.title}>{operation.name}</Text>
      <Text style={s.gold}>{active.condition?.label || "Plan archiwalny"} · {expired ? "Plan wygasł" : `${Math.ceil((active.expiresAt - now) / 60000)} min na finał`}</Text>
      <Text style={s.meta}>{active.condition?.summary} Warunki wydarzenia są zachowane do końca planu; presja dzielnicy i twój przypał nadal wpływają na finał.</Text>
      <View style={s.steps}>{OPERATION_STAGE_ORDER.map((id, index) => <Text key={id} style={active.phase !== OPERATION_PHASES.COMPLICATION && index === active.stageIndex ? s.gold : s.meta}>{index < active.stageIndex ? "✓" : index + 1} {OPERATION_STAGE_LABELS[id]}</Text>)}{isMajorOperation(operation) && <Text style={active.phase === OPERATION_PHASES.COMPLICATION ? s.gold : s.meta}>{active.phase === OPERATION_PHASES.COMPLICATION ? "!" : 6} Komplikacja</Text>}</View>
      <Text style={s.text}>Wydano {money(active.prepSpent)} · Finał {operation.energyCost} EN</Text>
      <Text style={s.text}>Szansa {Math.round(preview.successChance * 100)}% · Przypał +{preview.heatGain}</Text>
      <Text style={s.meta}>Łup {range(preview.rewardRange)} · {stage ? "Zysk przed kolejnymi kosztami" : "Zysk netto przy sukcesie"}: {range(preview.netRange)}</Text>
      <Text style={s.warning}>Porażka: przepada {money(active.prepSpent)} przygotowań, do {money(preview.failureLoss)} dodatkowej straty i {operation.hpLoss.join("–")} HP. {Math.round(preview.leakChance * 100)}% wskaźnika przecieku{preview.leakChance > 0.42 ? " — możliwe więzienie." : " — brak ryzyka celi."}</Text>
      {active.phase === OPERATION_PHASES.COMPLICATION && !expired ? <>
        <View style={s.complication}>
          <Text style={s.eyebrow}>DECYZJA W TRAKCIE AKCJI · ENERGIA JUŻ ZUŻYTA</Text>
          <Text style={s.title}>{active.complication?.title}</Text>
          <Text style={s.text}>{active.complication?.summary}</Text>
          <Text style={s.meta}>Ryzyko i wydarzenie miasta zostały zapisane przy wejściu. Ponowne uruchomienie gry nie zmieni tej sytuacji.</Text>
        </View>
        <Text style={s.heading}>Wybierz sposób wyjścia</Text>
        {complicationOptions.map((choice) => {
          const costs = [choice.cashCost ? `${money(choice.cashCost)} gotówki` : null, choice.bankCost ? `${money(choice.bankCost)} z banku` : null, choice.trustCost ? `${choice.trustCost} zaufania` : null, choice.quantity ? `${choice.quantity} szt. zasobu` : null, choice.energyCost ? `${choice.energyCost} EN` : null, choice.hpCost ? `${choice.hpCost} HP` : null].filter(Boolean).join(" · ") || "bez dodatkowego kosztu";
          const direction = choice.retreat ? "Bez łupu i postępu; unikasz pełnej porażki." : `${choice.successDelta >= 0.1 ? "mocno zwiększa" : "zwiększa"} szansę · ${choice.leakDelta < 0 ? "zmniejsza ślad" : "zwiększa ślad"} · ${choice.rewardDelta > 0 ? "więcej łupu" : choice.rewardDelta < 0 ? "mniejsza marża" : "łup bez zmiany"}`;
          return <View style={s.choice} key={choice.id}>
            <Text style={s.heading}>{choice.title}</Text><Text style={s.meta}>{choice.summary}</Text>
            <Text style={s.text}>Koszt: {costs}</Text><Text style={s.gold}>{direction}</Text>
            {choice.reasons?.length ? <Text style={s.warning}>{choice.reasons.join(" · ")}</Text> : null}
            {button(choice.retreat ? "Wycofaj ekipę" : `Wybierz: ${choice.title}`, () => act(() => onResolveOperation(choice.id)), Boolean(blocked || choice.reasons?.length), choice.retreat)}
          </View>;
        })}
      </> : stage && !expired ? <>
        <Text style={s.heading}>{OPERATION_STAGE_LABELS[stage]} · wybierz jeden wariant</Text>
        {getOperationChoicesForStage(stage).map((choice) => {
          const reason = getOperationChoiceLock(choice, game);
          const next = previewFor(operation, advanceActiveOperation(active, choice.id, now));
          return <View style={s.choice} key={choice.id}>
            <Text style={s.heading}>{choice.label} · {money(choice.cashCost)}</Text>
            <Text style={s.meta}>{choice.summary}</Text>
            <Text style={s.text}>Po wyborze: {Math.round(next.successChance * 100)}% szans · przypał +{next.heatGain} · łup {range(next.rewardRange)}</Text>
            <Text style={s.meta}>Przeciek {Math.round(next.leakChance * 100)}% · łącznie wydasz {money(active.prepSpent + choice.cashCost)}</Text>
            {reason ? <Text style={s.warning}>{reason}</Text> : null}
            {button(Number(game.player.cash) < choice.cashCost ? "Brakuje gotówki" : `Wybierz: ${choice.label}`, () => act(() => onAdvanceOperation(choice.id)), Boolean(blocked || reason || Number(game.player.cash) < choice.cashCost))}
          </View>;
        })}
      </> : !expired ? button(Number(game.player.energy) < operation.energyCost ? `Potrzeba ${operation.energyCost} EN` : "Wykonaj operację", () => act(onExecuteOperation), Boolean(blocked || Number(game.player.energy) < operation.energyCost)) : <Text style={s.warning}>Kontakt stracił aktualność. Porzuć plan, żeby wybrać nowy cel.</Text>}
      {confirmCancel ? <><Text style={s.warning}>Bez zwrotu {money(active.prepSpent)}. Na pewno porzucić?</Text>{button("Tak, porzuć plan bez zwrotu", () => act(onCancelOperation), false, true)}{button("Zachowaj plan", () => setConfirmCancel(false), false, true)}</> : button("Porzuć plan…", () => setConfirmCancel(true), !online, true)}
    </View> : <>
      <Text style={s.heading}>Wybierz cel</Text>
      {[...OPERATION_CATALOG].sort((a, b) => a.respect - b.respect).map((entry) => {
        const reasons = getOperationUnlockReasons(entry, game, now);
        const district = getDistrictModifierSummary(game.city, entry.districtId);
        const districtDefinition = DISTRICTS.find((candidate) => candidate.id === entry.districtId) || DISTRICTS[0];
        const condition = getOperationCondition(entry.districtId, now);
        const discount = game.gang?.focusDistrictId === entry.districtId ? 1 - Math.min(0.12, Number(gangEffects.influenceGain || 0)) : 1;
        const rivalModifier = getRivalOperationModifier(game, entry.districtId, now);
        const cost = Math.round(entry.prepCost * Number(district.pressureState.prepCostMultiplier || 1) * discount * Number(rivalModifier.prepMultiplier || 1));
        if (district.pressureState.id === "lockdown") reasons.push("Lockdown dzielnicy");
        if (Number(game.player.cash) < cost) reasons.push(`Brakuje ${money(cost - Number(game.player.cash))} gotówki`);
        return <View style={[s.card, s.operationCard, { borderTopColor: districtDefinition.accent }]} key={entry.id}>
          <Text style={[s.eyebrow, { color: districtDefinition.accent }]}>{districtDefinition.name} · {entry.respect} RES {state.progress[entry.id]?.wins ? `· ✓ ${state.progress[entry.id].wins} zwycięstw` : "· NOWY CEL"}</Text>
          <Text style={s.heading}>{entry.name}</Text><Text style={s.meta}>{entry.summary}</Text>
          <Text style={s.districtLine}>{districtDefinition.signature}</Text>
          <Text style={s.gold}>{condition.label} · zmiana za {Math.ceil((condition.endsAt - now) / 60000)} min</Text><Text style={s.meta}>{condition.summary}</Text>
          {rivalModifier.summary ? <Text style={s.warning}>{rivalModifier.summary}</Text> : null}
          <Text style={s.text}>Rozpoczęcie {money(cost)} + wybrane przygotowania · {entry.energyCost} EN na finał</Text>
          <Text style={s.meta}>Bazowy łup {range(entry.baseReward)} · {entry.xpGain} XP{!state.progress[entry.id]?.wins ? ` (pierwszy sukces: ${entry.xpGain * 3} XP)` : ""}. {isMajorOperation(entry) ? "Duży cel ma decyzję podczas finału i może skończyć się częściowym sukcesem." : "Po rozliczeniu cel odpoczywa 30 min."}</Text>
          {reasons.length ? <Text style={s.warning}>{reasons.join(" · ")}</Text> : null}
          {button(`Rozpocznij: ${entry.name}`, () => act(() => onStartOperation(entry.id)), Boolean(blocked || reasons.length))}
        </View>;
      })}
    </>}
    <View style={s.card}><Text style={s.heading}>Zaplecze daje wybór</Text><Text style={s.meta}>Biznes: ciche rozpoznanie. Fabryka: większy wywóz. Wyposażone narzędzie: tańsze przygotowanie. Własne auto: tani, ale głośniejszy odwrót. Wystarczy posiadanie — niczego nie tracisz.</Text><View style={s.steps}>{button("Biznesy", () => onOpenSection("empire", "businesses"), false, true)}{button("Fabryki", () => onOpenSection("empire", "factories"), false, true)}{button("Sprzęt", () => onOpenSection("market", "items"), false, true)}{button("Dzielnice", () => onOpenSection("city", "districts"), false, true)}</View></View>
    {state.history.length > 0 && <View style={s.card}><Text style={s.heading}>Ostatnie rozliczenia</Text>{state.history.map((entry) => <View key={entry.id} style={s.history}><Text style={s.text}>{getOperationById(entry.operationId)?.name} · {entry.cancelled ? "porzucona" : entry.outcome === "retreat" ? "taktyczny odwrót" : entry.outcome === "partial" ? "częściowy sukces" : entry.success ? "sukces" : "porażka"}</Text><Text style={s.meta}>{entry.net !== undefined ? `Bilans ${money(entry.net)}` : "Archiwalny wynik — brak pełnego kosztu"}{entry.firstClear ? " · pierwsze ukończenie" : ""}</Text></View>)}</View>}
  </View>;
}

const s = StyleSheet.create({
  root: { gap: 12, minWidth: 0 }, title: { color: "#f3eee5", fontSize: 23, fontWeight: "800" }, heading: { color: "#efe6d7", fontSize: 16, fontWeight: "700" },
  eyebrow: { color: "#b79862", fontSize: 11, fontWeight: "700", letterSpacing: 1 }, meta: { color: "#a7a6a3", fontSize: 12, lineHeight: 18 }, text: { color: "#dedbd4", fontSize: 13, lineHeight: 19 }, gold: { color: "#d2b477", fontSize: 13, lineHeight: 19 },
  warning: { color: "#d4a490", fontSize: 12, lineHeight: 18 }, notice: { color: "#ead9b1", padding: 14, backgroundColor: "#29251e", borderRadius: 10 },
  card: { padding: 14, gap: 10, backgroundColor: "#171819", borderColor: "#34302a", borderWidth: 1, borderRadius: 14, minWidth: 0 },
  choice: { padding: 12, gap: 8, backgroundColor: "#202122", borderRadius: 10 }, steps: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  complication: { padding: 14, gap: 8, backgroundColor: "#2a211c", borderColor: "#8e6245", borderWidth: 1, borderRadius: 12 },
  rivalCard: { borderColor: "#7f3f38", backgroundColor: "#211a1a" },
  rivalIdentity: { flexDirection: "row", alignItems: "center", gap: 12 }, rivalSigil: { width: 52, height: 52, borderRadius: 14, borderWidth: 1, borderColor: "#a45e54", backgroundColor: "#351f1d", alignItems: "center", justifyContent: "center" }, rivalSigilText: { color: "#ffd5c4", fontSize: 17, fontWeight: "900", letterSpacing: 1 }, rivalCopy: { flex: 1, minWidth: 0, gap: 2 }, rivalQuote: { color: "#e1baa9", fontSize: 14, lineHeight: 21, fontStyle: "italic", borderLeftWidth: 2, borderLeftColor: "#8f4d45", paddingLeft: 12 },
  operationCard: { borderTopWidth: 3 }, districtLine: { color: "#d6c5aa", fontSize: 12, lineHeight: 18, fontStyle: "italic" },
  button: { minHeight: 46, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: "#b79964", borderRadius: 9, alignItems: "center", justifyContent: "center" }, buttonText: { color: "#171819", fontSize: 13, fontWeight: "800", textAlign: "center" }, secondary: { backgroundColor: "#303033" }, disabled: { opacity: 0.45 }, history: { borderTopWidth: 1, borderColor: "#34302a", paddingTop: 8, gap: 4 },
});
