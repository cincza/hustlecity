import React, { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { HEIST_TIERS, getNextHeistTier, groupHeistsByTier } from "../game/config/heistTiers";
import { HeistCard, HeistTabs } from "../components/GameShellUI";

export function HeistsScreen({
  heists,
  game,
  effectivePlayer,
  styles,
  SceneArtwork,
  SectionCard,
  ProgressBar,
  StatLine,
  Tag,
  formatMoney,
  getSoloHeistOdds,
  onExecuteHeist,
  sceneBackgrounds,
}) {
  const grouped = useMemo(() => groupHeistsByTier(heists), [heists]);
  const unlockedTierIds = HEIST_TIERS.filter((tier) => game.player.respect >= tier.unlockRespect).map((tier) => tier.id);
  const [selectedTier, setSelectedTier] = useState(unlockedTierIds[unlockedTierIds.length - 1] || HEIST_TIERS[0].id);
  const nextTier = getNextHeistTier(game.player.respect);
  const activeHeists = grouped[selectedTier] || [];
  const tierTabs = HEIST_TIERS.map((tier) => ({
    id: tier.id,
    label: tier.shortLabel,
    locked: game.player.respect < tier.unlockRespect,
    lockedLabel: game.player.respect < tier.unlockRespect ? `🔒 Szacunek ${tier.unlockRespect}` : null,
  }));

  return (
    <>
      <SceneArtwork
        eyebrow="Napady"
        title="Miasto po zmroku"
        lines={["Ulica, sklepy, firmy i high risk bez zbędnego scrolla."]}
        source={sceneBackgrounds.heists}
      />

      <SectionCard title="Napady" subtitle="Wybierasz prog, widzisz tylko akcje z tego progu i od razu wchodzisz do roboty.">
        <StatLine label="Aktualny szacunek" value={`${game.player.respect}`} />
        <StatLine label="Odblokowany tier" value={HEIST_TIERS.filter((tier) => game.player.respect >= tier.unlockRespect).slice(-1)[0]?.title || HEIST_TIERS[0].title} />
        <StatLine label="Nastepny prog" value={nextTier ? `${nextTier.title} przy Szacunku ${nextTier.unlockRespect}` : "Masz wszystkie progi"} />
      </SectionCard>

      <SectionCard title="Progi" subtitle="Ulica, sklepy, firmy i high risk w jednym czystym przejsciu.">
        <HeistTabs tabs={tierTabs} selected={selectedTier} onSelect={setSelectedTier} />
        <Text style={styles.listCardMeta}>
          {(HEIST_TIERS.find((tier) => tier.id === selectedTier) || HEIST_TIERS[0]).description}
        </Text>
      </SectionCard>

      <SectionCard title="Lista napadow" subtitle="Karty sa krotkie, czytelne i gotowe do szybkiego wejscia.">
        {!activeHeists.length ? <Text style={styles.emptyText}>W tym tierze jeszcze nic nie ma.</Text> : null}
        {activeHeists.map((heist) => {
          const locked = game.player.respect < heist.respect;
          const odds = getSoloHeistOdds(game.player, effectivePlayer, game.gang, heist);
          return (
            <HeistCard
              key={heist.id}
              title={heist.name}
              reward={`${formatMoney(heist.reward[0])} - ${formatMoney(heist.reward[1])}`}
              xp={`${heist.xpGain[0]} - ${heist.xpGain[1]} XP`}
              chance={`${Math.round(odds.chance * 100)}%`}
              energy={`${heist.energy}`}
              risk={`${Math.round(heist.risk * 100)}%`}
              lockedLabel={locked ? `🔒 Wymagany szacunek: ${heist.respect}` : "Wykonaj"}
              onPress={() => !locked && onExecuteHeist(heist)}
              disabled={locked}
            />
          );
        })}
      </SectionCard>
    </>
  );
}
