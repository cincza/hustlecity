import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { HEIST_TIERS, getNextHeistTier, groupHeistsByTier } from "../game/config/heistTiers";
import { HeistCard, HeistTabs } from "../components/GameShellUI";
import { getGangProjectEffects } from "../../shared/gangProjects.js";
import { getOperationChoiceImpactLines, getOperationPreviewDetails } from "../game/selectors/metaGameplay";
import { getContractTagText } from "../../shared/contracts.js";
import { HeroPanel } from "../components/GameScreenPrimitives";

export function HeistsScreen({
  section = "solo",
  heists,
  game,
  effectivePlayer,
  styles,
  SceneArtwork,
  SectionCard,
  StatLine,
  Tag,
  formatMoney,
  formatCooldown,
  districtSummaries,
  criticalCareStatus,
  contractBoard,
  contractHistory,
  contractLoadoutSummaryLines,
  getContractPreviewForContract,
  getContractPreviewLinesForContract,
  availableOperations,
  activeOperation,
  activeOperationStage,
  activeOperationChoices,
  getSoloHeistOdds,
  onExecuteHeist,
  onExecuteContract,
  onStartOperation,
  onAdvanceOperation,
  onExecuteOperation,
  onBlockedByCriticalCare,
  onOpenHospital,
  sceneBackgrounds,
}) {
  const SafeTag = Tag || (({ text }) => <Text style={styles.listCardMeta}>{text}</Text>);
  const safeHeists = Array.isArray(heists) ? heists : [];
  const safeOperations = Array.isArray(availableOperations) ? availableOperations : [];
  const safeOperationChoices = Array.isArray(activeOperationChoices) ? activeOperationChoices : [];
  const safeDistrictSummaries = Array.isArray(districtSummaries) ? districtSummaries : [];
  const safeContractBoard = contractBoard && typeof contractBoard === "object" ? contractBoard : { active: [], history: [] };
  const safeContracts = Array.isArray(safeContractBoard.active) ? safeContractBoard.active : [];
  const safeContractHistory = Array.isArray(contractHistory) ? contractHistory : [];
  const criticalCareActive = Boolean(criticalCareStatus?.active);
  const criticalCareLockLabel = criticalCareActive
    ? `Szpital ${formatCooldown ? formatCooldown(criticalCareStatus?.remainingMs || 0) : `${Math.max(1, Math.ceil(Number(criticalCareStatus?.remainingMs || 0) / 60000))} min`}`
    : "";
  const triggerCriticalCareBlock = (actionLabel) => {
    if (!criticalCareActive || typeof onBlockedByCriticalCare !== "function") return;
    onBlockedByCriticalCare(actionLabel);
  };
  const grouped = useMemo(() => groupHeistsByTier(safeHeists), [safeHeists]);
  const unlockedTierIds = HEIST_TIERS.filter((tier) => game.player.respect >= tier.unlockRespect).map((tier) => tier.id);
  const [selectedTier, setSelectedTier] = useState(unlockedTierIds[unlockedTierIds.length - 1] || HEIST_TIERS[0].id);

  useEffect(() => {
    if (!HEIST_TIERS.some((tier) => tier.id === selectedTier && game.player.respect >= tier.unlockRespect)) {
      setSelectedTier(unlockedTierIds[unlockedTierIds.length - 1] || HEIST_TIERS[0].id);
    }
  }, [game.player.respect, selectedTier, unlockedTierIds]);

  useEffect(() => {
    if (criticalCareActive && typeof onOpenHospital === "function") {
      onOpenHospital();
    }
  }, [criticalCareActive, onOpenHospital]);

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

  const renderOperationsSection = () => (
    <SectionCard title="Operacje" subtitle="Grubsza robota ponad kontraktem. Jedna planowka naraz.">
      {criticalCareActive ? (
        <Text style={styles.listCardMeta}>
          Operacje wracaja po wyjsciu z {criticalCareStatus?.mode?.label?.toLowerCase() || "intensywnej terapii"}.
        </Text>
      ) : null}
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
                  <Pressable
                    onPress={() => (criticalCareActive ? triggerCriticalCareBlock("Operacje") : onAdvanceOperation(choice.id))}
                    style={[styles.inlineButton, criticalCareActive && styles.tileDisabled]}
                  >
                    <Text style={styles.inlineButtonText}>{criticalCareActive ? criticalCareLockLabel : "Wybierz"}</Text>
                  </Pressable>
                </View>
              </View>
            ))
          ) : (
            <Pressable onPress={() => (criticalCareActive ? triggerCriticalCareBlock("Operacje") : onExecuteOperation())} style={[styles.inlineButton, criticalCareActive && styles.tileDisabled]}>
              <Text style={styles.inlineButtonText}>{criticalCareActive ? criticalCareLockLabel : "Odpal final"}</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <>
          {!safeOperations.length ? <Text style={styles.emptyText}>Najpierw dobij do wyzszych progow szacunku.</Text> : null}
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
                <Pressable onPress={() => (criticalCareActive ? triggerCriticalCareBlock("Operacje") : onStartOperation(operation.id))} style={[styles.inlineButton, criticalCareActive && styles.tileDisabled]}>
                  <Text style={styles.inlineButtonText}>{criticalCareActive ? criticalCareLockLabel : "Zacznij"}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </>
      )}
    </SectionCard>
  );

  if (section === "contracts") {
    return (
      <>
        <SceneArtwork
          eyebrow="Kontrakty"
          title="Robota premium"
          lines={["Sprzet, auto i staty sklejaja wynik. Bez loadoutu robi sie naprawde goraco."]}
          source={sceneBackgrounds.heists}
        />
        <HeroPanel
          eyebrow={criticalCareActive ? "Stan krytyczny" : "Kontrakty"}
          title={criticalCareActive ? "Kontrakty poczekaja do wyjscia ze szpitala" : "Robota premium dla mocniejszych graczy"}
          summary={
            criticalCareActive
              ? `Jestes na ${criticalCareStatus?.mode?.label || "intensywnej terapii"} po ${criticalCareStatus?.source || "ciezkiej akcji"}. To nie zwykly cooldown - bojowe akcje wracaja dopiero po wyjsciu z terapii.`
              : "Kontrakty siedza pomiedzy zwyklymi napadami a operacjami. Najpierw dobierasz loadout i tagi, potem dopiero odpalasz wejscie."
          }
          tone={criticalCareActive ? "danger" : "gold"}
          pills={[
            {
              label: criticalCareActive ? "Do wyjscia" : "Aktywne kontrakty",
              value: criticalCareActive ? criticalCareLockLabel : `${safeContracts.length}`,
              note: criticalCareActive ? `Powrot z okolo ${criticalCareStatus?.expectedRecoveryHp || 1} HP.` : "Na tablicy wisza trzy mocniejsze roboty.",
              tone: criticalCareActive ? "danger" : "gold",
              icon: criticalCareActive ? "hospital-box-outline" : "briefcase-outline",
            },
            {
              label: "Loadout",
              value: contractLoadoutSummaryLines?.length ? `${contractLoadoutSummaryLines.length} slotow` : "Brak seta",
              note: "Puste sloty mocno tna szanse i retencje lupu.",
              tone: "info",
            icon: "shield-outline",
            },
            {
              label: "Historia",
              value: `${safeContractHistory.length}`,
              note: "Ostatnie rozliczenia pod reka.",
              tone: "neutral",
              icon: "history",
            },
          ]}
          primaryAction={
            typeof onOpenHospital === "function" && criticalCareActive
              ? {
                  label: "Szpital",
                  meta: "Wroc do terapii i wybierz leczenie.",
                  onPress: onOpenHospital,
                }
              : null
          }
        />

        <SectionCard title="Loadout" subtitle="Kontrakty licza pelny set. Kazdy pusty slot boli.">
          {(contractLoadoutSummaryLines || []).map((line) => (
            <Text key={line} style={styles.listCardMeta}>
              {line}
            </Text>
          ))}
        </SectionCard>

        <SectionCard title="Aktywne kontrakty" subtitle="Trzy roboty na rotacji. Dobierz set pod tagi, nie pod sam koszt.">
          <Text style={styles.listCardMeta}>
            Kolejna rotacja:{" "}
            {safeContractBoard?.nextRefreshAt
              ? new Date(safeContractBoard.nextRefreshAt).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
              : "brak danych"}
          </Text>
          {!safeContracts.length ? <Text style={styles.emptyText}>Tablica jest pusta. Odswiez za chwile.</Text> : null}
          {safeContracts.map((contract) => {
            const preview = getContractPreviewForContract(contract);
            const previewLines = getContractPreviewLinesForContract(contract);
            const locked = game.player.respect < contract.respect;
            const disabled = locked || criticalCareActive;
            return (
              <View key={contract.id} style={[styles.listCard, disabled && styles.listCardLocked]}>
                <View style={styles.listCardHeader}>
                  <View style={styles.flexOne}>
                    <Text style={styles.listCardTitle}>{contract.name}</Text>
                    <Text style={styles.listCardMeta}>
                      {districtSummaryById[contract.districtId]?.name || contract.districtId} | Trudnosc {contract.difficulty}/5
                    </Text>
                  </View>
                  <SafeTag text={contract.riskLabel} warning />
                </View>
                <Text style={styles.listCardMeta}>{contract.summary}</Text>
                <Text style={styles.listCardMeta}>Tagi: {getContractTagText(contract.tags)}</Text>
                <Text style={styles.listCardMeta}>
                  Staty: ATK {contract.recommendedStats.attack} | DEF {contract.recommendedStats.defense} | DEX {contract.recommendedStats.dexterity} | CHA {contract.recommendedStats.charisma}
                </Text>
                {previewLines.map((line) => (
                  <Text key={`${contract.id}-${line}`} style={styles.listCardMeta}>
                    {line}
                  </Text>
                ))}
                <View style={styles.oddsRow}>
                  <View style={styles.oddsBlock}>
                    <Text style={styles.oddsLabel}>Nagroda</Text>
                    <Text style={styles.oddsValue}>
                      {formatMoney(contract.baseReward[0])} - {formatMoney(contract.baseReward[1])}
                    </Text>
                  </View>
                  <View style={styles.oddsBlock}>
                    <Text style={styles.oddsLabel}>Szansa</Text>
                    <Text style={styles.oddsValue}>{Math.round(Number(preview?.successChance || 0) * 100)}%</Text>
                  </View>
                </View>
                <View style={styles.inlineRow}>
                  <Text style={styles.costLabel}>
                    Wejscie {formatMoney(contract.entryCost)} | Energia {contract.energyCost} | RES {contract.respect}
                  </Text>
                  <Pressable
                    onPress={() => (criticalCareActive ? triggerCriticalCareBlock("Kontrakty") : onExecuteContract(contract))}
                    style={[styles.inlineButton, disabled && styles.tileDisabled]}
                    disabled={locked}
                  >
                    <Text style={styles.inlineButtonText}>
                      {criticalCareActive ? criticalCareLockLabel : locked ? "Za niski RES" : "Odpal"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </SectionCard>

        <SectionCard title="Ostatnie rozliczenia" subtitle="Krotki raport po robocie. Kto trafi pod kontrakty, musi to widziec od razu.">
          {!safeContractHistory.length ? <Text style={styles.emptyText}>Jeszcze nic nie rozliczyles.</Text> : null}
          {safeContractHistory.map((entry) => (
            <View key={entry.id} style={styles.listCard}>
              <View style={styles.listCardHeader}>
                <View style={styles.flexOne}>
                  <Text style={styles.listCardTitle}>{entry.name}</Text>
                  <Text style={styles.listCardMeta}>
                    {entry.success ? `Wpada ${formatMoney(entry.reward)}` : `Koszt ${formatMoney(entry.entryCost)} | HP -${entry.damage}`}
                  </Text>
                </View>
                <SafeTag text={entry.success ? "SIADL" : "SPALONY"} warning={!entry.success} />
              </View>
              <Text style={styles.listCardMeta}>
                Heat +{entry.heatGain}
                {entry.jailed ? ` | Cela ${Math.max(1, Math.ceil(Number(entry.jailSeconds || 0) / 60))} min` : ""}
              </Text>
            </View>
          ))}
        </SectionCard>

        {renderOperationsSection()}
      </>
    );
  }

  return (
    <>
      <SceneArtwork
        eyebrow="Skoki"
        title="Miasto po zmroku"
        lines={["Ulica, sklepy i szybkie roboty bez zbednego scrolla."]}
        source={sceneBackgrounds.heists}
      />
      <HeroPanel
        eyebrow={criticalCareActive ? "Stan krytyczny" : "Skoki"}
        title={criticalCareActive ? "Skoki sa chwilowo zablokowane" : "Szybkie roboty na teraz"}
        summary={
          criticalCareActive
            ? `Jestes na ${criticalCareStatus?.mode?.label || "intensywnej terapii"} po ${criticalCareStatus?.source || "ciezkiej akcji"}. To nie cooldown - skoki, kontrakty i fight wracaja dopiero po wyjsciu z terapii.`
            : "Tu najszybciej bierzesz ryzyko, energie i payout. Najpierw wybierasz prog, potem widzisz tylko sensowne karty z tego tieru."
        }
        tone={criticalCareActive ? "danger" : "gold"}
        pills={[
          {
            label: "Szacunek",
            value: `${game.player.respect}`,
            note: "To od niego zalezy dostep do kolejnych progow.",
            tone: "gold",
            icon: "star-four-points",
          },
          {
            label: "Odblokowany tier",
            value: HEIST_TIERS.filter((tier) => game.player.respect >= tier.unlockRespect).slice(-1)[0]?.shortLabel || HEIST_TIERS[0].shortLabel,
            note: nextTier ? `Nastepny: ${nextTier.shortLabel} od ${nextTier.unlockRespect} RES.` : "Pelna drabinka odblokowana.",
            tone: "info",
            icon: "chevron-double-up",
          },
          {
            label: "Karty w tym progu",
            value: `${activeHeists.length}`,
            note: criticalCareActive ? criticalCareLockLabel : "Widok jest filtrowany do wybranego progu.",
            tone: criticalCareActive ? "danger" : "neutral",
            icon: "cards-outline",
          },
        ]}
        primaryAction={
          typeof onOpenHospital === "function" && criticalCareActive
            ? {
                label: "Idz do szpitala",
                meta: "Leczenie i szybki powrot do skokow.",
                onPress: onOpenHospital,
              }
            : null
        }
      />

      <SectionCard title="Progi" subtitle="Ulica, sklepy, firmy i high risk w jednym czystym przejsciu.">
        <HeistTabs tabs={tierTabs} selected={selectedTier} onSelect={setSelectedTier} />
        <Text style={styles.listCardMeta}>
          {(HEIST_TIERS.find((tier) => tier.id === selectedTier) || HEIST_TIERS[0]).description}
        </Text>
      </SectionCard>

      <SectionCard title="Lista skokow" subtitle="Karty sa krotkie, czytelne i gotowe do szybkiego wejscia.">
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
              lockedLabel={criticalCareActive ? criticalCareLockLabel : locked ? `Wymagany szacunek: ${heist.respect}` : "Wykonaj"}
              onPress={() => !locked && !criticalCareActive && onExecuteHeist(heist)}
              disabled={locked || criticalCareActive}
              onDisabledPress={criticalCareActive ? () => triggerCriticalCareBlock("Skoki") : undefined}
            />
          );
        })}
      </SectionCard>
    </>
  );
}
