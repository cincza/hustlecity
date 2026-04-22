import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const QUICK_AMOUNTS = [1000, 5000, 10000];

function sanitizeMoneyDraft(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function clampPresetAmount(amount, limit) {
  const safeLimit = Math.max(0, Math.floor(Number(limit || 0)));
  const safeAmount = Math.max(0, Math.floor(Number(amount || 0)));
  if (!safeLimit) return 0;
  return Math.min(safeAmount, safeLimit);
}

function getActionLabel(action) {
  return action === "withdraw" ? "Wyplac" : "Wplac";
}

function getAvailableAmount(action, cash, bank) {
  return action === "withdraw"
    ? Math.max(0, Math.floor(Number(bank || 0)))
    : Math.max(0, Math.floor(Number(cash || 0)));
}

export function BankTransferPanel({
  cash,
  bank,
  amountDraft,
  setAmountDraft,
  onDeposit,
  onWithdraw,
  formatMoney,
  recentTransfers = [],
  feedback = null,
}) {
  const { width } = useWindowDimensions();
  const compactLayout = width < 410;
  const [selectedAction, setSelectedAction] = useState("deposit");
  const bankScale = useRef(new Animated.Value(1)).current;
  const cashScale = useRef(new Animated.Value(1)).current;
  const bankBurstOpacity = useRef(new Animated.Value(0)).current;
  const bankBurstTranslate = useRef(new Animated.Value(6)).current;
  const cashBurstOpacity = useRef(new Animated.Value(0)).current;
  const cashBurstTranslate = useRef(new Animated.Value(6)).current;
  const availableMax = getAvailableAmount(selectedAction, cash, bank);
  const sanitizedDraft = sanitizeMoneyDraft(amountDraft);
  const parsedAmount = Math.max(0, Number.parseInt(sanitizedDraft || "0", 10) || 0);
  const transferLabel = selectedAction === "withdraw" ? "Ruch z sejfu na ulice" : "Ruch z ulicy do sejfu";
  const maxHint = selectedAction === "withdraw" ? "MAX bierze cale saldo banku" : "MAX bierze cala gotowke przy sobie";
  const canDeposit = Math.max(0, Number(cash || 0)) > 0;
  const canWithdraw = Math.max(0, Number(bank || 0)) > 0;
  const canDepositAmount = parsedAmount > 0 && canDeposit && parsedAmount <= Math.max(0, Number(cash || 0));
  const canWithdrawAmount = parsedAmount > 0 && canWithdraw && parsedAmount <= Math.max(0, Number(bank || 0));
  const amountTooHigh =
    parsedAmount > 0 &&
    ((selectedAction === "withdraw" && parsedAmount > Math.max(0, Number(bank || 0))) ||
      (selectedAction !== "withdraw" && parsedAmount > Math.max(0, Number(cash || 0))));

  const burstText = useMemo(() => {
    const amount = Math.max(0, Math.floor(Number(feedback?.amount || 0)));
    if (!amount) return "";
    return `${feedback?.type === "withdraw" ? "+" : "+"}${formatMoney(amount)}`;
  }, [feedback, formatMoney]);

  useEffect(() => {
    if (!feedback?.id || !Number(feedback?.amount || 0)) return undefined;

    const receivesBank = feedback.type === "deposit";
    const targetScale = receivesBank ? bankScale : cashScale;
    const supportScale = receivesBank ? cashScale : bankScale;
    const targetOpacity = receivesBank ? bankBurstOpacity : cashBurstOpacity;
    const targetTranslate = receivesBank ? bankBurstTranslate : cashBurstTranslate;

    targetScale.setValue(1);
    supportScale.setValue(1);
    targetOpacity.setValue(0);
    targetTranslate.setValue(8);

    const animation = Animated.parallel([
      Animated.sequence([
        Animated.timing(targetScale, {
          toValue: 1.045,
          duration: 110,
          useNativeDriver: true,
        }),
        Animated.spring(targetScale, {
          toValue: 1,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(supportScale, {
          toValue: 0.985,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(supportScale, {
          toValue: 1,
          friction: 6,
          tension: 110,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(targetOpacity, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.delay(120),
        Animated.timing(targetOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(targetTranslate, {
        toValue: -18,
        duration: 460,
        useNativeDriver: true,
      }),
    ]);

    animation.start();
    return () => animation.stop();
  }, [
    feedback?.id,
    feedback?.amount,
    feedback?.type,
    bankScale,
    cashScale,
    bankBurstOpacity,
    bankBurstTranslate,
    cashBurstOpacity,
    cashBurstTranslate,
  ]);

  const setPresetAmount = (amount) => {
    const nextAmount = clampPresetAmount(amount, availableMax);
    setAmountDraft(nextAmount > 0 ? String(nextAmount) : "");
  };

  const handleActionPress = (action) => {
    setSelectedAction(action);
    if (action === "withdraw") {
      onWithdraw?.();
      return;
    }
    onDeposit?.();
  };

  return (
    <View style={styles.wrap}>
      <View style={[styles.balanceRow, compactLayout && styles.balanceRowStacked]}>
        <Pressable onPress={() => setSelectedAction("deposit")} style={styles.balancePressable}>
          <Animated.View style={[styles.balanceCardWrap, { transform: [{ scale: cashScale }] }]}>
            <LinearGradient
              colors={selectedAction === "deposit" ? ["#221b13", "#120f0b"] : ["#1a1713", "#100f0d"]}
              style={[
                styles.balanceCard,
                styles.cashCard,
                selectedAction === "deposit" && styles.balanceCardActive,
              ]}
            >
              <View style={styles.balanceHeader}>
                <View style={styles.balanceLabelRow}>
                  <MaterialCommunityIcons name="cash-multiple" size={16} color="#ddb56d" />
                  <Text style={styles.balanceLabel}>Gotowka</Text>
                </View>
                <Text style={styles.balanceMeta}>Przy sobie</Text>
              </View>
              <Text style={styles.cashValue}>{formatMoney(cash)}</Text>
              <Text style={styles.balanceHint}>Tapnij, jesli chcesz szybko wplacic.</Text>
            </LinearGradient>
          </Animated.View>
        </Pressable>

        <Pressable onPress={() => setSelectedAction("withdraw")} style={styles.balancePressable}>
          <Animated.View style={[styles.balanceCardWrap, { transform: [{ scale: bankScale }] }]}>
            <LinearGradient
              colors={selectedAction === "withdraw" ? ["#2b2114", "#151008"] : ["#21190f", "#110d08"]}
              style={[
                styles.balanceCard,
                styles.bankCard,
                selectedAction === "withdraw" && styles.balanceCardActive,
              ]}
            >
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.burstChip,
                  {
                    opacity: bankBurstOpacity,
                    transform: [{ translateY: bankBurstTranslate }],
                  },
                ]}
              >
                <Text style={styles.burstChipText}>{feedback?.type === "deposit" ? burstText : ""}</Text>
              </Animated.View>
              <View style={styles.balanceHeader}>
                <View style={styles.balanceLabelRow}>
                  <MaterialCommunityIcons name="safe-square-outline" size={16} color="#f1cf8c" />
                  <Text style={styles.balanceLabel}>Saldo bankowe</Text>
                </View>
                <Text style={styles.balanceMeta}>Sejf</Text>
              </View>
              <Text style={styles.bankValue}>{formatMoney(bank)}</Text>
              <Text style={styles.balanceHint}>Tapnij, jesli chcesz szybko wyplacic.</Text>
            </LinearGradient>
          </Animated.View>
        </Pressable>
      </View>

      <LinearGradient colors={["#191511", "#100d09"]} style={styles.transferCard}>
        <View style={[styles.transferTop, compactLayout && styles.transferTopStacked]}>
          <View style={styles.transferTitleWrap}>
            <Text style={styles.transferTitle}>Ruchy kasy</Text>
            <Text style={styles.transferSubtitle}>{transferLabel}</Text>
          </View>
          <View style={styles.intentPill}>
            <MaterialCommunityIcons
              name={selectedAction === "withdraw" ? "arrow-top-right" : "arrow-down-left"}
              size={14}
              color="#f1cf8c"
            />
            <Text style={styles.intentPillText}>{selectedAction === "withdraw" ? "Wyplata" : "Wplata"}</Text>
          </View>
        </View>

        <View style={styles.inputShell}>
          <MaterialCommunityIcons
            name={selectedAction === "withdraw" ? "arrow-top-right" : "arrow-down-left"}
            size={18}
            color="#d8b067"
          />
          <TextInput
            value={sanitizedDraft}
            onChangeText={(text) => setAmountDraft(sanitizeMoneyDraft(text))}
            placeholder={selectedAction === "withdraw" ? "Ile wyplacasz" : "Ile wplacasz"}
            placeholderTextColor="#74685a"
            keyboardType="numeric"
            style={styles.input}
          />
        </View>

        <View style={[styles.quickRow, compactLayout && styles.quickRowWrapped]}>
          {QUICK_AMOUNTS.map((amount) => {
            const disabled = availableMax <= 0 || amount > availableMax;
            const active = parsedAmount === amount && amount > 0;
            return (
              <Pressable
                key={amount}
                onPress={() => setAmountDraft(String(amount))}
                style={[
                  styles.quickButton,
                  compactLayout && styles.quickButtonCompact,
                  active && styles.quickButtonActive,
                  disabled && styles.quickButtonDisabled,
                ]}
                disabled={disabled}
              >
                <Text style={[styles.quickButtonText, active && styles.quickButtonTextActive]}>{`+${Math.floor(amount / 1000)}k`}</Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => setPresetAmount(availableMax)}
            style={[
              styles.quickButton,
              compactLayout && styles.quickButtonCompact,
              styles.quickButtonMax,
              availableMax <= 0 && styles.quickButtonDisabled,
            ]}
            disabled={availableMax <= 0}
          >
            <Text style={styles.quickButtonText}>MAX</Text>
          </Pressable>
        </View>

        <Text style={styles.maxHint}>{maxHint}</Text>
        {amountTooHigh ? (
          <Text style={styles.limitHint}>
            {selectedAction === "withdraw" ? "Nie masz tyle w banku." : "Nie masz tyle gotowki przy sobie."}
          </Text>
        ) : null}

        <View style={[styles.actionRow, compactLayout && styles.actionRowStacked]}>
          <Pressable
            onPress={() => handleActionPress("deposit")}
            style={[
              styles.actionButton,
              styles.actionButtonDeposit,
              selectedAction === "deposit" && styles.actionButtonActive,
              !canDepositAmount && styles.actionButtonDisabled,
            ]}
            disabled={!canDepositAmount}
          >
            <View style={styles.actionButtonHead}>
              <MaterialCommunityIcons name="bank-transfer-in" size={18} color="#e9d7b2" />
              <Text style={styles.actionButtonTitle}>Wplac</Text>
            </View>
            <Text style={styles.actionButtonMeta}>Do sejfu</Text>
          </Pressable>

          <Pressable
            onPress={() => handleActionPress("withdraw")}
            style={[
              styles.actionButton,
              styles.actionButtonWithdraw,
              selectedAction === "withdraw" && styles.actionButtonActive,
              !canWithdrawAmount && styles.actionButtonDisabled,
            ]}
            disabled={!canWithdrawAmount}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.burstChip,
                styles.withdrawBurstChip,
                {
                  opacity: cashBurstOpacity,
                  transform: [{ translateY: cashBurstTranslate }],
                },
              ]}
            >
              <Text style={styles.burstChipText}>{feedback?.type === "withdraw" ? burstText : ""}</Text>
            </Animated.View>
            <View style={styles.actionButtonHead}>
              <MaterialCommunityIcons name="bank-transfer-out" size={18} color="#f5dac1" />
              <Text style={styles.actionButtonTitle}>Wyplac</Text>
            </View>
            <Text style={styles.actionButtonMeta}>Na ulice</Text>
          </Pressable>
        </View>

        {Array.isArray(recentTransfers) && recentTransfers.length ? (
          <View style={styles.activityWrap}>
            <Text style={styles.activityTitle}>Ostatnie ruchy</Text>
            {recentTransfers.slice(0, 3).map((entry) => (
              <View key={entry.id} style={styles.activityRow}>
                <View style={styles.activityMeta}>
                  <MaterialCommunityIcons
                    name={entry.type === "withdraw" ? "arrow-top-right" : "arrow-down-left"}
                    size={14}
                    color={entry.type === "withdraw" ? "#e8a995" : "#9fdfb3"}
                  />
                  <Text style={styles.activityLabel}>{getActionLabel(entry.type)}</Text>
                </View>
                <Text style={[styles.activityValue, entry.type === "withdraw" ? styles.activityValueNegative : styles.activityValuePositive]}>
                  {entry.type === "withdraw" ? `-${formatMoney(entry.amount)}` : `+${formatMoney(entry.amount)}`}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
    width: "100%",
    alignSelf: "stretch",
  },
  balanceRow: {
    flexDirection: "row",
    gap: 10,
  },
  balanceRowStacked: {
    flexDirection: "column",
  },
  balancePressable: {
    flex: 1,
    minWidth: 0,
  },
  balanceCardWrap: {
    flex: 1,
  },
  balanceCard: {
    minHeight: 134,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    overflow: "hidden",
  },
  cashCard: {
    borderColor: "rgba(214, 167, 94, 0.18)",
  },
  bankCard: {
    borderColor: "rgba(241, 200, 116, 0.26)",
    shadowColor: "rgba(241, 200, 116, 0.28)",
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  balanceCardActive: {
    borderColor: "rgba(241, 200, 116, 0.48)",
  },
  balanceHeader: {
    gap: 4,
  },
  balanceLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  balanceLabel: {
    color: "#f3e1bf",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  balanceMeta: {
    color: "#9d8a71",
    fontSize: 11,
    fontWeight: "700",
  },
  bankValue: {
    color: "#fff4d9",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 16,
    letterSpacing: 0.2,
  },
  cashValue: {
    color: "#f1e5d0",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 20,
  },
  balanceHint: {
    color: "#a39178",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 10,
  },
  burstChip: {
    position: "absolute",
    right: 12,
    top: 12,
    backgroundColor: "rgba(20,58,34,0.92)",
    borderWidth: 1,
    borderColor: "rgba(96,214,139,0.42)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  withdrawBurstChip: {
    top: 10,
    right: 10,
  },
  burstChipText: {
    color: "#dcffe7",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  transferCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(214, 167, 94, 0.18)",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  transferTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  transferTopStacked: {
    alignItems: "flex-start",
  },
  transferTitleWrap: {
    flex: 1,
    gap: 3,
  },
  transferTitle: {
    color: "#f5e7cb",
    fontSize: 16,
    fontWeight: "900",
  },
  transferSubtitle: {
    color: "#a6947b",
    fontSize: 12,
    lineHeight: 16,
  },
  intentPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(214, 167, 94, 0.18)",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  intentPillText: {
    color: "#f1cf8c",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  inputShell: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(214, 167, 94, 0.18)",
    backgroundColor: "rgba(255,255,255,0.03)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    color: "#fff2dc",
    fontSize: 20,
    fontWeight: "800",
    paddingVertical: 0,
  },
  quickRow: {
    flexDirection: "row",
    gap: 8,
  },
  quickRowWrapped: {
    flexWrap: "wrap",
  },
  quickButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(214, 167, 94, 0.18)",
    backgroundColor: "rgba(255,255,255,0.03)",
    justifyContent: "center",
    alignItems: "center",
  },
  quickButtonCompact: {
    flexBasis: "48%",
    flexGrow: 0,
  },
  quickButtonActive: {
    borderColor: "rgba(241, 200, 116, 0.42)",
    backgroundColor: "rgba(241, 193, 100, 0.08)",
  },
  quickButtonMax: {
    backgroundColor: "rgba(78, 124, 181, 0.14)",
    borderColor: "rgba(93, 143, 204, 0.26)",
  },
  quickButtonDisabled: {
    opacity: 0.45,
  },
  quickButtonText: {
    color: "#dbc39b",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  quickButtonTextActive: {
    color: "#ffe3ad",
  },
  maxHint: {
    color: "#8f826f",
    fontSize: 11,
    lineHeight: 14,
  },
  limitHint: {
    color: "#d69d8f",
    fontSize: 11,
    lineHeight: 14,
    marginTop: -4,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionRowStacked: {
    flexDirection: "column",
  },
  actionButton: {
    flex: 1,
    minHeight: 76,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: "center",
    gap: 6,
    overflow: "hidden",
  },
  actionButtonDeposit: {
    backgroundColor: "rgba(25,54,39,0.5)",
    borderColor: "rgba(78, 191, 123, 0.24)",
  },
  actionButtonWithdraw: {
    backgroundColor: "rgba(43,32,22,0.58)",
    borderColor: "rgba(222, 161, 99, 0.25)",
  },
  actionButtonActive: {
    shadowColor: "rgba(241, 200, 116, 0.2)",
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  actionButtonDisabled: {
    opacity: 0.45,
  },
  actionButtonHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButtonTitle: {
    color: "#f5e8cf",
    fontSize: 16,
    fontWeight: "900",
  },
  actionButtonMeta: {
    color: "#bba88e",
    fontSize: 12,
    fontWeight: "700",
  },
  activityWrap: {
    gap: 8,
    paddingTop: 2,
  },
  activityTitle: {
    color: "#d8bc8b",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  activityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(214, 167, 94, 0.12)",
    backgroundColor: "rgba(255,255,255,0.025)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  activityMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activityLabel: {
    color: "#d3c1a5",
    fontSize: 12,
    fontWeight: "700",
  },
  activityValue: {
    fontSize: 13,
    fontWeight: "900",
  },
  activityValuePositive: {
    color: "#91e0af",
  },
  activityValueNegative: {
    color: "#f1c08f",
  },
});
