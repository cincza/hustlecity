import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

export function CasinoScreen({
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
  handValue,
  setCasinoState,
  spinRoulette,
  startBlackjack,
  hitBlackjack,
  standBlackjack,
}) {
  const [casinoView, setCasinoView] = useState("blackjack");
  // TODO: TO_MIGRATE_TO_SERVER casino presentation is modularized, but blackjack/roulette local fallback actions still come from App.js.
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
  const rouletteDisplay = casinoState?.rouletteDisplay ?? "00";
  const rouletteChoice = casinoState?.rouletteChoice ?? "red";
  const rouletteBet = casinoState?.rouletteBet ?? "0";
  const rouletteSpinning = Boolean(casinoState?.rouletteSpinning);
  const rouletteResult = casinoState?.rouletteResult ?? null;
  const serverGame = casinoState?.serverGame ?? null;

  return (
    <>
      <SectionCard title="Kasyno" subtitle="Wybierz stol i grasz.">
        <View style={styles.choiceRow}>
          <Pressable
            onPress={() => setCasinoView("blackjack")}
            style={[styles.choiceChip, casinoView === "blackjack" && styles.choiceChipActive]}
          >
            <Text style={styles.choiceChipText}>BLACKJACK</Text>
          </Pressable>
          <Pressable
            onPress={() => setCasinoView("roulette")}
            style={[styles.choiceChip, casinoView === "roulette" && styles.choiceChipActive]}
          >
            <Text style={styles.choiceChipText}>RULETKA</Text>
          </Pressable>
        </View>
      </SectionCard>

      {casinoView === "blackjack" ? (
      <SectionCard title="Blackjack" subtitle="Siadasz, rozdajesz, grasz.">
        <SceneArtwork
          eyebrow="Blackjack"
          title="Karty na stol"
          lines={["Grasz reke, nie czytasz instrukcji."]}
          accent={["#23412a", "#0e1710", "#050505"]}
        />
        {apiStatus === "online" ? (
          <View style={styles.listCard}>
            <StatLine
              label="Status"
              value="Blackjack online zapisuje sie na backendzie"
              visual={systemVisuals.casino}
            />
          </View>
        ) : null}
        <View style={styles.listCard}>
          <View style={styles.entityHead}>
            <EntityBadge visual={systemVisuals.pvp} />
            <View style={styles.flexOne}>
              <Text style={styles.listCardTitle}>Stol blackjacka</Text>
              <Text style={styles.listCardMeta}>Karty, punkty i decyzja.</Text>
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
              onChangeText={(value) => setCasinoState((prev) => ({ ...prev, blackjack: { ...prev.blackjack, bet: value.replace(/[^0-9]/g, "").slice(0, 5) || "0" } }))}
              keyboardType="numeric"
              style={styles.betInput}
            />
          </View>
          <ActionTile
            title="Start"
            subtitle={`Wejscie: ${formatMoney(Number(safeBlackjack.bet || 0))}.`}
            visual={systemVisuals.casino}
            onPress={startBlackjack}
            disabled={["dealing", "player", "dealer"].includes(safeBlackjack.stage)}
          />
          <ActionTile title="Dobierz" subtitle="Bierzesz karte." visual={systemVisuals.attack} onPress={hitBlackjack} disabled={safeBlackjack.stage !== "player"} />
          <ActionTile title="Pas" subtitle="Krupier gra dalej." visual={systemVisuals.defense} onPress={standBlackjack} disabled={safeBlackjack.stage !== "player"} />
        </View>
      </SectionCard>
      ) : null}

      {casinoView === "roulette" ? (
      <SectionCard title="Ruletka" subtitle="Neon, stol, szybki strzal.">
        <SceneArtwork
          eyebrow="Kasyno"
          title="Neon i ciezki stol"
          lines={["Wrzucasz stawke i patrzysz, czy noc Cie niesie, czy pali bankroll."]}
          accent={["#532614", "#1a120d", "#050505"]}
          source={sceneBackgrounds.casinoWide}
        />
        <View style={styles.listCard}>
          <View style={styles.entityHead}>
            <EntityBadge visual={systemVisuals.casino} />
            <View style={styles.flexOne}>
              <Text style={styles.listCardTitle}>Stol kasyna</Text>
              <Text style={styles.listCardMeta}>Tryb: {apiStatus === "online" ? "online" : "lokalny"}.</Text>
            </View>
          </View>
        </View>
        {safeBackendMeta ? (
          <View style={styles.listCard}>
            <StatLine label="Dzienny limit strat" value={formatMoney(safeBackendMeta.dailyLossCap || 0)} />
            <StatLine label="Straty dzis" value={formatMoney(safeBackendMeta.dailyLoss || 0)} />
            <StatLine
              label="Stawka high-risk"
              value={`${formatMoney(safeBackendMeta.limits?.highRisk?.minBet || 0)} - ${formatMoney(safeBackendMeta.limits?.highRisk?.maxBet || 0)}`}
            />
          </View>
        ) : null}
        <View style={styles.casinoHero}>
          <View style={styles.rouletteWheel}>
            <View style={styles.rouletteRingOuter} />
            <View style={styles.rouletteRingInner}>
              <Text style={styles.casinoNumber}>{rouletteDisplay}</Text>
            </View>
            <View style={styles.rouletteNeedle} />
          </View>
          <Text style={styles.casinoMeta}>
            {rouletteSpinning ? "Kula leci..." : rouletteResult ? `Ostatni wynik: ${rouletteResult.color.toUpperCase()}` : "Wybierz kolor i krec."}
          </Text>
        </View>
        <View style={styles.choiceRow}>
          {["red", "black", "green"].map((choice) => (
            <Pressable
              key={choice}
              onPress={() => setCasinoState((prev) => ({ ...prev, rouletteChoice: choice }))}
              style={[styles.choiceChip, rouletteChoice === choice && styles.choiceChipActive, choice === "green" && styles.choiceChipGreen]}
            >
              <Text style={styles.choiceChipText}>{choice.toUpperCase()}</Text>
            </Pressable>
          ))}
          <TextInput
            value={rouletteBet}
            onChangeText={(value) => setCasinoState((prev) => ({ ...prev, rouletteBet: value.replace(/[^0-9]/g, "").slice(0, 5) || "0" }))}
            keyboardType="numeric"
            style={styles.betInput}
          />
          <Pressable onPress={spinRoulette} style={[styles.inlineButton, rouletteSpinning && styles.tileDisabled]}>
            <Text style={styles.inlineButtonText}>Spin {formatMoney(Number(rouletteBet || 0))}</Text>
          </Pressable>
        </View>
        <View style={styles.historyRow}>
          {safeRouletteHistory.map((entry, index) => (
            <View
              key={`${entry.number}-${index}`}
              style={[
                styles.historyChip,
                entry.color === "red" && styles.historyChipRed,
                entry.color === "black" && styles.historyChipBlack,
                entry.color === "green" && styles.historyChipGreen,
              ]}
            >
              <Text style={styles.historyChipText}>{entry.number}</Text>
            </View>
          ))}
        </View>
        {serverGame ? (
          <StatLine
            label="Ostatni wynik online"
            value={`${serverGame.win ? "Wygrana" : "Przegrana"} | net ${formatMoney(serverGame.net || 0)}`}
          />
        ) : null}
      </SectionCard>
      ) : null}
    </>
  );
}
