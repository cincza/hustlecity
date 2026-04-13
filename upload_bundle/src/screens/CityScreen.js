import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";

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
  formatDuration,
  formatLongDuration,
  formatCooldown,
  formatCollectionStamp,
  sceneBackgrounds,
  systemVisuals,
  energyRegenSeconds,
  jailRemaining,
  totalBusinessIncome,
  totalEscortIncome,
  businessCollectionCap,
  escortCollectionCap,
  businessCapEta,
  escortCapEta,
  escortFindChance,
  gangTributeRemaining,
  clubNightRemaining,
  bankAmountDraft,
  setBankAmountDraft,
  restaurantItems,
  gymPasses,
  gymExercises,
  taskStates,
  helpers,
  actions,
}) {
  const renderCollectionsPanel = (
    title = "Rozliczenia",
    subtitle = "Masz osobny panel odbioru. Tu widzisz ile wpada, kiedy dobijasz do dobowego limitu i kiedy ostatnio zbierales koperty."
  ) => (
    <SectionCard title={title} subtitle={subtitle}>
      <View style={styles.listCard}>
        <View style={styles.listCardHeader}>
          <View style={styles.entityHead}>
            <EntityBadge visual={systemVisuals.factory} />
            <View style={styles.flexOne}>
              <Text style={styles.listCardTitle}>Biznesy i lokale</Text>
              <Text style={styles.listCardMeta}>Odbierasz recznie to, co przepracowalo zaplecze. Cash nie wpada sam do portfela.</Text>
            </View>
          </View>
          <Text style={styles.listCardReward}>{formatMoney(totalBusinessIncome)}/min</Text>
        </View>
        <StatLine label="Do odbioru" value={`${formatMoney(game.collections?.businessCash || 0)} / ${formatMoney(businessCollectionCap)}`} visual={systemVisuals.cash} />
        <StatLine label="Cap 24h za" value={formatLongDuration(businessCapEta)} />
        <StatLine label="Ostatni odbior" value={formatCollectionStamp(game.collections?.businessCollectedAt)} />
        <ActionTile
          title="Odbierz biznesy"
          subtitle={Math.floor(game.collections?.businessCash || 0) > 0 ? formatMoney(game.collections.businessCash) : "Skrytka biznesow jest pusta."}
          visual={systemVisuals.cash}
          onPress={actions.collectBusinessIncome}
          disabled={Math.floor(game.collections?.businessCash || 0) <= 0}
        />
      </View>

      <View style={styles.listCard}>
        <View style={styles.listCardHeader}>
          <View style={styles.entityHead}>
            <EntityBadge visual={systemVisuals.street} />
            <View style={styles.flexOne}>
              <Text style={styles.listCardTitle}>Ulica i panienki</Text>
              <Text style={styles.listCardMeta}>To jest uliczna kasa: ryzyko, dzielnice i reczny odbior zamiast darmowego naliczania w tle.</Text>
            </View>
          </View>
          <Text style={styles.listCardReward}>{formatMoney(totalEscortIncome)}/min</Text>
        </View>
        <StatLine label="Do odbioru" value={`${formatMoney(game.collections?.escortCash || 0)} / ${formatMoney(escortCollectionCap)}`} visual={systemVisuals.street} />
        <StatLine label="Cap 24h za" value={formatLongDuration(escortCapEta)} />
        <StatLine label="Ostatni odbior" value={formatCollectionStamp(game.collections?.escortCollectedAt)} />
        <ActionTile
          title="Odbierz ulice"
          subtitle={Math.floor(game.collections?.escortCash || 0) > 0 ? formatMoney(game.collections.escortCash) : "Dziewczyny jeszcze nie rozliczyly nocy."}
          visual={systemVisuals.street}
          onPress={actions.collectEscortIncome}
          disabled={Math.floor(game.collections?.escortCash || 0) <= 0}
        />
      </View>
    </SectionCard>
  );

  if (section === "dashboard") {
    return (
      <>
        <SceneArtwork
          eyebrow="Miasto"
          title="Neony, deszcz i brudny pieniadz"
          lines={["Tu odpalasz tempo gry, sprawdzasz gdzie jest najgrubszy ruch i cisniesz dalej.", "Kazda dobra noc powinna wygladac jak wejscie do starej browserowej gangsterki, nie panel admina."]}
          accent={["#352215", "#120d09", "#050505"]}
          source={sceneBackgrounds.city}
        />
        <SectionCard title="Miasto" subtitle="Tu ogarniasz glowne tempo gry, najblizsze progi i szybkie akcje.">
          <View style={styles.grid}>
            <ActionTile
              title="Szybki napad"
              subtitle="Wchodzisz od razu na najwyzszy odblokowany prog."
              visual={systemVisuals.heist}
              onPress={actions.quickHeist}
              danger
            />
            <ActionTile title="Fightclub" subtitle="Sparing podbija sile, zrecznosc i szacun." visual={systemVisuals.pvp} onPress={actions.fightClubRound} />
            <ActionTile title="Odbierz haracz" subtitle={gangTributeRemaining > 0 ? `Kolejna koperta za ${formatCooldown(gangTributeRemaining)}.` : "Regularna wyplata z terenu i ochrony."} visual={systemVisuals.gang} onPress={actions.collectGangTribute} disabled={!game.gang.joined || gangTributeRemaining > 0} />
            <ActionTile title="Odpal noc w klubie" subtitle={clubNightRemaining > 0 ? `Klub pracuje. Wroc za ${formatCooldown(clubNightRemaining)}.` : "Sprzedaj towar wrzucony do klubu."} visual={systemVisuals.club} onPress={actions.runClubNight} disabled={!game.club.owned || clubNightRemaining > 0} />
            <ActionTile title="Zgarnij biznesy" subtitle={Math.floor(game.collections?.businessCash || 0) > 0 ? formatMoney(game.collections.businessCash) : "Skrytka biznesow jest pusta."} visual={systemVisuals.cash} onPress={actions.collectBusinessIncome} disabled={Math.floor(game.collections?.businessCash || 0) <= 0} />
            <ActionTile title="Zgarnij ulice" subtitle={Math.floor(game.collections?.escortCash || 0) > 0 ? formatMoney(game.collections.escortCash) : "Dziewczyny jeszcze nie rozliczyly nocy."} visual={systemVisuals.street} onPress={actions.collectEscortIncome} disabled={Math.floor(game.collections?.escortCash || 0) <= 0} />
          </View>
        </SectionCard>

        <SectionCard title="Przeglad interesu" subtitle="Ekonomia, odsiadka i cele na teraz.">
          <StatLine label="Lokale i fabryki / min" value={formatMoney(totalBusinessIncome)} visual={systemVisuals.factory} />
          <StatLine label="Panienki na ulicy / min" value={formatMoney(totalEscortIncome)} visual={systemVisuals.street} />
          <StatLine label="Do odbioru biznesy" value={`${formatMoney(game.collections?.businessCash || 0)} / ${formatMoney(businessCollectionCap)}`} visual={systemVisuals.cash} />
          <StatLine label="Do odbioru ulica" value={`${formatMoney(game.collections?.escortCash || 0)} / ${formatMoney(escortCollectionCap)}`} visual={systemVisuals.street} />
          <StatLine label="Dobowy cap biznesow za" value={formatLongDuration(businessCapEta)} />
          <StatLine label="Dobowy cap ulicy za" value={formatLongDuration(escortCapEta)} />
          <StatLine label="Regeneracja energii" value={`+1 co ${Math.round(energyRegenSeconds / 60)} min`} visual={systemVisuals.energy} />
          <StatLine label="Status odsiadki" value={helpers.inJail(game.player) ? `Cela ${formatDuration(jailRemaining)}` : "Na wolnosci"} visual={systemVisuals.gang} />
          <StatLine label="Nastepny prog napadu" value={helpers.nextHeistName} />
          <StatLine label="Szansa znalezienia panienki w klubie" value={`${Math.round(escortFindChance * 100)}%`} visual={systemVisuals.street} />
        </SectionCard>

        {renderCollectionsPanel()}
      </>
    );
  }

  if (section === "tasks") {
    return (
      <SectionCard title="Zadania" subtitle="Tu w koncu da sie klikac, odbierac nagrody i pchac progres.">
        {taskStates.map((task) => (
          <View key={task.id} style={styles.listCard}>
            <View style={styles.listCardHeader}>
              <View style={styles.flexOne}>
                <Text style={styles.listCardTitle}>{task.title}</Text>
                <Text style={styles.listCardMeta}>{task.description}</Text>
              </View>
              <View style={styles.taskMeta}>
                <Tag text={task.completed ? "Gotowe" : "W toku"} warning={!task.completed} />
                {task.claimed ? <Tag text="Odebrane" /> : null}
              </View>
            </View>
            <View style={styles.inlineRow}>
              <Text style={styles.costLabel}>{formatMoney(task.rewardCash)} i +{task.rewardRespect} szacunu</Text>
              <Pressable onPress={() => actions.claimTask(task)} style={[styles.inlineButton, (!task.completed || task.claimed) && styles.tileDisabled]}>
                <Text style={styles.inlineButtonText}>{task.claimed ? "Odebrane" : "Odbierz"}</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </SectionCard>
    );
  }

  if (section === "bank") {
    return (
      <SectionCard title="Bank" subtitle={`Tryb API: ${apiStatus === "online" ? "online" : "lokalny fallback"}. Wpisujesz dokladnie tyle, ile chcesz ruszyc.`}>
        <StatLine label="Gotowka przy sobie" value={formatMoney(game.player.cash)} visual={systemVisuals.cash} />
        <StatLine label="Saldo bankowe" value={formatMoney(game.player.bank || 0)} visual={systemVisuals.bank} />
        <View style={styles.listCard}>
          <View style={styles.entityHead}>
            <EntityBadge visual={systemVisuals.bank} />
            <View style={styles.flexOne}>
              <Text style={styles.listCardTitle}>Kwota operacji</Text>
              <Text style={styles.listCardMeta}>Wpisz recznie kwote do wplaty albo wyplaty.</Text>
            </View>
          </View>
          <TextInput
            value={bankAmountDraft}
            onChangeText={(text) => setBankAmountDraft(text.replace(/[^\d]/g, ""))}
            placeholder="Np. 25000"
            placeholderTextColor="#6c6c6c"
            keyboardType="numeric"
            style={styles.chatInput}
          />
        </View>
        <View style={styles.grid}>
          <ActionTile title="Wplac" subtitle={`Do banku pojdzie ${bankAmountDraft || 0}.`} visual={systemVisuals.bank} onPress={actions.depositCash} />
          <ActionTile title="Wyplac" subtitle={`Z konta wyciagasz ${bankAmountDraft || 0}.`} visual={systemVisuals.cash} onPress={actions.withdrawCash} />
        </View>
      </SectionCard>
    );
  }

  if (section === "gym") {
    return (
      <>
        <SectionCard title="Silownia" subtitle={helpers.hasGymPass(game.player) ? `Masz aktywny karnet: ${game.player.gymPassTier === "perm" ? "na stale" : `wygasa za ${formatDuration((game.player.gymPassUntil || 0) - Date.now())}`}` : "Bez karnetu cwiczenia sa zablokowane."}>
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

        <SectionCard title="Cwiczenia" subtitle="Kazde cwiczenie jasno pokazuje co daje. To ma robic roznice w gameplayu.">
          {gymExercises.map((exercise) => (
            <View key={exercise.id} style={styles.listCard}>
              <View style={styles.inlineRow}>
                <View style={styles.flexOne}>
                  <Text style={styles.listCardTitle}>{exercise.name}</Text>
                  <Text style={styles.listCardMeta}>{exercise.note} | koszt energii {exercise.costEnergy}</Text>
                </View>
                <Pressable onPress={() => actions.doGymExercise(exercise)} style={[styles.inlineButton, !helpers.hasGymPass(game.player) && styles.tileDisabled]}>
                  <Text style={styles.inlineButtonText}>Cwicz</Text>
                </Pressable>
              </View>
            </View>
          ))}
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
              <Pressable onPress={() => actions.buyMeal(meal)} style={styles.inlineButton}>
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
      <StatLine label="Heat" value={`${game.player.heat}%`} visual={systemVisuals.heat} />
      <View style={styles.grid}>
        <ActionTile title="Lekarz zaplecza" subtitle="Koszt $220, +30 HP i lekki zjazd heat." visual={systemVisuals.defense} onPress={actions.heal} />
        <ActionTile title="Kaucja" subtitle={helpers.inJail(game.player) ? `Wyjdz za ${formatMoney(400 + Math.ceil(jailRemaining / 1000) * 8)}` : "Niedostepne poza odsiadka."} visual={systemVisuals.bank} onPress={actions.bribeOutOfJail} disabled={!helpers.inJail(game.player)} />
      </View>
    </SectionCard>
  );
}
