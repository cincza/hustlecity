import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

function getHpTone(ratio) {
  if (ratio <= 0.3) {
    return {
      label: "Stan krytyczny",
      colors: ["rgba(65,22,26,0.98)", "rgba(25,12,14,0.98)"],
      accent: "#ff7a8b",
      value: "#fff1f4",
      meta: "#e8bdc4",
      bar: "#ff5d74",
    };
  }
  if (ratio <= 0.65) {
    return {
      label: "Mocno poobijany",
      colors: ["rgba(51,36,16,0.98)", "rgba(20,15,10,0.98)"],
      accent: "#f2bf62",
      value: "#fff1dc",
      meta: "#dec9a8",
      bar: "#efb450",
    };
  }
  return {
    label: "Stan stabilny",
    colors: ["rgba(27,31,20,0.98)", "rgba(13,15,11,0.98)"],
    accent: "#9bd28c",
    value: "#f3fff0",
    meta: "#c2d8bc",
    bar: "#78ca68",
  };
}

function getHeatTone(heat) {
  if (heat >= 65) {
    return {
      label: "Wysoki przypal",
      accent: "#ff7a8b",
      track: "rgba(86,24,31,0.75)",
      fill: "#ff5d74",
      text: "#ffdbe1",
    };
  }
  if (heat >= 35) {
    return {
      label: "Pod okiem",
      accent: "#f0bf63",
      track: "rgba(67,45,12,0.72)",
      fill: "#efb450",
      text: "#f9e6c4",
    };
  }
  return {
    label: "Czysto",
    accent: "#94d58d",
    track: "rgba(21,51,30,0.72)",
    fill: "#76cb74",
    text: "#e0f6e0",
  };
}

function MiniBadge({ text, tone = "neutral" }) {
  const palette =
    tone === "danger"
      ? { backgroundColor: "rgba(216, 95, 113, 0.12)", borderColor: "rgba(216, 95, 113, 0.24)", color: "#ffb8c4" }
      : tone === "success"
        ? { backgroundColor: "rgba(113, 196, 140, 0.12)", borderColor: "rgba(113, 196, 140, 0.24)", color: "#c2f0d0" }
        : tone === "warning"
          ? { backgroundColor: "rgba(232, 181, 87, 0.14)", borderColor: "rgba(232, 181, 87, 0.24)", color: "#ffe1aa" }
          : { backgroundColor: "rgba(144, 153, 170, 0.12)", borderColor: "rgba(144, 153, 170, 0.18)", color: "#dce3ee" };

  return (
    <View style={[styles.badge, { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor }]}>
      <Text style={[styles.badgeText, { color: palette.color }]}>{text}</Text>
    </View>
  );
}

function ProgressTrack({ progress, trackColor, fillColor }) {
  const safeProgress = Math.max(0, Math.min(1, Number(progress || 0)));
  const width = safeProgress <= 0 ? "0%" : `${Math.max(8, safeProgress * 100)}%`;
  return (
    <View style={[styles.progressTrack, { backgroundColor: trackColor }]}>
      <View style={[styles.progressFill, { width, backgroundColor: fillColor }]} />
    </View>
  );
}

