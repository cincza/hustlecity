import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const TONE_MAP = {
  neutral: {
    gradient: ["#191b22", "#101218"],
    border: "rgba(210, 216, 228, 0.12)",
    eyebrow: "#9ea6b4",
    title: "#f4efe8",
    text: "#c1b7aa",
    pillBg: "rgba(255,255,255,0.05)",
    pillBorder: "rgba(255,255,255,0.08)",
    pillValue: "#f6f1ea",
    actionBg: "#151821",
    actionBorder: "#333746",
  },
  gold: {
    gradient: ["#2b1d12", "#16110c"],
    border: "rgba(215, 168, 87, 0.28)",
    eyebrow: "#d2a45a",
    title: "#fff2de",
    text: "#d8c2a3",
    pillBg: "rgba(241, 193, 100, 0.08)",
    pillBorder: "rgba(241, 193, 100, 0.18)",
    pillValue: "#ffe5b1",
    actionBg: "#1b140e",
    actionBorder: "#6d5327",
  },
  success: {
    gradient: ["#112119", "#0d1411"],
    border: "rgba(84, 182, 126, 0.25)",
    eyebrow: "#6fd39a",
    title: "#effff4",
    text: "#bfdac7",
    pillBg: "rgba(84, 182, 126, 0.08)",
    pillBorder: "rgba(84, 182, 126, 0.18)",
    pillValue: "#d7f7e1",
    actionBg: "#101912",
    actionBorder: "#2c6040",
  },
  info: {
    gradient: ["#111c27", "#0d1218"],
    border: "rgba(87, 151, 220, 0.28)",
    eyebrow: "#73aeea",
    title: "#eef6ff",
    text: "#bfd2e7",
    pillBg: "rgba(87, 151, 220, 0.08)",
    pillBorder: "rgba(87, 151, 220, 0.18)",
    pillValue: "#dfefff",
    actionBg: "#10161d",
    actionBorder: "#385772",
  },
  danger: {
    gradient: ["#2a1417", "#151011"],
    border: "rgba(206, 98, 112, 0.28)",
    eyebrow: "#f08a97",
    title: "#fff0f2",
    text: "#e4c0c6",
    pillBg: "rgba(206, 98, 112, 0.08)",
    pillBorder: "rgba(206, 98, 112, 0.16)",
    pillValue: "#ffd6db",
    actionBg: "#1d1315",
    actionBorder: "#6e3940",
  },
};

function getToneConfig(tone) {
  return TONE_MAP[tone] || TONE_MAP.neutral;
}

export function MetricPill({ label, value, note, tone = "neutral", icon }) {
  const toneConfig = getToneConfig(tone);

  return (
    <View
      style={[
        styles.metricPill,
        {
          backgroundColor: toneConfig.pillBg,
          borderColor: toneConfig.pillBorder,
        },
      ]}
    >
      <View style={styles.metricPillHeader}>
        {icon ? <MaterialCommunityIcons name={icon} size={14} color={toneConfig.eyebrow} /> : null}
        <Text style={[styles.metricPillLabel, { color: toneConfig.eyebrow }]}>{label}</Text>
      </View>
      <Text style={[styles.metricPillValue, { color: toneConfig.pillValue }]} numberOfLines={1}>
        {value}
      </Text>
      {note ? (
        <Text style={[styles.metricPillNote, { color: toneConfig.text }]} numberOfLines={2}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}

export function HeroPanel({
  eyebrow,
  title,
  summary,
  tone = "neutral",
  pills = [],
  primaryAction,
  secondaryAction,
}) {
  const toneConfig = getToneConfig(tone);

  return (
    <LinearGradient
      colors={toneConfig.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.heroPanel,
        {
          borderColor: toneConfig.border,
        },
      ]}
    >
      {eyebrow ? <Text style={[styles.heroEyebrow, { color: toneConfig.eyebrow }]}>{eyebrow}</Text> : null}
      <Text style={[styles.heroTitle, { color: toneConfig.title }]}>{title}</Text>
      {summary ? <Text style={[styles.heroSummary, { color: toneConfig.text }]}>{summary}</Text> : null}

      {Array.isArray(pills) && pills.length ? (
        <View style={styles.heroMetricGrid}>
          {pills.map((pill) => (
            <MetricPill key={`${pill.label}-${pill.value}`} {...pill} />
          ))}
        </View>
      ) : null}

      {primaryAction || secondaryAction ? (
        <View style={styles.heroActionsRow}>
          {primaryAction ? (
            <Pressable
              onPress={primaryAction.onPress}
              style={[
                styles.heroActionButton,
                styles.heroActionButtonPrimary,
                {
                  backgroundColor: toneConfig.actionBg,
                  borderColor: toneConfig.actionBorder,
                },
                primaryAction.disabled && styles.heroActionDisabled,
              ]}
              disabled={primaryAction.disabled}
            >
              <Text style={styles.heroActionPrimaryText}>{primaryAction.label}</Text>
              {primaryAction.meta ? <Text style={styles.heroActionMetaText}>{primaryAction.meta}</Text> : null}
            </Pressable>
          ) : null}
          {secondaryAction ? (
            <Pressable
              onPress={secondaryAction.onPress}
              style={[
                styles.heroActionButton,
                styles.heroActionButtonSecondary,
                {
                  borderColor: toneConfig.pillBorder,
                  backgroundColor: "rgba(255,255,255,0.03)",
                },
                secondaryAction.disabled && styles.heroActionDisabled,
              ]}
              disabled={secondaryAction.disabled}
            >
              <Text style={styles.heroActionSecondaryText}>{secondaryAction.label}</Text>
              {secondaryAction.meta ? <Text style={styles.heroActionMetaText}>{secondaryAction.meta}</Text> : null}
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  heroPanel: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    gap: 10,
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 28,
  },
  heroSummary: {
    fontSize: 13,
    lineHeight: 19,
  },
  heroMetricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metricPill: {
    flexBasis: 132,
    flexGrow: 1,
    minWidth: 0,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 5,
  },
  metricPillHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metricPillLabel: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metricPillValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  metricPillNote: {
    fontSize: 11,
    lineHeight: 15,
  },
  heroActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 2,
  },
  heroActionButton: {
    flexBasis: 162,
    flexGrow: 1,
    minWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
  },
  heroActionButtonPrimary: {
    justifyContent: "center",
  },
  heroActionButtonSecondary: {
    justifyContent: "center",
  },
  heroActionPrimaryText: {
    color: "#fff4e2",
    fontSize: 13,
    fontWeight: "800",
  },
  heroActionSecondaryText: {
    color: "#f1ece4",
    fontSize: 13,
    fontWeight: "800",
  },
  heroActionMetaText: {
    color: "#b8aea2",
    fontSize: 11,
    lineHeight: 15,
  },
  heroActionDisabled: {
    opacity: 0.45,
  },
});
