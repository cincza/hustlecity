import React from "react";
import { Pressable, Text, View } from "react-native";

export function MarketScreen({
  section,
  game,
  styles,
  SceneArtwork,
  SectionCard,
  EntityBadge,
  Tag,
  formatMoney,
  formatDuration,
  products,
  drugs,
  sceneBackgrounds,
  productVisuals,
  drugVisuals,
  systemVisuals,
  marketState,
  marketMeta,
  actions,
}) {
  // TODO: TO_MIGRATE_TO_SERVER market drug flow still executes local fallback actions from App.js.
  const safeGame = {
    player: { respect: 0, ...(game?.player || {}) },
    inventory: game?.inventory || {},
    market: game?.market || {},
    drugInventory: game?.drugInventory || {},
    dealerInventory: game?.dealerInventory || {},
    activeBoosts: Array.isArray(game?.activeBoosts) ? game.activeBoosts : [],
    ...game,
  };
  const safeMarketState = marketState || {};

  const getTrendLabel = (snapshot) => {
    if (!snapshot) return "Brak danych";
    if (snapshot.scarcity >= 0.28 || snapshot.demandPressure >= 0.35) return "Cena rosnie";
    if (snapshot.scarcity <= -0.18 || snapshot.demandPressure <= -0.25) return "Cena siada";
    return "Stabilnie";
  };

  const getSupplySourceLabel = (snapshot) => {
    if (!snapshot) return "Brak danych";
    if (snapshot.streetStock > 0 && snapshot.fallbackStock > 0) return "Ulica + NPC";
    if (snapshot.streetStock > 0) return "Tylko ulica";
    if (snapshot.fallbackStock > 0) return "Tylko fallback NPC";
    return "Pusto";
  };

  if (section === "street") {
    return (
      <>
        <SceneArtwork
          eyebrow="Handel"
          title="Miasto kupuje wszystko"
          lines={["Kupujesz, sprzedajesz i pilnujesz ruchu rynku."]}
          accent={["#372417", "#160f0c", "#050505"]}
          source={sceneBackgrounds.market}
        />
        <SectionCard title="Handel" subtitle="Ulica, fallback NPC i ceny na zywo.">
          <View style={styles.listCard}>
            <View style={styles.entityHead}>
              <EntityBadge visual={systemVisuals.market} />
              <View style={styles.flexOne}>
                <Text style={styles.listCardTitle}>Rynek miasta</Text>
                <Text style={styles.listCardMeta}>Szybki podglad cen, podazy i ruchu.</Text>
              </View>
            </View>
          </View>
          {products.map((product) => {
            const locked = safeGame.player.respect < product.unlockRespect;
            const buyPrice = safeGame.market[product.id] ?? product.basePrice ?? 0;
            const sellPrice = Math.floor(buyPrice * 0.85);
            const snapshot = safeMarketState?.[product.id];

            return (
              <View key={product.id} style={[styles.marketRow, locked && styles.listCardLocked]}>
                <View style={styles.entityHead}>
                  <EntityBadge visual={productVisuals[product.id]} />
                  <View style={styles.marketInfo}>
                    <Text style={styles.marketTitle}>{product.name}</Text>
                    <Text style={styles.marketMeta}>Wymaga {product.unlockRespect} szacunu | Na stanie: {safeGame.inventory[product.id] || 0}</Text>
                    <Text style={styles.marketMeta}>
                      Podaz: {snapshot?.streetStock ?? 0} ulica | {snapshot?.fallbackStock ?? 0} NPC | Zrodlo: {getSupplySourceLabel(snapshot)}
                    </Text>
                    <Text style={styles.marketMeta}>
                      Trend: {getTrendLabel(snapshot)} | NPC {formatMoney(snapshot?.fallbackPrice ?? buyPrice)} | Sell {formatMoney(snapshot?.sellPrice ?? sellPrice)}
                    </Text>
                  </View>
                </View>
                <View style={styles.marketPrices}>
                  <Text style={styles.marketPrice}>Kupno {formatMoney(buyPrice)}</Text>
                  <Text style={styles.marketPrice}>Sprzedaz {formatMoney(sellPrice)}</Text>
                </View>
                <View style={styles.marketButtons}>
                  <Pressable onPress={() => actions.buyProduct(product)} style={[styles.marketButton, locked && styles.tileDisabled]}>
                    <Text style={styles.marketButtonText}>Kup</Text>
                  </Pressable>
                  <Pressable onPress={() => actions.sellProduct(product)} style={styles.marketButton}>
                    <Text style={styles.marketButtonText}>Sprzedaj</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
          {marketMeta?.refreshedAt ? (
            <Text style={styles.listCardMeta}>
              Ostatni refresh rynku: {new Date(marketMeta.refreshedAt).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
            </Text>
          ) : null}
        </SectionCard>
      </>
    );
  }

  if (section === "drugs") {
    return (
      <>
        <SceneArtwork
          eyebrow="Diler"
          title="Towar schodzi, stan sie konczy"
          lines={["Kupujesz, sprzedajesz albo zarzucasz."]}
          accent={["#3a2617", "#16100c", "#050505"]}
          source={sceneBackgrounds.escort}
        />
        <SectionCard title="Towar" subtitle="Stan, cena i szybki obrot.">
          <View style={styles.listCard}>
            <View style={styles.entityHead}>
              <EntityBadge visual={systemVisuals.dealer} />
              <View style={styles.flexOne}>
                <Text style={styles.listCardTitle}>Diler i szybki obrot</Text>
                <Text style={styles.listCardMeta}>Towar na ulicy i w kieszeni.</Text>
              </View>
            </View>
          </View>
          {drugs.map((drug) => (
            <View key={drug.id} style={styles.listCard}>
              <View style={styles.listCardHeader}>
                <View style={styles.entityHead}>
                  <EntityBadge visual={drugVisuals[drug.id]} />
                  <View style={styles.flexOne}>
                    <Text style={styles.listCardTitle}>{drug.name}</Text>
                    <Text style={styles.listCardMeta}>
                      Przy Tobie: {safeGame.drugInventory[drug.id] || 0} | U dilera: {safeGame.dealerInventory?.[drug.id] || 0} | Ulica: {formatMoney(drug.streetPrice)}
                    </Text>
                  </View>
                </View>
                <Tag text={`OD ${Math.round(drug.overdoseRisk * 100)}%`} warning />
              </View>
              <View style={styles.oddsRow}>
                <View style={styles.oddsBlock}>
                  <Text style={styles.oddsLabel}>Stock dilera</Text>
                  <Text style={styles.oddsValue}>{safeGame.dealerInventory?.[drug.id] || 0}</Text>
                </View>
                <View style={styles.oddsBlock}>
                  <Text style={styles.oddsLabel}>Respekt od</Text>
                  <Text style={styles.oddsValue}>{drug.unlockRespect}</Text>
                </View>
              </View>
              <Text style={styles.listCardMeta}>
                Daje: {Object.entries(drug.effect).map(([key, value]) => `${key} +${value}`).join(" | ")} | Efekt trwa ok. {Math.round(drug.durationSeconds / 60)} min
              </Text>
              <View style={styles.marketButtons}>
                <Pressable
                  onPress={() => actions.buyDrugFromDealer(drug)}
                  style={[styles.marketButton, (safeGame.player.respect < drug.unlockRespect || (safeGame.dealerInventory?.[drug.id] || 0) <= 0) && styles.tileDisabled]}
                >
                  <Text style={styles.marketButtonText}>Kup od dilera</Text>
                </Pressable>
                <Pressable onPress={() => actions.sellDrugToDealer(drug)} style={[styles.marketButton, (safeGame.drugInventory[drug.id] || 0) <= 0 && styles.tileDisabled]}>
                  <Text style={styles.marketButtonText}>Sprzedaj dilerowi</Text>
                </Pressable>
                <Pressable onPress={() => actions.consumeDrug(drug)} style={[styles.marketButton, (safeGame.drugInventory[drug.id] || 0) <= 0 && styles.tileDisabled]}>
                  <Text style={styles.marketButtonText}>Zarzuc</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </SectionCard>
      </>
    );
  }

  return (
    <SectionCard title="Boosty" subtitle="Aktywne efekty na teraz.">
      <View style={styles.listCard}>
        <View style={styles.entityHead}>
          <EntityBadge visual={systemVisuals.energy} />
          <View style={styles.flexOne}>
            <Text style={styles.listCardTitle}>Boosty i aktywne efekty</Text>
            <Text style={styles.listCardMeta}>Co teraz pompuje staty i jak dlugo.</Text>
          </View>
        </View>
      </View>
      {!safeGame.activeBoosts.length ? <Text style={styles.emptyText}>Brak aktywnych efektow. Wszystko na sucho.</Text> : null}
      {safeGame.activeBoosts.map((boost) => (
        <View key={boost.id} style={styles.listCard}>
          <View style={styles.inlineRow}>
            <View style={styles.flexOne}>
              <Text style={styles.listCardTitle}>{boost.name}</Text>
              <Text style={styles.listCardMeta}>{Object.entries(boost.effect).map(([key, value]) => `${key} +${value}`).join(" | ")}</Text>
            </View>
            <Tag text={formatDuration((boost.expiresAt || Date.now()) - Date.now())} />
          </View>
        </View>
      ))}
    </SectionCard>
  );
}
