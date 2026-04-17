import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

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
  getRankTitle,
  heists,
  getSoloHeistOdds,
  sceneBackgrounds,
}) {
  // TODO: TO_MIGRATE_TO_SERVER profile and protection stats still reflect mixed local/server state prepared in App.js.
  if (section === "summary") {
    return (
      <SectionCard title="Profil" subtitle="Twarz, staty i progres.">
        <SceneArtwork
          eyebrow="Profil"
          title="Twoja twarz w Hustle City"
          lines={["Avatar, szacun i wartosc na ulicy."]}
          accent={["#3f2818", "#16100c", "#050505"]}
          source={sceneBackgrounds.profile}
        />
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
        <StatLine label="Laczny zarobek" value={formatMoney(game.stats.totalEarned)} />
        <StatLine label="Wygrane napady" value={`${game.stats.heistsWon}`} />
      </SectionCard>
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
        <SectionCard title="Ochrona" subtitle="Staty, gang i ryzyko.">
          <StatLine label="Obrona bazowa" value={`${game.player.defense}`} />
          <StatLine label="Zrecznosc bazowa" value={`${game.player.dexterity}`} />
          <StatLine label="Premia gangu" value={`+${Math.round(game.gang.members * 0.3)} do bezpieczenstwa akcji`} />
          <StatLine label="Heat kary" value={`-${Math.round(game.player.heat * 0.35)}% do czystej gry`} />
          <StatLine
            label="Najlepszy odblokowany napad"
            value={`${bestHeist.name} (${Math.round(getSoloHeistOdds(game.player, effectivePlayer, game.gang, bestHeist).chance * 100)}%)`}
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
