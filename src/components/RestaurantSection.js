import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const FOOD_ICON_BY_ID = {
  burger: "hamburger",
  kebab: "food",
  meal: "silverware-fork-knife",
  energybox: "food-takeout-box-outline",
};

const FOOD_GRADIENTS_BY_ID = {
  burger: ["rgba(38,26,18,0.98)", "rgba(16,12,10,0.98)"],
  kebab: ["rgba(31,24,16,0.98)", "rgba(14,11,9,0.98)"],
  meal: ["rgba(19,30,26,0.98)", "rgba(10,15,13,0.98)"],
  energybox: ["rgba(18,24,35,0.98)", "rgba(9,12,17,0.98)"],
};

function getBestDealId(items) {
  return [...items]
    .sort((left, right) => {
      const leftRate = Number(left?.energy || 0) / Math.max(1, Number(left?.price || 1));
      const rightRate = Number(right?.energy || 0) / Math.max(1, Number(right?.price || 1));
      return rightRate - leftRate;
    })[0]?.id;
}

function getFastestChargeId(items) {
  return [...items].sort((left, right) => Number(right?.energy || 0) - Number(left?.energy || 0))[0]?.id;
}

function MealBadge({ text, tone = "gold" }) {
  const palette =
    tone === "success"
      ? { backgroundColor: "rgba(104, 194, 138, 0.12)", borderColor: "rgba(104, 194, 138, 0.22)", color: "#b8f1cc" }
      : { backgroundColor: "rgba(221, 179, 109, 0.14)", borderColor: "rgba(221, 179, 109, 0.22)", color: "#ffe0a1" };

  return (
    <View style={[styles.badge, { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor }]}>
      <Text style={[styles.badgeText, { color: palette.color }]}>{text}</Text>
    </View>
  );
}

function MealCard({
  meal,
  formatMoney,
  onEat,
  highlightedLabel,
  highlightTone,
  busy,
  feedbackToken,
  feedbackText,
  compact,
}) {
  const glow = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const burstOpacity = useRef(new Animated.Value(0)).current;
  const burstLift = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (!feedbackToken) return undefined;

    glow.setValue(0);
    scale.setValue(1);
    burstOpacity.setValue(0);
    burstLift.setValue(10);

    const animation = Animated.parallel([
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(scale, { toValue: 0.985, duration: 80, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 5, tension: 125, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(burstOpacity, { toValue: 1, duration: 130, useNativeDriver: true }),
        Animated.delay(110),
        Animated.timing(burstOpacity, { toValue: 0, duration: 210, useNativeDriver: true }),
      ]),
      Animated.timing(burstLift, { toValue: -16, duration: 420, useNativeDriver: true }),
    ]);

    animation.start();
    return () => animation.stop();
  }, [feedbackToken, burstLift, burstOpacity, glow, scale]);

  const gradient = FOOD_GRADIENTS_BY_ID[meal.id] || FOOD_GRADIENTS_BY_ID.burger;
  const iconName = FOOD_ICON_BY_ID[meal.id] || "food-outline";

  return (
    <Animated.View style={[styles.cardWrap, { transform: [{ scale }] }]}>
      <LinearGradient colors={gradient} style={styles.card}>
        <Animated.View pointerEvents="none" style={[styles.cardGlow, { opacity: glow }]} />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.burstWrap,
            {
              opacity: burstOpacity,
              transform: [{ translateY: burstLift }],
            },
          ]}
        >
          <Text style={styles.burstText}>{feedbackText}</Text>
        </Animated.View>

        <View style={styles.cardTop}>
          <View style={styles.cardIdentity}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name={iconName} size={compact ? 18 : 20} color="#f0c77a" />
            </View>
            <View style={styles.copyWrap}>
              <Text style={styles.cardTitle}>{meal.name}</Text>
              <Text style={styles.cardMeta}>+{meal.energy} energii</Text>
            </View>
          </View>
          {highlightedLabel ? <MealBadge text={highlightedLabel} tone={highlightTone} /> : null}
        </View>

        <View style={styles.valueRow}>
          <View style={styles.valueChip}>
            <MaterialCommunityIcons name="lightning-bolt" size={14} color="#ffcb5c" />
            <Text style={styles.valueChipText}>+{meal.energy} EN</Text>
          </View>
          <View style={styles.valueChip}>
            <MaterialCommunityIcons name="cash-multiple" size={14} color="#9fe0b1" />
            <Text style={styles.valueChipText}>{formatMoney(meal.price)}</Text>
          </View>
        </View>

        <Pressable onPress={() => onEat(meal)} disabled={busy} style={[styles.actionButton, busy && styles.actionButtonBusy]}>
          <Text style={styles.actionButtonText}>{busy ? "Chwila..." : `Zjedz - ${formatMoney(meal.price)}`}</Text>
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}

