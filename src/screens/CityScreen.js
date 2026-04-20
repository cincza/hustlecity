import React, { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { getGangProjectEffects } from "../../shared/gangProjects.js";
import { getDistrictAlertText, getDistrictEffectLines } from "../game/selectors/metaGameplay";

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
  helpers,
  actions,
}) {
  const [gymBatchByExercise, setGymBatchByExercise] = useState({});
  const businessCash = Number(game.collections?.businessCash || 0);
  const businessCollectableCash = Math.floor(businessCash);
  const escortCash = Number(game.collections?.escortCash || 0);
  const gangEffects = getGangProjectEffects(game.gang);
  const escortCollectableCash = Math.floor(escortCash);
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

  if (section === "dashboard") {
    return (
      <>
        <SceneArtwork
          eyebrow="Miasto"
          title="Miasto po zmroku"
          lines={["Wchodzisz, klikasz, bierzesz swoj kawalek nocy."]}
          accent={["#352215", "#120d09", "#050505"]}
          source={sceneBackgrounds.city}
        />
        <SectionCard title="Tablica glowna" subtitle="Najwazniejsze rzeczy od razu.">
          <View style={styles.grid}>
            {quickStartCards.map((card) => (
              <ActionTile key={card.id} title={card.title} subtitle={card.subtitle} visual={card.visual} onPress={card.onPress} danger={card.danger} />
            ))}
          </View>
        </SectionCard>

        <SectionCard title="Imperium i odbiory" subtitle="Cashflow, noc i szybkie wejscia.">
          <View style={styles.grid}>
            {empireCards.map((card) => (
              <ActionTile key={card.id} title={card.title} subtitle={card.subtitle} visual={card.visual} onPress={card.onPress} />
            ))}
            <ActionTile title="Fightclub" subtitle="Sparing podbija sile, zrecznosc i szacun." visual={systemVisuals.pvp} onPress={actions.fightClubRound} />
            <ActionTile title="Haracz" subtitle={gangTributeRemaining > 0 ? `Kolejna koperta za ${formatCooldown(gangTributeRemaining)}.` : "Regularna wyplata z terenu i ochrony."} visual={systemVisuals.gang} onPress={actions.collectGangTribute} disabled={!game.gang.joined || gangTributeRemaining > 0} />
            <ActionTile title="Raport klubu" subtitle={game.club?.owned ? "Wejdz po sejf, stash i stan lokalu." : "Przejmij albo odwiedz lokal."} visual={systemVisuals.club} onPress={() => actions.openSection("empire", "club")} />
            <ActionTile title="Odbierz biznes" subtitle={businessCash > 0 ? businessCollectionSubtitle : "Skrytka pusta."} visual={systemVisuals.cash} onPress={actions.collectBusinessIncome} disabled={businessCollectableCash <= 0} />
            <ActionTile title="Odbierz ulice" subtitle={escortCash > 0 ? escortCollectionSubtitle : "Rozliczenie puste."} visual={systemVisuals.street} onPress={actions.collectEscortIncome} disabled={escortCollectableCash <= 0} />
          </View>
        </SectionCard>

        <SectionCard title="Dzielnice" subtitle="Trzy fronty miasta. Widzisz, gdzie cisniesz i gdzie robi sie goraco.">
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

        <SectionCard title="Puls miasta" subtitle="Najwazniejsze liczby bez sciany tekstu.">
          <View style={styles.listCard}>
            <Text style={styles.listCardTitle}>Najgoretsza dzielnica</Text>
            <Text style={styles.listCardMeta}>
              {hottestDistrictSummary?.name || "-"} | {hottestDistrictSummary?.pressureLabel || "Spokojnie"} | {hottestDistrictSummary?.bonusLabel || "-"}
            </Text>
            {getDistrictAlertText(hottestDistrictSummary) ? (
              <Text style={styles.listCardMeta}>{getDistrictAlertText(hottestDistrictSummary)}</Text>
            ) : null}
          </View>
          <View style={styles.mobileOverviewGrid}>
            <View style={styles.mobileOverviewCard}>
              <Text style={styles.mobileOverviewLabel}>Energia</Text>
              <Text style={styles.mobileOverviewValue}>{`+1 / ${Math.round(energyRegenSeconds / 60)} min`}</Text>
            </View>
            <View style={styles.mobileOverviewCard}>
              <Text style={styles.mobileOverviewLabel}>Cela</Text>
              <Text style={styles.mobileOverviewValue}>{helpers.inJail(game.player) ? formatDuration(jailRemaining) : "Wolny"}</Text>
            </View>
            <View style={styles.mobileOverviewCard}>
              <Text style={styles.mobileOverviewLabel}>Nastepny napad</Text>
              <Text style={styles.mobileOverviewValueSmall}>{helpers.nextHeistName}</Text>
            </View>
            <View style={styles.mobileOverviewCard}>
              <Text style={styles.mobileOverviewLabel}>Szansa panienki</Text>
              <Text style={styles.mobileOverviewValue}>{`${Math.round(escortFindChance * 100)}%`}</Text>
            </View>
            <View style={styles.mobileOverviewCard}>
              <Text style={styles.mobileOverviewLabel}>Biznes / min</Text>
              <Text style={styles.mobileOverviewValue}>{formatMoney(totalBusinessIncome)}</Text>
            </View>
            <View style={styles.mobileOverviewCard}>
              <Text style={styles.mobileOverviewLabel}>Ulica / min</Text>
              <Text style={styles.mobileOverviewValue}>{formatMoney(totalEscortIncome)}</Text>
            </View>
            <View style={styles.mobileOverviewCard}>
              <Text style={styles.mobileOverviewLabel}>Cap biznesow</Text>
              <Text style={styles.mobileOverviewValueSmall}>{formatLongDuration(businessCapEta)}</Text>
            </View>
            <View style={styles.mobileOverviewCard}>
              <Text style={styles.mobileOverviewLabel}>Cap ulicy</Text>
              <Text style={styles.mobileOverviewValueSmall}>{formatLongDuration(escortCapEta)}</Text>
            </View>
            <View style={styles.mobileOverviewCard}>
              <Text style={styles.mobileOverviewLabel}>Fokus</Text>
              <Text style={styles.mobileOverviewValueSmall}>{focusDistrictSummary?.shortName || "-"}</Text>
            </View>
            <View style={styles.mobileOverviewCard}>
              <Text style={styles.mobileOverviewLabel}>Najgorzej</Text>
              <Text style={styles.mobileOverviewValueSmall}>{hottestDistrictSummary?.shortName || "-"}</Text>
            </View>
          </View>
        </SectionCard>
      </>
    );
  }

  if (section === "tasks") {
    return (
      <SectionCard title="Zadania" subtitle="Misje i szybkie nagrody.">
        {taskStates.map((task) => (
          <View key={task.id} style={styles.listCard}>
            <View style={styles.listCardHeader}>
              <View style={styles.flexOne}>
                <Text style={styles.listCardTitle}>{task.title}</Text>
                <Text style={styles.listCardMeta}>{task.description}</Text>
                {task.onlineDisabled ? <Text style={styles.listCardMeta}>{task.disabledReason}</Text> : null}
              </View>
              <View style={styles.taskMeta}>
                <Tag
                  text={task.onlineDisabled ? "Online wkrotce" : task.completed ? "Gotowe" : "W toku"}
                  warning={task.onlineDisabled || !task.completed}
                />
                {task.claimed ? <Tag text="Odebrane" /> : null}
              </View>
            </View>
            <View style={styles.inlineRow}>
              <Text style={styles.costLabel}>{formatMoney(task.rewardCash)} i +{task.rewardXp} XP</Text>
              <Pressable onPress={() => actions.claimTask(task)} style={[styles.inlineButton, (task.onlineDisabled || !task.completed || task.claimed) && styles.tileDisabled]}>
                <Text style={styles.inlineButtonText}>
                  {task.claimed ? "Odebrane" : task.onlineDisabled ? "Czeka" : "Odbierz"}
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
      </SectionCard>
    );
  }

  if (section === "bank") {
    const maxDepositAmount = Math.max(0, Math.floor(Number(game.player.cash || 0)));
    const maxWithdrawAmount = Math.max(0, Math.floor(Number(game.player.bank || 0)));

    return (
      <SectionCard title="Bank" subtitle={apiStatus === "online" ? "Saldo i walidacja leca z backendu." : "Lokalny fallback do testow offline."}>
        <StatLine label="Gotowka przy sobie" value={formatMoney(game.player.cash)} visual={systemVisuals.cash} />
        <StatLine label="Saldo bankowe" value={formatMoney(game.player.bank || 0)} visual={systemVisuals.bank} />
        <StatLine label="Operacje" value={apiStatus === "online" ? "Bez podatku, z limitem serwera." : "Tryb lokalny."} visual={systemVisuals.bank} />
        <View style={styles.listCard}>
          <View style={styles.entityHead}>
            <EntityBadge visual={systemVisuals.bank} />
            <View style={styles.flexOne}>
              <Text style={styles.listCardTitle}>Kwota operacji</Text>
              <Text style={styles.listCardMeta}>Wpisz kwote i rusz hajs.</Text>
            </View>
          </View>
          <View style={styles.inlineRow}>
            <TextInput
              value={bankAmountDraft}
              onChangeText={(text) => setBankAmountDraft(text.replace(/[^\d]/g, ""))}
              placeholder="Np. 25000"
              placeholderTextColor="#6c6c6c"
              keyboardType="numeric"
              style={styles.chatInput}
            />
          </View>
          <View style={styles.inlineRow}>
            <Pressable
              onPress={() => setBankAmountDraft(String(maxDepositAmount))}
              style={[styles.inlineButton, maxDepositAmount <= 0 && styles.tileDisabled]}
              disabled={maxDepositAmount <= 0}
            >
              <Text style={styles.inlineButtonText}>Wplac wszystko</Text>
            </Pressable>
            <Pressable
              onPress={() => setBankAmountDraft(String(maxWithdrawAmount))}
              style={[styles.inlineButton, maxWithdrawAmount <= 0 && styles.tileDisabled]}
              disabled={maxWithdrawAmount <= 0}
            >
              <Text style={styles.inlineButtonText}>Wyplac wszystko</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.grid}>
          <ActionTile title="Wplac" subtitle={`Do banku leci ${bankAmountDraft || 0}.`} visual={systemVisuals.bank} onPress={actions.depositCash} />
          <ActionTile title="Wyplac" subtitle={`Z konta sciagasz ${bankAmountDraft || 0}.`} visual={systemVisuals.cash} onPress={actions.withdrawCash} />
        </View>
      </SectionCard>
    );
  }

  if (section === "gym") {
    return (
      <>
        <SectionCard title="Silownia" subtitle={helpers.hasGymPass(game.player) ? `Karnet aktywny: ${game.player.gymPassTier === "perm" ? "na stale" : `jeszcze ${formatDuration((game.player.gymPassUntil || 0) - Date.now())}`}` : "Bez karnetu nie wejdziesz."}>
          {gymPasses.map((pass) => (
            <View key={pass.id} style={styles.listCard}>
              <View style={styles.inlineRow}>
                <View style={styles.flexOne}>
                  <Text style={styles.listCardTitle}>{pass.name}</Text>
                  <Text style={styles.listCardMeta}>{pass.id === "perm" ? "Pelny dostep bez limitu czasu." : "Dostep czasowy do wszystkich cwiczen."}</Text>
                </View>
                <Pressable onPress={() => actions.buyGymPass(pass)} style={styles.inlineButton}>
                  <Text style={styles.inlineButtonText}>Kup {formatMoney(pass.price)}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </SectionCard>

        <SectionCard title="Cwiczenia" subtitle="Ustawiasz serie raz i robisz trening jednym ruchem.">
          {gymExercises.map((exercise) => {
            const affordableSeries = getAffordableGymSeries(game.player.energy, exercise.costEnergy);
            const maxSeries = Math.max(1, affordableSeries || 1);
            const selectedSeries = clampGymSeries(gymBatchByExercise[exercise.id] || 1, maxSeries);
            const totalEnergyCost = selectedSeries * exercise.costEnergy;
            const canTrainNow = helpers.hasGymPass(game.player) && affordableSeries > 0;

            return (
              <View key={exercise.id} style={styles.listCard}>
                <View style={styles.inlineRow}>
                  <View style={styles.flexOne}>
                    <Text style={styles.listCardTitle}>{exercise.name}</Text>
                    <Text style={styles.listCardMeta}>{exercise.note} | 1 seria kosztuje {exercise.costEnergy} energii</Text>
                  </View>
                  <Text style={styles.costLabel}>
                    {canTrainNow ? `Do ${affordableSeries} serii` : "Brak energii"}
                  </Text>
                </View>

                <View style={styles.gymBatchControls}>
                  <Pressable
                    onPress={() => setGymSeries(exercise.id, selectedSeries - 1, maxSeries)}
                    style={[styles.gymBatchAdjustButton, selectedSeries <= 1 && styles.tileDisabled]}
                  >
                    <Text style={styles.gymBatchAdjustText}>-</Text>
                  </Pressable>

                  <View style={styles.gymBatchTrack}>
                    {Array.from({ length: maxSeries }).map((_, index) => {
                      const step = index + 1;
                      const active = step <= selectedSeries;

                      return (
                        <Pressable
                          key={`${exercise.id}-batch-${step}`}
                          onPress={() => setGymSeries(exercise.id, step, maxSeries)}
                          style={[styles.gymBatchStep, active && styles.gymBatchStepActive]}
                        >
                          <Text style={[styles.gymBatchStepText, active && styles.gymBatchStepTextActive]}>{step}</Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Pressable
                    onPress={() => setGymSeries(exercise.id, selectedSeries + 1, maxSeries)}
                    style={[styles.gymBatchAdjustButton, selectedSeries >= maxSeries && styles.tileDisabled]}
                  >
                    <Text style={styles.gymBatchAdjustText}>+</Text>
                  </Pressable>
                </View>

                <View style={styles.inlineRow}>
                  <Text style={styles.gymBatchMeta}>
                    {canTrainNow
                      ? `${selectedSeries} ${selectedSeries === 1 ? "seria" : selectedSeries < 5 ? "serie" : "serii"} · energia ${totalEnergyCost}`
                      : "Najpierw doladuj energie albo kup karnet."}
                  </Text>
                  <Pressable
                    onPress={() => actions.handleTrain(exercise, selectedSeries)}
                    style={[styles.inlineButton, !canTrainNow && styles.tileDisabled]}
                  >
                    <Text style={styles.inlineButtonText}>{selectedSeries > 1 ? `Cwicz x${selectedSeries}` : "Cwicz"}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </SectionCard>
      </>
    );
  }

  if (section === "restaurant") {
    return (
      <SectionCard title="Restauracja" subtitle="Energia sama wraca, ale jedzenie daje szybkie doladowanie.">
        {restaurantItems.map((meal) => (
          <View key={meal.id} style={styles.listCard}>
            <View style={styles.inlineRow}>
              <View style={styles.flexOne}>
                <Text style={styles.listCardTitle}>{meal.name}</Text>
                <Text style={styles.listCardMeta}>+{meal.energy} energii</Text>
              </View>
              <Pressable onPress={() => actions.handleEat(meal)} style={styles.inlineButton}>
                <Text style={styles.inlineButtonText}>Kup {formatMoney(meal.price)}</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Szpital" subtitle="Jak wtopisz akcje albo przedawkujesz, tu wracasz do pionu.">
      <StatLine label="Obecne zdrowie" value={`${game.player.hp}/${game.player.maxHp}`} visual={systemVisuals.defense} />
      <StatLine label="Regeneracja" value={`+${healthRegenAmount} HP / ${Math.round(healthRegenSeconds / 60)} min`} visual={systemVisuals.defense} />
      <StatLine label="Heat" value={`${game.player.heat}%`} visual={systemVisuals.heat} />
      <View style={styles.grid}>
        <ActionTile title="Lekarz zaplecza" subtitle="Koszt $220, +30 HP i lekki zjazd heat." visual={systemVisuals.defense} onPress={actions.handleHeal} />
        <ActionTile title="Kaucja" subtitle={helpers.inJail(game.player) ? `Wyjdz za ${formatMoney(400 + Math.ceil(jailRemaining / 1000) * 8)}` : "Niedostepne poza odsiadka."} visual={systemVisuals.bank} onPress={actions.bribeOutOfJail} disabled={!helpers.inJail(game.player)} />
      </View>
    </SectionCard>
  );
}
