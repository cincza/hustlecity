import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";

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
  clubNightRemaining,
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
        : `Rośnie ${formatAccruedMoney(businessCash)}. Jeszcze chwila do pelnego dolara.`
      : "Na razie pusto.";
  const escortCollectionSubtitle =
    escortCash > 0
      ? escortCollectableCash > 0
        ? `Czeka ${formatAccruedMoney(escortCash)}.`
        : `Rośnie ${formatAccruedMoney(escortCash)}. Jeszcze chwila do rozliczenia.`
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
  const clubGuestState = safeGame.club?.guestState || {};
  const [clubTradeDraft, setClubTradeDraft] = React.useState("1");
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
  const clubTradeDrugs = drugs.filter((drug) => safeGame.player.respect >= Number(drug.unlockRespect || 0));
  const clubStashDrugs = drugs.filter(
    (drug) => Number(safeGame.drugInventory?.[drug.id] || 0) > 0 || Number(safeGame.club?.stash?.[drug.id] || 0) > 0
  );
  const getDealerPayoutValue = (drug) =>
    helpers.getDealerPayoutForDrug?.(drug) || Math.max(20, Math.floor(Number(drug?.streetPrice || 0) * 0.72));

  const renderCollectionsPanel = (title = "Skrytki i odbiory", subtitle = "Kasa nie wpada sama do kieszeni. Odbierasz ja recznie, a naliczanie zatrzymuje sie na dobowym capie.") => (
    <SectionCard title={title} subtitle={subtitle}>
      <View style={styles.listCard}>
        <View style={styles.listCardHeader}>
          <View style={styles.entityHead}>
            <EntityBadge visual={businessVisuals.tower} />
            <View style={styles.flexOne}>
              <Text style={styles.listCardTitle}>Biznesy i lokale</Text>
              <Text style={styles.listCardMeta}>Na zapleczu pracuje imperium. Tu odbierasz czysty cash z obiektow.</Text>
            </View>
          </View>
          <Text style={styles.listCardReward}>{formatMoney(totalBusinessIncome)}/min</Text>
        </View>
        <StatLine label="Do odbioru" value={`${formatAccruedMoney(businessCash)} / ${formatMoney(businessCollectionCap)}`} />
        <StatLine label="Cap 24h za" value={formatLongDuration(businessCapEta)} />
        <StatLine label="Ostatni odbior" value={formatCollectionStamp(safeGame.collections?.businessCollectedAt)} />
        <ActionTile
          title="Odbierz biznesy"
          subtitle={businessCollectionSubtitle}
          visual={systemVisuals.cash}
          onPress={actions.collectBusinessIncome}
          disabled={businessCollectableCash <= 0}
        />
      </View>

      <View style={styles.listCard}>
        <View style={styles.listCardHeader}>
          <View style={styles.entityHead}>
            <EntityBadge visual={escortVisuals.velvet} />
            <View style={styles.flexOne}>
              <Text style={styles.listCardTitle}>Ulica i panienki</Text>
              <Text style={styles.listCardMeta}>Kazda dzielnica ma inny mnoznik, inne ryzyko glin i inny poziom przemocy.</Text>
            </View>
          </View>
          <Text style={styles.listCardReward}>{formatMoney(totalEscortIncome)}/min</Text>
        </View>
        <StatLine label="Do odbioru" value={`${formatAccruedMoney(escortCash)} / ${formatMoney(escortCollectionCap)}`} />
        <StatLine label="Cap 24h za" value={formatLongDuration(escortCapEta)} />
        <StatLine label="Ostatni odbior" value={formatCollectionStamp(safeGame.collections?.escortCollectedAt)} />
        <ActionTile
          title="Odbierz ulice"
          subtitle={escortCollectionSubtitle}
          visual={systemVisuals.street}
          onPress={actions.collectEscortIncome}
          disabled={escortCollectableCash <= 0}
        />
      </View>
    </SectionCard>
  );

  if (section === "businesses") {
    return (
      <>
        <SceneArtwork
          eyebrow="Imperium"
          title="Gruba kasa zaczyna sie od zaplecza"
          lines={["Zarabianie na ulicy ma byc szybkie, ale prawdziwe pieniadze robi zaplecze: lokale, kontakty i fabryki.", "Wejscie w te systemy jest drogie, bo inaczej cale miasto rozpadnie sie ekonomicznie po paru godzinach."]}
          accent={["#4a2d18", "#17110c", "#050505"]}
          source={sceneBackgrounds.empire}
        />
        <SectionCard title="Przeglad biznesu" subtitle="Najpierw widzisz co masz, co mozesz kupic i co odblokujesz dalej.">
          <StatLine label="Masz biznesow" value={String(ownedBusinesses.reduce((sum, business) => sum + business.count, 0))} visual={systemVisuals.cash} />
          <StatLine label="Mozesz kupic teraz" value={String(availableBusinesses.length)} visual={systemVisuals.market} />
          <StatLine
            label="Nastepny unlock"
            value={nextBusinessUnlock ? `${nextBusinessUnlock.name} przy Szacunku ${nextBusinessUnlock.respect}` : "Wszystko odblokowane"}
            visual={systemVisuals.respect}
          />
        </SectionCard>

        <SectionCard title="Twoje biznesy" subtitle="Tu od razu widzisz, co juz stoi i ile tego masz.">
          {ownedBusinesses.length ? (
            ownedBusinesses.map((business) => (
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
                <Text style={styles.listCardMeta}>Jedna sztuka robi {getBusinessMinuteIncome(business)}/min.</Text>
                <Text style={styles.listCardMeta}>Upgrade: tempo {getUpgradeState(business.id).speedLevel} | cash {getUpgradeState(business.id).cashLevel}</Text>
                {business.note ? <Text style={styles.listCardMeta}>{business.note}</Text> : null}
                {(() => {
                  const preview = helpers.getBusinessUpgradePreview?.(safeGame, business, business.count);
                  if (!preview) return null;
                  return (
                    <>
                      <Text style={styles.listCardMeta}>Nastepny upgrade: szybciej -> {formatMoney(preview.nextSpeedIncome)}/min | grubsza koperta -> {formatMoney(preview.nextCashIncome)}/min</Text>
                      <View style={styles.marketButtons}>
                        <Pressable onPress={() => actions.upgradeBusiness(business, "speed")} style={styles.marketButton}>
                          <Text style={styles.marketButtonText}>Szybszy obrot {formatMoney(preview.speedCost)}</Text>
                        </Pressable>
                        <Pressable onPress={() => actions.upgradeBusiness(business, "cash")} style={styles.marketButton}>
                          <Text style={styles.marketButtonText}>Grubsza koperta {formatMoney(preview.cashCost)}</Text>
                        </Pressable>
                      </View>
                    </>
                  );
                })()}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Na razie nic nie stoi. Kup pierwszy lokal z sekcji ponizej i od razu zobaczysz go tutaj.</Text>
          )}
        </SectionCard>

        <SectionCard title="Kup teraz" subtitle="To juz jest odblokowane i gotowe do wejscia.">
          {availableBusinesses.length ? (
            availableBusinesses.map((business) => (
              <View key={`available-${business.id}`} style={styles.listCard}>
                <View style={styles.listCardHeader}>
                  <View style={styles.entityHead}>
                    <EntityBadge visual={businessVisuals[business.id]} />
                    <View style={styles.flexOne}>
                      <Text style={styles.listCardTitle}>{business.name}</Text>
                      <Text style={styles.listCardMeta}>{business.kind} | Koszt {formatMoney(business.cost)}</Text>
                    </View>
                  </View>
                  <Text style={styles.listCardReward}>{getBusinessMinuteIncome(business)}/min</Text>
                </View>
                {business.note ? <Text style={styles.listCardMeta}>{business.note}</Text> : null}
                <Pressable onPress={() => actions.buyBusiness(business)} style={styles.inlineButton}>
                  <Text style={styles.inlineButtonText}>Kup biznes</Text>
                </Pressable>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>
              {nextBusinessUnlock
                ? `Nic do kupienia w tej chwili. Nastepny biznes: ${nextBusinessUnlock.name} od ${nextBusinessUnlock.respect} RES.`
                : "Na tym progu szacunku masz juz wykupione wszystko."}
            </Text>
          )}
        </SectionCard>

        <SectionCard title="Odblokujesz pozniej" subtitle="To jeszcze czeka na szacun i grubszy bankroll.">
          {lockedBusinesses.length ? (
            lockedBusinesses.map((business) => (
              <View key={`locked-${business.id}`} style={[styles.listCard, styles.listCardLocked]}>
                <View style={styles.listCardHeader}>
                  <View style={styles.entityHead}>
                    <EntityBadge visual={businessVisuals[business.id]} />
                    <View style={styles.flexOne}>
                      <Text style={styles.listCardTitle}>{business.name}</Text>
                      <Text style={styles.listCardMeta}>🔒 Wymagany szacunek: {business.respect} | Koszt {formatMoney(business.cost)}</Text>
                    </View>
                  </View>
                  <Tag text={`🔒 ${business.respect}`} warning />
                </View>
                <Text style={styles.listCardMeta}>{getBusinessMinuteIncome(business)}/min po odblokowaniu.</Text>
                {business.note ? <Text style={styles.listCardMeta}>{business.note}</Text> : null}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Na ten moment odblokowales juz cala aktualna liste biznesow.</Text>
          )}
        </SectionCard>

        {renderCollectionsPanel("Odbior kasy", "Biznesy i ulica nie przelewaja hajsu same do kieszeni. Musisz odbierac, a skrytki maja twardy dobowy limit.")}

        <SectionCard title="Panienki" subtitle="Mozesz je kupic albo wyhaczyc w klubie. Potem wystawiasz na ulice, sciagasz albo sprzedajesz dalej.">
          <SceneArtwork
            eyebrow="Street queens"
            title="Ulica, klub i szybka fura"
            lines={["Kazda panienka ma inny zarobek, prog wejscia i trudnosc zdobycia.", "Mocniejszy lokal i klubowe boosty podnosza szanse na topowy kontakt, ale dalej to nie jest darmowa maszynka do kasy."]}
            accent={["#4d1830", "#180d12", "#050505"]}
            source={sceneBackgrounds.escort}
          />
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
                      <Text style={styles.listCardMeta}>Wymaga {escort.respect} szacunu | W rezerwie: {reserve} | Na ulicy: {working}</Text>
                    </View>
                  </View>
                  <Text style={styles.listCardReward}>{formatMoney(escort.cashPerMinute)}/min</Text>
                </View>
                <Text style={styles.listCardMeta}>{escort.note}</Text>
                <View style={styles.inlineRow}>
                  <Text style={styles.costLabel}>Kupno: {formatMoney(escort.cost)} | Sprzedaz: {formatMoney(escort.sellPrice)}</Text>
                  <Pressable onPress={() => actions.buyEscort(escort)} style={[styles.inlineButton, locked && styles.tileDisabled]}>
                    <Text style={styles.inlineButtonText}>{locked ? `Szacunek ${escort.respect}` : "Kup kontakt"}</Text>
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
                            Mnoznik x{district.incomeMultiplier.toFixed(2)} | Na trasie: {assigned} | Policja {Math.round(district.policeRisk * 100)}% | Pobicia {Math.round(district.beatRisk * 100)}% | Ucieczki {Math.round(district.escapeRisk * 100)}%
                          </Text>
                        </View>
                        <Tag text={district.respect > 0 ? `${district.respect} RES` : "OPEN"} warning={districtLocked} />
                      </View>
                      <Text style={styles.listCardMeta}>{district.note}</Text>
                      <View style={styles.marketButtons}>
                        <Pressable onPress={() => actions.assignEscortToStreet(escort, district.id)} style={[styles.marketButton, (locked || reserve <= 0 || districtLocked) && styles.tileDisabled]}>
                          <Text style={styles.marketButtonText}>Wystaw</Text>
                        </Pressable>
                        <Pressable onPress={() => actions.pullEscortFromStreet(escort, district.id)} style={[styles.marketButton, assigned <= 0 && styles.tileDisabled]}>
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
    );
  }

  if (section === "factories") {
    return (
      <>
        <SceneArtwork
          eyebrow="Fabryki"
          title="Produkcja, hurtownie i mocny towar"
          lines={["Kazdy mocniejszy towar daje lepsze staty, ale koszt wejscia i ryzyko przedawkowania rosna razem z nim.", "To ma wygladac jak brudne laboratorium miasta, a nie tabelka z excela."]}
          accent={["#3d2918", "#16100c", "#050505"]}
          source={sceneBackgrounds.empire}
        />
        <SectionCard title="Progres fabryk" subtitle="Pierwsza produkcja wpada szybciej. Widzisz od razu, co otworzy Ci kolejny prog szacunku.">
          <StatLine label="Twoj szacunek" value={`${safeGame.player.respect}`} />
          {factoryMilestones.map((milestone) => {
            const unlocked = safeGame.player.respect >= milestone.respect;
            return (
              <View key={milestone.respect} style={[styles.listCard, !unlocked && styles.listCardLocked]}>
                <View style={styles.listCardHeader}>
                  <View style={styles.flexOne}>
                    <Text style={styles.listCardTitle}>{milestone.title}</Text>
                    <Text style={styles.listCardMeta}>
                      Szacunek {milestone.respect} | {milestone.unlocks.map((factory) => factory.name).join(", ")}
                    </Text>
                  </View>
                  <Tag text={unlocked ? "Odblokowane" : `🔒 ${milestone.respect}`} warning={!unlocked} />
                </View>
              </View>
            );
          })}
        </SectionCard>
        <SectionCard title="Fabryki" subtitle="Fabryki sa grubo wycenione. Zarabianie jest realne, ale wejscie w produkcje kosztuje powazny hajs.">
          {factories.map((factory) => {
            const owned = helpers.hasFactory(safeGame, factory.id);
            const factoryRisk = Math.max(...factory.unlocks.map((drugId) => helpers.getDrugPoliceProfile(drugs.find((entry) => entry.id === drugId)).risk));
            return (
              <View key={factory.id} style={[styles.listCard, safeGame.player.respect < factory.respect && styles.listCardLocked]}>
                <View style={styles.listCardHeader}>
                  <View style={styles.entityHead}>
                    <EntityBadge visual={factoryVisuals[factory.id]} />
                    <View style={styles.flexOne}>
                      <Text style={styles.listCardTitle}>{factory.name}</Text>
                      <Text style={styles.listCardMeta}>🔒 Wymagany szacunek: {factory.respect} | {factory.text}</Text>
                    </View>
                  </View>
                  {owned ? <Tag text="Masz" /> : <Tag text={safeGame.player.respect < factory.respect ? `🔒 ${factory.respect}` : formatMoney(factory.cost)} warning />}
                </View>
                <Text style={styles.listCardMeta}>
                  Odblokowuje: {factory.unlocks.map((drugId) => drugs.find((entry) => entry.id === drugId)?.name).join(", ")} | Presja glin: {Math.round(factoryRisk * 100)}%
                </Text>
                <View style={styles.inlineRow}>
                  <Text style={styles.costLabel}>{owned ? "Zaklad stoi i pracuje." : safeGame.player.respect < factory.respect ? `Wymagany szacunek: ${factory.respect}` : `Koszt: ${formatMoney(factory.cost)}`}</Text>
                  <Pressable onPress={() => actions.buyFactory(factory)} style={[styles.inlineButton, (owned || safeGame.player.respect < factory.respect) && styles.tileDisabled]}>
                    <Text style={styles.inlineButtonText}>{owned ? "Kupione" : safeGame.player.respect < factory.respect ? "Zablokowane" : "Przejmij"}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </SectionCard>

        <SectionCard title="Produkcja" subtitle="Kazdy mocniejszy towar daje lepsze staty, ale niesie wieksze ryzyko zgonu po spozyciu.">
          {drugs.map((drug) => {
            const policeProfile = helpers.getDrugPoliceProfile(drug);
            return (
              <View key={drug.id} style={styles.listCard}>
                <View style={styles.listCardHeader}>
                  <View style={styles.entityHead}>
                    <EntityBadge visual={drugVisuals[drug.id]} />
                    <View style={styles.flexOne}>
                      <Text style={styles.listCardTitle}>{drug.name}</Text>
                      <Text style={styles.listCardMeta}>
                        Partia: {drug.batchSize} | Smiertelnosc {Math.round(drug.overdoseRisk * 100)}% | Na stanie: {safeGame.drugInventory[drug.id] || 0}
                      </Text>
                    </View>
                  </View>
                  <Tag text={`+${Object.entries(drug.effect).map(([key, value]) => `${key} ${value}`).join(", ")}`} />
                </View>
                <Text style={styles.listCardMeta}>
                  Wymagane: {Object.entries(drug.supplies).map(([supplyId, amount]) => `${suppliers.find((entry) => entry.id === supplyId)?.name || supplyId} x${amount}`).join(" | ")}
                </Text>
                <Text style={styles.listCardMeta}>Ryzyko policji: {Math.round(policeProfile.risk * 100)}% | {policeProfile.label}</Text>
                <View style={styles.inlineRow}>
                  <Text style={styles.costLabel}>Wymagana fabryka: {factories.find((entry) => entry.id === drug.factoryId)?.name}</Text>
                  <Pressable onPress={() => actions.produceDrug(drug)} style={[styles.inlineButton, !helpers.hasFactory(safeGame, drug.factoryId) && styles.tileDisabled]}>
                    <Text style={styles.inlineButtonText}>Produkuj</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </SectionCard>
      </>
    );
  }

  if (section === "suppliers") {
    return (
      <>
        <SceneArtwork
          eyebrow="Hurtownie"
          title="Skladniki dla calego lancucha"
          lines={["Bez szkła, chemii, tytoniu i pakowania nawet najlepsza fabryka stoi i nie robi nic.", "Tu kupujesz brud codziennosci, z ktorego potem rodza sie duze pieniadze."]}
          accent={["#372519", "#150f0c", "#050505"]}
          source={sceneBackgrounds.market}
        />
        <SectionCard title="Hurtownie" subtitle="Tu kupujesz skladniki do produkcji. Bez limitu slotow i bez blokady ilosci.">
          <View style={styles.listCard}>
            <View style={styles.entityHead}>
              <EntityBadge visual={systemVisuals.supplier} />
              <View style={styles.flexOne}>
                <Text style={styles.listCardTitle}>Zaplecze hurtowe</Text>
                <Text style={styles.listCardMeta}>Kazdy skladnik kupujesz bez limitu hurtowni. Jedyny limit to Twoja kasa.</Text>
              </View>
            </View>
          </View>
          {suppliers.map((supply) => (
            <View key={supply.id} style={styles.listCard}>
              <View style={styles.inlineRow}>
                <View style={styles.entityHead}>
                  <EntityBadge visual={supplierVisuals[supply.id] || systemVisuals.supplier} />
                  <View style={styles.flexOne}>
                    <Text style={styles.listCardTitle}>{supply.name}</Text>
                    <Text style={styles.listCardMeta}>{supply.unit} | Na stanie: {safeGame.supplies[supply.id] || 0} | Bez limitu</Text>
                  </View>
                </View>
                <Pressable onPress={() => actions.buySupply(supply)} style={styles.inlineButton}>
                  <Text style={styles.inlineButtonText}>Kup {formatMoney(supply.price)}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </SectionCard>
      </>
    );
  }

  return (
    <>
      <SceneArtwork
        eyebrow="Klub"
        title="Lokal, ruch i nocne okazje"
        lines={["Klub to ruch, kontakty i nocne okazje.", "Wlasciciel ustawia plan nocy, a odwiedzajacy maja trzy proste ruchy."]}
        accent={["#432417", "#170f0c", "#050505"]}
        source={sceneBackgrounds.clubWide}
      />
      {!currentClubVenue ? (
        <SectionCard title="Rynek klubow" subtitle="Wpadasz po kontakty albo przejmujesz lokal, jesli masz na to szacun i hajs.">
          {safeGame.clubListings.map((listing) => {
            const isOwnedByPlayer = safeGame.club.owned && safeGame.club.sourceId === listing.id;
            const listingProfile = helpers.getClubVenueProfile(safeGame, listing);
            const listingPlan = helpers.getClubNightPlan?.(listing.nightPlanId) || clubNightPlans?.[0];
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
              <View key={listing.id} style={styles.listCard}>
                <View style={styles.listCardHeader}>
                  <View style={styles.entityHead}>
                    <EntityBadge visual={businessVisuals.club} />
                    <View style={styles.flexOne}>
                      <Text style={styles.listCardTitle}>{listing.name}</Text>
                      <Text style={styles.listCardMeta}>
                        Wlasciciel: {listing.ownerLabel} | Szacun {listing.respect} | Popularnosc {listing.popularity}% | Nastroj {listing.mood}%
                      </Text>
                    </View>
                  </View>
                  <Tag text={isOwnedByPlayer ? "Twoj" : formatMoney(listing.takeoverCost)} warning={!isOwnedByPlayer} />
                </View>
                <Text style={styles.listCardMeta}>{listing.note}</Text>
                <Text style={styles.listCardMeta}>
                  {listing.districtId ? `Dzielnica: ${listing.districtId} | ` : ""}Plan nocy: {listingPlan?.name || "Guest List"} | Ruch {Math.round(listing.traffic || 0)} | Presja: {listingPressureLabel}
                </Text>
                <Text style={styles.listCardMeta}>
                  Scout do {formatMoney(listingProfile.scoutTipValue)} | Hunt +{listingProfile.huntProgressValue} | Lay Low: -{listingProfile.layLowHeat} heat
                </Text>
                <View style={styles.marketButtons}>
                  <Pressable onPress={() => actions.enterClubAsGuest(listing)} style={styles.marketButton}>
                    <Text style={styles.marketButtonText}>{isOwnedByPlayer ? "Wejdz do swojego" : "Wejdz"}</Text>
                  </Pressable>
                  <Pressable onPress={() => actions.openClub(listing)} style={[styles.marketButton, (safeGame.club.owned || safeGame.player.respect < listing.respect || isOwnedByPlayer) && styles.tileDisabled]}>
                    <Text style={styles.marketButtonText}>{isOwnedByPlayer ? "Kupione" : "Przejmij"}</Text>
                  </Pressable>
                </View>
                <View style={styles.inlineRow}>
                  <Text style={styles.costLabel}>
                    {isOwnedByPlayer
                      ? "Lokal jest Twoj. Wejdz do srodka, zeby odpalic swoj panel."
                      : `Przejecie: ${formatMoney(listing.takeoverCost)}`}
                  </Text>
                </View>
              </View>
            );
          })}
          <View style={styles.grid}>
            <ActionTile
              title="Postaw nowy klub"
              subtitle={`Boss gangu moze zalozyc nowy lokal za ${formatMoney(clubFoundingCashCost)}.`}
              visual={systemVisuals.club}
              onPress={actions.foundClub}
              disabled={safeGame.club.owned || !safeGame.gang.joined || safeGame.gang.role !== "Boss"}
            />
          </View>
        </SectionCard>
      ) : null}

      <SectionCard
        title={currentClubVenue ? `Stan lokalu: ${currentClubVenue.name}` : "Stan klubu"}
        subtitle={currentClubVenue ? "Widzisz stan lokalu, plan nocy i to, co dzieje sie teraz." : "Wejdz do lokalu, zeby odpalic trzy akcje klubowe."}
      >
        <View style={styles.heroBanner}>
          <View style={styles.listCardHeader}>
            <View style={styles.entityHead}>
              <EntityBadge visual={businessVisuals.club} />
              <View style={styles.flexOne}>
                <Text style={styles.heroBannerTitle}>{currentClubVenue ? currentClubVenue.name : "Poza klubem"}</Text>
                <Text style={styles.heroBannerText}>
                  {currentClubVenue
                    ? `${insideOwnClub ? "Twoj lokal" : `Wlasciciel: ${currentClubVenue.ownerLabel}`}. Plan nocy: ${activeClubPlan?.name || "Guest List"}.`
                    : "Wybierz lokal z listy wyzej, zeby wejsc do srodka."}
                </Text>
              </View>
            </View>
            {currentClubVenue ? <Tag text={insideOwnClub ? "OWNER" : "GOSC"} warning={!insideOwnClub} /> : null}
          </View>
          {currentClubVenue ? (
            <>
              <View style={styles.mobileOverviewGrid}>
                <View style={styles.mobileOverviewCard}>
                  <Text style={styles.mobileOverviewLabel}>Popularnosc</Text>
                  <Text style={styles.mobileOverviewValue}>{Math.round(currentClubVenue.popularity || 0)}%</Text>
                  <Text style={styles.listCardMeta}>Mood {Math.round(currentClubVenue.mood || 0)}%</Text>
                </View>
                <View style={styles.mobileOverviewCard}>
                  <Text style={styles.mobileOverviewLabel}>Ruch</Text>
                  <Text style={styles.mobileOverviewValue}>{Math.round(displayedTraffic)}</Text>
                  <Text style={styles.listCardMeta}>{trafficLabel}</Text>
                </View>
                <View style={styles.mobileOverviewCard}>
                  <Text style={styles.mobileOverviewLabel}>Presja</Text>
                  <Text style={styles.mobileOverviewValue}>{Math.round(displayedPressure)}</Text>
                  <Text style={styles.listCardMeta}>{pressureLabel}</Text>
                </View>
                <View style={styles.mobileOverviewCard}>
                  <Text style={styles.mobileOverviewLabel}>Lead</Text>
                  <Text style={styles.mobileOverviewValueSmall}>
                    {activeLeadEscort ? `${leadProgress}/${leadRequired}` : "Brak celu"}
                  </Text>
                  <Text style={styles.listCardMeta}>{activeLeadEscort ? activeLeadEscort.name : "Odblokuj wyzszy respekt"}</Text>
                </View>
                <View style={styles.mobileOverviewCard}>
                  <Text style={styles.mobileOverviewLabel}>Dzielnica</Text>
                  <Text style={styles.mobileOverviewValueSmall}>{currentClubVenue.districtId || focusDistrictSummary?.shortName || "-"}</Text>
                  <Text style={styles.listCardMeta}>{currentClubVenue.districtId === focusDistrictSummary?.id ? "Fokus gangu" : "Teren lokalu"}</Text>
                </View>
                <View style={styles.mobileOverviewCard}>
                  <Text style={styles.mobileOverviewLabel}>Obrona</Text>
                  <Text style={styles.mobileOverviewValue}>{Math.round((insideOwnClub ? safeGame.club.defenseReadiness : currentClubVenue.defenseReadiness) || 0)}</Text>
                  <Text style={styles.listCardMeta}>Zagrozenie {Math.round((insideOwnClub ? safeGame.club.threatLevel : currentClubVenue.threatLevel) || 0)}</Text>
                </View>
              </View>
              <Text style={styles.listCardMeta}>{currentClubProfile.label}</Text>
              <Text style={styles.listCardMeta}>{activeClubPlan?.summary}</Text>
              {insideOwnClub ? (
                <View style={styles.planChipRow}>
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
              ) : null}
              {insideOwnClub && safeGame.club.recentIncident?.text ? (
                <View style={styles.lockedPanel}>
                  <Text style={styles.lockedPanelText}>{safeGame.club.recentIncident.text}</Text>
                </View>
              ) : null}
              {insideOwnClub ? (
                <View style={styles.listActionsRow}>
                  <Pressable onPress={actions.fortifyClub} style={styles.inlineButton}>
                    <Text style={styles.inlineButtonText}>Zabezpiecz lokal</Text>
                  </Pressable>
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      </SectionCard>

      {currentClubVenue ? (
        <SectionCard
          title="Akcje w klubie"
          subtitle={
            clubActionCooldownRemaining > 0
              ? `Kolejny ruch za ${formatCooldown(clubActionCooldownRemaining)}.`
              : "Masz trzy szybkie ruchy."
          }
        >
          <View style={styles.grid}>
            {clubVisitorActions.map((action) => {
              const disabled =
                clubActionCooldownRemaining > 0 ||
                (action.id === "hunt" && !activeLeadEscort);
              const subtitle =
                action.id === "scout"
                  ? `Tip do ${formatMoney(currentClubProfile.scoutTipValue)}. Krotki rekonesans sali.`
                  : action.id === "hunt"
                    ? activeLeadEscort
                      ? `${activeLeadEscort.name}: +${currentClubProfile.huntProgressValue} postepu za ${formatMoney(action.costCash)}.`
                      : "Na tym progu nie ma jeszcze kontaktu do namierzenia."
                    : `Heat -${currentClubProfile.layLowHeat} | HP +${currentClubProfile.layLowHp}. Chwila oddechu.`;

              return (
                <ActionTile
                  key={action.id}
                  title={action.name}
                  subtitle={subtitle}
                  visual={
                    action.id === "scout"
                      ? systemVisuals.cash
                      : action.id === "hunt"
                        ? systemVisuals.street
                        : systemVisuals.heat
                  }
                  onPress={() => actions.runClubVisitorAction(action.id)}
                  disabled={disabled}
                />
              );
            })}
          </View>
        </SectionCard>
      ) : null}

      <SectionCard
        title={currentClubVenue ? "Okazje i wynik" : "Po co tu wchodzic"}
        subtitle={
          currentClubVenue
            ? "Tu widzisz postep, ostatni rezultat i ruchy wlasciciela."
            : "Klub daje kontakty, ruch i nocne okazje."
        }
      >
        {!currentClubVenue ? (
          <View style={styles.lockedPanel}>
            <Text style={styles.lockedPanelText}>
              Po wejsciu do lokalu odpalasz trzy szybkie akcje. Scout szuka tipa, Hunt Contacts pcha kontakt do przodu, a Lay Low zrzuca heat i daje oddech.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.listCard}>
              <View style={styles.listCardHeader}>
                <View style={styles.entityHead}>
                  <EntityBadge visual={activeLeadEscort ? escortVisuals[activeLeadEscort.id] || escortVisuals.velvet : systemVisuals.street} />
                  <View style={styles.flexOne}>
                    <Text style={styles.listCardTitle}>{activeLeadEscort ? `Lead na ${activeLeadEscort.name}` : "Lead meter czeka"}</Text>
                    <Text style={styles.listCardMeta}>
                      {activeLeadEscort
                        ? `${leadProgress}/${leadRequired} lead | ${formatMoney(activeLeadEscort.cashPerMinute)}/min po domknieciu`
                        : "Podnies respekt albo zmien lokal, zeby odpalic lepsze kontakty."}
                    </Text>
                  </View>
                </View>
                <Tag text={activeLeadEscort ? `${Math.round(leadMeterProgress * 100)}%` : "--"} warning={!activeLeadEscort} />
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.max(4, leadMeterProgress * 100)}%` }]} />
              </View>
            </View>

            <View style={styles.listCard}>
              <Text style={styles.listCardTitle}>Ostatni wynik</Text>
              <Text style={styles.listCardMeta}>
                {lastOutcome
                  ? lastOutcome.logMessage
                  : "Po pierwszej akcji zobaczysz tutaj konkret: tip, lead albo chwile spokoju."}
              </Text>
              <View style={styles.listActionsRow}>
                {insideOwnClub ? (
                  <>
                    <Pressable onPress={actions.promoteClub} style={styles.inlineButton}>
                      <Text style={styles.inlineButtonText}>Promo</Text>
                    </Pressable>
                    <Pressable
                      onPress={actions.runClubNight}
                      style={[styles.inlineButton, clubNightRemaining > 0 && styles.tileDisabled]}
                    >
                      <Text style={styles.inlineButtonText}>
                        {clubNightRemaining > 0 ? `Noc za ${formatCooldown(clubNightRemaining)}` : "Odpal noc"}
                      </Text>
                    </Pressable>
                  </>
                ) : null}
                <Pressable onPress={actions.leaveClubAsGuest} style={styles.inlineButton}>
                  <Text style={styles.inlineButtonText}>Wyjdz</Text>
                </Pressable>
              </View>
              {insideOwnClub ? (
                <Text style={styles.listCardMeta}>
                  Noc skaluje sie z ruchem i tym, co dzieje sie w lokalu.
                </Text>
              ) : (
                <Text style={styles.listCardMeta}>
                  W tym lokalu wpadasz glownie po kontakty i okazje.
                </Text>
              )}
            </View>
          </>
        )}
      </SectionCard>

      {currentClubVenue ? (
        <SectionCard
          title="Towar w klubie"
          subtitle={insideOwnClub ? "Kupujesz, sprzedajesz i dorzucasz stash bez wychodzenia z lokalu." : "Handel masz pod reka, nawet jako gosc."}
        >
          <View style={styles.listCard}>
            <View style={styles.entityHead}>
              <EntityBadge visual={systemVisuals.dealer} />
              <View style={styles.flexOne}>
                <Text style={styles.listCardTitle}>Ilosc transakcji</Text>
                <Text style={styles.listCardMeta}>
                  {insideOwnClub ? "Ta sama ilosc dziala do handlu i do wrzutki na stash." : "Kupujesz i sprzedajesz bez wychodzenia z sali."}
                </Text>
              </View>
            </View>
            <TextInput
              value={clubTradeDraft}
              onChangeText={(text) => setClubTradeDraft(text.replace(/[^\d]/g, ""))}
              placeholder="Np. 5"
              placeholderTextColor="#6c6c6c"
              keyboardType="numeric"
              style={styles.chatInput}
            />
          </View>
          {clubTradeDrugs.length ? (
            clubTradeDrugs.map((drug) => {
              const stock = Number(safeGame.dealerInventory?.[drug.id] || 0);
              const ownCount = Number(safeGame.drugInventory?.[drug.id] || 0);
              const stashCount = Number(safeGame.club?.stash?.[drug.id] || 0);
              const buyTotal = Number(drug.streetPrice || 0) * clubTradeQuantity;
              const sellTotal = getDealerPayoutValue(drug) * clubTradeQuantity;
              const buyDisabled = stock < clubTradeQuantity || Number(safeGame.player.cash || 0) < buyTotal;
              const sellDisabled = ownCount < clubTradeQuantity;

              return (
                <View key={`club-trade-${drug.id}`} style={styles.listCard}>
                  <View style={styles.listCardHeader}>
                    <View style={styles.entityHead}>
                      <EntityBadge visual={drugVisuals[drug.id]} />
                      <View style={styles.flexOne}>
                        <Text style={styles.listCardTitle}>{drug.name}</Text>
                        <Text style={styles.listCardMeta}>
                          U dilera: {stock} | Przy Tobie: {ownCount} | W klubie: {stashCount}
                        </Text>
                      </View>
                    </View>
                    <Tag text={`Partia ${drug.batchSize}`} />
                  </View>
                  <Text style={styles.listCardMeta}>
                    Cena {formatMoney(drug.streetPrice)} | Skup {formatMoney(getDealerPayoutValue(drug))}
                  </Text>
                  <View style={styles.marketButtons}>
                    <Pressable
                      onPress={() => actions.buyDrugFromDealer(drug, clubTradeDraft)}
                      style={[styles.marketButton, buyDisabled && styles.tileDisabled]}
                    >
                      <Text style={styles.marketButtonText}>{`Kup za ${formatMoney(buyTotal)}`}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => actions.sellDrugToDealer(drug, clubTradeDraft)}
                      style={[styles.marketButton, sellDisabled && styles.tileDisabled]}
                    >
                      <Text style={styles.marketButtonText}>{`Sprzedaj za ${formatMoney(sellTotal)}`}</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>Na tym progu nie masz jeszcze odblokowanego towaru do handlu.</Text>
          )}
        </SectionCard>
      ) : null}

      {insideOwnClub ? (
        <SectionCard title="Stash klubu" subtitle={`Wrzucasz x${clubTradeQuantity} do zaplecza przed kolejna noca.`}>
          {clubStashDrugs.length ? (
            clubStashDrugs.map((drug) => (
              <View key={drug.id} style={styles.listCard}>
                <View style={styles.inlineRow}>
                  <View style={styles.entityHead}>
                    <EntityBadge visual={drugVisuals[drug.id]} />
                    <View style={styles.flexOne}>
                      <Text style={styles.listCardTitle}>{drug.name}</Text>
                      <Text style={styles.listCardMeta}>
                        Przy Tobie: {safeGame.drugInventory[drug.id] || 0} | W klubie: {safeGame.club.stash[drug.id] || 0}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => actions.moveDrugToClub(drug, clubTradeDraft)}
                    style={[styles.inlineButton, Number(safeGame.drugInventory[drug.id] || 0) < clubTradeQuantity && styles.tileDisabled]}
                  >
                    <Text style={styles.inlineButtonText}>{`Wrzuc x${clubTradeQuantity}`}</Text>
                  </Pressable>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Nie masz teraz nic do dorzucenia na stash. Kup towar w klubie albo dowiez go z fabryk.</Text>
          )}
        </SectionCard>
      ) : null}

      {false ? (
      <SectionCard title="Stash klubu" subtitle="Dorzuc towar z fabryk do klubu. Tu jest glowny loop z dragami.">
        {!safeGame.club.owned ? (
          <Text style={styles.emptyText}>Bez swojego lokalu nie masz gdzie wrzucac towaru.</Text>
        ) : !insideOwnClub ? (
          <View style={styles.lockedPanel}>
            <Text style={styles.lockedPanelText}>Stash jest dostepny tylko, kiedy fizycznie siedzisz w swoim klubie.</Text>
          </View>
        ) : (
          drugs.map((drug) => (
            <View key={drug.id} style={styles.listCard}>
              <View style={styles.inlineRow}>
                <View style={styles.entityHead}>
                  <EntityBadge visual={drugVisuals[drug.id]} />
                  <View style={styles.flexOne}>
                    <Text style={styles.listCardTitle}>{drug.name}</Text>
                    <Text style={styles.listCardMeta}>Przy Tobie: {safeGame.drugInventory[drug.id] || 0} | W klubie: {safeGame.club.stash[drug.id] || 0}</Text>
                  </View>
                </View>
                <Pressable onPress={() => actions.moveDrugToClub(drug)} style={[styles.inlineButton, (safeGame.drugInventory[drug.id] || 0) <= 0 && styles.tileDisabled]}>
                  <Text style={styles.inlineButtonText}>Wrzuć do klubu</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </SectionCard>
      ) : null}
    </>
  );
}
