import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { HeroPanel } from "../components/GameScreenPrimitives";

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
        <SectionCard title="Sesja" subtitle="Jedna akcja na koncu, zamiast mieszac ja z glownymi narzedziami.">
          <Pressable onPress={actions.logout} style={localStyles.logoutButton}>
            <Text style={localStyles.logoutButtonText}>Wyloguj</Text>
          </Pressable>
        </SectionCard>
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
});
