import React from "react";
import { getBusinessPurchaseCost, getDrugProductionEnergyCost, getDrugProductionRespectRequirement } from "../../shared/empire.js";
import { Pressable, View } from "react-native";
import { getFactoryDistrictId } from "../../shared/districts.js";
import { getGangProjectEffects } from "../../shared/gangProjects.js";
import { getClubGuestVenueState, getClubThreatLabel, hasClubGuestAccess } from "../../shared/socialGameplay.js";
import { HeroPanel } from "../components/GameScreenPrimitives";
import { Text, TextInput } from "../i18n";
import {
  getDistrictAlertText,
  getDistrictEffectLines,
  getDrugBatchEconomy,
} from "../game/selectors/metaGameplay";

export function EmpireScreen({
  section,
  game,
  styles,
  SceneArtwork,
  SectionCard,
  StatLine,
  ActionTile,
  EntityBadge,
  Tag,
  formatMoney,
  formatAccruedMoney,
  formatLongDuration,
  formatCollectionStamp,
  formatCooldown,
  sceneBackgrounds,
  businessVisuals,
  escortVisuals,
  factoryVisuals,
  drugVisuals,
  supplierVisuals,
  systemVisuals,
  businesses,
  escorts,
  streetDistricts,
  factories,
  drugs,
  suppliers,
  clubFoundingCashCost,
  clubNightPlans,
  clubSystemRules,
  clubVisitorActions,
  totalBusinessIncome,
  businessCollectionCap,
  businessCapEta,
  totalEscortIncome,
  escortCollectionCap,
  escortCapEta,
  currentClubVenue,
  currentClubProfile,
  clubPolice,
  insideOwnClub,
  focusDistrictSummary,
  districtSummaries,
  helpers,
  actions,
}) {
  // TODO: TO_MIGRATE_TO_SERVER empire/business/club actions here still rely on local fallback logic passed from App.js.
  const safeGame = {
    player: { respect: 0, ...(game?.player || {}) },
    collections: game?.collections || {},
    businessesOwned: Array.isArray(game?.businessesOwned) ? game.businessesOwned : [],
    supplies: game?.supplies || {},
    drugInventory: game?.drugInventory || {},
    clubListings: Array.isArray(game?.clubListings) ? game.clubListings : [],
    club: { stash: {}, ...(game?.club || {}) },
    gang: game?.gang || {},
    ...game,
  };
  const businessCash = Number(safeGame.collections?.businessCash || 0);
  const businessCollectableCash = Math.floor(businessCash);
  const escortCash = Number(safeGame.collections?.escortCash || 0);
  const escortCollectableCash = Math.floor(escortCash);
  const businessCollectionSubtitle =
    businessCash > 0
      ? businessCollectableCash > 0
        ? `Czeka ${formatAccruedMoney(businessCash)}.`
        : `Rosnie ${formatAccruedMoney(businessCash)}. Jeszcze chwila do pelnego dolara.`
      : "Na razie pusto.";
  const escortCollectionSubtitle =
    escortCash > 0
      ? escortCollectableCash > 0
        ? `Czeka ${formatAccruedMoney(escortCash)}.`
        : `Rosnie ${formatAccruedMoney(escortCash)}. Jeszcze chwila do rozliczenia.`
      : "Dziewczyny jeszcze nie rozliczyly nocy.";

  const unlockedBusinesses = businesses.filter((business) => safeGame.player.respect >= business.respect);
  const availableBusinesses = unlockedBusinesses.filter((business) => {
    const owned = safeGame.businessesOwned.find((entry) => entry.id === business.id)?.count ?? 0;
    return owned === 0;
  });
  const ownedBusinesses = safeGame.businessesOwned
    .map((entry) => {
      const definition = businesses.find((business) => business.id === entry.id);
      if (!definition) return null;
      return { ...definition, count: entry.count || 0 };
    })
    .filter(Boolean);
  const lockedBusinesses = businesses.filter((business) => safeGame.player.respect < business.respect);
  const nextBusinessUnlock = lockedBusinesses[0] || null;
  const [businessPane, setBusinessPane] = React.useState("owned");
  const totalOwnedBusinessCount = ownedBusinesses.reduce((sum, business) => sum + Number(business.count || 0), 0);
  const totalCollectableCash = businessCollectableCash + escortCollectableCash;
  const [factoryPane, setFactoryPane] = React.useState("owned");
  const [managedFactoryId, setManagedFactoryId] = React.useState(null);
  const [buyFactoryDetailsId, setBuyFactoryDetailsId] = React.useState(null);
  const [pendingEmpireAction, setPendingEmpireAction] = React.useState(null);
  const empireActionLock = React.useRef(false);
  const pendingFactory = React.useRef(null);
  const runEmpireAction = async (key, action) => {
    if (empireActionLock.current) return;
    empireActionLock.current = true;
    setPendingEmpireAction(key);
    try { return await action(); }
    finally { empireActionLock.current = false; setPendingEmpireAction(null); }
  };
  React.useEffect(() => {
    const id = pendingFactory.current;
    if (id && helpers.hasFactory(safeGame, id)) {
      setFactoryPane("owned");
      setManagedFactoryId(id);
      setBuyFactoryDetailsId(null);
      pendingFactory.current = null;
    }
  }, [safeGame.factoriesOwned]);
  const [selectedSupplyId, setSelectedSupplyId] = React.useState(() => suppliers?.[0]?.id || null);
  const getUpgradeState = (businessId) => helpers.getBusinessUpgradeState?.(safeGame, businessId) || { speedLevel: 0, cashLevel: 0, totalLevel: 0 };
  const getBusinessMinuteIncome = (business, count = 1) => {
    const preview = helpers.getBusinessUpgradePreview?.(safeGame, business, count);
    const perMinute = Number(preview?.currentIncome ?? (Number(business?.incomePerMinute || 0) * count));
    return formatMoney(perMinute);
  };
  const factoryMilestones = [
    { respect: 8, title: "Pierwsza fabryka", unlocks: factories.filter((factory) => factory.respect === 8) },
    { respect: 12, title: "Druga fala", unlocks: factories.filter((factory) => factory.respect === 12) },
    { respect: 16, title: "Mocniejsza chemia", unlocks: factories.filter((factory) => factory.respect === 16) },
    { respect: 20, title: "Pelna produkcja", unlocks: factories.filter((factory) => factory.respect === 20) },
    { respect: 25, title: "Top fabryki", unlocks: factories.filter((factory) => factory.respect === 25) },
  ].filter((entry) => entry.unlocks.length);
  const nextFactoryUnlock = factoryMilestones.find((entry) => safeGame.player.respect < entry.respect) || null;
  const ownedFactories = factories.filter((factory) => helpers.hasFactory(safeGame, factory.id));
  const buyableFactories = factories.filter(
    (factory) => !helpers.hasFactory(safeGame, factory.id)
  );
  const getFactoryDrugs = (factoryId) => drugs.filter((drug) => drug.factoryId === factoryId);
  const getDrugRecipeState = (drug) => {
    const recipe = Object.entries(drug.supplies || {}).map(([supplyId, needed]) => {
      const supply = suppliers.find((entry) => entry.id === supplyId);
      const available = Math.max(0, Number(safeGame.supplies?.[supplyId] || 0));
      return {
        id: supplyId,
        name: supply?.name || supplyId,
        needed: Number(needed || 0),
        available,
        ready: available >= Number(needed || 0),
      };
    });
    const maxBatches = recipe.length
      ? recipe.reduce((min, entry) => Math.min(min, Math.floor(entry.available / Math.max(1, entry.needed))), Number.POSITIVE_INFINITY)
      : 0;
    return {
      recipe,
      maxBatches: Number.isFinite(maxBatches) ? Math.max(0, maxBatches) : 0,
      stock: Math.max(0, Number(safeGame.drugInventory?.[drug.id] || 0)),
      producedStock: Math.max(0, Number(safeGame.producedDrugInventory?.[drug.id] || 0)),
    };
  };
  const getFactoryCardState = (factory) => {
    const factoryDrugs = getFactoryDrugs(factory.id);
    const readyRecipes = factoryDrugs.filter((drug) => getDrugRecipeState(drug).maxBatches > 0);
    const totalStock = factoryDrugs.reduce((sum, drug) => sum + Math.max(0, Number(safeGame.drugInventory?.[drug.id] || 0)), 0);
    if (readyRecipes.length > 0) {
      return {
        label: "Gotowe",
        tone: "success",
        summary: `${readyRecipes.length} recept. gotowe teraz`,
      };
    }
    if (totalStock > 0) {
      return {
        label: "Na stanie",
        tone: "info",
        summary: `${totalStock} szt. towaru juz lezy`,
      };
    }
    return {
      label: "Brak skladnikow",
      tone: "warning",
      summary: "Najpierw dokup skladniki w hurtowniach",
    };
  };
  const selectedSupply = suppliers.find((supply) => supply.id === selectedSupplyId) || suppliers[0] || null;
  const selectedSupplyStock = selectedSupply ? Math.max(0, Number(safeGame.supplies?.[selectedSupply.id] || 0)) : 0;
  const selectedSupplyMaxAffordable = selectedSupply
    ? Math.max(0, Math.floor(Number(safeGame.player?.cash || 0) / Math.max(1, Number(selectedSupply.price || 1))))
    : 0;
  const clubGuestState = safeGame.club?.guestState || {};
  const [clubTradeDraft, setClubTradeDraft] = React.useState("1");
  const [clubEntryFeeDraft, setClubEntryFeeDraft] = React.useState(
    String(Math.max(0, Number(currentClubVenue?.entryFee ?? safeGame.club?.entryFee ?? 0)))
  );
  const parsedClubTradeQuantity = Number.parseInt(String(clubTradeDraft || "").replace(/[^\d]/g, ""), 10);
  const clubTradeQuantity = Math.max(1, Number.isFinite(parsedClubTradeQuantity) ? parsedClubTradeQuantity : 1);
  const activePlanId = currentClubVenue
    ? safeGame.club.owned && safeGame.club.sourceId === currentClubVenue.id
      ? safeGame.club.nightPlanId
      : currentClubVenue.nightPlanId
    : safeGame.club.nightPlanId;
  const activeClubPlan =
    helpers.getClubNightPlan?.(activePlanId) ||
    clubNightPlans?.find((plan) => plan.id === activePlanId) ||
    clubNightPlans?.[0] ||
    null;
  const leadRequired = Number(clubGuestState.leadRequired || clubSystemRules?.leadRequired || 100);
  const activeLeadEscort = currentClubVenue
    ? escorts.find(
        (escort) =>
          clubGuestState.leadVenueId === currentClubVenue.id &&
          escort.id === clubGuestState.leadEscortId
      ) ||
      helpers.getLeadTargetEscortForVenue?.({
        playerRespect: safeGame.player.respect,
        venue: currentClubVenue,
        planId: activePlanId,
      })
    : null;
  const leadProgress =
    currentClubVenue && clubGuestState.leadVenueId === currentClubVenue.id
      ? Number(clubGuestState.leadProgress || 0)
      : 0;
  const leadMeterProgress = activeLeadEscort ? Math.min(1, leadProgress / Math.max(1, leadRequired)) : 0;
  const lastOutcome =
    currentClubVenue && clubGuestState.lastOutcome?.venueId === currentClubVenue.id
      ? clubGuestState.lastOutcome
      : null;
  const clubActionCooldownRemaining = Math.max(
    0,
    Number(clubGuestState.lastActionAt || 0) + Number(clubSystemRules?.actionCooldownMs || 0) - Date.now()
  );
  const clubConsumeCooldownRemaining = Math.max(
    0,
    Number(clubGuestState.lastConsumeAt || 0) + Number(clubSystemRules?.consumeCooldownMs || 0) - Date.now()
  );
  const displayedTraffic = insideOwnClub ? Number(clubPolice.traffic || 0) : Number(currentClubVenue?.traffic || 0);
  const trafficLabel = insideOwnClub
    ? clubPolice.trafficLabel
    : displayedTraffic >= 22
      ? "Pelny ruch"
      : displayedTraffic >= 12
        ? "Dobry ruch"
        : displayedTraffic >= 5
          ? "Cos sie dzieje"
          : "Cicho";
  const displayedPressure = insideOwnClub
    ? Number(clubPolice.pressure || 0)
    : Number(currentClubVenue?.policePressure || (currentClubVenue?.policeBase || 0) * 3);
  const pressureLabel = insideOwnClub
    ? clubPolice.label
    : displayedPressure >= 72
      ? "Goraco"
      : displayedPressure >= 46
        ? "Pod obserwacja"
        : displayedPressure >= 24
          ? "Czuja ruch"
          : "Spokojnie";
  const clubStashDrugs = drugs.filter(
    (drug) => Number(safeGame.drugInventory?.[drug.id] || 0) > 0 || Number(safeGame.club?.stash?.[drug.id] || 0) > 0
  );
  const guestClubStashDrugs = drugs.filter(
    (drug) => Number(currentClubVenue?.stash?.[drug.id] || 0) > 0
  );
  const gangEffects = getGangProjectEffects(safeGame.gang);
  const empireProjectOrder = safeGame.empireProjectsView?.projects || [];
  const activeEmpireStage = safeGame.empireProjectsView?.active
    ? Math.max(1, empireProjectOrder.findIndex((entry) => entry.id === safeGame.empireProjectsView.active.project.id) + 1)
    : 0;
  const districtSummaryById = Object.fromEntries(
    (Array.isArray(districtSummaries) ? districtSummaries : []).map((district) => [district.id, district])
  );
  const activeClubDistrictSummary =
    currentClubVenue?.districtId && districtSummaryById[currentClubVenue.districtId]
      ? districtSummaryById[currentClubVenue.districtId]
      : focusDistrictSummary;
  const activeClubDistrictLines = getDistrictEffectLines(activeClubDistrictSummary, {
    focused: Boolean(activeClubDistrictSummary?.id && activeClubDistrictSummary.id === safeGame.gang?.focusDistrictId),
    gangEffects,
  });
  const activeClubDistrictAlert = getDistrictAlertText(activeClubDistrictSummary);
  const clubReportSummary = insideOwnClub
    ? safeGame.club?.lastReportSummary || safeGame.club?.lastNightSummary || null
    : currentClubVenue?.lastReportSummary || null;
  const currentVenueAffinity = currentClubVenue ? getClubGuestVenueState(clubGuestState, currentClubVenue.id) : null;
  const guestHasVenueAccess = currentClubVenue
    ? insideOwnClub || hasClubGuestAccess(clubGuestState, currentClubVenue.id, Date.now())
    : false;
  const guestAccessRemaining = !insideOwnClub && guestHasVenueAccess
    ? Math.max(0, Number(currentVenueAffinity?.accessUntil || 0) - Date.now())
    : 0;
  const currentEntryFee = Math.max(
    0,
    Number(currentClubVenue?.entryFee ?? (insideOwnClub ? safeGame.club?.entryFee : 0) ?? 0)
  );
  const currentSafeCash = insideOwnClub ? Math.max(0, Number(safeGame.club?.safeCash || 0)) : 0;
  const pendingClubGuestCount = insideOwnClub ? Math.max(0, Number(safeGame.club?.pendingGuestCount || 0)) : 0;
  const pendingClubEntryRevenue = insideOwnClub ? Math.max(0, Number(safeGame.club?.pendingEntryRevenue || 0)) : 0;
  const pendingClubGuestConsumeCount = insideOwnClub ? Math.max(0, Number(safeGame.club?.pendingGuestConsumeCount || 0)) : 0;
  const clubReportIntervalMs = Math.max(0, Number(clubSystemRules?.reportIntervalMs || 0));
  const clubNextReportRemaining = insideOwnClub && clubReportIntervalMs > 0
    ? Math.max(
        0,
        clubReportIntervalMs -
          Math.max(0, Date.now() - Number(safeGame.club?.lastSettlementAt || safeGame.club?.lastRunAt || 0))
      )
    : 0;
  const clubStashUnitCount = drugs.reduce(
    (sum, drug) => sum + Math.max(0, Number(safeGame.club?.stash?.[drug.id] || 0)),
    0
  );
  const clubStashTypeCount = drugs.reduce(
    (sum, drug) => sum + (Number(safeGame.club?.stash?.[drug.id] || 0) > 0 ? 1 : 0),
    0
  );
  const protectorGangName = currentClubVenue?.protectorGangName || null;
  const protectorEffects = currentClubVenue?.protectorEffects || null;
  const threatLabel = getClubThreatLabel(
    Number((insideOwnClub ? safeGame.club?.threatLevel : currentClubVenue?.threatLevel) || 0)
  );
  const [clubListSelectionId, setClubListSelectionId] = React.useState(() => currentClubVenue?.id || safeGame.clubListings?.[0]?.id || null);
  const [clubOwnerTab, setClubOwnerTab] = React.useState("status");
  const [clubGuestTab, setClubGuestTab] = React.useState("actions");
  const clubListingIdsKey = safeGame.clubListings.map((listing) => String(listing.id || "")).join("|");
  const selectedClubListing =
    safeGame.clubListings.find((listing) => listing.id === clubListSelectionId) || safeGame.clubListings[0] || null;
  const selectedClubProfile = selectedClubListing ? helpers.getClubVenueProfile?.(safeGame, selectedClubListing) : null;
  const selectedClubPressure = selectedClubListing
    ? Number(selectedClubListing.policePressure || (selectedClubListing.policeBase || 0) * 3)
    : 0;
  const selectedClubPressureLabel =
    selectedClubPressure >= 72
      ? "Goraco"
      : selectedClubPressure >= 46
        ? "Pod obserwacja"
        : selectedClubPressure >= 24
          ? "Czuja ruch"
          : "Spokojnie";
  const selectedClubTraffic = Math.round(Number(selectedClubListing?.traffic || 0));
  const selectedClubTrafficLabel =
    selectedClubTraffic >= 22
      ? "Pelny ruch"
      : selectedClubTraffic >= 12
        ? "Dobry ruch"
        : selectedClubTraffic >= 5
          ? "Cos sie dzieje"
          : "Cicho";
  const selectedClubPlan =
    helpers.getClubNightPlan?.(selectedClubListing?.nightPlanId) ||
    clubNightPlans?.find((plan) => plan.id === selectedClubListing?.nightPlanId) ||
    clubNightPlans?.[0] ||
    null;
  const canFoundClub = !safeGame.club.owned && safeGame.gang.joined && safeGame.gang.role === "Boss";
  const foundingPreviewDistrict = focusDistrictSummary || districtSummaries?.[0] || null;
  const clubStatLabels = {
    attack: "Atak",
    defense: "Obrona",
    charisma: "Charyzma",
    dexterity: "Refleks",
  };
  const formatClubDrugEffect = (drug) => {
    const effectLine = Object.entries(drug?.effect || {})
      .map(([stat, value]) => `+${Number(value || 0)} ${clubStatLabels[stat] || stat}`)
      .join(" • ");
    const durationMinutes = Math.max(0, Math.round(Number(drug?.durationSeconds || 0) / 60));
    return [effectLine, durationMinutes > 0 ? `${durationMinutes} min` : null].filter(Boolean).join(" • ");
  };
  const getClubTone = (tone = "neutral") => {
    if (tone === "danger") {
      return { border: "rgba(224, 78, 78, 0.26)", surface: "#1c1012", value: "#ffd7d7", label: "#ff9898" };
    }
    if (tone === "success") {
      return { border: "rgba(90, 186, 122, 0.28)", surface: "#111a14", value: "#daf8e2", label: "#8fdda8" };
    }
    if (tone === "gold") {
      return { border: "rgba(224, 174, 69, 0.28)", surface: "#19130e", value: "#ffe5b0", label: "#e4be75" };
    }
    if (tone === "info") {
      return { border: "rgba(92, 148, 228, 0.26)", surface: "#10151d", value: "#d7e6ff", label: "#9dbcf3" };
    }
    return { border: "#2a2d32", surface: "#101214", value: "#f2f0eb", label: "#98a1aa" };
  };
  const ownerClubBuffs = drugs
    .filter((drug) => Number(safeGame.club?.stash?.[drug.id] || 0) > 0)
    .map((drug) => ({
      ...drug,
      amount: Number(safeGame.club?.stash?.[drug.id] || 0),
      effectLabel: formatClubDrugEffect(drug),
    }));
  const guestClubBuffs = guestClubStashDrugs.map((drug) => ({
    ...drug,
    amount: Number(currentClubVenue?.stash?.[drug.id] || 0),
    effectLabel: formatClubDrugEffect(drug),
  }));
  const renderClubTabRow = (tabs, activeTab, onChange) => (
    <View style={[styles.planChipRow, { marginTop: 12 }]}>
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={[
              styles.planChip,
              active && styles.planChipActive,
              {
                paddingHorizontal: 12,
                minHeight: 38,
                flexGrow: 1,
              },
            ]}
          >
            <Text style={[styles.planChipText, active && styles.planChipTextActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
  const renderClubMetricCard = ({ label, value, note, tone = "neutral", compact = false }) => {
    const palette = getClubTone(tone);
    return (
      <View
        key={`${label}-${value}`}
        style={[
          styles.mobileOverviewCard,
          {
            borderColor: palette.border,
            backgroundColor: palette.surface,
            minWidth: compact ? "31%" : "47%",
          },
        ]}
      >
        <Text style={[styles.mobileOverviewLabel, { color: palette.label }]}>{label}</Text>
        <Text style={[compact ? styles.mobileOverviewValueSmall : styles.mobileOverviewValue, { color: palette.value }]}>
          {value}
        </Text>
        <Text style={styles.listCardMeta}>{note}</Text>
      </View>
    );
  };
  const ownerClubTabs = [
    { id: "status", label: "Status" },
    { id: "manage", label: "Zarzadzaj" },
    { id: "safe", label: "Sejf" },
    { id: "stash", label: "Stash" },
  ];
  const guestClubTabs = [
    { id: "actions", label: "Akcje" },
    { id: "opportunities", label: "Okazje" },
    { id: "local", label: "Lokal" },
    { id: "stash", label: "Towar" },
  ];
  React.useEffect(() => {
    if (currentClubVenue?.id) {
      setClubListSelectionId(currentClubVenue.id);
      return;
    }
    if (!safeGame.clubListings.some((listing) => listing.id === clubListSelectionId)) {
      setClubListSelectionId(safeGame.clubListings[0]?.id || null);
    }
  }, [currentClubVenue?.id, clubListingIdsKey]);
  React.useEffect(() => {
    if (insideOwnClub) {
      setClubOwnerTab("status");
      return;
    }
    if (currentClubVenue) {
      setClubGuestTab("actions");
    }
  }, [currentClubVenue?.id, insideOwnClub]);
  React.useEffect(() => {
    setClubEntryFeeDraft(String(Math.max(0, Number(currentClubVenue?.entryFee ?? safeGame.club?.entryFee ?? 0))));
  }, [currentClubVenue?.id, currentClubVenue?.entryFee, safeGame.club?.entryFee]);

  const handleCollectAllIncome = () => runEmpireAction("collect", async () => {
    if (businessCollectableCash > 0) {
      await Promise.resolve(actions.collectBusinessIncome?.());
    }
    if (escortCollectableCash > 0) {
      await Promise.resolve(actions.collectEscortIncome?.());
    }
  });

  const renderCollectionsPanel = (title = "Odbior", subtitle = "Sejfy i szybki zjazd hajsu bez dlugiego scrolla.") => (
    <SectionCard title={title} subtitle={subtitle}>
      <Pressable
        onPress={handleCollectAllIncome}
        accessibilityRole="button"
        disabled={totalCollectableCash <= 0 || Boolean(pendingEmpireAction)}
        style={[
          styles.inlineButton,
          {
            minHeight: 50,
            marginBottom: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: totalCollectableCash > 0 ? "#e0ae45" : "#1a1c20",
            borderColor: totalCollectableCash > 0 ? "#f4d28d" : "#30343a",
            opacity: totalCollectableCash > 0 ? 1 : 0.52,
          },
        ]}
      >
        <Text
          style={[
            styles.inlineButtonText,
            { color: totalCollectableCash > 0 ? "#1f1507" : "#a3a7ad", fontSize: 13, fontWeight: "900" },
          ]}
        >
          {pendingEmpireAction === "collect" ? "Odbieranie…" : totalCollectableCash > 0 ? `Odbierz wszystko ${formatMoney(totalCollectableCash)}` : "Odbierz wszystko"}
        </Text>
      </Pressable>

      <View style={styles.listCard}>
        <View style={styles.listCardHeader}>
          <View style={styles.entityHead}>
            <EntityBadge visual={businessVisuals.tower} />
            <View style={styles.flexOne}>
              <Text style={styles.listCardTitle}>Biznesy i lokale</Text>
              <Text style={styles.listCardMeta}>{businessCollectionSubtitle}</Text>
            </View>
          </View>
          <Text style={styles.listCardReward}>{formatMoney(totalBusinessIncome)}/min</Text>
        </View>
        <Text style={styles.listCardMeta}>
          Sejf: {formatAccruedMoney(businessCash)} / {formatMoney(businessCollectionCap)} | Cap za {formatLongDuration(businessCapEta)}
        </Text>
        <Text style={styles.listCardMeta}>Ostatni odbior: {formatCollectionStamp(safeGame.collections?.businessCollectedAt)}</Text>
        <View style={styles.listActionsRow}>
          <Pressable onPress={actions.collectBusinessIncome} style={[styles.inlineButton, businessCollectableCash <= 0 && styles.tileDisabled]}>
            <Text style={styles.inlineButtonText}>Odbierz biznesy</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.listCard}>
        <View style={styles.listCardHeader}>
          <View style={styles.entityHead}>
            <EntityBadge visual={escortVisuals.velvet} />
            <View style={styles.flexOne}>
              <Text style={styles.listCardTitle}>Ulica i panienki</Text>
              <Text style={styles.listCardMeta}>{escortCollectionSubtitle}</Text>
            </View>
          </View>
          <Text style={styles.listCardReward}>{formatMoney(totalEscortIncome)}/min</Text>
        </View>
        <Text style={styles.listCardMeta}>
          Sejf: {formatAccruedMoney(escortCash)} / {formatMoney(escortCollectionCap)} | Cap za {formatLongDuration(escortCapEta)}
        </Text>
        <Text style={styles.listCardMeta}>Ostatni odbior: {formatCollectionStamp(safeGame.collections?.escortCollectedAt)}</Text>
        <View style={styles.listActionsRow}>
          <Pressable onPress={actions.collectEscortIncome} style={[styles.inlineButton, escortCollectableCash <= 0 && styles.tileDisabled]}>
            <Text style={styles.inlineButtonText}>Odbierz ulice</Text>
          </Pressable>
        </View>
      </View>
    </SectionCard>
  );

  if (section === "businesses") {
    const businessTabs = [
      { id: "projects", label: "Imperium" },
      { id: "owned", label: "Twoje" },
      { id: "buy", label: "Kup" },
      { id: "collections", label: "Odbiór" },
    ];

    return (
      <>
        <SectionCard title="Biznesy" subtitle="Twoje lokale, inwestycje i odbiór dochodu.">
          <View style={styles.mobileOverviewGrid}>
            <View style={styles.mobileOverviewCard}>
              <Text style={styles.mobileOverviewLabel}>Lokale</Text>
              <Text style={styles.mobileOverviewValue}>{totalOwnedBusinessCount}</Text>
              <Text style={styles.listCardMeta}>Tyle sztuk juz pracuje dla Ciebie.</Text>
            </View>
            <View style={styles.mobileOverviewCard}>
              <Text style={styles.mobileOverviewLabel}>Dochód / min</Text>
              <Text style={styles.mobileOverviewValue}>{formatMoney(totalBusinessIncome)}</Text>
              <Text style={styles.listCardMeta}>Czysty ruch z biznesow.</Text>
            </View>
            <View style={styles.mobileOverviewCard}>
              <Text style={styles.mobileOverviewLabel}>Do odbioru</Text>
              <Text style={styles.mobileOverviewValue}>{formatMoney(totalCollectableCash)}</Text>
              <Text style={styles.listCardMeta}>Biznesy i ulica w jednym zjezdzie.</Text>
            </View>
          </View>
          <View style={[styles.planChipRow, { marginTop: 12 }]}>
            {businessTabs.map((tabEntry) => {
              const active = businessPane === tabEntry.id;
              return (
                <Pressable
                  key={tabEntry.id}
                  onPress={() => setBusinessPane(tabEntry.id)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  style={[styles.planChip, active && styles.planChipActive]}
                >
                  <Text style={[styles.planChipText, active && styles.planChipTextActive]}>{tabEntry.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        {businessPane === "projects" ? (
          <>
            <SectionCard title="Przedsięwzięcia Imperium" subtitle="Cztery znaki, które zmieniają twoje nazwisko w część miasta. Każdy wymaga kapitału, dowodu działania i trwałej decyzji.">
              <View style={styles.mobileOverviewGrid}>
                <View style={styles.mobileOverviewCard}>
                  <Text style={styles.mobileOverviewLabel}>Znaki Imperium</Text>
                  <Text style={styles.mobileOverviewValue}>{safeGame.empireProjectsView?.completedCount || 0}/4</Text>
                  <Text style={styles.listCardMeta}>Każdy znak zostaje w historii miasta.</Text>
                </View>
                <View style={styles.mobileOverviewCard}>
                  <Text style={styles.mobileOverviewLabel}>Obecny etap</Text>
                  <Text style={styles.mobileOverviewValue}>{activeEmpireStage ? `${activeEmpireStage}/4` : "—"}</Text>
                  <Text style={styles.listCardMeta}>{activeEmpireStage === 4 ? "Centrala. Finał twojej drogi przez miasto." : "Jedno przedsięwzięcie naraz. Jeden ślad do zostawienia."}</Text>
                </View>
              </View>
              <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 4, now: safeGame.empireProjectsView?.completedCount || 0 }} style={{ flexDirection: "row", gap: 6, marginTop: 12 }}>
                {[1, 2, 3, 4].map((stage) => <View key={stage} style={{ flex: 1, height: stage === 4 ? 7 : 5, borderRadius: 999, backgroundColor: stage <= (safeGame.empireProjectsView?.completedCount || 0) ? "#d5ad55" : activeEmpireStage === stage ? "#8d6a30" : "#303237", borderWidth: activeEmpireStage === stage ? 1 : 0, borderColor: "#f0cb75" }} />)}
              </View>
            </SectionCard>

            {safeGame.empireProjectsView?.active ? (
              <SectionCard title={`${activeEmpireStage === 4 ? "FINAŁ" : `ETAP ${activeEmpireStage}/4`} · ${safeGame.empireProjectsView.active.project.name}`} subtitle={safeGame.empireProjectsView.active.project.summary}>
                {activeEmpireStage === 4 ? <View style={[styles.listCard, { borderColor: "#c5943c", backgroundColor: "#1d1810" }]}><Text style={styles.listCardTitle}>Centrala nie jest kolejną inwestycją</Text><Text style={styles.listCardMeta}>To moment, w którym wcześniejsze projekty, Skarbiec miasta i wpływy trzech dzielnic składają się w jedno dziedzictwo.</Text></View> : null}
                <View style={styles.listCard}>
                  <View style={styles.listCardHeader}>
                    <View style={styles.flexOne}>
                      <Text style={styles.listCardTitle}>Miasto czeka na dowód</Text>
                      <Text style={styles.listCardMeta}>Kapitał otworzył drzwi. Teraz wykonaj ruchy, które pokażą, że potrafisz utrzymać ten układ.</Text>
                    </View>
                    <Tag text={safeGame.empireProjectsView.active.proof.ready ? "GOTOWE" : "W TOKU"} warning={!safeGame.empireProjectsView.active.proof.ready} />
                  </View>
                  {safeGame.empireProjectsView.active.proof.steps.map((step) => (
                    <Text key={step.label} style={styles.listCardMeta}>{step.done ? "✓" : "○"} {step.label}: {step.current}/{step.target}</Text>
                  ))}
                </View>
                <Text style={styles.sectionSubtitle}>Finał należy do Ciebie</Text>
                {safeGame.empireProjectsView.active.choices.map((choice) => {
                  const blocked = choice.reasons.length > 0 || Boolean(pendingEmpireAction);
                  return (
                    <View key={choice.id} style={styles.listCard}>
                      <Text style={styles.listCardTitle}>{choice.name}</Text>
                      <Text style={styles.listCardMeta}>{choice.summary}</Text>
                      <Text style={styles.listCardMeta}>{choice.reasons.length ? choice.reasons.join(" · ") : "Warunki spełnione. Ta decyzja jest trwałym wpisem w historii imperium."}</Text>
                      <View style={styles.listActionsRow}>
                        <Pressable disabled={blocked} onPress={() => runEmpireAction(`project-final-${choice.id}`, () => actions.finalizeEmpireProject(choice.id))} style={[styles.inlineButton, blocked && styles.tileDisabled]}>
                          <Text style={styles.inlineButtonText}>{pendingEmpireAction === `project-final-${choice.id}` ? "Domykanie…" : "Wybierz finał"}</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </SectionCard>
            ) : (
              <SectionCard title="Wybierz następny duży ruch" subtitle="Drogi różnią się wymaganiami i finałem. Klasa pomaga w systemach składowych, ale żadnego projektu nie blokuje.">
                {(safeGame.empireProjectsView?.projects || []).map((project, projectIndex) => {
                  const blocked = project.completed || project.startReasons.length > 0 || Boolean(pendingEmpireAction);
                  const capstone = project.id === "city-headquarters";
                  return (
                    <View key={project.id} style={[styles.listCard, capstone && { borderColor: "#b98736", backgroundColor: "#1c1710" }, project.completed && { opacity: 0.84 }]}>
                      <View style={styles.listCardHeader}>
                        <View style={styles.flexOne}>
                          <Text style={[styles.mobileOverviewLabel, capstone && { color: "#e5bb64" }]}>{capstone ? "FINAŁ · DZIEDZICTWO" : `ETAP ${projectIndex + 1}/4`}</Text>
                          <Text style={styles.listCardTitle}>{project.name}</Text>
                          <Text style={styles.listCardMeta}>{project.summary}</Text>
                        </View>
                        <Tag text={project.completed ? "UKOŃCZONE" : `${formatMoney(project.funding)}`} warning={!project.completed} />
                      </View>
                      <Text style={styles.listCardMeta}>Wejście: {project.requirement}</Text>
                      <Text style={styles.listCardMeta}>Dowód: {project.proof}</Text>
                      <Text style={styles.listCardMeta}>Po projekcie: {project.directive.name} — {project.directive.summary}</Text>
                      <Text style={styles.listCardMeta}>{project.completed ? `Finał: ${project.completed.choiceName}` : project.startReasons.length ? project.startReasons.join(" · ") : "Możesz rozpocząć. Finansowanie zostanie pobrane z gotówki."}</Text>
                      {!project.completed ? (
                        <View style={styles.listActionsRow}>
                          <Pressable disabled={blocked} onPress={() => runEmpireAction(`project-start-${project.id}`, () => actions.startEmpireProject(project.id))} style={[styles.inlineButton, blocked && styles.tileDisabled]}>
                          <Text style={styles.inlineButtonText}>{pendingEmpireAction === `project-start-${project.id}` ? "Uruchamianie…" : capstone ? "Rozpocznij finał" : "Rozpocznij przedsięwzięcie"}</Text>
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </SectionCard>
            )}

            {(safeGame.empireProjectsView?.directives || []).length ? (
              <SectionCard title="Sztab Imperium" subtitle="Ukończone przedsięwzięcia dają dostęp do kosztownych decyzji kryzysowych. Sztab może wykonać jedną dyrektywę co 20 godzin.">
                {safeGame.empireProjectsView.directives.map((directive) => {
                  const blocked = directive.reasons.length > 0 || Boolean(pendingEmpireAction);
                  return (
                    <View key={directive.projectId} style={styles.listCard}>
                      <Text style={styles.listCardTitle}>{directive.name}</Text>
                      <Text style={styles.listCardMeta}>{directive.summary}</Text>
                      <Text style={styles.listCardMeta}>{directive.reasons.length ? directive.reasons.join(" · ") : "Sztab i zasoby są gotowe."}</Text>
                      <View style={styles.listActionsRow}>
                        <Pressable disabled={blocked} onPress={() => runEmpireAction(`directive-${directive.projectId}`, () => actions.runEmpireDirective(directive.projectId, safeGame.city?.focusDistrictId || directive.districtId))} style={[styles.inlineButton, blocked && styles.tileDisabled]}>
                          <Text style={styles.inlineButtonText}>{pendingEmpireAction === `directive-${directive.projectId}` ? "Realizacja…" : "Wydaj dyrektywę"}</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </SectionCard>
            ) : null}
          </>
        ) : null}

        {businessPane === "owned" ? (
          <>
            <SectionCard title="Twoje lokale" subtitle={totalOwnedBusinessCount ? `Skrytka: ${formatAccruedMoney(businessCash)} · Pełna za ${formatLongDuration(businessCapEta)}` : "Pierwszy lokal uruchomi stały dochód. Sprawdź zakładkę Kup."}>
              {ownedBusinesses.length ? (
                ownedBusinesses.map((business) => {
                  const preview = helpers.getBusinessUpgradePreview?.(safeGame, business, business.count);
                  const upgradeState = getUpgradeState(business.id);
                  return (
                    <View key={`owned-${business.id}`} style={styles.listCard}>
                      <View style={styles.listCardHeader}>
                        <View style={styles.entityHead}>
                          <EntityBadge visual={businessVisuals[business.id]} />
                          <View style={styles.flexOne}>
                            <Text style={styles.listCardTitle}>{business.name}</Text>
                            <Text style={styles.listCardMeta}>Masz: {business.count} | {business.kind}</Text>
                          </View>
                        </View>
                        <Text style={styles.listCardReward}>{getBusinessMinuteIncome(business, business.count)}/min</Text>
                      </View>
                      <Text style={styles.listCardMeta}>
                        Jedna sztuka: {getBusinessMinuteIncome(business)} / min | Upgrade tempo {upgradeState.speedLevel} | cash {upgradeState.cashLevel}
                      </Text>
                      {preview ? (
                        <>
                          <Text style={styles.listCardMeta}>
                            {preview.speedMaxed && preview.cashMaxed
                              ? "Obie ścieżki rozwoju osiągnęły MAX."
                              : `Następny boost: tempo ${preview.speedMaxed ? "MAX" : `${formatMoney(preview.nextSpeedIncome)}/min`} albo cash ${preview.cashMaxed ? "MAX" : `${formatMoney(preview.nextCashIncome)}/min`}`}
                          </Text>
                          <View style={styles.marketButtons}>
                            <Pressable disabled={preview.speedMaxed} onPress={() => actions.upgradeBusiness(business, "speed")} style={[styles.marketButton, preview.speedMaxed && styles.tileDisabled]}>
                              <Text style={styles.marketButtonText}>{preview.speedMaxed ? "Tempo MAX" : `Tempo ${formatMoney(preview.speedCost)}`}</Text>
                            </Pressable>
                            <Pressable disabled={preview.cashMaxed} onPress={() => actions.upgradeBusiness(business, "cash")} style={[styles.marketButton, preview.cashMaxed && styles.tileDisabled]}>
                              <Text style={styles.marketButtonText}>{preview.cashMaxed ? "Cash MAX" : `Cash ${formatMoney(preview.cashCost)}`}</Text>
                            </Pressable>
                          </View>
                        </>
                      ) : null}
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>Na razie nic nie stoi. Wskocz w `Kup` i postaw pierwszy lokal.</Text>
              )}
            </SectionCard>
          </>
        ) : null}

        {businessPane === "buy" ? (
          <SectionCard title="Kup" subtitle="Każdy kolejny lokal tego samego typu kosztuje o 50% ceny bazowej więcej. Ulepszenia obejmują całą sieć i kosztują proporcjonalnie do liczby lokali.">
            {availableBusinesses.length ? (
              availableBusinesses.map((business) => (
                <View key={`available-${business.id}`} style={styles.listCard}>
                  <View style={styles.inlineRow}>
                    <View style={styles.entityHead}>
                      <EntityBadge visual={businessVisuals[business.id]} />
                      <View style={styles.flexOne}>
                        <Text style={styles.listCardTitle}>{business.name}</Text>
                        <Text style={styles.listCardMeta}>
                          {business.kind} | {getBusinessMinuteIncome(business)}/min | {formatMoney(getBusinessPurchaseCost(game, business))}
                        </Text>
                      </View>
                    </View>
                    <Pressable onPress={() => actions.buyBusiness(business)} style={styles.inlineButton}>
                      <Text style={styles.inlineButtonText}>Kup biznes</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>
                {nextBusinessUnlock
                  ? `Nic nie lezy teraz na stole. Nastepny lokal: ${nextBusinessUnlock.name} od ${nextBusinessUnlock.respect} RES.`
                  : "Masz juz wykupiona cala aktualna liste biznesow."}
              </Text>
            )}

            {lockedBusinesses.length ? (
              <>
                <Text style={[styles.sectionSubtitle, { marginTop: 12, marginBottom: 8 }]}>Na radarze</Text>
                {lockedBusinesses.map((business) => (
                  <View key={`locked-${business.id}`} style={[styles.listCard, styles.listCardLocked]}>
                    <View style={styles.listCardHeader}>
                      <View style={styles.entityHead}>
                        <EntityBadge visual={businessVisuals[business.id]} />
                        <View style={styles.flexOne}>
                          <Text style={styles.listCardTitle}>{business.name}</Text>
                          <Text style={styles.listCardMeta}>
                            {getBusinessMinuteIncome(business)}/min | Koszt {formatMoney(getBusinessPurchaseCost(game, business))}
                          </Text>
                        </View>
                      </View>
                      <Tag text={`RES ${business.respect}`} warning />
                    </View>
                  </View>
                ))}
              </>
            ) : null}
          </SectionCard>
        ) : null}

        {businessPane === "collections" ? (
          <>
            {renderCollectionsPanel("Odbior", "Sejfy, skrytki i szybki zjazd hajsu.")}

            <SectionCard title="Ulica i panienki" subtitle="Kupujesz kontakt, wystawiasz na trase i odbierasz ruch z miasta.">
              {escorts.map((escort) => {
                const owned = helpers.getOwnedEscort(safeGame, escort.id);
                const total = owned?.count ?? 0;
                const working = helpers.getEscortWorkingCount(owned);
                const reserve = Math.max(0, total - working);
                const locked = safeGame.player.respect < escort.respect;

                return (
                  <View key={escort.id} style={styles.listCard}>
                    <View style={styles.listCardHeader}>
                      <View style={styles.entityHead}>
                        <EntityBadge visual={escortVisuals[escort.id]} />
                        <View style={styles.flexOne}>
                          <Text style={styles.listCardTitle}>{escort.name}</Text>
                          <Text style={styles.listCardMeta}>Rezerwa {reserve} | Ulica {working} | Wymaga {escort.respect} RES</Text>
                        </View>
                      </View>
                      <Text style={styles.listCardReward}>{formatMoney(escort.cashPerMinute)}/min</Text>
                    </View>
                    <View style={styles.inlineRow}>
                      <Text style={styles.costLabel}>Kupno {formatMoney(escort.cost)} | Sprzedaz {formatMoney(escort.sellPrice)}</Text>
                      <Pressable onPress={() => actions.buyEscort(escort)} style={[styles.inlineButton, locked && styles.tileDisabled]}>
                        <Text style={styles.inlineButtonText}>{locked ? `RES ${escort.respect}` : "Kup kontakt"}</Text>
                      </Pressable>
                    </View>
                    {streetDistricts.map((district) => {
                      const assigned = helpers.getEscortDistrictCount(safeGame, escort.id, district.id);
                      const districtLocked = safeGame.player.respect < district.respect;
                      return (
                        <View key={`${escort.id}-${district.id}`} style={styles.districtCard}>
                          <View style={styles.listCardHeader}>
                            <View style={styles.flexOne}>
                              <Text style={styles.listCardTitle}>{district.name}</Text>
                              <Text style={styles.listCardMeta}>
                                x{district.incomeMultiplier.toFixed(2)} | Na trasie {assigned} | Policja {Math.round(district.policeRisk * 100)}%
                              </Text>
                            </View>
                            <Tag text={district.respect > 0 ? `${district.respect} RES` : "OPEN"} warning={districtLocked} />
                          </View>
                          <View style={styles.marketButtons}>
                            <Pressable
                              onPress={() => actions.assignEscortToStreet(escort, district.id)}
                              style={[styles.marketButton, (locked || reserve <= 0 || districtLocked) && styles.tileDisabled]}
                            >
                              <Text style={styles.marketButtonText}>Wystaw</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => actions.pullEscortFromStreet(escort, district.id)}
                              style={[styles.marketButton, assigned <= 0 && styles.tileDisabled]}
                            >
                              <Text style={styles.marketButtonText}>Sciagnij</Text>
                            </Pressable>
                            <Pressable onPress={() => actions.sellEscort(escort)} style={[styles.marketButton, reserve <= 0 && styles.tileDisabled]}>
                              <Text style={styles.marketButtonText}>Sprzedaj</Text>
                            </Pressable>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </SectionCard>
          </>
        ) : null}
      </>
    );
  }

  if (section === "factories") {
    const factoryTabs = [
      { id: "owned", label: "Twoje" },
      { id: "buy", label: "Kup" },
    ];

    return (
      <>
        <SectionCard title="Fabryki" subtitle="Własne zakłady i nowe inwestycje.">
          <View style={[styles.planChipRow, { marginTop: 12 }]}>
            {factoryTabs.map((tabEntry) => {
              const active = factoryPane === tabEntry.id;
              return (
                <Pressable
                  key={tabEntry.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => setFactoryPane(tabEntry.id)}
                  style={[styles.planChip, active && styles.planChipActive]}
                >
                  <Text style={[styles.planChipText, active && styles.planChipTextActive]}>{tabEntry.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        {factoryPane === "owned" ? (
          <SectionCard title="Twoje" subtitle="Rozwiń zakład, aby sprawdzić receptury i uruchomić produkcję.">
            {ownedFactories.length ? (
              ownedFactories.map((factory) => {
                const factoryDrugs = getFactoryDrugs(factory.id);
                const status = getFactoryCardState(factory);
                const district = districtSummaryById[getFactoryDistrictId(factory.id)] || focusDistrictSummary;
                const expanded = managedFactoryId === factory.id;

                return (
                  <View key={`owned-factory-${factory.id}`} style={styles.listCard}>
                    <View style={styles.listCardHeader}>
                      <View style={styles.entityHead}>
                        <EntityBadge visual={factoryVisuals[factory.id]} />
                        <View style={styles.flexOne}>
                          <Text style={styles.listCardTitle}>{factory.name}</Text>
                          <Text style={styles.listCardMeta}>
                            Prog {factory.respect} RES | {status.summary}
                          </Text>
                        </View>
                      </View>
                      <Tag text={status.label} success={status.tone === "success"} warning={status.tone === "warning"} />
                    </View>
                    <Text style={styles.listCardMeta}>
                      {district?.name || "-"} | {district?.pressureLabel || "Spokojnie"} | Receptury {factoryDrugs.length}
                    </Text>
                    <View style={styles.listActionsRow}>
                      <Pressable
                        onPress={() => setManagedFactoryId(expanded ? null : factory.id)}
                        style={[styles.inlineButton, { minHeight: 44 }]}
                      >
                        <Text style={styles.inlineButtonText}>{expanded ? "Zwin" : "Zarzadzaj"}</Text>
                      </Pressable>
                    </View>

                    {expanded ? (
                      <View style={{ marginTop: 10, gap: 10 }}>
                        {factoryDrugs.map((drug) => {
                          const recipeState = getDrugRecipeState(drug);
                          const policeProfile = helpers.getDrugPoliceProfile(drug);
                          const batchEconomy = getDrugBatchEconomy(drug, suppliers, helpers.getDealerPayoutForDrug);
                          const energyCost = getDrugProductionEnergyCost(drug);
                          const respectRequirement = getDrugProductionRespectRequirement(drug);
                          const lockedByRespect = safeGame.player.respect < respectRequirement;
                          const missingEnergy = safeGame.player.energy < energyCost;
                          return (
                            <View key={`recipe-${factory.id}-${drug.id}`} style={styles.districtCard}>
                              <View style={styles.listCardHeader}>
                                <View style={styles.entityHead}>
                                  <EntityBadge visual={drugVisuals[drug.id]} />
                                  <View style={styles.flexOne}>
                                    <Text style={styles.listCardTitle}>{drug.name}</Text>
                                    <Text style={styles.listCardMeta}>
                                      Batch {drug.batchSize} | Na stanie {recipeState.stock} | Max teraz {recipeState.maxBatches}
                                    </Text>
                                  </View>
                                </View>
                                <Tag text={lockedByRespect ? `${respectRequirement} RES` : recipeState.maxBatches > 0 && !missingEnergy ? "Gotowe" : "Braki"} success={!lockedByRespect && recipeState.maxBatches > 0 && !missingEnergy} warning={lockedByRespect || recipeState.maxBatches <= 0 || missingEnergy} />
                              </View>
                              <Text style={styles.listCardMeta}>
                                {recipeState.recipe
                                  .map((entry) => `${entry.name} x${entry.needed} ${entry.ready ? "✔" : "✖"}`)
                                  .join(" | ")}
                              </Text>
                              <Text style={styles.listCardMeta}>
                                Ryzyko {Math.round(policeProfile.risk * 100)}% | Koszt {energyCost} EN | Surowce: {formatMoney(batchEconomy.batchCost)}
                              </Text>
                              <Text style={styles.listCardMeta}>Wartość u dilera: {formatMoney(batchEconomy.dealerCashout)} · Marża przed opłatami i ryzykiem: {formatMoney(batchEconomy.dealerMargin)}</Text>
                              {recipeState.maxBatches <= 0 ? <Pressable accessibilityRole="button" onPress={() => actions.openSection("empire", "suppliers")} style={styles.inlineButton}><Text style={styles.inlineButtonText}>Uzupełnij surowce</Text></Pressable> : null}
                              {recipeState.stock > 0 ? <Pressable accessibilityRole="button" onPress={() => actions.openSection("market", "drugs")} style={styles.inlineButton}><Text style={styles.inlineButtonText}>Sprzedaj u dilera</Text></Pressable> : null}
                              <View style={styles.marketButtons}>
                                <Pressable
                                  accessibilityRole="button"
                                  disabled={lockedByRespect || missingEnergy || recipeState.maxBatches <= 0 || Boolean(pendingEmpireAction)}
                                  onPress={() => runEmpireAction(`produce-${drug.id}`, () => actions.produceDrug(drug))}
                                  style={[styles.marketButton, (lockedByRespect || missingEnergy || recipeState.maxBatches <= 0) && styles.tileDisabled]}
                                >
                                  <Text style={styles.marketButtonText}>{pendingEmpireAction === `produce-${drug.id}` ? "Produkcja…" : "Produkuj"}</Text>
                                </Pressable>
                                <Pressable
                                  accessibilityRole="button"
                                  disabled={lockedByRespect || missingEnergy || recipeState.maxBatches <= 1 || Boolean(pendingEmpireAction)}
                                  onPress={() => runEmpireAction(`produce-${drug.id}`, () => actions.produceDrug(drug, { quantity: Math.min(recipeState.maxBatches, Math.floor(safeGame.player.energy / energyCost)) }))}
                                  style={[styles.marketButton, (lockedByRespect || missingEnergy || recipeState.maxBatches <= 1) && styles.tileDisabled]}
                                >
                                  <Text style={styles.marketButtonText}>Produkuj max</Text>
                                </Pressable>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    ) : null}
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>Nie masz jeszcze zadnej fabryki. Wskocz w `Kup` i przejmij pierwsza.</Text>
            )}
          </SectionCard>
        ) : null}

        {factoryPane === "buy" ? (
          <SectionCard title="Kup" subtitle="Kupiony zakład trafia do zakładki Twoje.">
            {buyableFactories.length ? (
              buyableFactories.map((factory) => {
                const expanded = buyFactoryDetailsId === factory.id;
                const locked = safeGame.player.respect < factory.respect;
                const missingCash = Math.max(0, factory.cost - safeGame.player.cash);
                const factoryDrugs = getFactoryDrugs(factory.id);
                const district = districtSummaryById[getFactoryDistrictId(factory.id)] || focusDistrictSummary;
                return (
                  <View key={`buy-factory-${factory.id}`} style={styles.listCard}>
                    <View style={styles.listCardHeader}>
                      <View style={styles.entityHead}>
                        <EntityBadge visual={factoryVisuals[factory.id]} />
                        <View style={styles.flexOne}>
                          <Text style={styles.listCardTitle}>{factory.name}</Text>
                          <Text style={styles.listCardMeta}>
                            {factoryDrugs.map((drug) => drug.name).join(", ")} | {formatMoney(factory.cost)}
                          </Text>
                        </View>
                      </View>
                      <Pressable accessibilityRole="button" disabled={locked || missingCash > 0 || Boolean(pendingEmpireAction)} onPress={() => runEmpireAction(`buy-${factory.id}`, async () => { pendingFactory.current = factory.id; await actions.buyFactory(factory); })} style={[styles.inlineButton, (locked || missingCash > 0 || Boolean(pendingEmpireAction)) && styles.tileDisabled]}>
                        <Text style={styles.inlineButtonText}>{pendingEmpireAction === `buy-${factory.id}` ? "Kupowanie…" : locked ? `${factory.respect} RES` : "Kup"}</Text>
                      </Pressable>
                    </View>
                    <View style={styles.listActionsRow}>
                      <Pressable
                        onPress={() => setBuyFactoryDetailsId(expanded ? null : factory.id)}
                        style={[styles.inlineButton, { minHeight: 40, backgroundColor: "#14161a", borderColor: "#2b2d31" }]}
                      >
                        <Text style={styles.inlineButtonText}>{expanded ? "Mniej" : "Szczegoly"}</Text>
                      </Pressable>
                    </View>
                    {expanded ? (
                      <View style={{ marginTop: 10, gap: 8 }}>
                        <Text style={styles.listCardMeta}>{factory.text}</Text>
                        <Text style={styles.listCardMeta}>{locked ? `Wymagane ${factory.respect} RES. Masz ${safeGame.player.respect}.` : missingCash > 0 ? `Brakuje ${formatMoney(missingCash)} w gotówce.` : "Możesz kupić ten zakład."}</Text>
                        <Text style={styles.listCardMeta}>
                          Dzielnica: {district?.name || "-"} | {district?.pressureLabel || "Spokojnie"}
                        </Text>
                        <Text style={styles.listCardMeta}>
                          Receptury: {factoryDrugs.map((drug) => `${drug.name} x${drug.batchSize}`).join(" | ")}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>
                {nextFactoryUnlock
                  ? `Na ten moment nic nie kupisz. Nastepny prog: ${nextFactoryUnlock.respect} RES.`
                  : "Masz juz przejete wszystkie fabryki z aktualnej listy."}
              </Text>
            )}
          </SectionCard>
        ) : null}
      </>
    );
  }

  if (section === "suppliers") {
    return (
      <>
        <SectionCard title="Hurtownie" subtitle="Grid do szybkich zakupow, szczegoly dopiero po kliknieciu.">
          <View style={styles.mobileOverviewGrid}>
            <View style={styles.mobileOverviewCard}>
              <Text style={styles.mobileOverviewLabel}>Rodzaje</Text>
              <Text style={styles.mobileOverviewValue}>{suppliers.length}</Text>
              <Text style={styles.listCardMeta}>Skladniki dla wszystkich lancuchow.</Text>
            </View>
            <View style={styles.mobileOverviewCard}>
              <Text style={styles.mobileOverviewLabel}>Magazyn</Text>
              <Text style={styles.mobileOverviewValue}>
                {suppliers.reduce((sum, supply) => sum + Number(safeGame.supplies?.[supply.id] || 0), 0)}
              </Text>
              <Text style={styles.listCardMeta}>Laczny stan przed kolejnym batchem.</Text>
            </View>
          </View>
        </SectionCard>

        {selectedSupply ? (
          <SectionCard title="Szczegoly" subtitle="Szybki zakup i stan magazynu bez rozciagania calego ekranu.">
            <View style={styles.listCard}>
              <View style={styles.listCardHeader}>
                <View style={styles.entityHead}>
                  <EntityBadge visual={supplierVisuals[selectedSupply.id] || systemVisuals.supplier} />
                  <View style={styles.flexOne}>
                    <Text style={styles.listCardTitle}>{selectedSupply.name}</Text>
                    <Text style={styles.listCardMeta}>
                      W magazynie: {selectedSupplyStock} | Jednostka: {selectedSupply.unit}
                    </Text>
                  </View>
                </View>
                <Text style={styles.listCardReward}>{formatMoney(selectedSupply.price)}</Text>
              </View>

              <View style={[styles.planChipRow, { marginTop: 4 }]}>
                {[1, 5, 10].map((qty) => (
                  <Pressable
                    key={`${selectedSupply.id}-${qty}`}
                    onPress={() => actions.buySupply(selectedSupply, { quantity: qty })}
                    style={styles.planChip}
                  >
                    <Text style={styles.planChipText}>{`+${qty}`}</Text>
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => actions.buySupply(selectedSupply, { quantity: selectedSupplyMaxAffordable })}
                  disabled={selectedSupplyMaxAffordable <= 0}
                  style={[styles.planChip, selectedSupplyMaxAffordable <= 0 && styles.tileDisabled]}
                >
                  <Text style={styles.planChipText}>MAX</Text>
                </Pressable>
              </View>

              <Text style={[styles.listCardMeta, { marginTop: 8 }]}>Idzie prosto do batchy w fabrykach. Bez kombinacji i bez drugiego sklepu.</Text>

              <View style={[styles.marketButtons, { marginTop: 10 }]}>
                <Pressable
                  onPress={() => actions.buySupply(selectedSupply)}
                  style={[styles.marketButton, { minHeight: 42, justifyContent: "center" }]}
                >
                  <Text style={styles.marketButtonText}>Kup 1</Text>
                </Pressable>
                <Pressable
                  onPress={() => actions.buySupply(selectedSupply, { quantity: selectedSupplyMaxAffordable })}
                  disabled={selectedSupplyMaxAffordable <= 0}
                  style={[
                    styles.marketButton,
                    { minHeight: 42, justifyContent: "center" },
                    selectedSupplyMaxAffordable <= 0 && styles.tileDisabled,
                  ]}
                >
                  <Text style={styles.marketButtonText}>
                    {selectedSupplyMaxAffordable > 0 ? `Kup max x${selectedSupplyMaxAffordable}` : "Kup max"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </SectionCard>
        ) : null}

        <SectionCard title="Dostawy" subtitle="Front to nazwa, cena i zakup. Reszta siedzi wyzej po wyborze.">
          <View style={styles.grid}>
            {suppliers.map((supply) => {
              const isSelected = selectedSupply?.id === supply.id;
              return (
                <Pressable
                  key={supply.id}
                  onPress={() => setSelectedSupplyId(supply.id)}
                  style={[
                    styles.listCard,
                    {
                      width: "31.5%",
                      minWidth: 96,
                      paddingVertical: 12,
                      paddingHorizontal: 10,
                      borderColor: isSelected ? "#d8b26c" : "#26282b",
                      backgroundColor: isSelected ? "#16120d" : "#111317",
                    },
                  ]}
                >
                  <View style={{ alignItems: "center", gap: 8 }}>
                    <EntityBadge visual={supplierVisuals[supply.id] || systemVisuals.supplier} />
                    <Text
                      style={[styles.listCardTitle, { textAlign: "center", fontSize: 12, lineHeight: 15 }]}
                      numberOfLines={2}
                    >
                      {supply.name}
                    </Text>
                    <Text style={[styles.listCardReward, { fontSize: 12 }]}>{formatMoney(supply.price)}</Text>
                    <Pressable
                      onPress={() => actions.buySupply(supply)}
                      style={[styles.inlineButton, { minHeight: 34, alignSelf: "stretch", justifyContent: "center" }]}
                    >
                      <Text style={[styles.inlineButtonText, { fontSize: 11 }]}>Kup</Text>
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>
      </>
    );
  }

  return (
    <>
      {!currentClubVenue ? (
        <>
          <SectionCard title="Kluby" subtitle="Szybki rynek lokali. Wybierasz adres, sprawdzasz ruch i wchodzisz od razu w akcje.">
            {selectedClubListing ? (
              <View style={[styles.listCard, { marginBottom: 12, borderColor: "rgba(224, 174, 69, 0.22)", backgroundColor: "#111214" }]}>
                <View style={styles.listCardHeader}>
                  <View style={styles.entityHead}>
                    <EntityBadge visual={selectedClubListing.iconVisual || businessVisuals.club} />
                    <View style={styles.flexOne}>
                      <Text style={styles.listCardTitle}>{selectedClubListing.name}</Text>
                      <Text style={styles.listCardMeta}>
                        {selectedClubListing.ownerLabel || "Miasto"} • {selectedClubListing.districtId || "Adres ukryty"}
                      </Text>
                    </View>
                  </View>
                  <Tag
                    text={
                      safeGame.club.owned && safeGame.club.sourceId === selectedClubListing.id
                        ? "Twoj"
                        : selectedClubListing.respect >= 32
                          ? "VIP"
                          : selectedClubListing.ownerLabel === "Miasto"
                            ? "Miasto"
                            : "Boss"
                    }
                    warning={!(safeGame.club.owned && safeGame.club.sourceId === selectedClubListing.id)}
                  />
                </View>
                <View style={styles.mobileOverviewGrid}>
                  {renderClubMetricCard({
                    label: "Wejscie",
                    value: formatMoney(Number(selectedClubListing.entryFee || 0)),
                    note: "Jedno okno dostepu do sali",
                    tone: "gold",
                  })}
                  {renderClubMetricCard({
                    label: "Ruch",
                    value: `${selectedClubTraffic}`,
                    note: selectedClubTrafficLabel,
                    tone: selectedClubTraffic >= 12 ? "success" : "neutral",
                  })}
                  {renderClubMetricCard({
                    label: "Presja",
                    value: `${Math.round(selectedClubPressure)}`,
                    note: selectedClubPressureLabel,
                    tone: selectedClubPressure >= 46 ? "danger" : "info",
                  })}
                  {renderClubMetricCard({
                    label: "Kontakt",
                    value: `+${selectedClubProfile?.networkBoostValue || 0}%`,
                    note: `${selectedClubProfile?.huntProgressValue || 0} progressu`,
                    tone: "info",
                  })}
                </View>
                <Text style={styles.listCardMeta}>
                  {selectedClubPlan?.name || "Guest List"} • {selectedClubProfile?.label || selectedClubListing.note || "Adres z potencjalem pod nocna robote."}
                </Text>
                <View style={styles.marketButtons}>
                  <Pressable onPress={() => actions.enterClubAsGuest(selectedClubListing)} style={styles.marketButton}>
                    <Text style={styles.marketButtonText}>
                      {safeGame.club.owned && safeGame.club.sourceId === selectedClubListing.id ? "Wejdz do swojego" : "Wejdz"}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => actions.openClub(selectedClubListing)}
                    style={[
                      styles.marketButton,
                      (safeGame.club.owned ||
                        safeGame.player.respect < Number(selectedClubListing.respect || 0) ||
                        (safeGame.club.owned && safeGame.club.sourceId === selectedClubListing.id)) &&
                        styles.tileDisabled,
                    ]}
                  >
                    <Text style={styles.marketButtonText}>
                      {safeGame.club.owned && safeGame.club.sourceId === selectedClubListing.id ? "Kupione" : "Przejmij"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
            <View style={[styles.grid, { gap: 10 }]}>
              {safeGame.clubListings.map((listing) => {
                const isSelected = selectedClubListing?.id === listing.id;
                const isOwnedByPlayer = safeGame.club.owned && safeGame.club.sourceId === listing.id;
                const listingProfile = helpers.getClubVenueProfile?.(safeGame, listing);
                const listingPressure = Number(listing.policePressure || (listing.policeBase || 0) * 3);
                const listingPressureLabel =
                  listingPressure >= 72
                    ? "Goraco"
                    : listingPressure >= 46
                      ? "Pod obserwacja"
                      : listingPressure >= 24
                        ? "Czuja ruch"
                        : "Spokojnie";
                return (
                  <Pressable
                    key={listing.id}
                    onPress={() => setClubListSelectionId(listing.id)}
                    style={[
                      styles.listCard,
                      {
                        width: "47.5%",
                        padding: 12,
                        borderColor: isSelected ? "rgba(224, 174, 69, 0.4)" : "#262a31",
                        backgroundColor: isSelected ? "#14110d" : "#0f1114",
                      },
                    ]}
                  >
                    <View style={[styles.entityHead, { marginBottom: 10 }]}>
                      <EntityBadge visual={listing.iconVisual || businessVisuals.club} />
                      <View style={styles.flexOne}>
                        <Text style={styles.listCardTitle} numberOfLines={2}>
                          {listing.name}
                        </Text>
                        <Text style={styles.listCardMeta} numberOfLines={1}>
                          {isOwnedByPlayer ? "Twoj" : listing.ownerLabel || "Miasto"}
                        </Text>
                      </View>
                    </View>
                    <View style={{ gap: 4, marginBottom: 10 }}>
                      <Text style={styles.costLabel}>{formatMoney(Number(listing.entryFee || 0))}</Text>
                      <Text style={styles.listCardMeta} numberOfLines={1}>
                        Ruch {Math.round(Number(listing.traffic || 0))} • {listingPressureLabel}
                      </Text>
                      <Text style={styles.listCardMeta} numberOfLines={1}>
                        {listing.districtId || "Adres miasta"} • +{listingProfile?.networkBoostValue || 0}% kontaktu
                      </Text>
                    </View>
                    <View style={styles.marketButtons}>
                      <Pressable onPress={() => actions.enterClubAsGuest(listing)} style={styles.marketButton}>
                        <Text style={styles.marketButtonText}>Wejdz</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => actions.openClub(listing)}
                        style={[
                          styles.marketButton,
                          (safeGame.club.owned || safeGame.player.respect < Number(listing.respect || 0) || isOwnedByPlayer) &&
                            styles.tileDisabled,
                        ]}
                      >
                        <Text style={styles.marketButtonText}>{isOwnedByPlayer ? "Kupione" : "Przejmij"}</Text>
                      </Pressable>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </SectionCard>

          <SectionCard title="Nowy klub" subtitle="Gruby wydatek i jeden ruch. Bez tutorialu, tylko koszt i decyzja.">
            <View style={styles.mobileOverviewGrid}>
              {renderClubMetricCard({
                label: "Koszt",
                value: formatMoney(clubFoundingCashCost),
                note: "Stawiasz lokal od zera",
                tone: "gold",
              })}
              {renderClubMetricCard({
                label: "Prog",
                value: "RES 26",
                note: "Start dla mocniejszej ekipy",
                tone: safeGame.player.respect >= 26 ? "success" : "danger",
              })}
              {renderClubMetricCard({
                label: "Rola",
                value: canFoundClub ? "Boss" : safeGame.gang.role || "Brak",
                note: "Klub zaklada tylko boss",
                tone: canFoundClub ? "success" : "neutral",
              })}
              {renderClubMetricCard({
                label: "Front",
                value: foundingPreviewDistrict?.name || "Miasto",
                note: foundingPreviewDistrict
                  ? `${foundingPreviewDistrict.pressureLabel} • ${foundingPreviewDistrict.bonusLabel}`
                  : "Adres przypnie system miasta",
                tone: "info",
              })}
            </View>
            <Pressable
              onPress={actions.foundClub}
              style={[
                styles.inlineButton,
                {
                  minHeight: 50,
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: 12,
                  backgroundColor: canFoundClub ? "#e0ae45" : "#15171b",
                  borderColor: canFoundClub ? "#f1cf88" : "#2d3138",
                  opacity: canFoundClub ? 1 : 0.55,
                },
              ]}
              disabled={!canFoundClub}
            >
              <Text
                style={[
                  styles.inlineButtonText,
                  { color: canFoundClub ? "#1f1507" : "#9098a3", fontWeight: "900", fontSize: 13 },
                ]}
              >
                Zaloz klub
              </Text>
            </Pressable>
          </SectionCard>
        </>
      ) : insideOwnClub ? (
        <SectionCard title={currentClubVenue.name} subtitle="Twoj lokal. Ruch, drzwi, sejf i stash zamkniete w jednym, krotszym flow.">
          <View style={[styles.listCard, { marginBottom: 12 }]}>
            <View style={styles.listCardHeader}>
              <View style={styles.entityHead}>
                <EntityBadge visual={currentClubVenue.iconVisual || businessVisuals.club} />
                <View style={styles.flexOne}>
                  <Text style={styles.listCardTitle}>{currentClubVenue.name}</Text>
                  <Text style={styles.listCardMeta}>
                    Twoj lokal • {activeClubPlan?.name || "Guest List"} • {currentClubVenue.districtId || "Adres miasta"}
                  </Text>
                </View>
              </View>
              <Tag text="Twój" warning={false} />
            </View>
            <View style={styles.mobileOverviewGrid}>
              {renderClubMetricCard({
                label: "Ruch",
                value: `${Math.round(displayedTraffic)}`,
                note: trafficLabel,
                tone: displayedTraffic >= 12 ? "success" : "neutral",
              })}
              {renderClubMetricCard({
                label: "Presja",
                value: `${Math.round(displayedPressure)}`,
                note: pressureLabel,
                tone: displayedPressure >= 46 ? "danger" : "info",
              })}
              {renderClubMetricCard({
                label: "Popularnosc",
                value: `${Math.round(currentClubVenue.popularity || 0)}%`,
                note: `Mood ${Math.round(currentClubVenue.mood || 0)}%`,
                tone: "gold",
              })}
              {renderClubMetricCard({
                label: "Sejf",
                value: formatMoney(currentSafeCash),
                note: currentSafeCash > 0 ? "Gotowe do odbioru" : "Na razie pusto",
                tone: currentSafeCash > 0 ? "success" : "neutral",
              })}
              {renderClubMetricCard({
                label: "Wejscie",
                value: formatMoney(currentEntryFee),
                note: currentClubProfile?.entryProfile?.label || "Bramka lokalu",
                tone: "gold",
              })}
              {renderClubMetricCard({
                label: "Ochrona",
                value: `${Math.round(Number(safeGame.club?.defenseReadiness || 0))}`,
                note: `Threat ${threatLabel}`,
                tone: Number(safeGame.club?.defenseReadiness || 0) >= 70 ? "success" : "info",
              })}
            </View>
            <Text style={styles.listCardMeta}>{currentClubProfile.label}</Text>
            <View style={styles.listActionsRow}>
              <Pressable onPress={actions.leaveClubAsGuest} style={styles.inlineButton}>
                <Text style={styles.inlineButtonText}>Wyjdz z lokalu</Text>
              </Pressable>
            </View>
          </View>

          {renderClubTabRow(ownerClubTabs, clubOwnerTab, setClubOwnerTab)}

          {clubOwnerTab === "status" ? (
            <>
              <View style={styles.listCard}>
                <Text style={styles.listCardTitle}>Status lokalu</Text>
                <Text style={styles.listCardMeta}>
                  Stash support: +{Math.round(Number(currentClubProfile?.stashSupport || 0) * 100)}% • {activeClubPlan?.summary}
                </Text>
                <Text style={styles.listCardMeta}>
                  {protectorGangName
                    ? `${protectorGangName} trzyma drzwi. Obrona +${Math.round(Number(protectorEffects?.clubSecurity || 0))}, threat lzej o ${Math.round(Number(protectorEffects?.clubThreatMitigation || 0) * 100)}%.`
                    : "Brak protektora. Lokal sam bierze cala presje na klate."}
                </Text>
                <Text style={styles.listCardMeta}>
                  {activeClubDistrictAlert
                    ? activeClubDistrictAlert
                    : activeClubDistrictLines.slice(0, 2).join(" • ")}
                </Text>
              </View>
              <View
                style={[
                  styles.listCard,
                  {
                    borderColor: ownerClubBuffs.length ? "rgba(90, 186, 122, 0.28)" : "rgba(224, 78, 78, 0.22)",
                    backgroundColor: ownerClubBuffs.length ? "#111815" : "#1b1011",
                  },
                ]}
              >
                <Text style={styles.listCardTitle}>Aktywne efekty</Text>
                {ownerClubBuffs.length ? (
                  ownerClubBuffs.map((drug) => (
                    <Text key={`owner-buff-${drug.id}`} style={styles.listCardMeta}>
                      {drug.name} • {drug.effectLabel}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.listCardMeta}>Brak towaru - brak buffow i slabszy ruch lokalu.</Text>
                )}
              </View>
            </>
          ) : null}

          {clubOwnerTab === "manage" ? (
            <>
              <View style={styles.listCard}>
                <Text style={styles.listCardTitle}>Plan nocy</Text>
                <Text style={styles.listCardMeta}>Jedna decyzja. Potem lokal sam rozlicza ruch i raport.</Text>
                <View style={[styles.planChipRow, { marginTop: 10 }]}>
                  {clubNightPlans.map((plan) => {
                    const active = safeGame.club.nightPlanId === plan.id;
                    return (
                      <Pressable
                        key={plan.id}
                        onPress={() => actions.setClubNightPlan(plan.id)}
                        style={[styles.planChip, active && styles.planChipActive]}
                      >
                        <Text style={[styles.planChipText, active && styles.planChipTextActive]}>{plan.name}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <View style={styles.listCard}>
                <Text style={styles.listCardTitle}>Bramka i ochrona</Text>
                <Text style={styles.listCardMeta}>
                  Za wysoka cena zabija ruch i kontakty. Protektor gangu wchodzi bez oplaty.
                </Text>
                <TextInput
                  value={clubEntryFeeDraft}
                  onChangeText={(text) => setClubEntryFeeDraft(text.replace(/[^\d]/g, ""))}
                  placeholder="Np. 80"
                  placeholderTextColor="#6c6c6c"
                  keyboardType="numeric"
                  style={styles.chatInput}
                />
                <View style={styles.marketButtons}>
                  <Pressable onPress={() => actions.setClubEntryFee(clubEntryFeeDraft)} style={styles.marketButton}>
                    <Text style={styles.marketButtonText}>Ustaw wejscie</Text>
                  </Pressable>
                  <Pressable onPress={actions.fortifyClub} style={styles.marketButton}>
                    <Text style={styles.marketButtonText}>Zabezpiecz</Text>
                  </Pressable>
                </View>
              </View>
            </>
          ) : null}

          {clubOwnerTab === "safe" ? (
            <>
              <View style={styles.mobileOverviewGrid}>
                {renderClubMetricCard({
                  label: "Sejf",
                  value: formatMoney(currentSafeCash),
                  note: currentSafeCash > 0 ? "Do odbioru" : "Pusto",
                  tone: currentSafeCash > 0 ? "success" : "neutral",
                })}
                {renderClubMetricCard({
                  label: "Wejsciowki",
                  value: formatMoney(pendingClubEntryRevenue),
                  note: `${pendingClubGuestCount} gosci`,
                  tone: pendingClubEntryRevenue > 0 ? "gold" : "neutral",
                })}
                {renderClubMetricCard({
                  label: "Stash",
                  value: `${pendingClubGuestConsumeCount}`,
                  note: "Zejsc w kolejce",
                  tone: pendingClubGuestConsumeCount > 0 ? "info" : "neutral",
                })}
                {renderClubMetricCard({
                  label: "Raport",
                  value: clubNextReportRemaining > 0 ? formatCooldown(clubNextReportRemaining) : "Teraz",
                  note: "Kolejne rozliczenie",
                  tone: clubNextReportRemaining > 0 ? "info" : "success",
                })}
              </View>
              <View style={styles.listCard}>
                <Text style={styles.listCardTitle}>Ostatni raport</Text>
                <Text style={styles.listCardMeta}>
                  {clubReportSummary
                    ? `Obrot ${formatMoney(clubReportSummary.grossIncome || 0)} • Payout ${formatMoney(clubReportSummary.payout || 0)}`
                    : "Lokal jeszcze zbiera pierwszy czytelny raport."}
                </Text>
                <Text style={styles.listCardMeta}>
                  {clubReportSummary
                    ? `Gosci ${clubReportSummary.guestCount || 0} • Wejscia ${formatMoney(clubReportSummary.entryRevenue || 0)} • Zeszlo ${clubReportSummary.stashUsed || 0}`
                    : "Po kolejnym okresie zobaczysz wejscia, zuzycie stashu i payout."}
                </Text>
                <Text style={styles.listCardMeta}>
                  {clubReportSummary
                    ? `Presja +${Number(clubReportSummary.clubPressureGain || 0).toFixed(1)} • Dzielnica +${Number(clubReportSummary.districtPressureGain || 0).toFixed(1)} • Wplyw +${Number(clubReportSummary.influenceGain || 0).toFixed(1)}`
                    : "Na razie lokal dopiero dobija ruch, wejscia i zejscia ze stashu."}
                </Text>
                <Pressable
                  onPress={actions.collectClubSafe}
                  style={[
                    styles.inlineButton,
                    {
                      marginTop: 12,
                      minHeight: 48,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: currentSafeCash > 0 ? "#e0ae45" : "#15171b",
                      borderColor: currentSafeCash > 0 ? "#f1cf88" : "#2d3138",
                      opacity: currentSafeCash > 0 ? 1 : 0.55,
                    },
                  ]}
                  disabled={currentSafeCash <= 0}
                >
                  <Text
                    style={[
                      styles.inlineButtonText,
                      { color: currentSafeCash > 0 ? "#1f1507" : "#9098a3", fontWeight: "900" },
                    ]}
                  >
                    {currentSafeCash > 0 ? `Odbierz wszystko ${formatMoney(currentSafeCash)}` : "Sejf pusty"}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : null}

          {clubOwnerTab === "stash" ? (
            <>
              <View style={styles.listCard}>
                <Text style={styles.listCardTitle}>Stash lokalu</Text>
                <Text style={styles.listCardMeta}>
                  {clubStashUnitCount} szt. • {clubStashTypeCount} typy • Support +{Math.round(Number(currentClubProfile?.stashSupport || 0) * 100)}%
                </Text>
                <TextInput
                  value={clubTradeDraft}
                  onChangeText={(text) => setClubTradeDraft(text.replace(/[^\d]/g, ""))}
                  placeholder="Np. 5"
                  placeholderTextColor="#6c6c6c"
                  keyboardType="numeric"
                  style={styles.chatInput}
                />
              </View>
              {ownerClubBuffs.length ? (
                <View style={[styles.listCard, { borderColor: "rgba(90, 186, 122, 0.28)", backgroundColor: "#111815" }]}>
                  <Text style={styles.listCardTitle}>Aktywne efekty lokalu</Text>
                  {ownerClubBuffs.map((drug) => (
                    <Text key={`owner-stash-buff-${drug.id}`} style={styles.listCardMeta}>
                      {drug.name} • {drug.effectLabel}
                    </Text>
                  ))}
                </View>
              ) : (
                <View style={[styles.listCard, { borderColor: "rgba(224, 78, 78, 0.22)", backgroundColor: "#1b1011" }]}>
                  <Text style={styles.listCardTitle}>Brak towaru</Text>
                  <Text style={styles.listCardMeta}>Brak buffow i slabszy ruch dopoki nie wrzucisz czegos na stash.</Text>
                </View>
              )}
              {clubStashDrugs.length ? (
                clubStashDrugs.map((drug) => (
                  <View key={drug.id} style={styles.listCard}>
                    <View style={styles.inlineRow}>
                      <View style={styles.entityHead}>
                        <EntityBadge visual={drugVisuals[drug.id]} />
                        <View style={styles.flexOne}>
                          <Text style={styles.listCardTitle}>{drug.name}</Text>
                          <Text style={styles.listCardMeta}>
                            Przy Tobie {safeGame.drugInventory[drug.id] || 0} • W klubie {safeGame.club.stash[drug.id] || 0}
                          </Text>
                          <Text style={styles.listCardMeta}>{formatClubDrugEffect(drug)}</Text>
                        </View>
                      </View>
                      <Pressable
                        onPress={() => actions.moveDrugToClub(drug, clubTradeDraft)}
                        style={[
                          styles.inlineButton,
                          Number(safeGame.drugInventory[drug.id] || 0) < clubTradeQuantity && styles.tileDisabled,
                        ]}
                      >
                        <Text style={styles.inlineButtonText}>{`Dodaj x${clubTradeQuantity}`}</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Nie masz teraz nic do dorzucenia. Dowiez towar z fabryk i wrzuc go na zaplecze.</Text>
              )}
            </>
          ) : null}

          {safeGame.club.recentIncident?.text ? (
            <View style={styles.lockedPanel}>
              <Text style={styles.lockedPanelText}>{safeGame.club.recentIncident.text}</Text>
            </View>
          ) : null}
        </SectionCard>
      ) : (
        <SectionCard title={currentClubVenue.name} subtitle="Wchodzisz, robisz ruch i od razu widzisz czy lokal zyje z towaru czy tylko z samej sali.">
          <View style={[styles.listCard, { marginBottom: 12 }]}>
            <View style={styles.listCardHeader}>
              <View style={styles.entityHead}>
                <EntityBadge visual={currentClubVenue.iconVisual || businessVisuals.club} />
                <View style={styles.flexOne}>
                  <Text style={styles.listCardTitle}>{currentClubVenue.name}</Text>
                  <Text style={styles.listCardMeta}>
                    {currentClubVenue.ownerLabel || "Miasto"} • {currentClubVenue.districtId || "Adres miasta"}
                  </Text>
                </View>
              </View>
              <Tag text={guestHasVenueAccess ? "W srodku" : "Gosc"} warning={!guestHasVenueAccess} />
            </View>
            <View style={styles.mobileOverviewGrid}>
              {renderClubMetricCard({
                label: "Wejscie",
                value: guestHasVenueAccess ? "Aktywne" : formatMoney(currentEntryFee),
                note: guestHasVenueAccess
                  ? guestAccessRemaining > 0
                    ? `Opaska ${formatCooldown(guestAccessRemaining)}`
                    : "Masz dostep"
                  : currentEntryFee > 0
                    ? "Placisz raz za okno"
                    : "Lista otwarta",
                tone: guestHasVenueAccess ? "success" : "gold",
              })}
              {renderClubMetricCard({
                label: "Ruch",
                value: `${Math.round(displayedTraffic)}`,
                note: trafficLabel,
                tone: displayedTraffic >= 12 ? "success" : "neutral",
              })}
              {renderClubMetricCard({
                label: "Presja",
                value: `${Math.round(displayedPressure)}`,
                note: pressureLabel,
                tone: displayedPressure >= 46 ? "danger" : "info",
              })}
              {renderClubMetricCard({
                label: "Kontakt",
                value: activeLeadEscort ? `${Math.round(leadMeterProgress * 100)}%` : "--",
                note: activeLeadEscort ? activeLeadEscort.name : "Brak leada",
                tone: activeLeadEscort ? "info" : "neutral",
              })}
            </View>
            <View style={styles.listActionsRow}>
              {!guestHasVenueAccess ? (
                <Pressable
                  onPress={() => actions.enterClubAsGuest(currentClubVenue)}
                  style={[
                    styles.inlineButton,
                    currentEntryFee > 0 && Number(safeGame.player.cash || 0) < currentEntryFee && styles.tileDisabled,
                  ]}
                >
                  <Text style={styles.inlineButtonText}>
                    {currentEntryFee > 0 ? `Wejdz za ${formatMoney(currentEntryFee)}` : "Wejdz do lokalu"}
                  </Text>
                </Pressable>
              ) : null}
              <Pressable onPress={actions.leaveClubAsGuest} style={styles.inlineButton}>
                <Text style={styles.inlineButtonText}>Wyjdz</Text>
              </Pressable>
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={[styles.listCardTitle, { marginBottom: 2 }]}>Akcje goscia</Text>
            <View style={[styles.grid, { gap: 10 }]}>
              {clubVisitorActions.map((action) => {
                const disabled =
                  clubActionCooldownRemaining > 0 || !guestHasVenueAccess || (action.id === "hunt" && !activeLeadEscort);
                const subtitle =
                  action.id === "scout"
                    ? `+${currentClubProfile.networkBoostValue}% do kolejnego kontaktu`
                    : action.id === "hunt"
                      ? activeLeadEscort
                        ? `${formatMoney(action.costCash)} • +${currentClubProfile.huntProgressValue} progressu`
                        : "Brak celu na tym progu"
                      : `Heat -${currentClubProfile.layLowHeat} • HP +${currentClubProfile.layLowHp}`;
                return (
                  <Pressable
                    key={action.id}
                    onPress={() => actions.runClubVisitorAction(action.id)}
                    style={[
                      styles.listCard,
                      {
                        width: "47.5%",
                        padding: 12,
                        borderColor: disabled ? "#25292f" : "rgba(224, 174, 69, 0.2)",
                        backgroundColor: disabled ? "#101214" : "#14110d",
                        opacity: disabled ? 0.55 : 1,
                      },
                    ]}
                    disabled={disabled}
                  >
                    <Text style={styles.listCardTitle}>{action.name}</Text>
                    <Text style={styles.listCardMeta}>{subtitle}</Text>
                    <Text style={styles.costLabel}>
                      {!guestHasVenueAccess
                        ? currentEntryFee > 0
                          ? `Najpierw ${formatMoney(currentEntryFee)}`
                          : "Najpierw wejdz"
                        : clubActionCooldownRemaining > 0
                          ? `Za ${formatCooldown(clubActionCooldownRemaining)}`
                          : "Graj teraz"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {renderClubTabRow(guestClubTabs, clubGuestTab, setClubGuestTab)}

          {clubGuestTab === "actions" ? (
            <View style={styles.listCard}>
              <Text style={styles.listCardTitle}>Stan sali</Text>
              <Text style={styles.listCardMeta}>
                {guestHasVenueAccess
                  ? clubActionCooldownRemaining > 0
                    ? `Kolejny ruch za ${formatCooldown(clubActionCooldownRemaining)}.`
                    : "Masz pelny dostep do sali i trzech ruchow."
                  : currentEntryFee > 0
                    ? `Najpierw wejscie za ${formatMoney(currentEntryFee)}.`
                    : "Lokal wpuszcza bez oplaty."}
              </Text>
              <Text style={styles.listCardMeta}>
                Wejdz w obieg podbija kolejny kontakt, Szukaj kontaktu dobija progress, a Przyczaj sie zbija heat i podnosi HP.
              </Text>
              {lastOutcome ? <Text style={styles.listCardMeta}>{lastOutcome.logMessage}</Text> : null}
            </View>
          ) : null}

          {clubGuestTab === "opportunities" ? (
            <>
              <View style={styles.listCard}>
                <View style={styles.listCardHeader}>
                  <View style={styles.entityHead}>
                    <EntityBadge visual={activeLeadEscort ? escortVisuals[activeLeadEscort.id] || escortVisuals.velvet : systemVisuals.street} />
                    <View style={styles.flexOne}>
                      <Text style={styles.listCardTitle}>{activeLeadEscort ? `Lead na ${activeLeadEscort.name}` : "Kontakt jeszcze sie nie odpalil"}</Text>
                      <Text style={styles.listCardMeta}>
                        {activeLeadEscort
                          ? `${leadProgress}/${leadRequired} • Kolejny ruch daje +${currentClubProfile.huntProgressValue}`
                          : "Podnies respekt albo wejdz do mocniejszego lokalu po lepszy kontakt."}
                      </Text>
                    </View>
                  </View>
                  <Tag text={activeLeadEscort ? `${Math.round(leadMeterProgress * 100)}%` : "--"} warning={!activeLeadEscort} />
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.max(4, leadMeterProgress * 100)}%` }]} />
                </View>
                <Text style={styles.listCardMeta}>
                  {lastOutcome
                    ? lastOutcome.logMessage
                    : guestHasVenueAccess
                      ? "Pierwszy ruch od razu pokazuje konkretny wynik: boost do kontaktu, progress albo zejscie heat."
                      : "Wejdz do lokalu, zeby odpalic caly loop sali."}
                </Text>
              </View>
              <View
                style={[
                  styles.listCard,
                  {
                    borderColor: guestClubBuffs.length ? "rgba(90, 186, 122, 0.28)" : "rgba(224, 78, 78, 0.22)",
                    backgroundColor: guestClubBuffs.length ? "#111815" : "#1b1011",
                  },
                ]}
              >
                <Text style={styles.listCardTitle}>Aktywne efekty</Text>
                {guestClubBuffs.length ? (
                  guestClubBuffs.map((drug) => (
                    <Text key={`guest-buff-${drug.id}`} style={styles.listCardMeta}>
                      {drug.name} • {drug.effectLabel}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.listCardMeta}>Brak towaru - brak buffow i slabszy ruch lokalu.</Text>
                )}
              </View>
            </>
          ) : null}

          {clubGuestTab === "local" ? (
            <View style={styles.listCard}>
              <Text style={styles.listCardTitle}>Lokal</Text>
              <Text style={styles.listCardMeta}>
                {currentClubVenue.districtId || "Adres miasta"} • {activeClubPlan?.name || "Guest List"} • {currentClubProfile.label}
              </Text>
              <Text style={styles.listCardMeta}>
                {protectorGangName
                  ? `${protectorGangName} trzyma ten adres. Obrona +${Math.round(Number(protectorEffects?.clubSecurity || 0))}, threat lzej o ${Math.round(Number(protectorEffects?.clubThreatMitigation || 0) * 100)}%.`
                  : "Brak protektora. Lokal bierze cala presje na siebie."}
              </Text>
              <Text style={styles.listCardMeta}>
                {activeClubDistrictAlert
                  ? activeClubDistrictAlert
                  : activeClubDistrictLines.slice(0, 2).join(" • ")}
              </Text>
            </View>
          ) : null}

          {clubGuestTab === "stash" ? (
            <>
              {!guestHasVenueAccess ? (
                <View style={styles.listCard}>
                  <Text style={styles.listCardTitle}>Towar w lokalu</Text>
                  <Text style={styles.listCardMeta}>
                    {currentEntryFee > 0
                      ? `Najpierw wejscie za ${formatMoney(currentEntryFee)}. Opaska daje Ci dostep do stashu i akcji w lokalu.`
                      : "Wejdz do lokalu i zlap aktywne wejscie, zeby korzystac ze stashu."}
                  </Text>
                </View>
              ) : null}
              {guestHasVenueAccess && clubConsumeCooldownRemaining > 0 ? (
                <Text style={styles.listCardMeta}>{`Lokal musi chwile odpoczac. Kolejny strzal za ${formatCooldown(clubConsumeCooldownRemaining)}.`}</Text>
              ) : null}
              {guestClubStashDrugs.length ? (
                guestClubStashDrugs.map((drug) => (
                  <View key={drug.id} style={styles.listCard}>
                    <View style={styles.inlineRow}>
                      <View style={styles.entityHead}>
                        <EntityBadge visual={drugVisuals[drug.id]} />
                        <View style={styles.flexOne}>
                          <Text style={styles.listCardTitle}>{drug.name}</Text>
                          <Text style={styles.listCardMeta}>
                            Na stashu {Number(currentClubVenue?.stash?.[drug.id] || 0)} • {formatClubDrugEffect(drug)}
                          </Text>
                        </View>
                      </View>
                      <Pressable
                        onPress={() => actions.consumeDrugFromClub(drug)}
                        style={[
                          styles.inlineButton,
                          (!guestHasVenueAccess || clubConsumeCooldownRemaining > 0) && styles.tileDisabled,
                        ]}
                      >
                        <Text style={styles.inlineButtonText}>
                          {!guestHasVenueAccess
                            ? "Najpierw wejscie"
                            : clubConsumeCooldownRemaining > 0
                              ? `Za ${formatCooldown(clubConsumeCooldownRemaining)}`
                              : "Zarzuc"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Na stashu nic teraz nie lezy. Wpadasz tu glownie po kontakty i ruch na sali.</Text>
              )}
            </>
          ) : null}
        </SectionCard>
      )}
    </>
  );
}
