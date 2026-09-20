import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { HeroPanel } from "../components/GameScreenPrimitives";
import {
  adjustAdminPlayerOnline,
  deleteAdminPlayerAccountOnline,
  fetchAdminAuditOnline,
  fetchAdminPlayerOnline,
  fetchAdminPlayersOnline,
  repairAdminPlayerOnline,
  resetAdminPlayerOnline,
  setAdminPlayerBanOnline,
} from "../game/api";

const EDIT_FIELDS = [
  ["cash", "Gotowka"],
  ["bank", "Bank"],
  ["premiumTokens", "Zetony premium"],
  ["hp", "HP"],
  ["energy", "Energia"],
  ["heat", "Heat"],
];

function Button({ label, onPress, danger = false, disabled = false }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[localStyles.button, danger && localStyles.buttonDanger, disabled && localStyles.disabled]}>
      <Text style={[localStyles.buttonText, danger && localStyles.buttonTextDanger]}>{label}</Text>
    </Pressable>
  );
}

export function AdminScreen({ token, styles, SectionCard, formatMoney }) {
  const [query, setQuery] = useState("");
  const [players, setPlayers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState(null);
  const [audit, setAudit] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const loadPlayers = useCallback(async (search = query) => {
    const result = await fetchAdminPlayersOnline(token, search.trim());
    setPlayers(result.players || []);
    return result.players || [];
  }, [query, token]);

  const loadDetail = useCallback(async (id) => {
    if (!id) return;
    const [playerResult, auditResult] = await Promise.all([
      fetchAdminPlayerOnline(token, id),
      fetchAdminAuditOnline(token, id),
    ]);
    setSelectedId(id);
    setDetail(playerResult.player || null);
    setAudit(auditResult.entries || []);
    const nextDrafts = {};
    EDIT_FIELDS.forEach(([field]) => { nextDrafts[field] = String(playerResult.player?.[field] ?? 0); });
    setDrafts(nextDrafts);
  }, [token]);

  useEffect(() => {
    let active = true;
    fetchAdminPlayersOnline(token).then((result) => {
      if (!active) return;
      const next = result.players || [];
      setPlayers(next);
      const firstTarget = next.find((entry) => !entry.isAdmin) || next[0];
      if (firstTarget) loadDetail(firstTarget.id).catch((nextError) => setError(nextError.message));
    }).catch((nextError) => setError(nextError.message));
    return () => { active = false; };
  }, [loadDetail, token]);

  const inventoryCount = useMemo(() => Object.values(detail?.inventory || {}).reduce((sum, value) => sum + Number(value || 0), 0), [detail]);
  const run = async (key, action) => {
    setBusy(key);
    setError("");
    try {
      await action();
      await Promise.all([loadPlayers(), loadDetail(selectedId)]);
    } catch (nextError) {
      setError(nextError.message || "Operacja administratora nie powiodla sie.");
    } finally {
      setBusy("");
    }
  };

  const confirm = (title, message, action, confirmLabel = "Potwierdz") => {
    if (Platform.OS === "web" && typeof globalThis.confirm === "function") {
      if (globalThis.confirm(`${title}\n\n${message}`)) action();
      return;
    }
    Alert.alert(title, message, [
      { text: "Anuluj", style: "cancel" },
      { text: confirmLabel, style: "destructive", onPress: action },
    ]);
  };

  const deleteSelectedAccount = async () => {
    if (!detail || detail.isAdmin) return;
    setBusy("delete");
    setError("");
    try {
      await deleteAdminPlayerAccountOnline(token, detail.username, reason);
      const next = await loadPlayers(query);
      const nextTarget = next.find((entry) => !entry.isAdmin) || next[0] || null;
      if (nextTarget) {
        await loadDetail(nextTarget.id);
      } else {
        setSelectedId("");
        setDetail(null);
        setAudit([]);
      }
      setReason("");
    } catch (nextError) {
      setError(nextError.message || "Usuwanie konta nie powiodlo sie.");
    } finally {
      setBusy("");
    }
  };

  return (
    <>
      <HeroPanel eyebrow="Administracja" title="Panel testow zewnetrznych" summary="Konta, stan gracza, naprawy i pelny audyt operacji w jednym miejscu." tone="danger" pills={[
        { label: "Konta", value: `${players.length}`, note: "Wynik aktualnego wyszukiwania.", tone: "info", icon: "account-group" },
        { label: "Audyt", value: `${audit.length}`, note: "Ostatnie operacje dla wybranego konta.", tone: "gold", icon: "clipboard-text-clock" },
      ]} />

      {error ? <View style={localStyles.error}><Text style={localStyles.errorText}>{error}</Text></View> : null}

      <SectionCard title="Gracze" subtitle="Wyszukaj login lub email, potem otworz szczegoly konta.">
        <View style={localStyles.searchRow}>
          <TextInput value={query} onChangeText={setQuery} onSubmitEditing={() => run("search", () => loadPlayers(query))} placeholder="Login lub email" placeholderTextColor="#777" style={localStyles.input} />
          <Button label={busy === "search" ? "Szukam..." : "Szukaj"} onPress={() => run("search", () => loadPlayers(query))} disabled={Boolean(busy)} />
        </View>
        <View style={localStyles.playerGrid}>
          {players.map((player) => (
            <Pressable key={player.id} onPress={() => loadDetail(player.id).catch((nextError) => setError(nextError.message))} style={[localStyles.playerCard, selectedId === player.id && localStyles.playerCardActive]}>
              <Text style={localStyles.playerName}>{player.username}{player.isAdmin ? " · ADMIN" : ""}</Text>
              <Text style={localStyles.meta}>RES {player.respect} · {formatMoney(player.cash + player.bank)} · {player.classId || "bez klasy"}</Text>
              <Text style={[localStyles.status, player.authDisabled && localStyles.statusDanger]}>{player.authDisabled ? "ZABLOKOWANY" : player.online ? "ONLINE" : "OFFLINE"}</Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>

      {detail ? (
        <>
          <SectionCard title={detail.username} subtitle={`ID ${detail.id} · rewizja ${detail.stateRevision}`}>
            <View style={localStyles.metricGrid}>
              <Text style={localStyles.metric}>Klasa: {detail.classId || "nie wybrana"}</Text>
              <Text style={localStyles.metric}>Gang: {detail.gang || "brak"}</Text>
              <Text style={localStyles.metric}>HP: {detail.hp}/{detail.maxHp}</Text>
              <Text style={localStyles.metric}>Energia: {detail.energy}/{detail.maxEnergy}</Text>
              <Text style={localStyles.metric}>Heat: {detail.heat}</Text>
              <Text style={localStyles.metric}>Ekwipunek: {inventoryCount} szt.</Text>
              <Text style={localStyles.metric}>Biznesy: {detail.businesses?.length || 0}</Text>
              <Text style={localStyles.metric}>Fabryki: {Object.keys(detail.factories || {}).length}</Text>
              <Text style={localStyles.metric}>Klub: {detail.club?.owned ? "wlasny" : "brak"}</Text>
              <Text style={localStyles.metric}>Plan: {detail.activePlan || "brak"}</Text>
              <Text style={localStyles.metric}>Operacja: {detail.activeOperation || "brak"}</Text>
              <Text style={localStyles.metric}>Rywal: {detail.activeRival || "brak"}</Text>
            </View>
            <TextInput value={reason} onChangeText={setReason} placeholder="Powod zmiany (opcjonalnie)" placeholderTextColor="#777" style={[localStyles.input, localStyles.reason]} />
          </SectionCard>

          <SectionCard title="Korekta stanu" subtitle="Ustaw konkretna wartosc. Backend pilnuje pol i bezpiecznych zakresow.">
            {EDIT_FIELDS.map(([field, label]) => (
              <View key={field} style={localStyles.editRow}>
                <Text style={localStyles.editLabel}>{label}</Text>
                <TextInput value={drafts[field] || ""} onChangeText={(value) => setDrafts((current) => ({ ...current, [field]: value }))} keyboardType="number-pad" style={[localStyles.input, localStyles.numberInput]} />
                <Button label={busy === field ? "..." : "Zapisz"} disabled={Boolean(busy) || detail.isAdmin} onPress={() => run(field, () => adjustAdminPlayerOnline(token, selectedId, field, Number(drafts[field]), reason))} />
              </View>
            ))}
          </SectionCard>

          <SectionCard title="Naprawy i dostep" subtitle="Operacje wysokiego ryzyka sa blokowane dla konta administratora i trafiaja do audytu.">
            <View style={localStyles.actions}>
              <Button label="Wyczysc aktywny plan" disabled={Boolean(busy) || detail.isAdmin} onPress={() => run("plan", () => repairAdminPlayerOnline(token, selectedId, "plan", reason))} />
              <Button label="Wyczysc aktywna operacje" disabled={Boolean(busy) || detail.isAdmin} onPress={() => run("operation", () => repairAdminPlayerOnline(token, selectedId, "operation", reason))} />
              <Button label={detail.authDisabled ? "Odblokuj konto" : "Zablokuj konto"} danger={!detail.authDisabled} disabled={Boolean(busy) || detail.isAdmin} onPress={() => confirm("Zmiana dostepu", `${detail.authDisabled ? "Odblokowac" : "Zablokowac"} konto ${detail.username}?`, () => run("ban", () => setAdminPlayerBanOnline(token, selectedId, !detail.authDisabled, reason)))} />
              <Button label="Resetuj caly postep" danger disabled={Boolean(busy) || detail.isAdmin} onPress={() => confirm("Reset postepu", `Przywrocic ${detail.username} do stanu nowego gracza?`, () => run("reset", () => resetAdminPlayerOnline(token, selectedId, reason)))} />
              <Button label={busy === "delete" ? "Usuwanie..." : "Usun konto na stale"} danger disabled={Boolean(busy) || detail.isAdmin} onPress={() => confirm("Usunac konto?", `Konto ${detail.username} i jego postep zostana trwale usuniete.`, deleteSelectedAccount, "Usun konto")} />
            </View>
          </SectionCard>

          <SectionCard title="Audyt" subtitle="Kto, kiedy i jaka operacje wykonal na tym koncie.">
            {audit.length ? audit.map((entry) => (
              <View key={entry.id} style={localStyles.auditRow}>
                <Text style={localStyles.auditTitle}>{entry.operation}</Text>
                <Text style={localStyles.meta}>{entry.adminUsername} · {new Date(entry.createdAt).toLocaleString("pl-PL")}</Text>
                {entry.reason ? <Text style={localStyles.auditReason}>{entry.reason}</Text> : null}
              </View>
            )) : <Text style={styles.emptyText}>Brak operacji administracyjnych dla tego konta.</Text>}
          </SectionCard>
        </>
      ) : null}
    </>
  );
}

const localStyles = StyleSheet.create({
  error: { borderWidth: 1, borderColor: "#7f3942", backgroundColor: "#241317", borderRadius: 14, padding: 12, marginBottom: 12 },
  errorText: { color: "#ffb7bf", fontWeight: "700" },
  searchRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  input: { minWidth: 180, flexGrow: 1, borderWidth: 1, borderColor: "#3b3e45", borderRadius: 12, backgroundColor: "#111318", color: "#f4efe8", paddingHorizontal: 12, paddingVertical: 10 },
  reason: { marginTop: 12 },
  button: { borderWidth: 1, borderColor: "#5f4b28", backgroundColor: "#241c0f", borderRadius: 12, paddingHorizontal: 13, paddingVertical: 10 },
  buttonDanger: { borderColor: "#7f3942", backgroundColor: "#241317" },
  buttonText: { color: "#f0c76b", fontSize: 12, fontWeight: "900" },
  buttonTextDanger: { color: "#ffb7bf" },
  disabled: { opacity: 0.42 },
  playerGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  playerCard: { minWidth: 210, flexGrow: 1, borderWidth: 1, borderColor: "#30343c", borderRadius: 14, backgroundColor: "#121419", padding: 12 },
  playerCardActive: { borderColor: "#d2a447", backgroundColor: "#1b1710" },
  playerName: { color: "#f4efe8", fontWeight: "900", fontSize: 14 },
  meta: { color: "#9f9890", fontSize: 11, marginTop: 4 },
  status: { color: "#8fdbad", fontSize: 10, fontWeight: "900", marginTop: 7 },
  statusDanger: { color: "#ff9da8" },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metric: { minWidth: 170, flexGrow: 1, color: "#d9d4cc", backgroundColor: "#121419", borderRadius: 10, padding: 10 },
  editRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 8 },
  editLabel: { color: "#d9d4cc", width: 120, fontWeight: "700" },
  numberInput: { minWidth: 120, flexGrow: 1 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  auditRow: { borderBottomWidth: 1, borderBottomColor: "#292c32", paddingVertical: 10 },
  auditTitle: { color: "#f0c76b", fontWeight: "900" },
  auditReason: { color: "#d9d4cc", marginTop: 5 },
});
