import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { DISTRICTS } from "../../shared/districts";
import { getCityEventImpactLines, getCityEventRemaining, getCityEventResponse } from "../../shared/cityDirector";
import { request } from "../game/api/client";

import { Text } from "../i18n";
function durationLabel(milliseconds) {
  const minutes = Math.max(0, Math.ceil(Number(milliseconds || 0) / 60000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours} godz. ${rest} min` : `${rest} min`;
}

export default function CityEventPanel({ game, token, onUser, compact = false, readOnly = false }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const player = useMemo(() => ({ ...game, profile: game?.player || {} }), [game]);
  const response = getCityEventResponse(player, Date.now());
  const event = game?.cityEvent || response.event;
  const district = DISTRICTS.find((entry) => entry.id === event?.districtId);
  const gangResponse = game?.gang?.directorResponse;
  const gangAligned = Boolean(game?.gang?.joined && game.gang.focusDistrictId === event?.districtId);
  const gangProgress = gangResponse?.eventKey === event?.key ? Math.min(3, gangResponse.memberIds?.length || 0) : 0;

  async function respond(choiceId) {
    if (busy || readOnly || response.responded) return;
    setBusy(true);
    setNotice("");
    try {
      const payload = await request("/city-event/respond", { token, method: "POST", body: { choiceId } });
      onUser?.(payload.user);
      setNotice(payload.result?.message || "Miasto zapisało Twoją reakcję.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  if (!event) return null;
  return (
    <View style={[styles.panel, event.tone === "danger" && styles.danger]}>
      <View style={styles.header}>
        <View style={styles.grow}>
          <Text style={styles.kicker}>TERAZ W MIEŚCIE · {district?.name || event.districtId}</Text>
          <Text style={styles.title}>{event.title}</Text>
        </View>
        <Text style={styles.timer}>{durationLabel(getCityEventRemaining(event))}</Text>
      </View>
      <Text style={styles.body}>{event.summary}</Text>
      {!compact && getCityEventImpactLines(event).map((line) => <Text key={line} style={styles.impact}>• {line}</Text>)}
      <Text style={styles.systems}>{event.systems.join(" · ")}</Text>
      {gangAligned && <Text style={styles.gang}>Reakcja gangu w tej dzielnicy: {gangProgress}/3{gangResponse?.rewardedAt ? " · cel domknięty" : ""}</Text>}
      {!readOnly && (response.responded ? <Text style={styles.done}>Twoja reakcja na to wydarzenie jest już zapisana.</Text> : response.choices.filter((choice) => !choice.classId || choice.classId === game?.contacts?.classId).map((choice) => {
        const disabled = busy || choice.reasons.length > 0;
        return <View key={choice.id} style={styles.choice}>
          <View style={styles.grow}>
            <Text style={styles.choiceTitle}>{choice.label}{choice.classId ? " · opcja klasy" : ""}</Text>
            <Text style={styles.choiceText}>{choice.text}</Text>
            {!!choice.reasons.length && <Text style={styles.reason}>{choice.reasons.join(" · ")}</Text>}
          </View>
          <Pressable disabled={disabled} onPress={() => respond(choice.id)} style={[styles.button, disabled && styles.disabled]}>
            <Text style={styles.buttonText}>Reaguj</Text>
          </Pressable>
        </View>;
      }))}
      {!!notice && <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { marginVertical: 10, padding: 16, gap: 9, borderRadius: 14, borderWidth: 1, borderColor: "#8b6a43", backgroundColor: "#171109" },
  danger: { borderColor: "#8c4545", backgroundColor: "#190d0d" },
  header: { flexDirection: "row", gap: 12, alignItems: "flex-start" }, grow: { flex: 1 },
  kicker: { color: "#d8b260", fontSize: 11, fontWeight: "800", letterSpacing: 1 }, title: { color: "#fff5dd", fontSize: 20, fontWeight: "900", marginTop: 3 },
  timer: { color: "#f4c96a", fontSize: 12, fontWeight: "800" }, body: { color: "#d6d0c5", lineHeight: 20 },
  impact: { color: "#bfc5ce", lineHeight: 19 }, systems: { color: "#8f98a8", fontSize: 12 }, gang: { color: "#8fd0a5", fontWeight: "700" },
  choice: { flexDirection: "row", gap: 10, alignItems: "center", paddingTop: 9, borderTopWidth: 1, borderTopColor: "#34291d" },
  choiceTitle: { color: "#f4f4f5", fontWeight: "800" }, choiceText: { color: "#adb5c2", lineHeight: 18, marginTop: 2 }, reason: { color: "#d99b79", marginTop: 3, fontSize: 12 },
  button: { backgroundColor: "#e6c176", paddingHorizontal: 13, paddingVertical: 10, borderRadius: 8 }, buttonText: { color: "#171719", fontWeight: "900" }, disabled: { opacity: 0.35 },
  done: { color: "#8fd0a5", fontWeight: "800" }, notice: { color: "#f4c96a", lineHeight: 20 },
});
