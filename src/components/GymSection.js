import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const DISPLAY_SERIES_COUNT = 10;

const PASS_ICON_BY_ID = {
  day: "calendar-today-outline",
  week: "calendar-week-begin",
  perm: "crown-outline",
};

function getActivePassLabel(player, formatDuration) {
  if (!player?.gymPassTier) return "Brak karnetu";
  if (player.gymPassTier === "perm") return "NA STALE";
  return formatDuration((player.gymPassUntil || 0) - Date.now());
}

function getPassMeta(pass) {
  if (pass.id === "perm") {
    return {
      badge: "Na stale",
      badgeTone: "gold",
      description: "Pelny dostep bez limitu czasu.",
    };
  }
  if (pass.id === "week") {
    return {
      badge: "Polecany",
      badgeTone: "success",
      description: "Najwygodniejszy ruch na regularne treningi.",
    };
  }
  return {
    badge: "Wejscie",
    badgeTone: "neutral",
    description: "Szybka przepustka na sale treningowa.",
  };
}

function getExerciseProfile(exercise) {
  if (Number(exercise?.gains?.attack || 0) > 0) {
    return {
      icon: "arm-flex-outline",
      statLabel: "Atak",
      tone: "danger",
      tabLabel: "Sila",
      perSeriesText: `+${exercise.gains.attack} ataku / 1 seria`,
      previewText: (series) => `+${Number(exercise.gains.attack || 0) * series} ataku`,
      burstText: (series) => `+${Number(exercise.gains.attack || 0) * series} ATAK`,
    };
  }

  if (Number(exercise?.gains?.defense || 0) > 0) {
    return {
      icon: "shield-outline",
      statLabel: "Obrona",
      tone: "info",
      tabLabel: "Obrona",
      perSeriesText: `+${exercise.gains.defense} obrony / 1 seria`,
      previewText: (series) => `+${Number(exercise.gains.defense || 0) * series} obrony`,
      burstText: (series) => `+${Number(exercise.gains.defense || 0) * series} OBR`,
    };
  }

  if (Number(exercise?.gains?.dexterity || 0) > 0) {
    return {
      icon: "lightning-bolt-outline",
      statLabel: "Zrecznosc",
      tone: "gold",
      tabLabel: "Refleks",
      perSeriesText: `+${exercise.gains.dexterity} zrecznosci / 1 seria`,
      previewText: (series) => `+${Number(exercise.gains.dexterity || 0) * series} zrecznosci`,
      burstText: (series) => `+${Number(exercise.gains.dexterity || 0) * series} DEX`,
    };
  }

  return {
    icon: "heart-plus-outline",
    statLabel: "Kondycja",
    tone: "success",
    tabLabel: "Kondycja",
    perSeriesText: `+${exercise?.gains?.maxHp || 0} zdrowia max / 1 seria`,
    previewText: (series) => `+${Number(exercise?.gains?.maxHp || 0) * series} zdrowia max`,
    burstText: (series) => `+${Number(exercise?.gains?.maxHp || 0) * series} HP MAX`,
    sublineText: (series) => `i +${Number(exercise?.gains?.hp || 0) * series} HP teraz`,
  };
}

function getTonePalette(tone) {
  switch (tone) {
    case "danger":
      return {
        gradient: ["rgba(42,19,21,0.98)", "rgba(18,12,12,0.98)"],
        border: "rgba(201, 97, 109, 0.24)",
        title: "#fff1f3",
        text: "#e3c4c9",
        accent: "#f08e9b",
        chip: "rgba(240, 142, 155, 0.09)",
        chipBorder: "rgba(240, 142, 155, 0.18)",
      };
    case "info":
      return {
        gradient: ["rgba(16,27,39,0.98)", "rgba(10,14,18,0.98)"],
        border: "rgba(98, 155, 224, 0.24)",
        title: "#eef6ff",
        text: "#bfd4ea",
        accent: "#78ace9",
        chip: "rgba(120, 172, 233, 0.09)",
        chipBorder: "rgba(120, 172, 233, 0.18)",
      };
    case "success":
      return {
        gradient: ["rgba(15,33,24,0.98)", "rgba(10,16,13,0.98)"],
        border: "rgba(101, 195, 139, 0.24)",
        title: "#f2fff6",
        text: "#c3dccb",
        accent: "#7dd69d",
        chip: "rgba(125, 214, 157, 0.09)",
        chipBorder: "rgba(125, 214, 157, 0.18)",
      };
    case "gold":
    default:
      return {
        gradient: ["rgba(34,25,15,0.98)", "rgba(15,12,10,0.98)"],
        border: "rgba(214, 164, 90, 0.24)",
        title: "#fff0db",
        text: "#d9c2a0",
        accent: "#ddb36d",
        chip: "rgba(221, 179, 109, 0.09)",
        chipBorder: "rgba(221, 179, 109, 0.18)",
      };
  }
}

