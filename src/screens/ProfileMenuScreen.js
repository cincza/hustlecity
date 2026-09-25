import React, { useState } from "react";
import { Linking, Platform, Pressable, StyleSheet, View } from "react-native";
import { HeroPanel } from "../components/GameScreenPrimitives";

import { Alert, Text, TextInput, translateText } from "../i18n";
import { LanguageSelector } from "../components/LanguageSelector";
function splitCards(cards, size) {
  return cards.reduce((groups, card, index) => {
    const bucket = Math.floor(index / size);
    if (!groups[bucket]) groups[bucket] = [];
    groups[bucket].push(card);
    return groups;
  }, []);
}

export function ProfileMenuScreen({
  section,
  styles,
  SectionCard,
  ActionTile,
  systemVisuals,
  actions,
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteUsername, setDeleteUsername] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const isUtilities = section === "utilities";
  const title = isUtilities ? "Narzedzia" : "Spolecznosc";
  const subtitle = isUtilities ? "Bank, regeneracja i szybkie sprawy postaci." : "Kontakt z ludzmi i zyciem miasta.";

  const cards = isUtilities
    ? [
        { id: "bank", title: "Bank", subtitle: "Wplaty i wyplaty.", visual: systemVisuals.bank, onPress: () => actions.openSection("profile", "bank") },
        { id: "tasks", title: "Misje", subtitle: "Nagrody i szybki progres.", visual: systemVisuals.respect, onPress: () => actions.openSection("profile", "tasks") },
        { id: "hospital", title: "Szpital", subtitle: "Leczenie i powrot do pionu.", visual: systemVisuals.defense, onPress: () => actions.openSection("profile", "hospital") },
        { id: "gym", title: "Silownia", subtitle: "Karnety i trening.", visual: systemVisuals.pvp, onPress: () => actions.openSection("profile", "gym") },
        { id: "restaurant", title: "Restauracja", subtitle: "Szybkie doladowanie energii.", visual: systemVisuals.energy, onPress: () => actions.openSection("profile", "restaurant") },
        { id: "casino", title: "Kasyno", subtitle: "Blackjack i ruletka.", visual: systemVisuals.casino, onPress: () => actions.openSection("profile", "casino") },
      ]
    : [
        { id: "players", title: "Gracze", subtitle: "Kto jest teraz w miescie.", visual: systemVisuals.gang, onPress: () => actions.openSection("profile", "players") },
        { id: "rankings", title: "Rankingi", subtitle: "Top gracze i top ekipy.", visual: systemVisuals.market, onPress: () => actions.openSection("profile", "rankings") },
        { id: "messages", title: "Wiadomosci", subtitle: "Skrzynka i odpowiedzi.", visual: systemVisuals.cash, onPress: () => actions.openSection("profile", "messages") },
        { id: "friends", title: "Znajomi", subtitle: "Twoja lista kontaktow.", visual: systemVisuals.respect, onPress: () => actions.openSection("profile", "friends") },
        { id: "citychat", title: "Chat miasta", subtitle: "Wspolny kanal miasta.", visual: systemVisuals.market, onPress: () => actions.openSection("profile", "citychat") },
      ];

  const sections = splitCards(cards, isUtilities ? 4 : 3);
  const publicWebBase = process.env.EXPO_PUBLIC_PUBLIC_WEB_BASE_URL || "https://hustle-city-web.onrender.com";

  const confirmDelete = () => {
    const run = async () => {
      setDeleteBusy(true);
      setDeleteError("");
      try {
        await actions.deleteAccount({ password: deletePassword, confirmUsername: deleteUsername });
      } catch (error) {
        setDeleteError(error?.message || "Nie udało się usunąć konta.");
        setDeleteBusy(false);
      }
    };
    const message = "Konto, postęp i dane należące do gracza zostaną trwale usunięte. Tej operacji nie można cofnąć.";
    if (Platform.OS === "web" && typeof globalThis.confirm === "function") {
      if (globalThis.confirm(translateText(message))) void run();
      return;
    }
    Alert.alert("Ostateczne potwierdzenie", message, [
      { text: "Anuluj", style: "cancel" },
      { text: "Usuń konto", style: "destructive", onPress: run },
    ]);
  };

  return (
    <>
      <HeroPanel
        eyebrow={isUtilities ? "Narzedzia" : "Kontakt"}
        title={title}
        summary={subtitle}
        tone={isUtilities ? "gold" : "info"}
        pills={[
          {
            label: "Sekcje",
            value: `${cards.length}`,
            note: isUtilities ? "Najczestsze ruchy postaci w jednym miejscu." : "Ludzie, rankingi i kontakt.",
            tone: isUtilities ? "gold" : "info",
            icon: isUtilities ? "tools" : "account-group-outline",
          },
        ]}
      />

      {sections.map((cardGroup, index) => (
        <SectionCard
          key={`${title}-${index}`}
          title={index === 0 ? "Na teraz" : isUtilities ? "Reszta ruchow" : "Dodatkowy kontakt"}
          subtitle={index === 0 ? "Najczesciej odpalane wejscia." : "Dodatkowe wejscia bez rozpychania calej zakladki."}
        >
          <View style={styles.grid}>
            {cardGroup.map((card) => (
              <ActionTile
                key={card.id}
                title={card.title}
                subtitle={card.subtitle}
                visual={card.visual}
                onPress={card.onPress}
                danger={card.danger}
              />
            ))}
          </View>
        </SectionCard>
      ))}

      {isUtilities && typeof actions.logout === "function" ? (
        <>
          <SectionCard title="Język" subtitle="Zmień język bez wylogowania i bez utraty postępu.">
            <LanguageSelector />
          </SectionCard>
          <SectionCard title="Sesja" subtitle="Jedna akcja na koncu, zamiast mieszac ja z glownymi narzedziami.">
            <Pressable onPress={actions.logout} style={localStyles.logoutButton}>
              <Text style={localStyles.logoutButtonText}>Wyloguj</Text>
            </Pressable>
          </SectionCard>
          <SectionCard title="Konto" subtitle="Prywatność, instrukcja usuwania i trwałe usunięcie profilu.">
            <View style={localStyles.linkRow}>
              <Pressable onPress={() => Linking.openURL("mailto:adamdz488@gmail.com")} style={localStyles.linkButton}><Text style={localStyles.linkText}>Kontakt</Text></Pressable>
              <Pressable onPress={() => Linking.openURL(`${publicWebBase}/privacy/`)} style={localStyles.linkButton}><Text style={localStyles.linkText}>Polityka prywatności</Text></Pressable>
              <Pressable onPress={() => Linking.openURL(`${publicWebBase}/delete-account/`)} style={localStyles.linkButton}><Text style={localStyles.linkText}>Instrukcja usuwania konta</Text></Pressable>
            </View>
            <Text translate={false} style={localStyles.accountNote}>adamdz488@gmail.com</Text>
            {actions.isAdmin ? <Text style={localStyles.accountNote}>Konto administratora jest chronione przed samodzielnym usunięciem.</Text> : !deleteOpen ? (
              <Pressable onPress={() => setDeleteOpen(true)} style={localStyles.deleteButton}><Text style={localStyles.deleteButtonText}>Usuń konto</Text></Pressable>
            ) : (
              <View style={localStyles.deletePanel}>
                <Text style={localStyles.deleteTitle}>Trwałe usunięcie konta</Text>
                <Text style={localStyles.accountNote}>Wpisz aktualny login i hasło. Po kolejnym potwierdzeniu konto zniknie bez możliwości odzyskania.</Text>
                <TextInput value={deleteUsername} onChangeText={setDeleteUsername} autoCapitalize="none" autoCorrect={false} placeholder={`Wpisz login: ${actions.accountUsername || ""}`} placeholderTextColor="#777" style={localStyles.input} />
                <TextInput value={deletePassword} onChangeText={setDeletePassword} secureTextEntry placeholder="Aktualne hasło" placeholderTextColor="#777" style={localStyles.input} />
                {deleteError ? <Text style={localStyles.error}>{deleteError}</Text> : null}
                <View style={localStyles.linkRow}>
                  <Pressable disabled={deleteBusy} onPress={() => { setDeleteOpen(false); setDeletePassword(""); setDeleteUsername(""); setDeleteError(""); }} style={localStyles.linkButton}><Text style={localStyles.linkText}>Anuluj</Text></Pressable>
                  <Pressable disabled={deleteBusy || !deletePassword || !deleteUsername} onPress={confirmDelete} style={[localStyles.deleteButton, (deleteBusy || !deletePassword || !deleteUsername) && localStyles.disabled]}><Text style={localStyles.deleteButtonText}>{deleteBusy ? "Usuwanie…" : "Przejdź do potwierdzenia"}</Text></Pressable>
                </View>
              </View>
            )}
          </SectionCard>
        </>
      ) : null}
    </>
  );
}

