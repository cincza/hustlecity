import React, { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function CareerPanel({ career, onNavigate, onClaim, formatMoney, recovery }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const task = career.current;
  const ready = task?.completed;
  const destination = !ready && recovery ? recovery : career.destination;
  async function activate() {
    if (pending.current) return;
    if (!ready) { if (destination) onNavigate(destination.tab, destination.section); return; }
    pending.current = true; setBusy(true); setError("");
    try { await onClaim(task); } catch { setError("Nie udało się odebrać nagrody. Spróbuj ponownie."); }
    finally { pending.current = false; setBusy(false); }
  }
  return <View style={styles.card}>
    <Text style={styles.eyebrow}>TWOJA DROGA · ROZDZIAŁ {career.chapterNumber}/{career.chapters.length}</Text>
    <Text style={styles.title}>{career.title}</Text>
    <Text style={styles.contact}>{career.contact}</Text>
    <Text style={styles.body}>{career.story}</Text>
    <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: career.total, now: career.claimedCount }}>
      {career.steps.map((step) => <View key={step.id} style={[styles.segment, step.claimed && styles.done]} />)}
    </View>
    {task ? <>
      <Text style={styles.objective}>{task.title} · {task.progressLabel}</Text>
      <Text style={styles.body}>{ready ? "Cel osiągnięty. Odbierz nagrodę i ruszaj dalej." : destination?.hint || task.description}</Text>
      <Text style={styles.reward}>Nagroda: {formatMoney(task.rewardCash)} · {task.rewardXp} XP</Text>
      <Pressable accessibilityRole="button" disabled={busy || (!ready && !destination)} accessibilityState={{ busy, disabled: busy || (!ready && !destination) }} onPress={activate} style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}>
        <Text style={styles.buttonText}>{busy ? "Odbieranie…" : ready ? "Odbierz nagrodę" : destination?.label || "Cel w przygotowaniu"}</Text>
      </Pressable>
    </> : <Text style={styles.reward}>Droga ukończona. Skarbiec zdobyty. Dalsza gra to twoja decyzja: wpływy w dzielnicach, biznes lub rywalizacja z ekipami.</Text>}
    {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    <Text style={styles.footer}>{career.claimedCount}/{career.total} celów rozdziału · {career.chapters[career.chapterNumber]?.title ? `Dalej: ${career.chapters[career.chapterNumber].title}` : "Finał drogi"}</Text>
  </View>;
}
const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 18, backgroundColor: "#17140f", borderWidth: 1, borderColor: "#655032", gap: 8, marginBottom: 14 },
  eyebrow: { color: "#c9a567", fontSize: 10, letterSpacing: 1, fontWeight: "800" },
  title: { color: "#fff1d9", fontSize: 21, fontWeight: "800" },
  contact: { color: "#dfbd80", fontSize: 12, fontWeight: "700" },
  body: { color: "#c9c0b2", fontSize: 13, lineHeight: 19 },
  objective: { color: "#fff1d9", fontSize: 14, fontWeight: "700" },
  reward: { color: "#e9c88c", fontSize: 12 },
  track: { flexDirection: "row", gap: 5, marginVertical: 4 }, segment: { flex: 1, height: 4, backgroundColor: "#393326", borderRadius: 4 }, done: { backgroundColor: "#dfbd80" },
  button: { minHeight: 46, borderRadius: 12, backgroundColor: "#dec18e", padding: 12, justifyContent: "center", alignItems: "center" },
  buttonText: { color: "#221b10", fontSize: 13, fontWeight: "800" }, footer: { color: "#a79d8f", fontSize: 11, lineHeight: 16 }, error: { color: "#ef8990", fontSize: 12 },
});