function getSeriesWord(value) {
  if (value <= 0) return "serii";
  if (value === 1) return "seria";
  if (value < 5) return "serie";
  return "serii";
}

function StatusBadge({ text, tone = "neutral" }) {
  const badgeStyles =
    tone === "success"
      ? { backgroundColor: "rgba(101, 195, 139, 0.12)", borderColor: "rgba(101, 195, 139, 0.22)", color: "#a7ecc2" }
      : tone === "danger"
        ? { backgroundColor: "rgba(213, 101, 116, 0.12)", borderColor: "rgba(213, 101, 116, 0.22)", color: "#ffb4bf" }
        : tone === "gold"
          ? { backgroundColor: "rgba(221, 179, 109, 0.14)", borderColor: "rgba(221, 179, 109, 0.22)", color: "#ffe3ab" }
          : { backgroundColor: "rgba(145, 154, 171, 0.12)", borderColor: "rgba(145, 154, 171, 0.18)", color: "#dde4ef" };

  return (
    <View style={[styles.badge, { backgroundColor: badgeStyles.backgroundColor, borderColor: badgeStyles.borderColor }]}>
      <Text style={[styles.badgeText, { color: badgeStyles.color }]}>{text}</Text>
    </View>
  );
}

function PassCard({ pass, active, dimmed, canBuy, formatMoney, onBuy }) {
  const meta = getPassMeta(pass);
  const iconName = PASS_ICON_BY_ID[pass.id] || "dumbbell";

  return (
    <LinearGradient
      colors={
        active
          ? ["rgba(40,29,17,0.98)", "rgba(17,13,9,0.98)"]
          : pass.id === "week"
            ? ["rgba(23,31,22,0.98)", "rgba(12,17,13,0.98)"]
            : ["rgba(24,22,18,0.98)", "rgba(15,13,11,0.98)"]
      }
      style={[
        styles.passCard,
        active && styles.passCardActive,
        dimmed && styles.passCardDimmed,
        pass.id === "week" && !active && styles.passCardFeatured,
      ]}
    >
      <View style={styles.passHeader}>
        <View style={styles.passIconWrap}>
          <MaterialCommunityIcons name={iconName} size={18} color={active ? "#ffd991" : "#ddb36d"} />
        </View>
        <View style={styles.passTitleWrap}>
          <Text style={styles.passTitle}>{pass.name}</Text>
          <Text style={styles.passDescription}>{meta.description}</Text>
        </View>
        <StatusBadge text={active ? "Aktywny" : meta.badge} tone={active ? "gold" : meta.badgeTone} />
      </View>

      <View style={styles.passFooter}>
        <Text style={styles.passPrice}>{formatMoney(pass.price)}</Text>
        <Pressable
          onPress={() => !active && canBuy && onBuy?.(pass)}
          style={[styles.passAction, (active || !canBuy) && styles.passActionDisabled]}
          disabled={active || !canBuy}
        >
          <Text style={styles.passActionText}>{active ? "Masz ten karnet" : "Kup karnet"}</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

function GymExerciseCard({
  exercise,
  selectedSeries,
  affordableSeries,
  hasAccess,
  criticalCareActive,
  onSetSeries,
  onTrain,
  onLockedPress,
}) {
  const profile = useMemo(() => getExerciseProfile(exercise), [exercise]);
  const palette = useMemo(() => getTonePalette(profile.tone), [profile.tone]);
  const [busy, setBusy] = useState(false);
  const [burstPrimary, setBurstPrimary] = useState("");
  const [burstSecondary, setBurstSecondary] = useState("");
  const glow = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const burstOpacity = useRef(new Animated.Value(0)).current;
  const burstLift = useRef(new Animated.Value(8)).current;
  const energyLift = useRef(new Animated.Value(12)).current;
  const energyOpacity = useRef(new Animated.Value(0)).current;

  const canTrainNow = hasAccess && affordableSeries > 0 && !criticalCareActive;
  const maxNowText = `Max teraz: ${affordableSeries} ${getSeriesWord(Math.max(affordableSeries, 1))}`;
  const totalEnergyCost = Number(selectedSeries || 1) * Number(exercise.costEnergy || 0);
  const previewPrimary = `${selectedSeries} ${getSeriesWord(selectedSeries)} = ${profile.previewText(selectedSeries)}`;
  const previewSecondary = typeof profile.sublineText === "function" ? profile.sublineText(selectedSeries) : null;
  const disabledReason = criticalCareActive
    ? "Na intensywnej terapii nie trenujesz."
    : !hasAccess
      ? "Potrzebujesz karnetu."
      : affordableSeries <= 0
        ? "Najpierw doladuj energie."
        : "";

  useEffect(() => {
    if (!burstPrimary) return undefined;

    glow.setValue(0);
    scale.setValue(1);
    burstOpacity.setValue(0);
    burstLift.setValue(10);
    energyOpacity.setValue(0);
    energyLift.setValue(12);

    const animation = Animated.parallel([
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 360, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(scale, { toValue: 0.985, duration: 90, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 5, tension: 125, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(burstOpacity, { toValue: 1, duration: 110, useNativeDriver: true }),
        Animated.delay(140),
        Animated.timing(burstOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]),
      Animated.timing(burstLift, { toValue: -18, duration: 420, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(energyOpacity, { toValue: 1, duration: 110, useNativeDriver: true }),
        Animated.delay(120),
        Animated.timing(energyOpacity, { toValue: 0, duration: 240, useNativeDriver: true }),
      ]),
      Animated.timing(energyLift, { toValue: -12, duration: 420, useNativeDriver: true }),
    ]);

    animation.start(() => {
      setBurstPrimary("");
      setBurstSecondary("");
    });

    return () => animation.stop();
  }, [burstPrimary, burstSecondary, glow, scale, burstOpacity, burstLift, energyOpacity, energyLift]);

  const runTraining = async (seriesCount) => {
    if (busy) return;
    if (!canTrainNow) {
      onLockedPress?.();
      return;
    }

    setBusy(true);
    try {
      const result = await onTrain?.(exercise, seriesCount);
      if (!result || result === false) {
        setBusy(false);
        return;
      }
      setBurstPrimary(profile.burstText(result.repetitions || seriesCount));
      setBurstSecondary(`-${Number(result.energySpent || 0)} EN`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <LinearGradient colors={palette.gradient} style={[styles.exerciseCard, { borderColor: palette.border }]}>
        <Animated.View style={[styles.exerciseGlow, { opacity: glow, backgroundColor: palette.accent }]} />

        {burstPrimary ? (
          <>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.exerciseBurst,
                {
                  opacity: burstOpacity,
                  transform: [{ translateY: burstLift }],
                },
              ]}
            >
              <Text style={styles.exerciseBurstText}>{burstPrimary}</Text>
            </Animated.View>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.energyBurst,
                {
                  opacity: energyOpacity,
                  transform: [{ translateY: energyLift }],
                },
              ]}
            >
              <Text style={styles.energyBurstText}>{burstSecondary}</Text>
            </Animated.View>
          </>
        ) : null}

        <View style={styles.exerciseHeader}>
          <View style={[styles.exerciseIconWrap, { backgroundColor: palette.chip, borderColor: palette.chipBorder }]}>
            <MaterialCommunityIcons name={profile.icon} size={18} color={palette.accent} />
          </View>
          <View style={styles.exerciseTitleWrap}>
            <Text style={[styles.exerciseTitle, { color: palette.title }]}>{exercise.name}</Text>
            <Text style={[styles.exerciseMeta, { color: palette.text }]}>{profile.statLabel}</Text>
          </View>
          <StatusBadge
            text={
              canTrainNow
                ? maxNowText
                : criticalCareActive
                  ? "Stan krytyczny"
                  : !hasAccess
                    ? "Potrzebujesz karnetu"
                    : "Brak energii"
            }
            tone={canTrainNow ? "gold" : criticalCareActive ? "danger" : "neutral"}
          />
        </View>

        <View style={styles.exerciseStatsRow}>
          <View style={[styles.exerciseStatChip, { backgroundColor: palette.chip, borderColor: palette.chipBorder }]}>
            <Text style={styles.exerciseStatLabel}>1 seria</Text>
            <Text style={styles.exerciseStatValue}>{profile.perSeriesText}</Text>
          </View>
          <View style={[styles.exerciseStatChip, { backgroundColor: palette.chip, borderColor: palette.chipBorder }]}>
            <Text style={styles.exerciseStatLabel}>Koszt</Text>
            <Text style={styles.exerciseStatValue}>{exercise.costEnergy} energii</Text>
          </View>
          <View style={[styles.exerciseStatChip, { backgroundColor: palette.chip, borderColor: palette.chipBorder }]}>
            <Text style={styles.exerciseStatLabel}>Dostep</Text>
            <Text style={styles.exerciseStatValue}>{hasAccess ? "Aktywny" : "Zamkniety"}</Text>
          </View>
        </View>

        <View style={styles.seriesHeader}>
          <Text style={[styles.seriesTitle, { color: palette.title }]}>Wybierz serie</Text>
          <Text style={[styles.seriesHint, { color: palette.text }]}>
            Energia pozwala teraz na max {affordableSeries} {getSeriesWord(Math.max(affordableSeries, 1))}.
          </Text>
        </View>

        <View style={styles.seriesGrid}>
          {Array.from({ length: DISPLAY_SERIES_COUNT }).map((_, index) => {
            const step = index + 1;
            const available = step <= affordableSeries;
            const active = available && step <= selectedSeries && hasAccess && !criticalCareActive;

            return (
              <Pressable
                key={`${exercise.id}-series-${step}`}
                onPress={() => (available && hasAccess && !criticalCareActive ? onSetSeries?.(exercise.id, step) : onLockedPress?.())}
                style={[
                  styles.seriesDot,
                  active && styles.seriesDotActive,
                  !available && styles.seriesDotDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.seriesDotText,
                    active && styles.seriesDotTextActive,
                    !available && styles.seriesDotTextDisabled,
                  ]}
                >
                  {step}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.previewPanel}>
          <View style={styles.previewTextWrap}>
            <Text style={[styles.previewPrimary, { color: palette.title }]}>{previewPrimary}</Text>
            <Text style={[styles.previewSecondary, { color: palette.text }]}>
              {previewSecondary || `Wyjdzie energia: -${totalEnergyCost}.`}
            </Text>
          </View>
          {disabledReason ? <Text style={[styles.previewLock, { color: palette.accent }]}>{disabledReason}</Text> : null}
        </View>

        <View style={styles.exerciseActions}>
          <Pressable
            onPress={() => runTraining(selectedSeries)}
            style={[styles.exerciseActionPrimary, (!canTrainNow || busy) && styles.exerciseActionDisabled]}
          >
            <Text style={styles.exerciseActionPrimaryText}>
              {selectedSeries > 1 ? `Trenuj x${selectedSeries}` : "Trenuj"}
            </Text>
            <Text style={styles.exerciseActionPrimaryMetaText}>{`${profile.previewText(selectedSeries)} | -${totalEnergyCost} EN`}</Text>
          </Pressable>

          <Pressable
            onPress={async () => {
              if (!canTrainNow) {
                onLockedPress?.();
                return;
              }
              onSetSeries?.(exercise.id, Math.max(1, affordableSeries));
              await runTraining(Math.max(1, affordableSeries));
            }}
            style={[styles.exerciseActionSecondary, (!canTrainNow || busy) && styles.exerciseActionDisabled]}
          >
            <Text style={styles.exerciseActionSecondaryText}>Trenuj max</Text>
            <Text style={styles.exerciseActionSecondaryMetaText}>
              {affordableSeries > 0 ? `${profile.previewText(affordableSeries)} | -${affordableSeries * exercise.costEnergy} EN` : "Brak paliwa"}
            </Text>
          </Pressable>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

export function GymSection({
  SectionCard,
  game,
  gymPasses,
  gymExercises,
  gymBatchByExercise,
  setGymSeries,
  formatMoney,
  formatDuration,
  helpers,
  actions,
  criticalCareActive,
}) {
  const hasPass = helpers.hasGymPass(game.player);
  const canBuyAnyPass = Number(game.player.cash || 0) > 0;
  const passPulse = useRef(new Animated.Value(1)).current;
  const [passHighlightNonce, setPassHighlightNonce] = useState(0);
  const [showPassOptions, setShowPassOptions] = useState(false);
  const [activeExerciseId, setActiveExerciseId] = useState(gymExercises[0]?.id || null);

  useEffect(() => {
    if (!passHighlightNonce) return undefined;
    passPulse.setValue(1);
    const animation = Animated.sequence([
      Animated.timing(passPulse, { toValue: 1.015, duration: 110, useNativeDriver: true }),
      Animated.spring(passPulse, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [passHighlightNonce, passPulse]);

  useEffect(() => {
    if (hasPass) {
      setShowPassOptions(false);
      return;
    }
    setShowPassOptions(true);
  }, [hasPass]);

  useEffect(() => {
    if (gymExercises.some((entry) => entry.id === activeExerciseId)) return;
    setActiveExerciseId(gymExercises[0]?.id || null);
  }, [activeExerciseId, gymExercises]);

  const activePassLabel = getActivePassLabel(game.player, formatDuration);
  const activeExercise = gymExercises.find((entry) => entry.id === activeExerciseId) || gymExercises[0] || null;
  const activeExerciseAffordableSeries = activeExercise
    ? Math.max(0, Math.floor(Number(game.player.energy || 0) / Math.max(1, Number(activeExercise.costEnergy || 1))))
    : 0;
  const activeExerciseMaxSeries = Math.max(1, activeExerciseAffordableSeries || 1);
  const activeExerciseSelectedSeries = activeExercise
    ? Math.max(1, Math.min(activeExerciseMaxSeries, Math.floor(Number(gymBatchByExercise?.[activeExercise.id] || 1))))
    : 1;

  const handlePassAttention = () => {
    setPassHighlightNonce(Date.now());
    if (!hasPass) {
      setShowPassOptions(true);
    }
  };

  return (
    <>
      <SectionCard title="Karnet" subtitle={hasPass ? null : "Bez wejscia nie ruszysz treningu."}>
        <Animated.View style={{ transform: [{ scale: passPulse }] }}>
          <LinearGradient
            colors={hasPass ? ["#221a12", "#12100c"] : ["#2a1d12", "#15100b"]}
            style={[styles.passStatusRow, hasPass ? styles.passStatusRowActive : styles.passStatusRowNeedPass]}
          >
            <View style={styles.passStatusHead}>
              <View style={styles.passStatusIconWrap}>
                <MaterialCommunityIcons
                  name={hasPass ? "crown-outline" : "door-closed-lock"}
                  size={18}
                  color={hasPass ? "#f0c57d" : "#f0a2ad"}
                />
              </View>
              <View style={styles.passStatusCopy}>
                <Text style={styles.passStatusTitle}>{hasPass ? "Karnet aktywny" : "Wejscie zamkniete"}</Text>
                <Text style={styles.passStatusMeta}>
                  {hasPass ? activePassLabel : "Kup przepustke i dopiero ruszysz serie."}
                </Text>
              </View>
            </View>

            {hasPass ? (
              <Pressable
                onPress={() => setShowPassOptions((prev) => !prev)}
                style={[styles.passToggleButton, showPassOptions && styles.passToggleButtonActive]}
              >
                <Text style={styles.passToggleButtonText}>{showPassOptions ? "Ukryj opcje" : "Pokaz opcje"}</Text>
              </Pressable>
            ) : null}
          </LinearGradient>
        </Animated.View>

        {!hasPass || showPassOptions ? (
          <View style={styles.passOptionsStack}>
            {gymPasses.map((pass) => (
              <PassCard
                key={pass.id}
                pass={pass}
                active={game.player.gymPassTier === pass.id && hasPass}
                dimmed={hasPass && game.player.gymPassTier !== pass.id}
                canBuy={canBuyAnyPass}
                formatMoney={formatMoney}
                onBuy={actions.buyGymPass}
              />
            ))}
          </View>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Cwiczenia"
        subtitle={hasPass ? "Wybierz front, ustaw serie i odpal trening." : "Podejrzyj plan, ale do wejscia potrzebujesz karnetu."}
      >
        <View style={styles.trainingHeaderCompact}>
          <StatusBadge text={hasPass ? "Dostep aktywny" : "Potrzebujesz karnetu"} tone={hasPass ? "success" : "danger"} />
          <Text style={styles.trainingHeaderCompactText}>
            {criticalCareActive
              ? "Na intensywnej terapii trening odpada."
              : hasPass
                ? "Jedno cwiczenie na widoku, zero zbednego scrolla."
                : "Tapnij trening, a podbijemy karnety wyzej."}
          </Text>
        </View>

        <View style={styles.exerciseTabsRow}>
          {gymExercises.map((exercise) => {
            const profile = getExerciseProfile(exercise);
            const active = exercise.id === activeExercise?.id;

            return (
              <Pressable
                key={exercise.id}
                onPress={() => setActiveExerciseId(exercise.id)}
                style={[
                  styles.exerciseTab,
                  active && styles.exerciseTabActive,
                  !active && styles.exerciseTabInactive,
                ]}
              >
                <MaterialCommunityIcons name={profile.icon} size={16} color={active ? "#171108" : "#c9b08a"} />
                <Text style={[styles.exerciseTabText, active && styles.exerciseTabTextActive]}>{profile.tabLabel}</Text>
              </Pressable>
            );
          })}
        </View>

        {activeExercise ? (
          <GymExerciseCard
            key={activeExercise.id}
            exercise={activeExercise}
            selectedSeries={activeExerciseSelectedSeries}
            affordableSeries={activeExerciseAffordableSeries}
            hasAccess={hasPass}
            criticalCareActive={criticalCareActive}
            onSetSeries={(exerciseId, series) => setGymSeries(exerciseId, series, activeExerciseMaxSeries)}
            onTrain={actions.handleTrain}
            onLockedPress={handlePassAttention}
          />
        ) : (
          <View style={styles.emptyExerciseCard}>
            <Text style={styles.emptyExerciseTitle}>Brak cwiczen</Text>
            <Text style={styles.emptyExerciseText}>Sala treningowa jest teraz pusta.</Text>
          </View>
        )}
      </SectionCard>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  passStatusRow: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  passStatusRowActive: {
    borderColor: "rgba(221, 179, 109, 0.26)",
  },
  passStatusRowNeedPass: {
    borderColor: "rgba(201, 97, 109, 0.24)",
  },
  passStatusHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  passStatusIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  passStatusCopy: {
    flex: 1,
    gap: 3,
  },
  passStatusTitle: {
    color: "#fff1dd",
    fontSize: 15,
    fontWeight: "900",
  },
  passStatusMeta: {
    color: "#bfae93",
    fontSize: 12,
    lineHeight: 17,
  },
  passToggleButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(221, 179, 109, 0.18)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  passToggleButtonActive: {
    backgroundColor: "rgba(221, 179, 109, 0.08)",
    borderColor: "rgba(221, 179, 109, 0.28)",
  },
  passToggleButtonText: {
    color: "#f2dfb9",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  passOptionsStack: {
    marginTop: 2,
  },
  passCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
    marginBottom: 10,
    backgroundColor: "#14110d",
  },
  passCardActive: {
    borderColor: "rgba(221, 179, 109, 0.32)",
  },
  passCardFeatured: {
    borderColor: "rgba(101, 195, 139, 0.22)",
  },
  passCardDimmed: {
    opacity: 0.7,
  },
  passHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  passIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  passTitleWrap: {
    flex: 1,
    gap: 3,
  },
  passTitle: {
    color: "#f7ecda",
    fontSize: 15,
    fontWeight: "900",
  },
  passDescription: {
    color: "#bfae93",
    fontSize: 12,
    lineHeight: 17,
  },
  passFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  passPrice: {
    color: "#ffe0a2",
    fontSize: 18,
    fontWeight: "900",
  },
  passAction: {
    minWidth: 120,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#c7943a",
  },
  passActionDisabled: {
    opacity: 0.52,
  },
  passActionText: {
    color: "#1a1209",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  trainingHeaderCompact: {
    gap: 7,
    marginBottom: 10,
  },
  trainingHeaderCompactText: {
    color: "#b7aa97",
    fontSize: 12,
    lineHeight: 17,
  },
  exerciseTabsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  exerciseTab: {
    flex: 1,
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 8,
  },
  exerciseTabActive: {
    backgroundColor: "#d3a152",
    borderColor: "#f1c97f",
  },
  exerciseTabInactive: {
    backgroundColor: "#121316",
    borderColor: "#2d2f37",
  },
  exerciseTabText: {
    color: "#c9b08a",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  exerciseTabTextActive: {
    color: "#171108",
  },
  exerciseCard: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 11,
    marginBottom: 0,
    overflow: "hidden",
  },
  exerciseGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
  },
  exerciseBurst: {
    position: "absolute",
    top: 12,
    right: 12,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: "rgba(8, 14, 10, 0.94)",
    borderWidth: 1,
    borderColor: "rgba(143, 240, 174, 0.3)",
    zIndex: 4,
  },
  exerciseBurstText: {
    color: "#8ff0ae",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  energyBurst: {
    position: "absolute",
    top: 42,
    right: 12,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(14, 18, 24, 0.94)",
    borderWidth: 1,
    borderColor: "rgba(112, 171, 255, 0.22)",
    zIndex: 4,
  },
  energyBurstText: {
    color: "#a8c4ff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  exerciseIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  exerciseTitleWrap: {
    flex: 1,
    gap: 3,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: "900",
  },
  exerciseMeta: {
    fontSize: 12,
    fontWeight: "700",
  },
  exerciseStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  exerciseStatChip: {
    flexBasis: "31%",
    flexGrow: 1,
    minWidth: 92,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 4,
  },
  exerciseStatLabel: {
    color: "#948878",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  exerciseStatValue: {
    color: "#f7ecda",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
  },
  seriesHeader: {
    gap: 4,
  },
  seriesTitle: {
    fontSize: 13,
    fontWeight: "900",
  },
  seriesHint: {
    fontSize: 11,
    lineHeight: 16,
  },
  seriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  seriesDot: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111215",
    borderWidth: 1,
    borderColor: "#30313a",
  },
  seriesDotActive: {
    backgroundColor: "#2b1d12",
    borderColor: "#d8a24c",
  },
  seriesDotDisabled: {
    backgroundColor: "#0e0f12",
    borderColor: "#23252c",
  },
  seriesDotText: {
    color: "#8c8477",
    fontSize: 12,
    fontWeight: "900",
  },
  seriesDotTextActive: {
    color: "#ffe2a8",
  },
  seriesDotTextDisabled: {
    color: "#525764",
  },
  previewPanel: {
    gap: 4,
  },
  previewTextWrap: {
    gap: 2,
  },
  previewPrimary: {
    fontSize: 13,
    fontWeight: "900",
  },
  previewSecondary: {
    fontSize: 11,
    lineHeight: 16,
  },
  previewLock: {
    fontSize: 11,
    fontWeight: "800",
  },
  exerciseActions: {
    flexDirection: "row",
    gap: 10,
  },
  exerciseActionPrimary: {
    flex: 1,
    minHeight: 74,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#dbab59",
    borderWidth: 1,
    borderColor: "#f0ca7b",
    gap: 4,
    justifyContent: "center",
  },
  exerciseActionSecondary: {
    flex: 1,
    minHeight: 74,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#1a1e27",
    borderWidth: 1,
    borderColor: "#4f5f7c",
    gap: 4,
    justifyContent: "center",
  },
  exerciseActionDisabled: {
    opacity: 0.45,
  },
  exerciseActionPrimaryText: {
    color: "#130d06",
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  exerciseActionSecondaryText: {
    color: "#f7f0e4",
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  exerciseActionPrimaryMetaText: {
    color: "#3b2610",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 15,
  },
  exerciseActionSecondaryMetaText: {
    color: "#d2d9e8",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 15,
  },
  emptyExerciseCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2a2d35",
    backgroundColor: "#121315",
    paddingHorizontal: 14,
    paddingVertical: 18,
    gap: 6,
  },
  emptyExerciseTitle: {
    color: "#f3ece0",
    fontSize: 15,
    fontWeight: "900",
  },
  emptyExerciseText: {
    color: "#a89d8c",
    fontSize: 12,
    lineHeight: 17,
  },
});
