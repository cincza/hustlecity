import React from "react";
import { Pressable, Text, View } from "react-native";

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
  clubFoundingPremiumCost,
  clubEscortSearchCost,
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
  escortFindChance,
  clubNightRemaining,
  helpers,
  actions,
}) {
  // TODO: TO_MIGRATE_TO_SERVER empire/business/club actions here still rely on local fallback logic passed from App.js.
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
        <StatLine label="Do odbioru" value={`${formatMoney(game.collections?.businessCash || 0)} / ${formatMoney(businessCollectionCap)}`} />
        <StatLine label="Cap 24h za" value={formatLongDuration(businessCapEta)} />
        <StatLine label="Ostatni odbior" value={formatCollectionStamp(game.collections?.businessCollectedAt)} />
        <ActionTile
          title="Odbierz biznesy"
          subtitle={Math.floor(game.collections?.businessCash || 0) > 0 ? `Czeka ${formatMoney(game.collections.businessCash)}.` : "Na razie pusto."}
          visual={systemVisuals.cash}
          onPress={actions.collectBusinessIncome}
          disabled={Math.floor(game.collections?.businessCash || 0) <= 0}
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
        <StatLine label="Do odbioru" value={`${formatMoney(game.collections?.escortCash || 0)} / ${formatMoney(escortCollectionCap)}`} />
        <StatLine label="Cap 24h za" value={formatLongDuration(escortCapEta)} />
        <StatLine label="Ostatni odbior" value={formatCollectionStamp(game.collections?.escortCollectedAt)} />
        <ActionTile
          title="Odbierz ulice"
          subtitle={Math.floor(game.collections?.escortCash || 0) > 0 ? `Czeka ${formatMoney(game.collections.escortCash)}.` : "Dziewczyny jeszcze nie rozliczyly nocy."}
          visual={systemVisuals.street}
          onPress={actions.collectEscortIncome}
          disabled={Math.floor(game.collections?.escortCash || 0) <= 0}
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
        {renderCollectionsPanel("Odbior kasy", "Biznesy i ulica nie przelewaja hajsu same do kieszeni. Musisz odbierac, a skrytki maja twardy dobowy limit.")}

        <SectionCard title="Lokale i biznesy" subtitle="Pasywny dochod to fundament gry. Tu budujesz prawdziwe zaplecze.">
          {businesses.map((business) => {
            const owned = game.businessesOwned.find((entry) => entry.id === business.id)?.count ?? 0;
            const locked = game.player.respect < business.respect;
            return (
              <View key={business.id} style={styles.listCard}>
                <View style={styles.listCardHeader}>
                  <View style={styles.entityHead}>
                    <EntityBadge visual={businessVisuals[business.id]} />
                    <View style={styles.flexOne}>
                      <Text style={styles.listCardTitle}>{business.name}</Text>
                      <Text style={styles.listCardMeta}>{business.kind} | Wymaga {business.respect} szacunu | Masz: {owned}</Text>
                    </View>
                  </View>
                  <Text style={styles.listCardReward}>{formatMoney(business.incomePerMinute)}/min</Text>
                </View>
                <View style={styles.inlineRow}>
                  <Text style={styles.costLabel}>Koszt: {formatMoney(business.cost)}</Text>
                  <Pressable onPress={() => actions.buyBusiness(business)} style={[styles.inlineButton, locked && styles.tileDisabled]}>
                    <Text style={styles.inlineButtonText}>{locked ? "Za niski szacun" : "Kup obiekt"}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </SectionCard>

        <SectionCard title="Panienki" subtitle="Mozesz je kupic albo wyhaczyc w klubie. Potem wystawiasz na ulice, sciagasz albo sprzedajesz dalej.">
          <SceneArtwork
            eyebrow="Street queens"
            title="Ulica, klub i szybka fura"
            lines={["Kazda panienka ma inny zarobek, prog wejscia i trudnosc zdobycia.", "Mocniejszy lokal i klubowe boosty podnosza szanse na topowy kontakt, ale dalej to nie jest darmowa maszynka do kasy."]}
            accent={["#4d1830", "#180d12", "#050505"]}
            source={sceneBackgrounds.escort}
          />
          {escorts.map((escort) => {
            const owned = helpers.getOwnedEscort(game, escort.id);
            const total = owned?.count ?? 0;
            const working = helpers.getEscortWorkingCount(owned);
            const reserve = Math.max(0, total - working);
            const locked = game.player.respect < escort.respect;

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
                    <Text style={styles.inlineButtonText}>{locked ? "Za niski szacun" : "Kup kontakt"}</Text>
                  </Pressable>
                </View>
                {streetDistricts.map((district) => {
                  const assigned = helpers.getEscortDistrictCount(game, escort.id, district.id);
                  const districtLocked = game.player.respect < district.respect;
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
          lines={["Kazdy mocniejszy narkotyk daje lepsze staty, ale koszt wejscia i ryzyko przedawkowania rosna razem z nim.", "To ma wygladac jak brudne laboratorium miasta, a nie tabelka z excela."]}
          accent={["#3d2918", "#16100c", "#050505"]}
          source={sceneBackgrounds.empire}
        />
        <SectionCard title="Fabryki" subtitle="Fabryki sa grubo wycenione. Zarabianie jest realne, ale wejscie w produkcje kosztuje powazny hajs.">
          {factories.map((factory) => {
            const owned = helpers.hasFactory(game, factory.id);
            const factoryRisk = Math.max(...factory.unlocks.map((drugId) => helpers.getDrugPoliceProfile(drugs.find((entry) => entry.id === drugId)).risk));
            return (
              <View key={factory.id} style={styles.listCard}>
                <View style={styles.listCardHeader}>
                  <View style={styles.entityHead}>
                    <EntityBadge visual={factoryVisuals[factory.id]} />
                    <View style={styles.flexOne}>
                      <Text style={styles.listCardTitle}>{factory.name}</Text>
                      <Text style={styles.listCardMeta}>Szacun {factory.respect} | {factory.text}</Text>
                    </View>
                  </View>
                  {owned ? <Tag text="Masz" /> : <Tag text={formatMoney(factory.cost)} warning />}
                </View>
                <Text style={styles.listCardMeta}>
                  Odblokowuje: {factory.unlocks.map((drugId) => drugs.find((entry) => entry.id === drugId)?.name).join(", ")} | Presja glin: {Math.round(factoryRisk * 100)}%
                </Text>
                <View style={styles.inlineRow}>
                  <Text style={styles.costLabel}>{owned ? "Zaklad stoi i pracuje." : `Koszt: ${formatMoney(factory.cost)}`}</Text>
                  <Pressable onPress={() => actions.buyFactory(factory)} style={[styles.inlineButton, owned && styles.tileDisabled]}>
                    <Text style={styles.inlineButtonText}>{owned ? "Kupione" : "Przejmij"}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </SectionCard>

        <SectionCard title="Produkcja" subtitle="Kazdy mocniejszy narkotyk daje lepsze staty, ale niesie wieksze ryzyko zgonu po spozyciu.">
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
                        Partia: {drug.batchSize} | Smiertelnosc {Math.round(drug.overdoseRisk * 100)}% | Na stanie: {game.drugInventory[drug.id]}
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
                  <Pressable onPress={() => actions.produceDrug(drug)} style={[styles.inlineButton, !helpers.hasFactory(game, drug.factoryId) && styles.tileDisabled]}>
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
        <SectionCard title="Hurtownie" subtitle="Tu kupujesz skladniki do produkcji. Bez tego fabryki stoja.">
          <View style={styles.listCard}>
            <View style={styles.entityHead}>
              <EntityBadge visual={systemVisuals.supplier} />
              <View style={styles.flexOne}>
                <Text style={styles.listCardTitle}>Zaplecze hurtowe</Text>
                <Text style={styles.listCardMeta}>Kazdy skladnik ma teraz czytelny znak, wiec od razu widac co jest chemia, szklem, pakowaniem albo ziolami.</Text>
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
                    <Text style={styles.listCardMeta}>{supply.unit} | Na stanie: {game.supplies[supply.id]}</Text>
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
        title="Lokal, klientela i zrzut towaru"
        lines={["Na mapie miasta sa stale kluby, ale topowe ekipy moga tez postawic wlasny lokal za absurdalny hajs albo premium.", "Im mocniejszy towar i wiekszy utarg, tym szybciej policja zaczyna czuc smrod interesu."]}
        accent={["#432417", "#170f0c", "#050505"]}
        source={sceneBackgrounds.clubWide}
      />
      <SectionCard title="Rynek klubow" subtitle="Jeden lokal ma miasto, reszta moze przechodzic w rece ekip. Nowy klub od zera stawia juz tylko boss gangu i to za gruby hajs.">
        {game.clubListings.map((listing) => {
          const isOwnedByPlayer = game.club.owned && game.club.sourceId === listing.id;
          const isVisiting = currentClubVenue?.id === listing.id;
          const listingProfile = helpers.getClubVenueProfile(game, listing);
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
                <Tag text={isVisiting ? "W srodku" : isOwnedByPlayer ? "Twoj" : formatMoney(listing.takeoverCost)} warning={!isOwnedByPlayer && !isVisiting} />
              </View>
              <Text style={styles.listCardMeta}>{listing.note}</Text>
              <Text style={styles.listCardMeta}>
                Bazowa presja policji: {listing.policeBase}/20 | Eventy {Math.round(listingProfile.eventChance * 100)}% | Kontakty {Math.round(listingProfile.contactChance * 100)}%
              </Text>
              <View style={styles.marketButtons}>
                <Pressable onPress={isVisiting ? actions.leaveClubAsGuest : () => actions.enterClubAsGuest(listing)} style={styles.marketButton}>
                  <Text style={styles.marketButtonText}>
                    {isVisiting ? "Wyjdz" : isOwnedByPlayer ? "Wejdz do swojego" : "Wejdz"}
                  </Text>
                </Pressable>
                <Pressable onPress={() => actions.openClub(listing)} style={[styles.marketButton, (game.club.owned || game.player.respect < listing.respect || isOwnedByPlayer) && styles.tileDisabled]}>
                  <Text style={styles.marketButtonText}>{isOwnedByPlayer ? "Kupione" : "Przejmij"}</Text>
                </Pressable>
              </View>
              <View style={styles.inlineRow}>
                <Text style={styles.costLabel}>
                  {isOwnedByPlayer
                    ? isVisiting
                      ? "Jestes teraz u siebie i masz dostep do tablicy lokalu."
                      : "Lokal jest Twoj, ale musisz do niego wejsc, zeby cokolwiek ogarniac."
                    : isVisiting
                      ? `Siedzisz teraz w ${listing.name}.`
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
            onPress={() => actions.foundClub("cash")}
            disabled={game.club.owned || !game.gang.joined || game.gang.role !== "Boss"}
          />
          <ActionTile
            title="Premium shortcut"
            subtitle={`${clubFoundingPremiumCost} premium i lokal staje od razu na mapie miasta.`}
            visual={systemVisuals.premium}
            onPress={() => actions.foundClub("premium")}
            disabled={game.club.owned || !game.gang.joined || game.gang.role !== "Boss"}
            danger
          />
        </View>
      </SectionCard>

      <SectionCard title="Aktualny lokal" subtitle="Mozesz siedziec u siebie, wejsc do cudzego klubu albo po prostu byc na ulicy.">
        <StatLine label="Gdzie jestes" value={currentClubVenue ? currentClubVenue.name : "Poza klubem"} visual={systemVisuals.club} />
        <StatLine label="Wlasciciel" value={currentClubVenue ? currentClubVenue.ownerLabel : "Brak"} visual={systemVisuals.gang} />
        <StatLine label="Popularnosc" value={currentClubVenue ? `${currentClubVenue.popularity}%` : "0%"} visual={systemVisuals.club} />
        <StatLine label="Szansa znalezienia panienki" value={currentClubVenue ? `${Math.round(escortFindChance * 100)}%` : "0%"} visual={systemVisuals.street} />
        <StatLine label="Szansa eventu klubowego" value={currentClubVenue ? `${Math.round(currentClubProfile.eventChance * 100)}%` : "0%"} visual={systemVisuals.casino} />
        <StatLine label="Szansa kontaktu / dragu" value={currentClubVenue ? `${Math.round(Math.max(currentClubProfile.contactChance, currentClubProfile.drugChance) * 100)}%` : "0%"} visual={systemVisuals.dealer} />
        <Text style={styles.listCardMeta}>
          {currentClubVenue
            ? game.club.owned && currentClubVenue.id === game.club.sourceId
              ? "Jestes u siebie. Tu zarzadzasz lokalem, wrzucasz towar i odpalasz nocki."
              : `Siedzisz w klubie ${currentClubVenue.ownerLabel}. Lokal daje bonusy do eventow, kontaktow, dragow i znalezienia panienki.`
            : "Najpierw wejdz do jednego z klubow z listy powyzej."}
        </Text>
        {currentClubVenue ? <Text style={styles.listCardMeta}>{currentClubProfile.label}</Text> : null}
        <View style={styles.grid}>
          <ActionTile
            title="Wyjdz z klubu"
            subtitle={currentClubVenue ? "Wracasz na ulice i tracisz bonusy lokalu." : "Ta opcja dziala tylko, kiedy siedzisz w jakims klubie."}
            visual={systemVisuals.street}
            onPress={actions.leaveClubAsGuest}
            disabled={!currentClubVenue}
          />
        </View>
      </SectionCard>

      <SectionCard title="Twoj klub" subtitle="Klub ma byc droga instytucja, ktora dopiero po czasie mieli hajs i glowbol z policja.">
        {!game.club.owned ? (
          <Text style={styles.emptyText}>Jeszcze bez lokalu. Najpierw przejmij klub albo postaw nowy.</Text>
        ) : !insideOwnClub ? (
          <View style={styles.lockedPanel}>
            <Text style={styles.lockedPanelText}>Masz klub, ale jestes poza nim. Wejdz do swojego lokalu z listy wyzej, zeby zobaczyc tablice, odpalic noc i dotknac stashu.</Text>
          </View>
        ) : (
          <>
            <StatLine label="Status" value={`${game.club.name} (${game.club.ownerLabel})`} />
            <StatLine label="Popularnosc" value={`${game.club.popularity}%`} visual={systemVisuals.club} />
            <StatLine label="Nastroj lokalu" value={`${game.club.mood}%`} visual={systemVisuals.casino} />
            <StatLine label="Presja policji" value={`${Math.round(clubPolice.pressure)} / 100`} visual={systemVisuals.heat} />
            <StatLine label="Ryzyko nalotu" value={`${Math.round(clubPolice.raidChance * 100)}%`} visual={systemVisuals.pvp} />
            <StatLine label="Mnoznik sprzedazy" value={`x${currentClubProfile.salesMultiplier.toFixed(2)}`} visual={systemVisuals.cash} />
            <Text style={styles.listCardMeta}>{clubPolice.label}</Text>
            <View style={styles.grid}>
              <ActionTile title="Promo" subtitle="Koszt $1200. Popularnosc +8." visual={systemVisuals.club} onPress={actions.promoteClub} />
              <ActionTile
                title="Odpal noc"
                subtitle={clubNightRemaining > 0 ? `Kolejna noc za ${formatCooldown(clubNightRemaining)}.` : `Klub sprzedaje stash. Aktualne ryzyko nalotu: ${Math.round(clubPolice.raidChance * 100)}%.`}
                visual={systemVisuals.casino}
                onPress={actions.runClubNight}
                disabled={clubNightRemaining > 0}
                danger
              />
              <ActionTile
                title="Szukaj panienki"
                subtitle={currentClubVenue ? `Wejscie ${formatMoney(clubEscortSearchCost)}. Szukasz teraz w ${currentClubVenue.name}.` : "Najpierw wejdz do jakiegos klubu z listy powyzej."}
                visual={systemVisuals.street}
                onPress={actions.findEscortInClub}
              />
            </View>
          </>
        )}
      </SectionCard>

      <SectionCard title="Stash klubu" subtitle="Dorzuc towar z fabryk do klubu. Tu jest glowny loop z dragami.">
        {!game.club.owned ? (
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
                    <Text style={styles.listCardMeta}>Przy Tobie: {game.drugInventory[drug.id]} | W klubie: {game.club.stash[drug.id]}</Text>
                  </View>
                </View>
                <Pressable onPress={() => actions.moveDrugToClub(drug)} style={[styles.inlineButton, game.drugInventory[drug.id] <= 0 && styles.tileDisabled]}>
                  <Text style={styles.inlineButtonText}>Wrzuć do klubu</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </SectionCard>
    </>
  );
}