const localStyles = StyleSheet.create({
  logoutButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#8a3438",
    backgroundColor: "#221316",
  },
  logoutButtonText: {
    color: "#ffb8be",
    fontSize: 13,
    fontWeight: "800",
  },
  linkRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  linkButton: { borderWidth: 1, borderColor: "#4a4f59", backgroundColor: "#191c22", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 },
  linkText: { color: "#d9dce2", fontWeight: "800", fontSize: 12 },
  deleteButton: { alignSelf: "flex-start", borderWidth: 1, borderColor: "#8a3438", backgroundColor: "#2a1418", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, marginTop: 10 },
  deleteButtonText: { color: "#ffb8be", fontWeight: "900", fontSize: 12 },
  deletePanel: { marginTop: 10, borderWidth: 1, borderColor: "#63343a", backgroundColor: "#1d1215", borderRadius: 14, padding: 14, gap: 10 },
  deleteTitle: { color: "#ffb8be", fontWeight: "900", fontSize: 16 },
  accountNote: { color: "#bdb8b0", lineHeight: 20, marginTop: 8 },
  input: { minHeight: 46, borderWidth: 1, borderColor: "#474b54", borderRadius: 10, backgroundColor: "#101217", color: "#f4efe8", paddingHorizontal: 12, paddingVertical: 10 },
  error: { color: "#ff9da8", fontWeight: "700" },
  disabled: { opacity: 0.45 },
});