export function HospitalSection({
  SectionCard,
  formatMoney,
  formatCooldown,
  player,
  healthRegenAmount,
  healthRegenSeconds,
  criticalCareStatus,
  criticalCareModes,
  onHeal,
  onPrivateClinic,
}) {
  const { width } = useWindowDimensions();
  const compact = width < 410;
  const [busy, setBusy] = useState("");
  const [feedback, setFeedback] = useState(null);
  const hpScale = useRef(new Animated.Value(1)).current;
  const heatScale = useRef(new Animated.Value(1)).current;
  const criticalScale = useRef(new Animated.Value(1)).current;
  const primaryOpacity = useRef(new Animated.Value(0)).current;
  const secondaryOpacity = useRef(new Animated.Value(0)).current;
  const primaryLift = useRef(new Animated.Value(10)).current;
  const secondaryLift = useRef(new Animated.Value(12)).current;

  const hpRatio = Math.max(0, Math.min(1, Number(player?.maxHp || 0) > 0 ? Number(player?.hp || 0) / Number(player?.maxHp || 1) : 0));
  const hpTone = useMemo(() => getHpTone(hpRatio), [hpRatio]);
  const heatTone = useMemo(() => getHeatTone(Number(player?.heat || 0)), [player?.heat]);
  const criticalCareActive = Boolean(criticalCareStatus?.active) || Number(player?.hp || 0) <= 0;
  const criticalCareProtected = Boolean(criticalCareStatus?.protected);
  const privateMode = criticalCareModes?.private || null;
  const currentCareMode = criticalCareStatus?.mode || criticalCareModes?.public || null;
  const canAffordPrivate = Number(player?.cash || 0) >= Number(privateMode?.cost || 0);
  const healLine = `+30 HP • -2 heat • ${formatMoney(220)}`;
  const regenLine = `+${healthRegenAmount} HP / ${Math.round(Number(healthRegenSeconds || 0) / 60)} min`;

  useEffect(() => {
    if (!feedback?.id) return undefined;

    const targetScale = feedback.type === "private-care" ? criticalScale : hpScale;
    targetScale.setValue(1);
    heatScale.setValue(1);
    criticalScale.setValue(1);
    primaryOpacity.setValue(0);
    secondaryOpacity.setValue(0);
    primaryLift.setValue(10);
    secondaryLift.setValue(12);

    const animations = [
      Animated.sequence([
        Animated.timing(targetScale, { toValue: 1.03, duration: 110, useNativeDriver: true }),
        Animated.spring(targetScale, { toValue: 1, friction: 5, tension: 115, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(primaryOpacity, { toValue: 1, duration: 130, useNativeDriver: true }),
        Animated.delay(140),
        Animated.timing(primaryOpacity, { toValue: 0, duration: 230, useNativeDriver: true }),
      ]),
      Animated.timing(primaryLift, { toValue: -16, duration: 440, useNativeDriver: true }),
    ];

    if (feedback.secondaryText) {
      animations.push(
        Animated.sequence([
          Animated.delay(60),
          Animated.timing(secondaryOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
          Animated.delay(110),
          Animated.timing(secondaryOpacity, { toValue: 0, duration: 210, useNativeDriver: true }),
        ]),
        Animated.timing(secondaryLift, { toValue: -14, duration: 420, useNativeDriver: true })
      );
    }

    if (feedback.type === "heal") {
      heatScale.setValue(1);
      animations.push(
        Animated.sequence([
          Animated.delay(30),
          Animated.timing(heatScale, { toValue: 0.985, duration: 90, useNativeDriver: true }),
          Animated.spring(heatScale, { toValue: 1, friction: 6, tension: 110, useNativeDriver: true }),
        ])
      );
    }

    const animation = Animated.parallel(animations);
    animation.start();
    return () => animation.stop();
  }, [criticalScale, feedback, heatScale, hpScale, primaryLift, primaryOpacity, secondaryLift, secondaryOpacity]);

  const handleHeal = async () => {
    if (busy) return;
    setBusy("heal");
    try {
      const result = await onHeal?.();
      if (result && typeof result === "object") {
        setFeedback({
          id: Date.now(),
          type: "heal",
          primaryText: result.hpGain > 0 ? `+${result.hpGain} HP` : "Wracasz do pionu",
          secondaryText: result.heatDrop > 0 ? `-${result.heatDrop} HEAT` : "",
        });
      }
    } finally {
      setBusy("");
    }
  };

  const handlePrivateClinic = async () => {
    if (busy) return;
    setBusy("private");
    try {
      const result = await onPrivateClinic?.();
      if (result && typeof result === "object") {
        setFeedback({
          id: Date.now(),
          type: "private-care",
          primaryText: `Czas zbity do ${formatCooldown(result.remainingMs || 0)}`,
          secondaryText: result.cost ? `-${formatMoney(result.cost)}` : "",
        });
      }
    } finally {
      setBusy("");
    }
  };

  if (criticalCareActive) {
    const remaining = criticalCareStatus?.remainingMs || 0;
    const onPrivate = currentCareMode?.id !== privateMode?.id && canAffordPrivate;

    return (
      <SectionCard title="Szpital" subtitle="Tu liczysz czas do powrotu.">
        <Animated.View style={{ transform: [{ scale: criticalScale }] }}>
          <LinearGradient colors={["rgba(61,18,24,0.98)", "rgba(24,10,13,0.98)"]} style={[styles.heroCard, styles.criticalHero]}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.feedbackChip,
                styles.feedbackChipCritical,
                {
                  opacity: primaryOpacity,
                  transform: [{ translateY: primaryLift }],
                },
              ]}
            >
              <Text style={styles.feedbackChipText}>{feedback?.primaryText || ""}</Text>
            </Animated.View>
            {feedback?.secondaryText ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.feedbackChip,
                  styles.feedbackChipMuted,
                  {
                    opacity: secondaryOpacity,
                    transform: [{ translateY: secondaryLift }],
                  },
                ]}
              >
                <Text style={styles.feedbackChipText}>{feedback.secondaryText}</Text>
              </Animated.View>
            ) : null}

            <View style={styles.heroTop}>
              <MiniBadge text="Intensywna terapia" tone="danger" />
              <Text style={styles.criticalModeLabel}>{currentCareMode?.label || "Publiczna intensywna"}</Text>
            </View>

            <Text style={styles.criticalTimer}>{formatCooldown(remaining)}</Text>
            <Text style={styles.criticalCopy}>Wracasz do siebie po ciezkiej akcji.</Text>
            <Text style={styles.criticalSubcopy}>Napady, kontrakty, PvP i trening sa chwilowo zablokowane.</Text>
          </LinearGradient>
        </Animated.View>

        <LinearGradient colors={["rgba(23,20,17,0.98)", "rgba(12,11,10,0.98)"]} style={styles.criticalActionCard}>
          <View style={styles.criticalActionCopy}>
            <Text style={styles.criticalActionTitle}>Leczenie prywatne</Text>
            <Text style={styles.criticalActionMeta}>
              Skroc do {formatCooldown(privateMode?.durationMs || 0)} i wroc z okolo {Math.round(Number(privateMode?.returnHpRatio || 0) * 100)}% HP.
            </Text>
            <Text style={styles.criticalActionMeta}>Koszt {formatMoney(privateMode?.cost || 0)}.</Text>
          </View>

          <Pressable
            onPress={handlePrivateClinic}
            disabled={!onPrivate || busy === "private"}
            style={[styles.primaryCta, styles.privateCta, (!onPrivate || busy === "private") && styles.primaryCtaDisabled]}
          >
            <MaterialCommunityIcons name="hospital-box-outline" size={18} color={onPrivate && busy !== "private" ? "#220f07" : "#9a8a73"} />
            <Text style={[styles.primaryCtaText, (!onPrivate || busy === "private") && styles.primaryCtaTextDisabled]}>
              {currentCareMode?.id === privateMode?.id ? "Klinika pracuje" : !canAffordPrivate ? "Brak kasy" : busy === "private" ? "Przepinanie..." : "Przepisz do kliniki"}
            </Text>
          </Pressable>
        </LinearGradient>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Szpital" subtitle="Poskladaj sie i wracaj na ulice.">
      <Animated.View style={{ transform: [{ scale: hpScale }] }}>
        <LinearGradient colors={hpTone.colors} style={styles.heroCard}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.feedbackChip,
              {
                opacity: primaryOpacity,
                transform: [{ translateY: primaryLift }],
              },
            ]}
          >
            <Text style={styles.feedbackChipText}>{feedback?.primaryText || ""}</Text>
          </Animated.View>
          {feedback?.secondaryText ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.feedbackChip,
                styles.feedbackChipMuted,
                {
                  opacity: secondaryOpacity,
                  transform: [{ translateY: secondaryLift }],
                },
              ]}
            >
              <Text style={styles.feedbackChipText}>{feedback.secondaryText}</Text>
            </Animated.View>
          ) : null}

          <View style={styles.heroTop}>
            <MiniBadge text={hpTone.label} tone={hpRatio <= 0.3 ? "danger" : hpRatio <= 0.65 ? "warning" : "success"} />
            {criticalCareProtected ? <MiniBadge text={`Oslona ${formatCooldown(criticalCareStatus?.protectionRemainingMs || 0)}`} tone="warning" /> : null}
          </View>
          <Text style={[styles.heroValue, { color: hpTone.value }]}>{player.hp}/{player.maxHp}</Text>
          <Text style={[styles.heroLabel, { color: hpTone.meta }]}>Zdrowie</Text>
          <View style={styles.heroProgressWrap}>
            <ProgressTrack progress={hpRatio} trackColor="rgba(0,0,0,0.34)" fillColor={hpTone.bar} />
          </View>
        </LinearGradient>
      </Animated.View>

      <View style={[styles.infoRow, compact && styles.infoRowStacked]}>
        <Animated.View style={[styles.infoCardWrap, { transform: [{ scale: heatScale }] }]}>
          <LinearGradient colors={["rgba(21,22,25,0.98)", "rgba(10,11,13,0.98)"]} style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <MaterialCommunityIcons name="fire-circle" size={16} color={heatTone.accent} />
              <Text style={styles.infoLabel}>Heat</Text>
            </View>
            <Text style={[styles.infoValue, { color: heatTone.text }]}>{player.heat}%</Text>
            <ProgressTrack progress={Math.max(0, Math.min(1, Number(player.heat || 0) / 100))} trackColor={heatTone.track} fillColor={heatTone.fill} />
            <Text style={styles.infoMeta}>{heatTone.label}</Text>
          </LinearGradient>
        </Animated.View>

        <LinearGradient colors={["rgba(21,22,25,0.98)", "rgba(10,11,13,0.98)"]} style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <MaterialCommunityIcons name="heart-plus" size={16} color="#e9c57c" />
            <Text style={styles.infoLabel}>Regeneracja</Text>
          </View>
          <Text style={styles.infoValue}>{regenLine}</Text>
          <Text style={styles.infoMeta}>Lekkie odbicie wpada samo z czasem.</Text>
        </LinearGradient>
      </View>

      <LinearGradient colors={["rgba(36,27,16,0.98)", "rgba(14,11,8,0.98)"]} style={styles.ctaWrap}>
        <View style={styles.ctaCopy}>
          <Text style={styles.ctaTitle}>Wylecz sie</Text>
          <Text style={styles.ctaMeta}>{healLine}</Text>
        </View>
        <Pressable onPress={handleHeal} disabled={busy === "heal"} style={[styles.primaryCta, busy === "heal" && styles.primaryCtaDisabled]}>
          <MaterialCommunityIcons name="medical-bag" size={18} color={busy === "heal" ? "#9a8a73" : "#220f07"} />
          <Text style={[styles.primaryCtaText, busy === "heal" && styles.primaryCtaTextDisabled]}>{busy === "heal" ? "Chwila..." : "Wylecz sie"}</Text>
        </Pressable>
      </LinearGradient>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 18,
    gap: 10,
  },
  criticalHero: {
    minHeight: 194,
    justifyContent: "space-between",
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  heroValue: {
    fontSize: 40,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: -2,
  },
  heroProgressWrap: {
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  infoRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  infoRowStacked: {
    flexDirection: "column",
  },
  infoCardWrap: {
    flex: 1,
  },
  infoCard: {
    flex: 1,
    minHeight: 118,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(236, 189, 104, 0.12)",
    padding: 14,
    gap: 8,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    color: "#d6b169",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  infoValue: {
    color: "#fff3dd",
    fontSize: 20,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  infoMeta: {
    color: "#b7b0a6",
    fontSize: 12,
    lineHeight: 17,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  ctaWrap: {
    marginTop: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(236, 189, 104, 0.12)",
    padding: 14,
    gap: 12,
  },
  ctaCopy: {
    gap: 4,
  },
  ctaTitle: {
    color: "#fff1db",
    fontSize: 22,
    fontWeight: "900",
  },
  ctaMeta: {
    color: "#dbc7aa",
    fontSize: 13,
    lineHeight: 18,
  },
  primaryCta: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: "#d9a94a",
    borderWidth: 1,
    borderColor: "rgba(255, 235, 192, 0.18)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryCtaDisabled: {
    backgroundColor: "rgba(76, 67, 52, 0.85)",
    borderColor: "rgba(255,255,255,0.06)",
  },
  primaryCtaText: {
    color: "#220f07",
    fontSize: 15,
    fontWeight: "900",
  },
  primaryCtaTextDisabled: {
    color: "#b4a48a",
  },
  feedbackChip: {
    position: "absolute",
    right: 14,
    top: 14,
    zIndex: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(76, 126, 92, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(183, 236, 199, 0.28)",
  },
  feedbackChipCritical: {
    backgroundColor: "rgba(228, 178, 86, 0.96)",
    borderColor: "rgba(255, 231, 180, 0.34)",
  },
  feedbackChipMuted: {
    top: 48,
    backgroundColor: "rgba(27, 28, 31, 0.96)",
    borderColor: "rgba(255,255,255,0.08)",
  },
  feedbackChipText: {
    color: "#f5fff6",
    fontSize: 11,
    fontWeight: "900",
  },
  criticalModeLabel: {
    color: "#ffd8df",
    fontSize: 12,
    fontWeight: "800",
  },
  criticalTimer: {
    color: "#fff2f4",
    fontSize: 42,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  criticalCopy: {
    color: "#f4d8dd",
    fontSize: 16,
    fontWeight: "800",
  },
  criticalSubcopy: {
    color: "#d1b2b9",
    fontSize: 13,
    lineHeight: 18,
  },
  criticalActionCard: {
    marginTop: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(236, 189, 104, 0.12)",
    padding: 14,
    gap: 12,
  },
  criticalActionCopy: {
    gap: 4,
  },
  criticalActionTitle: {
    color: "#fff0dc",
    fontSize: 21,
    fontWeight: "900",
  },
  criticalActionMeta: {
    color: "#cfc0ac",
    fontSize: 13,
    lineHeight: 18,
  },
  privateCta: {
    backgroundColor: "#e0b35a",
  },
});
