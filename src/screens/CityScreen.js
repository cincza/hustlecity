import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { getGangProjectEffects } from "../../shared/gangProjects.js";
import { getDistrictAlertText, getDistrictEffectLines } from "../game/selectors/metaGameplay";
import { HeroPanel } from "../components/GameScreenPrimitives";
import { BankTransferPanel } from "../components/BankTransferPanel";
import { GymSection } from "../components/GymSection";
import { HospitalSection } from "../components/HospitalSection";
import { MissionPlaceholderTile, MissionTile } from "../components/MissionTile";
import { RestaurantSection } from "../components/RestaurantSection";

const MAX_GYM_BATCH = 10;

function getAffordableGymSeries(energy, exerciseCost) {
  const safeCost = Math.max(1, Number(exerciseCost || 1));
  return Math.max(0, Math.min(MAX_GYM_BATCH, Math.floor(Number(energy || 0) / safeCost)));
}

function clampGymSeries(value, maxSeries) {
  return Math.max(1, Math.min(Math.max(1, maxSeries), Math.floor(Number(value || 1))));
}

export function CityScreen({
  section,
  apiStatus,
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
  formatDuration,
  formatLongDuration,
  formatCooldown,
  formatCollectionStamp,
  sceneBackgrounds,
  systemVisuals,
  energyRegenSeconds,
  healthRegenSeconds,
  healthRegenAmount,
  jailRemaining,
  totalBusinessIncome,
  totalEscortIncome,
  businessCollectionCap,
  escortCollectionCap,
  businessCapEta,
  escortCapEta,
  districtSummaries,
  focusDistrictSummary,
  hottestDistrictSummary,
  escortFindChance,
  gangTributeRemaining,
  bankAmountDraft,
  setBankAmountDraft,
  restaurantItems,
  gymPasses,
  gymExercises,
  taskStates,
  taskBoard,
  bankRecentTransfers,
  bankFeedback,
  criticalCareStatus,
  criticalCareModes,
  criticalCareBlockedActions,
  helpers,
  actions,
}) {
  const [gymBatchByExercise, setGymBatchByExercise] = useState({});
  const businessCash = Number(game.collections?.businessCash || 0);
  const businessCollectableCash = Math.floor(businessCash);
  const escortCash = Number(game.collections?.escortCash || 0);
  const gangEffects = getGangProjectEffects(game.gang);
  const escortCollectableCash = Math.floor(escortCash);
  const criticalCareActive = Boolean(criticalCareStatus?.active);
  const criticalCareProtected = Boolean(criticalCareStatus?.protected);
  const activeCriticalCareMode = criticalCareStatus?.mode || criticalCareModes?.public || null;
  const businessCollectionSubtitle =
    businessCash > 0
      ? businessCollectableCash > 0
        ? formatAccruedMoney(businessCash)
        : `${formatAccruedMoney(businessCash)}. Jeszcze chwila do pelnego dolara.`
      : "Skrytka biznesow jest pusta.";
  const escortCollectionSubtitle =
    escortCash > 0
      ? escortCollectableCash > 0
        ? formatAccruedMoney(escortCash)
        : `${formatAccruedMoney(escortCash)}. Jeszcze chwila do rozliczenia.`
      : "Dziewczyny jeszcze nie rozliczyly nocy.";

  useEffect(() => {
    if (section !== "gym") return;

    setGymBatchByExercise((prev) => {
      let changed = false;
      const next = { ...prev };

      gymExercises.forEach((exercise) => {
        const affordableSeries = getAffordableGymSeries(game.player.energy, exercise.costEnergy);
        const maxSeries = Math.max(1, affordableSeries || 1);
        const currentSeries = clampGymSeries(next[exercise.id] || 1, maxSeries);

        if (next[exercise.id] !== currentSeries) {
          next[exercise.id] = currentSeries;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [section, gymExercises, game.player.energy]);

  const setGymSeries = (exerciseId, nextSeries, maxSeries) => {
    setGymBatchByExercise((prev) => ({
      ...prev,
      [exerciseId]: clampGymSeries(nextSeries, maxSeries),
    }));
  };

  const quickStartCards = [
    { id: "quick-heist", title: "Napad", subtitle: "Najwyzszy odblokowany prog.", visual: systemVisuals.heist, onPress: actions.quickHeist, danger: true },
    { id: "bank", title: "Bank", subtitle: `Saldo ${formatMoney(game.player.bank || 0)}.`, visual: systemVisuals.bank, onPress: () => actions.openSection("city", "bank") },
    { id: "casino", title: "Kasyno", subtitle: "Blackjack i ruletka na szybko.", visual: systemVisuals.casino, onPress: () => actions.openSection("profile", "casino") },
    { id: "market", title: "Rynek", subtitle: "Kup, sprzedaj, rusz towar.", visual: systemVisuals.market, onPress: () => actions.openSection("market", "drugs") },
  ];

  const empireCards = [
    { id: "club", title: "Klub", subtitle: game.club?.owned ? "Raport, sejf, stash i drzwi." : "Przejmij albo odwiedz lokal.", visual: systemVisuals.club, onPress: () => actions.openSection("empire", "club") },
    { id: "cashflow", title: "Biznes", subtitle: `${formatMoney(totalBusinessIncome)}/min z zaplecza.`, visual: systemVisuals.factory, onPress: () => actions.openSection("empire", "businesses") },
    { id: "street", title: "Ulica", subtitle: `${formatMoney(totalEscortIncome)}/min i przypal.`, visual: systemVisuals.street, onPress: () => actions.openSection("empire", "club") },
    { id: "tasks", title: "Misje", subtitle: "Nagrody i szybki progress.", visual: systemVisuals.respect, onPress: () => actions.openSection("city", "tasks") },
  ];

  const renderCollectionsPanel = (
    title = "Rozliczenia",
    subtitle = "Koperty, limity i odbior."
  ) => (
    <SectionCard title={title} subtitle={subtitle}>
      <View style={styles.listCard}>
        <View style={styles.listCardHeader}>
          <View style={styles.entityHead}>
            <EntityBadge visual={systemVisuals.factory} />
            <View style={styles.flexOne}>
              <Text style={styles.listCardTitle}>Biznesy i lokale</Text>
              <Text style={styles.listCardMeta}>Odbierasz to recznie. Nic nie wpada za darmo.</Text>
            </View>
          </View>
          <Text style={styles.listCardReward}>{formatMoney(totalBusinessIncome)}/min</Text>
        </View>
        <StatLine label="Do odbioru" value={`${formatAccruedMoney(businessCash)} / ${formatMoney(businessCollectionCap)}`} visual={systemVisuals.cash} />
        <StatLine label="Cap 24h za" value={formatLongDuration(businessCapEta)} />
        <StatLine label="Ostatni odbior" value={formatCollectionStamp(game.collections?.businessCollectedAt)} />
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
            <EntityBadge visual={systemVisuals.street} />
            <View style={styles.flexOne}>
              <Text style={styles.listCardTitle}>Ulica i panienki</Text>
              <Text style={styles.listCardMeta}>Ulica robi kase, ale tez robi przypal.</Text>
            </View>
          </View>
          <Text style={styles.listCardReward}>{formatMoney(totalEscortIncome)}/min</Text>
        </View>
        <StatLine label="Do odbioru" value={`${formatAccruedMoney(escortCash)} / ${formatMoney(escortCollectionCap)}`} visual={systemVisuals.street} />
        <StatLine label="Cap 24h za" value={formatLongDuration(escortCapEta)} />
        <StatLine label="Ostatni odbior" value={formatCollectionStamp(game.collections?.escortCollectedAt)} />
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

  if (section === "districts" || section === "dashboard") {
    const focusEffectLines = focusDistrictSummary
      ? getDistrictEffectLines(focusDistrictSummary, {
          focused: true,
          gangEffects,
        })
      : [];
    const districtHeroTitle = criticalCareActive
      ? "Miasto zyje dalej bez Ciebie"
      : focusDistrictSummary?.name
        ? `${focusDistrictSummary.name} jest teraz glownym frontem`
        : "Dzielnice trzymaja tempo miasta";
    const districtHeroSummary = criticalCareActive
      ? `Jestes na ${activeCriticalCareMode?.label || "intensywnej terapii"} po ${criticalCareStatus?.source || "ostrej akcji"}, ale dalej widzisz gdzie gang powinien cisnac influence i gdzie robi sie za goraco.`
      : "To nie jest drugi dashboard. Tutaj sprawdzasz tylko walke o teren: fokus gangu, presje policji i realny wplyw dzielnic na klub, operacje i cale zaplecze.";
    return (
      <>
        <SceneArtwork
          eyebrow="Dzielnice"
          title="Fronty miasta"
          lines={["Tutaj widzisz, gdzie naciskac influence i gdzie trzeba odpuscic presje."]}
          accent={["#23180f", "#0f1014", "#050505"]}
          source={sceneBackgrounds.city}
        />
        <HeroPanel
          eyebrow={criticalCareActive ? "Stan krytyczny" : criticalCareProtected ? "Powrot do gry" : "Dzielnice"}
          title={districtHeroTitle}
          summary={districtHeroSummary}
          tone={criticalCareActive ? "danger" : criticalCareProtected ? "gold" : "gold"}
          pills={[
            {
              label: "Fokus gangu",
              value: focusDistrictSummary?.shortName || "-",
              note: focusEffectLines[0] || focusDistrictSummary?.bonusLabel || "Brak aktywnego fokusu.",
              tone: "gold",
              icon: "target-variant",
            },
            {
              label: "Najgorecej",
              value: hottestDistrictSummary?.shortName || "-",
              note: getDistrictAlertText(hottestDistrictSummary) || hottestDistrictSummary?.pressureLabel || "Spokojnie",
              tone: hottestDistrictSummary?.pressureLabel === "Lockdown" || hottestDistrictSummary?.pressureLabel === "Crackdown" ? "danger" : "neutral",
              icon: "alert-outline",
            },
            {
              label: "Kontakt na ulicy",
              value: `${Math.round(escortFindChance * 100)}%`,
              note: "To tempo, z jakim ulica moze podrzucic nowa dziewczyne.",
              tone: "info",
              icon: "account-search-outline",
            },
            {
              label: "Haracz",
              value: !game.gang?.joined ? "-" : gangTributeRemaining > 0 ? formatCooldown(gangTributeRemaining) : "Gotowy",
              note: !game.gang?.joined ? "Bez gangu nie ma regularnej koperty." : gangTributeRemaining > 0 ? "Nastepna koperta jeszcze stygnie." : "Mozesz odebrac regularna koperte z terenu.",
              tone: !game.gang?.joined ? "neutral" : gangTributeRemaining > 0 ? "neutral" : "success",
              icon: "briefcase-outline",
            },
          ]}
        />

        <SectionCard title="Fronty miasta" subtitle="Tu nie ma juz drugiego dashboardu. Jest tylko walka o teren i to, co realnie zmienia gre.">
          <View style={styles.mobileStatusGrid}>
            <View style={styles.mobileStatusCard}>
              <Text style={styles.mobileStatusLabel}>Fokus gangu</Text>
              <Text style={styles.mobileStatusValue}>{focusDistrictSummary?.name || "-"}</Text>
              <Text style={styles.listCardMeta}>{focusDistrictSummary?.bonusLabel || "Brak aktywnego fokusu."}</Text>
            </View>
            <View style={styles.mobileStatusCard}>
              <Text style={styles.mobileStatusLabel}>Najgoretsza strefa</Text>
              <Text style={styles.mobileStatusValue}>{hottestDistrictSummary?.name || "-"}</Text>
              <Text style={styles.listCardMeta}>{getDistrictAlertText(hottestDistrictSummary) || hottestDistrictSummary?.pressureLabel || "Spokojnie"}</Text>
            </View>
          </View>
          {Array.isArray(districtSummaries)
            ? districtSummaries.map((district) => (
                <View key={district.id} style={styles.listCard}>
                  <View style={styles.listCardHeader}>
                  <View style={styles.flexOne}>
                      <Text style={styles.listCardTitle}>{district.name}</Text>
                      <Text style={styles.listCardMeta}>
                        {district.controlLabel} | Presja: {district.pressureLabel} | {district.bonusLabel}
                      </Text>
                    </View>
                    {game.gang?.joined ? (
                      <Pressable
                        onPress={() => actions.setGangFocus(district.id)}
                        style={[styles.inlineButton, game.gang.focusDistrictId === district.id && styles.tileDisabled]}
                      >
                        <Text style={styles.inlineButtonText}>
                          {game.gang.focusDistrictId === district.id ? "Fokus" : "Pchnij"}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                  <Text style={styles.listCardMeta}>{district.note}</Text>
                  {getDistrictEffectLines(district, {
                    focused: game.gang?.focusDistrictId === district.id,
                    gangEffects,
                  }).map((line) => (
                    <Text key={`${district.id}-${line}`} style={styles.listCardMeta}>
                      {line}
                    </Text>
                  ))}
                  {getDistrictAlertText(district) ? (
                    <Text style={styles.listCardMeta}>{getDistrictAlertText(district)}</Text>
                  ) : null}
                </View>
              ))
            : null}
        </SectionCard>

        <SectionCard title="Co to zmienia" subtitle="Krotko: dlaczego dzielnice w ogole obchodza Cie w praktyce.">
          <View style={styles.mobileOverviewGrid}>
            <View style={styles.mobileOverviewCard}>
              <Text style={styles.mobileOverviewLabel}>Klub</Text>
              <Text style={styles.mobileOverviewValueSmall}>Traffic, pressure i incydenty leca z dzielnicy.</Text>
            </View>
            <View style={styles.mobileOverviewCard}>
              <Text style={styles.mobileOverviewLabel}>Operacje</Text>
              <Text style={styles.mobileOverviewValueSmall}>Hot zone podbija leak, prep i ryzyko.</Text>
            </View>
            <View style={styles.mobileOverviewCard}>
              <Text style={styles.mobileOverviewLabel}>Fabryki</Text>
              <Text style={styles.mobileOverviewValueSmall}>Goraca dzielnica cisnie presje i robi przypal.</Text>
            </View>
            <View style={styles.mobileOverviewCard}>
              <Text style={styles.mobileOverviewLabel}>Gang</Text>
              <Text style={styles.mobileOverviewValueSmall}>Fokus daje bonus do influence i pcha teren pod ekipe.</Text>
            </View>
          </View>
        </SectionCard>
      </>
    );
  }

  if (section === "tasks") {
    const board = taskBoard || {
      claimableTasks: Array.isArray(taskStates) ? taskStates.filter((task) => task.completed && !task.onlineDisabled) : [],
      activeTasks: Array.isArray(taskStates) ? taskStates.filter((task) => !(task.completed && !task.onlineDisabled)) : [],
      placeholders: [],
      slotCount: Array.isArray(taskStates) ? taskStates.length : 0,
    };
    const readyTasks = Array.isArray(board.claimableTasks) ? board.claimableTasks : [];
    const inProgressTasks = Array.isArray(board.activeTasks) ? board.activeTasks : [];
    const placeholderTasks = Array.isArray(board.placeholders) ? board.placeholders : [];

    return (
      <>
        {readyTasks.length ? (
          <SectionCard title="Gotowe do odbioru" subtitle="Klikasz, wpada nagroda i slot od razu robi miejsce na kolejna robote.">
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
              {readyTasks.map((task) => (
                <MissionTile
                  key={task.id}
                  task={task}
                  formatMoney={formatMoney}
                  onClaim={actions.claimTask}
                />
              ))}
            </View>
          </SectionCard>
        ) : null}

        <SectionCard
          title="W toku"
          subtitle={
            readyTasks.length
              ? "Reszta aktywnych slotow. Domknij je i od razu wpada kolejna robota."
              : "Aktywne zlecenia. Widzisz tylko zywe sloty, bez martwej listy i bez zablokowanych kart."
          }
        >
          {!inProgressTasks.length && !placeholderTasks.length ? (
            <Text style={styles.emptyText}>Aktywna lista jest czysta. Odebrane nagrody nie wisza juz na ekranie.</Text>
          ) : null}
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
            {inProgressTasks.map((task) => (
              <MissionTile
                key={task.id}
                task={task}
                formatMoney={formatMoney}
                onClaim={actions.claimTask}
              />
            ))}
            {placeholderTasks.map((slot) => (
              <MissionPlaceholderTile key={slot.id} title={slot.title} description={slot.description} />
            ))}
          </View>
        </SectionCard>
      </>
    );
  }

  if (section === "bank") {
    return (
      <SectionCard title="Bank">
        <BankTransferPanel
          cash={game.player.cash}
          bank={game.player.bank || 0}
          amountDraft={bankAmountDraft}
          setAmountDraft={setBankAmountDraft}
          onDeposit={actions.depositCash}
          onWithdraw={actions.withdrawCash}
          formatMoney={formatMoney}
          recentTransfers={bankRecentTransfers}
          feedback={bankFeedback}
        />
      </SectionCard>
    );
  }

  if (section === "gym") {
    return (
      <GymSection
        SectionCard={SectionCard}
        game={game}
        gymPasses={gymPasses}
        gymExercises={gymExercises}
        gymBatchByExercise={gymBatchByExercise}
        setGymSeries={setGymSeries}
        formatMoney={formatMoney}
        formatDuration={formatDuration}
        helpers={helpers}
        actions={actions}
        criticalCareActive={criticalCareActive}
      />
    );
  }

  if (section === "restaurant") {
    return (
      <RestaurantSection
        SectionCard={SectionCard}
        restaurantItems={restaurantItems}
        formatMoney={formatMoney}
        energy={game.player.energy}
        maxEnergy={game.player.maxEnergy}
        onEat={actions.handleEat}
      />
    );
  }

  return (
    <HospitalSection
      SectionCard={SectionCard}
      formatMoney={formatMoney}
      formatCooldown={formatCooldown}
      player={game.player}
      healthRegenAmount={healthRegenAmount}
      healthRegenSeconds={healthRegenSeconds}
      criticalCareStatus={criticalCareStatus}
      criticalCareModes={criticalCareModes}
      onHeal={actions.handleHeal}
      onPrivateClinic={actions.moveToPrivateClinic}
    />
  );
}
