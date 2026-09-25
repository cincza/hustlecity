import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SUPPORTED_LANGUAGES, Text, useLanguage } from "../i18n";

export function LanguageSelector({ compact = false }) {
  const { language, setLanguage } = useLanguage();

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Text style={styles.label}>Język</Text>
      <View style={styles.row}>
        {SUPPORTED_LANGUAGES.map((entry) => {
          const active = entry.id === language;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              key={entry.id}
              onPress={() => setLanguage(entry.id)}
              style={[styles.button, compact && styles.buttonCompact, active && styles.buttonActive]}
            >
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.buttonText, active && styles.buttonTextActive]}>
                {compact ? entry.shortLabel : entry.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  wrapCompact: { alignItems: "flex-end" },
  label: { color: "#a4aab6", fontSize: 11, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  button: {
    minWidth: 68,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#343b48",
    borderRadius: 10,
    backgroundColor: "#10141b",
  },
  buttonCompact: { minWidth: 44, minHeight: 34, paddingHorizontal: 8, paddingVertical: 6 },
  buttonActive: { borderColor: "#66b8ff", backgroundColor: "#172536" },
  buttonText: { color: "#aeb6c3", fontSize: 12, fontWeight: "800" },
  buttonTextActive: { color: "#eff8ff" },
});

