import React, { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { HeroPanel } from "../components/GameScreenPrimitives";

const LOADOUT_LABELS = {
  weapon: "Bron",
  armor: "Ochrona",
  tool: "Narzedzia",
  electronics: "Elektronika",
  car: "Auto",
};

const LOADOUT_ICONS = {
  weapon: "sword",
  armor: "shield-outline",
  tool: "hammer-wrench",
  electronics: "radar",
  car: "car-sports",
};

const LOADOUT_TABS = [
  { id: "weapon", label: "Bron" },
  { id: "armor", label: "Ochrona" },
  { id: "tool", label: "Narzedzia" },
  { id: "electronics", label: "Elektronika" },
  { id: "car", label: "Auta" },
];

function CompactMetricCard({ styles, label, value, note, tone = "neutral" }) {
  const toneStyle =
    tone === "danger"
      ? localStyles.metricCardDanger
      : tone === "success"
        ? localStyles.metricCardSuccess
        : tone === "info"
          ? localStyles.metricCardInfo
          : localStyles.metricCardNeutral;

  const valueStyle =
    tone === "danger"
      ? localStyles.metricValueDanger
      : tone === "success"
        ? localStyles.metricValueSuccess
        : tone === "info"
          ? localStyles.metricValueInfo
          : localStyles.metricValueNeutral;

  return (
    <View style={[styles.mobileOverviewCard, localStyles.metricCard, toneStyle]}>
      <Text style={styles.mobileOverviewLabel}>{label}</Text>
      <Text style={[styles.mobileOverviewValue, valueStyle]} numberOfLines={1}>
        {value}
      </Text>
      {note ? (
        <Text style={[styles.listCardMeta, localStyles.metricNote]} numberOfLines={2}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}

function InventoryTab({ active, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={[localStyles.inventoryTab, active && localStyles.inventoryTabActive]}>
      <Text style={[localStyles.inventoryTabText, active && localStyles.inventoryTabTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function ProfileScreen({
  section,
  game,
  styles,
  SectionCard,
  StatLine,
  ProgressBar,
  ProgressDots,
  activeAvatar,
  respectInfo,
  effectivePlayer,
  avatars,
  setAvatar,
  pickCustomAvatar,
  formatMoney,
  formatCooldown,
  getRankTitle,
  heists,
  getSoloHeistOdds,
  criticalCareStatus,
  contractState,
  contractItems,
  contractCars,
  getContractAssetEffectLine,
  onEquipContractLoadout,
}) {
  const [inventoryTab, setInventoryTab] = useState("weapon");

  const ownedByCategory = useMemo(
    () => ({
      weapon: (contractItems || []).filter((item) => item.category === "weapon"),
      armor: (contractItems || []).filter((item) => item.category === "armor"),
      tool: (contractItems || []).filter((item) => item.category === "tool"),
      electronics: (contractItems || []).filter((item) => item.category === "electronics"),
      car: contractCars || [],
    }),
    [contractCars, contractItems]
  );

  const inventoryEntries = ownedByCategory[inventoryTab] || [];
  const bestHeist = [...heists].filter((entry) => entry.respect <= game.player.respect).slice(-1)[0] || heists[0];

  if (section === "summary") {
    return (
      <>
        <HeroPanel
          eyebrow="Postac"
          title={game.player.name}
          summary="Najpierw lapiesz stan, twarz i pozycje na ulicy. Dopiero nizej schodzisz do statow i wyboru avatara."
          tone={criticalCareStatus?.active ? "danger" : "gold"}
          pills={[
            { label: "Szacunek", value: `${game.player.respect}`, note: getRankTitle(game.player.respect), tone: "gold", icon: "star-four-points" },
            { label: "HP", value: `${game.player.hp}/${game.player.maxHp}`, note: criticalCareStatus?.active ? criticalCareStatus.mode?.label || "Stan krytyczny" : "Na nogach", tone: criticalCareStatus?.active ? "danger" : "neutral", icon: "heart-pulse" },
            { label: "Kasa", value: formatMoney(game.player.cash), note: `Bank ${formatMoney(game.player.bank || 0)}`, tone: "success", icon: "cash-multiple" },
          ]}
        />

        <SectionCard title="Tozsamosc" subtitle="Twarz postaci, status i najwazniejsze liczby.">
          <View style={localStyles.identityRow}>
            <LinearGradient colors={activeAvatar.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={localStyles.identityAvatar}>
              {activeAvatar.image ? <Image source={activeAvatar.image} style={localStyles.identityAvatarImage} /> : null}
              {activeAvatar.image ? <View style={localStyles.identityAvatarOverlay} /> : null}
              {!activeAvatar.image ? <Text style={localStyles.identityAvatarSigil}>{activeAvatar.sigil}</Text> : null}
              <Text style={localStyles.identityAvatarName}>{activeAvatar.name}</Text>
            </LinearGradient>

            <View style={localStyles.identityCopy}>
              <View>
                <Text style={localStyles.identityName}>{game.player.name}</Text>
                <Text style={styles.listCardMeta}>{getRankTitle(game.player.respect)} • RES {game.player.respect}</Text>
              </View>

              <View style={localStyles.identityBadgeRow}>
                <View style={[localStyles.identityStatusBadge, criticalCareStatus?.active ? localStyles.identityStatusDanger : localStyles.identityStatusNeutral]}>
                  <Text style={[localStyles.identityStatusText, criticalCareStatus?.active && localStyles.identityStatusTextDanger]}>
                    {criticalCareStatus?.active ? criticalCareStatus.mode?.label || "Stan krytyczny" : "Na wolce"}
                  </Text>
                </View>
                {criticalCareStatus?.protected ? (
                  <View style={[localStyles.identityStatusBadge, localStyles.identityStatusSuccess]}>
                    <Text style={[localStyles.identityStatusText, localStyles.identityStatusTextSuccess]}>
                      Oslona {formatCooldown(criticalCareStatus.protectionRemainingMs || 0)}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Pressable onPress={pickCustomAvatar} style={localStyles.identityAction}>
                <Text style={localStyles.identityActionText}>Dodaj swoje foto</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.mobileOverviewGrid}>
            <CompactMetricCard styles={styles} label="Ranga" value={getRankTitle(game.player.respect)} note="Pozycja na miescie." />
            <CompactMetricCard styles={styles} label="Kasa" value={formatMoney(game.player.cash)} note="Masz przy sobie." tone="success" />
            <CompactMetricCard styles={styles} label="Bank" value={formatMoney(game.player.bank || 0)} note="Schowany hajs." tone="info" />
            <CompactMetricCard styles={styles} label="XP" value={`${respectInfo.currentXp}/${respectInfo.requirement}`} note={`Brakuje ${respectInfo.xpRemaining}.`} />
          </View>
        </SectionCard>

        <SectionCard title="Staty i kondycja" subtitle="Moc, obrona i szybki podglad ryzyka.">
          <View style={styles.mobileOverviewGrid}>
            <CompactMetricCard styles={styles} label="ATK" value={`${effectivePlayer.attack}`} note="Brutalna akcja." tone="danger" />
            <CompactMetricCard styles={styles} label="DEF" value={`${effectivePlayer.defense}`} note="Ile wytrzymasz." tone="info" />
            <CompactMetricCard styles={styles} label="DEX" value={`${effectivePlayer.dexterity}`} note="Czyste wyjscie." tone="gold" />
            <CompactMetricCard styles={styles} label="CHR" value={`${effectivePlayer.charisma}`} note="Rozmowy i presja." tone="success" />
          </View>

          <StatLine label="Zdrowie" value={`${game.player.hp}/${game.player.maxHp}`} />
          {criticalCareStatus?.active ? (
            <>
              <StatLine label="Do wyjscia" value={formatCooldown(criticalCareStatus.remainingMs || 0)} />
              <StatLine label="Powrot" value={`Okolo ${criticalCareStatus.expectedRecoveryHp || 1} HP`} />
            </>
          ) : null}
          <StatLine label="Laczny zarobek" value={formatMoney(game.stats.totalEarned)} />
          <StatLine label="Wygrane napady" value={`${game.stats.heistsWon}`} />
        </SectionCard>

        <SectionCard title="Twarze" subtitle="Zmiana avatara bez rozpychania calego profilu.">
          <View style={localStyles.avatarChoiceGrid}>
            {avatars.map((avatar) => (
              <Pressable
                key={avatar.id}
                onPress={() => setAvatar(avatar.id)}
                style={[styles.avatarChoice, localStyles.avatarChoiceCompact, game.player.avatarId === avatar.id && styles.avatarChoiceActive]}
              >
                <LinearGradient colors={avatar.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.avatarChoiceArt, localStyles.avatarChoiceArtCompact]}>
                  {avatar.image ? <Image source={avatar.image} style={styles.avatarChoiceImage} /> : <Text style={styles.avatarChoiceSigil}>{avatar.sigil}</Text>}
                </LinearGradient>
                <Text style={styles.avatarChoiceText}>{avatar.name}</Text>
              </Pressable>
            ))}
          </View>
        </SectionCard>
      </>
    );
  }

  if (section === "progress") {
    return (
      <>
        <HeroPanel
          eyebrow="Ranga"
          title={`Szacunek ${game.player.respect}`}
          summary="Jeden rzut oka i wiesz ile brakuje do kolejnego progu oraz czy warto teraz cisnac XP."
          tone="gold"
          pills={[
            { label: "XP", value: `${respectInfo.currentXp}/${respectInfo.requirement}`, note: `Brakuje ${respectInfo.xpRemaining}.`, tone: "gold", icon: "chart-line" },
            { label: "Nastepny prog", value: `${respectInfo.nextLevel}`, note: "Kolejny poziom szacunku.", tone: "info", icon: "chevron-double-up" },
          ]}
        />

        <SectionCard title="Postep" subtitle="Krotko, konkretnie i bez pustych blokow.">
          <View style={styles.mobileOverviewGrid}>
            <CompactMetricCard styles={styles} label="Szacunek" value={`${game.player.respect}`} note="Aktualny poziom." />
            <CompactMetricCard styles={styles} label="XP teraz" value={`${respectInfo.currentXp}`} note="Wbity progres." tone="info" />
            <CompactMetricCard styles={styles} label="Do progu" value={`${respectInfo.xpRemaining}`} note="Tyle jeszcze brakuje." tone="gold" />
            <CompactMetricCard styles={styles} label="Nastepny" value={`${respectInfo.nextLevel}`} note="Cel na teraz." tone="success" />
          </View>
          <ProgressBar progress={respectInfo.progress} />
          <ProgressDots progress={respectInfo.progress} />
        </SectionCard>
      </>
    );
  }

  if (section === "loadout") {
    return (
      <>
        <HeroPanel
          eyebrow="Ekwipunek"
          title="Set pod kontrakty"
          summary="Najpierw widzisz co masz zalozone. Nizej przechodzisz po kategoriach bez kilometrowego scrolla."
          tone="info"
          pills={[
            { label: "Sloty", value: `${Object.keys(LOADOUT_LABELS).length}`, note: "Bron, ochrona, narzedzia, elektronika i auto.", tone: "info", icon: "shield-outline" },
            { label: "Itemy", value: `${(contractItems || []).length}`, note: "Kupiony sprzet.", tone: "gold", icon: "briefcase-outline" },
            { label: "Auta", value: `${(contractCars || []).length}`, note: "Fury pod kontrakty.", tone: "success", icon: "car-sports" },
          ]}
        />

        <SectionCard title="Aktualny set" subtitle="Piec slotow i od razu widzisz czym wchodzisz do roboty.">
          <View style={styles.mobileOverviewGrid}>
            {Object.entries(LOADOUT_LABELS).map(([slotId, label]) => {
              const currentId = contractState?.loadout?.[slotId];
              const currentAsset =
                slotId === "car"
                  ? (contractCars || []).find((entry) => entry.id === currentId) || null
                  : (contractItems || []).find((entry) => entry.id === currentId) || null;

              return (
                <View key={slotId} style={[styles.mobileOverviewCard, localStyles.loadoutSlotCard]}>
                  <View style={localStyles.loadoutSlotHeader}>
                    <MaterialCommunityIcons name={LOADOUT_ICONS[slotId]} size={16} color="#d9a958" />
                    <Text style={styles.mobileOverviewLabel}>{label}</Text>
                  </View>
                  <Text style={[styles.mobileOverviewValueSmall, localStyles.loadoutSlotValue]} numberOfLines={2}>
                    {currentAsset?.name || "Brak setu"}
                  </Text>
                  <Text style={[styles.listCardMeta, localStyles.metricNote]} numberOfLines={2}>
                    {currentAsset ? getContractAssetEffectLine(currentAsset) : "Ten slot dalej jest pusty."}
                  </Text>
                  <Pressable onPress={() => onEquipContractLoadout(slotId, null)} style={[styles.inlineButton, localStyles.loadoutSlotButton, !currentAsset && styles.tileDisabled]}>
                    <Text style={styles.inlineButtonText}>{currentAsset ? "Zdejmij" : "Puste"}</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </SectionCard>

        <SectionCard title="Arsenal" subtitle="Jedna kategoria naraz, zeby szybciej znalezc to czego szukasz.">
          <View style={localStyles.inventoryTabsRow}>
            {LOADOUT_TABS.map((tab) => (
              <InventoryTab key={tab.id} label={tab.label} active={inventoryTab === tab.id} onPress={() => setInventoryTab(tab.id)} />
            ))}
          </View>

          {!inventoryEntries.length ? (
            <Text style={styles.emptyText}>
              {inventoryTab === "car" ? "Jeszcze nie masz auta pod kontrakty." : `Nic jeszcze nie kupiles w kategorii ${LOADOUT_LABELS[inventoryTab].toLowerCase()}.`}
            </Text>
          ) : null}

          {inventoryEntries.map((asset) => {
            const slotId = inventoryTab === "car" ? "car" : inventoryTab;
            const equipped = contractState?.loadout?.[slotId] === asset.id;
            return (
              <View key={asset.id} style={[styles.listCard, localStyles.assetRow]}>
                <View style={styles.inlineRow}>
                  <View style={styles.flexOne}>
                    <Text style={styles.listCardTitle}>{asset.name}</Text>
                    <Text style={styles.listCardMeta}>{getContractAssetEffectLine(asset)}</Text>
                  </View>
                  <Pressable onPress={() => onEquipContractLoadout(slotId, equipped ? null : asset.id)} style={styles.inlineButton}>
                    <Text style={styles.inlineButtonText}>{equipped ? "Wybrane" : "Zaloz"}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </SectionCard>
      </>
    );
  }

  if (section === "protection") {
    return (
      <>
        <HeroPanel
          eyebrow="Ochrona"
          title="Ryzyko i bezpieczenstwo"
          summary="Tu na szybko sprawdzasz czy ciagniesz trudniejsza akcje czy lepiej zejsc z heatem."
          tone="danger"
          pills={[
            { label: "ATK", value: `${game.player.attack}`, note: "Brutalne wejscie.", tone: "danger", icon: "sword" },
            { label: "DEF", value: `${game.player.defense}`, note: "Ile wytrzymasz.", tone: "info", icon: "shield-outline" },
            { label: "DEX", value: `${game.player.dexterity}`, note: "Unik i czyste wyjscie.", tone: "gold", icon: "run-fast" },
          ]}
        />

        <SectionCard title="Ryzyko" subtitle="Najwazniejsze liczby pod walke, napady i fail.">
          <View style={styles.mobileOverviewGrid}>
            <CompactMetricCard styles={styles} label="Heat" value={`${game.player.heat}`} note="Presja na miescie." tone={game.player.heat >= 60 ? "danger" : game.player.heat >= 30 ? "gold" : "success"} />
            <CompactMetricCard styles={styles} label="Gang" value={`+${Math.round(game.gang.members * 0.3)}`} note="Premia bezpieczenstwa." tone="success" />
            <CompactMetricCard styles={styles} label="Kara heat" value={`-${Math.round(game.player.heat * 0.35)}%`} note="Minus do czystej gry." tone="danger" />
            <CompactMetricCard
              styles={styles}
              label="Najlepszy skok"
              value={`${Math.round(getSoloHeistOdds(game.player, effectivePlayer, game.gang, bestHeist, game.activeBoosts).chance * 100)}%`}
              note={bestHeist.name}
              tone="info"
            />
          </View>

          <StatLine label="Obrona bazowa" value={`${game.player.defense}`} />
          <StatLine label="Zrecznosc bazowa" value={`${game.player.dexterity}`} />
          <StatLine label="Premia gangu" value={`+${Math.round(game.gang.members * 0.3)} do bezpieczenstwa akcji`} />
          <StatLine label="Heat kary" value={`-${Math.round(game.player.heat * 0.35)}% do czystej gry`} />
          <StatLine label="Najlepszy odblokowany napad" value={`${bestHeist.name} (${Math.round(getSoloHeistOdds(game.player, effectivePlayer, game.gang, bestHeist, game.activeBoosts).chance * 100)}%)`} />
        </SectionCard>
      </>
    );
  }

  if (section === "log") {
    return (
      <>
        <HeroPanel
          eyebrow="Log"
          title="Ostatnie ruchy"
          summary="Szybki podglad tego co dzialo sie wokol postaci, bez grzebania po innych zakladkach."
          tone="neutral"
          pills={[
            {
              label: "Wpisy",
              value: `${game.log.length}`,
              note: game.log[0] || "Na razie spokoj.",
              tone: "neutral",
              icon: "text-box-outline",
            },
          ]}
        />
        <SectionCard title="Log wydarzen" subtitle="Najswiezsze akcje, wtopy, biznes i ruchy postaci.">
          {game.log.map((entry, index) => (
            <View key={`${entry}-${index}`} style={styles.logEntry}>
              <Text style={styles.logText}>{entry}</Text>
            </View>
          ))}
        </SectionCard>
      </>
    );
  }

  return null;
}

const localStyles = StyleSheet.create({
  identityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 10,
  },
  identityAvatar: {
    flexBasis: 132,
    width: undefined,
    maxWidth: "100%",
    minHeight: 132,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#4b3b2a",
    padding: 12,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  identityAvatarImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  identityAvatarOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "48%",
    backgroundColor: "rgba(0,0,0,0.52)",
  },
  identityAvatarSigil: {
    color: "#f7f1e7",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  identityAvatarName: {
    color: "#f0c24d",
    fontSize: 15,
    fontWeight: "800",
  },
  identityCopy: {
    flex: 1,
    minWidth: 210,
    gap: 12,
    justifyContent: "space-between",
  },
  identityName: {
    color: "#f4efe8",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 4,
  },
  identityBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  identityStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "#12151b",
  },
  identityStatusNeutral: {
    borderColor: "#3a434f",
    backgroundColor: "#13171d",
  },
  identityStatusDanger: {
    borderColor: "#7f3942",
    backgroundColor: "#221316",
  },
  identityStatusSuccess: {
    borderColor: "#2f5a42",
    backgroundColor: "#111a14",
  },
  identityStatusText: {
    color: "#dde3ea",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  identityStatusTextDanger: {
    color: "#ffb6bf",
  },
  identityStatusTextSuccess: {
    color: "#b9f1c8",
  },
  identityAction: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#3b3e45",
    backgroundColor: "#181b20",
  },
  identityActionText: {
    color: "#f4efe8",
    fontSize: 12,
    fontWeight: "800",
  },
  metricCard: {
    minHeight: 68,
    paddingVertical: 10,
  },
  metricCardNeutral: {
    borderColor: "#2f3239",
    backgroundColor: "#14161b",
  },
  metricCardSuccess: {
    borderColor: "#254937",
    backgroundColor: "#111812",
  },
  metricCardInfo: {
    borderColor: "#314e67",
    backgroundColor: "#11171d",
  },
  metricCardDanger: {
    borderColor: "#6b343c",
    backgroundColor: "#1a1215",
  },
  metricValueNeutral: {
    color: "#f4efe8",
  },
  metricValueSuccess: {
    color: "#cdf4db",
  },
  metricValueInfo: {
    color: "#deedff",
  },
  metricValueDanger: {
    color: "#ffd1d8",
  },
  metricNote: {
    marginTop: 2,
    lineHeight: 16,
  },
  avatarChoiceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  avatarChoiceCompact: {
    width: 78,
    borderRadius: 16,
    padding: 5,
  },
  avatarChoiceArtCompact: {
    height: 68,
    borderRadius: 12,
  },
  loadoutSlotCard: {
    minHeight: 134,
    justifyContent: "space-between",
  },
  loadoutSlotHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 2,
  },
  loadoutSlotValue: {
    minHeight: 34,
  },
  loadoutSlotButton: {
    marginTop: 8,
  },
  inventoryTabsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  inventoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#2e333d",
    backgroundColor: "#12161b",
  },
  inventoryTabActive: {
    borderColor: "#d6a04f",
    backgroundColor: "#1d1510",
  },
  inventoryTabText: {
    color: "#aeb4bd",
    fontSize: 12,
    fontWeight: "800",
  },
  inventoryTabTextActive: {
    color: "#ffe2b0",
  },
  assetRow: {
    marginBottom: 8,
  },
});
