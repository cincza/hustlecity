import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { USE_NATIVE_DRIVER, WEB_POINTER_EVENTS_NONE_STYLE, createShadowStyle } from "../utils/uiEffects";
import { getRestaurantAllowance, getRestaurantQuote } from "../../shared/restaurant.js";

import { Pressable, Text } from "../i18n";
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
  quote,
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
        Animated.timing(glow, { toValue: 1, duration: 150, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(glow, { toValue: 0, duration: 320, useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
      Animated.sequence([
        Animated.timing(scale, { toValue: 0.985, duration: 80, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(scale, { toValue: 1, friction: 5, tension: 125, useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
      Animated.sequence([
        Animated.timing(burstOpacity, { toValue: 1, duration: 130, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.delay(110),
        Animated.timing(burstOpacity, { toValue: 0, duration: 210, useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
      Animated.timing(burstLift, { toValue: -16, duration: 420, useNativeDriver: USE_NATIVE_DRIVER }),
    ]);

    animation.start();
    return () => animation.stop();
  }, [feedbackToken, burstLift, burstOpacity, glow, scale]);

  const gradient = FOOD_GRADIENTS_BY_ID[meal.id] || FOOD_GRADIENTS_BY_ID.burger;
  const iconName = FOOD_ICON_BY_ID[meal.id] || "food-outline";

  return (
    <Animated.View style={[styles.cardWrap, { transform: [{ scale }] }]}>
      <LinearGradient colors={gradient} style={styles.card}>
        <Animated.View
          pointerEvents={USE_NATIVE_DRIVER ? "none" : undefined}
          style={[styles.cardGlow, WEB_POINTER_EVENTS_NONE_STYLE, { opacity: glow }]}
        />
        <Animated.View
          pointerEvents={USE_NATIVE_DRIVER ? "none" : undefined}
          style={[
            styles.burstWrap,
            WEB_POINTER_EVENTS_NONE_STYLE,
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
              <Text style={styles.cardMeta}>{quote.energyGain > 0 ? `+${quote.energyGain} EN · ${formatMoney(quote.cost)}` : "Chwilowo niedostępne"}</Text>
            </View>
          </View>
          {highlightedLabel && !quote.error && !compact ? <MealBadge text={highlightedLabel} tone={highlightTone} /> : null}
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel={`Zjedz: ${meal.name}`} onPress={() => onEat(meal)} disabled={busy || Boolean(quote.error)} style={[styles.actionButton, (busy || quote.error) && styles.actionButtonBusy]}>
          <Text style={styles.actionButtonText}>{busy ? "Zamawianie…" : quote.error || "Zjedz"}</Text>
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
  player,
  onEat,
}) {
  const { width } = useWindowDimensions();
  const compact = width < 410;
  const [busyMealId, setBusyMealId] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [now, setNow] = useState(Date.now());
  const pending = useRef(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const profile = player || { energy, maxEnergy, cash: 0 };
  const currentTime = Math.max(now, Date.now());
  const allowance = getRestaurantAllowance(profile, currentTime);
  const bestDealId = useMemo(() => getBestDealId(restaurantItems), [restaurantItems]);
  const fastestChargeId = useMemo(() => getFastestChargeId(restaurantItems), [restaurantItems]);

  const handleEat = async (meal) => {
    if (pending.current) return;
    pending.current = true;
    setError("");
    setBusyMealId(meal.id);
    try {
      const result = await onEat?.(meal);
      if (result && typeof result === "object" && result.energyGain > 0) {
        const energyGain = Math.max(0, Number(result.energyGain || 0));
        setFeedback({
          id: Date.now(),
          mealId: meal.id,
          text: energyGain > 0 ? `+${energyGain} energii` : "Pelny bak",
        });
      }
    } catch (err) { setError(err?.message || "Nie udało się zamówić. Spróbuj ponownie."); }
    finally {
      pending.current = false;
      setBusyMealId("");
    }
  };

  return (
    <SectionCard title="Restauracja" subtitle="Jedz i wracaj do roboty.">
      <View style={[styles.sectionLead, compact && styles.sectionLeadCompact]}>
        <View style={styles.energyPill}>
          <MaterialCommunityIcons name="lightning-bolt" size={14} color="#ffca59" />
          <Text style={styles.energyPillText}>Energia: {energy} / {maxEnergy}</Text>
        </View>
      </View>

      {allowance.remaining > 0 ? <Text style={styles.leadText}>
        Posiłki: jeszcze {allowance.remaining}/{allowance.limit} EN.
        {allowance.resetsAt ? ` Odnowienie za ${Math.ceil((allowance.resetsAt - currentTime) / 60000)} min.` : " Limit odnawia się godzinę po pierwszym posiłku."}
        {" Płacisz tylko za otrzymaną energię."}
      </Text> : null}
      {energy >= maxEnergy || allowance.remaining <= 0 || Number(profile.jailUntil || 0) > currentTime ? <View style={styles.unavailable}>
        <Text style={styles.cardTitle}>{Number(profile.jailUntil || 0) > currentTime ? "Wróć po wyjściu z aresztu" : energy >= maxEnergy ? "Masz pełną energię" : "Przerwa między posiłkami"}</Text>
        <Text style={styles.leadText}>{energy >= maxEnergy ? "Nie musisz teraz jeść. Zachowaj gotówkę na kolejną sesję." : allowance.remaining <= 0 ? `Kolejne ${allowance.limit} EN z jedzenia za ${Math.max(1, Math.ceil((allowance.resetsAt - currentTime) / 60000))} min. W tym czasie energia regeneruje się naturalnie.` : "Posiłki będą dostępne po opuszczeniu aresztu."}</Text>
      </View> : <View style={styles.list}>
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
              quote={getRestaurantQuote(profile, meal, currentTime)}
              formatMoney={formatMoney}
              onEat={handleEat}
              highlightedLabel={highlight?.label}
              highlightTone={highlight?.tone}
              busy={Boolean(busyMealId)}
              compact={compact}
              feedbackToken={feedback?.mealId === meal.id ? feedback.id : null}
              feedbackText={feedback?.mealId === meal.id ? feedback.text : ""}
            />
          );
        })}
      </View>}
      {error ? <Text accessibilityLiveRegion="polite" style={styles.leadText}>{error}</Text> : null}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  unavailable: { padding: 16, borderWidth: 1, borderColor: "#57472d", borderRadius: 14, backgroundColor: "#19150e", marginTop: 12 },
  sectionLead: {
    flexDirection: "row",
    flexWrap: "wrap",
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
    padding: 12,
    gap: 8,
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
    ...createShadowStyle({
      color: "#d8a94c",
      opacity: 0.18,
      radius: 12,
      offsetY: 4,
    }),
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
