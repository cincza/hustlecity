import React from "react";
import { View } from "react-native";
import { HeroPanel } from "../components/GameScreenPrimitives";

export function ProfileMenuScreen({
  section,
  styles,
  SceneArtwork,
  SectionCard,
  ActionTile,
  sceneBackgrounds,
  systemVisuals,
  actions,
}) {
  const isUtilities = section === "utilities";
  const title = isUtilities ? "Narzedzia" : "Spolecznosc";
  const subtitle = isUtilities
    ? "Bank, misje, regeneracja i leczenie w jednym miejscu."
    : "Gracze, znajomi, wiadomosci, rankingi i chat miasta.";
  const cards = isUtilities
    ? [
        { id: "tasks", title: "Misje", subtitle: "Nagrody i szybki progres.", visual: systemVisuals.respect, onPress: () => actions.openSection("profile", "tasks") },
        { id: "bank", title: "Bank", subtitle: "Wplaty i wyplaty.", visual: systemVisuals.bank, onPress: () => actions.openSection("profile", "bank") },
        { id: "casino", title: "Kasyno", subtitle: "Blackjack i ruletka.", visual: systemVisuals.casino, onPress: () => actions.openSection("profile", "casino") },
        { id: "gym", title: "Silownia", subtitle: "Karnety i trening.", visual: systemVisuals.pvp, onPress: () => actions.openSection("profile", "gym") },
        { id: "restaurant", title: "Jedzenie", subtitle: "Buffy i regeneracja.", visual: systemVisuals.energy, onPress: () => actions.openSection("profile", "restaurant") },
        { id: "hospital", title: "Szpital", subtitle: "Leczenie i wyjscie z celi.", visual: systemVisuals.defense, onPress: () => actions.openSection("profile", "hospital") },
      ]
    : [
        { id: "players", title: "Gracze", subtitle: "Kto jest teraz w miescie.", visual: systemVisuals.gang, onPress: () => actions.openSection("profile", "players") },
        { id: "friends", title: "Znajomi", subtitle: "Twoja lista kontaktow.", visual: systemVisuals.respect, onPress: () => actions.openSection("profile", "friends") },
        { id: "messages", title: "Wiadomosci", subtitle: "Skrzynka i odpowiedzi.", visual: systemVisuals.cash, onPress: () => actions.openSection("profile", "messages") },
        { id: "citychat", title: "Chat miasta", subtitle: "Wszyscy online w jednym kanale.", visual: systemVisuals.market, onPress: () => actions.openSection("profile", "citychat") },
        { id: "rankings", title: "Rankingi", subtitle: "Top ekipy i top gracze.", visual: systemVisuals.market, onPress: () => actions.openSection("profile", "rankings") },
      ];
  const logoutCard = isUtilities && typeof actions.logout === "function"
    ? {
        id: "logout",
        title: "Wyloguj",
        subtitle: "Zamknij sesje na tym urzadzeniu i wroc do logowania.",
        visual: systemVisuals.defense,
        onPress: actions.logout,
        danger: true,
      }
    : null;
  const visibleCards = logoutCard ? [...cards, logoutCard] : cards;

  return (
    <>
      <SceneArtwork
        eyebrow="Postac"
        title={title}
        lines={[subtitle]}
        accent={isUtilities ? ["#2e2a18", "#15110c", "#050505"] : ["#291e2c", "#120f17", "#050505"]}
        source={isUtilities ? sceneBackgrounds.profile : sceneBackgrounds.city}
      />
      <HeroPanel
        eyebrow={isUtilities ? "Narzedzia" : "Spolecznosc"}
        title={title}
        summary={subtitle}
        tone={isUtilities ? "gold" : "info"}
        pills={[
          {
            label: "Sekcje",
            value: `${visibleCards.length}`,
            note: isUtilities ? "Ruchy techniczne i regeneracja." : "Kontakt z ludzmi i zyciem miasta.",
            tone: isUtilities ? "gold" : "info",
            icon: isUtilities ? "tools" : "account-group-outline",
          },
        ]}
      />
      <SectionCard title={title} subtitle={subtitle}>
        <View style={styles.grid}>
          {visibleCards.map((card) => (
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
    </>
  );
}
