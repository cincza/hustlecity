import React from "react";
import { Image, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const ICON_MAP = {
  bank: "bank-outline",
  casino: "cards-playing-outline",
  food: "food-outline",
  hospital: "hospital-box-outline",
  training: "dumbbell",
  heists: "lock-open-variant-outline",
  business: "office-building-outline",
  market: "storefront-outline",
  gang: "account-group-outline",
  profile: "account-outline",
  hp: "heart-pulse",
  energy: "lightning-bolt",
  cash: "cash-multiple",
  level: "star-four-points",
  chance: "target",
  reward: "cash-plus",
};

const PLAYER_HUD_BG = require("../../assets/branding/hub-parts/hud-panel-main.png");

function IconChip({ icon, accent = "#f0c24d", size = 18 }) {
  return <MaterialCommunityIcons name={ICON_MAP[icon] || "circle-outline"} size={size} color={accent} />;
}

function ProgressBar({ value, max, fillColor }) {
  const progress = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  return (
    <View style={styles.statBarTrack}>
      <View style={[styles.statBarFill, { width: `${Math.max(6, progress * 100)}%`, backgroundColor: fillColor }]} />
    </View>
  );
}

function AvatarFrame({ activeAvatar, compact }) {
  return (
    <LinearGradient colors={["#f2cb67", "#916217"]} style={[styles.avatarFrame, compact && styles.avatarFrameCompact]}>
      <View style={styles.avatarFrameInner}>
        <LinearGradient colors={activeAvatar?.colors || ["#3d3f45", "#101114"]} style={styles.headerAvatar}>
          {activeAvatar?.image ? <Image source={activeAvatar.image} style={styles.headerAvatarImage} /> : <Text style={[styles.headerAvatarSigil, compact && styles.headerAvatarSigilCompact]}>{activeAvatar?.sigil || "HC"}</Text>}
        </LinearGradient>
      </View>
    </LinearGradient>
  );
}

function StatBar({ icon, label, value, max, fillColor, accent, compact }) {
  return (
    <View style={[styles.headerStatCard, compact && styles.headerStatCardCompact]}>
      <View style={styles.headerStatMeta}>
        <View style={[styles.headerStatIconWrap, { borderColor: accent }]}>
          <IconChip icon={icon} accent={accent} size={compact ? 18 : 20} />
        </View>
        <View style={styles.headerStatTextWrap}>
          <Text style={[styles.headerBarLabel, compact && styles.headerBarLabelCompact]}>{label}</Text>
          <Text style={[styles.headerBarValue, compact && styles.headerBarValueCompact]}>{value}/{max}</Text>
        </View>
      </View>
      <ProgressBar value={value} max={max} fillColor={fillColor} />
    </View>
  );
}

function InfoCard({ icon, label, value, children, compact }) {
  return (
    <LinearGradient colors={["rgba(26,27,31,0.94)", "rgba(13,14,18,0.98)"]} style={[styles.infoCard, compact && styles.infoCardCompact]}>
      <View style={styles.infoCardInner}>
        <LinearGradient colors={["#f2cb67", "#916217"]} style={styles.infoCardIconRing}>
          <View style={styles.infoCardIconInner}>
            {icon === "xp" ? <Text style={styles.infoCardXpGlyph}>XP</Text> : <IconChip icon={icon} accent="#f0c24d" size={compact ? 20 : 22} />}
          </View>
        </LinearGradient>
        <View style={styles.infoCardContent}>
          <Text style={[styles.headerBottomLabel, compact && styles.headerBottomLabelCompact]}>{label}</Text>
          {value ? <Text style={[styles.infoCardValue, compact && styles.infoCardValueCompact]} numberOfLines={1}>{value}</Text> : null}
          {children}
        </View>
      </View>
    </LinearGradient>
  );
}

export function GameHeader({
  playerName,
  rankTitle,
  statusLabel,
  level,
  xp,
  xpRequired,
  xpProgress,
  cash,
  hp,
  maxHp,
  energy,
  maxEnergy,
  activeAvatar,
}) {
  const { width } = useWindowDimensions();
  const compact = width <= 430;

  return (
    <ImageBackground source={PLAYER_HUD_BG} style={[styles.headerWrap, compact && styles.headerWrapCompact]} imageStyle={styles.headerBackgroundImage}>
      <View style={styles.headerTopRow}>
        <View style={styles.headerIdentityBlock}>
          <AvatarFrame activeAvatar={activeAvatar} compact={compact} />
          <View style={styles.headerIdentity}>
            <Text style={[styles.headerName, compact && styles.headerNameCompact]} numberOfLines={1}>{playerName}</Text>
            <View style={[styles.headerSubline, compact && styles.headerSublineCompact]}>
              <Text style={[styles.headerRank, compact && styles.headerRankCompact]} numberOfLines={1}>{rankTitle}</Text>
              <View style={styles.headerStatusPill}>
                <View style={[styles.headerStatusPillDot, statusLabel === "ONLINE" ? styles.headerStatusPillDotOnline : styles.headerStatusPillDotDemo]} />
                <Text style={[styles.headerStatusText, compact && styles.headerStatusTextCompact, statusLabel === "ONLINE" ? styles.headerStatusOnline : styles.headerStatusDemo]} numberOfLines={1}>{statusLabel || "DEMO"}</Text>
              </View>
            </View>
          </View>
        </View>

        <LinearGradient colors={["#f2cb67", "#916217"]} style={[styles.headerRespectMedal, compact && styles.headerRespectMedalCompact]}>
          <View style={styles.headerRespectMedalInner}>
            <MaterialCommunityIcons name="crown-outline" size={compact ? 16 : 18} color="#f5d27a" />
            <Text style={[styles.headerRespectValue, compact && styles.headerRespectValueCompact]}>{level}</Text>
          </View>
          <Text style={[styles.headerRespectLabel, compact && styles.headerRespectLabelCompact]}>SZACUNEK</Text>
        </LinearGradient>
      </View>

      <View style={styles.headerStatsColumn}>
        <StatBar icon="hp" label="HP" value={hp} max={maxHp} fillColor="#ff3659" accent="rgba(255,54,89,0.45)" compact={compact} />
        <StatBar icon="energy" label="ENERGIA" value={energy} max={maxEnergy} fillColor="#ffbf1e" accent="rgba(255,191,30,0.45)" compact={compact} />
      </View>

      <View style={styles.headerBottomRow}>
        <InfoCard icon="cash" label="KASA" value={cash} compact={compact} />
        <InfoCard icon="xp" label={`POSTEP DO SZACUNKU ${level + 1}`} compact={compact}>
          <Text style={[styles.headerXpValue, compact && styles.headerXpValueCompact]}>{xp} / {xpRequired}</Text>
          <ProgressBar value={Math.round((xpProgress || 0) * 100)} max={100} fillColor="#f0c24d" />
        </InfoCard>
      </View>
    </ImageBackground>
  );
}

export function QuickActionTile({ icon, image, title, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.quickTile}>
      {image ? (
        <ImageBackground source={image} style={styles.quickTileFull} imageStyle={styles.quickTileFullImage}>
          <LinearGradient colors={["rgba(0,0,0,0.04)", "rgba(0,0,0,0.22)", "rgba(0,0,0,0.72)"]} style={styles.quickTileOverlay}>
            <Text style={styles.quickTileTitle}>{title}</Text>
          </LinearGradient>
        </ImageBackground>
      ) : (
        <>
          <LinearGradient colors={["#1d1f25", "#111217"]} style={styles.quickTileIcon}>
            <IconChip icon={icon} size={20} />
          </LinearGradient>
          <Text style={styles.quickTileTitle}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function MainFeatureTile({ icon, title, subtitle, onPress, accentColors = ["#2c2220", "#111217"], danger = false }) {
  return (
    <Pressable onPress={onPress} style={styles.featureTilePress}>
      <LinearGradient
        colors={danger ? ["#3c1d1d", "#161012"] : accentColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.featureTile}
      >
        <View style={styles.featureTileTop}>
          <View style={styles.featureTileBadge}>
            <IconChip icon={icon} size={20} />
          </View>
        </View>
        <Text style={styles.featureTileTitle}>{title}</Text>
        <Text style={styles.featureTileSubtitle}>{subtitle}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function HeistTabs({ tabs, selected, onSelect }) {
  return (
    <View style={styles.heistTabsRow}>
      {tabs.map((tab) => (
        <Pressable
          key={tab.id}
          onPress={() => !tab.locked && onSelect(tab.id)}
          style={[styles.heistTab, selected === tab.id && styles.heistTabActive, tab.locked && styles.heistTabLocked]}
        >
          <Text style={[styles.heistTabText, selected === tab.id && styles.heistTabTextActive]}>{tab.label}</Text>
          {tab.lockedLabel ? <Text style={styles.heistTabLockText}>{tab.lockedLabel}</Text> : null}
        </Pressable>
      ))}
    </View>
  );
}

export function HeistCard({ title, reward, xp, chance, energy, risk, lockedLabel, onPress, disabled }) {
  return (
    <LinearGradient colors={["#17191e", "#0f1014"]} style={[styles.heistCard, disabled && styles.heistCardDisabled]}>
      <View style={styles.heistCardHeader}>
        <View style={styles.heistCardTitleWrap}>
          <Text style={styles.heistCardTitle}>{title}</Text>
          <Text style={styles.heistCardMeta}>Ryzyko {risk} | Energia {energy}</Text>
        </View>
        <Text style={styles.heistReward}>{reward}</Text>
      </View>
      <View style={styles.heistInfoRow}>
        <View style={styles.heistInfoChip}>
          <IconChip icon="chance" size={14} />
          <Text style={styles.heistInfoText}>{chance}</Text>
        </View>
        <View style={styles.heistInfoChip}>
          <IconChip icon="energy" size={14} />
          <Text style={styles.heistInfoText}>{energy}</Text>
        </View>
        {xp ? (
          <View style={styles.heistInfoChip}>
            <IconChip icon="level" size={14} />
            <Text style={styles.heistInfoText}>{xp}</Text>
          </View>
        ) : null}
      </View>
      <Pressable onPress={onPress} style={[styles.heistActionButton, disabled && styles.heistActionButtonDisabled]}>
        <Text style={styles.heistActionText}>{lockedLabel || "Wykonaj"}</Text>
      </Pressable>
    </LinearGradient>
  );
}

export function ResultModal({ visible, tone = "warning", title, message, onClose }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.resultModal, tone === "success" && styles.resultModalSuccess, tone === "failure" && styles.resultModalFailure]}>
          <Text style={styles.resultModalTitle}>{title}</Text>
          <Text style={styles.resultModalMessage}>{message}</Text>
          <Pressable onPress={onClose} style={styles.resultModalButton}>
            <Text style={styles.resultModalButtonText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function QuickActionModal({ visible, title, children, onClose }) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.quickModalShell}>
          <View style={styles.quickModalHeader}>
            <Text style={styles.quickModalTitle}>{title}</Text>
            <Pressable onPress={onClose} style={styles.quickModalClose}>
              <MaterialCommunityIcons name="close" size={18} color="#f6efe6" />
            </Pressable>
          </View>
          <ScrollView style={styles.quickModalScroll} contentContainerStyle={styles.quickModalBody}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  headerWrap: { marginHorizontal: 10, marginTop: 8, marginBottom: 10, paddingHorizontal: 14, paddingVertical: 14, gap: 10, overflow: "hidden" },
  headerWrapCompact: { marginHorizontal: 8, marginTop: 6, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
  headerBackgroundImage: { resizeMode: "stretch", borderRadius: 24, opacity: 0.42 },
  headerTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  headerIdentityBlock: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, minWidth: 0 },
  avatarFrame: { width: 74, height: 74, borderRadius: 999, padding: 2 },
  avatarFrameCompact: { width: 62, height: 62 },
  avatarFrameInner: { flex: 1, borderRadius: 999, padding: 3, backgroundColor: "#0a0a0b" },
  headerAvatar: { width: "100%", height: "100%", borderRadius: 999, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  headerAvatarImage: { width: "100%", height: "100%" },
  headerAvatarSigil: { color: "#fff6ea", fontWeight: "900", fontSize: 18 },
  headerAvatarSigilCompact: { fontSize: 15 },
  headerIdentity: { flex: 1, justifyContent: "center", minWidth: 0, paddingRight: 4 },
  headerName: { color: "#fff6ea", fontSize: 22, fontWeight: "900" },
  headerNameCompact: { fontSize: 16 },
  headerSubline: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 6 },
  headerSublineCompact: { gap: 6, marginTop: 4 },
  headerRank: { color: "#d9b257", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  headerRankCompact: { fontSize: 9 },
  headerStatusText: { fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  headerStatusTextCompact: { fontSize: 9 },
  headerStatusOnline: { color: "#3ee96e" },
  headerStatusDemo: { color: "#9aa0ab" },
  headerFeatureHint: { color: "#c9c0b4", fontSize: 12, lineHeight: 18, marginTop: 10, maxWidth: "92%" },
  headerFeatureHintCompact: { fontSize: 9, lineHeight: 13, marginTop: 8, maxWidth: "96%" },
  headerStatusPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  headerStatusPillDot: { width: 8, height: 8, borderRadius: 999 },
  headerStatusPillDotOnline: { backgroundColor: "#3ee96e" },
  headerStatusPillDotDemo: { backgroundColor: "#9aa0ab" },
  headerRespectMedal: { width: 96, height: 96, borderRadius: 999, padding: 2, alignItems: "center", justifyContent: "center" },
  headerRespectMedalCompact: { width: 82, height: 82 },
  headerRespectMedalInner: { flex: 1, width: "100%", borderRadius: 999, backgroundColor: "#0d0d0f", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  headerRespectValue: { color: "#ffcf60", fontSize: 30, fontWeight: "900", marginTop: 2 },
  headerRespectValueCompact: { fontSize: 24 },
  headerRespectLabel: { color: "#d9b257", fontSize: 10, fontWeight: "900", marginTop: 2, textAlign: "center" },
  headerRespectLabelCompact: { fontSize: 8 },
  headerStatsColumn: { gap: 8 },
  headerStatCard: { backgroundColor: "rgba(18,19,23,0.92)", borderRadius: 18, borderWidth: 1, borderColor: "rgba(237,181,74,0.18)", paddingHorizontal: 12, paddingVertical: 10 },
  headerStatCardCompact: { paddingHorizontal: 10, paddingVertical: 9 },
  headerStatMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  headerStatIconWrap: { width: 36, height: 36, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: "#111111", borderWidth: 1, borderColor: "rgba(237,181,74,0.22)" },
  headerStatTextWrap: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flex: 1 },
  headerBarLabel: { color: "#d8d0c4", fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  headerBarLabelCompact: { fontSize: 9 },
  headerBarValue: { color: "#fff6ea", fontSize: 14, fontWeight: "900" },
  headerBarValueCompact: { fontSize: 11 },
  headerBottomRow: { flexDirection: "row", gap: 10 },
  infoCard: { flex: 1, minHeight: 104, borderRadius: 18, borderWidth: 1, borderColor: "rgba(237,181,74,0.18)" },
  infoCardCompact: { minHeight: 92 },
  infoCardInner: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 14 },
  infoCardIconRing: { width: 44, height: 44, borderRadius: 999, padding: 1.5 },
  infoCardIconInner: { flex: 1, borderRadius: 999, backgroundColor: "#0d0d0f", alignItems: "center", justifyContent: "center" },
  infoCardXpGlyph: { color: "#f0c24d", fontSize: 20, fontWeight: "900" },
  infoCardContent: { flex: 1, minWidth: 0 },
  headerBottomLabel: { color: "#d9b257", fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  headerBottomLabelCompact: { fontSize: 8 },
  infoCardValue: { color: "#f0c24d", fontSize: 20, fontWeight: "900", marginTop: 4 },
  infoCardValueCompact: { fontSize: 14, marginTop: 4 },
  headerXpValue: { color: "#fff6ea", fontSize: 15, fontWeight: "900", marginTop: 2, marginBottom: 8 },
  headerXpValueCompact: { fontSize: 11, marginTop: 2, marginBottom: 6 },
  statBarTrack: { height: 10, borderRadius: 999, backgroundColor: "rgba(15,15,15,0.92)", overflow: "hidden", borderWidth: 1, borderColor: "#262626" },
  statBarFill: { height: "100%", borderRadius: 999 },
  quickTile: { width: "31%", minWidth: 92, flexGrow: 1, minHeight: 110, borderRadius: 18, backgroundColor: "#121419", borderWidth: 1, borderColor: "#2d313a", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  quickTileIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#3a3f49", overflow: "hidden" },
  quickTileFull: { width: "100%", minHeight: 110, justifyContent: "flex-end" },
  quickTileFullImage: { borderRadius: 17 },
  quickTileOverlay: { width: "100%", paddingHorizontal: 10, paddingVertical: 10, justifyContent: "flex-end", minHeight: 110 },
  quickTileTitle: { color: "#f6efe6", fontSize: 12, fontWeight: "800", textAlign: "center", textShadowColor: "rgba(0,0,0,0.45)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  featureTilePress: { flexBasis: "48%", flexGrow: 1 },
  featureTile: { minHeight: 132, borderRadius: 22, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", justifyContent: "space-between", overflow: "hidden" },
  featureTileTop: { flexDirection: "row", justifyContent: "space-between" },
  featureTileBadge: { width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(0,0,0,0.24)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  featureTileTitle: { color: "#fff6ea", fontSize: 18, fontWeight: "900" },
  featureTileSubtitle: { color: "#d1c4b4", fontSize: 12, lineHeight: 17 },
  heistTabsRow: { flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  heistTab: { flexGrow: 1, minWidth: 76, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: "#121419", borderWidth: 1, borderColor: "#2e323b", alignItems: "center" },
  heistTabActive: { backgroundColor: "#1f1820", borderColor: "#b08637" },
  heistTabLocked: { opacity: 0.5 },
  heistTabText: { color: "#c8bfae", fontSize: 12, fontWeight: "800" },
  heistTabTextActive: { color: "#f0c24d" },
  heistTabLockText: { color: "#9e9487", fontSize: 10, fontWeight: "700", marginTop: 4, textAlign: "center" },
  heistCard: { borderRadius: 20, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#2b2f38" },
  heistCardDisabled: { opacity: 0.5 },
  heistCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  heistCardTitleWrap: { flex: 1 },
  heistCardTitle: { color: "#fff6ea", fontSize: 16, fontWeight: "800", marginBottom: 4 },
  heistCardMeta: { color: "#ac9f8e", fontSize: 12 },
  heistReward: { color: "#7bffb3", fontSize: 13, fontWeight: "900" },
  heistInfoRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  heistInfoChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 999, backgroundColor: "#121419", borderWidth: 1, borderColor: "#2f333b" },
  heistInfoText: { color: "#f6efe6", fontSize: 12, fontWeight: "700" },
  heistActionButton: { paddingVertical: 12, borderRadius: 14, alignItems: "center", backgroundColor: "#241a12", borderWidth: 1, borderColor: "#7a5a26" },
  heistActionButtonDisabled: { opacity: 0.5 },
  heistActionText: { color: "#fff6ea", fontWeight: "900", fontSize: 13 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", alignItems: "center", justifyContent: "center", padding: 20 },
  resultModal: { width: "100%", maxWidth: 340, backgroundColor: "#121419", borderRadius: 24, padding: 20, borderWidth: 1, borderColor: "#3a3e47", gap: 14 },
  resultModalSuccess: { borderColor: "#3cbf75" },
  resultModalFailure: { borderColor: "#d95d71" },
  resultModalTitle: { color: "#fff6ea", fontSize: 20, fontWeight: "900", textAlign: "center" },
  resultModalMessage: { color: "#d9cfc1", fontSize: 14, lineHeight: 20, textAlign: "center" },
  resultModalButton: { alignSelf: "center", paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, backgroundColor: "#201712", borderWidth: 1, borderColor: "#7a5a26" },
  resultModalButtonText: { color: "#fff6ea", fontSize: 13, fontWeight: "900" },
  quickModalShell: { width: "100%", maxWidth: 420, maxHeight: "84%", backgroundColor: "#0d0f13", borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: "#2e323b" },
  quickModalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#23262d", backgroundColor: "#13161c" },
  quickModalTitle: { color: "#fff6ea", fontSize: 18, fontWeight: "900" },
  quickModalClose: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#1c2028" },
  quickModalScroll: { flexGrow: 0 },
  quickModalBody: { padding: 12 },
});
