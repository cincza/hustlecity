import React from "react";
import { Pressable, Text, View } from "react-native";
import { QuickActionTile } from "../components/GameShellUI";
import { HeroPanel } from "../components/GameScreenPrimitives";

const QUICK_ACTION_IMAGES = {
  bank: require("../../assets/quick-icons/bank.png"),
  casino: require("../../assets/quick-icons/casino.png"),
  restaurant: require("../../assets/quick-icons/restaurant.png"),
  hospital: require("../../assets/quick-icons/hospital.png"),
  gym: require("../../assets/quick-icons/gym.png"),
};

export function HubScreen({
  styles,
  SceneArtwork,
  SectionCard,
  StatLine,
  sceneBackgrounds,
  systemVisuals,
  formatMoney,
  topTask,
  totalBusinessIncome,
  totalEscortIncome,
  onlinePlayerCount,
  focusDistrictSummary,
  hottestDistrictSummary,
  nextHeistTierLabel,
  criticalCareStatus,
  formatCooldown,
  actions,
}) {
  const quickActions = [
    { id: "quick-bank", title: "Bank", icon: "bank", image: QUICK_ACTION_IMAGES.bank, onPress: () => actions.openQuickAction("bank") },
    { id: "quick-casino", title: "Kasyno", icon: "casino", image: QUICK_ACTION_IMAGES.casino, onPress: () => actions.openQuickAction("casino") },
    { id: "quick-food", title: "Restauracja", icon: "food", image: QUICK_ACTION_IMAGES.restaurant, onPress: () => actions.openQuickAction("restaurant") },
    { id: "quick-hospital", title: "Szpital", icon: "hospital", image: QUICK_ACTION_IMAGES.hospital, onPress: () => actions.openQuickAction("hospital") },
    { id: "quick-gym", title: "Trening", icon: "training", image: QUICK_ACTION_IMAGES.gym, onPress: () => actions.openQuickAction("gym") },
  ];

  const criticalCareActive = Boolean(criticalCareStatus?.active);
  const criticalCareProtected = Boolean(criticalCareStatus?.protected);
  const [activePane, setActivePane] = React.useState("plan");
  const heroTitle = criticalCareActive
    ? "Najpierw wracaj na nogi"
    : topTask?.title || "Miasto czeka na ruch";
  const heroSummary = criticalCareActive
    ? `Jestes na ${criticalCareStatus?.mode?.label || "intensywnej terapii"} po ${criticalCareStatus?.source || "ostrej akcji"}.`
    : criticalCareProtected
      ? "Wrociles do gry i przez chwile masz oslone."
      : "Jedno spojrzenie i wiesz, gdzie wejsc po kolejny ruch.";
  const heroTone = criticalCareActive ? "danger" : criticalCareProtected ? "gold" : "gold";
  const nowCards = [
    {
      id: "hub-city",
      title: "Miasto",
      subtitle: focusDistrictSummary?.name
        ? `${focusDistrictSummary.name} jest teraz najlepszym frontem do pchania wplywu.`
        : "Sprawdz dzielnice, odbiory i szybkie wejscia.",
      highlight: focusDistrictSummary?.name || "Dzielnice",
      onPress: () => actions.openSection("city", "districts"),
    },
    {
      id: "hub-heists",
      title: "Skoki",
      subtitle: criticalCareActive
        ? "Wroc po wyjsciu ze szpitala."
        : `Szybkie roboty na terenie. Najblizszy sensowny prog: ${nextHeistTierLabel}.`,
      highlight: criticalCareActive ? "Szpital" : nextHeistTierLabel,
      onPress: () => actions.openSection("heists", "solo"),
    },
    {
      id: "hub-empire",
      title: "Imperium",
      subtitle: `${formatMoney(totalBusinessIncome)} / min z biznesu i ${formatMoney(totalEscortIncome)} / min z ulicy.`,
      highlight: formatMoney(totalBusinessIncome + totalEscortIncome),
      onPress: () => actions.openSection("empire", "businesses"),
    },
    {
      id: "hub-contracts",
      title: "Kontrakty",
      subtitle: criticalCareActive
        ? "Najpierw wyjdz ze szpitala i dopiero wracaj do grubszych robot."
        : "Trudniejszy loop z eq, autem i lepsza kasa niz zwykle napady.",
      highlight: criticalCareActive ? "Offline" : "Late-game",
      onPress: () => actions.openSection("heists", "contracts"),
    },
  ];

  return (
    <>
      <SectionCard title="Szybkie wejscia" subtitle="Najblizsze utility sa od razu pod reka.">
        <View style={styles.quickActionGrid}>
          {quickActions.map((action) => (
            <QuickActionTile key={action.id} icon={action.icon} image={action.image} title={action.title} onPress={action.onPress} />
          ))}
        </View>
      </SectionCard>

      <HeroPanel
        eyebrow={criticalCareActive ? "Stan krytyczny" : criticalCareProtected ? "Powrot do gry" : "Start"}
        title={heroTitle}
        summary={heroSummary}
        tone={heroTone}
        pills={[
          {
            label: criticalCareActive ? "Do wyjscia" : "Nastepny prog",
            value: criticalCareActive
              ? formatCooldown(criticalCareStatus?.remainingMs || 0)
              : nextHeistTierLabel,
            tone: criticalCareActive ? "danger" : "gold",
            icon: criticalCareActive ? "hospital-box-outline" : "lock-open-variant-outline",
          },
          {
            label: "Biznes / min",
            value: formatMoney(totalBusinessIncome),
            note: "Zaplecze i stale odbiory.",
            tone: "success",
            icon: "cash-multiple",
          },
          {
            label: "Ulica / min",
            value: formatMoney(totalEscortIncome),
            note: "Szybki obrot i ryzyko.",
            tone: "info",
            icon: "storefront-outline",
          },
          {
            label: "Najgorecej",
            value: hottestDistrictSummary?.name || "-",
            note: hottestDistrictSummary?.pressureLabel || "Spokojnie",
            tone: criticalCareActive ? "danger" : "neutral",
            icon: "alert-outline",
          },
        ]}
        primaryAction={{
          label: criticalCareActive ? "Otworz szpital" : "Wejdz do miasta",
          meta: criticalCareActive ? "Leczenie i szybki powrot." : "Dzielnice, uslugi i glowny front miasta.",
          onPress: () => actions.openSection("city", criticalCareActive ? "hospital" : "districts"),
        }}
        secondaryAction={{
          label: "Profil i status",
          meta: "Misje, wiadomosci i staty postaci.",
          onPress: () => actions.openSection("profile", "summary"),
        }}
      />

      <View style={styles.planChipRow}>
        <Pressable onPress={() => setActivePane("plan")} style={[styles.planChip, activePane === "plan" && styles.planChipActive]}>
          <Text style={[styles.planChipText, activePane === "plan" && styles.planChipTextActive]}>Ruch</Text>
        </Pressable>
        <Pressable onPress={() => setActivePane("city")} style={[styles.planChip, activePane === "city" && styles.planChipActive]}>
          <Text style={[styles.planChipText, activePane === "city" && styles.planChipTextActive]}>Miasto</Text>
        </Pressable>
        <Pressable onPress={() => setActivePane("social")} style={[styles.planChip, activePane === "social" && styles.planChipActive]}>
          <Text style={[styles.planChipText, activePane === "social" && styles.planChipTextActive]}>Social</Text>
        </Pressable>
      </View>

      {activePane === "plan" ? (
        <SectionCard title="Teraz" subtitle="Cztery wejcia, szybko do zeskanowania i bez wielkich kafli.">
          {nowCards.map((card) => (
            <Pressable key={card.id} onPress={card.onPress} style={styles.listCard}>
              <View style={[styles.listCardHeader, { marginBottom: 0 }]}>
                <View style={styles.flexOne}>
                  <Text style={styles.listCardTitle}>{card.title}</Text>
                  <Text style={styles.listCardMeta}>{card.subtitle}</Text>
                </View>
                <Text style={styles.listCardReward}>{card.highlight}</Text>
              </View>
            </Pressable>
          ))}
        </SectionCard>
      ) : null}

      {activePane === "city" ? (
        <SectionCard title="Puls miasta" subtitle="Krotki status frontu i ekonomii.">
          <StatLine label="Fokus miasta" value={focusDistrictSummary?.name || "-"} visual={systemVisuals.gang} />
          <StatLine label="Najgorecej" value={`${hottestDistrictSummary?.name || "-"} | ${hottestDistrictSummary?.pressureLabel || "-"}`} visual={systemVisuals.heat} />
          <StatLine label="Biznes / min" value={formatMoney(totalBusinessIncome)} visual={systemVisuals.bank} />
          <StatLine label="Ulica / min" value={formatMoney(totalEscortIncome)} visual={systemVisuals.street} />
        </SectionCard>
      ) : null}

      {activePane === "social" ? (
        <SectionCard title="Social i status" subtitle="Misje, gracze i szybki kontakt z ekipa.">
          <StatLine label="Aktywna misja" value={topTask?.title || "Brak"} visual={systemVisuals.respect} />
          <StatLine label="Gracze online" value={`${onlinePlayerCount || 0}`} visual={systemVisuals.gang} />
          <View style={styles.inlineRow}>
            <Pressable onPress={() => actions.openSection("profile", "tasks")} style={styles.inlineButton}>
              <Text style={styles.inlineButtonText}>Misje</Text>
            </Pressable>
            <Pressable onPress={() => actions.openSection("profile", "players")} style={styles.inlineButton}>
              <Text style={styles.inlineButtonText}>Gracze</Text>
            </Pressable>
            <Pressable onPress={() => actions.openSection("profile", "rankings")} style={styles.inlineButton}>
              <Text style={styles.inlineButtonText}>Rankingi</Text>
            </Pressable>
            <Pressable onPress={() => actions.openSection("profile", "messages")} style={styles.inlineButton}>
              <Text style={styles.inlineButtonText}>Chat</Text>
            </Pressable>
          </View>
        </SectionCard>
      ) : null}
    </>
  );
}
