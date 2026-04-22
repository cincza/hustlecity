import React, { useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

export function MissionTile({ task, formatMoney, onClaim }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const rewardLift = useRef(new Animated.Value(6)).current;
  const rewardOpacity = useRef(new Animated.Value(0)).current;
  const [busy, setBusy] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const palette = useMemo(() => getTilePalette(task), [task]);
  const rewardText = useMemo(() => buildRewardText(task, formatMoney), [task, formatMoney]);
  const progressPercent = Math.max(0, Math.min(1, Number(task?.progressRatio || 0)));
  const claimable = Boolean(task?.completed && !task?.onlineDisabled);
  const statusLabel = task?.onlineDisabled ? "Wstrzymane" : claimable ? "Gotowa" : "W toku";

  const nudgeTile = () => {
    Animated.sequence([
      Animated.timing(pulse, {
        toValue: 0.985,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.spring(pulse, {
        toValue: 1,
        friction: 5,
        tension: 150,
        useNativeDriver: true,
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
          useNativeDriver: true,
        }),
        Animated.timing(flash, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(rewardOpacity, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(rewardOpacity, {
          toValue: 0,
          duration: 280,
          delay: 120,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(rewardLift, {
        toValue: -16,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.97,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.spring(pulse, {
          toValue: 1.02,
          friction: 5,
          tension: 140,
          useNativeDriver: true,
        }),
        Animated.spring(pulse, {
          toValue: 1,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => {
      if (finished) {
        setShowReward(false);
      }
    });
  };

  const handlePress = async () => {
    if (busy) return;
    if (!claimable) {
      nudgeTile();
      return;
    }

    setBusy(true);
    playClaimAnimation();
    await wait(160);

    try {
      const result = await onClaim?.(task);
      if (result === false) {
        setBusy(false);
        return;
      }
    } catch (_error) {
      setBusy(false);
      return;
    }

    setBusy(false);
  };

  return (
    <Pressable onPress={handlePress} style={styles.tilePressable}>
      <Animated.View
        style={[
          styles.tileWrap,
          {
            transform: [{ scale: pulse }],
            opacity: busy ? 0.92 : 1,
          },
        ]}
      >
        <LinearGradient colors={palette.gradient} style={[styles.tile, { borderColor: palette.border, shadowColor: palette.glow }]}>
          <Animated.View style={[styles.flashLayer, { opacity: flash }]} />
          {showReward ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.rewardBurst,
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
          <Text style={[styles.description, { color: palette.text }]} numberOfLines={1}>
            {task.description}
          </Text>

          <View style={styles.tileBottom}>
            <View style={[styles.progressTrack, { backgroundColor: palette.track }]}>
              <View style={[styles.progressFill, { backgroundColor: palette.fill, width: `${Math.max(8, progressPercent * 100)}%` }]} />
            </View>
            <View style={styles.progressRow}>
              <Text style={[styles.progressText, { color: palette.meta }]} numberOfLines={1}>
                {task.onlineDisabled ? task.disabledReason : task.progressLabel}
              </Text>
              {claimable ? <Text style={[styles.claimHint, { color: palette.reward }]}>Odbierz</Text> : null}
            </View>
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
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 6,
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
