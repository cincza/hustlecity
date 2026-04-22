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

const DEALER_QUANTITY_PRESETS = [1, 5, 10];
const DEALER_TABS = [
  { id: "buy", label: "Kup" },
  { id: "sell", label: "Sprzedaj" },
];

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
  const safeDrugs = Array.isArray(drugs) ? drugs : [];
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
  const [dealerPane, setDealerPane] = useState("buy");
  const [selectedDealerDrugId, setSelectedDealerDrugId] = useState(() => safeDrugs[0]?.id || null);
  const [selectedShopAssetKey, setSelectedShopAssetKey] = useState(null);

  useEffect(() => {
    if (!contractCategories.includes(selectedContractCategory)) {
      setSelectedContractCategory(contractCategories[0] || "weapon");
    }
  }, [contractCategories, selectedContractCategory]);

  const parsedDealerTradeQuantity = Number.parseInt(String(dealerTradeDraft || "").replace(/[^\d]/g, ""), 10);
  const dealerTradeQuantity = Math.max(1, Number.isFinite(parsedDealerTradeQuantity) ? parsedDealerTradeQuantity : 1);
  const getContractCategoryLabel = (categoryId) => CONTRACT_CATEGORY_LABELS[categoryId] || categoryId;
  const getAssetTags = (asset) => Object.keys(asset?.tags || {}).filter(Boolean);
  const getShopAssetKey = (type, assetId) => `${type}:${assetId}`;
  const getDrugEffectLine = (drug) =>
    Object.entries(drug?.effect || {})
      .map(([key, value]) => `${key} +${value}`)
      .join(" / ");
  const setDealerTradeQuantityValue = (quantity) => {
    const safeQuantity = Math.max(1, Math.floor(Number(quantity || 1)));
    setDealerTradeDraft(String(safeQuantity));
  };
  const sellableDrugs = safeDrugs.filter((drug) => Number(safeGame.drugInventory?.[drug.id] || 0) > 0);
  const visibleDealerDrugs = dealerPane === "sell" ? sellableDrugs : safeDrugs;
  const visibleDealerIdsKey = visibleDealerDrugs.map((drug) => drug.id).join("|");
  const selectedDealerDrug =
    visibleDealerDrugs.find((drug) => drug.id === selectedDealerDrugId) ||
    visibleDealerDrugs[0] ||
    safeDrugs[0] ||
    null;
  const selectedDealerPayout = selectedDealerDrug ? getDealerPayoutForDrug(selectedDealerDrug) : 0;
  const selectedDealerBuyTotal = Number(selectedDealerDrug?.streetPrice || 0) * dealerTradeQuantity;
  const selectedDealerSellTotal = selectedDealerPayout * dealerTradeQuantity;
  const selectedDealerInventory = selectedDealerDrug ? Number(safeGame.drugInventory?.[selectedDealerDrug.id] || 0) : 0;
  const selectedDealerStock = selectedDealerDrug ? Number(safeGame.dealerInventory?.[selectedDealerDrug.id] || 0) : 0;
  const selectedDealerMaxBuyQuantity = selectedDealerDrug
    ? Math.max(
        0,
        Math.min(
          selectedDealerStock,
          Math.floor(Number(safeGame.player.cash || 0) / Math.max(1, Number(selectedDealerDrug.streetPrice || 1)))
        )
      )
    : 0;
  const selectedDealerMaxSellQuantity = selectedDealerInventory;
  const selectedDealerMaxQuantity = dealerPane === "buy" ? selectedDealerMaxBuyQuantity : selectedDealerMaxSellQuantity;

  useEffect(() => {
    if (section !== "drugs") return;
    if (!visibleDealerDrugs.length) {
      if (selectedDealerDrugId !== null) {
        setSelectedDealerDrugId(null);
      }
      return;
    }
    if (!visibleDealerDrugs.some((drug) => drug.id === selectedDealerDrugId)) {
      setSelectedDealerDrugId(visibleDealerDrugs[0].id);
    }
  }, [section, dealerPane, visibleDealerIdsKey, selectedDealerDrugId]);

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
  const sortedActiveBoosts = [...safeGame.activeBoosts].sort(
    (left, right) => Number(left?.expiresAt || 0) - Number(right?.expiresAt || 0)
  );
  const getBoostVisual = (boost) => {
    const boostId = String(boost?.id || "");
    const directDrugId = boostId.split("-")[0];
    if (drugVisuals?.[directDrugId]) return drugVisuals[directDrugId];
    const matchingDrug = safeDrugs.find((drug) => String(drug?.name || "").trim().toLowerCase() === String(boost?.name || "").trim().toLowerCase());
    if (matchingDrug && drugVisuals?.[matchingDrug.id]) return drugVisuals[matchingDrug.id];
    return systemVisuals.dealer || systemVisuals.market;
  };
  const getBoostEffectTone = (boost) => {
    const effectKeys = Object.keys(boost?.effect || {}).map((key) => String(key).toLowerCase());
    if (effectKeys.some((key) => key.includes("xp"))) return "#8cb7ff";
    if (effectKeys.some((key) => key.includes("cash") || key.includes("payout") || key.includes("success"))) return "#d8b260";
    return "#8fd0a5";
  };

  const renderContractShopDetail = (asset, type) => {
    if (!asset) return null;

    const owned = type === "car"
      ? Boolean(safeContractState?.ownedCars?.[asset.id])
      : Boolean(safeContractState?.ownedItems?.[asset.id]);
    const compareAssetId = type === "car" ? safeContractState?.loadout?.car : safeContractState?.loadout?.[asset.category];
    const compareAsset = type === "car"
      ? safeContractCars.find((entry) => entry.id === compareAssetId)
      : safeContractItems.find((entry) => entry.id === compareAssetId);
    const assetTags = getAssetTags(asset);
    const canBuy = !owned && safeGame.player.respect >= asset.respect && Number(safeGame.player.cash || 0) >= Number(asset.price || 0);
    const visual = type === "car" ? contractCategoryVisuals.car : contractCategoryVisuals[asset.category];

    return (
      <View style={[styles.listCard, { paddingVertical: 10, gap: 8, borderColor: "#5d4730", backgroundColor: "#0f0b08" }]}>
        <View style={styles.listCardHeader}>
          <View style={styles.entityHead}>
            <EntityBadge visual={visual} />
            <View style={styles.flexOne}>
              <Text style={styles.listCardTitle}>{asset.name}</Text>
              <Text style={styles.listCardMeta}>{asset.summary}</Text>
            </View>
          </View>
          <Tag text={owned ? "KUPIONE" : "NIE KUPIONE"} warning={!owned} />
        </View>
        <Text style={styles.listCardMeta}>
          Cena {formatMoney(asset.price)} • RES {asset.respect} • {assetTags.length ? assetTags.join(" / ") : "Brak tagow"}
        </Text>
        <Text style={styles.listCardMeta}>{getContractAssetEffectLine(asset)}</Text>
        <Text style={styles.listCardMeta}>
          W loadoucie: {compareAsset?.name || "Nic"}{compareAsset ? ` • ${getContractAssetEffectLine(compareAsset)}` : ""}
        </Text>
        <Pressable
          onPress={() => {
            if (type === "car") {
              actions.buyContractCar(asset);
            } else {
              actions.buyContractItem(asset);
            }
          }}
          disabled={!canBuy}
          style={[styles.inlineButton, { alignItems: "center", justifyContent: "center", minWidth: 132, backgroundColor: "#271d12", borderColor: "#8b6a43" }, !canBuy && styles.tileDisabled]}
        >
          <Text style={styles.inlineButtonText}>{owned ? "Kupione" : "Kup"}</Text>
        </Pressable>
      </View>
    );
  };

  if (section === "items") {
    const filteredItems = safeContractItems.filter((item) => item.category === selectedContractCategory);
    const ownedItemsCount = safeContractItems.filter((item) => safeContractState?.ownedItems?.[item.id]).length;
    const selectedItem =
      filteredItems.find((item) => getShopAssetKey("item", item.id) === selectedShopAssetKey) || null;
    return (
      <>
        <SectionCard title="Itemy" subtitle={`Itemy • ${filteredItems.length} sztuki • Kupione: ${ownedItemsCount}`}>
          <View style={[styles.planChipRow, { marginTop: 0, gap: 6 }]}>
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
          {renderContractShopDetail(selectedItem, "item")}
          {!filteredItems.length ? <Text style={styles.emptyText}>Brak itemow w tej kategorii.</Text> : null}
          {filteredItems.map((item) => {
            const owned = Boolean(safeContractState?.ownedItems?.[item.id]);
            const itemTags = getAssetTags(item);
            const isSelected = selectedItem?.id === item.id;
            return (
              <View
                key={item.id}
                style={[
                  styles.listCard,
                  {
                    paddingVertical: 10,
                    borderColor: isSelected ? "#7e5f3d" : "#252525",
                    backgroundColor: isSelected ? "#0f0d0a" : "#090909",
                  },
                ]}
              >
                <View style={[styles.inlineRow, { alignItems: "center", flexWrap: "nowrap" }]}>
                  <Pressable
                    onPress={() => setSelectedShopAssetKey(getShopAssetKey("item", item.id))}
                    style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}
                  >
                    <EntityBadge visual={contractCategoryVisuals[item.category]} />
                    <View style={styles.flexOne}>
                      <Text style={styles.listCardTitle}>{item.name}</Text>
                      <Text style={styles.listCardMeta}>
                        {formatMoney(item.price)} • {itemTags.length ? itemTags.join(" / ") : "Brak tagow"}
                      </Text>
                      <Text style={styles.listCardMeta}>RES {item.respect}</Text>
                    </View>
                  </Pressable>
                  <Tag text={owned ? "KUPIONE" : "NIE KUPIONE"} warning={!owned} />
                  <Pressable
                    onPress={() => actions.buyContractItem(item)}
                    disabled={owned || safeGame.player.respect < item.respect || safeGame.player.cash < item.price}
                    style={[styles.inlineButton, { minWidth: 82, alignItems: "center", justifyContent: "center", backgroundColor: "#20170f", borderColor: "#6f5334" }, (owned || safeGame.player.respect < item.respect || safeGame.player.cash < item.price) && styles.tileDisabled]}
                  >
                    <Text style={styles.inlineButtonText}>{owned ? "Kupione" : "Kup"}</Text>
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
    const selectedCar =
      safeContractCars.find((car) => getShopAssetKey("car", car.id) === selectedShopAssetKey) || null;
    const ownedCarsCount = safeContractCars.filter((car) => safeContractState?.ownedCars?.[car.id]).length;
    const selectedLoadoutCar = safeContractCars.find((car) => car.id === safeContractState?.loadout?.car)?.name || "Brak";
    return (
      <>
        <SectionCard title="Auta" subtitle={`Auta • ${safeContractCars.length} modeli • Wybrane: ${selectedLoadoutCar}`}>
          <Text style={styles.listCardMeta}>Kupione: {ownedCarsCount}</Text>
          {renderContractShopDetail(selectedCar, "car")}
          {safeContractCars.map((car) => {
            const owned = Boolean(safeContractState?.ownedCars?.[car.id]);
            const carTags = getAssetTags(car);
            const isSelected = selectedCar?.id === car.id;
            return (
              <View
                key={car.id}
                style={[
                  styles.listCard,
                  {
                    paddingVertical: 10,
                    borderColor: isSelected ? "#7e5f3d" : "#252525",
                    backgroundColor: isSelected ? "#0f0d0a" : "#090909",
                  },
                ]}
              >
                <View style={[styles.inlineRow, { alignItems: "center", flexWrap: "nowrap" }]}>
                  <Pressable
                    onPress={() => setSelectedShopAssetKey(getShopAssetKey("car", car.id))}
                    style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}
                  >
                    <EntityBadge visual={contractCategoryVisuals.car} />
                    <View style={styles.flexOne}>
                      <Text style={styles.listCardTitle}>{car.name}</Text>
                      <Text style={styles.listCardMeta}>
                        {formatMoney(car.price)} • {carTags.length ? carTags.join(" / ") : "Brak tagow"}
                      </Text>
                      <Text style={styles.listCardMeta}>RES {car.respect}</Text>
                    </View>
                  </Pressable>
                  <Tag text={owned ? "KUPIONE" : "NIE KUPIONE"} warning={!owned} />
                  <Pressable
                    onPress={() => actions.buyContractCar(car)}
                    disabled={owned || safeGame.player.respect < car.respect || safeGame.player.cash < car.price}
                    style={[styles.inlineButton, { minWidth: 82, alignItems: "center", justifyContent: "center", backgroundColor: "#20170f", borderColor: "#6f5334" }, (owned || safeGame.player.respect < car.respect || safeGame.player.cash < car.price) && styles.tileDisabled]}
                  >
                    <Text style={styles.inlineButtonText}>{owned ? "Kupione" : "Kup"}</Text>
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
        <SectionCard title="Diler" subtitle="Kupujesz albo sprzedajesz bez mieszania z klubami.">
          <View style={[styles.listCard, { paddingVertical: 10, gap: 8 }]}>
            <View style={[styles.inlineRow, { alignItems: "center", gap: 10 }]}>
              <View style={styles.entityHead}>
                <EntityBadge visual={systemVisuals.dealer} />
                <View style={styles.flexOne}>
                  <Text style={styles.listCardTitle}>Kontakt uliczny</Text>
                  <Text style={styles.listCardMeta}>
                    {dealerPane === "buy"
                      ? "Kupujesz z aktualnego stanu dilera."
                      : "Sprzedajesz tylko to, co masz przy sobie."}
                  </Text>
                </View>
              </View>
              <Tag text={`${visibleDealerDrugs.length} POZ.`} warning={dealerPane === "sell" && !visibleDealerDrugs.length} />
            </View>
            <Text style={styles.listCardMeta}>
              Cash {formatMoney(safeGame.player.cash || 0)} • Na stanie{" "}
              {safeDrugs.reduce((sum, drug) => sum + Number(safeGame.drugInventory?.[drug.id] || 0), 0)} • RES {safeGame.player.respect || 0}
            </Text>
            <View style={[styles.planChipRow, { marginTop: 0, gap: 6 }]}>
              {DEALER_TABS.map((tab) => (
                <Pressable
                  key={tab.id}
                  onPress={() => setDealerPane(tab.id)}
                  style={[styles.planChip, dealerPane === tab.id && styles.planChipActive]}
                >
                  <Text style={[styles.planChipText, dealerPane === tab.id && styles.planChipTextActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {selectedDealerDrug ? (
            <View
              style={[
                styles.listCard,
                {
                  paddingVertical: 10,
                  gap: 8,
                  borderColor: dealerPane === "buy" ? "#5d4730" : "#3f5a47",
                  backgroundColor: dealerPane === "buy" ? "#0f0b08" : "#08100b",
                },
              ]}
            >
              <View style={styles.listCardHeader}>
                <View style={styles.entityHead}>
                  <EntityBadge visual={drugVisuals[selectedDealerDrug.id]} />
                  <View style={styles.flexOne}>
                    <Text style={styles.listCardTitle}>{selectedDealerDrug.name}</Text>
                    <Text style={styles.listCardMeta}>
                      {getDrugEffectLine(selectedDealerDrug) || "Bez dodatkowych efektow"}
                    </Text>
                  </View>
                </View>
                <Tag
                  text={dealerPane === "buy" ? `RES ${selectedDealerDrug.unlockRespect}` : `MASZ ${selectedDealerInventory}`}
                  warning={dealerPane === "buy" ? safeGame.player.respect < selectedDealerDrug.unlockRespect : selectedDealerInventory <= 0}
                />
              </View>
              <Text style={styles.listCardMeta}>
                Kupno {formatMoney(selectedDealerDrug.streetPrice || 0)} • Skup {formatMoney(selectedDealerPayout)}
              </Text>
              <Text style={styles.listCardMeta}>
                {dealerPane === "buy" ? "Stock" : "Przy Tobie"} {dealerPane === "buy" ? selectedDealerStock : selectedDealerInventory} • Max teraz {selectedDealerMaxQuantity}
              </Text>
              <View style={styles.inlineRow}>
                <TextInput
                  value={dealerTradeDraft}
                  onChangeText={(text) => setDealerTradeDraft(text.replace(/[^\d]/g, ""))}
                  placeholder="Ilosc"
                  placeholderTextColor="#6c6c6c"
                  keyboardType="numeric"
                  style={styles.chatInput}
                />
                <Pressable
                  onPress={() => {
                    if (dealerPane === "buy") {
                      actions.buyDrugFromDealer(selectedDealerDrug, dealerTradeDraft);
                    } else {
                      actions.sellDrugToDealer(selectedDealerDrug, dealerTradeDraft);
                    }
                  }}
                  disabled={
                    dealerPane === "buy"
                      ? (
                          safeGame.player.respect < selectedDealerDrug.unlockRespect ||
                          selectedDealerMaxBuyQuantity < dealerTradeQuantity ||
                          dealerTradeQuantity <= 0
                        )
                      : selectedDealerMaxSellQuantity < dealerTradeQuantity || dealerTradeQuantity <= 0
                  }
                  style={[
                    styles.inlineButton,
                    {
                      minWidth: 148,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: dealerPane === "buy" ? "#271d12" : "#142117",
                      borderColor: dealerPane === "buy" ? "#8b6a43" : "#42724f",
                    },
                    (
                      dealerPane === "buy"
                        ? (
                            safeGame.player.respect < selectedDealerDrug.unlockRespect ||
                            selectedDealerMaxBuyQuantity < dealerTradeQuantity ||
                            dealerTradeQuantity <= 0
                          )
                        : selectedDealerMaxSellQuantity < dealerTradeQuantity || dealerTradeQuantity <= 0
                    ) && styles.tileDisabled,
                  ]}
                >
                  <Text style={styles.inlineButtonText}>
                    {dealerPane === "buy"
                      ? `Kup za ${formatMoney(selectedDealerBuyTotal)}`
                      : `Sprzedaj za ${formatMoney(selectedDealerSellTotal)}`}
                  </Text>
                </Pressable>
              </View>

              <View style={[styles.planChipRow, { marginTop: 0, gap: 6 }]}>
                {DEALER_QUANTITY_PRESETS.map((preset) => (
                  <Pressable
                    key={`dealer-qty-${preset}`}
                    onPress={() => setDealerTradeQuantityValue(preset)}
                    style={[styles.planChip, dealerTradeQuantity === preset && styles.planChipActive]}
                  >
                    <Text style={[styles.planChipText, dealerTradeQuantity === preset && styles.planChipTextActive]}>
                      +{preset}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => setDealerTradeQuantityValue(Math.max(1, selectedDealerMaxQuantity))}
                  style={[styles.planChip, dealerTradeQuantity === selectedDealerMaxQuantity && styles.planChipActive]}
                >
                  <Text style={[styles.planChipText, dealerTradeQuantity === selectedDealerMaxQuantity && styles.planChipTextActive]}>
                    MAX
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.listCardMeta}>
                x{dealerTradeQuantity} = {dealerPane === "buy" ? formatMoney(selectedDealerBuyTotal) : formatMoney(selectedDealerSellTotal)}
              </Text>
            </View>
          ) : (
            <View style={[styles.listCard, { paddingVertical: 14 }]}>
              <Text style={styles.emptyText}>
                {dealerPane === "sell"
                  ? "Nie masz teraz nic przy sobie. Wroc tu, kiedy bedzie co zrzucic u dilera."
                  : "Brak towaru w tej rotacji."}
              </Text>
            </View>
          )}

          <View style={{ gap: 8 }}>
            {visibleDealerDrugs.map((drug) => {
              const dealerPayout = getDealerPayoutForDrug(drug);
              const ownedQuantity = Number(safeGame.drugInventory?.[drug.id] || 0);
              const dealerStock = Number(safeGame.dealerInventory?.[drug.id] || 0);
              const isSelected = selectedDealerDrug?.id === drug.id;
              const canBuy =
                safeGame.player.respect >= drug.unlockRespect &&
                dealerStock >= dealerTradeQuantity &&
                Number(safeGame.player.cash || 0) >= Number(drug.streetPrice || 0) * dealerTradeQuantity;
              const canSell = ownedQuantity >= dealerTradeQuantity;

              return (
                <View
                  key={drug.id}
                  style={[
                    styles.listCard,
                    {
                      paddingVertical: 10,
                      borderColor: isSelected ? (dealerPane === "buy" ? "#7e5f3d" : "#4b7f59") : "#252525",
                      backgroundColor: isSelected ? "#0f0d0a" : "#090909",
                    },
                  ]}
                >
                  <View style={[styles.inlineRow, { alignItems: "center", flexWrap: "nowrap" }]}>
                    <Pressable
                      onPress={() => setSelectedDealerDrugId(drug.id)}
                      style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}
                    >
                      <EntityBadge visual={drugVisuals[drug.id]} />
                      <View style={styles.flexOne}>
                        <Text style={styles.listCardTitle}>{drug.name}</Text>
                        <Text style={styles.listCardMeta}>
                          Kupno {formatMoney(drug.streetPrice || 0)} • Skup {formatMoney(dealerPayout)}
                        </Text>
                        <Text style={styles.listCardMeta}>
                          {dealerPane === "buy"
                            ? `Stock ${dealerStock} • RES ${drug.unlockRespect}`
                            : `Masz ${ownedQuantity} • stock dilera ${dealerStock}`}
                        </Text>
                      </View>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setSelectedDealerDrugId(drug.id);
                        if (dealerPane === "buy") {
                          actions.buyDrugFromDealer(drug, dealerTradeDraft);
                        } else {
                          actions.sellDrugToDealer(drug, dealerTradeDraft);
                        }
                      }}
                      disabled={dealerPane === "buy" ? !canBuy : !canSell}
                      style={[
                        styles.inlineButton,
                        {
                          minWidth: 92,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: dealerPane === "buy" ? "#20170f" : "#111b14",
                          borderColor: dealerPane === "buy" ? "#6f5334" : "#3b6947",
                        },
                        (dealerPane === "buy" ? !canBuy : !canSell) && styles.tileDisabled,
                      ]}
                    >
                      <Text style={styles.inlineButtonText}>{dealerPane === "buy" ? "Kup" : "Sprzedaj"}</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        </SectionCard>
      </>
    );
  }

  return (
    <SectionCard title="Boosty" subtitle={`Aktywne: ${sortedActiveBoosts.length}`}>
      {!sortedActiveBoosts.length ? <Text style={styles.emptyText}>Brak aktywnych efektow</Text> : null}
      <View style={{ gap: 8 }}>
        {sortedActiveBoosts.map((boost) => {
          const remainingMs = Math.max(0, Number(boost?.expiresAt || 0) - Date.now());
          return (
            <View key={boost.id} style={[styles.listCard, { paddingVertical: 10, paddingHorizontal: 12 }]}>
              <View style={[styles.inlineRow, { alignItems: "center", flexWrap: "nowrap" }]}>
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <EntityBadge visual={getBoostVisual(boost)} />
                  <View style={styles.flexOne}>
                    <Text style={styles.listCardTitle}>{boost.name}</Text>
                    <Text style={[styles.listCardMeta, { color: getBoostEffectTone(boost) }]}>
                      {Object.entries(boost.effect || {})
                        .map(([key, value]) => `${key} +${value}`)
                        .join(" / ")}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    minWidth: 86,
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#685230",
                    backgroundColor: "#120f0b",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#f6d690", fontSize: 17, fontWeight: "900", letterSpacing: 0.2 }}>
                    {formatDuration(remainingMs)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </SectionCard>
  );
}
