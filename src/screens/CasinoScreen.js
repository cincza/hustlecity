import React from "react";
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
  // TODO: TO_MIGRATE_TO_SERVER casino presentation is modularized, but blackjack/roulette local fallback actions still come from App.js.
  return (
    <>
      <SectionCard title="Ruletka" subtitle="Masz animowany spin, historie i wlasna stawke.">
        <SceneArtwork
          eyebrow="Kasyno"
          title="Ciezki stol i swiatlo neonow"
          lines={["Wrzucasz stawke, wybierasz kolor i patrzysz jak kula miesza stol.", "Tu ma byc klimat sali, nie kalkulator."]}
          accent={["#532614", "#1a120d", "#050505"]}
          source={sceneBackgrounds.casinoWide}
        />
        <View style={styles.listCard}>
          <View style={styles.entityHead}>
            <EntityBadge visual={systemVisuals.casino} />
            <View style={styles.flexOne}>
              <Text style={styles.listCardTitle}>Stol kasyna</Text>
              <Text style={styles.listCardMeta}>
                Neon, stol i szybka decyzja. Tryb API: {apiStatus === "online" ? "online" : "lokalny fallback"}.
              </Text>
            </View>
          </View>
        </View>
        {casinoState.backendMeta ? (
          <View style={styles.listCard}>
            <StatLine label="Dzienny limit strat" value={formatMoney(casinoState.backendMeta.dailyLossCap || 0)} />
            <StatLine label="Straty dzis" value={formatMoney(casinoState.backendMeta.dailyLoss || 0)} />
            <StatLine label="Widełki high-risk" value={`${formatMoney(casinoState.backendMeta.limits?.highRisk?.minBet || 0)} - ${formatMoney(casinoState.backendMeta.limits?.highRisk?.maxBet || 0)}`} />
          </View>
        ) : null}
        <View style={styles.casinoHero}>
          <View style={styles.rouletteWheel}>
            <View style={styles.rouletteRingOuter} />
            <View style={styles.rouletteRingInner}>
              <Text style={styles.casinoNumber}>{casinoState.rouletteDisplay}</Text>
            </View>
            <View style={styles.rouletteNeedle} />
          </View>
          <Text style={styles.casinoMeta}>
            {casinoState.rouletteSpinning
              ? "Kula leci..."
              : casinoState.rouletteResult
                ? `Ostatni wynik: ${casinoState.rouletteResult.color.toUpperCase()}`
                : "Wybierz kolor i krec."}
          </Text>
        </View>
        <View style={styles.choiceRow}>
          {["red", "black", "green"].map((choice) => (
            <Pressable
              key={choice}
              onPress={() => setCasinoState((prev) => ({ ...prev, rouletteChoice: choice }))}
              style={[styles.choiceChip, casinoState.rouletteChoice === choice && styles.choiceChipActive, choice === "green" && styles.choiceChipGreen]}
            >
              <Text style={styles.choiceChipText}>{choice.toUpperCase()}</Text>
            </Pressable>
          ))}
          <TextInput
            value={casinoState.rouletteBet}
            onChangeText={(value) => setCasinoState((prev) => ({ ...prev, rouletteBet: value.replace(/[^0-9]/g, "").slice(0, 6) || "0" }))}
            keyboardType="numeric"
            style={styles.betInput}
          />
          <Pressable onPress={spinRoulette} style={[styles.inlineButton, casinoState.rouletteSpinning && styles.tileDisabled]}>
            <Text style={styles.inlineButtonText}>Spin {formatMoney(Number(casinoState.rouletteBet || 0))}</Text>
          </Pressable>
        </View>
        <View style={styles.historyRow}>
          {casinoState.rouletteHistory.map((entry, index) => (
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
        {casinoState.serverGame ? (
          <StatLine
            label="Ostatni wynik online"
            value={`${casinoState.serverGame.win ? "Wygrana" : "Przegrana"} | net ${formatMoney(casinoState.serverGame.net || 0)}`}
          />
        ) : null}
      </SectionCard>

      <SectionCard title="Blackjack" subtitle="Masz widoczne karty, sume punktow i normalna stawke wpisywana recznie.">
        <SceneArtwork
          eyebrow="Blackjack"
          title="Stol, karty i krupier"
          lines={["Widzisz swoje karty, ukryta karte krupiera i laczna wartosc ukladu.", "To ma byc czytelne i grube, nie tabela w arkuszu."]}
          accent={["#23412a", "#0e1710", "#050505"]}
        />
        <View style={styles.listCard}>
          <View style={styles.entityHead}>
            <EntityBadge visual={systemVisuals.pvp} />
            <View style={styles.flexOne}>
              <Text style={styles.listCardTitle}>Stol blackjacka</Text>
              <Text style={styles.listCardMeta}>Widzisz karty, punkty i wejscie na stol w jednym miejscu, bez suchego kalkulatora.</Text>
            </View>
          </View>
        </View>
        <View style={styles.blackjackBoard}>
          <View style={styles.blackjackColumn}>
            <Text style={styles.blackjackLabel}>Twoje karty</Text>
            <View style={styles.cardFan}>
              {casinoState.blackjack.playerCards.length
                ? casinoState.blackjack.playerCards.map((card, index) => <PlayingCard key={`player-${index}`} card={card} />)
                : <PlayingCard card={{ label: "?", value: 0 }} hidden />}
            </View>
            <Text style={styles.blackjackTotal}>Suma: {handValue(casinoState.blackjack.playerCards)}</Text>
          </View>
          <View style={styles.blackjackColumn}>
            <Text style={styles.blackjackLabel}>Krupier</Text>
            <View style={styles.cardFan}>
              {casinoState.blackjack.dealerCards.length ? (
                casinoState.blackjack.dealerCards.map((card, index) => (
                  <PlayingCard key={`dealer-${index}`} card={card} hidden={casinoState.blackjack.stage === "player" && index > 0} />
                ))
              ) : (
                <PlayingCard card={{ label: "?", value: 0 }} hidden />
              )}
            </View>
            <Text style={styles.blackjackTotal}>
              Suma: {casinoState.blackjack.stage === "player" ? (casinoState.blackjack.dealerCards[0]?.value || 0) : handValue(casinoState.blackjack.dealerCards)}
            </Text>
          </View>
        </View>
        <StatLine label="Stan rozdania" value={casinoState.blackjack.message} />
        <View style={styles.grid}>
          <View style={styles.betPanel}>
            <Text style={styles.betPanelLabel}>Stawka</Text>
            <TextInput
              value={casinoState.blackjack.bet}
              onChangeText={(value) => setCasinoState((prev) => ({ ...prev, blackjack: { ...prev.blackjack, bet: value.replace(/[^0-9]/g, "").slice(0, 6) || "0" } }))}
              keyboardType="numeric"
              style={styles.betInput}
            />
          </View>
          <ActionTile title="Rozdaj" subtitle={`Wejscie na stol za ${formatMoney(Number(casinoState.blackjack.bet || 0))}.`} visual={systemVisuals.casino} onPress={startBlackjack} disabled={["dealing", "player", "dealer"].includes(casinoState.blackjack.stage)} />
          <ActionTile title="Dobierz" subtitle="Kolejna karta dla Ciebie." visual={systemVisuals.attack} onPress={hitBlackjack} disabled={casinoState.blackjack.stage !== "player"} />
          <ActionTile title="Pas" subtitle="Krupier odslania reke." visual={systemVisuals.defense} onPress={standBlackjack} disabled={casinoState.blackjack.stage !== "player"} />
        </View>
      </SectionCard>
    </>
  );
}
