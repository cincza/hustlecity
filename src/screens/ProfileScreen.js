import React, { useMemo } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { HeroPanel } from "../components/GameScreenPrimitives";

const LOADOUT_LABELS = {
  weapon: "Bron",
  armor: "Ochrona",
  tool: "Narzedzia",
  electronics: "Elektronika",
  car: "Auto",
};

export function ProfileScreen({
  section,
  game,
  styles,
  SceneArtwork,
  SectionCard,
  StatLine,
  ProgressBar,
  ProgressDots,
  activeAvatar,
  respectInfo,
  effectivePlayer,
  avatars,
  setAvatar,
  pickCustomAvatar,
  formatMoney,
  formatCooldown,
  getRankTitle,
  heists,
  getSoloHeistOdds,
  sceneBackgrounds,
  criticalCareStatus,
  contractState,
  contractItems,
  contractCars,
  getContractAssetEffectLine,
  onEquipContractLoadout,
}) {
  const ownedByCategory = useMemo(
    () => ({
      weapon: (contractItems || []).filter((item) => item.category === "weapon"),
      armor: (contractItems || []).filter((item) => item.category === "armor"),
      tool: (contractItems || []).filter((item) => item.category === "tool"),
      electronics: (contractItems || []).filter((item) => item.category === "electronics"),
    }),
    [contractItems]
  );

  if (section === "summary") {
    return (
      <>
        <SceneArtwork
          eyebrow="Profil"
          title="Twoja twarz w Hustle City"
          lines={["Avatar, szacun i wartosc na ulicy."]}
          accent={["#3f2818", "#16100c", "#050505"]}
          source={sceneBackgrounds.profile}
        />
        <HeroPanel
          eyebrow="Status gracza"
          title={game.player.name}
          summary="Tu najpierw lapiesz twarz postaci, biezacy stan i glowne liczby. Dopiero nizej schodzisz do avatarow, statow i progresu."
          tone={criticalCareStatus?.active ? "danger" : "gold"}
          pills={[
            { label: "Szacunek", value: `${game.player.respect}`, note: getRankTitle(game.player.respect), tone: "gold", icon: "star-four-points" },
            { label: "Kasa", value: formatMoney(game.player.cash), note: "Gotowka przy sobie.", tone: "success", icon: "cash-multiple" },
            { label: "HP", value: `${game.player.hp}/${game.player.maxHp}`, note: criticalCareStatus?.active ? criticalCareStatus.mode?.label || "Stan krytyczny" : "Aktualne zdrowie.", tone: criticalCareStatus?.active ? "danger" : "neutral", icon: "heart-pulse" },
          ]}
        />
        <SectionCard title="Profil" subtitle="Twarz, staty i progres.">
        <View style={styles.avatarPanel}>
          <LinearGradient colors={activeAvatar.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarHero}>
            {activeAvatar.image ? <Image source={activeAvatar.image} style={styles.avatarHeroImage} /> : null}
            {activeAvatar.image ? <View style={styles.avatarHeroOverlay} /> : null}
            {!activeAvatar.image ? <Text style={styles.avatarHeroSigil}>{activeAvatar.sigil}</Text> : null}
            <Text style={styles.avatarHeroName}>{activeAvatar.name}</Text>
          </LinearGradient>
          <Text style={styles.sectionSubtitle}>Wybierz twarz albo wrzuc swoje foto z telefonu.</Text>
          <Pressable onPress={pickCustomAvatar} style={styles.avatarPickerButton}>
            <Text style={styles.avatarPickerButtonText}>Dodaj swoje foto</Text>
          </Pressable>
          <View style={styles.avatarGrid}>
            {avatars.map((avatar) => (
              <Pressable
                key={avatar.id}
                onPress={() => setAvatar(avatar.id)}
                style={[styles.avatarChoice, game.player.avatarId === avatar.id && styles.avatarChoiceActive]}
              >
                <LinearGradient colors={avatar.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarChoiceArt}>
                  {avatar.image ? <Image source={avatar.image} style={styles.avatarChoiceImage} /> : <Text style={styles.avatarChoiceSigil}>{avatar.sigil}</Text>}
                </LinearGradient>
                <Text style={styles.avatarChoiceText}>{avatar.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.mobileOverviewGrid}>
          <View style={styles.mobileOverviewCard}>
            <Text style={styles.mobileOverviewLabel}>Ranga</Text>
            <Text style={styles.mobileOverviewValueSmall}>{getRankTitle(game.player.respect)}</Text>
          </View>
          <View style={styles.mobileOverviewCard}>
            <Text style={styles.mobileOverviewLabel}>Szacunek</Text>
            <Text style={styles.mobileOverviewValue}>{game.player.respect}</Text>
          </View>
          <View style={styles.mobileOverviewCard}>
            <Text style={styles.mobileOverviewLabel}>Kasa</Text>
            <Text style={styles.mobileOverviewValue}>{formatMoney(game.player.cash)}</Text>
          </View>
          <View style={styles.mobileOverviewCard}>
            <Text style={styles.mobileOverviewLabel}>XP</Text>
            <Text style={styles.mobileOverviewValueSmall}>{`${respectInfo.currentXp}/${respectInfo.requirement}`}</Text>
          </View>
        </View>
        <StatLine label="Ksywa" value={game.player.name} />
        <StatLine label="Atak" value={`${effectivePlayer.attack}`} />
        <StatLine label="Obrona" value={`${effectivePlayer.defense}`} />
        <StatLine label="Zrecznosc" value={`${effectivePlayer.dexterity}`} />
        <StatLine label="Charyzma" value={`${effectivePlayer.charisma}`} />
        <StatLine label="Zdrowie" value={`${game.player.hp}/${game.player.maxHp}`} />
        {criticalCareStatus?.active ? (
          <>
            <StatLine label="Stan" value={criticalCareStatus.mode?.label || "Intensywna terapia"} />
            <StatLine label="Do wyjscia" value={formatCooldown(criticalCareStatus.remainingMs || 0)} />
            <StatLine label="Powrot" value={`Okolo ${criticalCareStatus.expectedRecoveryHp || 1} HP`} />
          </>
        ) : null}
        {criticalCareStatus?.protected ? (
          <StatLine label="Oslona" value={formatCooldown(criticalCareStatus.protectionRemainingMs || 0)} />
        ) : null}
        <StatLine label="Laczny zarobek" value={formatMoney(game.stats.totalEarned)} />
        <StatLine label="Wygrane napady" value={`${game.stats.heistsWon}`} />
        </SectionCard>
      </>
    );
  }

  if (section === "progress") {
    return (
      <>
        <SceneArtwork
          eyebrow="Szacun"
          title="Kazdy prog szacunku wbija sie ciezej"
          lines={["Rosniesz szacunek po szacunku."]}
          accent={["#412517", "#160f0c", "#050505"]}
          source={sceneBackgrounds.profile}
        />
        <HeroPanel
          eyebrow="Progres"
          title={`Szacunek ${game.player.respect}`}
          summary="Ta karta ma od razu pokazywac ile Ci zostalo do kolejnego progu i czy teraz bardziej oplaca sie cisnac napady, kontrakty czy zwykle misje."
          tone="gold"
          pills={[
            { label: "XP", value: `${respectInfo.currentXp}/${respectInfo.requirement}`, note: `Brakuje ${respectInfo.xpRemaining} XP.`, tone: "gold", icon: "chart-line" },
            { label: "Nastepny prog", value: `${respectInfo.nextLevel}`, note: "Kolejny poziom szacunku.", tone: "info", icon: "chevron-double-up" },
          ]}
        />
        <SectionCard title="Szacun" subtitle="Pasek progresu i kolejny prog.">
          <StatLine label="Aktualny szacun" value={`${game.player.respect}`} />
          <StatLine label="XP" value={`${respectInfo.currentXp} / ${respectInfo.requirement}`} />
          <StatLine label="Nastepny prog szacunku" value={`${respectInfo.nextLevel}`} />
          <StatLine label="Brakuje XP" value={`${respectInfo.xpRemaining}`} />
          <ProgressBar progress={respectInfo.progress} />
          <ProgressDots progress={respectInfo.progress} />
        </SectionCard>
      </>
    );
  }

  if (section === "loadout") {
    return (
      <>
        <SceneArtwork
          eyebrow="Ekwipunek"
          title="Set pod Kontrakty"
          lines={["Tu widzisz co masz, co jest zalozone i czym wchodzisz do roboty premium."]}
          accent={["#2f2537", "#110f15", "#050505"]}
          source={sceneBackgrounds.profile}
        />
        <HeroPanel
          eyebrow="Loadout"
          title="Aktualny set pod kontrakty"
          summary="Najpierw widzisz co masz zalozone, potem dopiero schodzisz do listy posiadanego sprzetu i garazu."
          tone="info"
          pills={[
            { label: "Sloty", value: `${Object.keys(LOADOUT_LABELS).length}`, note: "Bron, ochrona, narzedzia, elektronika i auto.", tone: "info", icon: "shield-outline" },
            { label: "Masz itemow", value: `${(contractItems || []).length}`, note: "Kupiony sprzet pod kontrakty.", tone: "gold", icon: "briefcase-outline" },
            { label: "Masz aut", value: `${(contractCars || []).length}`, note: "Fury dostepne w garazu.", tone: "success", icon: "car-sports" },
          ]}
        />

        <SectionCard title="Aktualny loadout" subtitle="Jeden slot na kategorie. Bez setu kontrakt boli duzo bardziej.">
          {Object.entries(LOADOUT_LABELS).map(([slotId, label]) => {
            const currentId = contractState?.loadout?.[slotId];
            const currentAsset =
              slotId === "car"
                ? (contractCars || []).find((entry) => entry.id === currentId) || null
                : (contractItems || []).find((entry) => entry.id === currentId) || null;
            return (
              <View key={slotId} style={styles.listCard}>
                <View style={styles.inlineRow}>
                  <View style={styles.flexOne}>
                    <Text style={styles.listCardTitle}>{label}</Text>
                    <Text style={styles.listCardMeta}>{currentAsset?.name || "Brak zalozonego sprzetu."}</Text>
                    {currentAsset ? <Text style={styles.listCardMeta}>{getContractAssetEffectLine(currentAsset)}</Text> : null}
                  </View>
                  <Pressable onPress={() => onEquipContractLoadout(slotId, null)} style={[styles.inlineButton, !currentAsset && styles.tileDisabled]}>
                    <Text style={styles.inlineButtonText}>Zdejmij</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </SectionCard>

        <SectionCard title="Posiadany sprzet" subtitle="To co masz na stanie pod przyszle kontrakty.">
          {!contractItems?.length && !contractCars?.length ? <Text style={styles.emptyText}>Na razie pusto. Skocz do Rynku po pierwszy set.</Text> : null}
          {Object.entries(ownedByCategory).map(([slotId, entries]) => (
            <View key={slotId} style={styles.listCard}>
              <Text style={styles.listCardTitle}>{LOADOUT_LABELS[slotId]}</Text>
              {!entries.length ? <Text style={styles.listCardMeta}>Nic jeszcze nie kupiles.</Text> : null}
              {entries.map((item) => {
                const equipped = contractState?.loadout?.[slotId] === item.id;
                return (
                  <View key={item.id} style={styles.listCard}>
                    <View style={styles.inlineRow}>
                      <View style={styles.flexOne}>
                        <Text style={styles.listCardTitle}>{item.name}</Text>
                        <Text style={styles.listCardMeta}>{getContractAssetEffectLine(item)}</Text>
                      </View>
                      <Pressable onPress={() => onEquipContractLoadout(slotId, equipped ? null : item.id)} style={styles.inlineButton}>
                        <Text style={styles.inlineButtonText}>{equipped ? "Zalozone" : "Zaloz"}</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}

          <View style={styles.listCard}>
            <Text style={styles.listCardTitle}>Garaz</Text>
            {!contractCars?.length ? <Text style={styles.listCardMeta}>Jeszcze nie masz auta pod kontrakty.</Text> : null}
            {(contractCars || []).map((car) => {
              const equipped = contractState?.loadout?.car === car.id;
              return (
                <View key={car.id} style={styles.listCard}>
                  <View style={styles.inlineRow}>
                    <View style={styles.flexOne}>
                      <Text style={styles.listCardTitle}>{car.name}</Text>
                      <Text style={styles.listCardMeta}>{getContractAssetEffectLine(car)}</Text>
                    </View>
                    <Pressable onPress={() => onEquipContractLoadout("car", equipped ? null : car.id)} style={styles.inlineButton}>
                      <Text style={styles.inlineButtonText}>{equipped ? "Wybrane" : "Wybierz"}</Text>
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

  if (section === "protection") {
    const bestHeist = [...heists].filter((entry) => entry.respect <= game.player.respect).slice(-1)[0] || heists[0];

    return (
      <>
        <SceneArtwork
          eyebrow="Ochrona"
          title="Staty maja robic robote"
          lines={["Atak, obrona i heat decyduja o ryzyku."]}
          accent={["#38271a", "#15100c", "#050505"]}
          source={sceneBackgrounds.profile}
        />
        <HeroPanel
          eyebrow="Bezpieczenstwo"
          title="Jak bardzo boli ryzyko"
          summary="To jest szybki panel pod walke i wysokie ryzyko. Najpierw lapiesz staty, potem widzisz jak heat i gang zmieniaja realne szanse."
          tone="danger"
          pills={[
            { label: "ATK", value: `${game.player.attack}`, note: "Wejscie w brutalna akcje.", tone: "danger", icon: "sword" },
            { label: "DEF", value: `${game.player.defense}`, note: "Ile wytrzymasz przy failu.", tone: "info", icon: "shield-outline" },
            { label: "DEX", value: `${game.player.dexterity}`, note: "Czyste wyjscie i unik.", tone: "gold", icon: "run-fast" },
          ]}
        />
        <SectionCard title="Ochrona" subtitle="Staty, gang i ryzyko.">
          <StatLine label="Obrona bazowa" value={`${game.player.defense}`} />
          <StatLine label="Zrecznosc bazowa" value={`${game.player.dexterity}`} />
          <StatLine label="Premia gangu" value={`+${Math.round(game.gang.members * 0.3)} do bezpieczenstwa akcji`} />
          <StatLine label="Heat kary" value={`-${Math.round(game.player.heat * 0.35)}% do czystej gry`} />
          <StatLine
            label="Najlepszy odblokowany napad"
            value={`${bestHeist.name} (${Math.round(getSoloHeistOdds(game.player, effectivePlayer, game.gang, bestHeist, game.activeBoosts).chance * 100)}%)`}
          />
        </SectionCard>
      </>
    );
  }

  return (
    <SectionCard title="Log wydarzen" subtitle="Najswiezsze akcje, wtopy, biznes i ruchy ekipy.">
      {game.log.map((entry, index) => (
        <View key={`${entry}-${index}`} style={styles.logEntry}>
          <Text style={styles.logText}>{entry}</Text>
        </View>
      ))}
    </SectionCard>
  );
}
