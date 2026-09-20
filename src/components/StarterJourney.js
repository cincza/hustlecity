import React, { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { getTaskDestination } from "../../shared/taskGuidance.js";

export function StarterJourney({ journey, onNavigate, onClaim, formatMoney, nextUnlock, recovery }) {
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const task = journey.current;
  const ready = Boolean(task?.completed);
  const destination = getTaskDestination(task);
  const action = !ready && recovery ? recovery : destination;
  async function activate() {
    if (pending.current) return;
    if (!ready) { if (action) onNavigate(action.tab, action.section); return; }
    pending.current = true;
    setBusy(true);
    try { await onClaim(task); }
    finally { pending.current = false; setBusy(false); }
  }
  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>{journey.finished ? "PIERWSZE KROKI ZA TOBĄ" : "TWOJE PIERWSZE RUCHY"}</Text>
        <Text style={styles.count}>{journey.claimedCount}/{journey.total}</Text>
      </View>
      <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: journey.total, now: journey.claimedCount }}>
        {journey.steps.map((step) => <View key={step.id} style={[styles.segment, step.claimed && styles.done, step.completed && !step.claimed && styles.ready]} />)}
      </View>
      <Text style={styles.title}>{journey.finished ? "Ulica zna już twoje imię." : task?.title}</Text>
      <Text style={styles.hint}>{journey.finished ? "Masz za sobą skok, trening, bank i handel. Kolejne misje prowadzą do własnych biznesów i ekipy." : ready ? "Robota wykonana. Odbierz nagrodę i przejdź do kolejnego kroku." : action?.hint}</Text>
      {task ? <Text style={styles.reward}>{task.progressLabel} · Nagroda: {formatMoney(task.rewardCash)}{task.rewardXp ? ` + ${task.rewardXp} XP` : ""}</Text> : null}
      {!journey.finished ? (
        <Pressable accessibilityRole="button" accessibilityState={{ busy, disabled: busy }} disabled={busy} onPress={activate} style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}>
          <Text style={styles.buttonText}>{busy ? "Odbieranie…" : ready ? "Odbierz nagrodę" : action?.label || "Otwórz misje"}</Text>
        </Pressable>
      ) : null}
      {nextUnlock ? <Text style={styles.unlock}>Następne odblokowanie: {nextUnlock}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#171611", borderColor: "#655032", borderWidth: 1, borderRadius: 18, padding: 16, gap: 9, marginBottom: 14 },
  heading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  eyebrow: { color: "#ddb97b", fontSize: 10, letterSpacing: 1.3, fontWeight: "800", flexShrink: 1 },
  count: { color: "#e6d4b6", fontSize: 12, fontWeight: "800" },
  track: { flexDirection: "row", gap: 5 },
  segment: { height: 4, borderRadius: 3, backgroundColor: "#393326", flex: 1 },
  done: { backgroundColor: "#73d59e" },
  ready: { backgroundColor: "#ebc27d" },
  title: { color: "#fff1d9", fontSize: 19, fontWeight: "800" },
  hint: { color: "#cec3af", fontSize: 13, lineHeight: 19 },
  reward: { color: "#e9c88c", fontSize: 12, lineHeight: 18 },
  button: { borderRadius: 11, minHeight: 44, padding: 12, backgroundColor: "#dec18e", alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#221b10", fontSize: 13, fontWeight: "800" },
  unlock: { color: "#bfb4a1", fontSize: 11, lineHeight: 16 },
});
