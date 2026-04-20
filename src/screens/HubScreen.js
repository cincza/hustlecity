import React from "react";
import { Pressable, Text, View } from "react-native";
import { QuickActionTile } from "../components/GameShellUI";

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
  ActionTile,
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
    { id: "quick-food", title: "Jedzenie", icon: "food", image: QUICK_ACTION_IMAGES.restaurant, onPress: () => actions.openQuickAction("restaurant") },
    { id: "quick-hospital", title: "Szpital", icon: "hospital", image: QUICK_ACTION_IMAGES.hospital, onPress: () => actions.openQuickAction("hospital") },
    { id: "quick-gym", title: "Trening", icon: "training", image: QUICK_ACTION_IMAGES.gym, onPress: () => actions.openQuickAction("gym") },
  ];

  return (
    <>
      {criticalCareStatus?.active || criticalCareStatus?.protected ? (
        <SectionCard
          title={criticalCareStatus?.active ? "Stan krytyczny" : "Oslona po terapii"}
          subtitle={
            criticalCareStatus?.active
              ? `${criticalCareStatus?.mode?.label || "Intensywna terapia"} po ${criticalCareStatus?.source || "ostrej akcji"}.`
              : "Dopiero wyszedles ze szpitala i przez chwile masz spokoj."
          }
        >
          <StatLine
            label={criticalCareStatus?.active ? "Do wyjscia" : "Oslona"}
            value={formatCooldown(
              criticalCareStatus?.active
                ? criticalCareStatus?.remainingMs || 0
                : criticalCareStatus?.protectionRemainingMs || 0
            )}
            visual={systemVisuals.defense}
          />
          <StatLine
            label={criticalCareStatus?.active ? "Powrot" : "Status"}
            value={
              criticalCareStatus?.active
                ? `Okolo ${criticalCareStatus?.expectedRecoveryHp || 1} HP`
                : "PvP przeciwko Tobie jest chwilowo zablokowane"
            }
            visual={systemVisuals.heat}
          />
          <View style={styles.inlineRow}>
            <Pressable onPress={() => actions.openSection("city", "hospital")} style={styles.inlineButton}>
              <Text style={styles.inlineButtonText}>Szpital</Text>
            </Pressable>
            <Pressable onPress={() => actions.openSection("profile", "summary")} style={styles.inlineButton}>
              <Text style={styles.inlineButtonText}>Profil</Text>
            </Pressable>
          </View>
        </SectionCard>
      ) : null}

      <SectionCard title="Szybkie akcje" subtitle="Bank, stol, leczenie i trening sa od razu pod reka.">
        <View style={styles.quickActionGrid}>
          {quickActions.map((action) => (
            <QuickActionTile key={action.id} icon={action.icon} image={action.image} title={action.title} onPress={action.onPress} />
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Na teraz" subtitle="Krotki status progresu i dwa poboczne wejscia.">
        <StatLine label="Aktywna misja" value={topTask?.title || "Brak"} visual={systemVisuals.respect} />
        <StatLine label="Nastepny prog napadow" value={nextHeistTierLabel} visual={systemVisuals.heist} />
        <StatLine label="Biznes / min" value={formatMoney(totalBusinessIncome)} visual={systemVisuals.cash} />
        <StatLine label="Ulica / min" value={formatMoney(totalEscortIncome)} visual={systemVisuals.street} />
        <StatLine label="Fokus miasta" value={focusDistrictSummary?.name || "-"} visual={systemVisuals.gang} />
        <StatLine label="Najgorecej" value={`${hottestDistrictSummary?.name || "-"} | ${hottestDistrictSummary?.pressureLabel || "-"}`} visual={systemVisuals.heat} />
        <View style={styles.inlineRow}>
          <Pressable onPress={() => actions.openSection("profile", "tasks")} style={styles.inlineButton}>
            <Text style={styles.inlineButtonText}>Misje</Text>
          </Pressable>
          <Pressable onPress={() => actions.openSection("profile", "messages")} style={styles.inlineButton}>
            <Text style={styles.inlineButtonText}>Wiadomosci</Text>
          </Pressable>
          <Pressable onPress={actions.logout} style={styles.inlineButton}>
            <Text style={styles.inlineButtonText}>Wyloguj</Text>
          </Pressable>
        </View>
      </SectionCard>

      <SectionCard title="Miasto online" subtitle="Tutaj lapiesz ludzi, sprawdzasz topke i wchodzisz na globalny chat.">
        <StatLine label="Gracze w katalogu" value={`${onlinePlayerCount || 0}`} visual={systemVisuals.gang} />
        <View style={styles.inlineRow}>
          <Pressable onPress={() => actions.openSection("profile", "players")} style={styles.inlineButton}>
            <Text style={styles.inlineButtonText}>Gracze</Text>
          </Pressable>
          <Pressable onPress={() => actions.openSection("profile", "rankings")} style={styles.inlineButton}>
            <Text style={styles.inlineButtonText}>Rankingi</Text>
          </Pressable>
          <Pressable onPress={() => actions.openSection("profile", "citychat")} style={styles.inlineButton}>
            <Text style={styles.inlineButtonText}>Chat miasta</Text>
          </Pressable>
        </View>
      </SectionCard>
    </>
  );
}
