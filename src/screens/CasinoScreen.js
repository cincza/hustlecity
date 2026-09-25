import React, { useEffect, useState } from "react";
import { getCasinoGameConfig } from "../game/selectors/authorityFeedback";
import { CasinoMachinePanel } from "../components/CasinoMachinePanel";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { Text, TextInput } from "../i18n";
function sanitizeCasinoBetInput(value, maxBet) {
  const safeDigits = Math.max(1, String(Math.max(0, Math.floor(Number(maxBet || 0)))).length);
  return value.replace(/[^0-9]/g, "").slice(0, safeDigits) || "0";
}

export function CasinoScreen({
  cash,
  apiStatus,
  casinoState,
  styles,
  SceneArtwork,
  SectionCard,
  StatLine,
  ActionTile,
  PlayingCard,
  EntityBadge,
  sceneBackgrounds,
  systemVisuals,
  formatMoney,
  formatCooldown,
  handValue,
  setCasinoState,
  spinRoulette,
  spinSlot,
  startBlackjack,
  hitBlackjack,
  standBlackjack,
}) {
  const [casinoView, setCasinoView] = useState("blackjack");
  const safeRouletteHistory = Array.isArray(casinoState?.rouletteHistory) ? casinoState.rouletteHistory : [];
  const safeBackendMeta = casinoState?.backendMeta || null;
  const safeBlackjack = {
    bet: "0",
    playerCards: [],
    dealerCards: [],
    stage: "idle",
    message: "Usiadz do stolu.",
    ...(casinoState?.blackjack || {}),
  };
  const blackjackLimits = safeBackendMeta?.limits?.blackjack || null;
  const casinoCooldownRemainingMs = getCasinoGameConfig(safeBackendMeta, "blackjack").cooldownRemainingMs;
  const [, tick] = useState(0);
  useEffect(() => { const timer = setInterval(() => tick(n => n + 1), 250); return () => clearInterval(timer); }, []);

  return (
    <>
      <SectionCard title="Kasyno" subtitle="Wybierz stol i grasz.">
        <View style={{ flexDirection: "row", gap: 5 }}>
          <Pressable
            accessibilityRole="tab" accessibilityState={{ selected: casinoView === "blackjack" }} onPress={() => setCasinoView("blackjack")}
            style={{ flex: 1, minHeight: 44, padding: 6, justifyContent: "center", alignItems: "center", borderRadius: 10, borderWidth: 1, borderColor: casinoView === "blackjack" ? "#dfbc74" : "#4b3d2a", backgroundColor: "#211b12" }}
          >
            <Text style={{ color: "#e7d5b2", fontSize: 10, fontWeight: "800" }}>BLACKJACK</Text>
          </Pressable>
          <Pressable
            accessibilityRole="tab" accessibilityState={{ selected: casinoView === "roulette" }} onPress={() => setCasinoView("roulette")}
            style={{ flex: 1, minHeight: 44, padding: 6, justifyContent: "center", alignItems: "center", borderRadius: 10, borderWidth: 1, borderColor: casinoView === "roulette" ? "#dfbc74" : "#4b3d2a", backgroundColor: "#211b12" }}
          >
            <Text style={{ color: "#e7d5b2", fontSize: 10, fontWeight: "800" }}>RULETKA</Text>
          </Pressable>
          <Pressable
            accessibilityRole="tab" accessibilityState={{ selected: casinoView === "slot" }} onPress={() => setCasinoView("slot")}
            style={{ flex: 1, minHeight: 44, padding: 6, justifyContent: "center", alignItems: "center", borderRadius: 10, borderWidth: 1, borderColor: casinoView === "slot" ? "#dfbc74" : "#4b3d2a", backgroundColor: "#211b12" }}
          >
            <Text style={{ color: "#e7d5b2", fontSize: 10, fontWeight: "800" }}>AUTOMATY</Text>
          </Pressable>
        </View>
      </SectionCard>

      {casinoView === "blackjack" ? (
      <SectionCard title="Blackjack" subtitle="Karty na stol.">
        <SceneArtwork
          eyebrow="Blackjack"
          title="Karty na stol"
          lines={["Grasz reke i liczysz punkty."]}
          accent={["#23412a", "#0e1710", "#050505"]}
        />
        {apiStatus === "online" ? (
          <View style={styles.listCard}>
            <StatLine
              label="Status"
              value="Blackjack online zapisuje sie na backendzie"
              visual={systemVisuals.casino}
            />
            {blackjackLimits ? (
              <StatLine
                label="Stawka"
                value={`${formatMoney(blackjackLimits.minBet || 0)} - ${formatMoney(blackjackLimits.maxBet || 0)}`}
              />
            ) : null}
            {casinoCooldownRemainingMs > 0 ? (
              <StatLine label="Stol stygnie" value={formatCooldown(casinoCooldownRemainingMs)} />
            ) : null}
          </View>
        ) : null}
        <View style={styles.listCard}>
          <View style={styles.entityHead}>
            <EntityBadge visual={systemVisuals.pvp} />
            <View style={styles.flexOne}>
              <Text style={styles.listCardTitle}>Stol blackjacka</Text>
              <Text style={styles.listCardMeta}>Start, dobierz albo pas.</Text>
            </View>
          </View>
        </View>
        <View style={styles.blackjackBoard}>
          <View style={styles.blackjackColumn}>
            <Text style={styles.blackjackLabel}>Twoje karty</Text>
            <View style={styles.cardFan}>
              {safeBlackjack.playerCards.length
                ? safeBlackjack.playerCards.map((card, index) => <PlayingCard key={`player-${index}`} card={card} />)
                : <PlayingCard card={{ label: "?", value: 0 }} hidden />}
            </View>
            <Text style={styles.blackjackTotal}>Suma: {handValue(safeBlackjack.playerCards)}</Text>
          </View>
          <View style={styles.blackjackColumn}>
            <Text style={styles.blackjackLabel}>Krupier</Text>
            <View style={styles.cardFan}>
              {safeBlackjack.dealerCards.length ? (
                safeBlackjack.dealerCards.map((card, index) => (
                  <PlayingCard key={`dealer-${index}`} card={card} hidden={safeBlackjack.stage === "player" && index > 0} />
                ))
              ) : (
                <PlayingCard card={{ label: "?", value: 0 }} hidden />
              )}
              {safeBlackjack.stage === "player" && safeBlackjack.dealerHasHiddenCard ? (
                <PlayingCard card={{ label: "?", value: 0 }} hidden />
              ) : null}
            </View>
            <Text style={styles.blackjackTotal}>
              Suma: {safeBlackjack.stage === "player" ? (safeBlackjack.dealerCards[0]?.value || 0) : handValue(safeBlackjack.dealerCards)}
            </Text>
          </View>
        </View>
        <StatLine label="Stan rozdania" value={safeBlackjack.message} />
        <View style={styles.grid}>
          <View style={styles.betPanel}>
            <Text style={styles.betPanelLabel}>Stawka</Text>
            <TextInput
              value={safeBlackjack.bet}
              onChangeText={(value) =>
                setCasinoState((prev) => ({
                  ...prev,
                  blackjack: {
                    ...prev.blackjack,
                    bet: sanitizeCasinoBetInput(value, blackjackLimits?.maxBet || 500000),
                  },
                }))
              }
              keyboardType="numeric"
              style={styles.betInput}
            />
          </View>
          <ActionTile
            title="Start"
            subtitle={`Wejscie: ${formatMoney(Number(safeBlackjack.bet || 0))}.`}
            visual={systemVisuals.casino}
            onPress={startBlackjack}
            disabled={["dealing", "player", "dealer"].includes(safeBlackjack.stage) || casinoCooldownRemainingMs > 0}
          />
          <ActionTile title="Dobierz" subtitle="Bierzesz karte." visual={systemVisuals.attack} onPress={hitBlackjack} disabled={safeBlackjack.stage !== "player"} />
          <ActionTile title="Pas" subtitle="Krupier gra dalej." visual={systemVisuals.defense} onPress={standBlackjack} disabled={safeBlackjack.stage !== "player"} />
        </View>
      </SectionCard>
      ) : null}

      {casinoView === "slot" || casinoView === "roulette" ? <CasinoMachinePanel key={casinoView} mode={casinoView} state={casinoState} setState={setCasinoState} cash={cash} onSpin={casinoView === "slot" ? spinSlot : spinRoulette} formatMoney={formatMoney} /> : null}
    </>
  );
}
