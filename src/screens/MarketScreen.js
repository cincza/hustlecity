import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { getDealerPayoutForDrug } from "../../shared/socialGameplay.js";
import { HeroPanel } from "../components/GameScreenPrimitives";

const CONTRACT_CATEGORY_LABELS = {
  weapon: "Bron",
  armor: "Ochrona",
  tool: "Narzedzia",
  electronics: "Elektronika",
  car: "Auta",
};

const DEALER_QUANTITY_PRESETS = [1, 5, 10, 25];

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
  contractItems,
  contractCars,
  contractState,
  contractCategoryVisuals,
  getContractAssetEffectLine,
  marketState,
  marketMeta,
  dealerTradeDraft,
  setDealerTradeDraft,
  actions,
}) {
  const safeGame = {
    player: { respect: 0, ...(game?.player || {}) },
    inventory: game?.inventory || {},
    market: game?.market || {},
    drugInventory: game?.drugInventory || {},
    dealerInventory: game?.dealerInventory || {},
    activeBoosts: Array.isArray(game?.activeBoosts) ? game.activeBoosts : [],
    contracts: game?.contracts || {},
    ...game,
  };
  const safeMarketState = marketState || {};
  const safeContractState = contractState || { ownedItems: {}, ownedCars: {}, loadout: {} };
  const safeContractItems = Array.isArray(contractItems) ? contractItems : [];
  const safeContractCars = Array.isArray(contractCars) ? contractCars : [];
  const contractCategories = useMemo(
    () => [...new Set(safeContractItems.map((item) => item.category).filter(Boolean))],
    [safeContractItems]
  );
  const [selectedContractCategory, setSelectedContractCategory] = useState(contractCategories[0] || "weapon");

  useEffect(() => {
    if (!contractCategories.includes(selectedContractCategory)) {
      setSelectedContractCategory(contractCategories[0] || "weapon");
    }
  }, [contractCategories, selectedContractCategory]);

  const parsedDealerTradeQuantity = Number.parseInt(String(dealerTradeDraft || "").replace(/[^\d]/g, ""), 10);
  const dealerTradeQuantity = Math.max(1, Number.isFinite(parsedDealerTradeQuantity) ? parsedDealerTradeQuantity : 1);
  const getContractCategoryLabel = (categoryId) => CONTRACT_CATEGORY_LABELS[categoryId] || categoryId;
  const getAssetTags = (asset) => Object.keys(asset?.tags || {}).filter(Boolean);

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

  if (section === "items") {
    const filteredItems = safeContractItems.filter((item) => item.category === selectedContractCategory);
    const ownedItemsCount = safeContractItems.filter((item) => safeContractState?.ownedItems?.[item.id]).length;
    return (
      <>
        <SceneArtwork
          eyebrow="Itemy"
          title="Sklep kontraktowy"
          lines={["Bron, ochrona, narzedzia i elektronika pod grubsze roboty."]}
          accent={["#3b2717", "#14100c", "#050505"]}
          source={sceneBackgrounds.market}
        />
        <HeroPanel
          eyebrow="Itemy"
          title="Sprzet pod Kontrakty"
          summary="Najpierw wybierasz kategorie, potem patrzysz czy dany item pasuje do tagow roboty. To ma byc czytelny sklep, nie smietnik z RPG."
          tone="gold"
          pills={[
            { label: "Kategorie", value: `${contractCategories.length}`, note: "Bron, ochrona, narzedzia i elektronika.", tone: "info", icon: "view-grid-outline" },
            { label: "Masz itemow", value: `${ownedItemsCount}`, note: "Kupione i gotowe do loadoutu.", tone: "success", icon: "briefcase-outline" },
            { label: "Slot teraz", value: selectedContractCategory === "weapon" ? "Bron" : selectedContractCategory === "armor" ? "Ochrona" : selectedContractCategory === "tool" ? "Narzedzia" : "Elektronika", note: `${filteredItems.length} pozycji w tej kategorii.`, tone: "neutral", icon: "tune" },
          ]}
        />
        <SectionCard title="Kategorie" subtitle="Najpierw wybierasz slot, potem sprzet pod konkretne tagi kontraktu.">
          <View style={styles.planChipRow}>
            {contractCategories.map((categoryId) => (
              <Pressable
                key={categoryId}
                onPress={() => setSelectedContractCategory(categoryId)}
                style={[styles.planChip, selectedContractCategory === categoryId && styles.planChipActive]}
              >
                <Text style={[styles.planChipText, selectedContractCategory === categoryId && styles.planChipTextActive]}>
                  {getContractCategoryLabel(categoryId)}
                </Text>
              </Pressable>
            ))}
          </View>
        </SectionCard>
        <SectionCard title="Oferta" subtitle="Kazdy item ma jedno glowne zadanie: poprawic szanse w konkretnym typie kontraktu.">
          {!filteredItems.length ? <Text style={styles.emptyText}>Brak itemow w tej kategorii.</Text> : null}
          {filteredItems.map((item) => {
            const owned = Boolean(safeContractState?.ownedItems?.[item.id]);
            const equipped = safeContractState?.loadout?.[item.category] === item.id;
            const locked = safeGame.player.respect < item.respect;
            const itemTags = getAssetTags(item);
            return (
              <View key={item.id} style={[styles.listCard, locked && styles.listCardLocked]}>
                <View style={styles.listCardHeader}>
                  <View style={styles.entityHead}>
                    <EntityBadge visual={contractCategoryVisuals[item.category]} />
                    <View style={styles.flexOne}>
                      <Text style={styles.listCardTitle}>{item.name}</Text>
                      <Text style={styles.listCardMeta}>
                        {item.summary}
                      </Text>
                    </View>
                  </View>
                  <Tag text={owned ? (equipped ? "ZALOZONE" : "MASZ") : `RES ${item.respect}`} warning={!owned} />
                </View>
                <View style={styles.oddsRow}>
                  <View style={styles.oddsBlock}>
                    <Text style={styles.oddsLabel}>Cena</Text>
                    <Text style={styles.oddsValue}>{formatMoney(item.price)}</Text>
                  </View>
                  <View style={styles.oddsBlock}>
                    <Text style={styles.oddsLabel}>Slot</Text>
                    <Text style={styles.oddsValue}>{getContractCategoryLabel(item.category)}</Text>
                  </View>
                  <View style={styles.oddsBlock}>
                    <Text style={styles.oddsLabel}>Tagi</Text>
                    <Text style={styles.oddsValue}>{itemTags.length ? itemTags.join(" / ") : "-"}</Text>
                  </View>
                </View>
                <Text style={styles.listCardMeta}>{getContractAssetEffectLine(item)}</Text>
                <View style={styles.marketButtons}>
                  <Pressable
                    onPress={() => actions.buyContractItem(item)}
                    style={[styles.marketButton, (owned || locked || safeGame.player.cash < item.price) && styles.tileDisabled]}
                  >
                    <Text style={styles.marketButtonText}>{owned ? "Kupione" : `Kup za ${formatMoney(item.price)}`}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => actions.equipContractAsset(item.category, equipped ? null : item.id)}
                    style={[styles.marketButton, !owned && styles.tileDisabled]}
                  >
                    <Text style={styles.marketButtonText}>{equipped ? "Zdejmij" : "Zaloz"}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </SectionCard>
      </>
    );
  }

  if (section === "cars") {
    return (
      <>
        <SceneArtwork
          eyebrow="Auta"
          title="Garaz kontraktowy"
          lines={["Rozne fury pasuja do roznych robot: escape, cargo albo ciche zejscie z miasta."]}
          accent={["#2d2438", "#100f16", "#050505"]}
          source={sceneBackgrounds.city}
        />
        <HeroPanel
          eyebrow="Auta"
          title="Garaz pod kontrakty"
          summary="Auta robia glownie pod ucieczke, cargo i stealth. Tu tez nie ma jednego najlepszego wyboru pod wszystko."
          tone="info"
          pills={[
            { label: "Modele", value: `${safeContractCars.length}`, note: "Rozne profile pod escape i cargo.", tone: "info", icon: "car-sports" },
            { label: "Masz w garazu", value: `${safeContractCars.filter((car) => safeContractState?.ownedCars?.[car.id]).length}`, note: "Kupione fury pod loadout.", tone: "success", icon: "garage" },
            { label: "Wybrane auto", value: safeContractCars.find((car) => car.id === safeContractState?.loadout?.car)?.name || "Brak", note: "Aktywne tylko jedno auto naraz.", tone: "gold", icon: "key-variant" },
          ]}
        />
        <SectionCard title="Oferta aut" subtitle="Auto robi glownie pod kontrakt. Nie jest globalnym buffem do calej gry.">
          {safeContractCars.map((car) => {
            const owned = Boolean(safeContractState?.ownedCars?.[car.id]);
            const equipped = safeContractState?.loadout?.car === car.id;
            const locked = safeGame.player.respect < car.respect;
            const carTags = getAssetTags(car);
            return (
              <View key={car.id} style={[styles.listCard, locked && styles.listCardLocked]}>
                <View style={styles.listCardHeader}>
                  <View style={styles.entityHead}>
                    <EntityBadge visual={contractCategoryVisuals.car} />
                    <View style={styles.flexOne}>
                      <Text style={styles.listCardTitle}>{car.name}</Text>
                      <Text style={styles.listCardMeta}>{car.summary}</Text>
                    </View>
                  </View>
                  <Tag text={owned ? (equipped ? "W LOADOUCIE" : "GARAZ") : `RES ${car.respect}`} warning={!owned} />
                </View>
                <View style={styles.oddsRow}>
                  <View style={styles.oddsBlock}>
                    <Text style={styles.oddsLabel}>Cena</Text>
                    <Text style={styles.oddsValue}>{formatMoney(car.price)}</Text>
                  </View>
                  <View style={styles.oddsBlock}>
                    <Text style={styles.oddsLabel}>Rola</Text>
                    <Text style={styles.oddsValue}>Auto</Text>
                  </View>
                  <View style={styles.oddsBlock}>
                    <Text style={styles.oddsLabel}>Tagi</Text>
                    <Text style={styles.oddsValue}>{carTags.length ? carTags.join(" / ") : "-"}</Text>
                  </View>
                </View>
                <Text style={styles.listCardMeta}>{getContractAssetEffectLine(car)}</Text>
                <View style={styles.marketButtons}>
                  <Pressable
                    onPress={() => actions.buyContractCar(car)}
                    style={[styles.marketButton, (owned || locked || safeGame.player.cash < car.price) && styles.tileDisabled]}
                  >
                    <Text style={styles.marketButtonText}>{owned ? "Kupione" : `Kup za ${formatMoney(car.price)}`}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => actions.equipContractAsset("car", equipped ? null : car.id)}
                    style={[styles.marketButton, !owned && styles.tileDisabled]}
                  >
                    <Text style={styles.marketButtonText}>{equipped ? "Zdejmij" : "Wybierz"}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </SectionCard>
      </>
    );
  }

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
        <HeroPanel
          eyebrow="Towar"
          title="Rynek miasta"
          summary="To jest czysty handel: patrzysz na trend, stock i ceny, a potem decydujesz czy kupujesz czy cashoutujesz. Bez mieszania z klubem."
          tone="info"
          pills={[
            { label: "Produkty", value: `${products.length}`, note: "Towary zalezne od podazy ulicy i fallbacku NPC.", tone: "info", icon: "package-variant-closed" },
            { label: "Gotowka", value: formatMoney(safeGame.player.cash || 0), note: "Kupujesz tylko tym, co masz przy sobie.", tone: "gold", icon: "cash-multiple" },
          ]}
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
              <View key={product.id} style={[styles.listCard, locked && styles.listCardLocked]}>
                <View style={styles.listCardHeader}>
                  <View style={styles.entityHead}>
                    <EntityBadge visual={productVisuals[product.id]} />
                    <View style={styles.flexOne}>
                      <Text style={styles.listCardTitle}>{product.name}</Text>
                      <Text style={styles.listCardMeta}>Przy Tobie: {safeGame.inventory[product.id] || 0} | Wymaga {product.unlockRespect} RES</Text>
                    </View>
                  </View>
                  <Tag text={getTrendLabel(snapshot)} warning={snapshot?.scarcity >= 0.28 || snapshot?.demandPressure >= 0.35} />
                </View>
                <View style={styles.oddsRow}>
                  <View style={styles.oddsBlock}>
                    <Text style={styles.oddsLabel}>Kupno</Text>
                    <Text style={styles.oddsValue}>{formatMoney(buyPrice)}</Text>
                  </View>
                  <View style={styles.oddsBlock}>
                    <Text style={styles.oddsLabel}>Sprzedaz</Text>
                    <Text style={styles.oddsValue}>{formatMoney(sellPrice)}</Text>
                  </View>
                  <View style={styles.oddsBlock}>
                    <Text style={styles.oddsLabel}>Ulica / NPC</Text>
                    <Text style={styles.oddsValue}>{snapshot?.streetStock ?? 0} / {snapshot?.fallbackStock ?? 0}</Text>
                  </View>
                </View>
                <Text style={styles.listCardMeta}>
                  Zrodlo: {getSupplySourceLabel(snapshot)} | Fallback NPC: {formatMoney(snapshot?.fallbackPrice ?? buyPrice)}
                </Text>
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
        <HeroPanel
          eyebrow="Diler"
          title="Szybki obrot towarem"
          summary="Kupujesz, sprzedajesz albo zarzucasz. Jedna ilosc obsluguje kupno i sprzedaz, a karty od razu pokazują stock, skup i ryzyko."
          tone="danger"
          pills={[
            { label: "Towary", value: `${drugs.length}`, note: "Rozne efekty i rozne ryzyko przedawkowania.", tone: "danger", icon: "flask-outline" },
            { label: "Ilosc transakcji", value: `${dealerTradeQuantity}`, note: "Ta sama liczba dla kupna i sprzedazy.", tone: "gold", icon: "numeric" },
            { label: "Na stanie", value: `${drugs.reduce((sum, drug) => sum + Number(safeGame.drugInventory?.[drug.id] || 0), 0)}`, note: "Laczna liczba sztuk przy sobie.", tone: "info", icon: "briefcase-outline" },
          ]}
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
          <View style={styles.listCard}>
            <View style={styles.entityHead}>
              <EntityBadge visual={systemVisuals.cash} />
              <View style={styles.flexOne}>
                <Text style={styles.listCardTitle}>Ilosc transakcji</Text>
                <Text style={styles.listCardMeta}>Jedna liczba dla kupna i sprzedazy u dilera.</Text>
              </View>
            </View>
            <TextInput
              value={dealerTradeDraft}
              onChangeText={(text) => setDealerTradeDraft(text.replace(/[^\d]/g, ""))}
              placeholder="Np. 5"
              placeholderTextColor="#6c6c6c"
              keyboardType="numeric"
              style={styles.chatInput}
            />
            <View style={styles.planChipRow}>
              {DEALER_QUANTITY_PRESETS.map((preset) => (
                <Pressable
                  key={`dealer-qty-${preset}`}
                  onPress={() => setDealerTradeDraft(String(preset))}
                  style={[styles.planChip, dealerTradeQuantity === preset && styles.planChipActive]}
                >
                  <Text style={[styles.planChipText, dealerTradeQuantity === preset && styles.planChipTextActive]}>x{preset}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          {drugs.map((drug) => (
            <View key={drug.id} style={styles.listCard}>
              {(() => {
                const dealerPayout = getDealerPayoutForDrug(drug);
                const tradeBuyTotal = Number(drug.streetPrice || 0) * dealerTradeQuantity;
                const tradeSellTotal = dealerPayout * dealerTradeQuantity;
                return (
                  <>
                    <View style={styles.listCardHeader}>
                      <View style={styles.entityHead}>
                        <EntityBadge visual={drugVisuals[drug.id]} />
                        <View style={styles.flexOne}>
                          <Text style={styles.listCardTitle}>{drug.name}</Text>
                          <Text style={styles.listCardMeta}>Towar uliczny z jasnym skupem i stockiem.</Text>
                        </View>
                      </View>
                      <Tag text={`OD ${Math.round(drug.overdoseRisk * 100)}%`} warning />
                    </View>
                    <View style={styles.oddsRow}>
                      <View style={styles.oddsBlock}>
                        <Text style={styles.oddsLabel}>Przy Tobie</Text>
                        <Text style={styles.oddsValue}>{safeGame.drugInventory[drug.id] || 0}</Text>
                      </View>
                      <View style={styles.oddsBlock}>
                        <Text style={styles.oddsLabel}>Stock dilera</Text>
                        <Text style={styles.oddsValue}>{safeGame.dealerInventory?.[drug.id] || 0}</Text>
                      </View>
                      <View style={styles.oddsBlock}>
                        <Text style={styles.oddsLabel}>Kupno / skup</Text>
                        <Text style={styles.oddsValue}>{formatMoney(drug.streetPrice)} / {formatMoney(dealerPayout)}</Text>
                      </View>
                      <View style={styles.oddsBlock}>
                        <Text style={styles.oddsLabel}>Respekt od</Text>
                        <Text style={styles.oddsValue}>{drug.unlockRespect}</Text>
                      </View>
                    </View>
                    <Text style={styles.listCardMeta}>
                      Daje: {Object.entries(drug.effect).map(([key, value]) => `${key} +${value}`).join(" | ")} | Efekt trwa ok. {Math.round(drug.durationSeconds / 60)} min
                    </Text>
                    <Text style={styles.listCardMeta}>
                      Przy x{dealerTradeQuantity}: kupno {formatMoney(tradeBuyTotal)} | skup {formatMoney(tradeSellTotal)}
                    </Text>
                    <View style={styles.marketButtons}>
                      <Pressable
                        onPress={() => actions.buyDrugFromDealer(drug, dealerTradeDraft)}
                        style={[
                          styles.marketButton,
                          (
                            safeGame.player.respect < drug.unlockRespect ||
                            Number(safeGame.dealerInventory?.[drug.id] || 0) < dealerTradeQuantity ||
                            Number(safeGame.player.cash || 0) < Number(drug.streetPrice || 0) * dealerTradeQuantity
                          ) && styles.tileDisabled,
                        ]}
                      >
                        <Text style={styles.marketButtonText}>Kup za {formatMoney(tradeBuyTotal)}</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => actions.sellDrugToDealer(drug, dealerTradeDraft)}
                        style={[styles.marketButton, Number(safeGame.drugInventory[drug.id] || 0) < dealerTradeQuantity && styles.tileDisabled]}
                      >
                        <Text style={styles.marketButtonText}>Sprzedaj za {formatMoney(tradeSellTotal)}</Text>
                      </Pressable>
                      <Pressable onPress={() => actions.consumeDrug(drug)} style={[styles.marketButton, (safeGame.drugInventory[drug.id] || 0) <= 0 && styles.tileDisabled]}>
                        <Text style={styles.marketButtonText}>Zarzuc</Text>
                      </Pressable>
                    </View>
                  </>
                );
              })()}
            </View>
          ))}
        </SectionCard>
      </>
    );
  }

  return (
    <>
      <SceneArtwork
        eyebrow="Boosty"
        title="Aktywne efekty"
        lines={["Tutaj widzisz tylko to, co realnie jeszcze dziala."]}
        accent={["#24313a", "#0f1216", "#050505"]}
        source={sceneBackgrounds.market}
      />
      <HeroPanel
        eyebrow="Boosty"
        title="Co teraz siedzi na postaci"
        summary="Bez chaosu i bez historii. Tylko aktywne efekty, ich czas i to, co realnie pompuja."
        tone="info"
        pills={[
          { label: "Aktywne", value: `${safeGame.activeBoosts.length}`, note: "Liczy sie tylko to, co jeszcze trwa.", tone: "info", icon: "lightning-bolt-outline" },
        ]}
      />
      <SectionCard title="Boosty" subtitle="Aktywne efekty na teraz.">
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
    </>
  );
}
