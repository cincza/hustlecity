import React, { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export function AuthScreen({ busy = false, error = "", onLogin, onRegister }) {
  const [mode, setMode] = useState("login");
  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = () => {
    if (mode === "login") {
      onLogin?.({ login, password });
      return;
    }
    onRegister?.({ login, email, password });
  };

  return (
    <SafeAreaView style={styles.root}>
      <LinearGradient colors={["#050607", "#0f1116", "#171a20"]} style={styles.fill}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Hustle City</Text>
          <Text style={styles.title}>{mode === "login" ? "Wejdz do miasta" : "Stworz konto"}</Text>
          <Text style={styles.subtitle}>
            {mode === "login"
              ? "Zaloguj sie nickiem albo mailem i wbijaj do gry."
              : "Rejestracja tworzy nowe konto z wlasnym sejwem postaci."}
          </Text>

          <View style={styles.modeRow}>
            <Pressable onPress={() => setMode("login")} style={[styles.modeChip, mode === "login" && styles.modeChipActive]}>
              <Text style={[styles.modeChipText, mode === "login" && styles.modeChipTextActive]}>Logowanie</Text>
            </Pressable>
            <Pressable onPress={() => setMode("register")} style={[styles.modeChip, mode === "register" && styles.modeChipActive]}>
              <Text style={[styles.modeChipText, mode === "register" && styles.modeChipTextActive]}>Rejestracja</Text>
            </Pressable>
          </View>

          <TextInput
            value={login}
            onChangeText={setLogin}
            placeholder={mode === "login" ? "Nick lub email" : "Login, nick albo email"}
            placeholderTextColor="#77808c"
            style={styles.input}
            autoCapitalize="none"
          />
          {mode === "register" ? (
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email (opcjonalnie)"
              placeholderTextColor="#77808c"
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          ) : null}
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Haslo"
            placeholderTextColor="#77808c"
            style={styles.input}
            autoCapitalize="none"
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable onPress={submit} disabled={busy} style={[styles.button, busy && styles.buttonDisabled]}>
            <Text style={styles.buttonText}>{busy ? "Laduje..." : mode === "login" ? "Zaloguj" : "Zarejestruj"}</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050607" },
  fill: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  card: {
    width: "100%",
    maxWidth: 440,
    padding: 22,
    borderWidth: 1,
    borderColor: "#2f3440",
    backgroundColor: "rgba(8,10,14,0.94)",
    gap: 12,
  },
  eyebrow: { color: "#7ab6ff", fontSize: 12, textTransform: "uppercase", letterSpacing: 1.6, fontWeight: "800" },
  title: { color: "#f4efe8", fontSize: 30, fontWeight: "900" },
  subtitle: { color: "#a4aab6", fontSize: 13, lineHeight: 20 },
  modeRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  modeChip: { flex: 1, borderWidth: 1, borderColor: "#2c3240", paddingVertical: 10, alignItems: "center", backgroundColor: "#11151c" },
  modeChipActive: { borderColor: "#5eb0ff", backgroundColor: "#16202b" },
  modeChipText: { color: "#9ba4b2", fontWeight: "700" },
  modeChipTextActive: { color: "#eaf4ff" },
  input: {
    borderWidth: 1,
    borderColor: "#2d333d",
    backgroundColor: "#0e1218",
    color: "#f4efe8",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  button: { marginTop: 8, paddingVertical: 14, alignItems: "center", backgroundColor: "#2576d8", borderWidth: 1, borderColor: "#6bb3ff" },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: "#ffffff", fontSize: 15, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.6 },
  error: { color: "#ff8e9b", fontSize: 13, lineHeight: 18 },
});
