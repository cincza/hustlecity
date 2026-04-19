import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { HEIST_TIERS, getNextHeistTier, groupHeistsByTier } from "../game/config/heistTiers";
import { HeistCard, HeistTabs } from "../components/GameShellUI";
import { getGangProjectEffects } from "../../shared/gangProjects.js";
import { getOperationChoiceImpactLines, getOperationPreviewDetails } from "../game/selectors/metaGameplay";

export function HeistsScreen({
  heists,
  game,
  effectivePlayer,
  styles,
  SceneArtwork,
  SectionCard,
  StatLine,
  Tag,
  formatMoney,
  districtSummaries,
  availableOperations,
  activeOperation,
  activeOperationStage,
  activeOperationChoices,
  getSoloHeistOdds,
  onExecuteHeist,
  onStartOperation,
  onAdvanceOperation,
  onExecuteOperation,
  sceneBackgrounds,
}) {
  const SafeTag = Tag || (({ text }) => <Text style={styles.listCardMeta}>{text}</Text>);
  const safeHeists = Array.isArray(heists) ? heists : [];
  const safeOperations = Array.isArray(availableOperations) ? availableOperations : [];
  const safeOperationChoices = Array.isArray(activeOperationChoices) ? activeOperationChoices : [];
  const safeDistrictSummaries = Array.isArray(districtSummaries) ? districtSummaries : [];
  const grouped = useMemo(() => groupHeistsByTier(safeHeists), [safeHeists]);
  const unlockedTierIds = HEIST_TIERS.filter((tier) => game.player.respect >= tier.unlockRespect).map((tier) => tier.id);
  const [selectedTier, setSelectedTier] = useState(unlockedTierIds[unlockedTierIds.length - 1] || HEIST_TIERS[0].id);

  useEffect(() => {
    if (!HEIST_TIERS.some((tier) => tier.id === selectedTier && game.player.respect >= tier.unlockRespect)) {
      setSelectedTier(unlockedTierIds[unlockedTierIds.length - 1] || HEIST_TIERS[0].id);
    }
  }, [game.player.respect, selectedTier, unlockedTierIds]);

  const nextTier = getNextHeistTier(game.player.respect);
  const activeHeists = grouped[selectedTier] || [];
  const activeOperationTitle = useMemo(
    () =>
      activeOperation
        ? (safeOperations.find((operation) => operation.id === activeOperation.operationId)?.name || activeOperation.operationId)
        : null,
    [activeOperation, safeOperations]
  );
  const districtSummaryById = useMemo(
    () => Object.fromEntries(safeDistrictSummaries.map((district) => [district.id, district])),
    [safeDistrictSummaries]
  );
  const gangEffects = useMemo(() => getGangProjectEffects(game.gang), [game.gang]);
  const activeOperationDefinition = useMemo(
    () => safeOperations.find((operation) => operation.id === activeOperation?.operationId) || null,
    [activeOperation?.operationId, safeOperations]
  );
  const activeOperationPreview = useMemo(
    () =>
      activeOperationDefinition
        ? getOperationPreviewDetails({
            operation: activeOperationDefinition,
            activeOperation,
            player: effectivePlayer,
            districtSummary: districtSummaryById[activeOperationDefinition.districtId],
            gangEffects,
          })
        : null,
    [activeOperation, activeOperationDefinition, districtSummaryById, effectivePlayer, gangEffects]
  );

  const tierTabs = HEIST_TIERS.map((tier) => ({
    id: tier.id,
    label: tier.shortLabel,
    locked: game.player.respect < tier.unlockRespect,
    lockedLabel: game.player.respect < tier.unlockRespect ? `Szacunek ${tier.unlockRespect}` : null,
  }));

  return (
    <>
      <SceneArtwork
        eyebrow="Napady"
        title="Miasto po zmroku"
        lines={["Ulica, sklepy, firmy i high risk bez zbednego scrolla."]}
        source={sceneBackgrounds.heists}
      />

      <SectionCard title="Napady" subtitle="Wybierasz prog, widzisz tylko akcje z tego progu i od razu wchodzisz do roboty.">
        <StatLine label="Aktualny szacunek" value={`${game.player.respect}`} />
        <StatLine
          label="Odblokowany tier"
          value={HEIST_TIERS.filter((tier) => game.player.respect >= tier.unlockRespect).slice(-1)[0]?.title || HEIST_TIERS[0].title}
        />
        <StatLine label="Nastepny prog" value={nextTier ? `${nextTier.title} przy Szacunku ${nextTier.unlockRespect}` : "Masz wszystkie progi"} />
      </SectionCard>

      <SectionCard title="Operacje" subtitle="Grubsza robota ponad szybkim heistem. Jedna aktywna planowka naraz.">
        {activeOperation ? (
          <View style={styles.listCard}>
            <Text style={styles.listCardTitle}>{activeOperationTitle}</Text>
            <Text style={styles.listCardMeta}>
              Dzielnica: {districtSummaryById[activeOperation.districtId]?.name || activeOperation.districtId} | Etap: {activeOperationStage || "final"}
            </Text>
            {(activeOperationPreview?.lines || []).map((line) => (
              <Text key={`active-op-${line}`} style={styles.listCardMeta}>
                {line}
              </Text>
            ))}
            {activeOperationStage ? (
              safeOperationChoices.map((choice) => (
                <View key={choice.id} style={styles.listCard}>
                  <View style={styles.inlineRow}>
                    <View style={styles.flexOne}>
                      <Text style={styles.listCardTitle}>{choice.label}</Text>
                      <Text style={styles.listCardMeta}>{choice.summary}</Text>
                      {getOperationChoiceImpactLines(choice).map((line) => (
                        <Text key={`${choice.id}-${line}`} style={styles.listCardMeta}>
                          {line}
                        </Text>
                      ))}
                    </View>
                    <Pressable onPress={() => onAdvanceOperation(choice.id)} style={styles.inlineButton}>
                      <Text style={styles.inlineButtonText}>Wybierz</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            ) : (
              <Pressable onPress={onExecuteOperation} style={styles.inlineButton}>
                <Text style={styles.inlineButtonText}>Odpal final</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <>
            {!safeOperations.length ? <Text style={styles.emptyText}>Najpierw dobij do wyzszych progow szacunu.</Text> : null}
            {safeOperations.map((operation) => (
              <View key={operation.id} style={styles.listCard}>
                <View style={styles.listCardHeader}>
                  <View style={styles.flexOne}>
                    <Text style={styles.listCardTitle}>{operation.name}</Text>
                    <Text style={styles.listCardMeta}>
                      {districtSummaryById[operation.districtId]?.name || operation.districtId} | Start od {operation.respect} RES
                    </Text>
                  </View>
                  <SafeTag text={formatMoney(operation.baseReward[0])} />
                </View>
                <Text style={styles.listCardMeta}>{operation.summary}</Text>
                {(getOperationPreviewDetails({
                  operation,
                  player: effectivePlayer,
                  districtSummary: districtSummaryById[operation.districtId],
                  gangEffects,
                })?.lines || []).map((line) => (
                  <Text key={`${operation.id}-${line}`} style={styles.listCardMeta}>
                    {line}
                  </Text>
                ))}
                <View style={styles.inlineRow}>
                  <Text style={styles.costLabel}>Przygotowanie {formatMoney(operation.prepCost)} | Energia {operation.energyCost}</Text>
                  <Pressable onPress={() => onStartOperation(operation.id)} style={styles.inlineButton}>
                    <Text style={styles.inlineButtonText}>Zacznij</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </>
        )}
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
          const rewardRange = Array.isArray(heist.reward) ? heist.reward : [0, 0];
          const xpRange = Array.isArray(heist.xpGain) ? heist.xpGain : [0, 0];

          return (
            <HeistCard
              key={heist.id}
              title={heist.name}
              reward={`${formatMoney(rewardRange[0])} - ${formatMoney(rewardRange[1])}`}
              xp={`${xpRange[0]} - ${xpRange[1]} XP`}
              chance={`${Math.round(odds.chance * 100)}%`}
              energy={`${heist.energy}`}
              risk={`${Math.round(heist.risk * 100)}%`}
              lockedLabel={locked ? `Wymagany szacunek: ${heist.respect}` : "Wykonaj"}
              onPress={() => !locked && onExecuteHeist(heist)}
              disabled={locked}
            />
          );
        })}
      </SectionCard>
    </>
  );
}
