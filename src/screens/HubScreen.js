import React from "react";
import { Pressable, Text, View } from "react-native";
import { HeroPanel } from "../components/GameScreenPrimitives";
import { getContextActions } from "../../shared/contextActions.js";
import SessionPlanBoard from "../components/SessionPlanBoard";

export function HubScreen({
  game,
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
  token,
  onUser,
}) {
  const quickActions = getContextActions(game, { criticalCare: criticalCareStatus?.active });
  const [busyAction, setBusyAction] = React.useState(null);
  const actionLock = React.useRef(false);
  const [showOverview, setShowOverview] = React.useState(false);
  async function activate(action) {
    if (actionLock.current) return;
    actionLock.current = true; setBusyAction(action.id);
    try {
      if (action.quick) actions.openQuickAction(action.quick);
      else if (action.action) await actions[action.action](action.amount);
      else actions.openSection(action.tab, action.section);
    } finally { actionLock.current = false; setBusyAction(null); }
  }

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
        : "Dobierz sprzęt i auto, żeby wejść w trudniejsze roboty z większą stawką.",
      highlight: criticalCareActive ? "Szpital" : "Sprzęt i auto",
      onPress: () => actions.openSection("heists", "contracts"),
    },
  ];

  return (
    <>
      <SessionPlanBoard game={game} token={token} onUser={onUser} onNavigate={actions.openSection} />
      <SectionCard title="Pod ręką" subtitle="Ruchy dobrane do Twojej sytuacji.">
        <View style={{ gap: 8 }}>
          {quickActions.map((action) => (
            <Pressable key={action.id} accessibilityRole="button" disabled={Boolean(busyAction)} onPress={() => activate(action)} style={[styles.listCard, { minHeight: 60, marginBottom: 0, padding: 12 }]}>
              <Text style={styles.listCardTitle}>{busyAction === action.id ? "Chwila…" : action.title}{action.amount ? ` · ${formatMoney(action.amount)}` : ""} ›</Text>
              <Text style={styles.listCardMeta}>{action.hint}</Text>
            </Pressable>
          ))}
          {!quickActions.length ? <Text style={styles.listCardMeta}>Nie masz pilnych spraw. Wybierz cel z Twojej drogi lub sprawdź miasto.</Text> : null}
        </View>
      </SectionCard>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: showOverview }} onPress={() => setShowOverview(!showOverview)} style={[styles.inlineButton, { minHeight: 44 }]}><Text style={styles.inlineButtonText}>{showOverview ? "Zwiń przegląd miasta ▴" : "Przegląd miasta i kontakty ▾"}</Text></Pressable>
      {showOverview ? <>
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
      </> : null}
    </>
  );
}
