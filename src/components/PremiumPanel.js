import React, { useEffect, useState } from "react";
import { View, Pressable, Linking, StyleSheet } from "react-native";
import { request } from "../game/api/client";
import { GANG_IDENTITIES } from "../../shared/premium.js";
import { getGangNetworkProgress } from "../../shared/gangIdentity.js";

import { Text } from "../i18n";
export default function PremiumPanel({ game, token, onUser, gangOnly = false }) {
  const [catalog, setCatalog] = useState(null), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    if (!gangOnly && token) request("/premium/catalog", { token }).then((data) => { if (active) setCatalog(data); }).catch(() => { if (active) setMessage("Nie udało się pobrać oferty żetonów."); });
    return () => { active = false; };
  }, [token, gangOnly]);
  async function act(path, body) {
    if (busy) return;
    setBusy(true); setMessage("");
    try {
      const result = await request(path, { token, method: body ? "POST" : "GET", ...(body ? { body } : {}) });
      if (result.user) onUser(result.user);
      if (result.url) { await Linking.openURL(result.url); setMessage("Po płatności wróć tutaj i sprawdź saldo. Żetony nalicza potwierdzenie operatora."); }
      else setMessage(result.result?.message || "Saldo odświeżone.");
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  const button = (label, onPress, disabled = false) => <Pressable accessibilityRole="button" disabled={busy || disabled} onPress={onPress} style={[styles.button, (busy || disabled) && { opacity: 0.4 }]}><Text style={styles.buttonText}>{label}</Text></Pressable>;
  const gang = game.gang || {}, network = gang.contactNetwork || {};
  const identity = GANG_IDENTITIES.find((c) => c.id === gang.identity?.selected) || GANG_IDENTITIES[0];
  const methods = new Set(Object.values(network.members || {}).flat()).size;
  const teamwork = getGangNetworkProgress(network);
  return <View style={styles.panel}>
    {!gangOnly && <>
      <Text style={styles.title}>Żetony · {game.player.premiumTokens || 0}</Text>
      <Text style={styles.text}>Zakupy są opcjonalne. Te same żetony zdobywasz za cele i tydzień kontaktów. Żaden pakiet nie zmienia statystyk, nagród ani limitów akcji.</Text>
      {catalog?.enabled ? catalog.packs.map((pack) => <View key={pack.id}>{button(pack.label, () => act("/premium/checkout", { packId: pack.id }))}</View>) : <Text style={styles.text}>{catalog ? "Płatności czekają na konfigurację operatora. Darmowe nagrody i usługi działają." : "Pobieranie oferty…"}</Text>}
      {button("Sprawdź saldo po płatności", () => act("/me"))}
      <Text style={styles.title}>Historia żetonów</Text>
      {(game.contacts?.walletHistory || []).slice(0, 6).map((entry, index) => <Text key={`${entry.at}-${index}`} style={styles.text}>{entry.delta > 0 ? "+" : ""}{entry.delta} · {entry.reason} · saldo {entry.balance}</Text>)}
      {!game.contacts?.walletHistory?.length && <Text style={styles.text}>Tu pojawią się otrzymane i wydane żetony.</Text>}
    </>}
    {gang.joined && <>
      <Text style={[styles.title, { color: identity.color }]}>{identity.mark} {gang.name} · {identity.name}</Text>
      <Text style={styles.text}>Każdy ma swoją robotę: {teamwork.progress}/3 uzupełniające się role · {Object.keys(network.members || {}).length} członków · {methods} metod. Każdy z trzech członków musi wnieść inną metodę przez umowę w dzielnicy gangu. {network.rewardedAt ? "Nagroda tygodnia odebrana." : "Do zdobycia $3600 do skarbca, wpływ i spadek presji."}</Text>
      <Text style={styles.text}>Miasto pamięta: {Math.min(3, gang.cityResponse?.memberIds?.length || 0)}/3 różnych członków rozwiązało sytuację w dzielnicy gangu. {gang.cityResponse?.rewardedAt ? "Wspólna reakcja zakończona." : "Nagroda: $3000 do skarbca, wpływ i mniejsza presja."}</Text>
      {gang.role === "Boss" ? <>
        <Text style={styles.text}>Znak należy do gangu. Płacisz osobistymi żetonami, raz; zmiana posiadanego znaku jest darmowa. Nie zwiększa siły ekipy.</Text>
        {GANG_IDENTITIES.map((item) => <View key={item.id}>{button(`${item.mark} ${item.name} · ${gang.identity?.owned?.includes(item.id) || item.cost === 0 ? "posiadany" : `${item.cost} żetony`}`, () => act("/gang/identity", { id: item.id }), gang.identity?.selected === item.id || (!gang.identity?.owned?.includes(item.id) && (game.player.premiumTokens || 0) < item.cost))}</View>)}
      </> : <Text style={styles.text}>Znak wybiera boss. Wspólny cel mogą realizować wszyscy członkowie.</Text>}
    </>}
    {!!message && <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text>}
  </View>;
}
const styles = StyleSheet.create({ panel: { gap: 10, backgroundColor: "#191d26", padding: 16, borderRadius: 12, marginVertical: 10 }, title: { color: "#f4c96a", fontSize: 18, fontWeight: "700" }, text: { color: "#bdc5d2", lineHeight: 21 }, message: { color: "#f4c96a", lineHeight: 21 }, button: { backgroundColor: "#e6c176", borderRadius: 8, padding: 12 }, buttonText: { color: "#171719", fontWeight: "700" } });
