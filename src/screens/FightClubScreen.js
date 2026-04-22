import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ARENA_BOOSTS,
  ARENA_MODES,
  ARENA_STYLES,
  getArenaBoostEffectLines,
  getArenaRewardWindowState,
  normalizeArenaState,
} from "../../shared/arena.js";

function formatFallbackCooldown(ms) {
  const safeMs = Math.max(0, Number(ms || 0));
  const totalSeconds = Math.max(1, Math.ceil(safeMs / 1000));
  if (totalSeconds < 120) return `${totalSeconds}s`;
  return `${Math.max(1, Math.ceil(totalSeconds / 60))} min`;
}

function MetricPill({ icon, label, value, warning = false }) {
  return (
    <View style={[styles.metricPill, warning && styles.metricPillWarning]}>
      <MaterialCommunityIcons
        name={icon}
        size={14}
        color={warning ? "#ffd2d2" : "#f0c24d"}
      />
      <Text style={[styles.metricLabel, warning && styles.metricLabelWarning]}>{label}</Text>
      <Text style={[styles.metricValue, warning && styles.metricValueWarning]}>{value}</Text>
    </View>
  );
}

function ProgressDots({ total, results }) {
  const safeTotal = Math.max(1, Number(total || 1));
  const safeResults = Array.isArray(results) ? results : [];
  return (
    <View style={styles.dotRow}>
      {Array.from({ length: safeTotal }).map((_, index) => {
        const result = safeResults[index];
        return (
          <View
            key={`arena-dot-${index}`}
            style={[
              styles.dot,
              result?.success && styles.dotWin,
              result && !result.success && styles.dotLose,
            ]}
          />
        );
      })}
    </View>
  );
}

