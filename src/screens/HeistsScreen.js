import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { HEIST_TIERS, getNextHeistTier, groupHeistsByTier } from "../game/config/heistTiers";
import { HeistCard, HeistTabs } from "../components/GameShellUI";
import { getContractTagText } from "../../shared/contracts.js";

export function HeistsScreen({
  section = "solo",
  heists,
  game,
  effectivePlayer,
  styles,
  SectionCard,
  StatLine,
  Tag,
  formatMoney,
  formatCooldown,
  districtSummaries,
  criticalCareStatus,
  contractBoard,
  getContractPreviewForContract,
  getContractPreviewLinesForContract,
  getSoloHeistOdds,
  onExecuteHeist,
  onExecuteContract,
  onBlockedByCriticalCare,
  onOpenHospital,
  sceneBackgrounds,
}) {
  const SafeTag = Tag || (({ text }) => <Text style={styles.listCardMeta}>{text}</Text>);
  const safeHeists = Array.isArray(heists) ? heists : [];
  const safeDistrictSummaries = Array.isArray(districtSummaries) ? districtSummaries : [];
  const safeContractBoard = contractBoard && typeof contractBoard === "object" ? contractBoard : { active: [], history: [] };
  const safeContracts = Array.isArray(safeContractBoard.active) ? safeContractBoard.active : [];
  const criticalCareActive = Boolean(criticalCareStatus?.active);
  const criticalCareLockLabel = criticalCareActive
    ? `Szpital ${formatCooldown ? formatCooldown(criticalCareStatus?.remainingMs || 0) : `${Math.max(1, Math.ceil(Number(criticalCareStatus?.remainingMs || 0) / 60000))} min`}`
    : "";
  const triggerCriticalCareBlock = (actionLabel) => {
    if (!criticalCareActive || typeof onBlockedByCriticalCare !== "function") return;
    onBlockedByCriticalCare(actionLabel);
  };
  const grouped = useMemo(() => groupHeistsByTier(safeHeists), [safeHeists]);
  const unlockedTierIds = HEIST_TIERS.filter((tier) => game.player.respect >= tier.unlockRespect).map((tier) => tier.id);
  const [selectedTier, setSelectedTier] = useState(unlockedTierIds[unlockedTierIds.length - 1] || HEIST_TIERS[0].id);
  const [expandedContractId, setExpandedContractId] = useState(null);

  useEffect(() => {
    if (!HEIST_TIERS.some((tier) => tier.id === selectedTier && game.player.respect >= tier.unlockRespect)) {
      setSelectedTier(unlockedTierIds[unlockedTierIds.length - 1] || HEIST_TIERS[0].id);
    }
  }, [game.player.respect, selectedTier, unlockedTierIds]);

  useEffect(() => {
    if (criticalCareActive && typeof onOpenHospital === "function") {
      onOpenHospital();
    }
  }, [criticalCareActive, onOpenHospital]);

  useEffect(() => {
    if (expandedContractId && !safeContracts.some((contract) => contract.id === expandedContractId)) {
      setExpandedContractId(null);
    }
  }, [expandedContractId, safeContracts]);

  const nextTier = getNextHeistTier(game.player.respect);
  const activeHeists = grouped[selectedTier] || [];
  const selectedTierDefinition = useMemo(
    () => HEIST_TIERS.find((tier) => tier.id === selectedTier) || HEIST_TIERS[0],
    [selectedTier]
  );
  const districtSummaryById = useMemo(
    () => Object.fromEntries(safeDistrictSummaries.map((district) => [district.id, district])),
    [safeDistrictSummaries]
  );

  const tierTabs = HEIST_TIERS.map((tier) => ({
    id: tier.id,
    label: tier.shortLabel,
    count: (grouped[tier.id] || []).length,
    locked: game.player.respect < tier.unlockRespect,
    lockedLabel: game.player.respect < tier.unlockRespect ? `Szacunek ${tier.unlockRespect}` : null,
  }));

  if (section === "contracts") {
    const contractRefreshLabel = safeContractBoard?.nextRefreshAt
      ? new Date(safeContractBoard.nextRefreshAt).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
      : "Brak danych";

    return (
      <>
        <View style={contractStyles.topBlock}>
          <Text style={contractStyles.sectionTitle}>Kontrakty</Text>
          <View style={contractStyles.topStatsRow}>
            <View style={contractStyles.topStat}>
              <Text style={contractStyles.topStatLabel}>Kontrakty</Text>
              <Text style={contractStyles.topStatValue}>{safeContracts.length}</Text>
            </View>
            <View style={contractStyles.topDivider} />
            <View style={contractStyles.topStat}>
              <Text style={contractStyles.topStatLabel}>Rotacja</Text>
              <Text style={contractStyles.topStatValue}>{contractRefreshLabel}</Text>
            </View>
            <View style={contractStyles.topDivider} />
            <View style={contractStyles.topStat}>
              <Text style={contractStyles.topStatLabel}>RES</Text>
              <Text style={contractStyles.topStatValue}>{game.player.respect}</Text>
            </View>
          </View>

          {criticalCareActive ? (
            <View style={[contractStyles.statusStrip, contractStyles.statusStripDanger]}>
              <View style={contractStyles.statusContent}>
                <Text style={contractStyles.statusTitle}>Kontrakty wstrzymane</Text>
                <Text style={contractStyles.statusText}>
                  To nie zwykly cooldown. Wroc do {criticalCareStatus?.mode?.label?.toLowerCase() || "intensywnej terapii"} i dopiero wtedy odpalaj robote.
                </Text>
              </View>
              {typeof onOpenHospital === "function" ? (
                <Pressable onPress={onOpenHospital} style={contractStyles.statusButton}>
                  <Text style={contractStyles.statusButtonText}>Szpital</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <Text style={contractStyles.helperText}>Kliknij karte po szczegoly. Na froncie masz tylko payout, szanse i wejscie.</Text>
          )}
        </View>

        <View style={contractStyles.listWrap}>
          {!safeContracts.length ? <Text style={styles.emptyText}>Tablica jest pusta. Odswiez za chwile.</Text> : null}
          {safeContracts.map((contract) => {
            const preview = getContractPreviewForContract(contract);
            const previewLines = getContractPreviewLinesForContract(contract);
            const locked = game.player.respect < contract.respect;
            const expanded = expandedContractId === contract.id;
            const actionLabel = criticalCareActive ? criticalCareLockLabel : locked ? `RES ${contract.respect}` : "Odpal";
            const actionPress = criticalCareActive
              ? () => triggerCriticalCareBlock("Kontrakty")
              : locked
                ? undefined
                : () => onExecuteContract(contract);

            return (
              <View key={contract.id} style={[contractStyles.card, (locked || criticalCareActive) && contractStyles.cardDisabled]}>
                <Pressable
                  onPress={() => setExpandedContractId(expanded ? null : contract.id)}
                  style={contractStyles.cardSummary}
                >
                  <View style={contractStyles.cardHeader}>
                    <View style={contractStyles.cardTitleWrap}>
                      <Text style={contractStyles.cardTitle}>{contract.name}</Text>
                      <Text style={contractStyles.cardPayout}>
                        {formatMoney(contract.baseReward[0])} - {formatMoney(contract.baseReward[1])}
                      </Text>
                    </View>
                    <View style={contractStyles.cardChanceWrap}>
                      <Text style={contractStyles.cardChanceLabel}>Szansa</Text>
                      <Text style={contractStyles.cardChanceValue}>{Math.round(Number(preview?.successChance || 0) * 100)}%</Text>
                    </View>
                  </View>

                  <View style={contractStyles.badgeRow}>
                    <View style={contractStyles.badge}>
                      <Text style={contractStyles.badgeLabel}>Energia</Text>
                      <Text style={contractStyles.badgeValue}>{contract.energyCost}</Text>
                    </View>
                    <View style={contractStyles.badge}>
                      <Text style={contractStyles.badgeLabel}>RES</Text>
                      <Text style={contractStyles.badgeValue}>{contract.respect}</Text>
                    </View>
                    <View style={contractStyles.badge}>
                      <Text style={contractStyles.badgeLabel}>Wejscie</Text>
                      <Text style={contractStyles.badgeValue}>{formatMoney(contract.entryCost)}</Text>
                    </View>
                  </View>
                </Pressable>

                {expanded ? (
                  <View style={contractStyles.expandedBlock}>
                    <Text style={contractStyles.expandedSummary}>{contract.summary}</Text>
                    <View style={contractStyles.expandedMetaRow}>
                      <SafeTag text={districtSummaryById[contract.districtId]?.name || contract.districtId} />
                      <SafeTag text={`Trudnosc ${contract.difficulty}/5`} />
                      <SafeTag text={contract.riskLabel} warning />
                      <SafeTag text={getContractTagText(contract.tags)} />
                    </View>
                    <Text style={contractStyles.expandedLine}>
                      Staty: ATK {contract.recommendedStats.attack} | DEF {contract.recommendedStats.defense} | DEX {contract.recommendedStats.dexterity} | CHA {contract.recommendedStats.charisma}
                    </Text>
                    {previewLines.map((line) => (
                      <Text key={`${contract.id}-${line}`} style={contractStyles.expandedLine}>
                        {line}
                      </Text>
                    ))}
                  </View>
                ) : null}

                <View style={contractStyles.cardActionRow}>
                  <Text style={contractStyles.cardHint}>{expanded ? "Stuknij jeszcze raz, zeby zwinac" : "Stuknij w karte po szczegoly"}</Text>
                  <Pressable
                    onPress={actionPress}
                    style={[contractStyles.actionButton, !actionPress && contractStyles.actionButtonDisabled]}
                    disabled={!actionPress}
                  >
                    <Text style={[contractStyles.actionButtonText, !actionPress && contractStyles.actionButtonTextDisabled]}>{actionLabel}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      </>
    );
  }

  return (
    <>
      <View style={soloStyles.topBlock}>
        <View style={soloStyles.topStatsRow}>
          <View style={soloStyles.topStat}>
            <Text style={soloStyles.topStatLabel}>{criticalCareActive ? "Status" : "Prog"}</Text>
            <Text style={soloStyles.topStatValue}>{criticalCareActive ? "Skoki wstrzymane" : selectedTierDefinition.shortLabel}</Text>
          </View>
          <View style={soloStyles.topDivider} />
          <View style={soloStyles.topStat}>
            <Text style={soloStyles.topStatLabel}>Karty</Text>
            <Text style={soloStyles.topStatValue}>{activeHeists.length}</Text>
          </View>
          <View style={soloStyles.topDivider} />
          <View style={soloStyles.topStat}>
            <Text style={soloStyles.topStatLabel}>RES</Text>
            <Text style={soloStyles.topStatValue}>{game.player.respect}</Text>
          </View>
        </View>

        {criticalCareActive ? (
          <View style={[soloStyles.statusStrip, soloStyles.statusStripDanger]}>
            <View style={soloStyles.statusContent}>
              <Text style={soloStyles.statusTitle}>To nie cooldown</Text>
              <Text style={soloStyles.statusText}>
                Skoki wracaja po wyjsciu z {criticalCareStatus?.mode?.label?.toLowerCase() || "intensywnej terapii"}.
              </Text>
            </View>
            {typeof onOpenHospital === "function" ? (
              <Pressable onPress={onOpenHospital} style={soloStyles.statusButton}>
                <Text style={soloStyles.statusButtonText}>Szpital</Text>
              </Pressable>
            ) : null}
          </View>
        ) : nextTier ? (
          <Text style={soloStyles.nextTierNote}>Nastepny prog: {nextTier.shortLabel} od {nextTier.unlockRespect} RES</Text>
        ) : null}
      </View>

      <SectionCard title="Progi" subtitle={null}>
        <HeistTabs tabs={tierTabs} selected={selectedTier} onSelect={setSelectedTier} />
      </SectionCard>

      <View style={soloStyles.listWrap}>
        {!activeHeists.length ? <Text style={styles.emptyText}>W tym tierze jeszcze nic nie ma.</Text> : null}
        {activeHeists.map((heist) => {
          const locked = game.player.respect < heist.respect;
          const odds = getSoloHeistOdds(game.player, effectivePlayer, game.gang, heist, game.activeBoosts);
          const rewardRange = Array.isArray(heist.reward) ? heist.reward : [0, 0];
          const xpRange = Array.isArray(heist.xpGain) ? heist.xpGain : [0, 0];

          return (
            <HeistCard
              key={heist.id}
              title={heist.name}
              reward={`${formatMoney(rewardRange[0])} - ${formatMoney(rewardRange[1])}`}
              xp={`${xpRange[0]} - ${xpRange[1]} XP`}
              chance={`${Math.round(odds.chance * 100)}%`}
              energy={`${heist.energy}`}
              risk={`${Math.round(heist.risk * 100)}%`}
              lockedLabel={criticalCareActive ? criticalCareLockLabel : locked ? `RES ${heist.respect}` : "Wykonaj"}
              onPress={() => !locked && !criticalCareActive && onExecuteHeist(heist)}
              disabled={locked || criticalCareActive}
              onDisabledPress={criticalCareActive ? () => triggerCriticalCareBlock("Skoki") : undefined}
            />
          );
        })}
      </View>
    </>
  );
}

const soloStyles = StyleSheet.create({
  topBlock: {
    gap: 8,
    marginBottom: 10,
  },
  topStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "rgba(18, 20, 25, 0.94)",
    borderWidth: 1,
    borderColor: "rgba(201, 149, 61, 0.18)",
  },
  topStat: {
    flex: 1,
    minWidth: 0,
  },
  topDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  topStatLabel: {
    color: "#9f9588",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  topStatValue: {
    color: "#fff6ea",
    fontSize: 15,
    fontWeight: "900",
  },
  nextTierNote: {
    color: "#bca988",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 4,
  },
  statusStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  statusStripDanger: {
    backgroundColor: "rgba(68, 15, 23, 0.94)",
    borderColor: "rgba(217, 93, 113, 0.26)",
  },
  statusContent: {
    flex: 1,
    minWidth: 0,
  },
  statusTitle: {
    color: "#fff1e3",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 2,
  },
  statusText: {
    color: "#f2d4d8",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#e0ae45",
    borderWidth: 1,
    borderColor: "#f5d27c",
  },
  statusButtonText: {
    color: "#1f1507",
    fontSize: 12,
    fontWeight: "900",
  },
  listWrap: {
    marginTop: 2,
  },
});

const contractStyles = StyleSheet.create({
  topBlock: {
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#fff6ea",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  topStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "rgba(18, 20, 25, 0.94)",
    borderWidth: 1,
    borderColor: "rgba(201, 149, 61, 0.18)",
  },
  topStat: {
    flex: 1,
    minWidth: 0,
  },
  topDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  topStatLabel: {
    color: "#9f9588",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  topStatValue: {
    color: "#fff6ea",
    fontSize: 15,
    fontWeight: "900",
  },
  helperText: {
    color: "#bca988",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 4,
  },
  statusStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  statusStripDanger: {
    backgroundColor: "rgba(68, 15, 23, 0.94)",
    borderColor: "rgba(217, 93, 113, 0.26)",
  },
  statusContent: {
    flex: 1,
    minWidth: 0,
  },
  statusTitle: {
    color: "#fff1e3",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 2,
  },
  statusText: {
    color: "#f2d4d8",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#e0ae45",
    borderWidth: 1,
    borderColor: "#f5d27c",
  },
  statusButtonText: {
    color: "#1f1507",
    fontSize: 12,
    fontWeight: "900",
  },
  listWrap: {
    marginTop: 2,
    gap: 10,
  },
  card: {
    borderRadius: 20,
    padding: 12,
    backgroundColor: "rgba(18, 20, 25, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(201, 149, 61, 0.18)",
    gap: 10,
  },
  cardDisabled: {
    opacity: 0.72,
  },
  cardSummary: {
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    color: "#fff6ea",
    fontSize: 16,
    fontWeight: "900",
  },
  cardPayout: {
    color: "#f0c24d",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 4,
  },
  cardChanceWrap: {
    minWidth: 70,
    alignItems: "flex-end",
  },
  cardChanceLabel: {
    color: "#9f9588",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  cardChanceValue: {
    color: "#fff6ea",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    minWidth: 78,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "rgba(11, 12, 15, 0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  badgeLabel: {
    color: "#918777",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  badgeValue: {
    color: "#fff6ea",
    fontSize: 12,
    fontWeight: "900",
  },
  expandedBlock: {
    gap: 8,
    paddingTop: 2,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  expandedSummary: {
    color: "#d8d1c6",
    fontSize: 12,
    lineHeight: 17,
  },
  expandedMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  expandedLine: {
    color: "#aea596",
    fontSize: 11,
    lineHeight: 15,
  },
  cardActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardHint: {
    flex: 1,
    color: "#8f8576",
    fontSize: 11,
    fontWeight: "700",
  },
  actionButton: {
    minWidth: 110,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#e0ae45",
    borderWidth: 1,
    borderColor: "#f5d27c",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonDisabled: {
    backgroundColor: "rgba(62, 50, 26, 0.9)",
    borderColor: "rgba(168, 133, 62, 0.22)",
  },
  actionButtonText: {
    color: "#1f1507",
    fontSize: 13,
    fontWeight: "900",
  },
  actionButtonTextDisabled: {
    color: "#bda97b",
  },
});
