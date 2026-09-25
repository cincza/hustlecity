import React, { useMemo, useRef, useState } from "react";
import { getTaskDestination } from "../../shared/taskGuidance.js";
import { Animated, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { USE_NATIVE_DRIVER, WEB_POINTER_EVENTS_NONE_STYLE, createShadowStyle } from "../utils/uiEffects";

import { Pressable, Text } from "../i18n";
function getTilePalette(task) {
  if (task?.completed && !task?.onlineDisabled) {
    return {
      gradient: ["rgba(26,49,32,0.98)", "rgba(10,23,15,0.98)"],
      border: "rgba(83, 199, 124, 0.36)",
      title: "#f3fff5",
      text: "#b8d7c0",
      meta: "#76d395",
      reward: "#8ff0ae",
      track: "rgba(83, 199, 124, 0.16)",
      fill: "#56d27f",
      glow: "rgba(86, 210, 127, 0.22)",
    };
  }

  if (task?.onlineDisabled) {
    return {
      gradient: ["rgba(33,31,28,0.98)", "rgba(16,15,13,0.98)"],
      border: "rgba(198, 159, 96, 0.2)",
      title: "#eee3ce",
      text: "#bda98a",
      meta: "#cfac68",
      reward: "#d7b56f",
      track: "rgba(241, 193, 100, 0.08)",
      fill: "#d9a347",
      glow: "rgba(0,0,0,0)",
    };
  }

  return {
    gradient: ["rgba(30,27,22,0.98)", "rgba(14,13,11,0.98)"],
    border: "rgba(214, 164, 90, 0.24)",
    title: "#f7ecd8",
    text: "#c4b396",
    meta: "#ddb36d",
    reward: "#f0cb83",
    track: "rgba(241, 193, 100, 0.08)",
    fill: "#d9a347",
    glow: "rgba(0,0,0,0)",
  };
}

function buildRewardText(task, formatMoney) {
  const parts = [];
  if (Number(task?.rewardCash || 0) > 0) parts.push(formatMoney(task.rewardCash));
  if (Number(task?.rewardXp || 0) > 0) parts.push(`+${task.rewardXp} XP`);
  if (Number(task?.rewardEnergy || 0) > 0) parts.push(`+${task.rewardEnergy} EN`);
  if (Number(task?.rewardHp || 0) > 0) parts.push(`+${task.rewardHp} HP`);
  return parts.join("  ");
}

export function MissionTile({ task, formatMoney, onClaim, onNavigate }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const rewardLift = useRef(new Animated.Value(6)).current;
  const rewardOpacity = useRef(new Animated.Value(0)).current;
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [showReward, setShowReward] = useState(false);
  const palette = useMemo(() => getTilePalette(task), [task]);
  const rewardText = useMemo(() => buildRewardText(task, formatMoney), [task, formatMoney]);
  const tileShadowStyle = useMemo(
    () =>
      createShadowStyle({
        color: palette.glow,
        opacity: 1,
        radius: 24,
        offsetY: 14,
        elevation: 6,
      }),
    [palette.glow]
  );
  const progressPercent = Math.max(0, Math.min(1, Number(task?.progressRatio || 0)));
  const claimable = Boolean(task?.completed && !task?.onlineDisabled);
  const destination = getTaskDestination(task);
  const statusLabel = task?.onlineDisabled ? "Wstrzymane" : claimable ? "Gotowa" : "W toku";

  const nudgeTile = () => {
    Animated.sequence([
      Animated.timing(pulse, {
        toValue: 0.985,
        duration: 70,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(pulse, {
        toValue: 1,
        friction: 5,
        tension: 150,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  };

  const playClaimAnimation = () => {
    setShowReward(true);
    flash.setValue(0);
    rewardLift.setValue(10);
    rewardOpacity.setValue(0);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(flash, {
          toValue: 1,
          duration: 120,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(flash, {
          toValue: 0,
          duration: 220,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
      Animated.sequence([
        Animated.timing(rewardOpacity, {
          toValue: 1,
          duration: 120,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(rewardOpacity, {
          toValue: 0,
          duration: 280,
          delay: 120,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
      Animated.timing(rewardLift, {
        toValue: -16,
        duration: 420,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.97,
          duration: 80,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.spring(pulse, {
          toValue: 1.02,
          friction: 5,
          tension: 140,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.spring(pulse, {
          toValue: 1,
          friction: 5,
          tension: 120,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    ]).start(({ finished }) => {
      if (finished) {
        setShowReward(false);
      }
    });
  };

  const handlePress = async () => {
    if (busyRef.current) return;
    if (!claimable) {
      nudgeTile();
      if (destination) onNavigate?.(destination.tab, destination.section);
      return;
    }

    setBusy(true);
    busyRef.current = true;

    try {
      const result = await onClaim?.(task);
      if (result === false) {
        return;
      }
      playClaimAnimation();
    } catch (_error) {
      return;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <Pressable onPress={handlePress} disabled={busy || task.onlineDisabled} accessibilityRole="button" accessibilityLabel={`${task.title}. ${claimable ? "Odbierz nagrodę" : destination?.label || task.progressLabel}`} accessibilityState={{ disabled: busy || task.onlineDisabled, busy }} style={styles.tilePressable}>
      <Animated.View
        style={[
          styles.tileWrap,
          {
            transform: [{ scale: pulse }],
            opacity: busy ? 0.92 : 1,
          },
        ]}
      >
        <LinearGradient colors={palette.gradient} style={[styles.tile, tileShadowStyle, { borderColor: palette.border }]}>
          <Animated.View style={[styles.flashLayer, { opacity: flash }]} />
          {showReward ? (
            <Animated.View
              pointerEvents={USE_NATIVE_DRIVER ? "none" : undefined}
              style={[
                styles.rewardBurst,
                WEB_POINTER_EVENTS_NONE_STYLE,
                {
                  opacity: rewardOpacity,
                  transform: [{ translateY: rewardLift }],
                },
              ]}
            >
              <Text style={styles.rewardBurstText}>{rewardText}</Text>
            </Animated.View>
          ) : null}

          <View style={styles.tileTopRow}>
            <View style={[styles.statusPill, { borderColor: palette.border, backgroundColor: palette.track }]}>
              <Text style={[styles.statusPillText, { color: palette.meta }]}>{statusLabel}</Text>
            </View>
            <Text style={[styles.rewardText, { color: palette.reward }]}>{rewardText}</Text>
          </View>

          <Text style={[styles.title, { color: palette.title }]} numberOfLines={2}>
            {task.title}
          </Text>
          <Text style={[styles.description, { color: palette.text }]}>
            {task.description}
          </Text>

          <View style={styles.tileBottom}>
            <View style={[styles.progressTrack, { backgroundColor: palette.track }]}>
              <View style={[styles.progressFill, { backgroundColor: palette.fill, width: `${progressPercent * 100}%` }]} />
            </View>
            <View style={styles.progressRow}>
              <Text style={[styles.progressText, { color: palette.meta }]} numberOfLines={1}>
                {task.onlineDisabled ? task.disabledReason : task.progressLabel}
              </Text>
              {claimable ? <Text style={[styles.claimHint, { color: palette.reward }]}>{busy ? "Odbieranie…" : "Odbierz"}</Text> : null}
            </View>
            {!claimable && destination ? <Text style={[styles.claimHint, { color: palette.reward }]}>{destination.label} →</Text> : null}
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

export function MissionPlaceholderTile({ title, description }) {
  return (
    <View style={styles.tilePressable}>
      <View style={[styles.tile, styles.placeholderTile]}>
        <Text style={styles.placeholderEyebrow}>Pusty slot</Text>
        <Text style={styles.placeholderTitle}>{title}</Text>
        <Text style={styles.placeholderDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tilePressable: {
    width: "48.4%",
    minHeight: 168,
    marginBottom: 10,
  },
  tileWrap: {
    flex: 1,
  },
  tile: {
    flex: 1,
    minHeight: 168,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    overflow: "hidden",
    gap: 9,
  },
  flashLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  rewardBurst: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(10, 14, 11, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(111, 211, 154, 0.38)",
    zIndex: 3,
  },
  rewardBurstText: {
    color: "#8ff0ae",
    fontSize: 10,
    fontWeight: "900",
  },
  tileTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  rewardText: {
    flexShrink: 1,
    textAlign: "right",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 14,
  },
  title: {
    fontSize: 16,
    lineHeight: 19,
    fontWeight: "900",
    minHeight: 38,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
  },
  tileBottom: {
    marginTop: "auto",
    gap: 6,
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  progressText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
  },
  claimHint: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  placeholderTile: {
    borderStyle: "dashed",
    borderColor: "rgba(214, 164, 90, 0.18)",
    backgroundColor: "rgba(16,14,12,0.76)",
    justifyContent: "center",
  },
  placeholderEyebrow: {
    color: "#8b7650",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  placeholderTitle: {
    color: "#d7c09a",
    fontSize: 16,
    lineHeight: 19,
    fontWeight: "900",
  },
  placeholderDescription: {
    color: "#9d8b70",
    fontSize: 12,
    lineHeight: 16,
  },
});