export function FightClubScreen({
  arena,
  activeBoosts,
  player,
  SectionCard,
  formatMoney,
  formatCooldown,
  criticalCareStatus,
  onOpenHospital,
  onStartRun,
  onFightNext,
  onBuyBoost,
}) {
  const SafeSectionCard =
    SectionCard ||
    (({ title, subtitle, children }) => (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>
        {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
        {children}
      </View>
    ));

  const [view, setView] = useState("run");
  const [selectedModeId, setSelectedModeId] = useState(ARENA_MODES[1].id);
  const [selectedStyleId, setSelectedStyleId] = useState(ARENA_STYLES[0].id);
  const [pendingAction, setPendingAction] = useState(null);
  const [now, setNow] = useState(Date.now());
  const pulse = useRef(new Animated.Value(1)).current;
  const lastAnimatedResultId = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const safeArena = useMemo(() => normalizeArenaState(arena), [arena]);
  const rewardWindow = useMemo(() => getArenaRewardWindowState(safeArena, now), [safeArena, now]);
  const activeRun = safeArena.activeRun;
  const criticalCareActive = Boolean(criticalCareStatus?.active);
  const cooldownLabel = formatCooldown || formatFallbackCooldown;
  const activeArenaBoosts = useMemo(
    () =>
      (Array.isArray(activeBoosts) ? activeBoosts : []).filter((entry) =>
        ARENA_BOOSTS.some(
          (boost) =>
            boost.id === String(entry?.effect?.boostId || "").trim() &&
            Number(entry?.expiresAt || 0) > now
        )
      ),
    [activeBoosts, now]
  );
  const activeBoostFamilies = useMemo(
    () => new Set(activeArenaBoosts.map((entry) => String(entry?.effect?.family || "").trim()).filter(Boolean)),
    [activeArenaBoosts]
  );
  const latestFightResult =
    Array.isArray(activeRun?.results) && activeRun.results.length
      ? activeRun.results[activeRun.results.length - 1]
      : null;

  useEffect(() => {
    if (!activeRun?.modeId) return;
    setSelectedModeId(activeRun.modeId);
    setSelectedStyleId(activeRun.styleId);
  }, [activeRun?.modeId, activeRun?.styleId]);

  useEffect(() => {
    const nextResultId = latestFightResult?.id || safeArena.lastRunReport?.id || null;
    if (!nextResultId || nextResultId === lastAnimatedResultId.current) return;
    lastAnimatedResultId.current = nextResultId;
    pulse.setValue(0.96);
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1.03, duration: 140, useNativeDriver: true }),
      Animated.spring(pulse, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
    ]).start();
  }, [latestFightResult?.id, pulse, safeArena.lastRunReport?.id]);

  const selectedMode = ARENA_MODES.find((entry) => entry.id === selectedModeId) || ARENA_MODES[1];
  const selectedStyle = ARENA_STYLES.find((entry) => entry.id === selectedStyleId) || ARENA_STYLES[0];

  const runAction = async (actionId, handler) => {
    if (pendingAction || typeof handler !== "function") return;
    setPendingAction(actionId);
    try {
      await handler();
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.heroStrip}>
        <View style={styles.heroHead}>
          <Text style={styles.eyebrow}>Arena</Text>
          <Text style={styles.heroTitle}>Fightclub</Text>
        </View>
        <View style={styles.heroStats}>
          <MetricPill icon="ticket-confirmation-outline" label="Tokeny" value={`${safeArena.tokens}/20`} />
          <MetricPill
            icon="star-four-points-outline"
            label="Pelne runy"
            value={`${rewardWindow.fullRewardsLeft}/3`}
            warning={rewardWindow.rewardReduced}
          />
          <MetricPill icon="lightning-bolt-outline" label="Buffy" value={activeArenaBoosts.length} />
        </View>
      </View>

      <View style={styles.subTabsRow}>
        {[
          { id: "run", label: activeRun ? "Run" : "Ring" },
          { id: "boosts", label: "Boosty" },
        ].map((entry) => (
          <Pressable
            key={entry.id}
            onPress={() => setView(entry.id)}
            style={[styles.subTab, view === entry.id && styles.subTabActive]}
          >
            <Text style={[styles.subTabText, view === entry.id && styles.subTabTextActive]}>{entry.label}</Text>
          </Pressable>
        ))}
      </View>

      {view === "run" ? (
        <>
          {criticalCareActive ? (
            <SafeSectionCard title="Arena wstrzymana" subtitle="To nie cooldown. Najpierw szpital.">
              <View style={styles.alertCard}>
                <View style={styles.flexOne}>
                  <Text style={styles.alertTitle}>Stan krytyczny</Text>
                  <Text style={styles.alertText}>
                    Ring wraca po wyjsciu z {criticalCareStatus?.mode?.label?.toLowerCase() || "intensywnej terapii"}.
                    Zostalo {cooldownLabel(criticalCareStatus?.remainingMs || 0)}.
                  </Text>
                </View>
                {typeof onOpenHospital === "function" ? (
                  <Pressable onPress={onOpenHospital} style={styles.alertButton}>
                    <Text style={styles.alertButtonText}>Szpital</Text>
                  </Pressable>
                ) : null}
              </View>
            </SafeSectionCard>
          ) : activeRun ? (
            <SafeSectionCard title="Aktywny run" subtitle={`${activeRun.step}/${activeRun.totalFights} walk`}>
              <Animated.View style={{ transform: [{ scale: pulse }] }}>
                <View style={styles.runCard}>
                  <View style={styles.runHeader}>
                    <View>
                      <Text style={styles.runTitle}>
                        {(ARENA_MODES.find((entry) => entry.id === activeRun.modeId) || selectedMode).label}
                      </Text>
                      <Text style={styles.runMeta}>
                        {(ARENA_STYLES.find((entry) => entry.id === activeRun.styleId) || selectedStyle).label}
                        {activeRun.rewardReduced ? "  •  reward przyciszony" : ""}
                      </Text>
                    </View>
                    <ProgressDots total={activeRun.totalFights} results={activeRun.results} />
                  </View>

                  <View style={styles.fightPanel}>
                    <View style={styles.fightHead}>
                      <View style={styles.flexOne}>
                        <Text style={styles.fightName}>{activeRun.currentFight?.opponentName}</Text>
                        <Text style={styles.fightMeta}>
                          LVL {activeRun.currentFight?.opponentLevel} • {activeRun.currentFight?.opponentStyleLabel}
                        </Text>
                      </View>
                      <Text style={styles.fightChance}>
                        {Math.round(Number(activeRun.currentFight?.winChance || 0) * 100)}%
                      </Text>
                    </View>

                    <View style={styles.fightStatRow}>
                      <MetricPill
                        icon="cash-multiple"
                        label="Payout"
                        value={`${formatMoney(activeRun.currentFight?.cashMin || 0)} - ${formatMoney(activeRun.currentFight?.cashMax || 0)}`}
                      />
                      <MetricPill
                        icon="lightning-bolt"
                        label="Energia"
                        value={activeRun.currentFight?.energyCost || 0}
                      />
                    </View>

                    <Text style={styles.fightNote}>{activeRun.currentFight?.opponentNote}</Text>

                    {latestFightResult ? (
                      <View style={[styles.lastResult, latestFightResult.success ? styles.lastResultWin : styles.lastResultLose]}>
                        <Text style={styles.lastResultTitle}>
                          {latestFightResult.success ? "Runda siadla" : "Ring nie pykna"}
                        </Text>
                        <Text style={styles.lastResultText}>
                          {latestFightResult.success
                            ? `Wpada ${formatMoney(latestFightResult.cash)} i +${latestFightResult.xp} XP.`
                            : `Strata ${latestFightResult.damage} HP i +${latestFightResult.heat} heat.`}
                        </Text>
                      </View>
                    ) : null}

                    <Pressable
                      onPress={() => runAction("fight", onFightNext)}
                      style={[styles.primaryButton, pendingAction && styles.primaryButtonDisabled]}
                      disabled={Boolean(pendingAction)}
                    >
                      <Text style={styles.primaryButtonText}>
                        {pendingAction === "fight" ? "Rozliczam..." : "Walcz"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </Animated.View>
            </SafeSectionCard>
          ) : (
            <>
              <SafeSectionCard title="Tryb runa" subtitle={`Pelna pula resetuje sie za ${cooldownLabel(rewardWindow.remainingMs)}`}>
                <View style={styles.selectorRow}>
                  {ARENA_MODES.map((mode) => (
                    <Pressable
                      key={mode.id}
                      onPress={() => setSelectedModeId(mode.id)}
                      style={[styles.selectorChip, selectedModeId === mode.id && styles.selectorChipActive]}
                    >
                      <Text style={[styles.selectorChipText, selectedModeId === mode.id && styles.selectorChipTextActive]}>
                        {mode.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.selectorRow}>
                  {ARENA_STYLES.map((style) => (
                    <Pressable
                      key={style.id}
                      onPress={() => setSelectedStyleId(style.id)}
                      style={[styles.selectorChip, selectedStyleId === style.id && styles.selectorChipActive]}
                    >
                      <Text style={[styles.selectorChipText, selectedStyleId === style.id && styles.selectorChipTextActive]}>
                        {style.shortLabel}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.modeSummary}>
                  <Text style={styles.modeTitle}>{selectedMode.label}</Text>
                  <Text style={styles.modeSubtitle}>{selectedMode.summary}</Text>
                  <View style={styles.modeMetrics}>
                    <MetricPill icon="boxing-glove" label="Walki" value={selectedMode.fights} />
                    <MetricPill icon="lightning-bolt" label="Koszt" value={`${selectedMode.energyPerFight}/fight`} />
                    <MetricPill
                      icon="ticket-confirmation-outline"
                      label="Tokeny"
                      value={`${selectedMode.tokenRange[0]}-${selectedMode.tokenRange[1]}`}
                    />
                  </View>
                  <Text style={styles.modeHint}>{selectedStyle.note}</Text>
                </View>

                <Pressable
                  onPress={() => runAction("start", () => onStartRun?.(selectedMode.id, selectedStyle.id))}
                  style={[styles.primaryButton, pendingAction && styles.primaryButtonDisabled]}
                  disabled={Boolean(pendingAction)}
                >
                  <Text style={styles.primaryButtonText}>
                    {pendingAction === "start" ? "Wchodze..." : "Wejdz na ring"}
                  </Text>
                </Pressable>
              </SafeSectionCard>

              {safeArena.lastRunReport ? (
                <SafeSectionCard title="Ostatni raport" subtitle={safeArena.lastRunReport.rewardReduced ? "Przyciszona pula" : "Pelne rewardy"}>
                  <View style={styles.reportRow}>
                    <MetricPill icon="trophy-outline" label="Wygrane" value={safeArena.lastRunReport.wins} />
                    <MetricPill icon="cash-multiple" label="Kasa" value={formatMoney(safeArena.lastRunReport.totalCash || 0)} />
                    <MetricPill icon="ticket-confirmation-outline" label="Tokeny" value={safeArena.lastRunReport.tokenReward || 0} />
                  </View>
                  <Text style={styles.reportHint}>
                    {safeArena.lastRunReport.endedByLoss
                      ? "Run skonczyl sie po wtopie. Podbij ring jeszcze raz albo od razu przepal boosta."
                      : "Run domkniety. Mozesz wejsc jeszcze raz albo przekuc tokeny w boost."}
                  </Text>
                </SafeSectionCard>
              ) : null}
            </>
          )}
        </>
      ) : (
        <>
          {activeArenaBoosts.length ? (
            <SafeSectionCard title="Aktywne boosty" subtitle="To wrzucasz potem pod skoki albo kontrakty.">
              <View style={styles.activeBoostColumn}>
                {activeArenaBoosts.map((entry) => (
                  <View key={entry.id} style={styles.activeBoostCard}>
                    <View style={styles.activeBoostTop}>
                      <Text style={styles.activeBoostName}>{entry.name}</Text>
                      <Text style={styles.activeBoostMeta}>
                        {Number(entry?.effect?.chargesRemaining || 0) > 0
                          ? `${entry.effect.chargesRemaining} akcje`
                          : cooldownLabel(Math.max(0, Number(entry.expiresAt || 0) - now))}
                      </Text>
                    </View>
                    <Text style={styles.activeBoostText}>
                      {getArenaBoostEffectLines(entry).join(" • ")}
                    </Text>
                  </View>
                ))}
              </View>
            </SafeSectionCard>
          ) : null}

          <SafeSectionCard title="Boosty Areny" subtitle={`Masz ${safeArena.tokens} token${safeArena.tokens === 1 ? "" : safeArena.tokens >= 2 && safeArena.tokens <= 4 ? "y" : "ow"}.`}>
            <View style={styles.boostList}>
              {ARENA_BOOSTS.map((boost) => {
                const duplicate = activeBoostFamilies.has(boost.family);
                const canAfford = Number(safeArena.tokens || 0) >= Number(boost.price || 0);
                const disabled = duplicate || !canAfford || Boolean(pendingAction);
                return (
                  <View key={boost.id} style={styles.boostCard}>
                    <View style={styles.boostHead}>
                      <View style={styles.flexOne}>
                        <Text style={styles.boostTitle}>{boost.name}</Text>
                        <Text style={styles.boostSummary}>{boost.summary}</Text>
                      </View>
                      <View style={styles.boostPrice}>
                        <MaterialCommunityIcons name="ticket-confirmation-outline" size={15} color="#f4cf77" />
                        <Text style={styles.boostPriceText}>{boost.price}</Text>
                      </View>
                    </View>
                    <Text style={styles.boostLines}>{getArenaBoostEffectLines(boost).join(" • ")}</Text>
                    <Pressable
                      onPress={() => runAction(`boost-${boost.id}`, () => onBuyBoost?.(boost.id))}
                      style={[styles.secondaryButton, disabled && styles.secondaryButtonDisabled]}
                      disabled={disabled}
                    >
                      <Text style={[styles.secondaryButtonText, disabled && styles.secondaryButtonTextDisabled]}>
                        {duplicate
                          ? "Juz aktywny"
                          : !canAfford
                            ? "Brak tokenow"
                            : pendingAction === `boost-${boost.id}`
                              ? "Kupuje..."
                              : "Kup za tokeny"}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </SafeSectionCard>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  flexOne: {
    flex: 1,
    minWidth: 0,
  },
  heroStrip: {
    gap: 10,
  },
  heroHead: {
    gap: 2,
  },
  eyebrow: {
    color: "#9c8f78",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#fff4e1",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  heroStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  subTabsRow: {
    flexDirection: "row",
    gap: 8,
  },
  subTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15, 16, 20, 0.9)",
    alignItems: "center",
  },
  subTabActive: {
    backgroundColor: "rgba(59, 43, 22, 0.96)",
    borderColor: "rgba(240, 194, 77, 0.36)",
  },
  subTabText: {
    color: "#a69982",
    fontSize: 12,
    fontWeight: "800",
  },
  subTabTextActive: {
    color: "#fff1cf",
  },
  card: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(17, 18, 23, 0.96)",
  },
  cardTitle: {
    color: "#fff4df",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 2,
  },
  cardSubtitle: {
    color: "#9f947f",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  metricPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(20, 21, 26, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(240, 194, 77, 0.18)",
  },
  metricPillWarning: {
    backgroundColor: "rgba(70, 24, 28, 0.92)",
    borderColor: "rgba(205, 88, 98, 0.24)",
  },
  metricLabel: {
    color: "#9d9078",
    fontSize: 11,
    fontWeight: "800",
  },
  metricLabelWarning: {
    color: "#d4afb2",
  },
  metricValue: {
    color: "#fff5e0",
    fontSize: 11,
    fontWeight: "900",
  },
  metricValueWarning: {
    color: "#fff1f1",
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(74, 15, 21, 0.94)",
    borderWidth: 1,
    borderColor: "rgba(214, 93, 111, 0.28)",
  },
  alertTitle: {
    color: "#fff1e3",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 3,
  },
  alertText: {
    color: "#efd2d7",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
  },
  alertButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#e0ae45",
  },
  alertButtonText: {
    color: "#241809",
    fontSize: 12,
    fontWeight: "900",
  },
  selectorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  selectorChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(12, 13, 16, 0.9)",
  },
  selectorChipActive: {
    backgroundColor: "rgba(66, 48, 24, 0.96)",
    borderColor: "rgba(240, 194, 77, 0.32)",
  },
  selectorChipText: {
    color: "#9f937e",
    fontSize: 12,
    fontWeight: "800",
  },
  selectorChipTextActive: {
    color: "#fff3d9",
  },
  modeSummary: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(240, 194, 77, 0.14)",
    backgroundColor: "rgba(15, 16, 19, 0.9)",
    marginBottom: 12,
  },
  modeTitle: {
    color: "#fff3e0",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4,
  },
  modeSubtitle: {
    color: "#b5a58a",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  modeMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  modeHint: {
    color: "#d9c08a",
    fontSize: 11,
    fontWeight: "700",
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e0ae45",
    borderWidth: 1,
    borderColor: "#f4cf77",
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#221709",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  runCard: {
    gap: 12,
  },
  runHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  runTitle: {
    color: "#fff3df",
    fontSize: 16,
    fontWeight: "900",
  },
  runMeta: {
    color: "#c0ab83",
    fontSize: 11,
    fontWeight: "700",
  },
  dotRow: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  dotWin: {
    backgroundColor: "#46d06f",
  },
  dotLose: {
    backgroundColor: "#d95e69",
  },
  fightPanel: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(12, 13, 17, 0.9)",
    gap: 10,
  },
  fightHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fightName: {
    color: "#fff5e3",
    fontSize: 15,
    fontWeight: "900",
  },
  fightMeta: {
    color: "#a99a80",
    fontSize: 11,
    fontWeight: "700",
  },
  fightChance: {
    color: "#f4cf77",
    fontSize: 20,
    fontWeight: "900",
  },
  fightStatRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  fightNote: {
    color: "#b9a98d",
    fontSize: 11,
    lineHeight: 15,
  },
  lastResult: {
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  lastResultWin: {
    backgroundColor: "rgba(23, 62, 35, 0.92)",
    borderColor: "rgba(76, 212, 114, 0.24)",
  },
  lastResultLose: {
    backgroundColor: "rgba(71, 19, 24, 0.92)",
    borderColor: "rgba(217, 94, 105, 0.24)",
  },
  lastResultTitle: {
    color: "#fff2df",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 3,
  },
  lastResultText: {
    color: "#e5d7c0",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
  },
  reportRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  reportHint: {
    color: "#bba98a",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
  },
  activeBoostColumn: {
    gap: 10,
  },
  activeBoostCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(240, 194, 77, 0.12)",
    backgroundColor: "rgba(15, 16, 20, 0.9)",
  },
  activeBoostTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 4,
  },
  activeBoostName: {
    color: "#fff4df",
    fontSize: 13,
    fontWeight: "900",
    flex: 1,
  },
  activeBoostMeta: {
    color: "#f0c24d",
    fontSize: 11,
    fontWeight: "900",
  },
  activeBoostText: {
    color: "#bcae95",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
  },
  boostList: {
    gap: 10,
  },
  boostCard: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(14, 15, 19, 0.92)",
  },
  boostHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 6,
  },
  boostTitle: {
    color: "#fff4df",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 2,
  },
  boostSummary: {
    color: "#ac9b80",
    fontSize: 11,
    lineHeight: 15,
  },
  boostPrice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(49, 37, 18, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(240, 194, 77, 0.2)",
  },
  boostPriceText: {
    color: "#f5d27c",
    fontSize: 11,
    fontWeight: "900",
  },
  boostLines: {
    color: "#d0be9c",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    marginBottom: 10,
  },
  secondaryButton: {
    minHeight: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 192, 77, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(240, 194, 77, 0.34)",
  },
  secondaryButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.08)",
  },
  secondaryButtonText: {
    color: "#f7d588",
    fontSize: 12,
    fontWeight: "900",
  },
  secondaryButtonTextDisabled: {
    color: "#857861",
  },
});
