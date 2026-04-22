import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export function PrisonSection({
  SectionCard,
  formatMoney,
  formatDuration,
  player,
  jailRemaining = 0,
  prisonChat,
  prisonMessage,
  setPrisonMessage,
  onSendMessage,
  onBribeOut,
}) {
  const SafeSectionCard = SectionCard || View;
  const jailed = Boolean(player?.jailUntil && Number(player.jailUntil) > Date.now());
  const remainingLabel = jailed ? formatDuration(jailRemaining) : "--:--";
  const bailCost = jailed ? 400 + Math.ceil(Number(jailRemaining || 0) / 1000) * 8 : 0;
  const safeChat = Array.isArray(prisonChat) ? prisonChat : [];
  const canSend = jailed && String(prisonMessage || "").trim().length > 0;

  return (
    <SafeSectionCard
      title="Cela"
      subtitle={jailed ? "Odsiadka, licznik i jedna szybka decyzja." : "Spokojny status. Dzis nie siedzisz za kratami."}
    >
      <View style={[styles.statusCard, jailed ? styles.statusCardLocked : styles.statusCardFree]}>
        <View style={[styles.statusIconWrap, jailed ? styles.statusIconWrapLocked : styles.statusIconWrapFree]}>
          <MaterialCommunityIcons
            name={jailed ? "gavel" : "shield-check-outline"}
            size={22}
            color={jailed ? "#f4d7b0" : "#dbe8dc"}
          />
        </View>
        <View style={styles.statusContent}>
          <Text style={[styles.statusEyebrow, jailed ? styles.statusEyebrowLocked : styles.statusEyebrowFree]}>
            {jailed ? "Odsiadka" : "Na wolnosci"}
          </Text>
          <Text style={styles.statusTitle}>{jailed ? "Zimna cela" : "Czysty status"}</Text>
          <Text style={styles.statusText}>
            {jailed ? "Patrzysz w licznik i decydujesz, czy placisz za szybki powrot." : "Kraty sa zamkniete dla innych. Ty masz czysty przejazd."}
          </Text>
        </View>
      </View>

      {jailed ? (
        <>
          <View style={styles.timerCard}>
            <Text style={styles.timerLabel}>Pozostalo</Text>
            <Text style={styles.timerValue}>{remainingLabel}</Text>
          </View>

          <Pressable onPress={onBribeOut} style={styles.bailButton}>
            <View style={styles.bailCopy}>
              <Text style={styles.bailEyebrow}>Glowna akcja</Text>
              <Text style={styles.bailTitle}>WYJDZ ZA KAUCJE</Text>
            </View>
            <Text style={styles.bailPrice}>{formatMoney(bailCost)}</Text>
          </Pressable>

          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>Chat wiezienny</Text>
            <Text style={styles.chatMeta}>Dostepny tylko w celi</Text>
          </View>

          <View style={styles.chatComposer}>
            <TextInput
              value={prisonMessage}
              onChangeText={setPrisonMessage}
              placeholder="Napisz z celi..."
              placeholderTextColor="#6c6c6c"
              style={styles.chatInput}
              returnKeyType="send"
              onSubmitEditing={() => {
                if (canSend) onSendMessage();
              }}
            />
            <Pressable onPress={onSendMessage} style={[styles.sendButton, !canSend && styles.sendButtonDisabled]} disabled={!canSend}>
              <Text style={[styles.sendButtonText, !canSend && styles.sendButtonTextDisabled]}>Wyslij</Text>
            </Pressable>
          </View>

          {safeChat.length ? (
            safeChat.map((entry) => (
              <View key={entry.id} style={styles.chatBubble}>
                <Text style={styles.chatAuthor}>
                  {entry.author} <Text style={styles.chatTime}>{entry.time}</Text>
                </Text>
                <Text style={styles.chatText}>{entry.text}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyPanel}>
              <Text style={styles.emptyPanelText}>Cela jest cicha. Jak cos, pierwszy ruch jest po Twojej stronie.</Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.freePanel}>
          <Text style={styles.freePanelTitle}>Chat wiezienny</Text>
          <Text style={styles.freePanelText}>Chat jest dostepny tylko dla osadzonych. Gdy jestes wolny, ekran zostaje czysty i spokojny.</Text>
        </View>
      )}
    </SafeSectionCard>
  );
}

const styles = StyleSheet.create({
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  statusCardFree: {
    backgroundColor: "rgba(19, 23, 26, 0.96)",
    borderColor: "rgba(121, 144, 126, 0.2)",
  },
  statusCardLocked: {
    backgroundColor: "rgba(26, 19, 17, 0.97)",
    borderColor: "rgba(165, 103, 82, 0.24)",
  },
  statusIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  statusIconWrapFree: {
    backgroundColor: "rgba(50, 77, 58, 0.22)",
    borderColor: "rgba(101, 145, 112, 0.3)",
  },
  statusIconWrapLocked: {
    backgroundColor: "rgba(93, 48, 37, 0.22)",
    borderColor: "rgba(181, 117, 96, 0.32)",
  },
  statusContent: {
    flex: 1,
    minWidth: 0,
  },
  statusEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 3,
  },
  statusEyebrowFree: {
    color: "#b6cfb9",
  },
  statusEyebrowLocked: {
    color: "#efba8b",
  },
  statusTitle: {
    color: "#fff6ea",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 2,
  },
  statusText: {
    color: "#cbbba9",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  timerCard: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 12,
    backgroundColor: "rgba(15, 16, 19, 0.98)",
    borderWidth: 1,
    borderColor: "rgba(199, 152, 81, 0.22)",
  },
  timerLabel: {
    color: "#a99680",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  timerValue: {
    color: "#fff3de",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  bailButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    backgroundColor: "#e0ae45",
    borderWidth: 1,
    borderColor: "#f4d28d",
  },
  bailCopy: {
    flex: 1,
    minWidth: 0,
  },
  bailEyebrow: {
    color: "#4f3410",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  bailTitle: {
    color: "#1d1305",
    fontSize: 16,
    fontWeight: "900",
  },
  bailPrice: {
    color: "#1d1305",
    fontSize: 15,
    fontWeight: "900",
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  chatTitle: {
    color: "#fff2df",
    fontSize: 15,
    fontWeight: "900",
  },
  chatMeta: {
    color: "#a99581",
    fontSize: 11,
    fontWeight: "700",
  },
  chatComposer: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  chatInput: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderColor: "#2f3034",
    backgroundColor: "#111214",
    color: "#f1f1f1",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  sendButton: {
    minHeight: 46,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1d2026",
    borderWidth: 1,
    borderColor: "#4c525d",
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  sendButtonText: {
    color: "#f2ede4",
    fontSize: 12,
    fontWeight: "900",
  },
  sendButtonTextDisabled: {
    color: "#a8a095",
  },
  chatBubble: {
    padding: 12,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#26282b",
    borderRadius: 16,
    marginBottom: 8,
  },
  chatAuthor: {
    color: "#f0c24d",
    fontWeight: "800",
    marginBottom: 4,
  },
  chatTime: {
    color: "#999999",
    fontWeight: "400",
  },
  chatText: {
    color: "#dbd5ca",
    lineHeight: 18,
  },
  emptyPanel: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#121314",
    borderWidth: 1,
    borderColor: "#2b2d31",
  },
  emptyPanelText: {
    color: "#a99f92",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  freePanel: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#121416",
    borderWidth: 1,
    borderColor: "#2b3134",
  },
  freePanelTitle: {
    color: "#f0ebe3",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 4,
  },
  freePanelText: {
    color: "#aaa49b",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
});
