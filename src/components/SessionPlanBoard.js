import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { request } from "../game/api/client";

function timeLeftLabel(expiresAt, now) {
  const minutes = Math.max(0, Math.ceil((Number(expiresAt || 0) - now) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} godz. ${minutes % 60} min`;
}

function ActionButton({ label, onPress, disabled, secondary = false }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.button, secondary && styles.buttonSecondary, disabled && styles.disabled]}>
      <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{label}</Text>
    </Pressable>
  );
}

export default function SessionPlanBoard({ game, token, onUser, onNavigate }) {
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(Date.now());
  const board = game?.planBoard || { active: null, proposals: [] };

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  async function mutate(path, body, label) {
    if (busy) return;
    setBusy(label);
    setNotice("");
    try {
      const payload = await request(path, { token, method: "POST", body });
      onUser?.(payload.user);
      setNotice(payload.result?.message || "Tablica została zaktualizowana.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy("");
    }
  }

  const active = board.active;
  const activeApproach = active?.proposal?.approaches?.find((entry) => entry.id === active.approachId);
  const nextStep = active?.steps?.find((entry) => !entry.done);

  return (
    <View style={styles.shell}>
      <View style={styles.header}>
        <View style={styles.grow}>
          <Text style={styles.kicker}>MIEJSKA TABLICA PLANÓW</Text>
          <Text style={styles.heading}>{active ? "Twój ruch na tę sesję" : "Wybierz kierunek"}</Text>
        </View>
        {active ? <Text style={styles.timer}>{active.status === "expired" ? "Wygasł" : timeLeftLabel(active.expiresAt, now)}</Text> : null}
      </View>

      {active ? (
        <View style={styles.activeCard}>
          <Text style={styles.title}>{active.proposal?.title}</Text>
          <Text style={styles.meta}>{activeApproach?.title} · ryzyko: {active.proposal?.risk}</Text>
          <Text style={styles.reason}>{active.proposal?.reason}</Text>
          <View style={styles.steps}>
            {(active.steps || []).map((step) => (
              <View key={step.id} style={styles.stepRow}>
                <Text style={[styles.stepMark, step.done && styles.stepDone]}>{step.done ? "✓" : "○"}</Text>
                <Text style={[styles.stepText, step.done && styles.stepDone]}>{step.label}</Text>
              </View>
            ))}
          </View>
          {active.outcome === "setback" ? <Text style={styles.setback}>Komplikacja weszła do historii planu. Finał nadal jest dostępny, ale nagroda uwzględnia wynik.</Text> : null}
          <View style={styles.actions}>
            {active.ready ? (
              <ActionButton label={busy === "claim" ? "Domykam…" : "Domknij i odbierz"} disabled={Boolean(busy)} onPress={() => mutate("/plans/claim", {}, "claim")} />
            ) : nextStep ? (
              <ActionButton label="Idź do następnego kroku" disabled={Boolean(busy)} onPress={() => onNavigate?.(nextStep.destination?.tab, nextStep.destination?.section)} />
            ) : null}
            <ActionButton label={active.status === "expired" ? "Usuń wygasły plan" : "Odpuść plan"} secondary disabled={Boolean(busy)} onPress={() => mutate("/plans/abandon", {}, "abandon")} />
          </View>
        </View>
      ) : null}

      {(!active || active.status === "expired") && (board.proposals || []).map((plan) => (
        <View key={plan.key} style={styles.proposal}>
          <View style={styles.proposalHeader}>
            <View style={styles.grow}>
              <Text style={styles.title}>{plan.title}</Text>
              <Text style={styles.meta}>Ryzyko: {plan.risk} · {timeLeftLabel(plan.expiresAt, now)}</Text>
            </View>
            <Text style={styles.reward}>{plan.rewardHint}</Text>
          </View>
          <Text style={styles.reason}>{plan.reason}</Text>
          {plan.approaches.map((approach) => (
            <View key={approach.id} style={styles.approach}>
              <View style={styles.grow}>
                <Text style={styles.approachTitle}>{approach.title}</Text>
                <Text style={styles.approachText}>{approach.summary}</Text>
              </View>
              <ActionButton label={busy === `${plan.key}:${approach.id}` ? "Wybieram…" : "Wybierz"} disabled={Boolean(busy)} onPress={() => mutate("/plans/accept", { planKey: plan.key, approachId: approach.id }, `${plan.key}:${approach.id}`)} />
            </View>
          ))}
        </View>
      ))}
      {!active && !(board.proposals || []).length ? <Text style={styles.empty}>Na ten moment tablica jest czysta. Wróć po zmianie sytuacji w mieście.</Text> : null}
      {!!notice && <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { marginBottom: 12, padding: 15, gap: 10, borderWidth: 1, borderColor: "#725b32", borderRadius: 14, backgroundColor: "#120f0b" },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 10 }, grow: { flex: 1 },
  kicker: { color: "#d7ad59", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 }, heading: { color: "#fff1d0", fontSize: 19, fontWeight: "900", marginTop: 3 },
  timer: { color: "#e8c879", fontWeight: "800", fontSize: 12 }, activeCard: { gap: 8, paddingTop: 9, borderTopWidth: 1, borderTopColor: "#3b3020" },
  proposal: { gap: 8, padding: 12, borderWidth: 1, borderColor: "#3b3428", borderRadius: 11, backgroundColor: "#181510" },
  proposalHeader: { flexDirection: "row", gap: 10, alignItems: "flex-start" }, title: { color: "#f7f1e7", fontSize: 16, fontWeight: "900" },
  meta: { color: "#b9a985", fontSize: 12, marginTop: 2 }, reason: { color: "#c9c3b8", lineHeight: 19 }, reward: { maxWidth: 120, color: "#79c99b", fontSize: 11, fontWeight: "800", textAlign: "right" },
  steps: { gap: 5, paddingVertical: 3 }, stepRow: { flexDirection: "row", gap: 8 }, stepMark: { color: "#caa95f", fontWeight: "900" }, stepText: { flex: 1, color: "#d5d0c8" }, stepDone: { color: "#77c896" },
  setback: { color: "#dc9c73", fontSize: 12, lineHeight: 17 }, approach: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#30291e" },
  approachTitle: { color: "#eee5d3", fontWeight: "800" }, approachText: { color: "#aaa59c", fontSize: 12, lineHeight: 17, marginTop: 2 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 2 }, button: { minHeight: 38, justifyContent: "center", paddingHorizontal: 12, borderRadius: 8, backgroundColor: "#dcb967" },
  buttonSecondary: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#665941" }, buttonText: { color: "#17130d", fontWeight: "900", fontSize: 12 }, buttonTextSecondary: { color: "#d3c6aa" },
  disabled: { opacity: 0.45 }, empty: { color: "#aaa59c", lineHeight: 19 }, notice: { color: "#e7c56d", lineHeight: 19 },
});
