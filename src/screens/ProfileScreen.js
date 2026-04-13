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
      <SectionCard title="Profil" subtitle="Przeglad calej postaci, progresu i wartosci bojowych.">
        <SceneArtwork
          eyebrow="Profil"
          title="Twoja twarz w Hustle City"
          lines={["Tu zbiera sie caly progres postaci: avatar, szacun, bojowe staty i wartosc na ulicy.", "Wysoki poziom ma byc widoczny od razu po odpaleniu profilu."]}
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
        <StatLine label="Ksywa" value={game.player.name} />
        <StatLine label="Ranga" value={getRankTitle(game.player.respect)} />
        <StatLine label="Poziom" value={`${respectInfo.level}`} />
        <StatLine label="Atak" value={`${effectivePlayer.attack}`} />
        <StatLine label="Obrona" value={`${effectivePlayer.defense}`} />
        <StatLine label="Zrecznosc" value={`${effectivePlayer.dexterity}`} />
        <StatLine label="Charyzma" value={`${effectivePlayer.charisma}`} />
        <StatLine label="Zdrowie" value={`${game.player.hp}/${game.player.maxHp}`} />
        <StatLine label="Laczny zarobek" value={formatMoney(game.stats.totalEarned)} />
        <StatLine label="Wygrane napady" value={`${game.stats.heistsWon}`} />
        <StatLine label="Premium" value={`${game.player.premiumTokens}`} />
      </SectionCard>
    );
  }

  if (section === "progress") {
    return (
      <>
        <SceneArtwork
          eyebrow="Szacun"
          title="Kazdy poziom wbija sie ciezej"
          lines={["Masz pasek i kropki, a potem coraz wiekszy prog do kolejnego levelu.", "To ma dawac prawdziwe poczucie progresu, a nie szybki sprint do konca drabinki."]}
          accent={["#412517", "#160f0c", "#050505"]}
          source={sceneBackgrounds.profile}
        />
        <SectionCard title="Szacun" subtitle="Masz pasek i kropki, a kazdy kolejny poziom wbija sie coraz ciezej.">
          <StatLine label="Aktualny szacun" value={`${game.player.respect}`} />
          <StatLine label="Poziom" value={`${respectInfo.level}`} />
          <StatLine label="Do nastepnego poziomu" value={`${respectInfo.nextGoal - game.player.respect}`} />
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
          lines={["Atak pomaga przebic trudnosc napadu, obrona ogranicza wpierdol i ryzyko celi, a zrecznosc robi najwiecej przy wejsciu i wyjsciu.", "Im wyzszy heat, tym trudniej utrzymac czysta robote."]}
          accent={["#38271a", "#15100c", "#050505"]}
          source={sceneBackgrounds.profile}
        />
        <SectionCard title="Ochrona" subtitle="Na razie ochrone robia staty i gang, ale juz to realnie pracuje na wynik napadow.">
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