export function RestaurantSection({
  SectionCard,
  restaurantItems,
  formatMoney,
  energy,
  maxEnergy,
  onEat,
}) {
  const { width } = useWindowDimensions();
  const compact = width < 410;
  const [busyMealId, setBusyMealId] = useState("");
  const [feedback, setFeedback] = useState(null);
  const bestDealId = useMemo(() => getBestDealId(restaurantItems), [restaurantItems]);
  const fastestChargeId = useMemo(() => getFastestChargeId(restaurantItems), [restaurantItems]);

  const handleEat = async (meal) => {
    if (busyMealId) return;
    setBusyMealId(meal.id);
    try {
      const result = await onEat?.(meal);
      if (result && typeof result === "object") {
        const energyGain = Math.max(0, Number(result.energyGain || 0));
        setFeedback({
          id: Date.now(),
          mealId: meal.id,
          text: energyGain > 0 ? `+${energyGain} energii` : "Pelny bak",
        });
      }
    } finally {
      setBusyMealId("");
    }
  };

  return (
    <SectionCard title="Restauracja" subtitle="Jedz i wracaj do roboty.">
      <View style={[styles.sectionLead, compact && styles.sectionLeadCompact]}>
        <View>
          <Text style={styles.leadEyebrow}>Szybkie doladowanie</Text>
          <Text style={styles.leadText}>Lap energie i wracaj na ulice bez zbednego klikania.</Text>
        </View>
        <View style={styles.energyPill}>
          <MaterialCommunityIcons name="lightning-bolt" size={14} color="#ffca59" />
          <Text style={styles.energyPillText}>Energia: {energy} / {maxEnergy}</Text>
        </View>
      </View>

      <View style={styles.list}>
        {restaurantItems.map((meal) => {
          const highlight =
            meal.id === bestDealId
              ? { label: "Najlepszy deal", tone: "gold" }
              : meal.id === fastestChargeId
                ? { label: "Szybki zastrzyk", tone: "success" }
                : null;

          return (
            <MealCard
              key={meal.id}
              meal={meal}
              formatMoney={formatMoney}
              onEat={handleEat}
              highlightedLabel={highlight?.label}
              highlightTone={highlight?.tone}
              busy={busyMealId === meal.id}
              compact={compact}
              feedbackToken={feedback?.mealId === meal.id ? feedback.id : null}
              feedbackText={feedback?.mealId === meal.id ? feedback.text : ""}
            />
          );
        })}
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  sectionLead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 14,
  },
  sectionLeadCompact: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  leadEyebrow: {
    color: "#e0b868",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  leadText: {
    color: "#bfb6a8",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  energyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 202, 89, 0.2)",
    backgroundColor: "rgba(31, 24, 16, 0.92)",
  },
  energyPillText: {
    color: "#ffe8b7",
    fontSize: 11,
    fontWeight: "800",
  },
  list: {
    gap: 12,
  },
  cardWrap: {
    borderRadius: 20,
  },
  card: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(228, 183, 98, 0.16)",
    padding: 14,
    gap: 12,
  },
  cardGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    backgroundColor: "rgba(255, 200, 86, 0.1)",
  },
  burstWrap: {
    position: "absolute",
    right: 14,
    top: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(76, 126, 92, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(183, 236, 199, 0.3)",
  },
  burstText: {
    color: "#f2fff4",
    fontSize: 11,
    fontWeight: "900",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  cardIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(11, 10, 10, 0.74)",
    borderWidth: 1,
    borderColor: "rgba(240, 199, 122, 0.18)",
  },
  copyWrap: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    color: "#fff4e2",
    fontSize: 17,
    fontWeight: "900",
  },
  cardMeta: {
    color: "#cdb79a",
    fontSize: 12,
    marginTop: 3,
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
  valueRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  valueChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(8, 9, 11, 0.66)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  valueChipText: {
    color: "#ede0cf",
    fontSize: 11,
    fontWeight: "800",
  },
  actionButton: {
    minHeight: 46,
    borderRadius: 15,
    backgroundColor: "#d8a94c",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 235, 192, 0.18)",
    shadowColor: "#d8a94c",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  actionButtonBusy: {
    opacity: 0.7,
  },
  actionButtonText: {
    color: "#1f1407",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
});
