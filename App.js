import React, { useEffect, useMemo, useState } from "react";
import { useRef } from "react";
import {
  Alert,
  Animated,
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  addFriendOnline,
  advanceOperationOnline,
  assignEscortToStreetOnline,
  bribeOutOfJailOnline,
  buyBusinessOnline,
  buyDrugFromDealerOnline,
  buyEscortOnline,
  buyFactoryOnline,
  buyFactorySupplyOnline,
  buyProductOnline,
  buyGymPassOnline,
  buyMealOnline,
  choosePrivateClinicOnline,
  claimClubOnline,
  claimGangGoalOnline,
  claimTaskOnline,
  collectClubSafeOnline,
  collectBusinessIncomeOnline,
  buyContractCarOnline,
  buyContractItemOnline,
  collectEscortIncomeOnline,
  contributeGangOnline,
  consumeDrugOnline,
  createGangOnline,
  deleteGangOnline,
  attackPlayerOnline,
  depositOnline,
  equipContractLoadoutOnline,
  executeContractOnline,
  executeOperationPlanOnline,
  executeHeistOnline,
  executeGangPvpOnline,
  fetchFriendListOnline,
  fetchCasinoMeta,
  fetchContractsOnline,
  fetchGangDirectoryOnline,
  fetchGlobalChatOnline,
  fetchHeistsOnline,
  fetchMarket,
  fetchMessageListOnline,
  fetchMe,
  fetchPrisonChatOnline,
  fetchRankingsOnline,
  fetchSocialPlayers,
  deleteAdminPlayerAccountOnline,
  grantAdminCashToPlayerOnline,
  grantAdminRespectToPlayerOnline,
  healOnline,
  hitBlackjackOnline,
  fortifyClubOnline,
  foundClubOnline,
  loginUser,
  investGangProjectOnline,
  invitePlayerToGangOnline,
  joinGangOnline,
  joinGangHeistLobbyOnline,
  leaveGangOnline,
  leaveGangHeistLobbyOnline,
  openGangHeistLobbyOnline,
  placeBountyOnline,
  playHighRiskOnline,
  performClubActionOnline,
  playSlotOnline,
  previewGangPvpOnline,
  registerUser,
  consumeClubDrugOnline,
  moveDrugToClubOnline,
  produceDrugOnline,
  pullEscortFromStreetOnline,
  rescueGangHeistCrewOnline,
  sellEscortOnline,
  sellDrugToDealerOnline,
  sellProductOnline,
  sendGlobalChatMessageOnline,
  sendDirectMessageOnline,
  sendGangAllianceOfferOnline,
  setClubPlanOnline,
  setClubSettingsOnline,
  setGangFocusOnline,
  startGangHeistLobbyOnline,
  updateGangMemberRoleOnline,
  updateGangSettingsOnline,
  startOperationOnline,
  startBlackjackOnline,
  startFightClubRunOnline,
  standBlackjackOnline,
  sendPrisonChatMessageOnline,
  trainAtGymOnline,
  upgradeGangMembersOnline,
  upgradeBusinessOnline,
  updateAvatarOnline,
  visitClubOnline,
  withdrawOnline,
  resolveFightClubRunOnline,
  buyFightClubBoostOnline,
} from "./api";
import {
  ECONOMY_RULES,
  CLUB_FOUNDING_CASH_COST,
  CLUB_TAKEOVER_COST,
  ENERGY_REGEN_SECONDS,
  HEALTH_REGEN_AMOUNT,
  HEALTH_REGEN_SECONDS,
  HEIST_DEFINITIONS,
  MARKET_PRODUCTS,
  PASSIVE_COLLECTION_CAP_MINUTES,
  RESTAURANT_ENERGY_CAP_PER_HOUR,
} from "./src/constants/economy";
import { usePlayerState, getAvatarById, getPlayerClubOwnerLabel, getRankTitle, hasGymPass, inJail } from "./src/hooks/usePlayerState";
import { AuthScreen } from "./src/screens/AuthScreen";
import { MarketScreen } from "./src/screens/MarketScreen";
import { clearStoredAuthToken, getStoredAuthToken, saveStoredAuthToken } from "./src/services/tokenStorage";
import { CasinoScreen } from "./src/screens/CasinoScreen";
import { EmpireScreen } from "./src/screens/EmpireScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { CityScreen } from "./src/screens/CityScreen";
import { HubScreen } from "./src/screens/HubScreen";
import { ProfileMenuScreen } from "./src/screens/ProfileMenuScreen";
import { HeistsScreen } from "./src/screens/HeistsScreen";
import { FightClubScreen } from "./src/screens/FightClubScreen";
import { PrisonSection } from "./src/components/PrisonSection";
import { HeroPanel } from "./src/components/GameScreenPrimitives";
import { GameHeader, QuickActionModal, ResultModal } from "./src/components/GameShellUI";
import { createRealtimeClient } from "./src/game/realtime/client";
import { handleRealtimeInvalidationEvent } from "./src/game/realtime/handlers";
import { BUSINESSES } from "./src/game/config/businesses";
import { blockIfOnlineAlpha } from "./src/game/authority";
import { getGameMode } from "./src/game/modes";
import { getNextHeistTier } from "./src/game/config/heistTiers";
import { getBusinessIncomePerMinute, getBusinessUpgradeCost, getBusinessUpgradePreview, getBusinessUpgradeState } from "./src/game/selectors/businessSelectors";
import { getCasinoGameConfig, getGangRaidPreviewLines } from "./src/game/selectors/authorityFeedback";
import {
  getContractAssetEffectLine,
  getContractLoadoutSummaryLines,
  getContractPreviewLines,
} from "./src/game/selectors/contractSelectors";
import { getDistrictEffectLines, getGangEffectLines, getGangProjectLevelLine } from "./src/game/selectors/metaGameplay";
import {
  FACTORIES,
  SUPPLIERS,
  createSupplyCounterMap,
  getDrugPoliceProfile as getSharedDrugPoliceProfile,
  getDrugProductionRespectRequirement,
  normalizeBusinessCollections,
  normalizeBusinessUpgrades,
  normalizeBusinessesOwned,
  normalizeFactoriesOwned,
  normalizeSupplies,
} from "./shared/empire.js";
import {
  CONTRACT_CARS,
  CONTRACT_ITEM_CATEGORIES,
  CONTRACT_ITEMS,
  CONTRACT_LOADOUT_SLOTS,
  createContractState,
  getActiveContractBoard,
  getContractById,
  getContractCarById,
  getContractItemById,
  getContractOutcomePreview,
  getOwnedContractCars,
  getOwnedContractItems,
  normalizeContractState,
} from "./shared/contracts.js";
import {
  getArenaActionModifiers,
  normalizeArenaState,
} from "./shared/arena.js";
import { applyXpProgression } from "./shared/progression.js";
import {
  canRunGangHeistRole,
  GANG_HEISTS,
  GANG_HEIST_RESCUE_OPTIONS,
  getGangHeistBonusRate,
  getGangHeistById,
  getGangHeistSquadSummary,
} from "./shared/gangHeists.js";
import {
  createCityState,
  findDistrictById,
  getDistrictModifierSummary,
  getDistrictSummaries,
  normalizeCityState,
} from "./shared/districts.js";
import {
  clampGangInviteRespectMin,
  createGangState,
  GANG_INVITE_RESPECT_MAX,
  GANG_INVITE_RESPECT_MIN,
  GANG_MEMBER_MANAGEABLE_ROLES,
  getActiveGangJobBoardProgress,
  getGangMemberCapUpgrade,
  getGangProjectCost,
  getGangProjectEffects,
  getGangProjectLevel,
  getGangWeeklyProgress,
  GANG_PROJECTS,
  normalizeGangState,
} from "./shared/gangProjects.js";
import { normalizeAdminGrantPresets } from "./shared/admin.js";
import {
  CRITICAL_CARE_RULES,
  getCriticalCareMode,
  getCriticalCareStatus,
  GYM_EXERCISES,
  GYM_PASSES,
  HOSPITAL_RULES,
  RESTAURANT_ITEMS,
} from "./shared/playerActions.js";
import {
  createOperationsState,
  getActiveOperationStage,
  getOperationById,
  getOperationChoicesForStage,
  normalizeOperationsState,
  OPERATION_CATALOG,
  OPERATION_STAGE_ORDER,
} from "./shared/operations.js";
import { getTaskBoard as getSharedTaskBoard } from "./shared/tasks.js";
import {
  CLUB_ESCORT_SEARCH_COST,
  CLUB_NIGHT_PLANS,
  CLUB_SYSTEM_RULES,
  CLUB_VISITOR_ACTIONS,
  CLUB_MARKET,
  DEALER_START_STOCK,
  DRUGS,
  ESCORTS,
  PLAYER_BOUNTY_COST,
  PLAYER_BOUNTY_INCREMENT,
  createClubGuestState,
  getClubGuestVenueState,
  getClubNightPlan,
  getClubPressureAfterDecay,
  getClubPressureLabel,
  getClubTrafficAfterDecay,
  getClubTrafficLabel,
  getClubVenueProfile as getSharedClubVenueProfile,
  getClubVisitDiminishing,
  hasClubGuestAccess,
  getDealerPayoutForDrug,
  getLeadTargetEscortForVenue,
  normalizeClubState,
} from "./shared/socialGameplay.js";
import {
  getEscortDistrictCount,
  getEscortIncomePerMinute,
  getEscortReserveCount,
  getEscortRoutes,
  getEscortWorkingCount,
  getOwnedEscort,
  STREET_DISTRICTS,
} from "./shared/street.js";
const GANG_INVITE_THRESHOLD_PRESETS = [
  GANG_INVITE_RESPECT_MIN,
  30,
  50,
  100,
  GANG_INVITE_RESPECT_MAX,
].filter((value, index, values) => values.indexOf(value) === index);
const GANG_ROLE_BUTTON_LABELS = {
  Czlonek: "Zwykly",
  Zaufany: "Zaufany",
  "Vice Boss": "Vice",
};
const GANG_TRIBUTE_COOLDOWN_MS = 20 * 60 * 1000;
const PLAYER_SAME_TARGET_ATTACK_COOLDOWN_MS = Number(ECONOMY_RULES.clubPvp?.sameTargetRepeatCooldownSeconds || 0) * 1000;
const AVATAR_ART = {
  ghost: require("./assets/avatars/avatar-ghost-face.png"),
  razor: require("./assets/avatars/avatar-razor-face.png"),
  saint: require("./assets/avatars/avatar-saint-face.png"),
  vandal: require("./assets/avatars/avatar-vandal-face.png"),
  boss: require("./assets/avatars/avatar-boss-face.png"),
};
const AVATAR_OPTIONS = [
  { id: "ghost", name: "Ghost", sigil: "GX", colors: ["#4f4f52", "#161618"], image: AVATAR_ART.ghost },
  { id: "razor", name: "Razor", sigil: "RZ", colors: ["#6a2a1d", "#1b0d0a"], image: AVATAR_ART.razor },
  { id: "saint", name: "Saint", sigil: "ST", colors: ["#4b3914", "#171109"], image: AVATAR_ART.saint },
  { id: "vandal", name: "Vandal", sigil: "VN", colors: ["#22463f", "#0d1816"], image: AVATAR_ART.vandal },
  { id: "boss", name: "Boss", sigil: "$$", colors: ["#5a4b1f", "#171308"], image: AVATAR_ART.boss },
];

const TAB_SIGILS = {
  start: "¦",
  city: "?",
  heists: "?",
  empire: "?",
  market: "?",
  gang: "?",
  profile: "?",
  dashboard: "¦",
  districts: "D",
  solo: "?",
  fightclub: "?",
  cell: "?",
  tasks: "?",
  bank: "$",
  gym: "?",
  restaurant: "?",
  hospital: "+",
  businesses: "?",
  factories: "?",
  supply: "?",
  overview: "¦",
  heistsGang: "?",
  members: "?",
  chat: "?",
  actions: "?",
  summary: "?",
  rank: "?",
  security: "?",
  log: "?",
  street: "?",
  drugs: "?",
  boosts: "?",
};

const CHARACTER_ARCHETYPES = [
  {
    id: "pimp",
    name: "Pimp",
    sigil: "PM",
    bonus: "Lepszy klub, kontakty i lekki bonus do zarobku z nocy.",
    starter: { respect: 1, attack: 7, defense: 7, dexterity: 8, charisma: 12, energy: 13, hp: 98, cash: 5000, bank: 10000 },
  },
  {
    id: "fighter",
    name: "Fighter",
    sigil: "FT",
    bonus: "Mocniejszy start do atakow, fightclubu i napadow na grubo.",
    starter: { respect: 1, attack: 12, defense: 10, dexterity: 7, charisma: 5, energy: 14, hp: 108, cash: 5000, bank: 10000 },
  },
  {
    id: "runner",
    name: "Runner",
    sigil: "RN",
    bonus: "Wysoka zrecznosc i czystsze wejscie/wyjscie z akcji.",
    starter: { respect: 1, attack: 8, defense: 7, dexterity: 13, charisma: 6, energy: 15, hp: 100, cash: 5000, bank: 10000 },
  },
  {
    id: "broker",
    name: "Broker",
    sigil: "BR",
    bonus: "Lepszy start pod handel, bank i ekonomie zaplecza.",
    starter: { respect: 1, attack: 6, defense: 6, dexterity: 8, charisma: 10, energy: 13, hp: 96, cash: 5000, bank: 10000 },
  },
];

const REFERRAL_MILESTONES = [
  { id: "ref-1", verified: 1, rewardCash: 10000, rewardXp: 0 },
  { id: "ref-3", verified: 3, rewardCash: 30000, rewardXp: 8 },
  { id: "ref-5", verified: 5, rewardCash: 70000, rewardXp: 14 },
  { id: "ref-10", verified: 10, rewardCash: 180000, rewardXp: 22 },
];

const HEISTS = HEIST_DEFINITIONS;

const PRODUCTS = MARKET_PRODUCTS;

const MARKET = PRODUCTS.reduce((acc, item, index) => {
  acc[item.id] = Math.round(item.basePrice * (1 + ((index % 3) - 1) * 0.08));
  return acc;
}, {});

const SCENE_BACKGROUNDS = {
  city: require("./assets/generated/city-bg.png"),
  heists: require("./assets/generated/heists-bg.png"),
  empire: require("./assets/generated/empire-bg.png"),
  casino: require("./assets/generated/casino-bg.png"),
  gang: require("./assets/generated/gang-bg.png"),
  prison: require("./assets/generated/prison-bg.png"),
  market: require("./assets/generated/market-bg.png"),
  profile: require("./assets/generated/profile-bg.png"),
  escort: require("./assets/generated/escort-scene.png"),
  gangWide: require("./assets/generated/gang-scene-large.png"),
  clubWide: require("./assets/generated/club-scene.png"),
  casinoWide: require("./assets/generated/casino-scene-large.png"),
};
const BRAND_MASTHEAD = require("./assets/branding/hustle-city-masthead.png");
const ESCORT_ART = {
  corner: require("./assets/portraits/escort-street.png"),
  velvet: require("./assets/portraits/escort-velvet.png"),
  vip: require("./assets/portraits/escort-vip.png"),
};
const GANG_ART = {
  greySaints: require("./assets/gangs/gang-grey-saints.png"),
  coldAvenue: require("./assets/gangs/gang-cold-avenue.png"),
  nightVultures: require("./assets/gangs/gang-night-vultures.png"),
  velvetAsh: require("./assets/gangs/gang-velvet-ash.png"),
  default: require("./assets/gangs/gang-hustle-default.png"),
};
const UI_ICON_ART = {
  bank: require("./assets/icons/ui-bank.png"),
  casino: require("./assets/icons/ui-casino.png"),
  market: require("./assets/icons/ui-market.png"),
  dealer: require("./assets/icons/ui-dealer.png"),
  club: require("./assets/icons/ui-club.png"),
  factory: require("./assets/icons/ui-factory.png"),
  supplier: require("./assets/icons/ui-supplier.png"),
  pvp: require("./assets/icons/ui-pvp.png"),
  energy: require("./assets/icons/ui-energy.png"),
  heat: require("./assets/icons/ui-heat.png"),
  cash: require("./assets/icons/ui-cash.png"),
  street: require("./assets/icons/ui-street.png"),
  premium: require("./assets/icons/ui-premium.png"),
  attack: require("./assets/icons/ui-attack.png"),
  defense: require("./assets/icons/ui-defense.png"),
  respect: require("./assets/icons/ui-respect.png"),
  heist: require("./assets/icons/ui-heist.png"),
  gang: require("./assets/icons/ui-gang.png"),
};
const SYSTEM_VISUALS = {
  bank: { code: "BNK", colors: ["#1b4f66", "#08111a"], image: UI_ICON_ART.bank },
  casino: { code: "CAS", colors: ["#5b2d68", "#140918"], image: UI_ICON_ART.casino },
  market: { code: "MRK", colors: ["#1f5b50", "#091613"], image: UI_ICON_ART.market },
  dealer: { code: "DLR", colors: ["#5a3767", "#140b18"], image: UI_ICON_ART.dealer },
  club: { code: "CLB", colors: ["#6f254f", "#180811"], image: UI_ICON_ART.club },
  factory: { code: "FAC", colors: ["#6b461f", "#180d08"], image: UI_ICON_ART.factory },
  supplier: { code: "SUP", colors: ["#2e4d67", "#0a1018"], image: UI_ICON_ART.supplier },
  pvp: { code: "PVP", colors: ["#6a262d", "#18080b"], image: UI_ICON_ART.pvp },
  energy: { code: "ENG", colors: ["#665b22", "#171408"], image: UI_ICON_ART.energy },
  heat: { code: "HOT", colors: ["#6f3621", "#190c08"], image: UI_ICON_ART.heat },
  cash: { code: "CASH", colors: ["#24593d", "#09140f"], image: UI_ICON_ART.cash },
  street: { code: "STR", colors: ["#6a2b39", "#19090f"], image: UI_ICON_ART.street },
  premium: { code: "VIP", colors: ["#4d356e", "#110b18"], image: UI_ICON_ART.premium },
  attack: { code: "ATK", colors: ["#6f2d40", "#18090d"], image: UI_ICON_ART.attack },
  defense: { code: "DEF", colors: ["#264468", "#091019"], image: UI_ICON_ART.defense },
  respect: { code: "RSP", colors: ["#6a541e", "#181307"], image: UI_ICON_ART.respect },
  heist: { code: "JOB", colors: ["#1f5a50", "#081411"], image: UI_ICON_ART.heist },
  gang: { code: "GNG", colors: ["#313e6f", "#090d1a"], image: UI_ICON_ART.gang },
};
const SUPPLIER_VISUALS = {
  tobacco: { ...SYSTEM_VISUALS.supplier, code: "TYT", image: require("./assets/supplier-icons/tobacco.png") },
  grain: { ...SYSTEM_VISUALS.supplier, code: "ZRN", image: require("./assets/supplier-icons/grain.png") },
  herbs: { ...SYSTEM_VISUALS.supplier, code: "ZIO", image: require("./assets/supplier-icons/herbs.png") },
  chemicals: { ...SYSTEM_VISUALS.supplier, code: "CHM", image: require("./assets/supplier-icons/chemicals.png") },
  packaging: { ...SYSTEM_VISUALS.supplier, code: "PAK", image: require("./assets/supplier-icons/packaging.png") },
  glass: { ...SYSTEM_VISUALS.supplier, code: "GLS", image: require("./assets/supplier-icons/glass.png") },
  solvent: { ...SYSTEM_VISUALS.supplier, code: "SOL", image: require("./assets/supplier-icons/solvent.png") },
  spores: { ...SYSTEM_VISUALS.supplier, code: "SPR", image: require("./assets/supplier-icons/spores.png") },
  resin: { ...SYSTEM_VISUALS.supplier, code: "RSN", image: require("./assets/supplier-icons/resin.png") },
  pills: { ...SYSTEM_VISUALS.supplier, code: "PIL", image: require("./assets/supplier-icons/pills.png") },
  pharma: { ...SYSTEM_VISUALS.supplier, code: "MED", image: require("./assets/supplier-icons/pharma.png") },
  coca: { ...SYSTEM_VISUALS.supplier, code: "COC", image: require("./assets/supplier-icons/coca.png") },
  poppy: { ...SYSTEM_VISUALS.supplier, code: "POP", image: require("./assets/supplier-icons/poppy.png") },
  acid: { ...SYSTEM_VISUALS.supplier, code: "ACD", image: require("./assets/supplier-icons/acid.png") },
  cactus: { ...SYSTEM_VISUALS.supplier, code: "CTX", image: require("./assets/supplier-icons/cactus.png") },
};

const DRUG_VISUALS = {
  smokes: { icon: "smoking", code: "FK", colors: ["#6a5540", "#231a12"], image: require("./assets/drug-icons/smokes.png") },
  spirit: { icon: "glass-cocktail", code: "SP", colors: ["#7b5529", "#261709"], image: require("./assets/drug-icons/spirit.png") },
  gbl: { icon: "flask-round-bottom", code: "GB", colors: ["#32696b", "#0f2021"], image: require("./assets/drug-icons/gbl.png") },
  salvia: { icon: "leaf", code: "SV", colors: ["#3a7841", "#102313"], image: require("./assets/drug-icons/salvia.png") },
  shrooms: { icon: "mushroom", code: "GR", colors: ["#8a4435", "#2a120d"], image: require("./assets/drug-icons/shrooms.png") },
  hash: { icon: "cube-outline", code: "HS", colors: ["#55763b", "#162010"], image: require("./assets/drug-icons/hash.png") },
  weed: { icon: "cannabis", code: "MJ", colors: ["#4d9d55", "#132715"], image: require("./assets/drug-icons/weed.png") },
  amphetamine: { icon: "pill", code: "AM", colors: ["#8a7136", "#2b210d"], image: require("./assets/drug-icons/amphetamine.png") },
  opium: { icon: "flower", code: "OP", colors: ["#8f4d62", "#251018"], image: require("./assets/drug-icons/opium.png") },
  rohypnol: { icon: "pill-multiple", code: "RH", colors: ["#6273af", "#161c34"], image: require("./assets/drug-icons/rohypnol.png") },
  cocaine: { icon: "google-circles-communities", code: "KK", colors: ["#8eb4c7", "#17313b"], image: require("./assets/drug-icons/cocaine.png") },
  heroin: { icon: "needle", code: "HR", colors: ["#88545f", "#2d1419"], image: require("./assets/drug-icons/heroin.png") },
  lsd: { icon: "star-four-points", code: "LSD", colors: ["#6a57a8", "#1c1431"], image: require("./assets/drug-icons/lsd.png") },
  ecstasy: { icon: "heart-circle", code: "EX", colors: ["#b86297", "#351125"], image: require("./assets/drug-icons/ecstasy.png") },
  mescaline: { icon: "cactus", code: "MS", colors: ["#5c8f54", "#182716"], image: require("./assets/drug-icons/mescaline.png") },
};

const BUSINESS_VISUALS = {
  bar: { icon: "glass-mug-variant", code: "BAR", colors: ["#8b6329", "#251708"], image: require("./assets/business-icons/bar.png") },
  club: { icon: "party-popper", code: "VIP", colors: ["#7c315e", "#240d1c"], image: require("./assets/business-icons/club.png") },
  laundry: { icon: "washing-machine", code: "PRA", colors: ["#3d6f8e", "#0f1d28"], image: require("./assets/business-icons/laundry.png") },
  cleaning: { icon: "spray-bottle", code: "SPR", colors: ["#2c7d72", "#0a1d1a"], image: require("./assets/business-icons/cleaning.png") },
  travel: { icon: "airplane", code: "POD", colors: ["#3b5f8e", "#101927"], image: require("./assets/business-icons/travel.png") },
  school: { icon: "translate", code: "JZK", colors: ["#56763d", "#111b0c"], image: require("./assets/business-icons/school.png") },
  cinema: { icon: "movie-open", code: "KIN", colors: ["#7b2f2f", "#200b0b"], image: require("./assets/business-icons/cinema.png") },
  garage: { icon: "car-wrench", code: "GAR", colors: ["#66727d", "#1a1f24"], image: require("./assets/business-icons/garage.png") },
  furniture: { icon: "sofa", code: "MBL", colors: ["#7c5d3f", "#1f150e"], image: require("./assets/business-icons/furniture.png") },
  pilllab: { icon: "pill-multiple", code: "LAB", colors: ["#6579af", "#171b35"], image: require("./assets/business-icons/pilllab.png") },
  brew: { icon: "barrel", code: "DST", colors: ["#93622f", "#261607"], image: require("./assets/business-icons/brew.png") },
  tower: { icon: "office-building", code: "IMP", colors: ["#51637c", "#121820"], image: require("./assets/business-icons/tower.png") },
};

const ESCORT_VISUALS = {
  corner: { emoji: "??", code: "UL", colors: ["#934050", "#280d15"], image: ESCORT_ART.corner },
  velvet: { emoji: "??", code: "VIP", colors: ["#a2557d", "#32111f"], image: ESCORT_ART.velvet },
  vip: { emoji: "??", code: "LUX", colors: ["#b57c34", "#2e1a08"], image: ESCORT_ART.vip },
};

const GANG_VISUALS = {
  "Grey Saints": { icon: "shield-crown", code: "GS", colors: ["#6f6f74", "#141418"], image: GANG_ART.greySaints },
  "Cold Avenue": { icon: "shield-crown", code: "CA", colors: ["#4d6f94", "#10161f"], image: GANG_ART.coldAvenue },
  "Night Vultures": { icon: "shield-crown", code: "NV", colors: ["#8b5439", "#1b0d09"], image: GANG_ART.nightVultures },
  "Velvet Ash": { icon: "shield-crown", code: "VA", colors: ["#98577d", "#1b0d16"], image: GANG_ART.velvetAsh },
  default: { icon: "shield-crown", code: "HC", colors: ["#7e5f2b", "#1a1208"], image: GANG_ART.default },
};

const FACTORY_VISUALS = {
  smokeworks: { icon: "factory", code: "FK", colors: ["#6a5540", "#231a12"], image: require("./assets/factory-icons/smokeworks.png") },
  distillery: { icon: "factory", code: "SP", colors: ["#7b5529", "#261709"], image: require("./assets/factory-icons/distillery.png") },
  wetlab: { icon: "flask", code: "GBL", colors: ["#32696b", "#0f2021"], image: require("./assets/factory-icons/wetlab.png") },
  greenhouse: { icon: "greenhouse", code: "BOT", colors: ["#3f7f42", "#112113"], image: require("./assets/factory-icons/greenhouse.png") },
  powderlab: { icon: "beaker", code: "PDR", colors: ["#80704e", "#211b10"], image: require("./assets/factory-icons/powderlab.png") },
  poppyworks: { icon: "flower-tulip", code: "OP", colors: ["#8f4d62", "#251018"], image: require("./assets/factory-icons/poppyworks.png") },
  cartelrefinery: { icon: "factory", code: "KK", colors: ["#8eb4c7", "#17313b"], image: require("./assets/factory-icons/cartelrefinery.png") },
  acidlab: { icon: "flask-round-bottom", code: "LSD", colors: ["#6a57a8", "#1c1431"], image: require("./assets/factory-icons/acidlab.png") },
  designerlab: { icon: "palette", code: "DSN", colors: ["#b86297", "#351125"], image: require("./assets/factory-icons/designerlab.png") },
};

const PRODUCT_VISUALS = {
  smoke: { icon: "smoking", code: "SM", colors: ["#6a5540", "#231a12"], image: require("./assets/drug-icons/smokes.png") },
  spirytus: { icon: "glass-cocktail", code: "AL", colors: ["#7b5529", "#261709"], image: require("./assets/drug-icons/spirit.png") },
  weed: { icon: "cannabis", code: "WE", colors: ["#4d9d55", "#132715"], image: require("./assets/drug-icons/weed.png") },
  speed: { icon: "pill", code: "SP", colors: ["#8a7136", "#2b210d"], image: require("./assets/drug-icons/amphetamine.png") },
  oxy: { icon: "pill-multiple", code: "OX", colors: ["#6273af", "#161c34"], image: require("./assets/drug-icons/rohypnol.png") },
  coke: { icon: "google-circles-communities", code: "CK", colors: ["#8eb4c7", "#17313b"], image: require("./assets/drug-icons/cocaine.png") },
  crystal: { icon: "diamond-stone", code: "CR", colors: ["#5a80ad", "#13203a"], image: require("./assets/drug-icons/gbl.png") },
};

const CONTRACT_CATEGORY_VISUALS = {
  weapon: { icon: "pistol", code: "WPN", colors: ["#6b2a24", "#1a0907"] },
  armor: { icon: "shield-half-full", code: "ARM", colors: ["#3c4b63", "#0e131c"] },
  tool: { icon: "tools", code: "TL", colors: ["#6a4f21", "#181107"] },
  electronics: { icon: "radio-tower", code: "SIG", colors: ["#284f5e", "#091116"] },
  car: { icon: "car-sports", code: "DRV", colors: ["#2f3d5e", "#0a0f18"] },
  contract: { icon: "briefcase-clock-outline", code: "CTR", colors: ["#70451e", "#170f08"] },
};

const TAB_DEFINITIONS = [
  {
    id: "city",
    label: "Miasto",
    sections: [
      { id: "bank", label: "Bank", title: "Bank" },
      { id: "hospital", label: "Szpital", title: "Szpital" },
      { id: "restaurant", label: "Restauracja", title: "Restauracja" },
      { id: "gym", label: "Silownia", title: "Silownia" },
      { id: "tasks", label: "Misje", title: "Zadania" },
      { id: "districts", label: "Dzielnice", title: "Dzielnice" },
    ],
  },
  {
    id: "heists",
    label: "Napady",
    sections: [
      { id: "solo", label: "Skoki", title: "Skoki" },
      { id: "contracts", label: "Kontrakty", title: "Kontrakty" },
      { id: "fightclub", label: "Arena", title: "Arena / Fightclub" },
      { id: "prison", label: "Cela", title: "Wiezienie" },
    ],
  },
  { id: "empire", label: "Biznes", sections: [{ id: "businesses", label: "Biznesy", title: "Biznesy" }, { id: "factories", label: "Fabryki", title: "Fabryki" }, { id: "suppliers", label: "Dostawy", title: "Hurtownie" }, { id: "club", label: "Klub", title: "Klub" }] },
  {
    id: "market",
    label: "Rynek",
    sections: [
      { id: "drugs", label: "Diler", title: "Diler" },
      { id: "items", label: "Itemy", title: "Itemy" },
      { id: "cars", label: "Auta", title: "Auta" },
      { id: "boosts", label: "Boosty", title: "Boosty" },
    ],
  },
  { id: "gang", label: "Gang", sections: [{ id: "overview", label: "Gang", title: "Gang" }, { id: "heists", label: "Napady", title: "Napady gangu" }, { id: "members", label: "Sklad", title: "Czlonkowie" }, { id: "chat", label: "Chat", title: "Chat gangu" }, { id: "ops", label: "Akcje", title: "Operacje" }] },
  {
    id: "profile",
    label: "Postac",
    sections: [
      { id: "summary", label: "Profil", title: "Profil" },
      { id: "progress", label: "Ranga", title: "Szacun" },
      { id: "loadout", label: "Ekwipunek", title: "Ekwipunek" },
      { id: "protection", label: "Ochrona", title: "Ochrona" },
      { id: "log", label: "Log", title: "Log wydarzen" },
      { id: "utilities", label: "Narzedzia", title: "Narzedzia", hidden: true },
      { id: "community", label: "Kontakt", title: "Spolecznosc", hidden: true },
      { id: "casino", label: "Kasyno", title: "Kasyno", hidden: true },
      { id: "tasks", label: "Misje", title: "Zadania", hidden: true },
      { id: "bank", label: "Bank", title: "Bank", hidden: true },
      { id: "gym", label: "Silownia", title: "Silownia", hidden: true },
      { id: "restaurant", label: "Restauracja", title: "Restauracja", hidden: true },
      { id: "hospital", label: "Szpital", title: "Szpital", hidden: true },
      { id: "players", label: "Gracze", title: "Gracze", hidden: true },
      { id: "friends", label: "Znajomi", title: "Znajomi", hidden: true },
      { id: "messages", label: "Wiadomosci", title: "Wiadomosci", hidden: true },
      { id: "citychat", label: "Miasto", title: "Chat miasta", hidden: true },
      { id: "rankings", label: "Rankingi", title: "Rankingi", hidden: true },
    ],
  },
];

const DEFAULT_SECTIONS = TAB_DEFINITIONS.reduce((acc, tab) => {
  acc[tab.id] = tab.sections[0].id;
  return acc;
}, {});

DEFAULT_SECTIONS.city = "bank";

const createInitialCasinoState = () => ({
  slotBet: "200",
  slotDisplay: ["MASK", "CASH", "CROWN"],
  slotResult: null,
  slotSpinning: false,
  rouletteChoice: "red",
  rouletteSpinning: false,
  rouletteDisplay: "00",
  rouletteResult: null,
  rouletteHistory: [],
  rouletteBet: "200",
  blackjack: { stage: "idle", bet: "200", playerCards: [], dealerCards: [], message: "Rozdaj karty i sprawdz szczescie." },
  backendMeta: null,
  serverGame: null,
});

const INITIAL = {
  player: {
    id: null,
    name: "Vin Blaze",
    username: "vinblaze",
    avatarId: "ghost",
    avatarCustomUri: null,
    rank: "Swiezak",
    cash: 5000,
    bank: 10000,
    premiumTokens: 0,
    energy: 14,
    maxEnergy: 14,
    hp: 100,
    maxHp: 100,
    respect: 1,
    xp: 0,
    attack: 11,
    defense: 8,
    dexterity: 7,
    charisma: 6,
    heat: 6,
    gymPassTier: null,
    gymPassUntil: null,
    jailUntil: null,
    criticalCareUntil: null,
    criticalCareSource: null,
    criticalCareMode: null,
    criticalProtectionUntil: null,
    isAdmin: false,
    adminGrantPresets: [],
    adminRespectPresets: [],
  },
  stats: {
    heistsDone: 0,
    heistsWon: 0,
    totalEarned: 0,
    gangHeistsWon: 0,
    gangHeistsParticipated: 0,
    casinoWins: 0,
    drugBatches: 0,
    mealsEaten: 0,
    hospitalHeals: 0,
    gymTrainings: 0,
    bankDepositedTotal: 0,
    marketGoodsBought: 0,
    marketGoodsSold: 0,
    drugsBought: 0,
    dealerDrugSalesValue: 0,
    businessCollections: 0,
    producedDrugSalesValue: 0,
    clubStashMoves: 0,
    gangVaultContributed: 0,
    contractAssetsBought: 0,
    contractLoadoutEquips: 0,
    contractsCompleted: 0,
    operationsCompleted: 0,
    districtActionsById: {},
  },
  gang: createGangState(),
  city: createCityState(),
  operations: createOperationsState(),
  contracts: createContractState(),
  businessesOwned: [],
  businessUpgrades: {},
  escortsOwned: [],
  factoriesOwned: {},
  factoryState: {
    ownedFactories: [],
    shipments: [],
    stock: {},
  },
  inventory: PRODUCTS.reduce((acc, item) => {
    acc[item.id] = 0;
    return acc;
  }, {}),
  drugInventory: DRUGS.reduce((acc, item) => {
    acc[item.id] = 0;
    return acc;
  }, {}),
  producedDrugInventory: DRUGS.reduce((acc, item) => {
    acc[item.id] = 0;
    return acc;
  }, {}),
  dealerInventory: { ...DEALER_START_STOCK },
  club: {
    owned: false,
    name: "Velvet Static",
    sourceId: null,
    visitId: null,
    ownerLabel: null,
    popularity: 0,
    mood: 60,
    policeBase: 0,
    policePressure: 0,
    traffic: 0,
    lastTrafficAt: 0,
    nightPlanId: getClubNightPlan().id,
    recentIncident: null,
    note: null,
    lastRunAt: 0,
    stash: createDrugCounterMap(),
    guestState: createClubGuestState(),
  },
  clubListings: createClubListings(),
  supplies: {
    ...createSupplyCounterMap(0),
    tobacco: 2,
    grain: 1,
    herbs: 2,
  },
  activeBoosts: [],
  market: MARKET,
  marketState: Object.fromEntries(
    MARKET_PRODUCTS.map((product) => [
      product.id,
      {
        streetStock: 0,
        fallbackStock: 0,
        totalSupply: 0,
        streetPrice: MARKET[product.id],
        fallbackPrice: Math.floor(MARKET[product.id] * 1.16),
        sellPrice: Math.floor(MARKET[product.id] * 0.85),
        demandPressure: 0,
        scarcity: 0,
        targets: { streetTarget: 0, fallbackTarget: 0 },
      },
    ])
  ),
  marketMeta: {
    refreshedAt: null,
    sellRate: 0.85,
    npcFallbackMarkup: 1.16,
    orderRules: null,
  },
  contractBoard: getActiveContractBoard(Date.now()),
  arena: normalizeArenaState(),
  tasksClaimed: [],
  regenRemainder: 0,
  hpRegenRemainder: 0,
  lastTick: Date.now(),
  log: [
    "Hustle City wrze. Lokalne ekipy testuja kazdy nowy ruch na dzielni.",
    "Potrzebujesz szacunu, hajsu i zaplecza, zeby wejsc na wyzszy prog szacunku.",
  ],
  prisonChat: [
    { id: "pr-1", author: "Bolo", text: "Kto ma kontakt na szybsza kaucje?", time: "13:58" },
    { id: "pr-2", author: "Koks", text: "W celi obok siedzi ekipa po skoku na kantor.", time: "14:04" },
  ],
  online: {
    roster: [],
    selectedPlayerId: null,
    selectedGangId: null,
    gangs: [],
    heists: [],
    rankings: {
      byRespect: [],
      byCash: [],
      byHeists: [],
      byCasino: [],
    },
    cityChat: [
      { id: "city-1", author: "System", text: "Chat miasta zyje. Tutaj zgadujesz sie z ludzmi na akcje i handel.", time: "14:18" },
    ],
    friends: [],
    messages: [
      { id: "msg-1", from: "System", subject: "Miasto patrzy", preview: "Jak ludzie wejda online, tu poleca wiadomosci i ruch na miescie.", time: "14:22" },
    ],
  },
  referrals: {
    code: "HUSTLE-VINBLAZE",
    invited: 3,
    verified: 1,
    pending: 2,
    claimedMilestones: [],
  },
  cooldowns: {
    playerAttackUntil: 0,
    playerAttackTargets: {},
    gangAttackUntil: 0,
    gangAttackTargets: {},
  },
  collections: {
    businessCash: 0,
    escortCash: 0,
    businessCollectedAt: null,
    escortCollectedAt: null,
    businessAccruedAt: Date.now(),
    escortAccruedAt: Date.now(),
  },
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const normalizeHeistDefinition = (heist) => {
  if (!heist || typeof heist !== "object") return null;
  const normalizeRange = (value, fallback) => {
    if (Array.isArray(value) && value.length >= 2 && value.every((entry) => Number.isFinite(entry))) {
      return [value[0], value[1]];
    }
    if (Number.isFinite(value)) {
      return [value, value];
    }
    return fallback;
  };

  return {
    ...heist,
    tier: Number.isFinite(heist.tier) ? heist.tier : 1,
    respect: Number.isFinite(heist.respect) ? heist.respect : 0,
    reward: normalizeRange(heist.reward, [120, 180]),
    failCashLoss: normalizeRange(heist.failCashLoss, [20, 50]),
    hpLoss: normalizeRange(heist.hpLoss, [0, 5]),
    xpGain: normalizeRange(heist.xpGain ?? heist.respectGain, [1, 2]),
    energy: Number.isFinite(heist.energy) ? heist.energy : 1,
    risk: Number.isFinite(heist.risk) ? heist.risk : 0.08,
    heatOnSuccess: Number.isFinite(heist.heatOnSuccess) ? heist.heatOnSuccess : 3,
    heatOnFailure: Number.isFinite(heist.heatOnFailure) ? heist.heatOnFailure : 8,
  };
};

const normalizeUiTimeLabel = (value) => {
  if (typeof value === "string" && value.includes("T")) {
    return new Date(value).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  }
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  return nowTimeLabel();
};

const normalizeChatFeedEntries = (entries = []) =>
  Array.isArray(entries)
    ? entries.map((entry, index) => ({
        id: entry?.id || `chat-sync-${index}`,
        author: entry?.author || "System",
        text: entry?.text || "",
        time: normalizeUiTimeLabel(entry?.time),
      }))
    : [];

const normalizeOnlineMessageEntry = (entry, index = 0) => ({
  id: entry?.id || `msg-sync-${index}`,
  from: entry?.from || "System",
  subject: entry?.subject || "Powiadomienie",
  preview: entry?.preview || "",
  time: normalizeUiTimeLabel(entry?.time),
});

const normalizeOnlinePlayerEntry = (entry, index = 0) => ({
  id: entry?.id || `player-sync-${index}`,
  name: entry?.name || "Gracz",
  avatarId:
    typeof entry?.avatarId === "string" && entry.avatarId.trim()
      ? entry.avatarId.trim()
      : "ghost",
  avatarCustomUri:
    typeof entry?.avatarCustomUri === "string" && entry.avatarCustomUri.trim()
      ? entry.avatarCustomUri.trim()
      : null,
  gang: entry?.gang || "No gang",
  online: Boolean(entry?.online),
  respect: Number.isFinite(entry?.respect) ? entry.respect : 0,
  cash: Number.isFinite(entry?.cash) ? entry.cash : 0,
  attack: Number.isFinite(entry?.attack) ? entry.attack : 0,
  defense: Number.isFinite(entry?.defense) ? entry.defense : 0,
  dexterity: Number.isFinite(entry?.dexterity) ? entry.dexterity : 0,
  charisma: Number.isFinite(entry?.charisma) ? entry.charisma : 0,
  bounty: Number.isFinite(entry?.bounty) ? entry.bounty : 0,
  criticalCareUntil: Number.isFinite(entry?.criticalCareUntil) ? entry.criticalCareUntil : null,
  criticalProtectionUntil: Number.isFinite(entry?.criticalProtectionUntil) ? entry.criticalProtectionUntil : null,
  heists: Number.isFinite(entry?.heists) ? entry.heists : 0,
  casino: Number.isFinite(entry?.casino) ? entry.casino : 0,
});

const normalizeAdminState = (adminState) => ({
  isAdmin: Boolean(adminState?.isAdmin),
  grantPresets: normalizeAdminGrantPresets(adminState?.grantPresets),
  respectPresets: normalizeAdminGrantPresets(adminState?.respectPresets),
});
const normalizeTargetCooldownMap = (cooldowns, now = Date.now(), { lowercaseKeys = false } = {}) => {
  if (!cooldowns || typeof cooldowns !== "object" || Array.isArray(cooldowns)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(cooldowns)
      .map(([targetKey, until]) => {
        const normalizedKey = lowercaseKeys
          ? String(targetKey || "").trim().toLowerCase()
          : String(targetKey || "").trim();
        return [normalizedKey, Math.max(0, Number(until || 0))];
      })
      .filter(([targetKey, until]) => targetKey && until > now)
  );
};

const normalizeOnlineFriendEntry = (entry) => ({
  id: entry?.id || `friend-${Math.random().toString(36).slice(2, 8)}`,
  name: entry?.name || "Gracz",
  avatarId:
    typeof entry?.avatarId === "string" && entry.avatarId.trim()
      ? entry.avatarId.trim()
      : "ghost",
  avatarCustomUri:
    typeof entry?.avatarCustomUri === "string" && entry.avatarCustomUri.trim()
      ? entry.avatarCustomUri.trim()
      : null,
  gang: entry?.gang || "No gang",
  online: Boolean(entry?.online),
  respect: Number.isFinite(entry?.respect) ? entry.respect : 0,
});

const normalizeGangMemberEntry = (entry, index = 0) => ({
  id: entry?.id || `gang-member-${index}`,
  name: entry?.name || "Gracz",
  role: entry?.role || "Czlonek",
  trusted: Boolean(entry?.trusted),
  respect: Number.isFinite(entry?.respect) ? entry.respect : 0,
  online: Boolean(entry?.online),
});

const normalizeGangDirectoryEntry = (entry, index = 0) => ({
  id: entry?.id || `gang-sync-${index}`,
  name: entry?.name || "Gang",
  boss: entry?.boss || "Boss",
  bossUserId: entry?.bossUserId || null,
  viceBoss: entry?.viceBoss || "-",
  viceBossUserId: entry?.viceBossUserId || null,
  trusted: Number.isFinite(entry?.trusted) ? entry.trusted : 0,
  members: Number.isFinite(entry?.members) ? entry.members : 0,
  respect: Number.isFinite(entry?.respect) ? entry.respect : 0,
  ranking: Number.isFinite(entry?.ranking) ? entry.ranking : index + 1,
  territory: Number.isFinite(entry?.territory) ? entry.territory : 0,
  influence: Number.isFinite(entry?.influence) ? entry.influence : 0,
  vault: Number.isFinite(entry?.vault) ? entry.vault : 0,
  description: entry?.description || "Gang trzyma ekipe i probuje przepchnac wplywy po miescie.",
  inviteRespectMin: Number.isFinite(entry?.inviteRespectMin) ? entry.inviteRespectMin : GANG_INVITE_RESPECT_MIN,
  memberCapLevel: Number.isFinite(entry?.memberCapLevel) ? entry.memberCapLevel : 0,
  maxMembers: Number.isFinite(entry?.maxMembers) ? entry.maxMembers : 8,
  focusDistrictId: entry?.focusDistrictId || "oldtown",
  projects:
    entry?.projects && typeof entry.projects === "object" && !Array.isArray(entry.projects)
      ? { ...entry.projects }
      : {},
  weeklyGoal:
    entry?.weeklyGoal && typeof entry.weeklyGoal === "object" && !Array.isArray(entry.weeklyGoal)
      ? { ...entry.weeklyGoal }
      : null,
  weeklyProgress:
    entry?.weeklyProgress && typeof entry.weeklyProgress === "object" && !Array.isArray(entry.weeklyProgress)
      ? { ...entry.weeklyProgress }
      : {},
  weeklyGoalClaimedAt: Number.isFinite(entry?.weeklyGoalClaimedAt) ? entry.weeklyGoalClaimedAt : null,
  jobBoard: Array.isArray(entry?.jobBoard) ? entry.jobBoard.map((job) => ({ ...job })) : [],
  jobProgress:
    entry?.jobProgress && typeof entry.jobProgress === "object" && !Array.isArray(entry.jobProgress)
      ? { ...entry.jobProgress }
      : {},
  jobRewardedAt:
    entry?.jobRewardedAt && typeof entry.jobRewardedAt === "object" && !Array.isArray(entry.jobRewardedAt)
      ? { ...entry.jobRewardedAt }
      : {},
  activeHeistLobby:
    entry?.activeHeistLobby && typeof entry.activeHeistLobby === "object" && !Array.isArray(entry.activeHeistLobby)
      ? { ...entry.activeHeistLobby }
      : null,
  lastHeistReport:
    entry?.lastHeistReport && typeof entry.lastHeistReport === "object" && !Array.isArray(entry.lastHeistReport)
      ? { ...entry.lastHeistReport }
      : null,
  protectedClub:
    entry?.protectedClub && typeof entry.protectedClub === "object" && !Array.isArray(entry.protectedClub)
      ? { ...entry.protectedClub }
      : null,
  membersList: Array.isArray(entry?.membersList) ? entry.membersList.map(normalizeGangMemberEntry) : [],
  eventLog: Array.isArray(entry?.eventLog) ? normalizeChatFeedEntries(entry.eventLog) : [],
});

const normalizeGangDirectorySnapshot = (entries = []) =>
  Array.isArray(entries) ? entries.map(normalizeGangDirectoryEntry) : [];

const applyGangDirectoryState = (gangState, liveGang) => {
  if (!gangState?.joined || !liveGang || liveGang.name !== gangState.name) {
    return gangState;
  }
  return normalizeGangState({
    ...gangState,
    members: liveGang.members,
    memberCapLevel: liveGang.memberCapLevel ?? gangState.memberCapLevel ?? 0,
    maxMembers: liveGang.maxMembers ?? gangState.maxMembers ?? 8,
    territory: liveGang.territory,
    influence: liveGang.influence,
    vault: liveGang.vault,
    inviteRespectMin: liveGang.inviteRespectMin,
    focusDistrictId: liveGang.focusDistrictId || gangState.focusDistrictId,
    projects:
      liveGang.projects && typeof liveGang.projects === "object" && !Array.isArray(liveGang.projects)
        ? { ...liveGang.projects }
        : gangState.projects,
    weeklyGoal:
      liveGang.weeklyGoal && typeof liveGang.weeklyGoal === "object" && !Array.isArray(liveGang.weeklyGoal)
        ? { ...liveGang.weeklyGoal }
        : gangState.weeklyGoal,
    weeklyProgress:
      liveGang.weeklyProgress && typeof liveGang.weeklyProgress === "object" && !Array.isArray(liveGang.weeklyProgress)
        ? { ...liveGang.weeklyProgress }
        : gangState.weeklyProgress,
    weeklyGoalClaimedAt:
      liveGang.weeklyGoalClaimedAt ?? gangState.weeklyGoalClaimedAt ?? null,
    jobBoard:
      Array.isArray(liveGang.jobBoard) && liveGang.jobBoard.length
        ? liveGang.jobBoard.map((entry) => ({ ...entry }))
        : gangState.jobBoard,
    jobProgress:
      liveGang.jobProgress && typeof liveGang.jobProgress === "object" && !Array.isArray(liveGang.jobProgress)
        ? { ...liveGang.jobProgress }
        : gangState.jobProgress,
    jobRewardedAt:
      liveGang.jobRewardedAt && typeof liveGang.jobRewardedAt === "object" && !Array.isArray(liveGang.jobRewardedAt)
        ? { ...liveGang.jobRewardedAt }
        : gangState.jobRewardedAt,
    activeHeistLobby:
      liveGang.activeHeistLobby && typeof liveGang.activeHeistLobby === "object" && !Array.isArray(liveGang.activeHeistLobby)
        ? { ...liveGang.activeHeistLobby }
        : gangState.activeHeistLobby,
    lastHeistReport:
      liveGang.lastHeistReport && typeof liveGang.lastHeistReport === "object" && !Array.isArray(liveGang.lastHeistReport)
        ? { ...liveGang.lastHeistReport }
        : gangState.lastHeistReport,
    protectedClub:
      liveGang.protectedClub && typeof liveGang.protectedClub === "object" && !Array.isArray(liveGang.protectedClub)
        ? { ...liveGang.protectedClub }
        : gangState.protectedClub,
    membersList: liveGang.membersList?.length ? liveGang.membersList : gangState.membersList,
    chat: liveGang.eventLog?.length ? liveGang.eventLog : gangState.chat,
  });
};

const normalizeRankingsSnapshot = (snapshot) => ({
  byRespect: Array.isArray(snapshot?.byRespect) ? snapshot.byRespect.map(normalizeOnlinePlayerEntry) : [],
  byCash: Array.isArray(snapshot?.byCash) ? snapshot.byCash.map(normalizeOnlinePlayerEntry) : [],
  byHeists: Array.isArray(snapshot?.byHeists) ? snapshot.byHeists.map(normalizeOnlinePlayerEntry) : [],
  byCasino: Array.isArray(snapshot?.byCasino) ? snapshot.byCasino.map(normalizeOnlinePlayerEntry) : [],
});
const formatMoney = (value) => {
  const amount = Number(value || 0);
  const sign = amount < 0 ? "-" : "";
  const absolute = Math.abs(amount);

  const compact = (divisor, suffix) => {
    const scaled = absolute / divisor;
    const decimals = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
    return `${sign}$${Number(scaled.toFixed(decimals)).toString().replace(".", ",")}${suffix}`;
  };

  if (absolute >= 1000000000) return compact(1000000000, "mld");
  if (absolute >= 1000000) return compact(1000000, "mln");
  if (absolute >= 1000) return compact(1000, "tys");
  return `${sign}$${Math.floor(absolute)}`;
};
const formatAccruedMoney = (value) => {
  const amount = Number(value || 0);
  const sign = amount < 0 ? "-" : "";
  const absolute = Math.abs(amount);

  if (absolute >= 1000) {
    return formatMoney(amount);
  }

  if (absolute <= 0) {
    return `${sign}$0`;
  }

  const decimals = absolute >= 100 ? 1 : 2;
  return `${sign}$${absolute.toFixed(decimals).replace(".", ",")}`;
};
const getPassiveCapAmount = (incomePerMinute) => incomePerMinute * PASSIVE_COLLECTION_CAP_MINUTES;

function formatDuration(ms) {
  if (!ms || ms <= 0) return "00:00";
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatLongDuration(ms) {
  if (ms == null) return "Brak";
  if (ms <= 0) return "Cap wbity";
  const totalMinutes = Math.ceil(ms / 60000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatCollectionStamp(ts) {
  if (!ts) return "Jeszcze nie odbierales";
  const date = new Date(ts);
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatCooldown(ms) {
  if (!ms || ms <= 0) return "Gotowe";
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function nowTimeLabel() {
  const date = new Date();
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function normalizeMarketPayload(payload, fallbackMarket, fallbackState, fallbackMeta) {
  if (!payload) {
    return {
      dealerInventory: null,
      market: fallbackMarket,
      marketState: fallbackState,
      marketMeta: fallbackMeta,
    };
  }

  const nextMarketState =
    (payload.marketState && !Array.isArray(payload.marketState) ? payload.marketState : null) ||
    (payload.supply && !Array.isArray(payload.supply) ? payload.supply : null) ||
    fallbackState;

  return {
    dealerInventory:
      payload.dealerInventory && typeof payload.dealerInventory === "object" && !Array.isArray(payload.dealerInventory)
        ? payload.dealerInventory
        : null,
    market: payload.prices || payload.market || fallbackMarket,
    marketState: nextMarketState,
    marketMeta: {
      refreshedAt: payload.refreshedAt || fallbackMeta?.refreshedAt || null,
      sellRate: payload.sellRate ?? fallbackMeta?.sellRate ?? 0.85,
      npcFallbackMarkup: payload.npcFallbackMarkup ?? fallbackMeta?.npcFallbackMarkup ?? 1.16,
      orderRules: payload.orderRules || fallbackMeta?.orderRules || null,
    },
  };
}

function normalizeContractBoardSnapshot(payload, fallbackHistory = []) {
  const fallbackBoard = getActiveContractBoard(Date.now());
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      ...fallbackBoard,
      history: Array.isArray(fallbackHistory) ? fallbackHistory.slice(0, 6) : [],
    };
  }

  const active =
    Array.isArray(payload.active) && payload.active.length
      ? payload.active
          .map((entry) => {
            const contractId = typeof entry === "string" ? entry : entry?.id;
            return getContractById(contractId) || null;
          })
          .filter(Boolean)
      : fallbackBoard.active;

  return {
    refreshedAt: Number.isFinite(payload.refreshedAt) ? payload.refreshedAt : fallbackBoard.refreshedAt,
    nextRefreshAt: Number.isFinite(payload.nextRefreshAt) ? payload.nextRefreshAt : fallbackBoard.nextRefreshAt,
    active,
    history: Array.isArray(payload.history) ? payload.history.slice(0, 6) : Array.isArray(fallbackHistory) ? fallbackHistory.slice(0, 6) : [],
  };
}

function getGangVisual(name) {
  if (!name || name === "No gang") return GANG_VISUALS.default;
  return GANG_VISUALS[name] || GANG_VISUALS.default;
}

function getCollectionTimeToCap(currentAmount, incomePerMinute) {
  if (incomePerMinute <= 0) return null;
  const cap = getPassiveCapAmount(incomePerMinute);
  if (currentAmount >= cap) return 0;
  return ((cap - currentAmount) / incomePerMinute) * 60 * 1000;
}

function getProjectedBusinessCash(collections, incomePerMinute, capAmount, isOnlineAuthority, now = Date.now()) {
  const baseCash = Math.max(0, Number(collections?.businessCash || 0));
  if (!isOnlineAuthority || incomePerMinute <= 0) {
    return baseCash;
  }

  const accruedAt = Number(collections?.businessAccruedAt || 0);
  if (!Number.isFinite(accruedAt) || accruedAt <= 0) {
    return Math.min(baseCash, capAmount);
  }

  const elapsedMs = Math.max(0, now - accruedAt);
  const projectedCash = baseCash + incomePerMinute * (elapsedMs / 60000);
  return Math.min(projectedCash, capAmount);
}

function getProjectedEscortCash(collections, incomePerMinute, capAmount, isOnlineAuthority, now = Date.now()) {
  const baseCash = Math.max(0, Number(collections?.escortCash || 0));
  if (!isOnlineAuthority || incomePerMinute <= 0) {
    return baseCash;
  }

  const accruedAt = Number(collections?.escortAccruedAt || 0);
  if (!Number.isFinite(accruedAt) || accruedAt <= 0) {
    return Math.min(baseCash, capAmount);
  }

  const elapsedMs = Math.max(0, now - accruedAt);
  const projectedCash = baseCash + incomePerMinute * (elapsedMs / 60000);
  return Math.min(projectedCash, capAmount);
}

function isInsideOwnClub(game) {
  return Boolean(game.club.owned && game.club.sourceId && game.club.visitId === game.club.sourceId);
}

function hasFactory(game, factoryId) {
  return (game.factoriesOwned[factoryId] || 0) > 0;
}

function createDrugCounterMap(initialValue = 0) {
  return DRUGS.reduce((acc, item) => {
    acc[item.id] = initialValue;
    return acc;
  }, {});
}

function consumeProducedDrugCounter(map, drugId, quantity = 1) {
  const safeMap = map && typeof map === "object" ? { ...map } : createDrugCounterMap();
  const safeQuantity = Math.max(0, Math.floor(Number(quantity || 0)));
  const available = Math.max(0, Number(safeMap?.[drugId] || 0));
  const consumed = Math.min(available, safeQuantity);
  safeMap[drugId] = Math.max(0, available - consumed);
  return {
    nextMap: safeMap,
    consumed,
  };
}

function createClubListings() {
  return CLUB_MARKET.map((club) => ({
    ...club,
    traffic: 0,
    policePressure: Math.max(0, (club.policeBase || 0) * 3),
    nightPlanId: club.nightPlanId || getClubNightPlan().id,
    securityLevel: 0,
    defenseReadiness: 44,
    threatLevel: 0,
  }));
}

function getGangProfileByName(game, gangName) {
  if (!gangName || gangName === "No gang") return null;
  const liveGang = (game.online?.gangs || []).find((entry) => entry.name === gangName);
  if (liveGang) {
    return {
      ...liveGang,
      self: Boolean(game.gang.joined && game.gang.name === liveGang.name),
    };
  }

  if (game.gang.joined && game.gang.name === gangName) {
    return {
      id: "self-gang",
      name: game.gang.name,
      boss: game.gang.membersList.find((member) => member.role === "Boss")?.name || game.player.name,
      bossUserId: null,
      viceBoss: game.gang.membersList.find((member) => member.role === "Vice Boss")?.name || "-",
      viceBossUserId: null,
      trusted: game.gang.membersList.filter((member) => member.role === "Zaufany").length,
      members: game.gang.members,
      respect: game.player.respect,
      ranking: 0,
      memberCapLevel: game.gang.memberCapLevel || 0,
      maxMembers: game.gang.maxMembers || 8,
      territory: game.gang.territory,
      influence: game.gang.influence,
      vault: game.gang.vault,
      description: "Twoja aktualna organizacja. Tu zarzadzasz ludzmi, zaufaniem i grubymi robotami.",
      inviteRespectMin: game.gang.inviteRespectMin,
      focusDistrictId: game.gang.focusDistrictId,
      projects: { ...(game.gang.projects || {}) },
      weeklyGoal: game.gang.weeklyGoal || null,
      weeklyProgress: { ...(game.gang.weeklyProgress || {}) },
      weeklyGoalClaimedAt: game.gang.weeklyGoalClaimedAt || null,
      jobBoard: Array.isArray(game.gang.jobBoard) ? game.gang.jobBoard.map((entry) => ({ ...entry })) : [],
      jobProgress: { ...(game.gang.jobProgress || {}) },
      jobRewardedAt: { ...(game.gang.jobRewardedAt || {}) },
      activeHeistLobby: game.gang.activeHeistLobby ? { ...game.gang.activeHeistLobby } : null,
      lastHeistReport: game.gang.lastHeistReport ? { ...game.gang.lastHeistReport } : null,
      protectedClub: game.gang.protectedClub ? { ...game.gang.protectedClub } : null,
      membersList: game.gang.membersList,
      eventLog: normalizeChatFeedEntries(game.gang.chat || []),
      self: true,
    };
  }

  return null;
}

function syncClubListing(listings, club, ownerLabel) {
  if (!club.sourceId) return listings;

  const updated = listings.map((listing) =>
    listing.id === club.sourceId
      ? {
          ...listing,
          ownerLabel,
          popularity: club.popularity,
          mood: club.mood,
          policeBase: club.policeBase,
          policePressure: club.policePressure,
          traffic: club.traffic,
          nightPlanId: club.nightPlanId,
          districtId: club.districtId || listing.districtId || null,
          securityLevel: club.securityLevel,
          defenseReadiness: club.defenseReadiness,
          threatLevel: club.threatLevel,
        }
      : listing
  );

  const exists = updated.some((listing) => listing.id === club.sourceId);
  if (exists) return updated;

  return [
    {
      id: club.sourceId,
      name: club.name,
      ownerLabel,
      respect: club.respect || 0,
      takeoverCost: club.takeoverCost || CLUB_FOUNDING_CASH_COST,
      popularity: club.popularity,
      mood: club.mood,
      policeBase: club.policeBase,
      policePressure: club.policePressure,
      traffic: club.traffic,
      nightPlanId: club.nightPlanId,
      districtId: club.districtId || null,
      securityLevel: club.securityLevel,
      defenseReadiness: club.defenseReadiness,
      threatLevel: club.threatLevel,
      note: club.note || "Prywatny lokal postawiony na grubej kasie i ryzyku.",
    },
    ...updated,
  ];
}

function normalizeClubListingsSnapshot(listings) {
  const baseListings = createClubListings();
  const baseById = new Map(baseListings.map((listing) => [String(listing.id), listing]));
  const dynamicById = new Map();

  if (Array.isArray(listings)) {
    listings.forEach((entry) => {
      if (!entry || typeof entry !== "object") return;
      const id = String(entry.id || "").trim();
      if (!id) return;
      const base = baseById.get(id) || {};
      dynamicById.set(id, {
        ...base,
        ...entry,
        id,
        traffic: Math.max(0, Number(entry.traffic ?? base.traffic ?? 0)),
        policePressure: Math.max(0, Number(entry.policePressure ?? base.policePressure ?? 0)),
        nightPlanId: entry.nightPlanId || base.nightPlanId || getClubNightPlan().id,
        securityLevel: Math.max(0, Number(entry.securityLevel ?? base.securityLevel ?? 0)),
        defenseReadiness: Math.max(0, Number(entry.defenseReadiness ?? base.defenseReadiness ?? 44)),
        threatLevel: Math.max(0, Number(entry.threatLevel ?? base.threatLevel ?? 0)),
      });
    });
  }

  const mergedStatic = baseListings.map((listing) => dynamicById.get(String(listing.id)) || listing);
  const extraListings = [...dynamicById.values()].filter(
    (listing) => !baseById.has(String(listing.id))
  );

  return [...mergedStatic, ...extraListings];
}

function getCurrentClubVenue(game) {
  if (!game.club.visitId) return null;

  const listedVenue = game.clubListings.find((listing) => listing.id === game.club.visitId);
  if (listedVenue) return listedVenue;

  if (game.club.owned && game.club.sourceId === game.club.visitId) {
    return {
      id: game.club.sourceId,
      name: game.club.name,
      ownerLabel: game.club.ownerLabel,
      respect: game.club.respect || 0,
      popularity: game.club.popularity,
      mood: game.club.mood,
      policeBase: game.club.policeBase,
      policePressure: game.club.policePressure,
      traffic: game.club.traffic,
      nightPlanId: game.club.nightPlanId,
      entryFee: game.club.entryFee,
      safeCash: game.club.safeCash,
      lastReportSummary: game.club.lastReportSummary || game.club.lastNightSummary || null,
      stash: { ...(game.club.stash || {}) },
      districtId: game.club.districtId || null,
      securityLevel: game.club.securityLevel,
      defenseReadiness: game.club.defenseReadiness,
      threatLevel: game.club.threatLevel,
      protectorGangName:
        game.gang?.joined && String(game.gang?.role || "").trim() === "Boss" ? game.gang.name || null : null,
      protectorFocusDistrictId:
        game.gang?.joined && String(game.gang?.role || "").trim() === "Boss" ? game.gang.focusDistrictId || null : null,
      protectorEffects:
        game.gang?.joined && String(game.gang?.role || "").trim() === "Boss"
          ? getGangProjectEffects(game.gang)
          : null,
      note: game.club.note,
    };
  }
  return null;
}

function getClubVenueProfile(game, venue) {
  if (!venue) {
    return {
      plan: getClubNightPlan(),
      prestige: 0,
      scoutTipValue: 0,
      huntProgressValue: 0,
      layLowHeat: 0,
      layLowHp: 0,
      trafficScale: 0,
      pressureScale: 0,
      nightIncomeFactor: 0.22,
      label: "Poza lokalem",
    };
  }

  const planId =
    game?.club?.owned && game?.club?.sourceId === venue.id
      ? game.club.nightPlanId
      : venue?.nightPlanId;

  return getSharedClubVenueProfile(venue, { planId });
}

function getDrugPoliceProfile(drug) {
  return getSharedDrugPoliceProfile(drug);
}

function getClubPoliceProfile(game) {
  if (!game.club.owned) {
    return { pressure: 0, raidChance: 0, totalUnits: 0, traffic: 0, trafficLabel: "Brak lokalu", label: "Brak lokalu" };
  }

  const referenceAt = Math.max(0, game.club.lastTrafficAt || game.club.lastRunAt || Date.now());
  const elapsedMs = Math.max(0, Date.now() - referenceAt);
  const decayedTraffic = getClubTrafficAfterDecay(game.club.traffic, elapsedMs);
  const decayedPressure = getClubPressureAfterDecay(game.club.policePressure, elapsedMs);
  const totalUnits = DRUGS.reduce((sum, drug) => sum + (game.club.stash[drug.id] || 0), 0);
  const stashSignal = DRUGS.reduce((sum, drug) => {
    const police = getDrugPoliceProfile(drug);
    return sum + (game.club.stash[drug.id] || 0) * (drug.streetPrice / 220 + police.risk * 12);
  }, 0);
  const pressure = clamp(
    game.club.policeBase * 3 +
      decayedPressure +
      decayedTraffic * 1.7 +
      totalUnits * 1.5 +
      stashSignal / 20 +
      game.club.popularity * 0.32 +
      game.player.heat * 0.42,
    0,
    100
  );
  const raidChance = clamp(0.05 + pressure / 240 + decayedTraffic / 120, 0.05, 0.46);
  const label = getClubPressureLabel(pressure);

  return {
    pressure,
    raidChance,
    totalUnits,
    traffic: decayedTraffic,
    trafficLabel: getClubTrafficLabel(decayedTraffic),
    label,
  };
}

function syncClubRuntimeState(club, now = Date.now()) {
  if (!club || typeof club !== "object") return club;
  const referenceAt = Math.max(0, club.lastTrafficAt || club.lastRunAt || now);
  const elapsedMs = Math.max(0, now - referenceAt);
  return {
    ...club,
    traffic: getClubTrafficAfterDecay(club.traffic, elapsedMs),
    policePressure: getClubPressureAfterDecay(club.policePressure, elapsedMs),
    lastTrafficAt: now,
  };
}

function getSoloHeistOdds(player, effectivePlayer, gang, heist, activeBoosts = []) {
  const arenaModifiers = getArenaActionModifiers(activeBoosts, "heist");
  const playerPower = effectivePlayer.attack * 1.25 + effectivePlayer.defense * 0.85 + effectivePlayer.dexterity * 1.5 + player.respect * 0.45;
  const heistDifficulty = heist.respect * 1.75 + heist.energy * 4 + heist.risk * 55;
  const chance = clamp(
    0.42 +
      (playerPower - heistDifficulty) / 115 +
      gang.members * 0.0025 +
      Number(arenaModifiers.heistSuccessBonus || 0) -
      player.heat * 0.0025,
    0.05,
    0.92
  );
  const jailChance = clamp(heist.risk * 0.8 + player.heat * 0.005 - effectivePlayer.defense * 0.006 - effectivePlayer.dexterity * 0.004, 0.08, 0.68);

  return { chance, jailChance };
}

function ProgressBar({ progress }) {
  return (
    <View style={styles.progressBar}>
      <View style={[styles.progressFill, { width: `${Math.max(4, Math.round(progress * 100))}%` }]} />
    </View>
  );
}

function ProgressDots({ progress }) {
  const filled = clamp(Math.ceil(progress * 4), 0, 4);
  return (
    <View style={styles.dotRow}>
      {[0, 1, 2, 3].map((dot) => (
        <View key={dot} style={[styles.progressDot, dot < filled && styles.progressDotActive]} />
      ))}
    </View>
  );
}

function HeaderStat({ label, value }) {
  return (
    <View style={styles.headerStat}>
      <Text style={styles.headerStatLabel}>{label}</Text>
      <Text style={styles.headerStatValue}>{value}</Text>
    </View>
  );
}

function MiniBadge({ visual, large }) {
  const safeVisual = visual || SYSTEM_VISUALS.market;
  return (
    <LinearGradient colors={safeVisual.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.miniBadge, large && styles.miniBadgeLarge]}>
      {safeVisual.image ? (
        <>
          <Image source={safeVisual.image} style={styles.miniBadgeImage} resizeMode="cover" />
          <LinearGradient colors={["rgba(0,0,0,0.08)", "rgba(0,0,0,0.34)", "rgba(0,0,0,0.72)"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.miniBadgeTint} />
        </>
      ) : (
        <Text style={styles.miniBadgeEmoji}>{safeVisual.emoji || safeVisual.code}</Text>
      )}
    </LinearGradient>
  );
}

function StatLine({ label, value, visual }) {
  return (
    <View style={styles.statLine}>
      <View style={styles.statLineLabelWrap}>
        {visual ? <MiniBadge visual={visual} /> : null}
        <Text style={styles.statLineLabel}>{label}</Text>
      </View>
      <Text style={styles.statLineValue}>{value}</Text>
    </View>
  );
}

function ActionTile({ title, subtitle, onPress, disabled, danger, visual }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.actionTile,
        danger && styles.actionTileDanger,
        disabled && styles.tileDisabled,
        pressed && !disabled && styles.actionTilePressed,
      ]}
    >
      <LinearGradient
        colors={danger ? ["#2b1517", "#161113"] : ["#191c23", "#101218"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.actionTileGradient}
      >
        <View style={styles.actionTileHeader}>
          {visual ? (
            <View style={styles.actionTileVisualWrap}>
              <View style={styles.actionTileVisualGlow} />
              <MiniBadge visual={visual} large />
            </View>
          ) : null}
          <View style={styles.flexOne}>
            <Text style={styles.actionTileTitle}>{title}</Text>
            <Text style={styles.actionTileSubtitle}>{subtitle}</Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderAccent} />
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function Tag({ text, warning }) {
  return (
    <View style={[styles.tag, warning ? styles.tagWarning : styles.tagPositive]}>
      <Text style={[styles.tagText, warning ? styles.tagTextWarning : styles.tagTextPositive]}>{text}</Text>
    </View>
  );
}

function SceneArtwork({ eyebrow, title, lines, accent = ["#3a2919", "#120d09", "#050505"], source }) {
  const summaryLine = Array.isArray(lines) && lines.length ? lines[0] : null;
  return (
    <View style={styles.sceneArtwork}>
      {source ? (
        <ImageBackground source={source} style={styles.sceneArtworkBackdrop} imageStyle={styles.sceneArtworkImage} />
      ) : (
        <LinearGradient colors={accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sceneArtworkBackdrop} />
      )}
      <LinearGradient colors={["rgba(0,0,0,0.12)", "rgba(0,0,0,0.56)", "rgba(0,0,0,0.9)"]} start={{ x: 0.2, y: 0 }} end={{ x: 0.7, y: 1 }} style={styles.sceneArtworkTint} />
      <View style={styles.sceneCopy}>
        {eyebrow ? <Text style={styles.sceneEyebrow} numberOfLines={1}>{eyebrow}</Text> : null}
        <Text style={styles.sceneTitle} numberOfLines={1}>
          {title}
        </Text>
        {summaryLine ? (
          <Text style={styles.sceneLine} numberOfLines={1}>
            {summaryLine}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function PlayingCard({ card, hidden }) {
  const suit = card.value >= 10 ? "\u2660" : "\u2665";
  return (
    <View style={[styles.playingCard, hidden && styles.playingCardBack]}>
      {hidden ? (
        <Text style={styles.playingCardBackText}>HC</Text>
      ) : (
        <>
          <Text style={styles.playingCardRank}>{card.label}</Text>
          <Text style={styles.playingCardSuit}>{suit}</Text>
          <Text style={styles.playingCardValue}>{card.value}</Text>
        </>
      )}
    </View>
  );
}

function EntityBadge({ visual, large }) {
  const safeVisual = visual || { icon: "shield-outline", code: "HC", colors: ["#3a3a3a", "#111111"] };
  return (
    <LinearGradient colors={safeVisual.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.entityBadge, large && styles.entityBadgeLarge]}>
      <View style={styles.entityBadgeGlow} />
      {safeVisual.image ? (
        <>
          <Image
            source={safeVisual.image}
            style={[styles.entityImage, safeVisual.imageStyle]}
            resizeMode={safeVisual.imageResizeMode || "cover"}
          />
          <LinearGradient colors={["rgba(0,0,0,0.04)", "rgba(0,0,0,0.22)", "rgba(0,0,0,0.76)"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.entityImageTint} />
        </>
      ) : (
        <View style={styles.entityEmojiWrap}>
          {safeVisual.icon ? (
            <MaterialCommunityIcons name={safeVisual.icon} size={large ? 30 : 24} color="#f0c75a" />
          ) : (
            <Text style={[styles.entityEmoji, large && styles.entityEmojiLarge]}>{safeVisual.emoji || "•"}</Text>
          )}
        </View>
      )}
      <View style={styles.entityCodePill}>
        <Text style={styles.entityCode}>{safeVisual.code}</Text>
      </View>
    </LinearGradient>
  );
}

function getPlayerAvatarVisual(playerEntry) {
  const avatarCustomUri =
    typeof playerEntry?.avatarCustomUri === "string" && playerEntry.avatarCustomUri.trim()
      ? playerEntry.avatarCustomUri.trim()
      : null;

  if (avatarCustomUri) {
    return {
      code: "AV",
      colors: ["#3d3f45", "#101114"],
      image: { uri: avatarCustomUri },
      imageResizeMode: "contain",
      imageStyle: styles.entityAvatarImage,
    };
  }

  const avatar = getAvatarById(playerEntry?.avatarId, AVATAR_OPTIONS);
  return {
    ...avatar,
    code: avatar?.sigil || avatar?.code || "AV",
    imageResizeMode: "contain",
    imageStyle: styles.entityAvatarImage,
  };
}

function getExplicitNoticeTone(message) {
  if (/zlapany|cela|wiezieni|wtopa|spalony|nie wyszedl|przegral|nalot|przedawk/i.test(message)) {
    return "failure";
  }
  return "warning";
}

function getExplicitNoticeTitle(message, tone) {
  if (tone === "failure") {
    if (/zlapany|cela|wiezieni/i.test(message)) return "ZLAPANY";
    if (/napad|robota|akcja/i.test(message)) return "AKCJA NIE SIADLA";
    if (/nalot/i.test(message)) return "NALOT";
    return "WSTRZAS";
  }
  if (/heat|gliny|polic/i.test(message)) return "HEAT WZRASTA";
  if (/ryzyko|uwaga|ostroz/i.test(message)) return "RYZYKO";
  return "UWAGA";
}

function inferFeedbackNotice(message, deltas = {}) {
  const normalized = message || "";
  const cashDelta = deltas.cash || 0;
  const hpDelta = deltas.hp || 0;
  const heatDelta = deltas.heat || 0;
  const respectDelta = deltas.respect || 0;
  const changeParts = [];
  let tone = "warning";
  let title = "AKCJA";

  if (/udany|zgarniasz|wpada|wygrywasz|zarobiles|odbierasz|zgarnac|rozkladasz/i.test(normalized) || cashDelta > 0) {
    tone = "success";
  }
  if (/zlapany|cela|wiezieni|wtopa|spalony|nie wyszedl|przegral|nalot|przedawk|obrywasz/i.test(normalized) || hpDelta < 0) {
    tone = "failure";
  }
  if (tone !== "failure" && (/heat|gliny|polic|ryzyko|ostroz/i.test(normalized) || heatDelta > 0)) {
    tone = "warning";
  }

  if (tone === "success") {
    if (/napad|robota|akcja/i.test(normalized)) title = "UDANY NAPAD";
    else if (cashDelta > 0) title = "ZAROBILES";
    else if (/odbierasz|zgarnac/i.test(normalized)) title = "ODBIERASZ HAJS";
    else title = "SIADLO";
  } else if (tone === "failure") {
    if (/zlapany|cela|wiezieni/i.test(normalized)) title = "ZLAPANY";
    else if (/napad|robota|akcja/i.test(normalized)) title = "NAPAD SPALONY";
    else if (/nalot/i.test(normalized)) title = "NALOT";
    else title = "WSTRZAS";
  } else if (heatDelta > 0 || /heat|gliny|polic/i.test(normalized)) {
    title = "HEAT WZRASTA";
  } else {
    title = "RYZYKO";
  }

  if (cashDelta > 0) changeParts.push(`Zarobiles ${formatMoney(cashDelta)}`);
  if (cashDelta < 0) changeParts.push(`Strata ${formatMoney(Math.abs(cashDelta))}`);
  if (hpDelta > 0) changeParts.push(`HP +${hpDelta}`);
  if (hpDelta < 0) changeParts.push(`HP -${Math.abs(hpDelta)}`);
  if (heatDelta > 0) changeParts.push(`Heat +${heatDelta}`);
  if (heatDelta < 0) changeParts.push(`Heat ${heatDelta}`);
  if (respectDelta > 0) changeParts.push(`Szacun +${respectDelta}`);

  return {
    tone,
    title,
    message: changeParts.length ? `${normalized} ${changeParts.join(" · ")}`.trim() : normalized,
    deltas,
  };
}

function buildGymExerciseNotice(exercise, summary = null) {
  const gains = summary?.totalGains || exercise?.gains || {};
  const gainParts = [];
  const repetitions = Math.max(1, Math.floor(Number(summary?.repetitions || 1)));
  const energySpent = Number.isFinite(summary?.energySpent)
    ? Number(summary.energySpent)
    : Number(exercise?.costEnergy || 0);

  if (Number(gains.attack || 0) > 0) gainParts.push(`Atak +${gains.attack}`);
  if (Number(gains.defense || 0) > 0) gainParts.push(`Obrona +${gains.defense}`);
  if (Number(gains.dexterity || 0) > 0) gainParts.push(`Zrecznosc +${gains.dexterity}`);
  if (Number(gains.maxHp || 0) > 0) gainParts.push(`Zdrowie max +${gains.maxHp}`);
  if (Number(gains.hp || 0) > 0) gainParts.push(`HP +${gains.hp}`);
  if (energySpent > 0) gainParts.push(`Energia -${energySpent}`);

  return {
    tone: "success",
    title: repetitions > 1 ? `TRENING x${repetitions}` : "TRENING ZALICZONY",
    message: gainParts.length
      ? `${exercise?.name || "Trening"}. Zysk: ${gainParts.join(" · ")}.`
      : `${exercise?.name || "Trening"} zaliczony.`,
    deltas: null,
    allowWhileQuickAction: true,
  };
}

function StartupFallbackScreen({ title, message, details }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="light" />
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingTitle}>{title || "Hustle City"}</Text>
        <Text style={styles.loadingText}>{message || "Aplikacja odpala minimalny ekran awaryjny."}</Text>
        {details ? <Text style={styles.loadingDetails}>{details}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

class AppStartupBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || "Render aplikacji wysypal sie na starcie.",
    };
  }

  componentDidCatch(error) {
    console.error("Startup render crash", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <StartupFallbackScreen
          title="Hustle City"
          message="Start aplikacji nie doszedl do glownego ekranu, ale appka nie padla calkiem."
          details={this.state.errorMessage}
        />
      );
    }

    return this.props.children;
  }
}

function AppRuntime() {
  const [game, setGame] = useState(INITIAL);
  const [tab, setTab] = useState("heists");
  const [isHubActive, setIsHubActive] = useState(true);
  const [sectionByTab, setSectionByTab] = useState(DEFAULT_SECTIONS);
  const [sessionToken, setSessionToken] = useState(null);
  const [apiStatus, setApiStatus] = useState("offline");
  const gameMode = getGameMode({ sessionToken, apiStatus });
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [startupError, setStartupError] = useState("");
  const [gangMessage, setGangMessage] = useState("");
  const [prisonMessage, setPrisonMessage] = useState("");
  const [cityMessage, setCityMessage] = useState("");
  const [directMessageDraft, setDirectMessageDraft] = useState("");
  const [directMessageRecipient, setDirectMessageRecipient] = useState(null);
  const [gangDraftName, setGangDraftName] = useState("Night Reign");
  const [gangHeistNoteDraft, setGangHeistNoteDraft] = useState("");
  const [bankAmountDraft, setBankAmountDraft] = useState("1000");
  const [bankRecentTransfers, setBankRecentTransfers] = useState([]);
  const [bankFeedback, setBankFeedback] = useState(null);
  const [mealFeedback, setMealFeedback] = useState(null);
  const [dealerTradeDraft, setDealerTradeDraft] = useState("1");
  const [notice, setNotice] = useState(null);
  const [quickActionModal, setQuickActionModal] = useState(null);
const [adminDeleteBusyLogin, setAdminDeleteBusyLogin] = useState("");
const [gangSettingsBusy, setGangSettingsBusy] = useState(false);
const [gangRoleBusyMemberId, setGangRoleBusyMemberId] = useState("");
const [rankingCategory, setRankingCategory] = useState("respect");
  const noticeOpacity = useRef(new Animated.Value(0)).current;
  const noticeTranslateY = useRef(new Animated.Value(-12)).current;
  const previousGameRef = useRef(INITIAL);
  const pageScrollRef = useRef(null);
  const didHydrateFeedbackRef = useRef(false);
  const lastExplicitNoticeAtRef = useRef(0);
  const handledNoticeLogsRef = useRef(new Map());
  const didHydrateSessionRef = useRef(false);
  const realtimeClientRef = useRef(null);
  const realtimeEventHandlerRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const gameSnapshotRef = useRef(INITIAL);
  const uiSnapshotRef = useRef({ tab: "heists", activeSectionId: "solo" });
  const previousCriticalCareStateRef = useRef({ active: false, protected: false });
  const [gangProfileView, setGangProfileView] = useState("actions");
  const [casinoState, setCasinoState] = useState(createInitialCasinoState);
  const [gangRaidPreviewState, setGangRaidPreviewState] = useState({
    gangName: "",
    loading: false,
    preview: null,
  });
  const { width } = useWindowDimensions();
  const isCompact = width < 1080;
  const isPhone = width < 760;
  const avatarOptions = useMemo(() => {
    if (!game.player.avatarCustomUri) return AVATAR_OPTIONS;
    return [
      ...AVATAR_OPTIONS,
      {
        id: "custom",
        name: "Twoje foto",
        sigil: "TY",
        colors: ["#3d3f45", "#101114"],
        image: { uri: game.player.avatarCustomUri },
      },
    ];
  }, [game.player.avatarCustomUri]);

  const activeTab = TAB_DEFINITIONS.find((entry) => entry.id === tab) ?? TAB_DEFINITIONS[0];
  const requestedSectionId = sectionByTab[tab] || activeTab.sections[0].id;
  const activeSection =
    activeTab.sections.find((entry) => entry.id === requestedSectionId) || activeTab.sections[0];
  const activeSectionId = activeSection.id;
  const visibleSections = activeTab.sections.filter((entry) => !entry.hidden);
  sessionTokenRef.current = sessionToken;
  gameSnapshotRef.current = game;
  uiSnapshotRef.current = { tab, activeSectionId };

  const trimHandledNoticeLogs = (now = Date.now()) => {
    handledNoticeLogsRef.current.forEach((handledAt, entry) => {
      if (now - handledAt > 120000) handledNoticeLogsRef.current.delete(entry);
    });
  };

  const markNoticeLogHandled = (entry) => {
    if (!entry) return;
    const now = Date.now();
    trimHandledNoticeLogs(now);
    handledNoticeLogsRef.current.set(entry, now);
  };

  const wasNoticeLogHandledRecently = (entry) => {
    if (!entry) return false;
    const now = Date.now();
    trimHandledNoticeLogs(now);
    return handledNoticeLogsRef.current.has(entry);
  };

  const { respectInfo, effectivePlayer, activeAvatar, clubOwnerLabel, escortBaseFindChance } = usePlayerState({
    game,
    avatars: avatarOptions,
  });
  const clubPolice = useMemo(() => getClubPoliceProfile(game), [game]);
  const currentClubVenue = useMemo(() => getCurrentClubVenue(game), [game]);
  const insideOwnClub = useMemo(() => isInsideOwnClub(game), [game]);
  const currentClubProfile = useMemo(() => getClubVenueProfile(game, currentClubVenue), [game, currentClubVenue]);
  const selectedWorldPlayer = useMemo(
    () => game.online?.roster.find((player) => player.id === game.online.selectedPlayerId) || null,
    [game.online]
  );
  const selectedGangProfile = useMemo(() => {
    if (!game.online?.selectedGangId) return null;
    return getGangProfileByName(game, game.online.selectedGangId);
  }, [game]);
  const selectedGangRaidPreview =
    selectedGangProfile?.name && gangRaidPreviewState.gangName === selectedGangProfile.name
      ? gangRaidPreviewState.preview
      : null;
  const selectedGangRaidPreviewLines = useMemo(
    () => getGangRaidPreviewLines(selectedGangRaidPreview),
    [selectedGangRaidPreview]
  );
  const selectedGangRaidBlocked = Boolean(
    hasOnlineAuthority &&
      selectedGangRaidPreview?.attackerState &&
      selectedGangRaidPreview.attackerState.canAttack === false
  );
  const gangInviteTargets = useMemo(
    () =>
      (game.online?.roster || []).filter(
        (player) =>
          player.gang === "No gang" &&
          player.respect >= game.gang.inviteRespectMin &&
          player.name !== game.player.name
      ),
    [game.online, game.gang.inviteRespectMin, game.player.name]
  );
  const selfGangMember = useMemo(() => {
    if (!game.gang.joined) return null;
    const selfName = String(game.player.name || "").trim().toLowerCase();
    const fromList = (game.gang.membersList || []).find(
      (member) =>
        (game.player.id && member?.id === game.player.id) ||
        String(member?.name || "").trim().toLowerCase() === selfName
    );
    if (fromList) return fromList;
    return {
      id: game.player.id || `self-gang-${selfName || "member"}`,
      name: game.player.name,
      role: game.gang.role || "Czlonek",
      trusted: game.gang.role === "Zaufany" || game.gang.role === "Vice Boss" || game.gang.role === "Boss",
      respect: game.player.respect,
      online: true,
    };
  }, [game.gang.joined, game.gang.membersList, game.gang.role, game.player.id, game.player.name, game.player.respect]);
  const activeGangHeistLobby = game.gang.activeHeistLobby || null;
  const activeGangHeistDefinition = useMemo(
    () => (activeGangHeistLobby?.heistId ? getGangHeistById(activeGangHeistLobby.heistId) : null),
    [activeGangHeistLobby]
  );
  const activeGangHeistParticipants = useMemo(() => {
    if (!activeGangHeistLobby) return [];
    const memberMap = new Map();
    [...(game.gang.membersList || []), ...(selfGangMember ? [selfGangMember] : [])].forEach((member) => {
      if (member?.id && !memberMap.has(member.id)) {
        memberMap.set(member.id, member);
      }
    });
    return (Array.isArray(activeGangHeistLobby.participantIds) ? activeGangHeistLobby.participantIds : [])
      .map((participantId) => {
        const member = memberMap.get(participantId);
        return (
          member || {
            id: participantId,
            name: "Czlonek ekipy",
            role: "Czlonek",
            trusted: false,
            respect: 0,
            online: false,
          }
        );
      })
      .slice(0, 25);
  }, [activeGangHeistLobby, game.gang.membersList, selfGangMember]);
  const isInActiveGangHeistLobby = useMemo(() => {
    if (!activeGangHeistLobby || !selfGangMember?.id) return false;
    return (Array.isArray(activeGangHeistLobby.participantIds) ? activeGangHeistLobby.participantIds : []).includes(selfGangMember.id);
  }, [activeGangHeistLobby, selfGangMember]);
  const nextGangMemberCapUpgrade = useMemo(
    () => getGangMemberCapUpgrade(game.gang.memberCapLevel),
    [game.gang.memberCapLevel]
  );
  const activeGangJobBoardProgress = useMemo(
    () => getActiveGangJobBoardProgress(game.gang),
    [game.gang]
  );
  const protectedGangDistrict = useMemo(
    () => (game.gang.protectedClub?.districtId ? findDistrictById(game.city, game.gang.protectedClub.districtId) : null),
    [game.city, game.gang.protectedClub]
  );
  const pendingGangRescue = useMemo(() => {
    const report = game.gang.lastHeistReport;
    if (!report || report.success || report.rescueAttemptedAt) return null;
    if (!Array.isArray(report.jailedParticipantIds) || !report.jailedParticipantIds.length) return null;
    return report;
  }, [game.gang.lastHeistReport]);
  const pendingGangRescueMembers = useMemo(
    () => (pendingGangRescue?.participants || []).filter((participant) => participant?.jailed),
    [pendingGangRescue]
  );
  const jailRemaining = game.player.jailUntil ? Math.max(0, game.player.jailUntil - Date.now()) : 0;
  const criticalCareStatus = useMemo(() => getCriticalCareStatus(game.player), [game.player]);
  const publicCriticalCareMode = useMemo(() => getCriticalCareMode(CRITICAL_CARE_RULES.public.id), []);
  const privateCriticalCareMode = useMemo(() => getCriticalCareMode(CRITICAL_CARE_RULES.private.id), []);
  const taskBoard = useMemo(
    () => getSharedTaskBoard(game, { mode: gameMode }),
    [game, gameMode]
  );
  const activeTaskStates = taskBoard.visibleTasks;
  const topTask =
    activeTaskStates.find((task) => !task.onlineDisabled) ||
    activeTaskStates[0] ||
    null;
  const visibleGangGoalProgress = useMemo(() => {
    const progress = getGangWeeklyProgress(game.gang);
    return progress.claimed ? null : progress;
  }, [game.gang]);
  const nextHeistTier = getNextHeistTier(game.player.respect);
  const heistCatalog =
    Array.isArray(game.online?.heists) && game.online.heists.length
      ? game.online.heists.map(normalizeHeistDefinition).filter(Boolean)
      : HEISTS.map(normalizeHeistDefinition).filter(Boolean);
  const inGang = Boolean(game.gang.joined);
  const gangTributeRemaining = Math.max(0, GANG_TRIBUTE_COOLDOWN_MS - (Date.now() - (game.gang.lastTributeAt || 0)));
  const selectedWorldPlayerAttackCooldownRemaining = Math.max(
    0,
    Number(
      selectedWorldPlayer?.id
        ? game.cooldowns?.playerAttackTargets?.[selectedWorldPlayer.id] || 0
        : 0
    ) - Date.now()
  );
  const selectedWorldPlayerCriticalCareRemaining = Math.max(
    0,
    Number(selectedWorldPlayer?.criticalCareUntil || 0) - Date.now()
  );
  const selectedWorldPlayerProtectionRemaining = Math.max(
    0,
    Number(selectedWorldPlayer?.criticalProtectionUntil || 0) - Date.now()
  );
  const crewLockdownRemaining = Math.max(0, (game.gang.crewLockdownUntil || 0) - Date.now());
  const districtSummaries = useMemo(() => getDistrictSummaries(game.city), [game.city]);
  const focusDistrictSummary = useMemo(
    () => getDistrictModifierSummary(game.city, game.gang.focusDistrictId || game.city.focusDistrictId),
    [game.city, game.gang.focusDistrictId]
  );
  const hottestDistrictSummary = useMemo(
    () =>
      [...districtSummaries].sort((left, right) => {
        if (right.pressure !== left.pressure) return right.pressure - left.pressure;
        return right.influence - left.influence;
      })[0] || districtSummaries[0],
    [districtSummaries]
  );
  const activeOperation = game.operations?.active || null;
  const activeOperationStage = getActiveOperationStage(activeOperation);
  const activeOperationChoices = activeOperationStage ? getOperationChoicesForStage(activeOperationStage) : [];
  const availableOperations = useMemo(
    () => OPERATION_CATALOG.filter((operation) => game.player.respect >= operation.respect),
    [game.player.respect]
  );
  const gangGoalProgress = useMemo(() => getGangWeeklyProgress(game.gang), [game.gang]);
  const gangProjectEffects = useMemo(() => getGangProjectEffects(game.gang), [game.gang]);
  const focusDistrictEffectLines = useMemo(
    () => getDistrictEffectLines(focusDistrictSummary, { focused: true, gangEffects: gangProjectEffects }),
    [focusDistrictSummary, gangProjectEffects]
  );
  const gangEffectLines = useMemo(
    () => getGangEffectLines(gangProjectEffects, focusDistrictSummary),
    [gangProjectEffects, focusDistrictSummary]
  );
  const adminState = useMemo(
    () => normalizeAdminState({
      isAdmin: game.player.isAdmin,
      grantPresets: game.player.adminGrantPresets,
      respectPresets: game.player.adminRespectPresets,
    }),
    [game.player.isAdmin, game.player.adminGrantPresets, game.player.adminRespectPresets]
  );
  const hasOnlineAuthority = Boolean(sessionToken && apiStatus === "online");
  const contractState = useMemo(() => normalizeContractState(game.contracts), [game.contracts]);
  const contractBoard = useMemo(() => {
    const normalizedBoard = normalizeContractBoardSnapshot(game.contractBoard, contractState.history);
    if (!hasOnlineAuthority && Number(normalizedBoard.nextRefreshAt || 0) <= Date.now()) {
      return normalizeContractBoardSnapshot(null, contractState.history);
    }
    return {
      ...normalizedBoard,
      history:
        Array.isArray(normalizedBoard.history) && normalizedBoard.history.length
          ? normalizedBoard.history
          : contractState.history.slice(0, 6),
    };
  }, [game.contractBoard, contractState.history, game.lastTick, hasOnlineAuthority]);
  const contractHistory = useMemo(
    () =>
      Array.isArray(contractBoard.history) && contractBoard.history.length
        ? contractBoard.history
        : contractState.history.slice(0, 6),
    [contractBoard.history, contractState.history]
  );
  const contractLoadoutSummaryLines = useMemo(
    () => getContractLoadoutSummaryLines(contractState),
    [contractState]
  );
  const ownedContractItems = useMemo(() => getOwnedContractItems(contractState), [contractState]);
  const ownedContractCars = useMemo(() => getOwnedContractCars(contractState), [contractState]);
  const getContractPreviewForContract = (contract) =>
    getContractOutcomePreview({
      contract,
      profile: effectivePlayer,
      contractState,
      activeBoosts: game.activeBoosts,
      districtSummary: districtSummaries.find((entry) => entry.id === contract?.districtId) || null,
    });
  const getContractPreviewLinesForContract = (contract) => {
    const preview = getContractPreviewForContract(contract);
    const districtSummary = districtSummaries.find((entry) => entry.id === contract?.districtId) || null;
    return getContractPreviewLines({ contract, preview, districtSummary });
  };

  const mergeServerUser = (serverUser, marketPayload) => {
    const safeProfile = serverUser?.profile;
    if (!safeProfile) {
      throw new Error("Backend zwrocil niepelny profil gracza.");
    }
    const hasProfileField = (field) => Object.prototype.hasOwnProperty.call(safeProfile, field);
    const nextFriends = Array.isArray(serverUser?.online?.friends)
      ? serverUser.online.friends.map(normalizeOnlineFriendEntry)
      : null;
    const nextMessages = Array.isArray(serverUser?.online?.messages)
      ? serverUser.online.messages.map(normalizeOnlineMessageEntry)
      : null;
    const nextClubListings =
      Array.isArray(marketPayload?.clubMarket) || Array.isArray(marketPayload?.clubs)
        ? normalizeClubListingsSnapshot(marketPayload?.clubMarket || marketPayload?.clubs)
        : null;
    const nextGangDirectory = Array.isArray(marketPayload?.gangs)
      ? normalizeGangDirectorySnapshot(marketPayload.gangs)
      : null;

    setGame((prev) => {
      const nextClubState =
        serverUser?.club && typeof serverUser.club === "object"
          ? normalizeClubState({
              ...prev.club,
              ...serverUser.club,
              stash:
                serverUser.club?.stash && typeof serverUser.club.stash === "object"
                  ? { ...prev.club.stash, ...serverUser.club.stash }
                  : prev.club.stash,
              guestState:
                serverUser.club?.guestState && typeof serverUser.club.guestState === "object"
                  ? {
                      ...(prev.club.guestState || createClubGuestState()),
                      ...serverUser.club.guestState,
                    }
                  : prev.club.guestState,
            })
          : null;

      const mergedGang =
        serverUser?.gang && typeof serverUser.gang === "object"
          ? normalizeGangState({
              ...prev.gang,
              ...serverUser.gang,
            })
          : prev.gang;
      const liveGang =
        nextGangDirectory?.find((entry) => entry.name === mergedGang?.name) ||
        prev.online?.gangs?.find((entry) => entry.name === mergedGang?.name) ||
        null;
      const syncedGang = applyGangDirectoryState(mergedGang, liveGang);
      const selectedGangId = prev.online?.selectedGangId || null;
      const nextSelectedGangId =
        selectedGangId && nextGangDirectory
          ? (nextGangDirectory.some((entry) => entry.name === selectedGangId) ? selectedGangId : null)
          : selectedGangId;

      return ({
      ...prev,
      player: {
        ...prev.player,
        id:
          typeof serverUser?.id === "string" && serverUser.id.trim()
            ? serverUser.id.trim()
            : prev.player.id,
        name: safeProfile.name || prev.player.name,
        username:
          typeof serverUser?.username === "string" && serverUser.username.trim()
            ? serverUser.username.trim()
            : prev.player.username,
        avatarId: safeProfile.avatarId || prev.player.avatarId,
        avatarCustomUri:
          safeProfile.avatarCustomUri === null || typeof safeProfile.avatarCustomUri === "string"
            ? safeProfile.avatarCustomUri
            : prev.player.avatarCustomUri,
        rank: getRankTitle(safeProfile.respect ?? prev.player.respect),
        cash: Number.isFinite(safeProfile.cash) ? safeProfile.cash : prev.player.cash,
        bank: Number.isFinite(safeProfile.bank) ? safeProfile.bank : prev.player.bank,
        premiumTokens: Number.isFinite(safeProfile.premiumTokens)
          ? safeProfile.premiumTokens
          : prev.player.premiumTokens,
        energy: Number.isFinite(safeProfile.energy) ? safeProfile.energy : prev.player.energy,
        maxEnergy: Number.isFinite(safeProfile.maxEnergy) ? safeProfile.maxEnergy : prev.player.maxEnergy,
        maxHp: Number.isFinite(safeProfile.maxHp) ? safeProfile.maxHp : prev.player.maxHp,
        hp: clamp(
          Number.isFinite(safeProfile.hp) ? safeProfile.hp : prev.player.hp,
          0,
          Number.isFinite(safeProfile.maxHp) ? safeProfile.maxHp : prev.player.maxHp
        ),
        respect: Number.isFinite(safeProfile.respect) ? safeProfile.respect : prev.player.respect,
        xp: Number.isFinite(safeProfile.xp) ? safeProfile.xp : prev.player.xp,
        attack: Number.isFinite(safeProfile.attack) ? safeProfile.attack : prev.player.attack,
        defense: Number.isFinite(safeProfile.defense) ? safeProfile.defense : prev.player.defense,
        dexterity: Number.isFinite(safeProfile.dexterity) ? safeProfile.dexterity : prev.player.dexterity,
        charisma: Number.isFinite(safeProfile.charisma) ? safeProfile.charisma : prev.player.charisma,
        heat: Number.isFinite(safeProfile.heat) ? safeProfile.heat : prev.player.heat,
        gymPassTier: hasProfileField("gymPassTier") ? safeProfile.gymPassTier : prev.player.gymPassTier,
        gymPassUntil: hasProfileField("gymPassUntil") ? safeProfile.gymPassUntil : prev.player.gymPassUntil,
        jailUntil: hasProfileField("jailUntil") ? safeProfile.jailUntil : prev.player.jailUntil,
        criticalCareUntil: hasProfileField("criticalCareUntil") ? safeProfile.criticalCareUntil : prev.player.criticalCareUntil,
        criticalCareSource: hasProfileField("criticalCareSource") ? safeProfile.criticalCareSource : prev.player.criticalCareSource,
        criticalCareMode: hasProfileField("criticalCareMode") ? safeProfile.criticalCareMode : prev.player.criticalCareMode,
        criticalProtectionUntil: hasProfileField("criticalProtectionUntil")
          ? safeProfile.criticalProtectionUntil
          : prev.player.criticalProtectionUntil,
        isAdmin: Boolean(serverUser?.admin?.isAdmin),
        adminGrantPresets: Array.isArray(serverUser?.admin?.grantPresets)
          ? normalizeAdminGrantPresets(serverUser.admin.grantPresets)
          : prev.player.adminGrantPresets,
        adminRespectPresets: Array.isArray(serverUser?.admin?.respectPresets)
          ? normalizeAdminGrantPresets(serverUser.admin.respectPresets)
          : prev.player.adminRespectPresets,
      },
      stats: { ...prev.stats, ...(serverUser?.stats || {}) },
      inventory: serverUser.inventory || prev.inventory,
      activeBoosts: Array.isArray(serverUser?.activeBoosts)
        ? serverUser.activeBoosts
            .filter((entry) => entry && typeof entry === "object")
            .map((entry, index) => ({
              id: entry?.id || `boost-sync-${index}`,
              name: entry?.name || "Boost",
              effect: entry?.effect && typeof entry.effect === "object" ? { ...entry.effect } : {},
              expiresAt: Number.isFinite(entry?.expiresAt) ? entry.expiresAt : Date.now(),
            }))
        : prev.activeBoosts,
      drugInventory:
        serverUser?.drugInventory && typeof serverUser.drugInventory === "object"
          ? { ...prev.drugInventory, ...serverUser.drugInventory }
          : prev.drugInventory,
      dealerInventory:
        serverUser?.dealerInventory && typeof serverUser.dealerInventory === "object"
          ? { ...prev.dealerInventory, ...serverUser.dealerInventory }
          : prev.dealerInventory,
      escortsOwned: Array.isArray(serverUser?.escortsOwned)
        ? serverUser.escortsOwned.map((entry) => ({
            id: entry?.id,
            count: Number.isFinite(entry?.count) ? entry.count : 0,
            working: Number.isFinite(entry?.working) ? entry.working : 0,
            routes: entry?.routes && typeof entry.routes === "object" ? { ...entry.routes } : {},
          }))
        : prev.escortsOwned,
      businessesOwned: Array.isArray(serverUser?.businessesOwned)
        ? normalizeBusinessesOwned(serverUser.businessesOwned)
        : prev.businessesOwned,
      businessUpgrades:
        serverUser?.businessUpgrades && typeof serverUser.businessUpgrades === "object"
          ? normalizeBusinessUpgrades(serverUser.businessUpgrades)
          : prev.businessUpgrades,
      factoriesOwned:
        serverUser?.factoriesOwned && typeof serverUser.factoriesOwned === "object"
          ? normalizeFactoriesOwned(serverUser.factoriesOwned)
          : prev.factoriesOwned,
      supplies:
        serverUser?.supplies && typeof serverUser.supplies === "object"
          ? normalizeSupplies(serverUser.supplies)
          : prev.supplies,
      tasksClaimed: Array.isArray(serverUser?.tasksClaimed)
        ? serverUser.tasksClaimed.filter((taskId) => typeof taskId === "string")
        : prev.tasksClaimed,
      collections:
        serverUser?.collections && typeof serverUser.collections === "object"
          ? {
              ...prev.collections,
              ...normalizeBusinessCollections(serverUser.collections),
            }
          : prev.collections,
      cooldowns:
        serverUser?.cooldowns && typeof serverUser.cooldowns === "object"
          ? {
              ...prev.cooldowns,
              ...serverUser.cooldowns,
              playerAttackUntil: Math.max(
                0,
                Number(serverUser.cooldowns?.playerAttackUntil || 0)
              ),
              playerAttackTargets: normalizeTargetCooldownMap(
                serverUser.cooldowns?.playerAttackTargets
              ),
              gangAttackUntil: Math.max(
                0,
                Number(serverUser.cooldowns?.gangAttackUntil || 0)
              ),
              gangAttackTargets: normalizeTargetCooldownMap(
                serverUser.cooldowns?.gangAttackTargets,
                Date.now(),
                { lowercaseKeys: true }
              ),
            }
          : prev.cooldowns,
      club: nextClubState || prev.club,
      clubListings:
        nextClubListings ||
        (nextClubState
          ? syncClubListing(
              prev.clubListings,
              nextClubState,
              serverUser.club?.ownerLabel || safeProfile.name || prev.player.name
            )
          : prev.clubListings),
      gang: syncedGang,
      city:
        serverUser?.city && typeof serverUser.city === "object"
          ? normalizeCityState(serverUser.city)
          : prev.city,
      operations:
        serverUser?.operations && typeof serverUser.operations === "object"
          ? normalizeOperationsState(serverUser.operations)
          : prev.operations,
      contracts:
        serverUser?.contracts && typeof serverUser.contracts === "object"
          ? normalizeContractState(serverUser.contracts)
          : prev.contracts,
      contractBoard: normalizeContractBoardSnapshot(
        marketPayload?.contractsBoard,
        serverUser?.contracts?.history || prev.contracts?.history || []
      ),
      arena:
        serverUser?.arena && typeof serverUser.arena === "object"
          ? normalizeArenaState(serverUser.arena)
          : prev.arena,
      online: {
        ...prev.online,
        gangs: nextGangDirectory || prev.online.gangs,
        selectedGangId: nextSelectedGangId,
        friends: nextFriends || prev.online.friends,
        messages: nextMessages || prev.online.messages,
      },
      log: Array.isArray(serverUser?.log) && serverUser.log.length ? serverUser.log : prev.log,
      ...normalizeMarketPayload(marketPayload, prev.market, prev.marketState, prev.marketMeta),
      });
    });
    };

  const refreshMarketState = async (token = sessionToken) => {
    if (!token) return;
    const marketSnapshot = await fetchMarket(token);
    setGame((prev) => ({
      ...prev,
      ...normalizeMarketPayload(marketSnapshot, prev.market, prev.marketState, prev.marketMeta),
      dealerInventory:
        marketSnapshot?.dealerInventory && typeof marketSnapshot.dealerInventory === "object"
          ? { ...prev.dealerInventory, ...marketSnapshot.dealerInventory }
          : prev.dealerInventory,
    }));
  };

  const refreshCasinoState = async (token = sessionToken) => {
    if (!token) return;
    const meta = await fetchCasinoMeta(token);
    setCasinoState((prev) => ({
      ...prev,
      backendMeta: meta,
      blackjack: meta?.blackjackSession
        ? {
            ...prev.blackjack,
            ...meta.blackjackSession,
            bet: String(meta.blackjackSession.bet || prev.blackjack.bet || "200"),
          }
        : prev.blackjack,
    }));
  };

  const refreshHeistsState = async (token = sessionToken) => {
    if (!token) return;
    const heistsSnapshot = await fetchHeistsOnline(token);
    if (!Array.isArray(heistsSnapshot?.heists)) return;

    setGame((prev) => ({
      ...prev,
      online: {
        ...prev.online,
        heists: heistsSnapshot.heists.map(normalizeHeistDefinition).filter(Boolean),
      },
    }));
  };

  const refreshContractBoardState = async (token = sessionToken) => {
    if (!token) return null;
    const contractsSnapshot = await fetchContractsOnline(token);
    setGame((prev) => ({
      ...prev,
      contracts:
        Array.isArray(contractsSnapshot?.history) && contractsSnapshot.history.length
          ? normalizeContractState({
              ...prev.contracts,
              history: contractsSnapshot.history,
            })
          : prev.contracts,
      contractBoard: normalizeContractBoardSnapshot(
        contractsSnapshot,
        contractsSnapshot?.history || prev.contracts?.history || []
      ),
    }));
    return contractsSnapshot;
  };

  const refreshSocialState = async (token = sessionToken) => {
    if (!token) return;
    const [playersResult, rankingsResult, chatResult, friendsResult, messagesResult, gangsResult] = await Promise.allSettled([
      fetchSocialPlayers(token),
      fetchRankingsOnline(token),
      fetchGlobalChatOnline(token),
      fetchFriendListOnline(token),
      fetchMessageListOnline(token),
      fetchGangDirectoryOnline(token),
    ]);

    const playersSnapshot = playersResult.status === "fulfilled" ? playersResult.value : null;
    const rankingsSnapshot = rankingsResult.status === "fulfilled" ? rankingsResult.value : null;
    const chatSnapshot = chatResult.status === "fulfilled" ? chatResult.value : null;
    const friendsSnapshot = friendsResult.status === "fulfilled" ? friendsResult.value : null;
    const messagesSnapshot = messagesResult.status === "fulfilled" ? messagesResult.value : null;
    const gangsSnapshot = gangsResult.status === "fulfilled" ? gangsResult.value : null;
    const normalizedGangs = Array.isArray(gangsSnapshot?.gangs)
      ? normalizeGangDirectorySnapshot(gangsSnapshot.gangs)
      : null;

    setGame((prev) => ({
      ...prev,
      gang:
        normalizedGangs
          ? applyGangDirectoryState(
              prev.gang,
              normalizedGangs.find((entry) => entry.name === prev.gang.name) || null
            )
          : prev.gang,
      online: {
        ...prev.online,
        roster: Array.isArray(playersSnapshot?.players)
          ? playersSnapshot.players.map(normalizeOnlinePlayerEntry)
          : prev.online.roster,
        gangs: normalizedGangs || prev.online.gangs,
        selectedGangId:
          normalizedGangs && prev.online.selectedGangId
            ? (
                normalizedGangs.some(
                  (entry) => entry.name === prev.online.selectedGangId
                )
                  ? prev.online.selectedGangId
                  : null
              )
            : prev.online.selectedGangId,
        rankings: rankingsSnapshot
          ? normalizeRankingsSnapshot(rankingsSnapshot)
          : prev.online.rankings,
        cityChat: Array.isArray(chatSnapshot?.messages)
          ? normalizeChatFeedEntries(chatSnapshot.messages)
          : prev.online.cityChat,
        friends: Array.isArray(friendsSnapshot?.friends)
          ? friendsSnapshot.friends.map(normalizeOnlineFriendEntry)
          : prev.online.friends,
        messages: Array.isArray(messagesSnapshot?.messages)
          ? messagesSnapshot.messages.map(normalizeOnlineMessageEntry)
          : prev.online.messages,
      },
    }));
  };

  const refreshProfileState = async (token = sessionToken) => {
    if (!token) return null;
    const me = await fetchMe(token);
    if (!me?.user?.profile) return null;
    mergeServerUser(me.user, {
      prices: me.market,
      products: me.marketState,
      clubMarket: me.clubMarket,
      gangs: me.gangs,
      contractsBoard: me.contractsBoard,
    });
    return me;
  };

  const refreshPrisonChatState = async (token = sessionToken) => {
    if (!token) return null;
    try {
      const prisonSnapshot = await fetchPrisonChatOnline(token);
      setGame((prev) => ({
        ...prev,
        prisonChat: Array.isArray(prisonSnapshot?.messages)
          ? normalizeChatFeedEntries(prisonSnapshot.messages)
          : prev.prisonChat,
      }));
      return prisonSnapshot;
    } catch (error) {
      if (String(error?.message || "").includes("Chat celi widza tylko osadzeni.")) {
        setGame((prev) => (prev.prisonChat.length ? { ...prev, prisonChat: [] } : prev));
        try {
          await refreshProfileState(token);
        } catch (_refreshError) {}
        return null;
      }
      throw error;
    }
  };

  realtimeEventHandlerRef.current = (event) =>
    handleRealtimeInvalidationEvent(event, {
      token: sessionTokenRef.current,
      ui: uiSnapshotRef.current,
      game: gameSnapshotRef.current,
      refreshProfile: refreshProfileState,
      refreshMarket: refreshMarketState,
      refreshSocial: refreshSocialState,
      refreshContracts: refreshContractBoardState,
      refreshHeists: refreshHeistsState,
      refreshCasino: refreshCasinoState,
      refreshPrison: refreshPrisonChatState,
    }).catch(() => {});

    const hydrateAuthenticatedSession = async (token) => {
      if (typeof token !== "string" || !token.trim()) {
        throw new Error("Brak poprawnego tokena sesji.");
      }

    setSessionToken(token);
    setApiStatus("online");
      const me = await fetchMe(token);
      if (!me?.user?.profile) {
        throw new Error("Backend nie zwrocil profilu gracza.");
      }
        mergeServerUser(me.user, {
          prices: me.market,
          products: me.marketState,
          clubMarket: me.clubMarket,
          gangs: me.gangs,
          contractsBoard: me.contractsBoard,
        });
      didHydrateSessionRef.current = true;
      try {
        const casinoMeta = await fetchCasinoMeta(token);
        setCasinoState((prev) => ({
          ...prev,
          backendMeta: casinoMeta || null,
          blackjack: casinoMeta?.blackjackSession
            ? {
                ...prev.blackjack,
                ...casinoMeta.blackjackSession,
                bet: String(casinoMeta.blackjackSession.bet || prev.blackjack.bet || "200"),
              }
            : prev.blackjack,
        }));
      } catch (_error) {
        setCasinoState((prev) => ({ ...prev, backendMeta: null }));
      }
      try {
        await refreshSocialState(token);
      } catch (_error) {
      }
      if (inJail(me.user.profile || {})) {
        try {
          await refreshPrisonChatState(token);
        } catch (_error) {
        }
      } else {
        setGame((prev) => (prev.prisonChat.length ? { ...prev, prisonChat: [] } : prev));
      }
      try {
        await refreshHeistsState(token);
      } catch (_error) {
      }
      try {
        await refreshContractBoardState(token);
      } catch (_error) {
      }
  };

  const handleAuthLogin = async ({ login, password }) => {
    setAuthBusy(true);
    setAuthError("");
    setStartupError("");
    try {
      const result = await loginUser({ login, password });
      if (!result?.token) {
        throw new Error("Backend nie zwrocil tokena logowania.");
      }
      const tokenSaved = await saveStoredAuthToken(result.token);
      if (!tokenSaved) {
        throw new Error("Nie udalo sie zapisac tokena na urzadzeniu.");
      }
      await hydrateAuthenticatedSession(result.token);
      setAuthReady(true);
    } catch (error) {
      setSessionToken(null);
      setApiStatus("offline");
      setAuthError(error.message || "Logowanie nie wyszlo.");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleAuthRegister = async ({ login, email, password }) => {
    setAuthBusy(true);
    setAuthError("");
    setStartupError("");
    try {
      const result = await registerUser({ login, email, password });
      if (!result?.token) {
        throw new Error("Backend nie zwrocil tokena rejestracji.");
      }
      const tokenSaved = await saveStoredAuthToken(result.token);
      if (!tokenSaved) {
        throw new Error("Nie udalo sie zapisac tokena na urzadzeniu.");
      }
      await hydrateAuthenticatedSession(result.token);
      setAuthReady(true);
    } catch (error) {
      setSessionToken(null);
      setApiStatus("offline");
      setAuthError(error.message || "Rejestracja nie wyszla.");
    } finally {
      setAuthBusy(false);
    }
  };

  // TODO: TO_MIGRATE_TO_SERVER - passive accrual, local market refresh, escort loss events and fallback energy regen
  useEffect(() => {
    let cancelled = false;

    async function bootApi() {
      try {
        const storedToken = await getStoredAuthToken();
        if (cancelled) return;
        if (!storedToken) {
          setAuthReady(true);
          setApiStatus("offline");
          setStartupError("");
          return;
        }

        await hydrateAuthenticatedSession(storedToken);
        if (cancelled) return;
        setAuthReady(true);
        setStartupError("");
      } catch (_error) {
        if (!cancelled) {
          try {
            await clearStoredAuthToken();
          } catch (_storageError) {}
          setSessionToken(null);
          setApiStatus("offline");
          setAuthReady(true);
          setStartupError(_error?.message || "Nie udalo sie odpalic zapisanej sesji.");
        }
      }
    }

    bootApi();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sessionToken || apiStatus !== "online") {
      realtimeClientRef.current?.close?.();
      realtimeClientRef.current = null;
      return undefined;
    }

    const client = createRealtimeClient({
      token: sessionToken,
      onEvent: (event) => realtimeEventHandlerRef.current?.(event),
    });
    realtimeClientRef.current = client;

    return () => {
      client.close();
      if (realtimeClientRef.current === client) {
        realtimeClientRef.current = null;
      }
    };
  }, [sessionToken, apiStatus]);

  useEffect(() => {
    if (!sessionToken || apiStatus !== "online") return undefined;
    const timer = setInterval(() => {
      refreshProfileState(sessionToken).catch(() => {});
      refreshMarketState(sessionToken).catch(() => {});
      refreshCasinoState(sessionToken).catch(() => {});
      refreshSocialState(sessionToken).catch(() => {});
      if (tab === "heists" && activeSectionId === "contracts") {
        refreshContractBoardState(sessionToken).catch(() => {});
      }
      if (inJail(game.player)) {
        refreshPrisonChatState(sessionToken).catch(() => {});
      }
    }, 45000);
    return () => clearInterval(timer);
  }, [sessionToken, apiStatus, game.player.jailUntil, tab, activeSectionId]);

  useEffect(() => {
    if (!sessionToken || apiStatus !== "online") return;
    if (tab !== "heists" || activeSectionId !== "prison") return;
    let cancelled = false;
    (async () => {
      try {
        const me = await refreshProfileState(sessionToken);
        if (cancelled) return;
        if (inJail(me?.user?.profile || {})) {
          await refreshPrisonChatState(sessionToken);
          return;
        }
        setGame((prev) => (prev.prisonChat.length ? { ...prev, prisonChat: [] } : prev));
      } catch (_error) {}
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionToken, apiStatus, tab, activeSectionId, game.player.jailUntil]);

  useEffect(() => {
    if (!sessionToken || apiStatus !== "online") return;
    if (tab !== "heists" || activeSectionId !== "contracts") return;
    refreshContractBoardState(sessionToken).catch(() => {});
  }, [sessionToken, apiStatus, tab, activeSectionId]);

  useEffect(() => {
    if (!sessionToken || apiStatus !== "online") return undefined;
    if (tab !== "empire" || activeSectionId !== "businesses") return undefined;

    refreshProfileState(sessionToken).catch(() => {});
    const timer = setInterval(() => {
      refreshProfileState(sessionToken).catch(() => {});
    }, 12000);

    return () => clearInterval(timer);
  }, [sessionToken, apiStatus, tab, activeSectionId]);

  useEffect(() => {
    if (inJail(game.player)) return;
    setGame((prev) => (prev.prisonChat.length ? { ...prev, prisonChat: [] } : prev));
  }, [game.player.jailUntil]);

  useEffect(() => {
    const isOnlineAuthority = Boolean(sessionToken && apiStatus === "online");
    const timer = setInterval(() => {
      setGame((prev) => {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - prev.lastTick) / 1000);
        if (elapsedSeconds < 5) return prev;

        const remainingBoosts = prev.activeBoosts.filter((boost) => boost.expiresAt > now);
        const expiredBoosts = prev.activeBoosts.filter((boost) => boost.expiresAt <= now);
        const marketRefresh = Math.floor(prev.lastTick / 60000) !== Math.floor(now / 60000);
        const energyPool = prev.regenRemainder + elapsedSeconds;
        const energyRecovered = Math.floor(energyPool / ENERGY_REGEN_SECONDS);
        const regenRemainder = energyPool % ENERGY_REGEN_SECONDS;
        const criticalCareStatus = getCriticalCareStatus(prev.player, now);
        const healthPool =
          criticalCareStatus.active || prev.player.hp >= prev.player.maxHp
            ? 0
            : (prev.hpRegenRemainder || 0) + elapsedSeconds;
        const hpRecovered = Math.floor(healthPool / HEALTH_REGEN_SECONDS) * HEALTH_REGEN_AMOUNT;
        let hpRegenRemainder =
          criticalCareStatus.active || prev.player.hp >= prev.player.maxHp
            ? 0
            : healthPool % HEALTH_REGEN_SECONDS;
        const passiveMinutes = elapsedSeconds / 60;
        const businessIncome = isOnlineAuthority ? 0 : getBusinessIncomePerMinute(prev, BUSINESSES);
        const escortIncome = isOnlineAuthority ? 0 : getEscortIncomePerMinute(prev);
        const nextCollections = {
          businessCash: Math.min((prev.collections?.businessCash || 0) + businessIncome * passiveMinutes, getPassiveCapAmount(businessIncome)),
          escortCash: Math.min((prev.collections?.escortCash || 0) + escortIncome * passiveMinutes, getPassiveCapAmount(escortIncome)),
          businessCollectedAt: prev.collections?.businessCollectedAt || null,
          escortCollectedAt: prev.collections?.escortCollectedAt || null,
          businessAccruedAt: prev.collections?.businessAccruedAt || null,
          escortAccruedAt: prev.collections?.escortAccruedAt || null,
        };
        const logLines = [...prev.log];

        expiredBoosts.forEach((boost) => {
          logLines.unshift(`Efekt ${boost.name} minal. Organizm wraca do normy.`);
        });

        const nextPlayer = {
          ...prev.player,
          energy: clamp(prev.player.energy + energyRecovered, 0, prev.player.maxEnergy),
          hp: clamp(prev.player.hp + hpRecovered, 0, prev.player.maxHp),
          heat: clamp(prev.player.heat - Math.floor(elapsedSeconds / 180), 0, 100),
        };
        if (nextPlayer.hp >= nextPlayer.maxHp) {
          hpRegenRemainder = 0;
        }
        const nextEscortsOwned = isOnlineAuthority
          ? prev.escortsOwned
          : prev.escortsOwned.map((entry) => ({
              ...entry,
              routes: { ...getEscortRoutes(entry) },
            }));

        let escortPool = nextCollections.escortCash;
        let streetHeatGain = 0;

        nextEscortsOwned.forEach((entry) => {
          if (isOnlineAuthority) return;
          const escort = ESCORTS.find((item) => item.id === entry.id);
          if (!escort) return;

          STREET_DISTRICTS.forEach((district) => {
            const assigned = entry.routes[district.id] || 0;
            if (!assigned) return;

            const policeChance = clamp((district.policeRisk * assigned * elapsedSeconds) / 36000, 0, 0.3);
            const beatChance = clamp((district.beatRisk * assigned * elapsedSeconds) / 32000, 0, 0.3);
            const escapeChance = clamp((district.escapeRisk * assigned * elapsedSeconds) / 42000, 0, 0.2);

            if (Math.random() < policeChance && (entry.routes[district.id] || 0) > 0) {
              entry.routes[district.id] -= 1;
              escortPool = Math.max(0, escortPool - escort.cashPerMinute * district.incomeMultiplier * 45);
              streetHeatGain += 4 + Math.round(district.policeRisk * 20);
              logLines.unshift(`Nalot na ${escort.name} w ${district.name}. Jedna schodzi z ulicy, a gliny zabieraja czesc utargu.`);
            }

            if (Math.random() < beatChance && (entry.routes[district.id] || 0) > 0) {
              entry.routes[district.id] -= 1;
              escortPool = Math.max(0, escortPool - escort.cashPerMinute * district.incomeMultiplier * 24);
              logLines.unshift(`Pobicie na trasie ${district.name}. ${escort.name} znika dzis z roboty i trzeba ja sciagac.`);
            }

            if (Math.random() < escapeChance && (entry.routes[district.id] || 0) > 0) {
              entry.routes[district.id] -= 1;
              entry.count = Math.max(0, entry.count - 1);
              escortPool = Math.max(0, escortPool - escort.cashPerMinute * district.incomeMultiplier * 18);
              logLines.unshift(`${escort.name} zwiala z ${district.name}. Kontakt spalony i wypada z obiegu.`);
            }

            if ((entry.routes[district.id] || 0) <= 0) {
              delete entry.routes[district.id];
            }
          });

          entry.working = getEscortWorkingCount(entry);
        });

        const cleanedEscortsOwned = isOnlineAuthority
          ? nextEscortsOwned
          : nextEscortsOwned.filter((entry) => entry.count > 0);
        const nextEscortIncome = isOnlineAuthority
          ? 0
          : getEscortIncomePerMinute({ ...prev, escortsOwned: cleanedEscortsOwned });
        nextCollections.escortCash = isOnlineAuthority
          ? prev.collections?.escortCash || 0
          : Math.min(escortPool, getPassiveCapAmount(nextEscortIncome));

        if (nextPlayer.gymPassTier !== "perm" && nextPlayer.gymPassUntil && nextPlayer.gymPassUntil <= now) {
          nextPlayer.gymPassTier = null;
          nextPlayer.gymPassUntil = null;
          logLines.unshift("Karnet na silownie wygasl.");
        }

        const nextGang = { ...prev.gang };
        if (nextGang.crewLockdownUntil && nextGang.crewLockdownUntil <= now && nextGang.jailedCrew > 0) {
          logLines.unshift(`Ludzie z gangu wracaja z odsiadki. Do skladu wraca ${nextGang.jailedCrew} osob.`);
          nextGang.jailedCrew = 0;
          nextGang.crewLockdownUntil = 0;
        }

        return {
          ...prev,
          player: {
            ...nextPlayer,
            heat: clamp(nextPlayer.heat + streetHeatGain, 0, 100),
          },
          gang: nextGang,
          escortsOwned: cleanedEscortsOwned,
          collections: nextCollections,
          market: marketRefresh
            ? PRODUCTS.reduce((acc, item) => {
                acc[item.id] = Math.max(8, Math.round(item.basePrice * (0.74 + Math.random() * 0.78)));
                return acc;
              }, {})
            : prev.market,
          activeBoosts: remainingBoosts,
          regenRemainder,
          hpRegenRemainder,
          lastTick: now,
          log: logLines.slice(0, 16),
        };
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [apiStatus, sessionToken]);

  useEffect(() => {
    if (!notice?.id) return undefined;

    noticeOpacity.setValue(0);
    noticeTranslateY.setValue(-12);

    const show = Animated.parallel([
      Animated.timing(noticeOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(noticeTranslateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]);

    const hide = Animated.parallel([
      Animated.timing(noticeOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(noticeTranslateY, {
        toValue: -10,
        duration: 180,
        useNativeDriver: true,
      }),
    ]);

    show.start();
    const timer = setTimeout(() => {
      hide.start(({ finished }) => {
        if (finished) setNotice(null);
      });
    }, 2900);

    return () => {
      clearTimeout(timer);
      show.stop();
      hide.stop();
    };
  }, [notice]);

  useEffect(() => {
    const previousGame = previousGameRef.current;
    if (!didHydrateFeedbackRef.current) {
      previousGameRef.current = game;
      didHydrateFeedbackRef.current = true;
      return;
    }

    const previousTopLog = previousGame.log?.[0];
    const nextTopLog = game.log?.[0];
    if (!nextTopLog || nextTopLog === previousTopLog) {
      previousGameRef.current = game;
      return;
    }

    if (wasNoticeLogHandledRecently(nextTopLog)) {
      previousGameRef.current = game;
      return;
    }

    if (Date.now() - lastExplicitNoticeAtRef.current < 180) {
      previousGameRef.current = game;
      return;
    }

    const deltas = {
      cash: (game.player.cash || 0) - (previousGame.player.cash || 0),
      hp: (game.player.hp || 0) - (previousGame.player.hp || 0),
      heat: (game.player.heat || 0) - (previousGame.player.heat || 0),
      respect: (game.player.respect || 0) - (previousGame.player.respect || 0),
    };

    markNoticeLogHandled(nextTopLog);
    setNotice({
      id: Date.now(),
      ...inferFeedbackNotice(nextTopLog, deltas),
    });

    previousGameRef.current = game;
  }, [game]);

  const pushLog = (message) => {
    setGame((prev) => ({ ...prev, log: [message, ...prev.log].slice(0, 16) }));
    const tone = /brakuje|nie masz|za ma(lo|ly)|zablokowane|potrzebujesz|najpierw|nie ma|tylko|brak/i.test(message)
      ? getExplicitNoticeTone(message)
      : "warning";

    showExplicitNotice({
      tone,
      title: getExplicitNoticeTitle(message, tone),
      message,
      deltas: null,
    });
  };

  const showExplicitNotice = ({
    tone = "warning",
    title = "UWAGA",
    message = "",
    deltas = null,
    allowWhileQuickAction = false,
  }) => {
    lastExplicitNoticeAtRef.current = Date.now();
    markNoticeLogHandled(message);
    setNotice({
      id: Date.now(),
      tone,
      title,
      message,
      deltas,
      allowWhileQuickAction,
    });
  };

  const showCriticalCareBlockedNotice = (actionLabel = "Ta akcja") => {
    if (!criticalCareStatus.active) return false;
    showExplicitNotice({
      tone: "failure",
      title: "STAN KRYTYCZNY",
      message: `Jestes na ${criticalCareStatus.mode.label.toLowerCase()} jeszcze ${formatCooldown(
        criticalCareStatus.remainingMs
      )}. ${actionLabel} jest teraz zablokowane. Wejdz do Szpitala w Miescie, jesli chcesz przepisac sie do prywatnej kliniki.`,
    });
    setQuickActionModal(null);
    setSectionByTab((prev) => ({ ...prev, city: "hospital" }));
    setTab("city");
    setIsHubActive(false);
    return true;
  };

  const registerBankTransferFeedback = (type, amount) => {
    const safeAmount = Math.max(0, Math.floor(Number(amount || 0)));
    if (!safeAmount) return;

    const now = Date.now();
    const entry = {
      id: `bank-${type === "withdraw" ? "withdraw" : "deposit"}-${now}`,
      type: type === "withdraw" ? "withdraw" : "deposit",
      amount: safeAmount,
      createdAt: now,
    };

    setBankFeedback(entry);
    setBankRecentTransfers((prev) => [entry, ...prev].slice(0, 3));
    showExplicitNotice({
      tone: "success",
      title: entry.type === "withdraw" ? "WYPLATA" : "WPLATA",
      message:
        entry.type === "withdraw"
          ? `Wyplacono ${formatMoney(safeAmount)} z banku.`
          : `Wplacono ${formatMoney(safeAmount)} do banku.`,
      deltas: null,
    });
  };

  const openQuickAction = (action) => {
    setNotice(null);
    setQuickActionModal(action);
  };

  const closeQuickAction = () => {
    const closingModal = quickActionModal;
    setQuickActionModal(null);
    setNotice(null);
    if (closingModal === "compose-message") {
      setDirectMessageDraft("");
      setDirectMessageRecipient(null);
    }
  };

  const openMessageComposer = (player) => {
    if (!player?.name) {
      pushLog("Nie ma do kogo napisac.");
      return;
    }
    setDirectMessageRecipient({
      id: player.id || null,
      name: player.name,
      gang: player.gang || "No gang",
      online: player.online !== false,
    });
    setDirectMessageDraft("");
    openQuickAction("compose-message");
  };

  const handleLogout = async () => {
    try {
      await clearStoredAuthToken();
    } catch (_error) {}

    didHydrateSessionRef.current = false;
    didHydrateFeedbackRef.current = false;
    previousGameRef.current = INITIAL;
    lastExplicitNoticeAtRef.current = 0;
    handledNoticeLogsRef.current.clear();

    setSessionToken(null);
    setApiStatus("offline");
    setAuthBusy(false);
    setAuthReady(true);
    setAuthError("");
    setStartupError("");
    setGame(INITIAL);
    setTab("heists");
    setIsHubActive(true);
    setSectionByTab({ ...DEFAULT_SECTIONS });
    setGangMessage("");
    setPrisonMessage("");
    setCityMessage("");
    setDirectMessageDraft("");
    setDirectMessageRecipient(null);
    setGangDraftName("Night Reign");
    setBankAmountDraft("1000");
    setBankRecentTransfers([]);
    setBankFeedback(null);
    setMealFeedback(null);
    setNotice(null);
    setQuickActionModal(null);
    setGangProfileView("actions");
    setCasinoState(createInitialCasinoState());
  };

  const setActiveSection = (tabId, sectionId) => {
    setSectionByTab((prev) => ({ ...prev, [tabId]: sectionId }));
    if (tabId !== tab) setTab(tabId);
    setIsHubActive(false);
  };

  useEffect(() => {
    const previous = previousCriticalCareStateRef.current;
    if (criticalCareStatus.active && !previous.active) {
      showExplicitNotice({
        tone: "failure",
        title: "STAN KRYTYCZNY",
        message: `Po ${criticalCareStatus.source || "ciezkiej akcji"} trafiles na ${criticalCareStatus.mode.label.toLowerCase()}. Przez ${formatCooldown(
          criticalCareStatus.remainingMs
        )} nie zrobisz napadow, kontraktow, PvP ani treningu.`,
      });
      setQuickActionModal(null);
      setSectionByTab((prev) => ({ ...prev, city: "hospital" }));
      setTab("city");
      setIsHubActive(false);
    } else if (!criticalCareStatus.active && previous.active && criticalCareStatus.protected) {
      showExplicitNotice({
        tone: "warning",
        title: "WRACASZ DO GRY",
        message: `Wyszedles z terapii z okolo ${criticalCareStatus.expectedRecoveryHp || 0} HP. Przez ${formatCooldown(
          criticalCareStatus.protectionRemainingMs || 0
        )} masz jeszcze oslone przed dobijaniem w PvP.`,
      });
    }
    previousCriticalCareStateRef.current = {
      active: Boolean(criticalCareStatus.active),
      protected: Boolean(criticalCareStatus.protected),
    };
  }, [
    criticalCareStatus.active,
    criticalCareStatus.expectedRecoveryHp,
    criticalCareStatus.mode?.label,
    criticalCareStatus.protected,
    criticalCareStatus.protectionRemainingMs,
    criticalCareStatus.remainingMs,
    criticalCareStatus.source,
  ]);

  useEffect(() => {
    pageScrollRef.current?.scrollTo?.({ y: 0, animated: false });
  }, [tab, activeSectionId, isPhone]);

  const canDoStreetAction = (message) => {
    if (inJail(game.player)) {
      pushLog(message || "Siedzisz w wiezieniu. Najpierw odsiadka albo kaucja.");
      return false;
    }
    return true;
  };

  const canDoCriticalAction = (actionLabel = "Ta akcja") => {
    if (!criticalCareStatus.active) return true;
    showCriticalCareBlockedNotice(actionLabel);
    return false;
  };

  const requireOfflineDemoAuthority = (featureLabel) =>
    !blockIfOnlineAlpha(gameMode, pushLog, featureLabel);

  const applyProgressionToPlayer = (player, xpGain = 0) => {
    const progression = applyXpProgression({ respect: player.respect, xp: player.xp }, xpGain);
    return {
      player: {
        ...player,
        respect: progression.respect,
        xp: progression.xp,
        rank: getRankTitle(progression.respect),
      },
      progression,
    };
  };

  const updateLocalPlayer = (changes, message) => {
    setGame((prev) => ({
      ...prev,
      player: {
        ...prev.player,
        ...changes,
        xp: Number.isFinite(changes.xp) ? changes.xp : prev.player.xp,
        rank: getRankTitle(changes.respect ?? prev.player.respect),
      },
      log: message ? [message, ...prev.log].slice(0, 16) : prev.log,
    }));
  };

  const setAvatar = async (avatarId) => {
    const avatar = getAvatarById(avatarId, avatarOptions);
    if (sessionToken && apiStatus === "online") {
        try {
          const result = await updateAvatarOnline(sessionToken, avatarId);
          mergeServerUser(result.user, { clubMarket: result.clubMarket });
          return;
      } catch (error) {
        pushLog(error.message || "Nie udalo sie zapisac avatara.");
        return;
      }
    }

    setGame((prev) => ({
      ...prev,
      player: {
        ...prev.player,
        avatarId,
      },
      log: [`Ustawiono avatar: ${avatar.name}.`, ...prev.log].slice(0, 16),
    }));
  };

  const pickCustomAvatar = async () => {
    if (sessionToken && apiStatus === "online") {
      pushLog("Wlasne foto profilowe odpalimy po backendowym uploadzie. W online zapisuje sie teraz tylko avatar z serwera.");
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        pushLog("Daj dostep do galerii, zeby ustawic swoje foto.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        pushLog("Nie udalo sie wczytac zdjecia.");
        return;
      }

      setGame((prev) => ({
        ...prev,
        player: {
          ...prev.player,
          avatarId: "custom",
          avatarCustomUri: asset.uri,
        },
        log: ["Ustawiono wlasne foto profilowe.", ...prev.log].slice(0, 16),
      }));
    } catch (error) {
      pushLog(error?.message || "Galeria nie odpalila poprawnie.");
    }
  };

  const buyGymPass = async (pass) => {
    if (!canDoStreetAction("Nie kupisz karnetu z celi.")) return;
    if (sessionToken && apiStatus === "online") {
      try {
        const result = await buyGymPassOnline(sessionToken, pass.id);
        mergeServerUser(result.user);
        return;
      } catch (error) {
        pushLog(error.message);
        return;
      }
    }
    if (game.player.cash < pass.price) return pushLog(`Brakuje ${formatMoney(pass.price)} na ${pass.name}.`);

    updateLocalPlayer(
      {
        cash: game.player.cash - pass.price,
        gymPassTier: pass.id,
        gymPassUntil: pass.durationMs ? Date.now() + pass.durationMs : null,
      },
      `Kupiono ${pass.name}. Czas napompowac staty.`
    );
  };

  const doGymExercise = async (exercise, repetitions = 1) => {
    const safeRepetitions = clamp(Math.floor(Number(repetitions) || 1), 1, 20);
    if (!canDoStreetAction("Z celi nie dojdziesz na silownie.")) return false;
    if (!canDoCriticalAction("Silownia")) return false;
    if (sessionToken && apiStatus === "online") {
      try {
        const result = await trainAtGymOnline(sessionToken, exercise.id, safeRepetitions);
        mergeServerUser(result.user);
        showExplicitNotice(buildGymExerciseNotice(exercise, result.result));
        return result.result || true;
      } catch (error) {
        pushLog(error.message);
        return false;
      }
    }
    if (!hasGymPass(game.player)) {
      pushLog("Najpierw kup karnet na silownie.");
      return false;
    }
    if (game.player.energy < exercise.costEnergy) {
      pushLog("Za malo energii na trening.");
      return false;
    }

    const maxSeries = Math.floor(game.player.energy / Math.max(1, exercise.costEnergy));
    if (safeRepetitions > maxSeries) {
      pushLog(`Masz energii tylko na ${maxSeries} ${maxSeries === 1 ? "serie" : "serii"}.`);
      return false;
    }

    const totalGains = {
      attack: Number(exercise.gains?.attack || 0) * safeRepetitions,
      defense: Number(exercise.gains?.defense || 0) * safeRepetitions,
      dexterity: Number(exercise.gains?.dexterity || 0) * safeRepetitions,
      maxHp: Number(exercise.gains?.maxHp || 0) * safeRepetitions,
      hp: Number(exercise.gains?.hp || 0) * safeRepetitions,
    };
    const energySpent = exercise.costEnergy * safeRepetitions;

    setGame((prev) => {
      const player = { ...prev.player, energy: prev.player.energy - energySpent };
      if (totalGains.attack) player.attack += totalGains.attack;
      if (totalGains.defense) player.defense += totalGains.defense;
      if (totalGains.dexterity) player.dexterity += totalGains.dexterity;
      if (totalGains.maxHp) player.maxHp += totalGains.maxHp;
      if (totalGains.hp) player.hp = clamp(prev.player.hp + totalGains.hp, 0, player.maxHp);
      return {
        ...prev,
        player,
        stats: {
          ...prev.stats,
          gymTrainings: Number(prev.stats?.gymTrainings || 0) + safeRepetitions,
        },
        log: [
          safeRepetitions > 1
            ? `Silownia zaliczona x${safeRepetitions}: ${exercise.name}. ${exercise.note}.`
            : `Silownia zaliczona: ${exercise.name}. ${exercise.note}.`,
          ...prev.log,
        ].slice(0, 16),
      };
    });
    const summary = {
      repetitions: safeRepetitions,
      energySpent,
      totalGains,
    };
    showExplicitNotice(buildGymExerciseNotice(exercise, summary));
    return summary;
  };

  const buyMeal = async (meal) => {
    if (!canDoStreetAction("Wiezienie serwuje tylko standardowy kociolek.")) return false;
    const previousEnergy = Number(game.player.energy || 0);
    if (sessionToken && apiStatus === "online") {
      try {
        const result = await buyMealOnline(sessionToken, meal.id);
        const nextEnergy = Number(result?.user?.profile?.energy ?? previousEnergy);
        const energyGain = Math.max(0, nextEnergy - previousEnergy);
        mergeServerUser(result.user);
        const summary = {
          id: Date.now(),
          mealId: meal.id,
          mealName: meal.name,
          price: meal.price,
          energyGain,
          energyAfter: nextEnergy,
        };
        setMealFeedback({
          id: summary.id,
          text: energyGain > 0 ? `+${energyGain} EN` : "",
        });
        return summary;
      } catch (error) {
        pushLog(error.message);
        return false;
      }
    }
    if (game.player.cash < meal.price) {
      pushLog(`Brakuje kasy na ${meal.name}.`);
      return false;
    }
    const nextEnergy = clamp(game.player.energy + meal.energy, 0, game.player.maxEnergy);
    const energyGain = Math.max(0, nextEnergy - game.player.energy);
    setGame((prev) => ({
      ...prev,
      player: {
        ...prev.player,
        cash: prev.player.cash - meal.price,
        energy: clamp(prev.player.energy + meal.energy, 0, prev.player.maxEnergy),
      },
      stats: {
        ...prev.stats,
        mealsEaten: Number(prev.stats?.mealsEaten || 0) + 1,
      },
      log: [`Zjedzone: ${meal.name}. Energia +${meal.energy}.`, ...prev.log].slice(0, 16),
    }));
    const summary = {
      id: Date.now(),
      mealId: meal.id,
      mealName: meal.name,
      price: meal.price,
      energyGain,
      energyAfter: nextEnergy,
    };
    setMealFeedback({
      id: summary.id,
      text: energyGain > 0 ? `+${energyGain} EN` : "",
    });
    return summary;
  };

  const heal = async () => {
    const previousHp = Number(game.player.hp || 0);
    const previousHeat = Number(game.player.heat || 0);
    if (sessionToken && apiStatus === "online") {
      try {
        const result = await healOnline(sessionToken);
        const nextHp = Number(result?.user?.profile?.hp ?? previousHp);
        const nextHeat = Number(result?.user?.profile?.heat ?? previousHeat);
        mergeServerUser(result.user);
        return {
          id: Date.now(),
          hpGain: Math.max(0, nextHp - previousHp),
          heatDrop: Math.max(0, previousHeat - nextHeat),
          cost: Number(HOSPITAL_RULES.healCost || 0),
        };
      } catch (error) {
        pushLog(error.message);
        return false;
      }
    }
    if (game.player.cash < HOSPITAL_RULES.healCost) {
      pushLog("Brakuje kasy na lekarza.");
      return false;
    }
    const nextHp = clamp(game.player.hp + HOSPITAL_RULES.healHp, 0, game.player.maxHp);
    const nextHeat = clamp(game.player.heat - HOSPITAL_RULES.healHeatReduction, 0, 100);
    setGame((prev) => ({
      ...prev,
      player: {
        ...prev.player,
        cash: prev.player.cash - HOSPITAL_RULES.healCost,
        hp: clamp(prev.player.hp + HOSPITAL_RULES.healHp, 0, prev.player.maxHp),
        heat: clamp(prev.player.heat - HOSPITAL_RULES.healHeatReduction, 0, 100),
      },
      stats: {
        ...prev.stats,
        hospitalHeals: Number(prev.stats?.hospitalHeals || 0) + 1,
      },
      log: ["Lekarz poskladal Cie do kupy. Wracasz do gry.", ...prev.log].slice(0, 16),
    }));
    return {
      id: Date.now(),
      hpGain: Math.max(0, nextHp - previousHp),
      heatDrop: Math.max(0, previousHeat - nextHeat),
      cost: Number(HOSPITAL_RULES.healCost || 0),
    };
  };

  const moveToPrivateClinic = async () => {
    if (!criticalCareStatus.active) {
      pushLog("Nie jestes teraz w stanie krytycznym.");
      return false;
    }
    if (hasOnlineAuthority) {
      try {
        const result = await choosePrivateClinicOnline(sessionToken);
        mergeServerUser(result.user);
        pushLog(result?.result?.logMessage || "Prywatna klinika bierze Cie od razu.");
        return {
          id: Date.now(),
          cost: Number(result?.result?.price || 0),
          remainingMs: Number(result?.result?.status?.remainingMs || result?.result?.mode?.durationMs || CRITICAL_CARE_RULES.private.durationMs),
        };
      } catch (error) {
        pushLog(error.message);
        return false;
      }
    }
    pushLog("Prywatna klinika w tej wersji dziala tylko online.");
    return false;
  };

  const startFightClubRun = async (modeId, styleId) => {
    if (!canDoStreetAction("Arena nie dziala zza krat.")) return false;
    if (!canDoCriticalAction("Arena")) return false;
    if (!hasOnlineAuthority) {
      pushLog("Arena dziala teraz przez backend. Odpal lokalne API albo wejdz online.");
      return false;
    }

    try {
      const result = await startFightClubRunOnline(sessionToken, modeId, styleId);
      mergeServerUser(result.user);
      pushLog(result?.result?.logMessage || "Wchodzisz na ring.");
      if (result?.result?.rewardWindow?.rewardReduced) {
        showExplicitNotice({
          tone: "warning",
          title: "ARENA NA PRZYCISZENIU",
          message: "Pelna pula runow jest juz wybita. Dalej mozesz walczyc, ale tokeny i kasa schodza na nizszy mnoznik.",
        });
      }
      return result;
    } catch (error) {
      pushLog(error.message);
      return false;
    }
  };

  const resolveFightClubRun = async () => {
    if (!canDoStreetAction("Arena nie dziala zza krat.")) return false;
    if (!canDoCriticalAction("Arena")) return false;
    if (!hasOnlineAuthority) {
      pushLog("Arena dziala teraz przez backend. Odpal lokalne API albo wejdz online.");
      return false;
    }

    try {
      const result = await resolveFightClubRunOnline(sessionToken);
      mergeServerUser(result.user);
      const runFinished = Boolean(result?.result?.finished);
      const wonFight = Boolean(result?.result?.success);
      showExplicitNotice({
        tone: wonFight ? "success" : "warning",
        title: runFinished ? (wonFight ? "RUN DOMKNIETY" : "RUN SKONCZONY") : wonFight ? "RUN IDZIE DALEJ" : "RING CIE ZLOMIL",
        message: result?.result?.logMessage || "Arena rozliczona przez backend.",
      });
      return result;
    } catch (error) {
      pushLog(error.message);
      return false;
    }
  };

  const buyFightClubBoost = async (boostId) => {
    if (!hasOnlineAuthority) {
      pushLog("Boosty Areny sa backend-authoritative. Odpal lokalne API albo wejdz online.");
      return false;
    }

    try {
      const result = await buyFightClubBoostOnline(sessionToken, boostId);
      mergeServerUser(result.user);
      showExplicitNotice({
        tone: "success",
        title: "BOOST Z ARENY",
        message: result?.result?.logMessage || "Boost wpada na aktywne.",
      });
      return result;
    } catch (error) {
      pushLog(error.message);
      return false;
    }
  };

  const applyJail = (seconds, reason) => {
    setGame((prev) => ({
      ...prev,
      player: {
        ...prev.player,
        jailUntil: Date.now() + seconds * 1000,
      },
      log: [`Wpadka. Trafiasz do wiezienia za ${Math.ceil(seconds / 60)} min. Powod: ${reason}.`, ...prev.log].slice(0, 16),
    }));
    setActiveSection("heists", "prison");
  };

  const bribeOutOfJail = async () => {
    if (sessionToken && apiStatus === "online") {
      try {
        const result = await bribeOutOfJailOnline(sessionToken);
        mergeServerUser(result.user);
        return;
      } catch (error) {
        pushLog(error.message);
        return;
      }
    }
    if (!inJail(game.player)) return pushLog("Nie siedzisz teraz za kratami.");
    const price = 400 + Math.ceil(jailRemaining / 1000) * 8;
    if (game.player.cash < price) return pushLog(`Brakuje ${formatMoney(price)} na kaucje.`);
    updateLocalPlayer(
      {
        cash: game.player.cash - price,
        jailUntil: null,
        heat: clamp(game.player.heat + 5, 0, 100),
      },
      `Zaplacono ${formatMoney(price)} i wyszedles przed terminem.`
    );
  };

  // TODO: TO_MIGRATE_TO_SERVER - fallback solo heist roll/reward only exists for offline demo; online economy must stay server-authoritative
  const executeHeist = async (heist) => {
    if (!heist?.id) return pushLog("Ten napad nie jest teraz gotowy. Odswiez ekran i sprobuj jeszcze raz.");
    if (!canDoStreetAction()) return;
    if (!canDoCriticalAction("Napady")) return;
    if (game.player.respect < heist.respect) return pushLog(`Masz za niski szacunek. Wymagany szacunek: ${heist.respect}.`);
    if (game.player.energy < heist.energy) return pushLog(`Brakuje energii. Potrzebujesz ${heist.energy}.`);

    if (sessionToken && apiStatus === "online") {
      try {
        const result = await executeHeistOnline(sessionToken, heist.id);
        mergeServerUser(result.user);
        if (result?.jailed || inJail(result?.user?.profile || {})) {
          setActiveSection("heists", "prison");
        }
        return;
      } catch (error) {
        pushLog(error.message);
        return;
      }
    }

    const { chance, jailChance } = getSoloHeistOdds(game.player, effectivePlayer, game.gang, heist, game.activeBoosts);

    if (Math.random() < chance) {
      const gain = randomBetween(heist.reward[0], heist.reward[1]);
      const xpGain = randomBetween(heist.xpGain[0], heist.xpGain[1]);
      setGame((prev) => ({
        ...prev,
        player: applyProgressionToPlayer(
          {
            ...prev.player,
            cash: prev.player.cash + gain,
            energy: prev.player.energy - heist.energy,
            heat: clamp(prev.player.heat + Math.ceil(heist.risk * 14), 0, 100),
          },
          xpGain
        ).player,
        stats: {
          ...prev.stats,
          heistsDone: prev.stats.heistsDone + 1,
          heistsWon: prev.stats.heistsWon + 1,
          totalEarned: prev.stats.totalEarned + gain,
        },
        log: [`Napad udany: ${heist.name}. Wpada ${formatMoney(gain)} i +${xpGain} XP.`, ...prev.log].slice(0, 16),
      }));
      return;
    }

    const loss = randomBetween(Math.floor(heist.reward[0] * 0.22), Math.floor(heist.reward[0] * 0.5));
    const damage = randomBetween(10, 26);

    setGame((prev) => ({
      ...prev,
      player: {
        ...prev.player,
        cash: clamp(prev.player.cash - loss, 0, 999999999),
        hp: clamp(prev.player.hp - damage, 0, prev.player.maxHp),
        energy: prev.player.energy - heist.energy,
        heat: clamp(prev.player.heat + Math.ceil(heist.risk * 22), 0, 100),
      },
      stats: { ...prev.stats, heistsDone: prev.stats.heistsDone + 1 },
      log: [`Wtopa na akcji: ${heist.name}. Tracisz ${formatMoney(loss)} i ${damage} HP.`, ...prev.log].slice(0, 16),
    }));

    if (Math.random() < jailChance) {
      const sentence = 90 + heist.energy * 55 + Math.round(heist.risk * 360) + heist.respect * 4 + Math.round(game.player.heat * 1.5);
      applyJail(sentence, heist.name);
    }
  };

  const buyContractItem = async (item) => {
    if (!item?.id) return pushLog("Ten item nie jest teraz gotowy do kupna.");
    if (!canDoStreetAction()) return;

    if (hasOnlineAuthority) {
      try {
        const result = await buyContractItemOnline(sessionToken, item.id);
        mergeServerUser(result.user, result);
        showExplicitNotice({
          tone: "success",
          title: "ITEM KUPIONY",
          message: result?.result?.logMessage || `${item.name} wpada do ekwipunku kontraktowego.`,
          deltas: null,
        });
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }

    if (!requireOfflineDemoAuthority("Kupowanie itemow kontraktowych")) return;
    if (game.player.respect < item.respect) return pushLog(`Ten item odpala sie od ${item.respect} szacunu.`);
    if (game.player.cash < item.price) return pushLog(`Brakuje ${formatMoney(item.price)} na ${item.name}.`);
    if (contractState.ownedItems?.[item.id]) return pushLog("Masz juz ten item.");

    setGame((prev) => ({
      ...prev,
      player: { ...prev.player, cash: prev.player.cash - item.price },
      contracts: normalizeContractState({
        ...prev.contracts,
        ownedItems: {
          ...(prev.contracts?.ownedItems || {}),
          [item.id]: 1,
        },
      }),
      log: [`Kupujesz ${item.name}. Sprzet jest gotowy pod kontrakty.`, ...prev.log].slice(0, 16),
    }));
  };

  const buyContractCar = async (car) => {
    if (!car?.id) return pushLog("To auto nie jest teraz gotowe do kupna.");
    if (!canDoStreetAction()) return;

    if (hasOnlineAuthority) {
      try {
        const result = await buyContractCarOnline(sessionToken, car.id);
        mergeServerUser(result.user, result);
        showExplicitNotice({
          tone: "success",
          title: "AUTO W GARAZU",
          message: result?.result?.logMessage || `${car.name} wskakuje do garazu kontraktowego.`,
          deltas: null,
        });
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }

    if (!requireOfflineDemoAuthority("Kupowanie aut kontraktowych")) return;
    if (game.player.respect < car.respect) return pushLog(`To auto odpala sie od ${car.respect} szacunu.`);
    if (game.player.cash < car.price) return pushLog(`Brakuje ${formatMoney(car.price)} na ${car.name}.`);
    if (contractState.ownedCars?.[car.id]) return pushLog("To auto juz stoi w Twoim garazu.");

    setGame((prev) => ({
      ...prev,
      player: { ...prev.player, cash: prev.player.cash - car.price },
      contracts: normalizeContractState({
        ...prev.contracts,
        ownedCars: {
          ...(prev.contracts?.ownedCars || {}),
          [car.id]: 1,
        },
      }),
      log: [`Garaz lapie ${car.name}.`, ...prev.log].slice(0, 16),
    }));
  };

  const equipContractAsset = async (slotId, assetId = null) => {
    const slotLabel = CONTRACT_LOADOUT_SLOTS.find((entry) => entry.id === slotId)?.label || slotId;

    if (hasOnlineAuthority) {
      try {
        const result = await equipContractLoadoutOnline(sessionToken, slotId, assetId);
        mergeServerUser(result.user, result);
        showExplicitNotice({
          tone: "success",
          title: assetId ? "LOADOUT USTAWIONY" : "SLOT WYCZYSZCZONY",
          message: result?.result?.logMessage || `${slotLabel} jest juz ustawiony.`,
          deltas: null,
        });
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }

    if (!requireOfflineDemoAuthority("Loadout kontraktowy")) return;
    if (!assetId) {
      setGame((prev) => ({
        ...prev,
        contracts: normalizeContractState({
          ...prev.contracts,
          loadout: {
            ...(prev.contracts?.loadout || {}),
            [slotId]: null,
          },
        }),
        log: [`Czyscisz slot ${slotLabel}.`, ...prev.log].slice(0, 16),
      }));
      return;
    }

    if (slotId === "car") {
      const car = getContractCarById(assetId);
      if (!car) return pushLog("Nie ma takiego auta.");
      if (!contractState.ownedCars?.[car.id]) return pushLog(`Najpierw kup ${car.name}.`);
      setGame((prev) => ({
        ...prev,
        contracts: normalizeContractState({
          ...prev.contracts,
          loadout: {
            ...(prev.contracts?.loadout || {}),
            car: car.id,
          },
        }),
        log: [`${car.name} wchodzi do loadoutu kontraktowego.`, ...prev.log].slice(0, 16),
      }));
      return;
    }

    const item = getContractItemById(assetId);
    if (!item) return pushLog("Nie ma takiego itemu.");
    if (item.category !== slotId) return pushLog(`To nie pasuje do slotu ${slotLabel}.`);
    if (!contractState.ownedItems?.[item.id]) return pushLog(`Najpierw kup ${item.name}.`);

    setGame((prev) => ({
      ...prev,
      contracts: normalizeContractState({
        ...prev.contracts,
        loadout: {
          ...(prev.contracts?.loadout || {}),
          [slotId]: item.id,
        },
      }),
      log: [`${item.name} siedzi teraz w slocie ${slotLabel}.`, ...prev.log].slice(0, 16),
    }));
  };

  const executeContract = async (contract) => {
    if (!contract?.id) return pushLog("Ten kontrakt nie jest teraz gotowy.");
    if (!canDoStreetAction()) return;
    if (!canDoCriticalAction("Kontrakty")) return;

    if (hasOnlineAuthority) {
      try {
        const result = await executeContractOnline(sessionToken, contract.id);
        mergeServerUser(result.user, result);
        const contractResult = result?.result || {};
        showExplicitNotice({
          tone: contractResult.success ? "success" : "danger",
          title: contractResult.success ? "KONTRAKT SIADL" : "KONTRAKT SPALONY",
          message: contractResult.logMessage || contract.name,
          deltas: null,
        });
        if (contractResult.jailed || inJail(result?.user?.profile || {})) {
          setActiveSection("heists", "prison");
        }
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }

    if (!requireOfflineDemoAuthority("Kontrakty")) return;
    if (game.player.respect < contract.respect) return pushLog(`Ten kontrakt odpala sie od ${contract.respect} szacunu.`);
    if (game.player.energy < contract.energyCost) return pushLog(`Potrzebujesz ${contract.energyCost} energii.`);
    if (game.player.cash < contract.entryCost) return pushLog(`Brakuje ${formatMoney(contract.entryCost)} na wejscie.`);
    if (!contractBoard.active.some((entry) => entry.id === contract.id)) {
      return pushLog("Ten kontrakt wypadl juz z tablicy. Poczekaj na kolejna rotacje.");
    }

    const districtSummary = districtSummaries.find((entry) => entry.id === contract.districtId) || null;
    if (districtSummary?.pressureState?.id === "lockdown") {
      return pushLog(`Ta dzielnica siedzi w lockdownie. ${contract.name} musi poczekac.`);
    }

    const preview = getContractOutcomePreview({
      contract,
      profile: effectivePlayer,
      contractState,
      activeBoosts: game.activeBoosts,
      districtSummary,
    });
    if (!preview) return pushLog("Nie udalo sie policzyc kontraktu.");

    const success = Math.random() < Number(preview.successChance || 0.06);
    const baseReward = randomBetween(contract.baseReward[0], contract.baseReward[1]);
    const entryCost = Number(contract.entryCost || 0);

    if (success) {
      const reward = Math.max(0, Math.floor(baseReward * Number(preview.rewardMultiplier || 1)));
      const nextPlayer = applyProgressionToPlayer(
        {
          ...game.player,
          cash: game.player.cash - entryCost + reward,
          energy: game.player.energy - contract.energyCost,
          heat: clamp(game.player.heat + Number(preview.heatGain || 0), 0, 100),
        },
        Number(contract.xpGain || 0)
      ).player;
      const historyEntry = {
        id: `contract-${contract.id}-${Date.now()}`,
        contractId: contract.id,
        name: contract.name,
        success: true,
        reward,
        entryCost,
        damage: 0,
        heatGain: Number(preview.heatGain || 0),
        jailed: false,
        jailSeconds: 0,
        time: Date.now(),
      };

      setGame((prev) => {
        const nextContracts = normalizeContractState({
          ...prev.contracts,
          history: [historyEntry, ...(prev.contracts?.history || [])].slice(0, ECONOMY_RULES.contracts.maxHistoryEntries || 10),
        });
        return {
          ...prev,
          player: nextPlayer,
          contracts: nextContracts,
          contractBoard: {
            ...normalizeContractBoardSnapshot(prev.contractBoard, nextContracts.history),
            history: nextContracts.history.slice(0, 6),
          },
          stats: {
            ...prev.stats,
            totalEarned: Number(prev.stats.totalEarned || 0) + reward,
          },
          log: [`Kontrakt siada: ${contract.name}. Wpada ${formatMoney(reward)}.`, ...prev.log].slice(0, 16),
        };
      });

      showExplicitNotice({
        tone: "success",
        title: "KONTRAKT SIADL",
        message: `${contract.name} siada. Wpada ${formatMoney(reward)} po koszcie ${formatMoney(entryCost)}.`,
        deltas: null,
      });
      return;
    }

    const failDamage = Math.max(
      4,
      Math.round(randomBetween(contract.hpLoss[0], contract.hpLoss[1]) * Number(preview.failDamageMultiplier || 1))
    );
    const extraLoss = Math.max(
      0,
      Math.round(
        entryCost *
          Number(ECONOMY_RULES.contracts.failExtraCostRate || 0.2) *
          clamp(
            1 - Number(preview.loadout?.protection || 0) * 0.45 - Number(preview.loadout?.retention || 0) * 0.25,
            0.55,
            1.05
          )
      )
    );
    const jailSeconds = Math.random() < Number(preview.jailChanceOnFail || 0.1) ? randomBetween(180, 420) : 0;
    const historyEntry = {
      id: `contract-${contract.id}-${Date.now()}`,
      contractId: contract.id,
      name: contract.name,
      success: false,
      reward: 0,
      entryCost: entryCost + extraLoss,
      damage: failDamage,
      heatGain: Number(preview.heatGain || 0) + 4,
      jailed: jailSeconds > 0,
      jailSeconds,
      time: Date.now(),
    };

    setGame((prev) => {
      const nextContracts = normalizeContractState({
        ...prev.contracts,
        history: [historyEntry, ...(prev.contracts?.history || [])].slice(0, ECONOMY_RULES.contracts.maxHistoryEntries || 10),
      });
      return {
        ...prev,
        player: {
          ...prev.player,
          cash: Math.max(0, Number(prev.player.cash || 0) - entryCost - extraLoss),
          energy: Math.max(0, Number(prev.player.energy || 0) - Number(contract.energyCost || 0)),
          hp: clamp(Number(prev.player.hp || 0) - failDamage, 0, Number(prev.player.maxHp || 100)),
          heat: clamp(Number(prev.player.heat || 0) + Number(preview.heatGain || 0) + 4, 0, 100),
          jailUntil: jailSeconds > 0 ? Math.max(Number(prev.player.jailUntil || 0), Date.now() + jailSeconds * 1000) : prev.player.jailUntil,
        },
        contracts: nextContracts,
        contractBoard: {
          ...normalizeContractBoardSnapshot(prev.contractBoard, nextContracts.history),
          history: nextContracts.history.slice(0, 6),
        },
        log: [`Kontrakt spalony: ${contract.name}. Leci ${formatMoney(entryCost + extraLoss)} i ${failDamage} HP.`, ...prev.log].slice(0, 16),
      };
    });

    showExplicitNotice({
      tone: "danger",
      title: "KONTRAKT SPALONY",
      message:
        jailSeconds > 0
          ? `${contract.name} pali kase i konczysz za kratami.`
          : `${contract.name} nie siada. Tracisz wejscie, doplate i zdrowie.`,
      deltas: null,
    });
    if (jailSeconds > 0) {
      setActiveSection("heists", "prison");
    }
  };

  const openGangHeistLobby = async (heist) => {
    if (!canDoStreetAction()) return;
    if (!canDoCriticalAction("Napady gangu")) return;
    if (!game.gang.joined) return pushLog("Najpierw musisz byc w gangu.");
    if (!canRunGangHeistRole(game.gang.role)) return pushLog("Lobby napadu otwiera Boss, Vice Boss albo Zaufany.");
    if (game.gang.activeHeistLobby?.status === "open") return pushLog("Gang ma juz otwarte jedno lobby napadu.");

    if (hasOnlineAuthority) {
      try {
        const result = await openGangHeistLobbyOnline(sessionToken, heist.id, gangHeistNoteDraft);
        mergeServerUser(result.user, result);
        setGangHeistNoteDraft("");
        pushLog(result?.result?.logMessage || `Lobby pod ${heist.name} stoi otwarte.`);
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }

    if (!requireOfflineDemoAuthority("Lobby napadu gangu")) return;
    const selfId =
      selfGangMember?.id ||
      game.player.id ||
      `self-gang-${String(game.player.name || "player").trim().toLowerCase()}`;
    const summary = getGangHeistSquadSummary(
      [{ profile: game.player, effectiveProfile: effectivePlayer }],
      heist,
      game.gang
    );

    setGame((prev) => ({
      ...prev,
      gang: normalizeGangState({
        ...prev.gang,
        activeHeistLobby: {
          id: `gang-lobby-${heist.id}-${Date.now()}`,
          heistId: heist.id,
          status: "open",
          note: String(gangHeistNoteDraft || "").trim().slice(0, 140),
          openedByUserId: selfId,
          openedByName: prev.player.name,
          participantIds: [selfId],
          requiredMembers: heist.minMembers,
          createdAt: Date.now(),
          chance: summary.chance,
          squadPower: summary.totalPower,
          summary,
        },
      }),
      log: [`Otwierasz lobby pod ${heist.name}.`, ...prev.log].slice(0, 16),
    }));
    setGangHeistNoteDraft("");
  };

  const joinGangHeistLobby = async (heist) => {
    if (!canDoStreetAction()) return;
    if (!canDoCriticalAction("Napady gangu")) return;
    if (!game.gang.joined) return pushLog("Najpierw musisz byc w gangu.");
    if (!activeGangHeistLobby) return pushLog("Nie ma teraz otwartego lobby.");

    if (hasOnlineAuthority) {
      try {
        const result = await joinGangHeistLobbyOnline(sessionToken, heist.id);
        mergeServerUser(result.user, result);
        pushLog(result?.result?.logMessage || `Wbijasz do skladu pod ${heist.name}.`);
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }

    if (!requireOfflineDemoAuthority("Dolaczenie do lobby gangu")) return;
    if (isInActiveGangHeistLobby) return pushLog("W demo juz siedzisz w tym lobby.");
    pushLog("W demo lobby najlepiej testowac online na prawdziwym skladzie.");
  };

  const leaveGangHeistLobby = async (heist) => {
    if (!game.gang.joined) return pushLog("Najpierw musisz byc w gangu.");
    if (!activeGangHeistLobby) return pushLog("Nie ma teraz otwartego lobby.");

    if (hasOnlineAuthority) {
      try {
        const result = await leaveGangHeistLobbyOnline(sessionToken, heist.id);
        mergeServerUser(result.user, result);
        pushLog(result?.result?.logMessage || `Schodzisz z lobby ${heist.name}.`);
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }

    if (!requireOfflineDemoAuthority("Zejscie z lobby gangu")) return;
    const selfId = selfGangMember?.id || game.player.id;
    const nextIds = (activeGangHeistLobby.participantIds || []).filter((entry) => entry !== selfId);
    setGame((prev) => ({
      ...prev,
      gang: normalizeGangState({
        ...prev.gang,
        activeHeistLobby: nextIds.length
          ? {
              ...prev.gang.activeHeistLobby,
              participantIds: nextIds,
            }
          : null,
      }),
      log: [`Schodzisz z lobby ${heist.name}.`, ...prev.log].slice(0, 16),
    }));
  };

  const startGangHeistLobby = async (heist) => {
    if (!canDoStreetAction()) return;
    if (!canDoCriticalAction("Napady gangu")) return;
    if (!game.gang.joined) return pushLog("Najpierw musisz byc w gangu.");
    if (!activeGangHeistLobby) return pushLog("Najpierw otworz lobby i zbierz sklad.");
    if (!canRunGangHeistRole(game.gang.role)) return pushLog("Start odpala Boss, Vice Boss albo Zaufany.");

    if (hasOnlineAuthority) {
      try {
        const result = await startGangHeistLobbyOnline(sessionToken, heist.id);
        mergeServerUser(result.user, result);
        const report = result?.result?.report;
        showExplicitNotice({
          tone: report?.success ? "success" : "danger",
          title: report?.success ? "NAPAD SIADL" : "NAPAD SPALONY",
          message: result?.result?.logMessage || result?.result?.message || heist.name,
          deltas: null,
        });
        pushLog(result?.result?.logMessage || result?.result?.message || `Startujesz ${heist.name}.`);
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }

    if (!requireOfflineDemoAuthority("Start napadu gangu")) return;
    if (game.gang.members < heist.minMembers) return pushLog(`Ten napad wymaga ${heist.minMembers} ludzi w ekipie.`);
    if (game.gang.members - game.gang.jailedCrew < heist.minMembers) return pushLog("Za duzo ludzi siedzi. Nie masz pelnego skladu do tej roboty.");
    if (game.player.energy < heist.energy) return pushLog(`Potrzebujesz ${heist.energy} energii.`);

    const lobbySummary = activeGangHeistLobby?.summary || getGangHeistSquadSummary(
      [{ profile: game.player, effectiveProfile: effectivePlayer }],
      heist,
      game.gang
    );
    const chance = Number(lobbySummary?.chance || 0.08);
    const participants = Math.max(
      heist.minMembers,
      Array.isArray(activeGangHeistLobby?.participantIds) ? activeGangHeistLobby.participantIds.length : 1
    );

    if (Math.random() < chance) {
      const gangBonusRate = getGangHeistBonusRate(game.gang);
      const gain = Math.floor((randomBetween(heist.reward[0], heist.reward[1]) + Math.floor(game.gang.gearScore * 60)) * (1 + gangBonusRate));
      const vaultCut = Math.floor(gain * 0.1);
      const share = Math.max(600, Math.floor((gain - vaultCut) / participants));
      const xpGain = Math.max(7, randomBetween(Math.ceil(heist.minMembers * 2.5), heist.minMembers * 4));
      const participantReport = [
        {
          userId: selfGangMember?.id || game.player.id || "self",
          name: game.player.name,
          cash: share,
          xp: xpGain,
          jailed: false,
          heat: Math.ceil(heist.risk * 18),
          hpLoss: 0,
        },
      ];
      setGame((prev) => ({
        ...prev,
        player: applyProgressionToPlayer(
          {
            ...prev.player,
            cash: prev.player.cash + share,
            energy: prev.player.energy - heist.energy,
            heat: clamp(prev.player.heat + Math.ceil(heist.risk * 18), 0, 100),
          },
          xpGain
        ).player,
        gang: normalizeGangState({
          ...prev.gang,
          activeHeistLobby: null,
          lastHeistReport: {
            id: `offline-gang-heist-${heist.id}-${Date.now()}`,
            heistId: heist.id,
            heistName: heist.name,
            success: true,
            districtId: heist.districtId,
            createdAt: Date.now(),
            totalTake: gain,
            vaultCut,
            teamChance: chance,
            incident: "Robota siadla w trybie demo.",
            participants: participantReport,
            jailedParticipantIds: [],
            rescueAttemptedAt: null,
            rescueResolvedAt: null,
            rescueMode: null,
            rescueSuccess: null,
          },
          vault: prev.gang.vault + vaultCut,
          influence: prev.gang.influence + 2,
          territory: prev.gang.territory + (Math.random() < 0.25 ? 1 : 0),
          gearScore: clamp(prev.gang.gearScore - randomBetween(1, 3) + 1, 28, 100),
          chat: [{ id: `gang-${Date.now()}`, author: "System", text: `Napad gangu udany: ${heist.name}. Dzialka na leb: ${formatMoney(share)}.`, time: nowTimeLabel() }, ...prev.gang.chat].slice(0, 20),
        }),
        stats: {
          ...prev.stats,
          gangHeistsWon: prev.stats.gangHeistsWon + 1,
          totalEarned: prev.stats.totalEarned + gain,
        },
        log: [`Napad gangu udany: ${heist.name}. Uczestnikow ${participants}, Twoja dzialka ${formatMoney(share)} i +${xpGain} XP.`, ...prev.log].slice(0, 16),
      }));
      return;
    }

    const jailedCrew = Math.min(game.gang.members - 1, randomBetween(1, Math.max(1, Math.ceil(heist.minMembers / 2))));
    const gearLoss = randomBetween(6, 14);
    const jailUntil = Date.now() + (150 + heist.energy * 45) * 1000;
    const participantReport = [
      {
        userId: selfGangMember?.id || game.player.id || "self",
        name: game.player.name,
        cash: 0,
        xp: 0,
        jailed: Math.random() < heist.risk * 0.7,
        heat: Math.ceil(heist.risk * 26),
        hpLoss: 16,
      },
    ];
    const jailedIds = participantReport.filter((entry) => entry.jailed).map((entry) => entry.userId);
    setGame((prev) => ({
      ...prev,
      player: {
        ...prev.player,
        energy: prev.player.energy - heist.energy,
        hp: clamp(prev.player.hp - 16, 0, prev.player.maxHp),
        heat: clamp(prev.player.heat + Math.ceil(heist.risk * 26), 0, 100),
        jailUntil: participantReport[0]?.jailed ? jailUntil : prev.player.jailUntil,
      },
      gang: normalizeGangState({
        ...prev.gang,
        activeHeistLobby: null,
        lastHeistReport: {
          id: `offline-gang-heist-${heist.id}-${Date.now()}`,
          heistId: heist.id,
          heistName: heist.name,
          success: false,
          districtId: heist.districtId,
          createdAt: Date.now(),
          totalTake: 0,
          vaultCut: 0,
          teamChance: chance,
          incident: jailedIds.length ? "Wtopa na robocie. Czesci skladu grozi cela." : "Wtopa na robocie. Ekipa schodzi poobijana.",
          participants: participantReport,
          jailedParticipantIds: jailedIds,
          rescueAttemptedAt: null,
          rescueResolvedAt: null,
          rescueMode: null,
          rescueSuccess: null,
        },
        vault: clamp(prev.gang.vault - Math.floor(heist.reward[0] * 0.2), 0, 999999999),
        gearScore: clamp(prev.gang.gearScore - gearLoss, 18, 100),
        jailedCrew: clamp(prev.gang.jailedCrew + jailedCrew, 0, prev.gang.members - 1),
        crewLockdownUntil: jailUntil,
        chat: [{ id: `gang-${Date.now()}`, author: "System", text: `Wtopa na robocie: ${heist.name}. Siedzi ${jailedCrew} ludzi, sprzet spalony.`, time: nowTimeLabel() }, ...prev.gang.chat].slice(0, 20),
      }),
      log: [`Napad gangu nie siadl: ${heist.name}. Siada ${jailedCrew} ludzi i leci ${gearLoss} pkt sprzetu.`, ...prev.log].slice(0, 16),
    }));
  };

  const upgradeGangMembers = async () => {
    if (!game.gang.joined) return pushLog("Najpierw musisz miec gang.");
    if (game.gang.role !== "Boss") return pushLog("Rozbudowe skladu kupuje tylko Boss.");
    if (!nextGangMemberCapUpgrade) return pushLog("Gang ma juz wbity maksymalny sklad.");

    if (hasOnlineAuthority) {
      try {
        const result = await upgradeGangMembersOnline(sessionToken);
        mergeServerUser(result.user, result);
        showExplicitNotice({
          tone: "success",
          title: "ROZBUDOWA GANGU",
          message: result?.result?.logMessage || `Gang wskakuje na ${result?.result?.maxMembers || game.gang.maxMembers} slotow.`,
          deltas: null,
        });
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }

    if (!requireOfflineDemoAuthority("Rozbudowa gangu")) return;
    if (game.gang.vault < nextGangMemberCapUpgrade.cost) {
      return pushLog(`Brakuje ${formatMoney(nextGangMemberCapUpgrade.cost)} w skarbcu.`);
    }
    setGame((prev) => ({
      ...prev,
      gang: normalizeGangState({
        ...prev.gang,
        memberCapLevel: nextGangMemberCapUpgrade.level,
        maxMembers: nextGangMemberCapUpgrade.maxMembers,
        vault: Math.max(0, Number(prev.gang.vault || 0) - Number(nextGangMemberCapUpgrade.cost || 0)),
      }),
      log: [`Rozbudowujesz gang do ${nextGangMemberCapUpgrade.maxMembers} slotow.`, ...prev.log].slice(0, 16),
    }));
  };

  const rescueGangCrew = async (optionId) => {
    if (!pendingGangRescue) return pushLog("Nie ma teraz ekipy do wyciagniecia.");
    if (!canRunGangHeistRole(game.gang.role)) return pushLog("Pomoc po wtapie odpala Boss, Vice Boss albo Zaufany.");

    if (hasOnlineAuthority) {
      try {
        const result = await rescueGangHeistCrewOnline(sessionToken, optionId);
        mergeServerUser(result.user, result);
        showExplicitNotice({
          tone: result?.result?.success ? "success" : "danger",
          title: result?.result?.success ? "EKIPA ODBITA" : "RATUNEK SPALONY",
          message: result?.result?.logMessage || "Gang probuje wyciagnac swoich.",
          deltas: null,
        });
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }

    if (!requireOfflineDemoAuthority("Ratunek po wtapie")) return;
    pushLog("Ratunek po wtapie jest liczony w pelni online.");
  };

  // TODO: TO_MIGRATE_TO_SERVER - business purchase cost, unlock validation and empire scaling should be stored server-side
  const buyBusiness = async (business) => {
    if (!canDoStreetAction()) return;
    if (sessionToken && apiStatus === "online") {
      try {
        const result = await buyBusinessOnline(sessionToken, business.id);
        mergeServerUser(result.user);
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }
    if (!requireOfflineDemoAuthority("Kupowanie biznesow")) return;
    if (game.player.respect < business.respect) return pushLog(`Masz za niski szacunek. Wymagany szacunek: ${business.respect}.`);
    if (game.player.cash < business.cost) return pushLog(`Za malo gotowki na ${business.name}.`);

    setGame((prev) => {
      const owned = prev.businessesOwned.find((entry) => entry.id === business.id);
      const businessesOwned = owned
        ? prev.businessesOwned.map((entry) => (entry.id === business.id ? { ...entry, count: entry.count + 1 } : entry))
        : [...prev.businessesOwned, { id: business.id, count: 1 }];

      return {
        ...prev,
        player: { ...prev.player, cash: prev.player.cash - business.cost, rank: getRankTitle(prev.player.respect) },
        gang: { ...prev.gang, influence: prev.gang.influence + 2, territory: prev.gang.territory + (business.kind === "imperium" ? 1 : 0) },
        businessesOwned,
        log: [`Kupiono ${business.name}. Imperium zaczyna drukowac pieniadz.`, ...prev.log].slice(0, 16),
      };
    });
  };

  const upgradeBusiness = async (business, path) => {
    if (!canDoStreetAction()) return;
    const safePath = path === "speed" ? "speed" : "cash";
    if (sessionToken && apiStatus === "online") {
      try {
        const result = await upgradeBusinessOnline(sessionToken, business.id, safePath);
        mergeServerUser(result.user);
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }
    const owned = game.businessesOwned.find((entry) => entry.id === business.id);
    if (!owned?.count) return pushLog("Najpierw musisz miec ten biznes.");
    const cost = getBusinessUpgradeCost(game, business, safePath);
    if (game.player.cash < cost) return pushLog(`Brakuje ${formatMoney(cost)} na upgrade ${business.name}.`);

    setGame((prev) => {
      const current = getBusinessUpgradeState(prev, business.id);
      return {
        ...prev,
        player: { ...prev.player, cash: prev.player.cash - cost },
        businessUpgrades: {
          ...(prev.businessUpgrades || {}),
          [business.id]:
            safePath === "speed"
              ? { speedLevel: current.speedLevel + 1, cashLevel: current.cashLevel }
              : { speedLevel: current.speedLevel, cashLevel: current.cashLevel + 1 },
        },
        log: [
          `${business.name}: ${safePath === "speed" ? "szybszy obrot" : "grubsza koperta"} wszedl za ${formatMoney(cost)}.`,
          ...prev.log,
        ].slice(0, 16),
      };
    });
  };

  // TODO: TO_MIGRATE_TO_SERVER - passive business claim must come from server-side accrual and claim cap validation
  const collectBusinessIncome = async () => {
    if (sessionToken && apiStatus === "online") {
      try {
        const result = await collectBusinessIncomeOnline(sessionToken);
        mergeServerUser(result.user);
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }
    if (!requireOfflineDemoAuthority("Odbior biznesow")) return;
    const payout = Math.floor(game.collections?.businessCash || 0);
    if (payout <= 0) return pushLog("Na razie nie ma co zgarnac z biznesow.");

    setGame((prev) => ({
      ...prev,
      player: { ...prev.player, cash: prev.player.cash + payout },
      stats: {
        ...prev.stats,
        totalEarned: prev.stats.totalEarned + payout,
        businessCollections: Number(prev.stats?.businessCollections || 0) + 1,
      },
      collections: { ...prev.collections, businessCash: 0, businessCollectedAt: Date.now() },
      log: [`Zgarnales z biznesow ${formatMoney(payout)}. Skrytka znowu jest pusta.`, ...prev.log].slice(0, 16),
    }));
  };

  // TODO: TO_MIGRATE_TO_SERVER - street income claim, daily cap, anti-spam cooldown, district risk and heat scaling must be server-authoritative
  const collectEscortIncome = async () => {
    if (sessionToken && apiStatus === "online") {
      try {
        const result = await collectEscortIncomeOnline(sessionToken);
        mergeServerUser(result.user);
        return;
      } catch (error) {
        pushLog(error.message);
        return;
      }
    }

    if (!requireOfflineDemoAuthority("Odbior ulicy")) return;
    const payout = Math.floor(game.collections?.escortCash || 0);
    if (payout <= 0) return pushLog("Na razie ulica nic jeszcze nie oddala.");

    setGame((prev) => ({
      ...prev,
      player: { ...prev.player, cash: prev.player.cash + payout },
      stats: { ...prev.stats, totalEarned: prev.stats.totalEarned + payout },
      collections: {
        ...prev.collections,
        escortCash: 0,
        escortCollectedAt: Date.now(),
        escortAccruedAt: Date.now(),
      },
      log: [`Odebrales z ulicy ${formatMoney(payout)}. Dziewczyny rozliczone.`, ...prev.log].slice(0, 16),
    }));
  };

  // TODO: TO_MIGRATE_TO_SERVER - escort acquisition and scaling need server validation before real multiplayer launch
  const buyEscort = async (escort) => {
    if (!canDoStreetAction()) return;
    if (sessionToken && apiStatus === "online") {
      try {
        const result = await buyEscortOnline(sessionToken, escort.id);
        mergeServerUser(result.user);
        return;
      } catch (error) {
        pushLog(error.message);
        return;
      }
    }
    if (!requireOfflineDemoAuthority("Kupowanie kontaktow")) return;
    if (game.player.respect < escort.respect) return pushLog(`Ten kontakt odblokuje sie przy ${escort.respect} szacunu.`);
    if (game.player.cash < escort.cost) return pushLog(`Za malo gotowki na ${escort.name}.`);

    setGame((prev) => {
      const owned = prev.escortsOwned.find((entry) => entry.id === escort.id);
      const escortsOwned = owned
        ? prev.escortsOwned.map((entry) => (entry.id === escort.id ? { ...entry, count: entry.count + 1, working: getEscortWorkingCount(entry), routes: { ...getEscortRoutes(entry) } } : entry))
        : [...prev.escortsOwned, { id: escort.id, count: 1, working: 0, routes: {} }];

      return {
        ...prev,
        player: { ...prev.player, cash: prev.player.cash - escort.cost },
        escortsOwned,
        log: [`Kupiles kontakt: ${escort.name}. Teraz mozesz wystawic ja na ulice.`, ...prev.log].slice(0, 16),
      };
    });
  };

  const setClubNightPlan = (planId) => {
    if (!game.club.owned) return pushLog("Najpierw musisz miec swoj klub.");
    if (!insideOwnClub) return pushLog("Plan nocy ustawiasz tylko bedac fizycznie u siebie.");
    const nextPlan = getClubNightPlan(planId);
    if (game.club.nightPlanId === nextPlan.id) return;

      if (hasOnlineAuthority) {
        setClubPlanOnline(sessionToken, nextPlan.id)
          .then((result) => {
            mergeServerUser(result.user, { clubMarket: result.clubMarket });
            showExplicitNotice({
              tone: "success",
              title: "PLAN NOCY",
            message: result?.result?.logMessage || `${nextPlan.name}. ${nextPlan.summary}`,
            deltas: null,
          });
        })
        .catch((error) => pushLog(error.message));
      return;
    }

    if (!requireOfflineDemoAuthority("Plan nocy klubu")) return;

    setGame((prev) => {
      const nextClub = syncClubRuntimeState({
        ...prev.club,
        nightPlanId: nextPlan.id,
      });

      return {
        ...prev,
        club: nextClub,
        clubListings: syncClubListing(
          prev.clubListings,
          nextClub,
          prev.club.ownerLabel || getPlayerClubOwnerLabel(prev)
        ),
        log: [`Plan nocy ustawiony na ${nextPlan.name}. ${nextPlan.summary}`, ...prev.log].slice(0, 16),
      };
    });

    showExplicitNotice({
      tone: "success",
      title: "PLAN NOCY",
      message: `${nextPlan.name}. ${nextPlan.summary}`,
      deltas: null,
    });
  };

  const setClubEntryFee = async (entryFeeDraft) => {
    if (!game.club.owned) return pushLog("Najpierw musisz miec swoj klub.");
    if (!insideOwnClub) return pushLog("Wejsciowke ustawiasz tylko bedac u siebie.");
    const parsedEntryFee = Number.parseInt(String(entryFeeDraft ?? game.club.entryFee ?? 0).replace(/[^\d]/g, ""), 10);
    const entryFee = Math.max(0, Number.isFinite(parsedEntryFee) ? parsedEntryFee : 0);

    if (hasOnlineAuthority) {
      try {
        const result = await setClubSettingsOnline(sessionToken, { entryFee });
        mergeServerUser(result.user, { clubMarket: result.clubMarket });
        showExplicitNotice({
          tone: "success",
          title: "BRAMKA",
          message: result?.result?.logMessage || `Wejsciowka ustawiona na ${formatMoney(entryFee)}.`,
          deltas: null,
        });
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }

    if (!requireOfflineDemoAuthority("Ustawienia wejscia klubu")) return;

    setGame((prev) => {
      const nextClub = syncClubRuntimeState({
        ...prev.club,
        entryFee,
        recentIncident: {
          tone: "door",
          text: entryFee > 0 ? `Bramka ustawiona na ${entryFee}$.` : "Lista otwarta. Wejscie bez oplaty.",
          createdAt: Date.now(),
        },
      });

      return {
        ...prev,
        club: nextClub,
        clubListings: syncClubListing(
          prev.clubListings,
          nextClub,
          prev.club.ownerLabel || getPlayerClubOwnerLabel(prev)
        ),
        log: [
          entryFee > 0 ? `Bramka leci teraz po ${formatMoney(entryFee)}.` : "Lokal wpuszcza teraz bez oplaty.",
          ...prev.log,
        ].slice(0, 16),
      };
    });
  };

  const collectClubSafe = async () => {
    if (!game.club.owned) return pushLog("Najpierw musisz miec swoj klub.");
    if (!insideOwnClub) return pushLog("Sejf odbierasz tylko bedac u siebie.");

    if (hasOnlineAuthority) {
      try {
        const result = await collectClubSafeOnline(sessionToken);
        mergeServerUser(result.user, { clubMarket: result.clubMarket });
        showExplicitNotice({
          tone: "success",
          title: "SEJF KLUBU",
          message: result?.result?.logMessage || "Sejf klubu opróżniony.",
          deltas: null,
        });
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }

    if (!requireOfflineDemoAuthority("Sejf klubu")) return;
    const safeCash = Math.max(0, Math.floor(Number(game.club.safeCash || 0)));
    if (safeCash <= 0) return pushLog("Sejf jest pusty.");

    setGame((prev) => ({
      ...prev,
      player: { ...prev.player, cash: Number(prev.player.cash || 0) + safeCash },
      stats: { ...prev.stats, totalEarned: Number(prev.stats?.totalEarned || 0) + safeCash },
      club: {
        ...prev.club,
        safeCash: 0,
        lastReportSummary: prev.club?.lastReportSummary
          ? {
              ...prev.club.lastReportSummary,
              safeCash: 0,
              collectedAt: Date.now(),
              collectedAmount: safeCash,
            }
          : prev.club.lastReportSummary,
      },
      log: [`Wyciagasz z sejfu ${formatMoney(safeCash)}.`, ...prev.log].slice(0, 16),
    }));
  };

  const runClubVisitorAction = async (actionId) => {
    if (!canDoStreetAction()) return;
    if (!currentClubVenue) return pushLog("Najpierw wejdz do jakiegos klubu.");

    const action = CLUB_VISITOR_ACTIONS.find((entry) => entry.id === actionId);
    if (!action) return pushLog("Nie ma takiej akcji klubowej.");

    const cooldownRemaining = Math.max(
      0,
      (game.club.guestState?.lastActionAt || 0) + CLUB_SYSTEM_RULES.actionCooldownMs - Date.now()
    );
    if (cooldownRemaining > 0) {
      return pushLog(`Klub trzyma cooldown jeszcze przez ${formatCooldown(cooldownRemaining)}.`);
    }

    if (action.costCash > 0 && game.player.cash < action.costCash) {
      return pushLog(`Brakuje ${formatMoney(action.costCash)} na ${action.name}.`);
    }
    if (!insideOwnClub && !hasClubGuestAccess(game.club?.guestState, currentClubVenue.id, Date.now())) {
      return pushLog("Najpierw ogarnij wejscie do lokalu.");
    }

    if (action.id === "hunt") {
      const leadTarget = getLeadTargetEscortForVenue({
        playerRespect: game.player.respect,
        venue: currentClubVenue,
        planId:
          game.club.owned && game.club.sourceId === currentClubVenue.id
            ? game.club.nightPlanId
            : currentClubVenue.nightPlanId,
      });
      if (!leadTarget) {
        return pushLog("Na tym progu nie ma jeszcze sensownych kontaktow do namierzenia.");
      }
    }

    if (sessionToken && apiStatus === "online") {
      try {
        const response = await performClubActionOnline(sessionToken, currentClubVenue.id, action.id);
        mergeServerUser(response.user, { clubMarket: response.clubMarket });
        const actionResult = response?.result;
        showExplicitNotice({
          tone:
            actionResult?.escort
              ? "success"
              : actionResult?.networkBoost || actionResult?.heatReduced || actionResult?.hpRecovered || actionResult?.leadGain
                ? "success"
                : "warning",
          title:
            action.id === "scout"
              ? "W OBIEGU"
              : action.id === "hunt"
                ? actionResult?.escort
                  ? "LEAD DOMKNIETY"
                  : "LEAD ROSNIE"
                : "PRZYCZAJ SIE",
          message: actionResult?.logMessage || `${action.name} rozliczone przez backend.`,
          deltas: null,
        });
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }

    if (!requireOfflineDemoAuthority(`Akcja klubowa: ${action.name}`)) return;

    let localResult = null;
    setGame((prev) => {
      const now = Date.now();
      const venue = getCurrentClubVenue(prev);
      if (!venue) return prev;

      const ownerSelfVisit = Boolean(prev.club.owned && prev.club.sourceId === venue.id);
      const venuePlanId = ownerSelfVisit ? prev.club.nightPlanId : venue.nightPlanId;
      const profile = getClubVenueProfile(
        {
          ...prev,
          club: ownerSelfVisit ? prev.club : { ...prev.club, nightPlanId: venuePlanId },
        },
        venue
      );
      const nextClub = syncClubRuntimeState(prev.club, now);
      const guestState = {
        ...(nextClub.guestState || createClubGuestState()),
        affinity: { ...((nextClub.guestState && nextClub.guestState.affinity) || {}) },
      };
      const dayKey = new Date(now).toISOString().slice(0, 10);
      const affinityEntry = guestState.affinity[venue.id]
        ? { ...guestState.affinity[venue.id] }
        : { ...getClubGuestVenueState(guestState, venue.id) };
      if (affinityEntry.tipDayKey !== dayKey) {
        affinityEntry.tipDayKey = dayKey;
        affinityEntry.tipValueToday = 0;
        affinityEntry.tipCountToday = 0;
      }

      const nextVisitCount = (affinityEntry.visits || 0) + 1;
      const diminishing = getClubVisitDiminishing(nextVisitCount, ownerSelfVisit);
      const nextOnlineMessages = [...(prev.online?.messages || [])];
      let escortsOwned = prev.escortsOwned;

      if (action.id === "scout") {
        const tipBudgetLeft = Math.max(
          0,
          CLUB_SYSTEM_RULES.scoutTipDailyCapPerVenue - Number(affinityEntry.tipValueToday || 0)
        );
        const tipSlotsLeft = Math.max(
          0,
          CLUB_SYSTEM_RULES.scoutTipCountCapPerVenue - Number(affinityEntry.tipCountToday || 0)
        );
        const rawTip = Math.max(0, Math.floor(profile.scoutTipValue * diminishing));
        const cashTip =
          tipBudgetLeft > 0 && tipSlotsLeft > 0
            ? Math.max(0, Math.min(rawTip, tipBudgetLeft, 180))
            : 0;

        if (cashTip > 0) {
          affinityEntry.tipValueToday += cashTip;
          affinityEntry.tipCountToday += 1;
          nextOnlineMessages.unshift({
            id: `msg-club-scout-${Date.now()}`,
            from: venue.ownerLabel || "Miasto",
            subject: `Scout: ${venue.name}`,
            preview: `Dyskretny tip z sali. Wpada ${formatMoney(cashTip)}.`,
            time: nowTimeLabel(),
          });
        }

        localResult = {
          actionId: action.id,
          outcome: cashTip > 0 ? "tip" : "intel",
          cashTip,
          heatReduced: 0,
          hpRecovered: 0,
          leadGain: 0,
          logMessage:
            cashTip > 0
              ? `${venue.name} rzuca maly tip. Wpada ${formatMoney(cashTip)}.`
              : `${venue.name} daje czysty odczyt sali, ale dzis bez koperty.`,
          ownerDelta: {
            trafficGain: Number((action.baseTraffic * profile.trafficScale * diminishing).toFixed(3)),
            pressureGain: Number((0.9 * profile.pressureScale).toFixed(3)),
          },
        };
      } else if (action.id === "hunt") {
        const leadTarget =
          guestState.leadVenueId === venue.id && guestState.leadEscortId
            ? ESCORTS.find((entry) => entry.id === guestState.leadEscortId)
            : getLeadTargetEscortForVenue({
                playerRespect: prev.player.respect,
                venue,
                planId: venuePlanId,
              });

        if (!leadTarget) return prev;
        if (guestState.leadVenueId !== venue.id || guestState.leadEscortId !== leadTarget.id) {
          guestState.leadVenueId = venue.id;
          guestState.leadEscortId = leadTarget.id;
          guestState.leadProgress = 0;
        }

        const progressGain = Math.max(
          12,
          Math.min(
            46,
            Math.round(
              (profile.huntProgressValue +
                prev.player.charisma * 0.42 +
                prev.player.dexterity * 0.28) *
                diminishing
            )
          )
        );

        guestState.leadProgress = Math.min(
          guestState.leadRequired || CLUB_SYSTEM_RULES.leadRequired,
          Number(guestState.leadProgress || 0) + progressGain
        );

        let unlockedEscort = null;
        if (guestState.leadProgress >= (guestState.leadRequired || CLUB_SYSTEM_RULES.leadRequired)) {
          unlockedEscort = leadTarget;
          const owned = prev.escortsOwned.find((entry) => entry.id === unlockedEscort.id);
          escortsOwned = owned
            ? prev.escortsOwned.map((entry) =>
                entry.id === unlockedEscort.id
                  ? {
                      ...entry,
                      count: entry.count + 1,
                      working: getEscortWorkingCount(entry),
                      routes: { ...getEscortRoutes(entry) },
                    }
                  : entry
              )
            : [...prev.escortsOwned, { id: unlockedEscort.id, count: 1, working: 0, routes: {} }];
          guestState.leadProgress = 0;
          nextOnlineMessages.unshift({
            id: `msg-club-lead-${Date.now()}`,
            from: venue.ownerLabel || "Miasto",
            subject: `Kontakt z ${venue.name}`,
            preview: `Lead domkniety. Do siatki wpada ${unlockedEscort.name}.`,
            time: nowTimeLabel(),
          });
        }

        localResult = {
          actionId: action.id,
          outcome: unlockedEscort ? "escort" : "progress",
          cashTip: 0,
          heatReduced: 0,
          hpRecovered: 0,
          leadGain: progressGain,
          leadTargetId: leadTarget.id,
          leadTargetName: leadTarget.name,
          escort: unlockedEscort,
          logMessage: unlockedEscort
            ? `${venue.name}: kontakt domkniety. Wpada ${leadTarget.name}.`
            : `${venue.name}: kontakt ruszyl o ${progressGain} pkt.`,
          ownerDelta: {
            trafficGain: Number((action.baseTraffic * profile.trafficScale * diminishing).toFixed(3)),
            pressureGain: Number((2.2 * profile.pressureScale).toFixed(3)),
          },
        };
      } else {
        const heatReduced = Math.min(
          prev.player.heat,
          Math.max(0, Math.floor(profile.layLowHeat * Math.max(0.7, diminishing + 0.18)))
        );
        const hpRecovered = Math.min(
          Math.max(0, prev.player.maxHp - prev.player.hp),
          Math.max(0, Math.floor(profile.layLowHp * Math.max(0.7, diminishing + 0.22)))
        );

        localResult = {
          actionId: action.id,
          outcome: heatReduced || hpRecovered ? "reset" : "calm",
          cashTip: 0,
          heatReduced,
          hpRecovered,
          leadGain: 0,
          logMessage:
            heatReduced || hpRecovered
              ? `${venue.name}: znikasz w cieniu. Heat -${heatReduced}, HP +${hpRecovered}.`
              : `${venue.name}: przeczekales chwile i sala oddycha lzej.`,
          ownerDelta: {
            trafficGain: Number((action.baseTraffic * profile.trafficScale * diminishing).toFixed(3)),
            pressureGain: Number((-1.8 / Math.max(0.85, profile.pressureScale)).toFixed(3)),
          },
        };
      }

      if (!localResult) return prev;

      affinityEntry.visits = nextVisitCount;
      affinityEntry.lastVisitAt = now;
      guestState.lastActionAt = now;
      guestState.lastActionType = action.id;
      guestState.lastVenueId = venue.id;
      guestState.lastOutcome = {
        ...localResult,
        venueId: venue.id,
        venueName: venue.name,
        time: new Date(now).toISOString(),
      };
      guestState.affinity[venue.id] = affinityEntry;

      if (ownerSelfVisit) {
        nextClub.traffic = clamp(
          Number(nextClub.traffic || 0) + Number(localResult.ownerDelta?.trafficGain || 0),
          0,
          CLUB_SYSTEM_RULES.nightlyTrafficHardCap
        );
        nextClub.policePressure = clamp(
          Number(nextClub.policePressure || 0) + Number(localResult.ownerDelta?.pressureGain || 0),
          0,
          100
        );
        if (localResult.ownerDelta?.pressureGain < 0) {
          nextClub.recentIncident = {
            tone: "calm",
            text: "Sala przycichla. Presja schodzi i drzwi oddychaja.",
            createdAt: now,
          };
        } else if (nextClub.policePressure >= 68) {
          nextClub.recentIncident = {
            tone: "risk",
            text: "Przy wejsciu kreci sie patrol. Ruch robi wynik, ale robi sie goraco.",
            createdAt: now,
          };
        }
      }

      if (action.id === "laylow") {
        nextClub.policePressure = clamp(
          nextClub.policePressure -
            (ownerSelfVisit ? Math.max(2, Math.floor(3 * profile.plan.layLowMultiplier)) : 0),
          0,
          100
        );
      }

      nextClub.guestState = guestState;
      nextClub.visitId = venue.id;

      return {
        ...prev,
        player: {
          ...prev.player,
          cash: prev.player.cash - action.costCash + (localResult.cashTip || 0),
          heat: Math.max(0, prev.player.heat - (localResult.heatReduced || 0)),
          hp: Math.min(prev.player.maxHp, prev.player.hp + (localResult.hpRecovered || 0)),
        },
        escortsOwned,
        club: nextClub,
        clubListings: ownerSelfVisit
          ? syncClubListing(
              prev.clubListings,
              nextClub,
              prev.club.ownerLabel || getPlayerClubOwnerLabel(prev)
            )
          : prev.clubListings,
        online: {
          ...prev.online,
          messages: nextOnlineMessages.slice(0, 20),
        },
        log: [localResult.logMessage, ...prev.log].slice(0, 16),
      };
    });

    if (!localResult) return;

    showExplicitNotice({
      tone:
        localResult.escort
          ? "success"
          : localResult.cashTip || localResult.heatReduced || localResult.hpRecovered
            ? "success"
            : "warning",
      title:
        action.id === "scout"
          ? "SCOUT"
          : action.id === "hunt"
            ? localResult.escort
              ? "LEAD DOMKNIETY"
              : "LEAD ROSNIE"
            : "LAY LOW",
      message: localResult.logMessage,
      deltas: null,
    });
  };

  // TODO: TO_MIGRATE_TO_SERVER - escort street assignment affects passive economy and must move to server state
  const assignEscortToStreet = async (escort, districtId) => {
    if (!canDoStreetAction()) return;
    if (sessionToken && apiStatus === "online") {
      try {
        const result = await assignEscortToStreetOnline(sessionToken, escort.id, districtId);
        mergeServerUser(result.user);
        return;
      } catch (error) {
        pushLog(error.message);
        return;
      }
    }
    if (!requireOfflineDemoAuthority("Wystawianie na ulice")) return;
    const district = STREET_DISTRICTS.find((entry) => entry.id === districtId);
    if (!district) return pushLog("Wybierz konkretna dzielnice.");
    if (game.player.respect < district.respect) return pushLog(`Na ${district.name} potrzebujesz ${district.respect} szacunu.`);
    if (getEscortReserveCount(game, escort.id) <= 0) return pushLog(`Nie masz wolnej sztuki ${escort.name}, zeby wystawic ja na ulice.`);

    setGame((prev) => {
      const escortsOwned = prev.escortsOwned.map((entry) => {
        if (entry.id !== escort.id) return entry;
        const routes = { ...getEscortRoutes(entry), [district.id]: (getEscortRoutes(entry)[district.id] || 0) + 1 };
        return { ...entry, routes, working: getEscortWorkingCount({ ...entry, routes }) };
      });

      return {
        ...prev,
        escortsOwned,
        log: [`${escort.name} wychodzi na ${district.name}. Mnoznik ulicy x${district.incomeMultiplier.toFixed(2)}.`, ...prev.log].slice(0, 16),
      };
    });
  };

  const pullEscortFromStreet = async (escort, districtId) => {
    if (!canDoStreetAction()) return;
    if (sessionToken && apiStatus === "online") {
      try {
        const result = await pullEscortFromStreetOnline(sessionToken, escort.id, districtId);
        mergeServerUser(result.user);
        return;
      } catch (error) {
        pushLog(error.message);
        return;
      }
    }
    if (!requireOfflineDemoAuthority("Sciaganie z ulicy")) return;
    const district = STREET_DISTRICTS.find((entry) => entry.id === districtId);
    if (!district) return pushLog("Wybierz konkretna dzielnice.");
    const assigned = getEscortDistrictCount(game, escort.id, district.id);
    if (assigned <= 0) return pushLog(`${escort.name} nie stoi teraz na ${district.name}.`);

    setGame((prev) => {
      const escortsOwned = prev.escortsOwned.map((entry) => {
        if (entry.id !== escort.id) return entry;
        const routes = { ...getEscortRoutes(entry), [district.id]: Math.max(0, (getEscortRoutes(entry)[district.id] || 0) - 1) };
        if (routes[district.id] <= 0) delete routes[district.id];
        return { ...entry, routes, working: getEscortWorkingCount({ ...entry, routes }) };
      });

      return {
        ...prev,
        escortsOwned,
        log: [`Sciagnales z ${district.name} ${escort.name}.`, ...prev.log].slice(0, 16),
      };
    });
  };

  const sellEscort = async (escort) => {
    if (!canDoStreetAction()) return;
    if (sessionToken && apiStatus === "online") {
      try {
        const result = await sellEscortOnline(sessionToken, escort.id);
        mergeServerUser(result.user);
        return;
      } catch (error) {
        pushLog(error.message);
        return;
      }
    }
    if (!requireOfflineDemoAuthority("Sprzedaz kontaktu")) return;
    if (getEscortReserveCount(game, escort.id) <= 0) return pushLog(`Najpierw sciagij z ulicy wolna sztuke ${escort.name}, zeby ja opchnac.`);

    setGame((prev) => {
      const escortsOwned = prev.escortsOwned
        .map((entry) => (entry.id === escort.id ? { ...entry, count: entry.count - 1, working: getEscortWorkingCount(entry), routes: { ...getEscortRoutes(entry) } } : entry))
        .filter((entry) => entry.count > 0);

      return {
        ...prev,
        player: { ...prev.player, cash: prev.player.cash + escort.sellPrice },
        escortsOwned,
        stats: { ...prev.stats, totalEarned: prev.stats.totalEarned + escort.sellPrice },
        log: [`Sprzedales kontakt ${escort.name} za ${formatMoney(escort.sellPrice)}.`, ...prev.log].slice(0, 16),
      };
    });
  };

  // TODO: TO_MIGRATE_TO_SERVER - factory ownership, slot limits, diminishing returns and maintenance costs must be persisted server-side
  const buyFactory = async (factory) => {
    if (!canDoStreetAction()) return;
    if (sessionToken && apiStatus === "online") {
      try {
        const result = await buyFactoryOnline(sessionToken, factory.id);
        mergeServerUser(result.user);
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }
    if (!requireOfflineDemoAuthority("Kupowanie fabryk")) return;
    if (game.player.respect < factory.respect) return pushLog(`Masz za niski szacunek. Wymagany szacunek: ${factory.respect}.`);
    if (game.player.cash < factory.cost) return pushLog(`Brakuje ${formatMoney(factory.cost)} na ${factory.name}.`);
    if (hasFactory(game, factory.id)) return pushLog(`${factory.name} juz stoi.`);

    setGame((prev) => ({
      ...prev,
      player: { ...prev.player, cash: prev.player.cash - factory.cost },
      factoriesOwned: { ...prev.factoriesOwned, [factory.id]: 1 },
      log: [`Przejeta produkcja: ${factory.name}.`, ...prev.log].slice(0, 16),
    }));
  };

  // TODO: TO_MIGRATE_TO_SERVER - wholesale unlock, supplier tiers and component quality requirements should mutate server inventory, not local fallback state
  const buySupply = async (supply, options = {}) => {
    const safeQuantity = Math.max(1, Math.floor(Number(options?.quantity || 1)));
    if (!canDoStreetAction()) return { ok: false, blocked: true };
    if (sessionToken && apiStatus === "online") {
      try {
        const result = await buyFactorySupplyOnline(sessionToken, supply.id, safeQuantity);
        mergeServerUser(result.user);
        return { ok: true, quantity: safeQuantity, result: result?.result || null };
      } catch (error) {
        pushLog(error.message);
        return { ok: false, error };
      }
    }
    if (!requireOfflineDemoAuthority("Kupowanie dostaw")) return { ok: false, blocked: true };
    const totalCost = Number(supply.price || 0) * safeQuantity;
    if (game.player.cash < totalCost) {
      pushLog(`Brakuje gotowki na ${supply.name}.`);
      return { ok: false };
    }

    setGame((prev) => ({
      ...prev,
      player: { ...prev.player, cash: prev.player.cash - totalCost },
      supplies: { ...prev.supplies, [supply.id]: prev.supplies[supply.id] + safeQuantity },
      log: [`Kupiono ${supply.unit}: ${supply.name} x${safeQuantity}.`, ...prev.log].slice(0, 16),
    }));
    return { ok: true, quantity: safeQuantity };
  };

  // TODO: TO_MIGRATE_TO_SERVER - production recipes, raid risk, maintenance, yield scaling and inventory output are critical economy authority
  const produceDrug = async (drug, options = {}) => {
    const safeQuantity = Math.max(1, Math.floor(Number(options?.quantity || 1)));
    if (!canDoStreetAction()) return { ok: false, blocked: true };
    if (sessionToken && apiStatus === "online") {
      let completed = 0;
      let lastResult = null;
      try {
        for (let index = 0; index < safeQuantity; index += 1) {
          const result = await produceDrugOnline(sessionToken, drug.id);
          mergeServerUser(result.user);
          lastResult = result?.result || null;
          completed += 1;
          if (result?.result?.jailSeconds) {
            setActiveSection("heists", "prison");
            break;
          }
          if (result?.result?.busted) {
            break;
          }
        }
        return { ok: completed > 0, quantity: completed, result: lastResult };
      } catch (error) {
        pushLog(error.message);
        return { ok: completed > 0, quantity: completed, error };
      }
    }
    if (!requireOfflineDemoAuthority("Produkcja w fabryce")) return { ok: false, blocked: true };
    if (!hasFactory(game, drug.factoryId)) {
      pushLog(`Najpierw musisz miec ${FACTORIES.find((entry) => entry.id === drug.factoryId)?.name}.`);
      return { ok: false };
    }
    const productionRespectRequirement = getDrugProductionRespectRequirement(drug);
    if (game.player.respect < productionRespectRequirement) {
      pushLog(`Masz za niski szacunek. Wymagany szacunek: ${productionRespectRequirement}.`);
      return { ok: false };
    }

    for (const [supplyId, amount] of Object.entries(drug.supplies)) {
      if (game.supplies[supplyId] < amount) {
        const supplyName = SUPPLIERS.find((entry) => entry.id === supplyId)?.name || supplyId;
        pushLog(`Brakuje skladnika: ${supplyName}.`);
        return { ok: false };
      }
    }

    const policeProfile = getDrugPoliceProfile(drug);
    let completed = 0;
    let jailed = 0;
    let busted = false;

    setGame((prev) => {
      let nextState = {
        ...prev,
        supplies: { ...prev.supplies },
        drugInventory: { ...prev.drugInventory },
        producedDrugInventory: {
          ...(prev.producedDrugInventory || createDrugCounterMap()),
        },
        player: { ...prev.player },
        stats: { ...prev.stats },
        log: [...prev.log],
      };

      for (let index = 0; index < safeQuantity; index += 1) {
        const hasSupplies = Object.entries(drug.supplies).every(
          ([supplyId, amount]) => Number(nextState.supplies?.[supplyId] || 0) >= Number(amount || 0)
        );
        if (!hasSupplies) {
          break;
        }

        const bustChance = clamp(
          policeProfile.risk + Number(nextState.player.heat || 0) * 0.0022 - effectivePlayer.dexterity * 0.003,
          0.03,
          0.52
        );
        const bustedNow = Math.random() < bustChance;
        const jailSeconds =
          bustedNow && drug.unlockRespect >= 30 && Math.random() < bustChance * 0.42 ? randomBetween(180, 420) : 0;

        Object.entries(drug.supplies).forEach(([supplyId, amount]) => {
          nextState.supplies[supplyId] = Math.max(0, Number(nextState.supplies?.[supplyId] || 0) - Number(amount || 0));
        });

        if (bustedNow) {
          const fine = Math.floor(drug.streetPrice * (1.05 + policeProfile.risk));
          nextState.player.cash = Math.max(0, Number(nextState.player.cash || 0) - fine);
          nextState.player.heat = clamp(Number(nextState.player.heat || 0) + policeProfile.heatGain + 5, 0, 100);
          if (jailSeconds) {
            nextState.player.jailUntil = Date.now() + jailSeconds * 1000;
          }
          nextState.log = [
            jailSeconds
              ? `Nalot na produkcji ${drug.name}. Strata ${formatMoney(fine)} i cela na ${Math.ceil(jailSeconds / 60)} min.`
              : `Policja weszla na produkcje ${drug.name}. Strata ${formatMoney(fine)} i spalone skladniki.`,
            ...nextState.log,
          ].slice(0, 16);
          busted = true;
          jailed = jailSeconds;
          break;
        }

        nextState.drugInventory[drug.id] = Number(nextState.drugInventory?.[drug.id] || 0) + drug.batchSize;
        nextState.producedDrugInventory[drug.id] =
          Number(nextState.producedDrugInventory?.[drug.id] || 0) + drug.batchSize;
        nextState.player.heat = clamp(Number(nextState.player.heat || 0) + policeProfile.heatGain, 0, 100);
        nextState.stats.drugBatches = Number(nextState.stats?.drugBatches || 0) + 1;
        nextState.log = [`Wyprodukowano ${drug.batchSize} szt. ${drug.name}. Ryzyko: ${policeProfile.label}.`, ...nextState.log].slice(0, 16);
        completed += 1;
      }

      return nextState;
    });

    if (jailed) {
      setActiveSection("heists", "prison");
    }
    return { ok: completed > 0, quantity: completed, busted, jailSeconds: jailed };
  };

  // TODO: TO_MIGRATE_TO_SERVER - timed boosts, cooldowns, global caps and overdose odds affect heist balance and cannot stay client-authoritative
  const consumeDrug = (drug) => {
    if (!canDoStreetAction()) return;
    if (game.drugInventory[drug.id] <= 0) return pushLog(`Nie masz na stanie: ${drug.name}.`);

    if (sessionToken && apiStatus === "online") {
      consumeDrugOnline(sessionToken, drug.id)
        .then((result) => {
          mergeServerUser(result.user);
          showExplicitNotice({
            tone: result?.result?.overdose ? "failure" : "success",
            title: result?.result?.overdose ? "PRZEDAWKOWANIE" : "BOOST AKTYWNY",
            message: result?.result?.logMessage || `Weszlo ${drug.name}.`,
            deltas: null,
          });
        })
        .catch((error) => {
          pushLog(error.message || `Nie udalo sie zarzucic ${drug.name}.`);
        });
      return;
    }

    if (!requireOfflineDemoAuthority("Boosty z towaru")) return;

    if (Math.random() < drug.overdoseRisk) {
      const producedCounter = consumeProducedDrugCounter(game.producedDrugInventory, drug.id, 1);
      setGame((prev) => ({
        ...prev,
        drugInventory: { ...prev.drugInventory, [drug.id]: prev.drugInventory[drug.id] - 1 },
        producedDrugInventory: producedCounter.nextMap,
        player: {
          ...prev.player,
          hp: clamp(prev.player.hp - randomBetween(28, 55), 0, prev.player.maxHp),
          heat: clamp(prev.player.heat + 8, 0, 100),
        },
        log: [`Przedawkowanie po ${drug.name}. Ledwo stoisz na nogach.`, ...prev.log].slice(0, 16),
      }));
      return;
    }

    const producedCounter = consumeProducedDrugCounter(game.producedDrugInventory, drug.id, 1);
    setGame((prev) => ({
      ...prev,
      drugInventory: { ...prev.drugInventory, [drug.id]: prev.drugInventory[drug.id] - 1 },
      producedDrugInventory: producedCounter.nextMap,
      activeBoosts: [...prev.activeBoosts, { id: `${drug.id}-${Date.now()}`, name: drug.name, effect: drug.effect, expiresAt: Date.now() + drug.durationSeconds * 1000 }],
      log: [`Weszlo ${drug.name}. Staty podbite na ${Math.round(drug.durationSeconds / 60)} min.`, ...prev.log].slice(0, 16),
    }));
  };

  const buyDrugFromDealer = async (drug, quantityOverride) => {
    if (!canDoStreetAction()) return;
    const parsedQuantity = Number.parseInt(String(quantityOverride ?? dealerTradeDraft).replace(/[^\d]/g, ""), 10);
    const quantity = Math.max(1, Number.isFinite(parsedQuantity) ? parsedQuantity : 1);
    if (game.player.respect < drug.unlockRespect) return pushLog(`Diler puszcza ${drug.name} dopiero od ${drug.unlockRespect} szacunu.`);
    if ((game.dealerInventory?.[drug.id] || 0) < quantity) return pushLog(`Diler nie ma tyle ${drug.name} na stanie.`);
    if (game.player.cash < drug.streetPrice * quantity) return pushLog(`Brakuje ${formatMoney(drug.streetPrice * quantity)} na ${drug.name} x${quantity}.`);

    if (sessionToken && apiStatus === "online") {
      try {
        const result = await buyDrugFromDealerOnline(sessionToken, drug.id, quantity);
        mergeServerUser(result.user);
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }

    if (!requireOfflineDemoAuthority("Dealer")) return;

    setGame((prev) => ({
      ...prev,
      player: { ...prev.player, cash: prev.player.cash - drug.streetPrice * quantity },
      drugInventory: { ...prev.drugInventory, [drug.id]: prev.drugInventory[drug.id] + quantity },
      dealerInventory: { ...prev.dealerInventory, [drug.id]: Math.max(0, (prev.dealerInventory[drug.id] || 0) - quantity) },
      stats: {
        ...prev.stats,
        drugsBought: Number(prev.stats?.drugsBought || 0) + quantity,
      },
      log: [`Kupiles od dilera: ${drug.name} x${quantity} za ${formatMoney(drug.streetPrice * quantity)}.`, ...prev.log].slice(0, 16),
    }));
  };

  const sellDrugToDealer = async (drug, quantityOverride) => {
    if (!canDoStreetAction()) return;
    const parsedQuantity = Number.parseInt(String(quantityOverride ?? dealerTradeDraft).replace(/[^\d]/g, ""), 10);
    const quantity = Math.max(1, Number.isFinite(parsedQuantity) ? parsedQuantity : 1);
    if ((game.drugInventory[drug.id] || 0) < quantity) return pushLog(`Nie masz tyle ${drug.name} do sprzedania.`);
    const payoutPerUnit = getDealerPayoutForDrug(drug);
    const payout = payoutPerUnit * quantity;

    if (sessionToken && apiStatus === "online") {
      try {
        const result = await sellDrugToDealerOnline(sessionToken, drug.id, quantity);
        mergeServerUser(result.user);
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }

    if (!requireOfflineDemoAuthority("Dealer")) return;
    const producedCounter = consumeProducedDrugCounter(game.producedDrugInventory, drug.id, quantity);

    setGame((prev) => ({
      ...prev,
      player: { ...prev.player, cash: prev.player.cash + payout },
      drugInventory: { ...prev.drugInventory, [drug.id]: prev.drugInventory[drug.id] - quantity },
      producedDrugInventory: producedCounter.nextMap,
      dealerInventory: { ...prev.dealerInventory, [drug.id]: (prev.dealerInventory[drug.id] || 0) + quantity },
      stats: {
        ...prev.stats,
        totalEarned: prev.stats.totalEarned + payout,
        dealerDrugSalesValue: Number(prev.stats?.dealerDrugSalesValue || 0) + payout,
        producedDrugSalesValue:
          Number(prev.stats?.producedDrugSalesValue || 0) + producedCounter.consumed * payoutPerUnit,
      },
      log: [`Sprzedales dilerowi ${drug.name} x${quantity} za ${formatMoney(payout)}.`, ...prev.log].slice(0, 16),
    }));
  };

  // TODO: TO_MIGRATE_TO_SERVER - club takeover cost, ownership, player-driven traffic and upkeep need persistence and anti-abuse checks
  const openClub = async (listing) => {
    if (!canDoStreetAction()) return;
    if (game.club.owned) return pushLog("Klub juz jest Twoj.");
    if (!listing) return pushLog("Wybierz lokal z listy klubow.");

    if (hasOnlineAuthority) {
      try {
        const result = await claimClubOnline(sessionToken, listing.id);
        mergeServerUser(result.user, { clubMarket: result.clubMarket });
        return;
      } catch (error) {
        pushLog(error.message);
        return;
      }
    }

    if (!requireOfflineDemoAuthority("Przejecie klubu")) return;
    if (game.player.respect < listing.respect) return pushLog(`Na ten lokal potrzebujesz ${listing.respect} szacunu.`);
    if (game.player.cash < listing.takeoverCost) return pushLog(`Brakuje ${formatMoney(listing.takeoverCost)} na przejecie ${listing.name}.`);

    setGame((prev) => {
      const nextClub = syncClubRuntimeState(
        {
          ...prev.club,
          owned: true,
          sourceId: listing.id,
          visitId: listing.id,
          ownerLabel: clubOwnerLabel,
          name: listing.name,
          respect: listing.respect,
          takeoverCost: listing.takeoverCost,
          popularity: listing.popularity,
          mood: listing.mood,
          policeBase: listing.policeBase,
          policePressure: Number(listing.policePressure || 0),
          traffic: Number(listing.traffic || 0),
          nightPlanId: listing.nightPlanId || getClubNightPlan().id,
          recentIncident: null,
          note: listing.note,
          guestState: prev.club.guestState || createClubGuestState(),
        },
        Date.now()
      );

      return {
        ...prev,
        player: { ...prev.player, cash: prev.player.cash - listing.takeoverCost },
        club: nextClub,
        clubListings: syncClubListing(prev.clubListings, nextClub, clubOwnerLabel),
        log: [`Przejales ${listing.name}. Teraz ruch i nocki zaczynaja pracowac dla Ciebie.`, ...prev.log].slice(0, 16),
      };
    });
  };

  const foundClub = () => {
    if (!canDoStreetAction()) return;
    if (hasOnlineAuthority) {
      foundClubOnline(sessionToken)
        .then((result) => {
          mergeServerUser(result.user, { clubMarket: result.clubMarket });
          showExplicitNotice({
            tone: "success",
            title: "NOWY LOKAL",
            message: result?.result?.logMessage || "Nowy klub wskakuje do miasta.",
            deltas: null,
          });
        })
        .catch((error) => pushLog(error.message));
      return;
    }
    if (!requireOfflineDemoAuthority("Zakladanie klubu")) return;
    if (game.club.owned) return pushLog("Masz juz swoj klub.");
    if (!game.gang.joined) return pushLog("Nowy klub od zera stawia juz konkretna ekipa, nie solo typ.");
    if (game.gang.role !== "Boss") return pushLog("Nowy lokal moze postawic tylko boss gangu.");
    if (game.player.respect < 26) return pushLog("Na zalozenie nowego klubu potrzebujesz minimum 26 szacunu.");

    if (game.player.cash < CLUB_FOUNDING_CASH_COST) {
      return pushLog(`Nowy klub od zera kosztuje ${formatMoney(CLUB_FOUNDING_CASH_COST)}.`);
    }

    const clubId = `club-player-${Date.now()}`;
    const clubName = `${game.gang.name} Social Club`;
    const ownerLabel = clubOwnerLabel;
      const newListing = {
        id: clubId,
        name: clubName,
        ownerLabel,
        respect: 26,
        takeoverCost: CLUB_FOUNDING_CASH_COST,
        popularity: 18,
        mood: 68,
        policeBase: 13,
        policePressure: 0,
        traffic: 0,
        nightPlanId: getClubNightPlan().id,
        note: "Nowy lokal postawiony od zera. Wysokie koszty, wysoki potencjal i wieksza uwaga sluzb.",
      };

    setGame((prev) => {
      const nextClub = syncClubRuntimeState(
        {
          ...prev.club,
          owned: true,
          sourceId: newListing.id,
          visitId: newListing.id,
          ownerLabel,
          name: newListing.name,
          respect: newListing.respect,
          takeoverCost: newListing.takeoverCost,
          popularity: newListing.popularity,
          mood: newListing.mood,
          policeBase: newListing.policeBase,
          policePressure: 0,
          traffic: 0,
          nightPlanId: newListing.nightPlanId,
          recentIncident: null,
          note: newListing.note,
          guestState: prev.club.guestState || createClubGuestState(),
        },
        Date.now()
      );

      return {
        ...prev,
        player: {
          ...prev.player,
          cash: prev.player.cash - CLUB_FOUNDING_CASH_COST,
        },
        club: nextClub,
        clubListings: syncClubListing(prev.clubListings, nextClub, ownerLabel),
        log: [
          `Wylales gruby hajs i postawiles od zera ${clubName}.`,
          ...prev.log,
        ].slice(0, 16),
      };
    });
  };

  // TODO: TO_MIGRATE_TO_SERVER - club stash is economy state and must not live only on the client
  const moveDrugToClub = async (drug, quantityOverride) => {
    if (!game.club.owned) return pushLog("Najpierw musisz miec klub.");
    if (!insideOwnClub) return pushLog("Musisz fizycznie wejsc do swojego klubu, zeby wrzucic towar na stash.");

    const parsedQuantity = Number.parseInt(String(quantityOverride ?? 1).replace(/[^\d]/g, ""), 10);
    const quantity = Math.max(1, Number.isFinite(parsedQuantity) ? parsedQuantity : 1);
    if ((game.drugInventory?.[drug.id] || 0) < quantity) {
      return pushLog(`Nie masz tyle ${drug.name} przy sobie.`);
    }

    if (sessionToken && apiStatus === "online") {
      try {
        const result = await moveDrugToClubOnline(sessionToken, drug.id, quantity);
        mergeServerUser(result.user, { clubMarket: result.clubMarket });
        showExplicitNotice({
          tone: "success",
          title: "STASH KLUBU",
          message: result?.result?.logMessage || `Do stashu wpada ${quantity}x ${drug.name}.`,
          deltas: null,
        });
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }

    if (!requireOfflineDemoAuthority("Stash klubu")) return;

    const producedCounter = consumeProducedDrugCounter(game.producedDrugInventory, drug.id, quantity);
    setGame((prev) => ({
      ...prev,
      drugInventory: { ...prev.drugInventory, [drug.id]: Math.max(0, Number(prev.drugInventory[drug.id] || 0) - quantity) },
      producedDrugInventory: producedCounter.nextMap,
      club: {
        ...prev.club,
        stash: { ...prev.club.stash, [drug.id]: Number(prev.club.stash?.[drug.id] || 0) + quantity },
      },
      stats: {
        ...prev.stats,
        clubStashMoves: Number(prev.stats?.clubStashMoves || 0) + 1,
      },
      log: [`Przerzucono ${quantity}x ${drug.name} do klubu.`, ...prev.log].slice(0, 16),
    }));
  };

  const consumeDrugFromClub = async (drug) => {
    if (!canDoStreetAction()) return;
    if (!currentClubVenue) return pushLog("Najpierw wejdz do lokalu.");
    if (insideOwnClub) return pushLog("W swoim klubie ogarniasz towar normalnie, nie ze stashu dla gosci.");

    const stashCount = Number(currentClubVenue?.stash?.[drug.id] || 0);
    if (stashCount <= 0) {
      return pushLog(`Na stashu nie ma teraz ${drug.name}.`);
    }

    if (sessionToken && apiStatus === "online") {
      try {
        const result = await consumeClubDrugOnline(sessionToken, currentClubVenue.id, drug.id);
        mergeServerUser(result.user, { clubMarket: result.clubMarket });
        showExplicitNotice({
          tone: result?.result?.overdose ? "failure" : "success",
          title: result?.result?.overdose ? "PRZEDAWKOWANIE" : "TOWAR Z LOKALU",
          message: result?.result?.logMessage || `Zarzuciles ${drug.name} ze stashu lokalu.`,
          deltas: null,
        });
      } catch (error) {
        pushLog(error.message || `Nie udalo sie zarzucic ${drug.name} z lokalu.`);
      }
      return;
    }

    if (!requireOfflineDemoAuthority("Towar z klubu")) return;

    const now = Date.now();
    const consumeReadyAt =
      Number(game.club?.guestState?.lastConsumeAt || 0) + Number(CLUB_SYSTEM_RULES.consumeCooldownMs || 0);
    if (consumeReadyAt > now) {
      return pushLog(`Z lokalu zarzucisz znowu za ${formatCooldown(consumeReadyAt - now)}.`);
    }

    const overdosed = Math.random() < Number(drug.overdoseRisk || 0);
    const damage = overdosed ? randomBetween(28, 55) : 0;

    setGame((prev) => ({
      ...prev,
      clubListings: prev.clubListings.map((listing) =>
        listing.id === prev.club.visitId
          ? {
              ...listing,
              stash: {
                ...(listing.stash || {}),
                [drug.id]: Math.max(0, Number(listing?.stash?.[drug.id] || 0) - 1),
              },
            }
          : listing
      ),
      club: {
        ...prev.club,
        guestState: {
          ...(prev.club.guestState || {}),
          lastConsumeAt: now,
          lastVenueId: prev.club.visitId || null,
        },
      },
      activeBoosts: overdosed
        ? prev.activeBoosts
        : [
            ...prev.activeBoosts,
            { id: `${drug.id}-${now}`, name: drug.name, effect: drug.effect, expiresAt: now + drug.durationSeconds * 1000 },
          ],
      player: overdosed
        ? {
            ...prev.player,
            hp: clamp(prev.player.hp - damage, 0, prev.player.maxHp),
            heat: clamp(prev.player.heat + 8, 0, 100),
          }
        : prev.player,
      log: [
        overdosed
          ? `Przedawkowanie po ${drug.name} z lokalu.`
          : `Zarzuciles ${drug.name} ze stashu lokalu.`,
        ...prev.log,
      ].slice(0, 16),
    }));
  };

  const fortifyClub = async () => {
    if (!canDoStreetAction()) return;
    if (!game.club.owned) return pushLog("Najpierw musisz miec swoj lokal.");
    if (!insideOwnClub) return pushLog("Zabezpieczenie lokalu ustawiasz tylko bedac u siebie.");

    if (hasOnlineAuthority) {
      try {
        const result = await fortifyClubOnline(sessionToken);
        mergeServerUser(result.user, { clubMarket: result.clubMarket });
        showExplicitNotice({
          tone: "success",
          title: "OCHRONA",
          message: result?.result?.logMessage || "Lokal jest mocniej domkniety.",
          deltas: null,
        });
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }

    if (!requireOfflineDemoAuthority("Ochrona klubu")) return;
    const cost = 850 + Math.max(0, Number(game.club.securityLevel || 0)) * 650;
    if (game.player.cash < cost) return pushLog(`Brakuje ${formatMoney(cost)} na zabezpieczenie lokalu.`);
    setGame((prev) => ({
      ...prev,
      player: { ...prev.player, cash: prev.player.cash - cost },
      club: {
        ...prev.club,
        securityLevel: Math.min(3, Number(prev.club.securityLevel || 0) + 1),
        defenseReadiness: Math.min(100, Number(prev.club.defenseReadiness || 44) + 16),
        threatLevel: Math.max(0, Number(prev.club.threatLevel || 0) - 14),
      },
      log: ["Lokal dostaje szybsza ochrone i spokojniejszy front.", ...prev.log].slice(0, 16),
    }));
  };

  const enterClubAsGuest = async (listing) => {
    if (!canDoStreetAction()) return;
    if (!listing) return pushLog("Nie ma takiego lokalu na mapie miasta.");
    if (sessionToken && apiStatus === "online") {
      try {
        const result = await visitClubOnline(sessionToken, "enter", listing.id);
        mergeServerUser(result.user, { clubMarket: result.clubMarket });
        showExplicitNotice({
          tone: "success",
          title: "LOKAL",
          message: result?.result?.logMessage || `Wchodzisz do ${listing.name}.`,
          deltas: null,
        });
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }

    const now = Date.now();
    const alreadyHasAccess = hasClubGuestAccess(game.club?.guestState, listing.id, now);
    const entryFee = alreadyHasAccess ? 0 : Math.max(0, Number(listing.entryFee || 0));
    if (entryFee > 0 && Number(game.player.cash || 0) < entryFee) {
      return pushLog(`Brakuje ${formatMoney(entryFee)} na wejscie do ${listing.name}.`);
    }

    setGame((prev) => ({
      ...prev,
      player: {
        ...prev.player,
        cash: Math.max(0, Number(prev.player.cash || 0) - entryFee),
      },
      club: {
        ...prev.club,
        visitId: listing.id,
        guestState: {
          ...(prev.club.guestState || createClubGuestState()),
          affinity: {
            ...((prev.club.guestState && prev.club.guestState.affinity) || {}),
            [listing.id]: {
              ...getClubGuestVenueState(prev.club.guestState, listing.id),
              accessUntil: now + Number(CLUB_SYSTEM_RULES.accessWindowMs || 0),
              lastAccessPaidAt: now,
              lastEntryFeePaid: entryFee,
            },
          },
        },
      },
      log: [
        entryFee > 0
          ? `Wchodzisz do ${listing.name}. Bramka bierze ${formatMoney(entryFee)}.`
          : `Wchodzisz do ${listing.name}.`,
        ...prev.log,
      ].slice(0, 16),
    }));
  };

  const leaveClubAsGuest = async () => {
    if (!currentClubVenue) return pushLog("Nie jestes teraz w zadnym klubie.");
    if (sessionToken && apiStatus === "online") {
      try {
        const result = await visitClubOnline(sessionToken, "leave", currentClubVenue.id);
        mergeServerUser(result.user, { clubMarket: result.clubMarket });
        if (result?.result?.logMessage) {
          pushLog(result.result.logMessage);
        }
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }

    setGame((prev) => ({
      ...prev,
      club: {
        ...prev.club,
        visitId: null,
      },
      log: [`Wychodzisz z ${currentClubVenue.name} i wracasz na ulice.`, ...prev.log].slice(0, 16),
    }));
  };

  // TODO: TO_MIGRATE_TO_SERVER - local market fallback must be removed; supply generation,
  // pricing and inventory mutation must stay server-authoritative.
  const buyProduct = async (product) => {
    if (!canDoStreetAction()) return;
    if (hasOnlineAuthority) {
      try {
        const result = await buyProductOnline(sessionToken, product.id, 1);
        mergeServerUser(result.user, result.market);
        return;
      } catch (error) {
        pushLog(error.message);
        return;
      }
    }

    if (game.player.respect < product.unlockRespect) return pushLog(`Towar odblokuje sie przy ${product.unlockRespect} szacunu.`);
    if (game.player.cash < game.market[product.id]) return pushLog(`Nie stac Cie teraz na ${product.name}.`);

    setGame((prev) => ({
      ...prev,
      player: { ...prev.player, cash: prev.player.cash - prev.market[product.id] },
      inventory: { ...prev.inventory, [product.id]: prev.inventory[product.id] + 1 },
      stats: {
        ...prev.stats,
        marketGoodsBought: Number(prev.stats?.marketGoodsBought || 0) + 1,
      },
      log: [`Kupiono 1 sztuke: ${product.name}.`, ...prev.log].slice(0, 16),
    }));
  };

  // TODO: TO_MIGRATE_TO_SERVER - local market fallback must be removed; pricing and payouts
  // must be resolved only by backend.
  const sellProduct = async (product) => {
    if (!canDoStreetAction()) return;
    if (hasOnlineAuthority) {
      try {
        const result = await sellProductOnline(sessionToken, product.id, 1);
        mergeServerUser(result.user, result.market);
        return;
      } catch (error) {
        pushLog(error.message);
        return;
      }
    }

    if (game.inventory[product.id] <= 0) return pushLog(`Nie masz towaru: ${product.name}.`);
    const sellPrice = Math.floor(game.market[product.id] * 0.85);

    setGame((prev) => ({
      ...prev,
      player: { ...prev.player, cash: prev.player.cash + sellPrice },
      inventory: { ...prev.inventory, [product.id]: prev.inventory[product.id] - 1 },
      stats: {
        ...prev.stats,
        totalEarned: prev.stats.totalEarned + sellPrice,
        marketGoodsSold: Number(prev.stats?.marketGoodsSold || 0) + 1,
      },
      log: [`Sprzedano ${product.name} za ${formatMoney(sellPrice)}.`, ...prev.log].slice(0, 16),
    }));
  };

  const applyGangMemberRoleLocally = (member, nextRole) => {
    setGame((prev) => {
      const safeRole = GANG_MEMBER_MANAGEABLE_ROLES.includes(nextRole) ? nextRole : "Czlonek";
      const targetIndex = (prev.gang.membersList || []).findIndex(
        (entry) => entry.id === member.id || entry.name === member.name
      );
      if (targetIndex < 0) return prev;

      const members = (prev.gang.membersList || []).map((entry) => ({ ...entry }));
      const targetMember = members[targetIndex];
      const selfMember =
        targetMember.id === prev.player.id ||
        String(targetMember.name || "").trim().toLowerCase() === String(prev.player.name || "").trim().toLowerCase();
      if (selfMember || targetMember.role === safeRole) {
        return prev;
      }

      if (safeRole === "Vice Boss") {
        const currentViceIndex = members.findIndex(
          (entry, index) => index !== targetIndex && entry.role === "Vice Boss"
        );
        if (currentViceIndex >= 0) {
          members[currentViceIndex] = {
            ...members[currentViceIndex],
            role: "Zaufany",
            trusted: true,
          };
        }
      }

      members[targetIndex] = {
        ...targetMember,
        role: safeRole,
        trusted: safeRole !== "Czlonek",
      };

      return {
        ...prev,
        gang: normalizeGangState({
          ...prev.gang,
          membersList: members,
          chat: [
            {
              id: `gang-role-local-${member.id || member.name}-${Date.now()}`,
              author: "System",
              text: `${member.name} dostaje range ${safeRole}.`,
              time: nowTimeLabel(),
            },
            ...(prev.gang.chat || []),
          ].slice(0, 20),
        }),
        log: [`Ranga ${member.name} leci na ${safeRole}.`, ...prev.log].slice(0, 16),
      };
    });
  };

  const updateGangMemberRole = async (member, nextRole) => {
    if (!game.gang.joined) return;
    if (game.gang.role !== "Boss") return pushLog("Tylko boss ustawia role w ekipie.");
    if (!member?.id) return pushLog("Nie znaleziono czlonka do zmiany rangi.");
    if (
      member.id === game.player.id ||
      String(member.name || "").trim().toLowerCase() === String(game.player.name || "").trim().toLowerCase()
    ) {
      return pushLog("Swojej rangi nie przerzucisz tym przyciskiem.");
    }

    const safeRole = GANG_MEMBER_MANAGEABLE_ROLES.includes(nextRole) ? nextRole : "Czlonek";
    if (member.role === safeRole) return;

    if (hasOnlineAuthority) {
      setGangRoleBusyMemberId(member.id);
      try {
        const result = await updateGangMemberRoleOnline(sessionToken, member.id, safeRole);
        mergeServerUser(result.user, result);
        pushLog(result?.result?.logMessage || `Ranga ${member.name} leci na ${safeRole}.`);
      } catch (error) {
        pushLog(error.message);
      } finally {
        setGangRoleBusyMemberId("");
      }
      return;
    }

    if (!requireOfflineDemoAuthority("Rangi w gangu")) return;
    applyGangMemberRoleLocally(member, safeRole);
  };

  const collectGangTribute = () => {
    if (!requireOfflineDemoAuthority("Haracz gangu")) return;
    if (!canDoStreetAction("Nie odbierzesz haraczu z celi.")) return;
    if (!game.gang.joined) return pushLog("Nie masz jeszcze gangu.");
    if (gangTributeRemaining > 0) return pushLog(`Ludzie jeszcze zbieraja koperte. Wroc za ${formatCooldown(gangTributeRemaining)}.`);
    const payout = 180 * game.gang.members + 120 * game.gang.influence + 420 * game.gang.territory;
    setGame((prev) => ({
      ...prev,
      player: { ...prev.player, cash: prev.player.cash + payout },
      gang: { ...prev.gang, vault: prev.gang.vault + Math.floor(payout * 0.45), lastTributeAt: Date.now() },
      stats: { ...prev.stats, totalEarned: prev.stats.totalEarned + payout },
      log: [`Ludzie z dzielni dorzucaja haracz. Wpada ${formatMoney(payout)}.`, ...prev.log].slice(0, 16),
    }));
  };

  const sendGangMessage = () => {
    if (!requireOfflineDemoAuthority("Chat gangu")) return;
    if (!game.gang.joined) return;
    if (!gangMessage.trim()) return;
    setGame((prev) => ({
      ...prev,
      gang: { ...prev.gang, chat: [{ id: `gang-${Date.now()}`, author: game.player.name, text: gangMessage.trim(), time: nowTimeLabel() }, ...prev.gang.chat].slice(0, 14) },
    }));
    setGangMessage("");
  };

  const depositGangCash = () => {
    if (!game.gang.joined) return pushLog("Najpierw musisz byc w gangu.");
    const amount = Number(bankAmountDraft || 0);
    if (!amount || amount <= 0) return pushLog("Wpisz kwote do zasilenia skarbca.");
    if (game.player.cash < amount) return pushLog(`Brakuje ${formatMoney(amount)} w gotowce.`);

    if (hasOnlineAuthority) {
      contributeGangOnline(sessionToken, amount)
        .then((result) => {
          mergeServerUser(result.user, result);
          refreshSocialState(sessionToken).catch(() => {});
        })
        .catch((error) => pushLog(error.message));
      return;
    }

    if (!requireOfflineDemoAuthority("Skarbiec gangu")) return;

    setGame((prev) => ({
      ...prev,
      player: { ...prev.player, cash: prev.player.cash - amount },
      stats: {
        ...prev.stats,
        gangVaultContributed: Number(prev.stats?.gangVaultContributed || 0) + amount,
      },
      gang: {
        ...prev.gang,
        vault: prev.gang.vault + amount,
        chat: [{ id: `gang-${Date.now()}`, author: "System", text: `${prev.player.name} wrzucil do skarbca ${formatMoney(amount)}.`, time: nowTimeLabel() }, ...prev.gang.chat].slice(0, 14),
      },
      log: [`Wrzuciles do skarbca gangu ${formatMoney(amount)}.`, ...prev.log].slice(0, 16),
    }));
  };

  const setGangFocus = async (districtId) => {
    if (!game.gang.joined) return pushLog("Najpierw musisz byc w gangu.");
    if (!["Boss", "Vice Boss"].includes(String(game.gang.role || "").trim())) {
      return pushLog("Fokus gangu przerzuca Boss albo Vice Boss.");
    }
    const district = findDistrictById(districtId);

    if (hasOnlineAuthority) {
      try {
        const result = await setGangFocusOnline(sessionToken, district.id);
        mergeServerUser(result.user, result);
        refreshSocialState(sessionToken).catch(() => {});
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }

    if (!requireOfflineDemoAuthority("Fokus gangu")) return;
    setGame((prev) => ({
      ...prev,
      gang: normalizeGangState({ ...prev.gang, focusDistrictId: district.id }),
      log: [`Gang ustawia fokus na ${district.name}.`, ...prev.log].slice(0, 16),
    }));
  };

  const investGangProject = async (projectId) => {
    const project = GANG_PROJECTS.find((entry) => entry.id === projectId);
    if (!project) return;
    if (!game.gang.joined) return pushLog("Najpierw musisz byc w gangu.");
    if (String(game.gang.role || "").trim() !== "Boss") return pushLog("Projektami gangu zarzadza Boss.");

    if (hasOnlineAuthority) {
      try {
        const result = await investGangProjectOnline(sessionToken, project.id);
        mergeServerUser(result.user, result);
        refreshSocialState(sessionToken).catch(() => {});
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }

    if (!requireOfflineDemoAuthority("Projekt gangu")) return;
    const cost = getGangProjectCost(game.gang, project.id);
    if (!cost || game.gang.vault < cost) return pushLog(`Brakuje ${formatMoney(cost || 0)} w skarbcu.`);
    const nextLevel = getGangProjectLevel(game.gang, project.id) + 1;
    setGame((prev) => ({
      ...prev,
      gang: normalizeGangState({
        ...prev.gang,
        vault: prev.gang.vault - cost,
        projects: {
          ...(prev.gang.projects || {}),
          [project.id]: nextLevel,
        },
      }),
      log: [`Projekt ${project.name} wskakuje na poziom ${nextLevel}.`, ...prev.log].slice(0, 16),
    }));
  };

  const claimGangGoal = async () => {
    if (!game.gang.joined) return pushLog("Najpierw musisz byc w gangu.");
    if (hasOnlineAuthority) {
      try {
        const result = await claimGangGoalOnline(sessionToken);
        mergeServerUser(result.user, result);
        refreshSocialState(sessionToken).catch(() => {});
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }
    pushLog("Cel tygodnia w tej wersji odbierzesz w online.");
  };

  const startOperation = async (operationId) => {
    if (!canDoCriticalAction("Operacje")) return;
    if (!sessionToken) return pushLog("Operacje w tej wersji sa liczone po stronie backendu.");
    try {
      const result = await startOperationOnline(sessionToken, operationId);
      mergeServerUser(result.user);
    } catch (error) {
      pushLog(error.message);
    }
  };

  const advanceOperation = async (choiceId) => {
    if (!canDoCriticalAction("Operacje")) return;
    if (!sessionToken) return pushLog("Operacje w tej wersji sa liczone po stronie backendu.");
    try {
      const result = await advanceOperationOnline(sessionToken, choiceId);
      mergeServerUser(result.user);
    } catch (error) {
      pushLog(error.message);
    }
  };

  const executeOperationPlan = async () => {
    if (!canDoCriticalAction("Operacje")) return;
    if (!sessionToken) return pushLog("Operacje w tej wersji sa liczone po stronie backendu.");
    try {
      const result = await executeOperationPlanOnline(sessionToken);
      mergeServerUser(result.user);
      showExplicitNotice({
        tone: result?.result?.success ? "success" : "warning",
        title: result?.result?.success ? "OPERACJA DOMKNIETA" : "OPERACJA SPALONA",
        message: result?.result?.logMessage || "Operacja rozliczona.",
        deltas: null,
      });
    } catch (error) {
      pushLog(error.message);
    }
  };

  const sendPrisonMessage = async () => {
    const text = prisonMessage.trim();
    if (!text) return;

    if (sessionToken && apiStatus === "online") {
      try {
        const result = await sendPrisonChatMessageOnline(sessionToken, text);
        setGame((prev) => ({
          ...prev,
          prisonChat: Array.isArray(result?.messages)
            ? normalizeChatFeedEntries(result.messages)
            : prev.prisonChat,
        }));
        setPrisonMessage("");
        return;
      } catch (error) {
        pushLog(error.message || "Nie wyszlo wyslac wiadomosci z celi.");
        return;
      }
    }

    if (!requireOfflineDemoAuthority("Chat wiezienny")) return;
    if (!inJail(game.player)) return;
    setGame((prev) => ({
      ...prev,
      prisonChat: [{ id: `pr-${Date.now()}`, author: prev.player.name, text, time: nowTimeLabel() }, ...prev.prisonChat].slice(0, 18),
    }));
    setPrisonMessage("");
  };

  const sendCityMessage = async () => {
    const text = cityMessage.trim();
    if (!text) return;

    if (sessionToken && apiStatus === "online") {
      try {
        const result = await sendGlobalChatMessageOnline(sessionToken, text);
        setGame((prev) => ({
          ...prev,
          online: {
            ...prev.online,
            cityChat: Array.isArray(result?.messages)
              ? result.messages.map((entry) => ({
                  ...entry,
                  time:
                    typeof entry.time === "string" && entry.time.includes("T")
                      ? new Date(entry.time).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
                      : entry.time,
                }))
              : prev.online.cityChat,
          },
        }));
        setCityMessage("");
        return;
      } catch (error) {
        pushLog(error.message || "Nie wyszlo wyslac wiadomosci do miasta.");
        return;
      }
    }

    setGame((prev) => ({
      ...prev,
      online: {
        ...prev.online,
        cityChat: [{ id: `city-${Date.now()}`, author: prev.player.name, text, time: nowTimeLabel() }, ...prev.online.cityChat].slice(0, 30),
      },
    }));
    setCityMessage("");
  };

  const createGang = () => {
    if (!canDoStreetAction("Gangu nie zakladasz z celi.")) return;
    if (game.gang.joined) return pushLog("Juz jestes w gangu.");
    if (game.player.cash < game.gang.createCost) return pushLog(`Zalozenie gangu kosztuje ${formatMoney(game.gang.createCost)}.`);
    if (game.player.respect < 15) return pushLog("Na zalozenie gangu potrzebujesz co najmniej 15 szacunu.");

    const cleanName = gangDraftName.trim();
    if (cleanName.length < 3) return pushLog("Nazwa gangu jest za krotka.");

    if (hasOnlineAuthority) {
      createGangOnline(sessionToken, cleanName)
        .then((result) => {
          mergeServerUser(result.user, result);
          refreshSocialState(sessionToken).catch(() => {});
        })
        .catch((error) => pushLog(error.message));
      return;
    }

    if (!requireOfflineDemoAuthority("Zakladanie gangu")) return;

    setGame((prev) => ({
      ...prev,
      player: { ...prev.player, cash: prev.player.cash - prev.gang.createCost },
      gang: {
        ...prev.gang,
        joined: true,
        role: "Boss",
        name: cleanName,
        members: 1,
        territory: 1,
        influence: 8,
        vault: 2000,
        gearScore: 68,
        jailedCrew: 0,
        crewLockdownUntil: 0,
        membersList: [{ id: "gm-self", name: prev.player.name, role: "Boss", trusted: true }],
        chat: [
          { id: `gang-${Date.now()}`, author: "System", text: `Gang ${cleanName} zostal zalozony.`, time: nowTimeLabel() },
          { id: `gang-${Date.now() + 1}`, author: "System", text: "Startujesz solo. Reszte skladu musza stanowic prawdziwi gracze z zaproszen.", time: nowTimeLabel() },
        ],
      },
      log: [`Zakladasz gang ${cleanName}. Kasa -${formatMoney(prev.gang.createCost)}.`, ...prev.log].slice(0, 16),
    }));
  };

  const joinGang = (inviteId) => {
    if (!canDoStreetAction("Do gangu dolaczasz dopiero po wyjsciu z celi.")) return;
    if (game.gang.joined) return pushLog("Najpierw opusc obecny gang.");
    const invite = game.gang.invites.find((entry) => entry.id === inviteId);
    if (!invite) return;
    if (game.player.respect < invite.inviteRespectMin) return pushLog(`Ten gang bierze od ${invite.inviteRespectMin} szacunu.`);

    if (hasOnlineAuthority) {
      joinGangOnline(sessionToken, invite)
        .then((result) => {
          mergeServerUser(result.user, result);
          refreshSocialState(sessionToken).catch(() => {});
        })
        .catch((error) => pushLog(error.message));
      return;
    }

    if (!requireOfflineDemoAuthority("Dolaczanie do gangu")) return;

    setGame((prev) => ({
      ...prev,
      gang: {
        ...prev.gang,
        joined: true,
        role: "Czlonek",
        name: invite.gangName,
        members: invite.members + 1,
        territory: invite.territory,
        influence: 6 + invite.territory * 2,
        vault: 2600 + invite.members * 120,
        gearScore: 57,
        jailedCrew: 0,
        crewLockdownUntil: 0,
        membersList: [
          { id: "gm-boss", name: invite.leader, role: "Boss", trusted: true },
          { id: "gm-self", name: prev.player.name, role: "Czlonek", trusted: false },
          { id: "gm-vb", name: invite.gangName === "Grey Saints" ? "Ash" : "Razor", role: "Vice Boss", trusted: true },
        ],
        chat: [
          { id: `gang-${Date.now()}`, author: "System", text: `${prev.player.name} dolacza do ${invite.gangName}.`, time: nowTimeLabel() },
        ],
        invites: prev.gang.invites.filter((entry) => entry.id !== inviteId),
      },
      log: [`Dolaczasz do gangu ${invite.gangName}.`, ...prev.log].slice(0, 16),
    }));
  };

  const leaveGang = () => {
    if (!game.gang.joined) return pushLog("Nie jestes w zadnym gangu.");

    if (hasOnlineAuthority) {
      leaveGangOnline(sessionToken)
        .then((result) => {
          mergeServerUser(result.user, result);
          refreshSocialState(sessionToken).catch(() => {});
        })
        .catch((error) => pushLog(error.message));
      return;
    }

    if (!requireOfflineDemoAuthority("Opuszczanie gangu")) return;
    setGame((prev) => ({
      ...prev,
      gang: {
        ...prev.gang,
        joined: false,
        role: null,
        name: null,
        members: 0,
        territory: 0,
        influence: 0,
        vault: 0,
        gearScore: 62,
        jailedCrew: 0,
        crewLockdownUntil: 0,
        membersList: [],
        chat: [],
      },
      log: ["Opusciles gang. Zostajesz znowu solo na miescie.", ...prev.log].slice(0, 16),
    }));
  };

  const updateGangInviteThreshold = async (nextThreshold) => {
    if (!game.gang.joined) return;
    if (game.gang.role !== "Boss") return pushLog("Tylko boss ustawia prog zaproszen.");

    const targetThreshold = clampGangInviteRespectMin(nextThreshold);
    if (targetThreshold === game.gang.inviteRespectMin) return;

    if (sessionToken && apiStatus === "online") {
      setGangSettingsBusy(true);
      try {
        const result = await updateGangSettingsOnline(sessionToken, {
          inviteRespectMin: targetThreshold,
        });
        mergeServerUser(result.user, result);
        refreshSocialState(sessionToken).catch(() => {});
        pushLog(result?.result?.logMessage || `Prog wejscia do gangu ustawiony na ${targetThreshold} RES.`);
      } catch (error) {
        pushLog(error.message);
      } finally {
        setGangSettingsBusy(false);
      }
      return;
    }

    if (!requireOfflineDemoAuthority("Ustawienia gangu")) return;
    setGame((prev) => ({
      ...prev,
      gang: normalizeGangState({
        ...prev.gang,
        inviteRespectMin: targetThreshold,
        chat: [
          {
            id: `gang-settings-${Date.now()}`,
            author: "System",
            text: `Boss ustawia prog wejscia na ${targetThreshold} RES.`,
            time: nowTimeLabel(),
          },
          ...(prev.gang.chat || []),
        ].slice(0, 20),
      }),
    }));
    pushLog(`Prog wejscia do gangu ustawiony na ${targetThreshold} RES.`);
  };

  const changeGangInviteThreshold = (delta) => {
    updateGangInviteThreshold((game.gang.inviteRespectMin || GANG_INVITE_RESPECT_MIN) + delta);
  };

  const inviteCandidate = (candidateId) => {
    if (!game.gang.joined) return;
    if (game.gang.role !== "Boss") return pushLog("Tylko boss moze wysylac zaproszenia.");
    if (game.gang.members >= game.gang.maxMembers) return pushLog("Gang jest juz pelny. Rozbuduj sklad albo zrob miejsce.");
    const candidate = (game.online?.roster || []).find((entry) => entry.id === candidateId);
    if (!candidate) return;
    if (candidate.gang !== "No gang") return pushLog("Ten gracz jest juz w gangu.");
    if (candidate.respect < game.gang.inviteRespectMin) return pushLog("Ten kandydat nie dobija do ustawionego progu szacunu.");

    if (sessionToken && apiStatus === "online") {
      invitePlayerToGangOnline(sessionToken, candidateId)
        .then((result) => {
          mergeServerUser(result.user, result);
          refreshSocialState(sessionToken).catch(() => {});
          pushLog(result?.result?.message || `Zaproszenie wyslane do ${candidate.name}.`);
        })
        .catch((error) => pushLog(error.message));
      return;
    }

    if (!requireOfflineDemoAuthority("Zaproszenia do gangu")) return;

    setGame((prev) => ({
      ...prev,
      gang: {
        ...prev.gang,
        chat: [{ id: `gang-${Date.now()}`, author: "System", text: `Wyslano zaproszenie do ${candidate.name}.`, time: nowTimeLabel() }, ...prev.gang.chat].slice(0, 14),
      },
      online: {
        ...prev.online,
        messages: [
          { id: `msg-${Date.now()}`, from: candidate.name, subject: "Zaproszenie do gangu", preview: `${prev.gang.name} chce Cie w ekipie. Teraz to ma byc oparte o realnych graczy, nie botow.`, time: nowTimeLabel() },
          ...prev.online.messages,
        ].slice(0, 18),
      },
      log: [`Zaproszenie wyslane do ${candidate.name}.`, ...prev.log].slice(0, 16),
    }));
  };

  const deleteGang = () => {
    if (!game.gang.joined) return pushLog("Nie masz gangu do usuniecia.");
    if (game.gang.role !== "Boss") return pushLog("Gang usuwa tylko boss.");
    if (!sessionToken || apiStatus !== "online") return pushLog("Usuwanie gangu dziala tylko online.");

    Alert.alert(
      "Usun gang",
      `Na pewno chcesz usunac ${game.gang.name}? To wywali sklad i zaproszenia tego gangu.`,
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Usun",
          style: "destructive",
          onPress: () => {
            deleteGangOnline(sessionToken)
              .then((result) => {
                mergeServerUser(result.user, result);
                refreshSocialState(sessionToken).catch(() => {});
                setGame((prev) => ({
                  ...prev,
                  online: {
                    ...prev.online,
                    selectedGangId: prev.online.selectedGangId === game.gang.name ? null : prev.online.selectedGangId,
                  },
                }));
                pushLog(result?.result?.message || "Gang zostal usuniety.");
              })
              .catch((error) => pushLog(error.message));
          },
        },
      ]
    );
  };

  // Offline demo keeps a tiny fallback, but online always delegates transfer validation to backend.
  const depositCash = async () => {
    const parsed = Number.parseInt(bankAmountDraft.replace(/[^\d]/g, ""), 10);
    if (!parsed || parsed <= 0) return pushLog("Wpisz sensowna kwote do wplaty.");

    if (hasOnlineAuthority) {
      try {
        const result = await depositOnline(sessionToken, parsed);
        mergeServerUser(result.user);
        setBankAmountDraft(String(parsed));
        registerBankTransferFeedback("deposit", parsed);
        return;
      } catch (error) {
        pushLog(error.message);
        return;
      }
    }

    const amount = Math.min(parsed, Math.max(0, game.player.cash));
    if (!amount) return pushLog("Nie masz gotowki do wplaty.");
    if (parsed > game.player.cash) return pushLog("Nie masz tyle gotowki przy sobie.");
    setGame((prev) => ({
      ...prev,
      player: { ...prev.player, cash: prev.player.cash - amount, bank: (prev.player.bank || 0) + amount },
      stats: {
        ...prev.stats,
        bankDepositedTotal: Number(prev.stats?.bankDepositedTotal || 0) + amount,
      },
      log: [`Wplacono do banku ${formatMoney(amount)}.`, ...prev.log].slice(0, 16),
    }));
    setBankAmountDraft(String(amount));
    registerBankTransferFeedback("deposit", amount);
  };

  // Offline demo keeps a tiny fallback, but online always delegates withdrawal validation to backend.
  const withdrawCash = async () => {
    const parsed = Number.parseInt(bankAmountDraft.replace(/[^\d]/g, ""), 10);
    if (!parsed || parsed <= 0) return pushLog("Wpisz sensowna kwote do wyplaty.");

    if (hasOnlineAuthority) {
      try {
        const result = await withdrawOnline(sessionToken, parsed);
        mergeServerUser(result.user);
        setBankAmountDraft(String(parsed));
        registerBankTransferFeedback("withdraw", parsed);
        return;
      } catch (error) {
        pushLog(error.message);
        return;
      }
    }

    const bankBalance = game.player.bank || 0;
    const amount = Math.min(parsed, Math.max(0, bankBalance));
    if (!amount) return pushLog("Nie masz nic w banku.");
    if (parsed > bankBalance) return pushLog("Nie masz tyle siana na koncie.");
    updateLocalPlayer({ cash: game.player.cash + amount, bank: Math.max(0, (game.player.bank || 0) - amount) }, `Wyplacono z banku ${formatMoney(amount)}.`);
    setBankAmountDraft(String(amount));
    registerBankTransferFeedback("withdraw", amount);
  };

  const claimTask = async (task) => {
    if (sessionToken && apiStatus === "online") {
      try {
        const result = await claimTaskOnline(sessionToken, task.id);
        mergeServerUser(result.user);
        return result?.result || true;
      } catch (error) {
        pushLog(error.message);
        return false;
      }
    }
    if (!requireOfflineDemoAuthority("Misje i nagrody")) return false;
    if (!task.completed || task.claimed) return false;
    const rewardNotes = [];
    if (task.rewardXp) rewardNotes.push(`+${task.rewardXp} XP`);
    if (task.rewardEnergy) rewardNotes.push(`+${task.rewardEnergy} energii`);
    if (task.rewardHp) rewardNotes.push(`+${task.rewardHp} HP`);
    setGame((prev) => ({
      ...prev,
      player: applyProgressionToPlayer(
        {
          ...prev.player,
          cash: prev.player.cash + task.rewardCash,
          energy: clamp(prev.player.energy + Number(task.rewardEnergy || 0), 0, prev.player.maxEnergy),
          hp: clamp(prev.player.hp + Number(task.rewardHp || 0), 0, prev.player.maxHp),
        },
        task.rewardXp
      ).player,
      tasksClaimed: [...prev.tasksClaimed, task.id],
      stats: { ...prev.stats, totalEarned: prev.stats.totalEarned + task.rewardCash },
      log: [`Odebrano zadanie: ${task.title}. ${formatMoney(task.rewardCash)}${rewardNotes.length ? ` i ${rewardNotes.join(", ")}` : ""}.`, ...prev.log].slice(0, 16),
    }));
    return {
      taskId: task.id,
      rewardCash: task.rewardCash,
      rewardXp: task.rewardXp,
      rewardEnergy: Number(task.rewardEnergy || 0),
      rewardHp: Number(task.rewardHp || 0),
    };
  };

  const claimReferralMilestone = (milestone) => {
    if (!requireOfflineDemoAuthority("Program polecen")) return;
    if (game.referrals.verified < milestone.verified) return pushLog(`Prog odblokuje sie przy ${milestone.verified} aktywnych poleconych.`);
    if (game.referrals.claimedMilestones.includes(milestone.id)) return pushLog("Ta nagroda z polecen jest juz odebrana.");

    setGame((prev) => ({
      ...prev,
      player: applyProgressionToPlayer(
        {
          ...prev.player,
          cash: prev.player.cash + milestone.rewardCash,
        },
        milestone.rewardXp
      ).player,
      referrals: {
        ...prev.referrals,
        claimedMilestones: [...prev.referrals.claimedMilestones, milestone.id],
      },
      log: [
        `Program polecen: odebrane ${formatMoney(milestone.rewardCash)}${milestone.rewardXp ? ` i +${milestone.rewardXp} XP` : ""}.`,
        ...prev.log,
      ].slice(0, 16),
    }));
  };

  const openWorldPlayerProfile = (playerId) => {
    setGame((prev) => ({
      ...prev,
      online: {
        ...prev.online,
        selectedPlayerId: playerId,
      },
    }));
  };

  const closeWorldPlayerProfile = () => {
    setGame((prev) => ({
      ...prev,
      online: {
        ...prev.online,
        selectedPlayerId: null,
      },
    }));
  };

  const openGangProfile = (gangName) => {
    if (!gangName || gangName === "No gang") return pushLog("Ten gracz nie ma jeszcze gangu, wiec nie ma czego otwierac.");
    setGangProfileView("actions");
    setGame((prev) => ({
      ...prev,
      online: {
        ...prev.online,
        selectedGangId: gangName,
      },
    }));
    setTab("gang");
    setActiveSection("gang", "overview");
  };

  const closeGangProfile = () => {
    setGangProfileView("actions");
    setGame((prev) => ({
      ...prev,
      online: {
        ...prev.online,
        selectedGangId: null,
      },
    }));
  };

  const renderGangRoleControls = (member) => {
    if (!game.gang.joined || game.gang.role !== "Boss") return null;
    const isSelf =
      member?.id === game.player.id ||
      String(member?.name || "").trim().toLowerCase() === String(game.player.name || "").trim().toLowerCase();
    if (isSelf) return null;

    const busy = gangRoleBusyMemberId === member?.id;
    return (
      <View style={styles.listActionsRow}>
        {GANG_MEMBER_MANAGEABLE_ROLES.map((role) => (
          <Pressable
            key={`${member.id}-${role}`}
            onPress={() => updateGangMemberRole(member, role)}
            disabled={busy || member.role === role}
            style={[
              styles.inlineButton,
              (busy || member.role === role) && styles.tileDisabled,
            ]}
          >
            <Text style={styles.inlineButtonText}>{GANG_ROLE_BUTTON_LABELS[role] || role}</Text>
          </Pressable>
        ))}
      </View>
    );
  };

  const sendGangAllianceOffer = (gangProfile) => {
    if (!gangProfile || gangProfile.self) return pushLog("To Twoj gang. Tu nie wysylasz sobie sojuszu.");
    if (!game.gang.joined) return pushLog("Sojusz wysyla juz konkretna ekipa, nie solo gracz.");
    if (game.gang.name === gangProfile.name) return pushLog("To Twoj gang.");

    if (hasOnlineAuthority) {
      sendGangAllianceOfferOnline(sessionToken, gangProfile.name)
        .then((result) => {
          mergeServerUser(result.user, { gangs: result.gangs });
          showExplicitNotice({
            tone: "success",
            title: "OFERTA SOJUSZU",
            message: result?.result?.logMessage || `Oferta sojuszu poleciala do ${gangProfile.name}.`,
            deltas: null,
          });
        })
        .catch((error) => pushLog(error.message));
      return;
    }

    setGame((prev) => ({
      ...prev,
      online: {
        ...prev.online,
        messages: [
          {
            id: `msg-${Date.now()}`,
            from: "System",
            subject: "Oferta sojuszu",
            preview: `${prev.gang.name} wysyla propozycje sojuszu do ${gangProfile.name}. Boss ${gangProfile.boss} dostaje sygnal.`,
            time: nowTimeLabel(),
          },
          ...prev.online.messages,
        ].slice(0, 20),
      },
      log: [`Wyslales propozycje sojuszu do ${gangProfile.name}.`, ...prev.log].slice(0, 16),
    }));
  };

  useEffect(() => {
    if (!hasOnlineAuthority || !selectedGangProfile || selectedGangProfile.self) {
      setGangRaidPreviewState((prev) =>
        prev.gangName || prev.loading || prev.preview
          ? { gangName: "", loading: false, preview: null }
          : prev
      );
      return;
    }

    let cancelled = false;
    const gangName = selectedGangProfile.name;
    setGangRaidPreviewState((prev) => ({
      gangName,
      loading: true,
      preview: prev.gangName === gangName ? prev.preview : null,
    }));

    previewGangPvpOnline(sessionToken, gangName)
      .then((preview) => {
        if (cancelled) return;
        setGangRaidPreviewState({
          gangName,
          loading: false,
          preview,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setGangRaidPreviewState({
          gangName,
          loading: false,
          preview: null,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [hasOnlineAuthority, sessionToken, selectedGangProfile]);

  const attackGangProfile = async (gangProfile) => {
    if (!gangProfile || gangProfile.self) return pushLog("Nie zaatakujesz wlasnego gangu z poziomu tej akcji.");
    if (!canDoStreetAction("Atak na gang odpalasz dopiero po wyjsciu z celi.")) return;
    if (!canDoCriticalAction("Najazdy gangu")) return;
    if (hasOnlineAuthority) {
      try {
        const result = await executeGangPvpOnline(sessionToken, gangProfile.name);
        mergeServerUser(result.user, { gangs: result.gangs, clubMarket: result.clubMarket });
        setGangRaidPreviewState({
          gangName: gangProfile.name,
          loading: false,
          preview: result?.result?.preview || null,
        });
        showExplicitNotice({
          tone: result?.result?.success ? "success" : "warning",
          title: result?.result?.success ? "NAJAZD SIEDZI" : "NAJAZD ODBITY",
          message: result?.result?.logMessage || `Backend rozliczyl najazd na ${gangProfile.name}.`,
          deltas: null,
        });
        refreshSocialState(sessionToken).catch(() => {});
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }
    if (!requireOfflineDemoAuthority("Finalny wynik PvP")) return;
    if (!game.gang.joined) return pushLog("Na gang idzie sie ze swoja ekipa, nie solo.");
    if (game.player.energy < 3) return pushLog("Potrzebujesz 3 energii na akcje przeciw gangowi.");

    let successChance;
    let previewLoss = null;
    if (successChance == null) {
      const ownGangPower = game.gang.members * 7 + game.gang.influence * 6 + game.gang.territory * 11 + game.gang.gearScore * 1.3 + game.player.respect * 0.6;
      const enemyPower = gangProfile.members * 7 + gangProfile.influence * 6 + gangProfile.territory * 11 + gangProfile.respect * 1.8;
      successChance = clamp(0.22 + (ownGangPower - enemyPower) / 220, 0.08, 0.78);
    }

    if (Math.random() < successChance) {
      const serverPreviewSteal = previewLoss?.cashLoss ? Math.max(800, Math.round(previewLoss.cashLoss * 0.65)) : null;
      const steal = serverPreviewSteal ?? (randomBetween(2200, 6800) + gangProfile.influence * 180);
      setGame((prev) => ({
        ...prev,
        player: {
          ...prev.player,
          energy: prev.player.energy - 3,
          cash: prev.player.cash + steal,
          heat: clamp(prev.player.heat + 7, 0, 100),
        },
        gang: {
          ...prev.gang,
          influence: prev.gang.influence + 1,
          chat: [
            { id: `gang-${Date.now()}`, author: "System", text: `Docisnieto ${gangProfile.name}. Wpada ${formatMoney(steal)} z ich zaplecza.`, time: nowTimeLabel() },
            ...prev.gang.chat,
          ].slice(0, 14),
        },
        online: {
          ...prev.online,
          messages: [
            { id: `msg-${Date.now()}`, from: "System", subject: "Atak na gang", preview: `Docisnales ${gangProfile.name} i zabraliscie ${formatMoney(steal)} z ich obiegu.`, time: nowTimeLabel() },
            ...prev.online.messages,
          ].slice(0, 20),
        },
        log: [`Atak na ${gangProfile.name} siadl. Ekipy zgarnely ${formatMoney(steal)}.`, ...prev.log].slice(0, 16),
      }));
      return;
    }

    setGame((prev) => ({
      ...prev,
      player: {
        ...prev.player,
        energy: prev.player.energy - 3,
        hp: clamp(prev.player.hp - randomBetween(10, 20), 0, prev.player.maxHp),
        heat: clamp(prev.player.heat + 4, 0, 100),
      },
      gang: {
        ...prev.gang,
        gearScore: clamp(prev.gang.gearScore - randomBetween(1, 4), 18, 100),
        chat: [
          { id: `gang-${Date.now()}`, author: "System", text: `Atak na ${gangProfile.name} nie siadl. Dostaliscie po lapach i zjechal sprzet.`, time: nowTimeLabel() },
          ...prev.gang.chat,
        ].slice(0, 14),
      },
      log: [`Atak na ${gangProfile.name} nie wyszedl. Ekipa cofa sie po obiciu.`, ...prev.log].slice(0, 16),
    }));
  };

  const addWorldPlayerFriend = async (player) => {
    if (!player?.id) return pushLog("Nie ma gracza do dodania.");
    if (game.online.friends.some((entry) => entry.id === player.id)) return pushLog(`${player.name} juz siedzi w znajomych.`);

    if (sessionToken && apiStatus === "online") {
      try {
        const result = await addFriendOnline(sessionToken, player.id);
        mergeServerUser(result.user);
        await refreshSocialState(sessionToken);
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }

    if (!requireOfflineDemoAuthority("Znajomi")) return;

    setGame((prev) => ({
      ...prev,
      online: {
        ...prev.online,
        friends: [...prev.online.friends, { id: player.id, name: player.name, gang: player.gang, online: player.online, respect: player.respect }],
        messages: [
          { id: `msg-${Date.now()}`, from: "System", subject: "Zaproszenie do znajomych", preview: `Wyslales zaproszenie do ${player.name}.`, time: nowTimeLabel() },
          ...prev.online.messages,
        ].slice(0, 20),
      },
      log: [`Wyslano zaproszenie do znajomych: ${player.name}.`, ...prev.log].slice(0, 16),
    }));
  };

  const sendDirectMessageToPlayer = async () => {
    const player = directMessageRecipient;
    const message = directMessageDraft.trim();

    if (!player?.name) {
      pushLog("Nie ma celu dla tej wiadomosci.");
      return;
    }
    if (!message) {
      pushLog("Najpierw wpisz tresc wiadomosci.");
      return;
    }

    if (sessionToken && apiStatus === "online") {
      if (!player?.id) {
        pushLog("Tego kontaktu nie da sie jeszcze zlapac prywatnie online.");
        return;
      }
      try {
        const result = await sendDirectMessageOnline(sessionToken, player.id, message);
        mergeServerUser(result.user);
        await refreshSocialState(sessionToken);
        showExplicitNotice({
          tone: "success",
          title: "WIADOMOSC POSZLA",
          message: `Wyslales wiadomosc do ${player.name}.`,
          deltas: null,
          allowWhileQuickAction: true,
        });
        closeQuickAction();
      } catch (error) {
        pushLog(error.message);
      }
      setActiveSection("profile", "messages");
      return;
    }

    if (!requireOfflineDemoAuthority("Prywatne wiadomosci")) return;
    setGame((prev) => ({
      ...prev,
      online: {
        ...prev.online,
        messages: [
          { id: `msg-${Date.now()}`, from: player.name, subject: "Prywatna wiadomosc", preview: message, time: nowTimeLabel() },
          ...prev.online.messages,
        ].slice(0, 20),
      },
      log: [`Wyslales wiadomosc do ${player.name}.`, ...prev.log].slice(0, 16),
    }));
    closeQuickAction();
    setActiveSection("profile", "messages");
  };

  const placeBountyOnPlayer = async (player) => {
    if (!canDoStreetAction("Nie ustawisz bounty z celi.")) return;
    const price = PLAYER_BOUNTY_COST;
    if (game.player.cash < price) return pushLog(`Brakuje ${formatMoney(price)} na wystawienie bounty.`);

    if (sessionToken && apiStatus === "online") {
      try {
        const result = await placeBountyOnline(sessionToken, player.id);
        mergeServerUser(result.user);
        await refreshSocialState(sessionToken);
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }

    if (!requireOfflineDemoAuthority("Wystawianie bounty")) return;

    setGame((prev) => ({
      ...prev,
      player: { ...prev.player, cash: prev.player.cash - price },
      online: {
        ...prev.online,
        roster: prev.online.roster.map((entry) => (entry.id === player.id ? { ...entry, bounty: entry.bounty + PLAYER_BOUNTY_INCREMENT } : entry)),
        messages: [
          { id: `msg-${Date.now()}`, from: "System", subject: "Bounty wystawione", preview: `Na glowe ${player.name} dorzucono ${formatMoney(PLAYER_BOUNTY_INCREMENT)} bounty.`, time: nowTimeLabel() },
          ...prev.online.messages,
        ].slice(0, 20),
      },
      log: [`Wystawiles bounty na ${player.name}. Koszt ${formatMoney(price)}.`, ...prev.log].slice(0, 16),
    }));
  };

  const grantAdminCashToPlayer = async (player, amount) => {
    if (!sessionToken || apiStatus !== "online") return pushLog("Admin tools dzialaja tylko online.");
    if (!game.player.isAdmin) return pushLog("To narzedzie jest tylko dla admina.");
    if (!player?.id) return pushLog("Tego gracza nie da sie teraz namierzyc.");

    try {
      const result = await grantAdminCashToPlayerOnline(sessionToken, player.id, amount);
      mergeServerUser(result.user);
      try {
        await refreshSocialState(sessionToken);
      } catch (_error) {}
      showExplicitNotice({
        tone: "success",
        title: "ADMIN GRANT",
        message: `Dosypano ${formatMoney(result?.result?.amount || amount)} dla ${result?.target?.name || player.name}.`,
        deltas: null,
      });
    } catch (error) {
      pushLog(error.message || "Grant admina nie wyszedl.");
    }
  };

  const grantAdminRespectToPlayer = async (player, amount) => {
    if (!sessionToken || apiStatus !== "online") return pushLog("Admin tools dzialaja tylko online.");
    if (!game.player.isAdmin) return pushLog("To narzedzie jest tylko dla admina.");
    if (!player?.id) return pushLog("Tego gracza nie da sie teraz namierzyc.");

    try {
      const result = await grantAdminRespectToPlayerOnline(sessionToken, player.id, amount);
      mergeServerUser(result.user);
      try {
        await refreshSocialState(sessionToken);
      } catch (_error) {}
      showExplicitNotice({
        tone: "success",
        title: "SZACUN WBITY",
        message: `Wbito +${result?.result?.amount || amount} RES dla ${result?.target?.name || player.name}.`,
        deltas: null,
      });
    } catch (error) {
      pushLog(error.message || "Grant szacunku nie wyszedl.");
    }
  };

  const deleteAdminPlayerAccount = (player) => {
    const login = String(player?.name || "").trim();
    if (!sessionToken || apiStatus !== "online") return pushLog("Admin tools dzialaja tylko online.");
    if (!game.player.isAdmin) return pushLog("To narzedzie jest tylko dla admina.");
    if (!login) return pushLog("Nie ma loginu do usuniecia.");
    if (login === adminDeleteBusyLogin) return;

    const confirmDelete = async () => {
      setAdminDeleteBusyLogin(login);
      try {
        const result = await deleteAdminPlayerAccountOnline(sessionToken, login);
        mergeServerUser(result.user);
        try {
          await refreshSocialState(sessionToken);
        } catch (_error) {}
        closeWorldPlayerProfile();
        showExplicitNotice({
          tone: "success",
          title: "KONTO USUNIETE",
          message: result?.result?.message || `Usunieto konto ${login}.`,
          deltas: null,
        });
      } catch (error) {
        pushLog(error.message || "Usuwanie konta nie wyszlo.");
      } finally {
        setAdminDeleteBusyLogin((prev) => (prev === login ? "" : prev));
      }
    };

    Alert.alert(
      "Usunac konto?",
      `Konto ${login} zniknie z gry na stale. Tego nie cofnie nawet admin.`,
      [
        { text: "Anuluj", style: "cancel" },
        { text: "Usun konto", style: "destructive", onPress: confirmDelete },
      ]
    );
  };

  const attackWorldPlayer = (player) => {
    if (!player?.id) return pushLog("Nie ma celu do ataku.");
    if (!canDoCriticalAction("PvP")) return;
    if (Number(player.criticalCareUntil || 0) > Date.now()) {
      return pushLog(`${player.name} lezy teraz na intensywnej terapii.`);
    }
    if (Number(player.criticalProtectionUntil || 0) > Date.now()) {
      return pushLog(`${player.name} dopiero wyszedl z terapii i ma jeszcze chwilowa oslone.`);
    }
    const targetAttackCooldownRemaining = Math.max(0, Number(game.cooldowns?.playerAttackTargets?.[player.id] || 0) - Date.now());
    if (targetAttackCooldownRemaining > 0) {
      return pushLog(`Na tego gracza odpalisz kolejny atak za ${formatCooldown(targetAttackCooldownRemaining)}.`);
    }

    if (sessionToken && apiStatus === "online") {
      attackPlayerOnline(sessionToken, player.id)
        .then(async (result) => {
          mergeServerUser(result.user);
          try {
            await refreshSocialState(sessionToken);
          } catch (_error) {}
          showExplicitNotice({
            tone: result?.result?.success ? "success" : "warning",
            title: result?.result?.success ? "ATAK UDANY" : "ATAK NIE WYSZEDL",
            message:
              result?.result?.message ||
              (result?.result?.success
                ? `Udany atak na ${player.name}.`
                : `Atak na ${player.name} nie wyszedl.`),
            deltas: null,
          });
        })
        .catch((error) => {
          pushLog(error.message || "Nie udalo sie zaatakowac gracza.");
        });
      return;
    }

    if (!requireOfflineDemoAuthority("Ataki na graczy")) return;
    if (!canDoStreetAction("Nie odpalisz ataku zza krat.")) return;
    if (game.player.energy < 2) return pushLog("Za malo energii na atak gracza.");

    const myPower = effectivePlayer.attack * 1.1 + effectivePlayer.defense * 0.7 + effectivePlayer.dexterity * 1.3 + game.player.respect * 0.35;
    const enemyPower = player.attack * 1.05 + player.defense * 0.8 + player.dexterity * 1.15 + player.respect * 0.32;
    const successChance = clamp(0.4 + (myPower - enemyPower) / 120 - game.player.heat * 0.002, 0.08, 0.9);

    if (Math.random() < successChance) {
      const steal = Math.max(250, Math.min(player.cash, randomBetween(400, 2400)));
      setGame((prev) => ({
        ...prev,
        player: {
          ...prev.player,
          cash: prev.player.cash + steal,
          energy: prev.player.energy - 2,
          heat: clamp(prev.player.heat + 6, 0, 100),
        },
        cooldowns: {
          ...(prev.cooldowns || {}),
          playerAttackTargets: {
            ...normalizeTargetCooldownMap(prev.cooldowns?.playerAttackTargets),
            [player.id]: Date.now() + PLAYER_SAME_TARGET_ATTACK_COOLDOWN_MS,
          },
        },
        online: {
          ...prev.online,
          roster: prev.online.roster.map((entry) => (entry.id === player.id ? { ...entry, cash: Math.max(0, entry.cash - steal) } : entry)),
          messages: [
            { id: `msg-${Date.now()}`, from: "System", subject: "Udany atak", preview: `Osmyczkowales ${player.name} i zgarnales ${formatMoney(steal)}.`, time: nowTimeLabel() },
            ...prev.online.messages,
          ].slice(0, 20),
        },
        log: [`Udany atak na ${player.name}. Zgarniete ${formatMoney(steal)}.`, ...prev.log].slice(0, 16),
      }));
      return;
    }

    setGame((prev) => ({
      ...prev,
      player: {
        ...prev.player,
        energy: prev.player.energy - 2,
        hp: clamp(prev.player.hp - randomBetween(8, 18), 0, prev.player.maxHp),
        heat: clamp(prev.player.heat + 3, 0, 100),
      },
        cooldowns: {
          ...(prev.cooldowns || {}),
          playerAttackTargets: {
            ...normalizeTargetCooldownMap(prev.cooldowns?.playerAttackTargets),
            [player.id]: Date.now() + PLAYER_SAME_TARGET_ATTACK_COOLDOWN_MS,
          },
        },
      online: {
        ...prev.online,
        messages: [
          { id: `msg-${Date.now()}`, from: "System", subject: "Atak nie wyszedl", preview: `${player.name} utrzymal pozycje. Wroc mocniejszy albo czystszy.`, time: nowTimeLabel() },
          ...prev.online.messages,
        ].slice(0, 20),
      },
      log: [`Atak na ${player.name} nie wyszedl. Dostales po lapach.`, ...prev.log].slice(0, 16),
    }));
  };

  const getRouletteNumberForColor = (color) => {
    if (color === "green") return 0;
    const pool = [];
    for (let value = 1; value <= 36; value += 1) {
      const valueColor = value % 2 === 0 ? "black" : "red";
      if (valueColor === color) pool.push(value);
    }
    return pool[randomBetween(0, pool.length - 1)];
  };

  const animateRouletteResult = (selectedChoice, outcomeColor, onFinish) => {
    let ticks = 0;
    const interval = setInterval(() => {
      ticks += 1;
      const display = String(randomBetween(0, 36)).padStart(2, "0");
      setCasinoState((prev) => ({ ...prev, rouletteDisplay: display }));

      if (ticks >= 18) {
        clearInterval(interval);
        const result = getRouletteNumberForColor(outcomeColor);
        setCasinoState((prev) => ({
          ...prev,
          rouletteSpinning: false,
          rouletteDisplay: String(result).padStart(2, "0"),
          rouletteResult: { number: result, color: outcomeColor, selectedChoice },
          rouletteHistory: [{ number: result, color: outcomeColor }, ...prev.rouletteHistory].slice(0, 8),
        }));
        onFinish?.(result);
      }
    }, 120);
  };

  const SLOT_SYMBOL_SETS = {
    jackpot: ["CROWN", "CROWN", "CROWN"],
    triple: ["MASK", "MASK", "MASK"],
    double: ["CASH", "CASH", "BAR"],
    single: ["CASH", "BAR", "DICE"],
    miss: ["MASK", "DICE", "SKULL"],
  };

  const animateSlotResult = (symbols, onFinish) => {
    const pool = ["MASK", "CASH", "BAR", "DICE", "SKULL", "CROWN"];
    let ticks = 0;
    const interval = setInterval(() => {
      ticks += 1;
      setCasinoState((prev) => ({
        ...prev,
        slotDisplay: [
          pool[randomBetween(0, pool.length - 1)],
          pool[randomBetween(0, pool.length - 1)],
          pool[randomBetween(0, pool.length - 1)],
        ],
      }));

      if (ticks >= 16) {
        clearInterval(interval);
        setCasinoState((prev) => ({
          ...prev,
          slotSpinning: false,
          slotDisplay: symbols,
        }));
        onFinish?.();
      }
    }, 95);
  };

  const spinSlot = async () => {
    if (!canDoStreetAction("Kasyno nie wpuszcza ludzi w kajdankach.")) return;
    if (casinoState.slotSpinning) return;
    const slotConfig = getCasinoGameConfig(casinoState.backendMeta, "slot", {
      minBet: 100,
      maxBet: 50000,
    });
    const bet = Number(casinoState.slotBet || 0);

    if (hasOnlineAuthority) {
      if (slotConfig.cooldownRemainingMs > 0) {
        return pushLog(`Kasyno studzi stol. Wroc za ${formatCooldown(slotConfig.cooldownRemainingMs)}.`);
      }
      if (slotConfig.hasServerLimits && bet < slotConfig.minBet) {
        return pushLog(`Minimalna stawka slota to ${formatMoney(slotConfig.minBet)}.`);
      }
      if (slotConfig.hasServerLimits && bet > slotConfig.maxBet) {
        setCasinoState((prev) => ({ ...prev, slotBet: String(slotConfig.maxBet) }));
        return pushLog(`Na ten automat max stawka to ${formatMoney(slotConfig.maxBet)}.`);
      }
      setCasinoState((prev) => ({
        ...prev,
        slotSpinning: true,
        slotResult: null,
        serverGame: null,
      }));
      try {
        const result = await playSlotOnline(sessionToken, bet);
        const symbols = Array.isArray(result?.outcome?.symbols) && result.outcome.symbols.length === 3
          ? result.outcome.symbols
          : SLOT_SYMBOL_SETS[result?.outcome?.id] || SLOT_SYMBOL_SETS.miss;

        animateSlotResult(symbols, () => {
          mergeServerUser(result.user);
          setCasinoState((prev) => ({
            ...prev,
            slotResult: result.outcome || null,
            serverGame: {
              mode: "slot",
              win: (result.totalReturn || 0) > 0,
              stake: result.stake,
              totalReturn: result.totalReturn,
              net: result.net,
              outcome: result.outcome || null,
            },
          }));
          if (result?.outcome?.id === "jackpot") {
            setNotice({
              tone: "success",
              title: "JACKPOT",
              message: `Automat eksploduje. Wpada ${formatMoney(result.totalReturn || 0)}.`,
            });
          }
          refreshCasinoState(sessionToken).catch(() => {});
        });
        return;
      } catch (error) {
        setCasinoState((prev) => ({ ...prev, slotSpinning: false }));
        pushLog(error.message);
        return;
      }
    }

    if (bet < slotConfig.minBet) return pushLog(`Minimalna stawka slota to ${formatMoney(slotConfig.minBet)}.`);
    if (bet > slotConfig.maxBet) {
      setCasinoState((prev) => ({ ...prev, slotBet: String(slotConfig.maxBet) }));
      return pushLog(`Na ten automat max stawka to ${formatMoney(slotConfig.maxBet)}.`);
    }
    if (game.player.cash < bet) return pushLog(`Potrzebujesz ${formatMoney(bet)} na spin automatu.`);

    updateLocalPlayer({ cash: game.player.cash - bet }, `Wrzucasz ${formatMoney(bet)} do automatu.`);
    setCasinoState((prev) => ({
      ...prev,
      slotSpinning: true,
      slotResult: null,
      serverGame: null,
    }));

    const outcomes = [
      { id: "jackpot", weight: 8, multiplier: 28, label: "777 JACKPOT", symbols: SLOT_SYMBOL_SETS.jackpot },
      { id: "triple", weight: 30, multiplier: 8, label: "Triple hit", symbols: SLOT_SYMBOL_SETS.triple },
      { id: "double", weight: 120, multiplier: 2, label: "Double match", symbols: SLOT_SYMBOL_SETS.double },
      { id: "single", weight: 160, multiplier: 1.15, label: "Lucky line", symbols: SLOT_SYMBOL_SETS.single },
      { id: "miss", weight: 682, multiplier: 0, label: "Miss", symbols: SLOT_SYMBOL_SETS.miss },
    ];
    const totalWeight = outcomes.reduce((sum, item) => sum + item.weight, 0);
    const roll = randomBetween(1, totalWeight);
    let cursor = 0;
    const picked = outcomes.find((item) => {
      cursor += item.weight;
      return roll <= cursor;
    }) || outcomes[outcomes.length - 1];

    animateSlotResult(picked.symbols, () => {
      const payout = Math.floor(bet * picked.multiplier);
      if (payout > 0) {
        setGame((prev) => ({
          ...prev,
          player: { ...prev.player, cash: prev.player.cash + payout },
          stats: {
            ...prev.stats,
            casinoWins: prev.stats.casinoWins + 1,
            totalEarned: prev.stats.totalEarned + payout,
          },
          log: [
            picked.id === "jackpot"
              ? `Jackpot na slocie. Automat oddaje ${formatMoney(payout)}.`
              : `Slot: ${picked.label}. Wraca ${formatMoney(payout)}.`,
            ...prev.log,
          ].slice(0, 16),
        }));
        if (picked.id === "jackpot") {
          setNotice({
            tone: "success",
            title: "JACKPOT",
            message: `Automat oddaje ${formatMoney(payout)}. Miasto to widzi.`,
          });
        }
      } else {
        pushLog("Slot: pudlo. Automat bierze wrzute.");
      }

      setCasinoState((prev) => ({
        ...prev,
        slotResult: picked,
        serverGame: {
          mode: "slot",
          win: payout > 0,
          stake: bet,
          totalReturn: payout,
          net: payout - bet,
          outcome: picked,
        },
      }));
    });
  };

  // Online mode delegates high-risk bet rules to backend; offline demo keeps the local fallback below.
  const spinRoulette = async () => {
    if (!canDoStreetAction("Kasyno nie wpuszcza ludzi w kajdankach.")) return;
    if (casinoState.rouletteSpinning) return;
    const highRiskConfig = getCasinoGameConfig(casinoState.backendMeta, "highRisk", {
      minBet: 50,
      maxBet: 15000,
    });
    const bet = Number(casinoState.rouletteBet || 0);

    if (hasOnlineAuthority) {
      if (highRiskConfig.cooldownRemainingMs > 0) {
        return pushLog(`Kasyno studzi stol. Wroc za ${formatCooldown(highRiskConfig.cooldownRemainingMs)}.`);
      }
      if (highRiskConfig.hasServerLimits && bet < highRiskConfig.minBet) {
        return pushLog(`Minimalna stawka stolu high-risk to ${formatMoney(highRiskConfig.minBet)}.`);
      }
      if (highRiskConfig.hasServerLimits && bet > highRiskConfig.maxBet) {
        setCasinoState((prev) => ({ ...prev, rouletteBet: String(highRiskConfig.maxBet) }));
        return pushLog(`Na ten stol max stawka to ${formatMoney(highRiskConfig.maxBet)}.`);
      }
      const selectedChoice = casinoState.rouletteChoice;
      setCasinoState((prev) => ({
        ...prev,
        rouletteSpinning: true,
        rouletteResult: null,
        serverGame: null,
      }));

      try {
        const result = await playHighRiskOnline(sessionToken, bet);
        const outcomeColor = result.win
          ? selectedChoice
          : selectedChoice === "green"
            ? (Math.random() < 0.5 ? "red" : "black")
            : (Math.random() < 0.1 ? "green" : selectedChoice === "red" ? "black" : "red");

        animateRouletteResult(selectedChoice, outcomeColor, () => {
          mergeServerUser(result.user);
          setCasinoState((prev) => ({
            ...prev,
            serverGame: {
              mode: "highRisk",
              win: result.win,
              stake: result.stake,
              totalReturn: result.totalReturn,
              net: result.net,
            },
          }));
          refreshCasinoState(sessionToken).catch(() => {});
        });
        return;
      } catch (error) {
        setCasinoState((prev) => ({ ...prev, rouletteSpinning: false }));
        pushLog(error.message);
        return;
      }
    }

    if (bet > highRiskConfig.maxBet) {
      setCasinoState((prev) => ({ ...prev, rouletteBet: String(highRiskConfig.maxBet) }));
      return pushLog(`Na ten stol max stawka to ${formatMoney(highRiskConfig.maxBet)}.`);
    }
    if (bet < highRiskConfig.minBet) return pushLog(`Minimalna stawka ruletki to ${formatMoney(highRiskConfig.minBet)}.`);
    if (game.player.cash < bet) return pushLog(`Potrzebujesz ${formatMoney(bet)} na wejscie do ruletki.`);

    updateLocalPlayer({ cash: game.player.cash - bet }, `Wrzucasz ${formatMoney(bet)} na stol ruletki.`);
    setCasinoState((prev) => ({ ...prev, rouletteSpinning: true, rouletteResult: null }));

    const selectedChoice = casinoState.rouletteChoice;
    const result = randomBetween(0, 36);
    const color = result === 0 ? "green" : result % 2 === 0 ? "black" : "red";
    const won = selectedChoice === color;
    animateRouletteResult(selectedChoice, color, () => {
      if (won) {
        const payout = color === "green" ? bet * 14 : bet * 2.1;
        setGame((prev) => ({
          ...prev,
          player: { ...prev.player, cash: prev.player.cash + payout },
          stats: { ...prev.stats, casinoWins: prev.stats.casinoWins + 1, totalEarned: prev.stats.totalEarned + payout },
          log: [`Ruletka siadla: ${color.toUpperCase()} ${result}. Wpada ${formatMoney(payout)}.`, ...prev.log].slice(0, 16),
        }));
      } else {
        pushLog(`Ruletka: ${color.toUpperCase()} ${result}. Stol zabral Twoj hajs.`);
      }
    });
  };

  const drawCard = () => {
    const values = [
      { label: "A", value: 11 },
      { label: "K", value: 10 },
      { label: "Q", value: 10 },
      { label: "J", value: 10 },
      { label: "10", value: 10 },
      { label: "9", value: 9 },
      { label: "8", value: 8 },
      { label: "7", value: 7 },
      { label: "6", value: 6 },
      { label: "5", value: 5 },
      { label: "4", value: 4 },
      { label: "3", value: 3 },
      { label: "2", value: 2 },
    ];
    return values[randomBetween(0, values.length - 1)];
  };

  const handValue = (cards) => {
    let total = cards.reduce((sum, card) => sum + card.value, 0);
    let aces = cards.filter((card) => card.label === "A").length;
    while (total > 21 && aces > 0) {
      total -= 10;
      aces -= 1;
    }
    return total;
  };

  const startBlackjack = async () => {
    if (!canDoStreetAction("Kasyno nie wpuszcza ludzi w kajdankach.")) return;
    setNotice(null);
    const blackjackConfig = getCasinoGameConfig(casinoState.backendMeta, "blackjack", {
      minBet: 50,
      maxBet: 500000,
    });
    const bet = Number(casinoState.blackjack.bet || 0);
    if (hasOnlineAuthority) {
      if (blackjackConfig.cooldownRemainingMs > 0) {
        return pushLog(`Kasyno studzi stol. Wroc za ${formatCooldown(blackjackConfig.cooldownRemainingMs)}.`);
      }
      if (blackjackConfig.hasServerLimits && bet < blackjackConfig.minBet) {
        return pushLog(`Minimalna stawka blackjacka to ${formatMoney(blackjackConfig.minBet)}.`);
      }
      if (blackjackConfig.hasServerLimits && bet > blackjackConfig.maxBet) {
        setCasinoState((prev) => ({
          ...prev,
          blackjack: { ...prev.blackjack, bet: String(blackjackConfig.maxBet) },
        }));
        return pushLog(`Na ten stol max stawka to ${formatMoney(blackjackConfig.maxBet)}.`);
      }
      try {
        const result = await startBlackjackOnline(sessionToken, bet);
        mergeServerUser(result.user);
        setCasinoState((prev) => ({
          ...prev,
          blackjack: result.session
            ? {
                ...prev.blackjack,
                ...result.session,
                bet: String(result.session.bet || bet || prev.blackjack.bet || "200"),
              }
            : prev.blackjack,
        }));
        refreshCasinoState(sessionToken).catch(() => {});
        return;
      } catch (error) {
        pushLog(error.message);
        return;
      }
    }
    if (["dealing", "player", "dealer"].includes(casinoState.blackjack.stage)) return;
    if (bet < blackjackConfig.minBet) return pushLog(`Minimalna stawka blackjacka to ${formatMoney(blackjackConfig.minBet)}.`);
    if (bet > blackjackConfig.maxBet) {
      setCasinoState((prev) => ({
        ...prev,
        blackjack: { ...prev.blackjack, bet: String(blackjackConfig.maxBet) },
      }));
      return pushLog(`Na ten stol max stawka to ${formatMoney(blackjackConfig.maxBet)}.`);
    }
    if (game.player.cash < bet) return pushLog("Brakuje kasy na stol blackjacka.");

    updateLocalPlayer({ cash: game.player.cash - bet }, `Wchodzisz na blackjacka za ${formatMoney(bet)}.`);
    setCasinoState((prev) => ({
      ...prev,
      blackjack: { ...prev.blackjack, stage: "dealing", playerCards: [], dealerCards: [], message: "Rozdawanie..." },
    }));

    const p1 = drawCard();
    const d1 = drawCard();
    const p2 = drawCard();
    const d2 = drawCard();

    setTimeout(() => {
      setCasinoState((prev) => ({
        ...prev,
        blackjack: {
          ...prev.blackjack,
          stage: "player",
          playerCards: [p1, p2],
          dealerCards: [d1, d2],
          message: "Twoj ruch: dobieraj albo pas.",
        },
      }));
    }, 700);
  };

  const hitBlackjack = async () => {
    if (sessionToken && apiStatus === "online") {
      try {
        const result = await hitBlackjackOnline(sessionToken);
        mergeServerUser(result.user);
        setCasinoState((prev) => ({
          ...prev,
          blackjack: result.session
            ? {
                ...prev.blackjack,
                ...result.session,
                bet: String(result.session.bet || prev.blackjack.bet || "200"),
              }
            : prev.blackjack,
        }));
        refreshCasinoState(sessionToken).catch(() => {});
        return;
      } catch (error) {
        pushLog(error.message);
        return;
      }
    }
    const nextCard = drawCard();
    setCasinoState((prev) => {
      const nextCards = [...prev.blackjack.playerCards, nextCard];
      const value = handValue(nextCards);
      if (value > 21) {
        pushLog("Blackjack spalony. Kasyno bierze pule.");
        return {
          ...prev,
          blackjack: { ...prev.blackjack, stage: "bust", playerCards: nextCards, message: "Spaliles sie." },
        };
      }
      return {
        ...prev,
        blackjack: { ...prev.blackjack, playerCards: nextCards, message: "Dobierasz kolejna karte." },
      };
    });
  };

  const standBlackjack = async () => {
    if (sessionToken && apiStatus === "online") {
      try {
        const result = await standBlackjackOnline(sessionToken);
        mergeServerUser(result.user);
        setCasinoState((prev) => ({
          ...prev,
          blackjack: result.session
            ? {
                ...prev.blackjack,
                ...result.session,
                bet: String(result.session.bet || prev.blackjack.bet || "200"),
              }
            : prev.blackjack,
        }));
        refreshCasinoState(sessionToken).catch(() => {});
        return;
      } catch (error) {
        pushLog(error.message);
        return;
      }
    }
    setCasinoState((prev) => ({ ...prev, blackjack: { ...prev.blackjack, stage: "dealer", message: "Krupier dobiera..." } }));

    setTimeout(() => {
      setCasinoState((prev) => {
        const dealerCards = [...prev.blackjack.dealerCards];
        while (handValue(dealerCards) < 17) {
          dealerCards.push(drawCard());
        }
        const playerScore = handValue(prev.blackjack.playerCards);
        const dealerScore = handValue(dealerCards);
        const bet = Number(prev.blackjack.bet || 0);
        let message = "Remis.";
        let payout = 0;

        if (dealerScore > 21 || playerScore > dealerScore) {
          payout = bet * 2;
          message = "Wygrana. Stolik oddaje dubel.";
        } else if (playerScore === dealerScore) {
          payout = bet;
          message = "Push. Wrzuta wraca.";
        } else {
          message = "Krupier bierze pule.";
        }

        if (payout) {
          setGame((gamePrev) => ({
            ...gamePrev,
            player: { ...gamePrev.player, cash: gamePrev.player.cash + payout },
            stats: {
              ...gamePrev.stats,
              casinoWins: gamePrev.stats.casinoWins + (payout > bet ? 1 : 0),
              totalEarned: gamePrev.stats.totalEarned + payout,
            },
            log: [`Blackjack: ${message} ${payout ? `Wraca ${formatMoney(payout)}.` : ""}`.trim(), ...gamePrev.log].slice(0, 16),
          }));
        } else {
          pushLog(`Blackjack: ${message}`);
        }

        return {
          ...prev,
          blackjack: {
            ...prev.blackjack,
            stage: "done",
            dealerCards,
            message,
          },
        };
      });
    }, 700);
  };

  const totalBusinessIncome = getBusinessIncomePerMinute(game, BUSINESSES);
  const totalEscortIncome = getEscortIncomePerMinute(game);
  const businessCollectionCap = getPassiveCapAmount(totalBusinessIncome);
  const escortCollectionCap = getPassiveCapAmount(totalEscortIncome);
  const projectedBusinessCash = getProjectedBusinessCash(
    game.collections,
    totalBusinessIncome,
    businessCollectionCap,
    hasOnlineAuthority
  );
  const projectedEscortCash = getProjectedEscortCash(
    game.collections,
    totalEscortIncome,
    escortCollectionCap,
    hasOnlineAuthority
  );
  const projectedScreenGame =
    hasOnlineAuthority &&
    (projectedBusinessCash !== Number(game.collections?.businessCash || 0) ||
      projectedEscortCash !== Number(game.collections?.escortCash || 0))
      ? {
          ...game,
          collections: {
            ...game.collections,
            businessCash: projectedBusinessCash,
            escortCash: projectedEscortCash,
          },
        }
      : game;
  const businessCapEta = getCollectionTimeToCap(projectedBusinessCash, totalBusinessIncome);
  const escortCapEta = getCollectionTimeToCap(projectedEscortCash, totalEscortIncome);
  const escortFindChance = currentClubVenue
    ? clamp(currentClubProfile.huntProgressValue / CLUB_SYSTEM_RULES.leadRequired, 0.12, 0.42)
    : clamp(escortBaseFindChance * 0.75, 0.05, 0.12);

  const renderSoloHeists = () => (
    <>
      <SceneArtwork
        eyebrow="Napady"
        title="Kazdy prog ma swoja cene"
        lines={["Szansa, ryzyko i wyplata na jednym ekranie."]}
        accent={["#4f2219", "#180d0a", "#050505"]}
        source={SCENE_BACKGROUNDS.heists}
      />
      <SectionCard title="Napady" subtitle="Klikasz prog i wchodzisz w akcje.">
        {heistCatalog.map((heist) => {
          const locked = game.player.respect < heist.respect;
          const odds = getSoloHeistOdds(game.player, effectivePlayer, game.gang, heist, game.activeBoosts);
          return (
            <View key={heist.id} style={[styles.listCard, locked && styles.listCardLocked]}>
              <View style={styles.listCardHeader}>
                <View style={styles.flexOne}>
                  <Text style={styles.listCardTitle}>{heist.name}</Text>
                  <Text style={styles.listCardMeta}>Szacun {heist.respect} | Energia {heist.energy} | Ryzyko bazowe {Math.round(heist.risk * 100)}%</Text>
                </View>
                <Text style={styles.listCardReward}>{formatMoney(heist.reward[0])} - {formatMoney(heist.reward[1])}</Text>
              </View>
              <View style={styles.oddsRow}>
                <View style={styles.oddsBlock}>
                  <Text style={styles.oddsLabel}>Szansa wejscia</Text>
                  <Text style={styles.oddsValue}>{Math.round(odds.chance * 100)}%</Text>
                </View>
                <View style={styles.oddsBlock}>
                  <Text style={styles.oddsLabel}>Ryzyko celi</Text>
                  <Text style={styles.oddsValue}>{Math.round(odds.jailChance * 100)}%</Text>
                </View>
              </View>
              <ProgressBar progress={odds.chance} />
              <View style={styles.inlineRow}>
                <Text style={styles.costLabel}>Staty teraz: A {effectivePlayer.attack} | O {effectivePlayer.defense} | ZR {effectivePlayer.dexterity}</Text>
                <Pressable onPress={() => executeHeist(heist)} style={[styles.inlineButton, locked && styles.tileDisabled]}>
                  <Text style={styles.inlineButtonText}>{locked ? `Zablokowane do ${heist.respect}` : "Wchodze w akcje"}</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </SectionCard>
    </>
  );

  const renderGangHeists = () => (
    <>
      <SceneArtwork
        eyebrow="Gang"
        title="Robota dla calej organizacji"
        lines={["Najpierw zbierasz sklad, potem dopiero odpalasz robote.", "Szansa liczy sie z realnych ludzi w lobby, nie z jednego klikniecia."]}
        accent={["#422418", "#160f0c", "#050505"]}
        source={SCENE_BACKGROUNDS.gangWide}
      />
      <HeroPanel
        eyebrow="Napady gangu"
        title={activeGangHeistLobby ? activeGangHeistDefinition?.name || "Aktywne lobby" : "Jedno lobby, jeden sklad, jeden start"}
        summary={
          activeGangHeistLobby
            ? "Najpierw zbierasz pelny sklad, potem dopiero odpalasz start. Szansa i trudnosc sa liczone z realnej mocy calej ekipy, nie z jednego klikniecia."
            : "Boss, Vice albo Zaufany otwieraja lobby i zostawiaja krotki sygnal dla ekipy. Zwykli czlonkowie tylko dolaczaja i realnie dokladaja moc skladu."
        }
        tone="danger"
        pills={[
          {
            label: "Sklad",
            value: activeGangHeistLobby ? `${activeGangHeistParticipants.length}/${activeGangHeistLobby.requiredMembers}` : `${game.gang.members}/${game.gang.maxMembers}`,
            note: "Licza sie tylko wolni ludzie bez odsiadki.",
            tone: "gold",
            icon: "account-group-outline",
          },
          {
            label: "Szansa",
            value: activeGangHeistLobby ? `${Math.round(Number(activeGangHeistLobby.summary?.chance || activeGangHeistLobby.chance || 0) * 100)}%` : "--",
            note: activeGangHeistLobby ? "Liczona z calego skladu." : "Pojawi sie po otwarciu lobby.",
            tone: "info",
            icon: "target",
          },
          {
            label: "Cela skladu",
            value: game.gang.jailedCrew ? `${game.gang.jailedCrew}` : "0",
            note: crewLockdownRemaining > 0 ? formatDuration(crewLockdownRemaining) : "Ekipa jest wolna.",
            tone: crewLockdownRemaining > 0 ? "danger" : "neutral",
            icon: "lock-outline",
          },
        ]}
      />
      <SectionCard title="Napady gangu" subtitle="Jedno lobby, jeden sklad, jeden start.">
        {!game.gang.joined ? (
          <View style={styles.lockedPanel}>
            <Text style={styles.lockedPanelText}>Najpierw wejdz do gangu, a potem ustawiaj wspolna robote.</Text>
          </View>
        ) : (
          <>
            {activeGangHeistLobby ? (
              <View style={styles.listCard}>
                <View style={styles.listCardHeader}>
                  <View style={styles.flexOne}>
                    <Text style={styles.listCardTitle}>{activeGangHeistDefinition?.name || "Aktywne lobby"}</Text>
                    <Text style={styles.listCardMeta}>
                      {activeGangHeistLobby.openedByName || "Ekipa"} zbiera sklad. Min. ludzi {activeGangHeistLobby.requiredMembers} | Energia {activeGangHeistDefinition?.energy || 0}
                    </Text>
                  </View>
                  <Text style={styles.listCardReward}>
                    {formatMoney(activeGangHeistDefinition?.reward?.[0] || 0)} - {formatMoney(activeGangHeistDefinition?.reward?.[1] || 0)}
                  </Text>
                </View>
                {activeGangHeistLobby.note ? (
                  <Text style={styles.listCardMeta}>Komunikat: {activeGangHeistLobby.note}</Text>
                ) : null}
                <View style={styles.oddsRow}>
                  <View style={styles.oddsBlock}>
                    <Text style={styles.oddsLabel}>Szansa skladu</Text>
                    <Text style={styles.oddsValue}>{Math.round(Number(activeGangHeistLobby.summary?.chance || activeGangHeistLobby.chance || 0) * 100)}%</Text>
                  </View>
                  <View style={styles.oddsBlock}>
                    <Text style={styles.oddsLabel}>Sklad</Text>
                    <Text style={styles.oddsValue}>
                      {activeGangHeistParticipants.length}/{activeGangHeistLobby.requiredMembers}
                    </Text>
                  </View>
                </View>
                <ProgressBar progress={Number(activeGangHeistLobby.summary?.chance || activeGangHeistLobby.chance || 0)} />
                <Text style={styles.listCardMeta}>
                  Moc ekipy: {Math.round(Number(activeGangHeistLobby.summary?.totalPower || activeGangHeistLobby.squadPower || 0))} | Rekomendowany prog: {activeGangHeistLobby.summary?.recommendedRespect || activeGangHeistDefinition?.recommendedRespect || activeGangHeistDefinition?.respect || 0} RES
                </Text>
                <View style={styles.listCard}>
                  <Text style={styles.listCardTitle}>Kto siedzi w skladzie</Text>
                  {activeGangHeistParticipants.map((participant) => (
                    <Text key={`gang-lobby-${participant.id}`} style={styles.listCardMeta}>
                      {participant.name} | {participant.role} | {participant.respect || 0} RES
                    </Text>
                  ))}
                </View>
                <View style={styles.listActionsRow}>
                  <Pressable
                    onPress={() => activeGangHeistDefinition && joinGangHeistLobby(activeGangHeistDefinition)}
                    disabled={
                      !activeGangHeistDefinition ||
                      isInActiveGangHeistLobby ||
                      activeGangHeistParticipants.length >= Number(activeGangHeistLobby.requiredMembers || 1) ||
                      inJail(game.player)
                    }
                    style={[
                      styles.inlineButton,
                      (isInActiveGangHeistLobby ||
                        activeGangHeistParticipants.length >= Number(activeGangHeistLobby.requiredMembers || 1) ||
                        inJail(game.player)) && styles.tileDisabled,
                    ]}
                  >
                    <Text style={styles.inlineButtonText}>Dolacz</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => activeGangHeistDefinition && leaveGangHeistLobby(activeGangHeistDefinition)}
                    disabled={!activeGangHeistDefinition || !isInActiveGangHeistLobby}
                    style={[styles.inlineButton, !isInActiveGangHeistLobby && styles.tileDisabled]}
                  >
                    <Text style={styles.inlineButtonText}>Opusc</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => activeGangHeistDefinition && startGangHeistLobby(activeGangHeistDefinition)}
                    disabled={
                      !activeGangHeistDefinition ||
                      !canRunGangHeistRole(game.gang.role) ||
                      activeGangHeistParticipants.length < Number(activeGangHeistLobby.requiredMembers || 1) ||
                      crewLockdownRemaining > 0
                    }
                    style={[
                      styles.inlineButton,
                      (!canRunGangHeistRole(game.gang.role) ||
                        activeGangHeistParticipants.length < Number(activeGangHeistLobby.requiredMembers || 1) ||
                        crewLockdownRemaining > 0) && styles.tileDisabled,
                    ]}
                  >
                    <Text style={styles.inlineButtonText}>Start</Text>
                  </Pressable>
                </View>
                {crewLockdownRemaining > 0 ? (
                  <Text style={styles.listCardMeta}>Ekipa jeszcze zbiera sie po ostatniej wtapie: {formatDuration(crewLockdownRemaining)}.</Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.listCard}>
                <Text style={styles.listCardTitle}>Otworz lobby</Text>
                <Text style={styles.listCardMeta}>Boss, Vice albo Zaufany wystawia robote i zostawia krotki sygnal dla ekipy.</Text>
                <View style={styles.inlineRow}>
                  <TextInput
                    value={gangHeistNoteDraft}
                    onChangeText={setGangHeistNoteDraft}
                    placeholder="Np. minimum 25 ATK i pelna energia"
                    placeholderTextColor="#6c6c6c"
                    style={styles.chatInput}
                  />
                </View>
              </View>
            )}

            {game.gang.lastHeistReport ? (
              <View style={styles.listCard}>
                <Text style={styles.listCardTitle}>Ostatni raport</Text>
                <Text style={styles.listCardMeta}>
                  {game.gang.lastHeistReport.success ? "Robota siadla." : "Robota spalona."} {game.gang.lastHeistReport.heistName}
                </Text>
                <Text style={styles.listCardMeta}>
                  Ekipa: {(game.gang.lastHeistReport.participants || []).length} | Skarbiec: {formatMoney(game.gang.lastHeistReport.vaultCut || 0)} | Cela: {(game.gang.lastHeistReport.jailedParticipantIds || []).length}
                </Text>
                {(game.gang.lastHeistReport.participants || []).map((participant) => (
                  <Text key={`gang-heist-report-${participant.userId || participant.name}`} style={styles.listCardMeta}>
                    {participant.name}: {participant.jailed ? "cela" : formatMoney(participant.cash || 0)} {participant.xp ? `| +${participant.xp} XP` : ""} {participant.hpLoss ? `| HP -${participant.hpLoss}` : ""}
                  </Text>
                ))}
              </View>
            ) : null}

            {GANG_HEISTS.map((heist) => {
              const roleLocked = !canRunGangHeistRole(game.gang.role);
              const memberLocked = game.gang.members < heist.minMembers;
              const crewLocked = game.gang.members - game.gang.jailedCrew < heist.minMembers;
              const lockdownLocked = crewLockdownRemaining > 0;
              const activeElsewhere = Boolean(activeGangHeistLobby && activeGangHeistLobby.heistId !== heist.id);
              const isActive = activeGangHeistLobby?.heistId === heist.id;
              const locked = roleLocked || memberLocked || crewLocked || lockdownLocked || activeElsewhere;
              const ctaLabel = isActive
                ? "Lobby otwarte"
                : roleLocked
                  ? "Za niska ranga"
                  : lockdownLocked
                    ? "Ekipa lezy po wtapie"
                    : memberLocked
                      ? "Za malo ludzi"
                      : crewLocked
                        ? "Za malo wolnego skladu"
                        : activeElsewhere
                          ? "Juz jest inna robota"
                          : "Otworz lobby";
              return (
                <View key={heist.id} style={[styles.listCard, activeElsewhere && styles.listCardLocked]}>
                  <View style={styles.listCardHeader}>
                    <View style={styles.flexOne}>
                      <Text style={styles.listCardTitle}>{heist.name}</Text>
                      <Text style={styles.listCardMeta}>
                        Min. ludzi {heist.minMembers} | Energia {heist.energy} | Rekomendowany prog {heist.recommendedRespect || heist.respect} RES
                      </Text>
                    </View>
                    <Text style={styles.listCardReward}>{formatMoney(heist.reward[0])} - {formatMoney(heist.reward[1])}</Text>
                  </View>
                  <Text style={styles.listCardMeta}>
                    Dzielnica {findDistrictById(game.city, heist.districtId)?.name || heist.districtId} | Ryzyko {Math.round(Number(heist.risk || 0) * 100)}%
                  </Text>
                  <View style={styles.inlineRow}>
                    <Text style={styles.costLabel}>Ludzie {game.gang.members}/{heist.minMembers} | Wolni {Math.max(0, game.gang.members - game.gang.jailedCrew)}</Text>
                    <Pressable onPress={() => openGangHeistLobby(heist)} disabled={locked} style={[styles.inlineButton, locked && styles.tileDisabled]}>
                      <Text style={styles.inlineButtonText}>{ctaLabel}</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </SectionCard>
    </>
  );

  const renderPrison = () => (
    <PrisonSection
      SectionCard={SectionCard}
      formatMoney={formatMoney}
      formatDuration={formatDuration}
      player={game.player}
      jailRemaining={jailRemaining}
      prisonChat={game.prisonChat}
      prisonMessage={prisonMessage}
      setPrisonMessage={setPrisonMessage}
      onSendMessage={sendPrisonMessage}
      onBribeOut={bribeOutOfJail}
    />
  );

  const renderGangOverview = () => (
    <SectionCard title="Gang" subtitle="Ekipa, sklad i szybkie akcje.">
      {selectedGangProfile ? (
        <SectionCard title="Profil gangu" subtitle="Boss, sklad, skarbiec i ruchy ekipy.">
          <View style={styles.playerProfilePanel}>
            <View style={styles.playerProfileMain}>
              <LinearGradient colors={["#4f2a18", "#17100c"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.playerProfileHero}>
                <EntityBadge visual={getGangVisual(selectedGangProfile.name)} large />
                <View style={styles.playerProfileMeta}>
                  <Text style={styles.playerProfileName}>{selectedGangProfile.name}</Text>
                  <Text style={styles.playerProfileGang}>Ranking #{selectedGangProfile.ranking}</Text>
                  <Text style={styles.playerProfileStatus}>{selectedGangProfile.self ? "Twoj gang" : "Obca organizacja"}</Text>
                </View>
              </LinearGradient>
              <View style={styles.playerStatsBoard}>
                <StatLine label="Boss" value={selectedGangProfile.boss} />
                <StatLine label="Vice Boss" value={selectedGangProfile.viceBoss} />
                <StatLine label="Zaufani" value={`${selectedGangProfile.trusted}`} />
                <StatLine label="Ludzie" value={`${selectedGangProfile.members}/${selectedGangProfile.maxMembers || selectedGangProfile.members || 8}`} />
                <StatLine label="Teren" value={`${selectedGangProfile.territory}`} />
                <StatLine label="Wplywy" value={`${selectedGangProfile.influence}`} />
                <StatLine label="Skarbiec" value={formatMoney(selectedGangProfile.vault)} />
                <StatLine label="Wejscie od" value={`${selectedGangProfile.inviteRespectMin} RES`} />
                <StatLine label="Szacun ekipy" value={`${selectedGangProfile.respect}`} />
                <StatLine label="Chroni klub" value={selectedGangProfile.protectedClub?.name || "-"} />
              </View>
            </View>
            <Text style={styles.listCardMeta}>{selectedGangProfile.description}</Text>
            <View style={styles.playerProfileActions}>
              {!selectedGangProfile.self ? (
                <Pressable onPress={() => openMessageComposer({ name: selectedGangProfile.boss, gang: selectedGangProfile.name, online: true })} style={styles.inlineButton}>
                  <Text style={styles.inlineButtonText}>Napisz do bossa</Text>
                </Pressable>
              ) : null}
              {selectedGangProfile.self && game.gang.role === "Boss" ? (
                <Pressable onPress={deleteGang} style={[styles.inlineButton, styles.inlineButtonDanger]}>
                  <Text style={[styles.inlineButtonText, styles.inlineButtonDangerText]}>Usun gang</Text>
                </Pressable>
              ) : null}
              {!selectedGangProfile.self ? (
                <Pressable
                  onPress={() => attackGangProfile(selectedGangProfile)}
                  disabled={selectedGangRaidBlocked}
                  style={[styles.inlineButton, selectedGangRaidBlocked && styles.tileDisabled]}
                >
                  <Text style={styles.inlineButtonText}>Atak na gang</Text>
                </Pressable>
              ) : null}
              {!selectedGangProfile.self ? (
                <Pressable onPress={() => sendGangAllianceOffer(selectedGangProfile)} style={styles.inlineButton}>
                  <Text style={styles.inlineButtonText}>Sojusz</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={() => setGangProfileView("members")} style={styles.inlineButton}>
                <Text style={styles.inlineButtonText}>Sprawdz czlonkow</Text>
              </Pressable>
              <Pressable onPress={() => setGangProfileView("log")} style={styles.inlineButton}>
                <Text style={styles.inlineButtonText}>Log wydarzen</Text>
              </Pressable>
              <Pressable onPress={() => setGangProfileView("actions")} style={styles.inlineButton}>
                <Text style={styles.inlineButtonText}>Akcje</Text>
              </Pressable>
              <Pressable onPress={closeGangProfile} style={styles.inlineButton}>
                <Text style={styles.inlineButtonText}>Zamknij profil gangu</Text>
              </Pressable>
            </View>

            {gangProfileView === "actions" ? (
              <View style={styles.listCard}>
                <Text style={styles.listCardTitle}>Akcje wobec gangu</Text>
                <Text style={styles.listCardMeta}>
                  {hasOnlineAuthority ? "Backend liczy tu ryzyko, oslony i wynik najazdu na zywo." : "Szybkie akcje wobec ekipy."}
                </Text>
                <StatLine label="Boss" value={selectedGangProfile.boss} />
                <StatLine label="Vice Boss" value={selectedGangProfile.viceBoss} />
                <StatLine label="Potencjal skladu" value={`${selectedGangProfile.members} ludzi | ${selectedGangProfile.influence} wplywu | ${selectedGangProfile.territory} dzielnice`} />
                {!selectedGangProfile.self && hasOnlineAuthority ? (
                  <View style={styles.listCard}>
                    <Text style={styles.listCardTitle}>Najazd na gang</Text>
                    <Text style={styles.listCardMeta}>
                      {gangRaidPreviewState.loading && gangRaidPreviewState.gangName === selectedGangProfile.name
                        ? "Backend liczy ryzyko i oslony celu..."
                        : "Szansa, oslony i stawka sa liczone live po stronie serwera."}
                    </Text>
                    {selectedGangRaidPreviewLines.map((line) => (
                      <Text key={`${selectedGangProfile.name}-${line}`} style={styles.listCardMeta}>
                        {line}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}

            {gangProfileView === "members" ? (
              <View style={styles.listCard}>
                <Text style={styles.listCardTitle}>Sklad gangu</Text>
                <Text style={styles.listCardMeta}>
                  Boss ustawia role lekkim panelem. Vice Boss jest tylko jeden.
                </Text>
                {selectedGangProfile.membersList?.map((member) => (
                  <View key={member.id} style={styles.listCard}>
                    <View style={styles.inlineRow}>
                      <View style={styles.flexOne}>
                        <Text style={styles.listCardTitle}>{member.name}</Text>
                        <Text style={styles.listCardMeta}>{member.role} | Szacun {member.respect ?? "-"} | {member.online ? "Online" : "Offline"}</Text>
                      </View>
                      <Tag text={member.trusted ? "Zaufany" : "Czlonek"} warning={!member.trusted} />
                    </View>
                    {selectedGangProfile.self ? renderGangRoleControls(member) : null}
                  </View>
                ))}
              </View>
            ) : null}

            {gangProfileView === "log" ? (
              <View style={styles.listCard}>
                <Text style={styles.listCardTitle}>Log wydarzen gangu</Text>
                <Text style={styles.listCardMeta}>Ostatnie ruchy ekipy.</Text>
                {(selectedGangProfile.eventLog || []).map((entry) => (
                  <View key={entry.id} style={styles.chatBubble}>
                    <Text style={styles.chatAuthor}>{entry.author} <Text style={styles.chatTime}>{entry.time}</Text></Text>
                    <Text style={styles.chatText}>{entry.text}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </SectionCard>
      ) : null}
      <SceneArtwork
        eyebrow="Organizacja"
        title={game.gang.joined ? `${game.gang.name}` : "Najpierw wejdz do ukladu"}
        lines={
          game.gang.joined
            ? ["Pilnujesz progu wejscia, ludzi, skarbca i napadow gangu.", "Tu ma sie czuc, ze to organizacja, a nie pojedynczy przycisk."]
            : ["Zakladasz wlasny gang za gruby hajs albo przyjmujesz zaproszenie od ekipy.", "Po wejsciu odblokowuje sie sklad, operacje i chat gangu."]
        }
        accent={["#3d2418", "#17100c", "#050505"]}
        source={SCENE_BACKGROUNDS.gangWide}
      />
      <HeroPanel
        eyebrow="Gang"
        title={game.gang.joined ? game.gang.name : "Warstwa meta dla ekipy"}
        summary={
          game.gang.joined
            ? "Najpierw lapiesz stan ekipy: role, sklad, skarbiec, aktywna robote i protektorat klubu. Dopiero nizej schodzisz do szczegolow."
            : "Tu ma byc od razu jasne czy zakladasz swoj gang, czy lepiej wejsc do zywej ekipy z miasta. Bez zbednych ekranow i pustych kart."
        }
        tone={game.gang.joined ? "gold" : "info"}
        pills={
          game.gang.joined
            ? [
                {
                  label: "Rola",
                  value: game.gang.role,
                  note: `${game.gang.members}/${game.gang.maxMembers} ludzi w ekipie.`,
                  tone: "gold",
                  icon: "shield-crown-outline",
                },
                {
                  label: "Skarbiec",
                  value: formatMoney(game.gang.vault),
                  note: "Wspolna kasa na projekty i akcje.",
                  tone: "success",
                  icon: "bank-outline",
                },
                {
                  label: "Aktywna robota",
                  value: activeGangHeistDefinition?.name || "Brak lobby",
                  note: game.gang.protectedClub?.name ? `Chroni ${game.gang.protectedClub.name}.` : "Bez aktywnego protektoratu klubu.",
                  tone: "danger",
                  icon: "briefcase-outline",
                },
              ]
            : [
                {
                  label: "Zaproszenia",
                  value: `${game.gang.invites.length}`,
                  note: "Aktywne wejscia do zywych ekip.",
                  tone: "info",
                  icon: "email-outline",
                },
                {
                  label: "Gangi online",
                  value: `${game.online.gangs.length}`,
                  note: "Prawdziwe ekipy z miasta.",
                  tone: "gold",
                  icon: "account-group-outline",
                },
                {
                  label: "Koszt zalozenia",
                  value: formatMoney(game.gang.createCost),
                  note: "Do tego potrzebujesz 15 RES.",
                  tone: "danger",
                  icon: "cash-multiple",
                },
              ]
        }
      />
      {!game.gang.joined ? (
        <>
          <View style={styles.heroBanner}>
            <Text style={styles.heroBannerTitle}>Brak gangu</Text>
            <Text style={styles.heroBannerText}>Zakladasz ekipe albo wchodzisz do jednej z nich.</Text>
          </View>
          <View style={styles.listCard}>
            <Text style={styles.listCardTitle}>Zaloz wlasny gang</Text>
            <Text style={styles.listCardMeta}>Koszt: {formatMoney(game.gang.createCost)}. Potrzebujesz tez 15 szacunu.</Text>
            <View style={styles.inlineRow}>
              <TextInput value={gangDraftName} onChangeText={setGangDraftName} placeholder="Nazwa gangu" placeholderTextColor="#6c6c6c" style={styles.chatInput} />
              <Pressable onPress={createGang} style={styles.inlineButton}>
                <Text style={styles.inlineButtonText}>Zaloz</Text>
              </Pressable>
            </View>
            <Text style={styles.listCardMeta}>Masz przy sobie: {formatMoney(game.player.cash)}</Text>
          </View>
          <SectionCard title="Zaproszenia" subtitle="Wejscie od progu szacunu.">
            {game.gang.invites.length ? game.gang.invites.map((invite) => (
              <View key={invite.id} style={styles.listCard}>
                <View style={styles.inlineRow}>
                  <View style={styles.entityHead}>
                    <EntityBadge visual={getGangVisual(invite.gangName)} />
                    <View style={styles.flexOne}>
                    <Text style={styles.listCardTitle}>{invite.gangName}</Text>
                    <Text style={styles.listCardMeta}>Boss: {invite.leader} | Ludzie: {invite.members} | Wejscie od {invite.inviteRespectMin} szacunu</Text>
                    </View>
                  </View>
                  <Pressable onPress={() => joinGang(invite.id)} style={[styles.inlineButton, game.player.respect < invite.inviteRespectMin && styles.tileDisabled]}>
                    <Text style={styles.inlineButtonText}>Dolacz</Text>
                  </Pressable>
                </View>
              </View>
            )) : <Text style={styles.emptyText}>Brak aktywnych zaproszen do prawdziwych gangow.</Text>}
          </SectionCard>
          <SectionCard title="Lista gangow" subtitle="Zywe gangi z miasta, bez testowych fantomow.">
            {game.online.gangs.length ? game.online.gangs.map((gang) => {
              const matchingInvite = game.gang.invites.find((invite) => invite.gangName === gang.name);
              return (
                <View key={gang.id} style={styles.listCard}>
                  <View style={styles.inlineRow}>
                    <View style={styles.entityHead}>
                      <EntityBadge visual={getGangVisual(gang.name)} />
                      <View style={styles.flexOne}>
                        <Text style={styles.listCardTitle}>{gang.name}</Text>
                        <Text style={styles.listCardMeta}>Boss: {gang.boss} | Ludzie: {gang.members} | Wejscie: {gang.inviteRespectMin} RES | Wplywy: {gang.influence}</Text>
                      </View>
                    </View>
                    <View style={styles.listActionsRow}>
                      <Pressable onPress={() => openGangProfile(gang.name)} style={styles.inlineButton}>
                        <Text style={styles.inlineButtonText}>Profil</Text>
                      </Pressable>
                      {matchingInvite ? (
                        <Pressable onPress={() => joinGang(matchingInvite.id)} style={[styles.inlineButton, game.player.respect < matchingInvite.inviteRespectMin && styles.tileDisabled]}>
                          <Text style={styles.inlineButtonText}>Dolacz</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            }) : <Text style={styles.emptyText}>Na razie nie ma jeszcze zadnych zywych gangow na miescie.</Text>}
          </SectionCard>
        </>
      ) : (
        <>
          <View style={styles.heroBanner}>
            <Text style={styles.heroBannerTitle}>{game.gang.name}</Text>
            <Text style={styles.heroBannerText}>Rola: {game.gang.role}. Tutaj widzisz skarbiec, bonus ekipy i 3 najwazniejsze wejscia.</Text>
          </View>
          <SectionCard title="Rdzen ekipy" subtitle="To ma byc prosty panel glowny gangu.">
            <StatLine label="Rola" value={game.gang.role} />
            <StatLine label="Ludzie" value={`${game.gang.members}/${game.gang.maxMembers}`} />
            <StatLine label="Skarbiec" value={formatMoney(game.gang.vault)} />
            <StatLine label="Wejscie od" value={`${game.gang.inviteRespectMin} RES`} />
            <StatLine label="Bonus do napadow gangu" value={`+${Math.round(getGangHeistBonusRate(game.gang) * 100)}% hajsu`} />
            <StatLine label="Ludzie w celi" value={game.gang.jailedCrew ? `${game.gang.jailedCrew} (${formatDuration(crewLockdownRemaining)})` : "0"} />
            <StatLine label="Aktywna robota" value={activeGangHeistDefinition?.name || "Brak lobby"} />
            <StatLine label="Chroniony klub" value={game.gang.protectedClub?.name || "Brak protektoratu"} />
            {game.gang.role === "Boss" ? (
              <View style={styles.listActionsRow}>
                <Pressable onPress={deleteGang} style={[styles.inlineButton, styles.inlineButtonDanger]}>
                  <Text style={[styles.inlineButtonText, styles.inlineButtonDangerText]}>Usun gang</Text>
                </Pressable>
              </View>
            ) : null}
          </SectionCard>

          {game.gang.role === "Boss" ? (
            <SectionCard title="Ustawienia gangu" subtitle="Boss ustawia prog wejscia do ekipy.">
              <Text style={styles.listCardMeta}>Nowe zaproszenia i dolaczanie leca po tym progu.</Text>
              <View style={styles.listActionsRow}>
                <Pressable
                  onPress={() => changeGangInviteThreshold(-5)}
                  style={[
                    styles.inlineButton,
                    (gangSettingsBusy || game.gang.inviteRespectMin <= GANG_INVITE_RESPECT_MIN) && styles.tileDisabled,
                  ]}
                >
                  <Text style={styles.inlineButtonText}>-5 RES</Text>
                </Pressable>
                <Pressable
                  onPress={() => changeGangInviteThreshold(5)}
                  style={[
                    styles.inlineButton,
                    (gangSettingsBusy || game.gang.inviteRespectMin >= GANG_INVITE_RESPECT_MAX) && styles.tileDisabled,
                  ]}
                >
                  <Text style={styles.inlineButtonText}>+5 RES</Text>
                </Pressable>
                {GANG_INVITE_THRESHOLD_PRESETS.map((threshold) => (
                  <Pressable
                    key={`gang-threshold-${threshold}`}
                    onPress={() => updateGangInviteThreshold(threshold)}
                    style={[
                      styles.inlineButton,
                      game.gang.inviteRespectMin === threshold && styles.tileDisabled,
                      gangSettingsBusy && styles.tileDisabled,
                    ]}
                  >
                    <Text style={styles.inlineButtonText}>{threshold} RES</Text>
                  </Pressable>
                ))}
              </View>
            </SectionCard>
          ) : null}

          <SectionCard title="Skarbiec" subtitle="Wrzucone tu pieniadze wzmacniaja zaplecze ekipy.">
            <View style={styles.inlineRow}>
              <TextInput value={bankAmountDraft} onChangeText={setBankAmountDraft} placeholder="Kwota dla gangu" placeholderTextColor="#6c6c6c" keyboardType="numeric" style={styles.chatInput} />
              <Pressable onPress={depositGangCash} style={styles.inlineButton}>
                <Text style={styles.inlineButtonText}>Wrzuc do gangu</Text>
              </Pressable>
            </View>
          </SectionCard>

          <View style={styles.grid}>
            <ActionTile title="Wplac do skarbca" subtitle="Szybkie zasilenie wspolnej kasy." onPress={depositGangCash} visual={SYSTEM_VISUALS.bank} />
            <ActionTile title="Napad gangu" subtitle="Wskocz od razu do roboty ekipy." onPress={() => setActiveSection("gang", "heists")} visual={SYSTEM_VISUALS.heist} danger />
            <ActionTile title="Czlonkowie" subtitle="Sprawdz sklad i zaproszenia." onPress={() => setActiveSection("gang", "members")} visual={SYSTEM_VISUALS.gang} />
          </View>

          <SectionCard title="Ostatnia aktywnosc" subtitle="Krotki log ekipy bez grzebania po calym chacie.">
            {(game.gang.chat || []).slice(0, 4).map((entry) => (
              <View key={entry.id} style={styles.chatBubble}>
                <Text style={styles.chatAuthor}>{entry.author} <Text style={styles.chatTime}>{entry.time}</Text></Text>
                <Text style={styles.chatText}>{entry.text}</Text>
              </View>
            ))}
          </SectionCard>
        </>
      )}
    </SectionCard>
  );

  const renderGangMembers = () => (
    <SectionCard title="Czlonkowie" subtitle="Prawdziwi ludzie w ekipie.">
      {!game.gang.joined ? (
        <View style={styles.lockedPanel}>
          <Text style={styles.lockedPanelText}>Najpierw musisz miec wlasny gang albo przyjac zaproszenie.</Text>
        </View>
      ) : (
        <>
          <StatLine label="Aktualna liczba ludzi" value={`${game.gang.members}/${game.gang.maxMembers}`} />
          <StatLine label="Do pelnego skladu" value={`${Math.max(0, game.gang.maxMembers - game.gang.members)}`} />
          <StatLine label="Wplyw na napady" value={`+${Math.round(game.gang.members * 0.9)} mocy gangu`} />
          <SectionCard title="Rozbudowa skladu" subtitle="Boss odblokowuje kolejne sloty ze skarbca gangu.">
            <Text style={styles.listCardMeta}>
              Start: 8 ludzi. Kolejne progi: 12 / 16 / 20 / 25.
            </Text>
            <Text style={styles.listCardMeta}>
              Teraz: {game.gang.members}/{game.gang.maxMembers}. {nextGangMemberCapUpgrade ? `Nastepny skok: ${nextGangMemberCapUpgrade.maxMembers} za ${formatMoney(nextGangMemberCapUpgrade.cost)}.` : "Gang ma juz wbity maksymalny limit."}
            </Text>
            {game.gang.role === "Boss" ? (
              <Pressable
                onPress={upgradeGangMembers}
                disabled={!nextGangMemberCapUpgrade}
                style={[styles.inlineButton, !nextGangMemberCapUpgrade && styles.tileDisabled]}
              >
                <Text style={styles.inlineButtonText}>
                  {nextGangMemberCapUpgrade ? `Rozbuduj gang do ${nextGangMemberCapUpgrade.maxMembers}` : "Max skladu"}
                </Text>
              </Pressable>
            ) : null}
          </SectionCard>
          <SectionCard title="Sklad i role" subtitle="Boss i vice boss zarzadzaja, a napady gangu odpalaja tylko boss, vice boss i zaufani. To nie sa kupieni ludzie, tylko realni gracze.">
            {game.gang.membersList.map((member) => (
              <View key={member.id} style={styles.listCard}>
                <View style={styles.inlineRow}>
                  <View style={styles.flexOne}>
                    <Text style={styles.listCardTitle}>{member.name}</Text>
                    <Text style={styles.listCardMeta}>{member.role}</Text>
                  </View>
                  <Tag text={member.trusted ? "Zaufany" : "Zwykly"} warning={!member.trusted} />
                </View>
                {renderGangRoleControls(member)}
              </View>
            ))}
          </SectionCard>
          <SectionCard title="Gracze do zaproszenia" subtitle={`Na liscie sa tylko gracze bez gangu, ktorzy lapia sie na prog ${game.gang.inviteRespectMin} RES.`}>
            {gangInviteTargets.length ? gangInviteTargets.map((candidate) => (
              <View key={candidate.id} style={styles.listCard}>
                <View style={styles.inlineRow}>
                  <View style={styles.flexOne}>
                    <Text style={styles.listCardTitle}>{candidate.name}</Text>
                    <Text style={styles.listCardMeta}>Szacun: {candidate.respect} | Status: {candidate.online ? "Online" : "Offline"}</Text>
                  </View>
                  <Pressable onPress={() => inviteCandidate(candidate.id)} style={[styles.inlineButton, (game.gang.role !== "Boss" || candidate.respect < game.gang.inviteRespectMin || game.gang.members >= game.gang.maxMembers) && styles.tileDisabled]}>
                    <Text style={styles.inlineButtonText}>Zapros</Text>
                  </Pressable>
                </View>
              </View>
            )) : <Text style={styles.emptyText}>Brak realnych graczy bez gangu, ktorzy lapia sie na obecny prog.</Text>}
          </SectionCard>
        </>
      )}
    </SectionCard>
  );

  const renderGangChat = () => (
    <SectionCard title="Chat gangu" subtitle="Wiadomosci ekipy.">
      {!game.gang.joined ? (
        <View style={styles.lockedPanel}>
          <Text style={styles.lockedPanelText}>Bez gangu nie ma dostepu do chatu gangu.</Text>
        </View>
      ) : (
        <>
          <View style={styles.chatComposer}>
            <TextInput value={gangMessage} onChangeText={setGangMessage} placeholder="Napisz do ekipy..." placeholderTextColor="#6c6c6c" style={styles.chatInput} />
            <Pressable onPress={sendGangMessage} style={styles.inlineButton}>
              <Text style={styles.inlineButtonText}>Wyslij</Text>
            </Pressable>
          </View>
          {game.gang.chat.map((entry) => (
            <View key={entry.id} style={styles.chatBubble}>
              <Text style={styles.chatAuthor}>{entry.author} <Text style={styles.chatTime}>{entry.time}</Text></Text>
              <Text style={styles.chatText}>{entry.text}</Text>
            </View>
          ))}
        </>
      )}
    </SectionCard>
  );

  const renderGangOps = () => (
    <SectionCard title="Operacje gangu" subtitle="Gotowosc ekipy na robote.">
      {!game.gang.joined ? (
        <View style={styles.lockedPanel}>
          <Text style={styles.lockedPanelText}>Operacje gangu odblokuja sie dopiero po wejsciu do organizacji.</Text>
        </View>
      ) : (
        <>
          <StatLine label="Fokus gangu" value={focusDistrictSummary?.name || "-"} />
          <StatLine label="Wplywy / kontrola" value={`${game.gang.influence} | ${game.gang.territory} dzielnice`} />
          <StatLine
            label="Cel tygodnia"
            value={`${gangGoalProgress.goal?.title || "Brak"} ${gangGoalProgress.current}/${gangGoalProgress.target}`}
          />
          <View style={styles.listCard}>
            <Text style={styles.listCardTitle}>Tablica roboty</Text>
            <Text style={styles.listCardMeta}>Krotka lista wspolnych celow, bez zasmiecania zakladki gangu.</Text>
            {!activeGangJobBoardProgress.length ? (
              <Text style={styles.listCardMeta}>Tablica jest czysta. Wroc po kolejny ruch gangu.</Text>
            ) : null}
            {activeGangJobBoardProgress.map((job) => (
              <View key={`gang-job-${job.id}`} style={styles.listCard}>
                <Text style={styles.listCardTitle}>{job.title}</Text>
                <Text style={styles.listCardMeta}>{job.summary}</Text>
                <Text style={styles.listCardMeta}>Postep {job.current}/{job.target}</Text>
                <Text style={styles.listCardMeta}>
                  Nagroda: {formatMoney(job.rewards?.vaultCash || 0)} do skarbca, +{job.rewards?.focusInfluence || 0} influence{job.rewards?.pressureRelief ? `, pressure -${job.rewards.pressureRelief}` : ""}.
                </Text>
              </View>
            ))}
          </View>
          {game.gang.protectedClub ? (
            <View style={styles.listCard}>
              <Text style={styles.listCardTitle}>Chroniony klub</Text>
              <Text style={styles.listCardMeta}>
                {game.gang.protectedClub.name} | {protectedGangDistrict?.name || game.gang.protectedClub.districtId}
              </Text>
              <Text style={styles.listCardMeta}>
                Threat {game.gang.protectedClub.threat} | Stabilnosc {game.gang.protectedClub.stability} | Influence +{Math.round(Number(game.gang.protectedClub.influenceBonus || 0) * 100)}%
              </Text>
              <Text style={styles.listCardMeta}>
                Jeden gang = jeden protektor. Ten lokal dostaje lepsza ochrone, a projekty gangu wzmacniaja jego spokoj.
              </Text>
            </View>
          ) : null}
          {pendingGangRescue ? (
            <View style={styles.listCard}>
              <Text style={styles.listCardTitle}>Pomoc po wtapie</Text>
              <Text style={styles.listCardMeta}>
                Po {pendingGangRescue.heistName} siedza: {pendingGangRescueMembers.map((entry) => entry.name).join(", ") || "ludzie z ekipy"}.
              </Text>
              <Text style={styles.listCardMeta}>
                Placisz ze skarbca i ryzykujesz dodatkowy przypal, ale gang moze wyciagnac swoich albo skrocic im odsiadke.
              </Text>
              {GANG_HEIST_RESCUE_OPTIONS.map((option) => (
                <View key={`gang-rescue-${option.id}`} style={styles.listCard}>
                  <Text style={styles.listCardTitle}>{option.name}</Text>
                  <Text style={styles.listCardMeta}>
                    {option.summary} Koszt od {formatMoney(option.baseCost)} | Szansa {Math.round(Number(option.chance || 0) * 100)}%.
                  </Text>
                  <Pressable
                    onPress={() => rescueGangCrew(option.id)}
                    disabled={!canRunGangHeistRole(game.gang.role)}
                    style={[styles.inlineButton, !canRunGangHeistRole(game.gang.role) && styles.tileDisabled]}
                  >
                    <Text style={styles.inlineButtonText}>Odpal {option.name.toLowerCase()}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
          <View style={styles.listCard}>
            <Text style={styles.listCardTitle}>Co robi fokus</Text>
            {focusDistrictEffectLines.map((line) => (
              <Text key={`gang-focus-${line}`} style={styles.listCardMeta}>
                {line}
              </Text>
            ))}
            {gangEffectLines.map((line) => (
              <Text key={`gang-effects-${line}`} style={styles.listCardMeta}>
                {line}
              </Text>
            ))}
          </View>
          <View style={styles.listCard}>
            <Text style={styles.listCardTitle}>Przerzut fokusu</Text>
            <Text style={styles.listCardMeta}>Jedna decyzja dla gangu. Tam idzie projekt, operacja i cisnienie tygodnia.</Text>
            <View style={styles.listActionsRow}>
              {districtSummaries.map((district) => (
                <Pressable
                  key={`focus-${district.id}`}
                  onPress={() => setGangFocus(district.id)}
                  disabled={game.gang.focusDistrictId === district.id || !["Boss", "Vice Boss"].includes(String(game.gang.role || "").trim())}
                  style={[styles.inlineButton, (game.gang.focusDistrictId === district.id || !["Boss", "Vice Boss"].includes(String(game.gang.role || "").trim())) && styles.tileDisabled]}
                >
                  <Text style={styles.inlineButtonText}>{district.shortName}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.listCard}>
            <Text style={styles.listCardTitle}>Projekty</Text>
            <Text style={styles.listCardMeta}>Malo opcji, ale kazda podpiera klub, dzielnice albo operacje.</Text>
            {GANG_PROJECTS.map((project) => {
              const level = getGangProjectLevel(game.gang, project.id);
              const cost = getGangProjectCost(game.gang, project.id);
              const locked = !cost;
              return (
                <View key={project.id} style={styles.listCard}>
                  <View style={styles.inlineRow}>
                    <View style={styles.flexOne}>
                      <Text style={styles.listCardTitle}>{project.name}</Text>
                      <Text style={styles.listCardMeta}>{project.summary}</Text>
                      <Text style={styles.listCardMeta}>Poziom {level}/{project.levels.length}</Text>
                      <Text style={styles.listCardMeta}>{getGangProjectLevelLine(project, level)}</Text>
                    </View>
                    <Pressable
                      onPress={() => investGangProject(project.id)}
                      disabled={locked || String(game.gang.role || "").trim() !== "Boss"}
                      style={[styles.inlineButton, (locked || String(game.gang.role || "").trim() !== "Boss") && styles.tileDisabled]}
                    >
                      <Text style={styles.inlineButtonText}>{locked ? "Max" : formatMoney(cost)}</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
          {visibleGangGoalProgress ? (
            <View style={styles.listCard}>
              <Text style={styles.listCardTitle}>Nagroda tygodnia</Text>
              <Text style={styles.listCardMeta}>{visibleGangGoalProgress.goal?.summary}</Text>
              <Text style={styles.listCardMeta}>
                Nagroda: {formatMoney(visibleGangGoalProgress.goal?.rewards?.vaultCash || 0)} do skarbca i puls w fokusie.
              </Text>
              <Text style={styles.listCardMeta}>
                Fokus dostaje +{visibleGangGoalProgress.goal?.rewards?.focusInfluence || 0} influence, a pressure schodzi o {visibleGangGoalProgress.goal?.rewards?.pressureRelief || 0}.
              </Text>
              <Pressable
                onPress={claimGangGoal}
                style={[styles.inlineButton, !visibleGangGoalProgress.completed && styles.tileDisabled]}
              >
                <Text style={styles.inlineButtonText}>Odbierz</Text>
              </Pressable>
            </View>
          ) : null}
        </>
      )}
    </SectionCard>
  );

  const rankingPool = useMemo(() => {
    const selfEntry = {
      id: "self",
      name: game.player.name,
      avatarId: game.player.avatarId,
      avatarCustomUri: game.player.avatarCustomUri,
      gang: game.gang.name || "No gang",
      respect: game.player.respect,
      cash: game.player.cash + (game.player.bank || 0),
      attack: effectivePlayer.attack,
      defense: effectivePlayer.defense,
      dexterity: effectivePlayer.dexterity,
      charisma: effectivePlayer.charisma,
      bounty: Math.max(0, Math.round(game.player.heat * 140)),
      online: true,
      heists: game.stats.heistsWon,
      casino: game.stats.casinoWins,
    };
    return [selfEntry, ...(game.online?.roster || [])];
  }, [game, effectivePlayer]);

  const renderOnlinePlayers = () => (
    <>
      <SceneArtwork
        eyebrow="Gracze"
        title="Kto siedzi online"
        lines={["Prawdziwi gracze online."]}
        accent={["#342418", "#140f0c", "#050505"]}
        source={SCENE_BACKGROUNDS.gang}
      />
      {selectedWorldPlayer ? (
      <SectionCard title="Profil gracza" subtitle="Szybka karta gracza.">
          <View style={styles.playerProfilePanel}>
            <View style={styles.playerProfileMain}>
              <LinearGradient colors={selectedWorldPlayer.online ? ["#57411a", "#1a1209"] : ["#363636", "#111111"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.playerProfileHero}>
                <EntityBadge visual={getPlayerAvatarVisual(selectedWorldPlayer)} large />
                <View style={styles.playerProfileMeta}>
                  <Text style={styles.playerProfileName}>{selectedWorldPlayer.name}</Text>
                  <Pressable onPress={() => openGangProfile(selectedWorldPlayer.gang)} disabled={selectedWorldPlayer.gang === "No gang"}>
                    <Text style={[styles.playerProfileGang, selectedWorldPlayer.gang === "No gang" && styles.mutedLink]}>{selectedWorldPlayer.gang}</Text>
                  </Pressable>
                  <Text style={styles.playerProfileStatus}>
                    {selectedWorldPlayer.online ? "Online" : "Offline"} | {getRankTitle(selectedWorldPlayer.respect)}
                    {selectedWorldPlayerCriticalCareRemaining > 0
                      ? ` | Intensywna ${formatCooldown(selectedWorldPlayerCriticalCareRemaining)}`
                      : selectedWorldPlayerProtectionRemaining > 0
                        ? ` | Oslona ${formatCooldown(selectedWorldPlayerProtectionRemaining)}`
                        : ""}
                  </Text>
                </View>
              </LinearGradient>

              <View style={styles.playerStatsBoard}>
                <StatLine label="Szacun" value={`${selectedWorldPlayer.respect}`} visual={SYSTEM_VISUALS.respect} />
                <StatLine label="Atak" value={`${selectedWorldPlayer.attack}`} visual={SYSTEM_VISUALS.attack} />
                <StatLine label="Obrona" value={`${selectedWorldPlayer.defense}`} visual={SYSTEM_VISUALS.defense} />
                <StatLine label="Zrecznosc" value={`${selectedWorldPlayer.dexterity}`} />
                <StatLine label="Kasa przy sobie" value={formatMoney(selectedWorldPlayer.cash)} visual={SYSTEM_VISUALS.cash} />
                <StatLine label="Bounty" value={formatMoney(selectedWorldPlayer.bounty)} />
                <StatLine label="Napady" value={`${selectedWorldPlayer.heists}`} visual={SYSTEM_VISUALS.heist} />
                <StatLine label="Kasyno" value={`${selectedWorldPlayer.casino}`} visual={SYSTEM_VISUALS.casino} />
              </View>
            </View>

            <View style={styles.playerProfileActions}>
              <Pressable onPress={() => openGangProfile(selectedWorldPlayer.gang)} style={[styles.inlineButton, selectedWorldPlayer.gang === "No gang" && styles.tileDisabled]}>
                <Text style={styles.inlineButtonText}>Profil gangu</Text>
              </Pressable>
              {game.gang.joined && game.gang.role === "Boss" && selectedWorldPlayer.gang === "No gang" ? (
                <Pressable
                  onPress={() => inviteCandidate(selectedWorldPlayer.id)}
                  style={[
                    styles.inlineButton,
                    (selectedWorldPlayer.respect < game.gang.inviteRespectMin || game.gang.members >= game.gang.maxMembers) && styles.tileDisabled,
                  ]}
                >
                  <Text style={styles.inlineButtonText}>Zapros do gangu</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={() => openMessageComposer(selectedWorldPlayer)} style={styles.inlineButton}>
                <Text style={styles.inlineButtonText}>Napisz wiadomosc</Text>
              </Pressable>
              <Pressable
                onPress={() => attackWorldPlayer(selectedWorldPlayer)}
                disabled={
                  !selectedWorldPlayer.online ||
                  selectedWorldPlayerAttackCooldownRemaining > 0 ||
                  selectedWorldPlayerCriticalCareRemaining > 0 ||
                  selectedWorldPlayerProtectionRemaining > 0 ||
                  criticalCareStatus.active
                }
                style={[
                  styles.inlineButton,
                  (
                    !selectedWorldPlayer.online ||
                    selectedWorldPlayerAttackCooldownRemaining > 0 ||
                    selectedWorldPlayerCriticalCareRemaining > 0 ||
                    selectedWorldPlayerProtectionRemaining > 0 ||
                    criticalCareStatus.active
                  ) && styles.tileDisabled,
                ]}
              >
                <Text style={styles.inlineButtonText}>
                  {!selectedWorldPlayer.online
                    ? "Offline"
                    : criticalCareStatus.active
                      ? "Intensywna"
                      : selectedWorldPlayerCriticalCareRemaining > 0
                        ? "Na terapii"
                        : selectedWorldPlayerProtectionRemaining > 0
                          ? `Oslona ${formatCooldown(selectedWorldPlayerProtectionRemaining)}`
                    : selectedWorldPlayerAttackCooldownRemaining > 0
                      ? `Atak za ${formatCooldown(selectedWorldPlayerAttackCooldownRemaining)}`
                      : "Atakuj"}
                </Text>
              </Pressable>
              <Pressable onPress={() => addWorldPlayerFriend(selectedWorldPlayer)} style={styles.inlineButton}>
                <Text style={styles.inlineButtonText}>Dodaj do znajomych</Text>
              </Pressable>
              <Pressable onPress={() => placeBountyOnPlayer(selectedWorldPlayer)} style={styles.inlineButton}>
                <Text style={styles.inlineButtonText}>Wystaw bounty</Text>
              </Pressable>
              {adminState.isAdmin
                ? adminState.grantPresets.map((preset) => (
                    <Pressable
                      key={preset.id}
                      onPress={() => grantAdminCashToPlayer(selectedWorldPlayer, preset.amount)}
                      style={styles.inlineButton}
                    >
                      <Text style={styles.inlineButtonText}>{preset.label}</Text>
                    </Pressable>
                  ))
                : null}
              {adminState.isAdmin
                ? adminState.respectPresets.map((preset) => (
                    <Pressable
                      key={preset.id}
                      onPress={() => grantAdminRespectToPlayer(selectedWorldPlayer, preset.amount)}
                      style={styles.inlineButton}
                    >
                      <Text style={styles.inlineButtonText}>{preset.label}</Text>
                    </Pressable>
                  ))
                : null}
              {adminState.isAdmin ? (
                <Pressable
                  onPress={() => deleteAdminPlayerAccount(selectedWorldPlayer)}
                  disabled={adminDeleteBusyLogin === selectedWorldPlayer.name}
                  style={[
                    styles.inlineButton,
                    styles.inlineButtonDanger,
                    adminDeleteBusyLogin === selectedWorldPlayer.name && styles.tileDisabled,
                  ]}
                >
                  <Text style={[styles.inlineButtonText, styles.inlineButtonDangerText]}>
                    {adminDeleteBusyLogin === selectedWorldPlayer.name ? "Usuwanie..." : "Usun konto"}
                  </Text>
                </Pressable>
              ) : null}
              <Pressable onPress={closeWorldPlayerProfile} style={styles.inlineButton}>
                <Text style={styles.inlineButtonText}>Wroc do listy</Text>
              </Pressable>
            </View>
          </View>
        </SectionCard>
      ) : null}
      <SectionCard title="Gracze" subtitle="Lista ludzi online.">
        {!game.online.roster.length ? (
          <View style={styles.lockedPanel}>
            <Text style={styles.lockedPanelText}>Na razie pusto. Jak ludzie wejda online, pojawia sie tutaj.</Text>
          </View>
        ) : null}
        {game.online.roster.map((player) => (
          <Pressable key={player.id} style={[styles.listCard, styles.playerRosterCard]} onPress={() => openWorldPlayerProfile(player.id)}>
            <View style={[styles.listCardHeader, styles.playerRosterHeader]}>
              <View style={styles.entityHead}>
                <EntityBadge visual={getPlayerAvatarVisual(player)} />
                <View style={styles.flexOne}>
                  <Text style={styles.listCardTitle}>{player.name}</Text>
                  <Text style={styles.listCardMeta}>
                    {player.gang === "No gang" ? "Solo" : player.gang} | Szacun {player.respect} | Kasa {formatMoney(player.cash)}
                  </Text>
                </View>
              </View>
              <Tag text={player.online ? "ONLINE" : "OFFLINE"} warning={!player.online} />
            </View>
            <View style={styles.playerRosterStats}>
              <View style={styles.playerRosterStat}>
                <Text style={styles.playerRosterStatLabel}>ATK / DEF</Text>
                <Text style={styles.playerRosterStatValue}>{player.attack}/{player.defense}</Text>
              </View>
              <View style={styles.playerRosterStat}>
                <Text style={styles.playerRosterStatLabel}>DEX</Text>
                <Text style={styles.playerRosterStatValue}>{player.dexterity}</Text>
              </View>
              <View style={styles.playerRosterStat}>
                <Text style={styles.playerRosterStatLabel}>BOUNTY</Text>
                <Text style={styles.playerRosterStatValue}>{formatMoney(player.bounty)}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </SectionCard>
    </>
  );

  const renderOnlineFriends = () => (
    <SectionCard title="Znajomi" subtitle="Ludzie pod reka.">
      {!game.online.friends.length ? (
        <View style={styles.lockedPanel}>
          <Text style={styles.lockedPanelText}>Na razie pusto. Kliknij kogos z listy graczy i dodaj go do znajomych.</Text>
        </View>
      ) : null}
      {game.online.friends.map((friend) => (
        <View key={friend.id} style={styles.listCard}>
          <View style={styles.inlineRow}>
            <View style={styles.flexOne}>
              <Text style={styles.listCardTitle}>{friend.name}</Text>
              <Text style={styles.listCardMeta}>{friend.gang} | Szacun {friend.respect}</Text>
            </View>
            <Tag text={friend.online ? "ONLINE" : "OFFLINE"} warning={!friend.online} />
          </View>
          <View style={styles.listActionsRow}>
            <Pressable onPress={() => openMessageComposer(friend)} style={styles.inlineButton}>
              <Text style={styles.inlineButtonText}>Napisz</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </SectionCard>
  );

  const renderOnlineMessages = () => (
    <SectionCard title="Wiadomosci" subtitle="Prywatna skrzynka.">
      {game.online.messages.map((message) => (
        <View key={message.id} style={styles.listCard}>
          <View style={styles.listCardHeader}>
            <View style={styles.flexOne}>
              <Text style={styles.listCardTitle}>{message.subject}</Text>
              <Text style={styles.listCardMeta}>Od: {message.from}</Text>
            </View>
            <Tag text={message.time} />
          </View>
          <Text style={styles.listCardMeta}>{message.preview}</Text>
        </View>
      ))}
    </SectionCard>
  );

  const renderDirectMessageComposer = () => (
    <SectionCard
      title={directMessageRecipient?.name ? `Wiadomosc do ${directMessageRecipient.name}` : "Nowa wiadomosc"}
      subtitle="Napisz normalna prywatna wiadomosc."
    >
      <View style={styles.lockedPanel}>
        <Text style={styles.lockedPanelText}>
          {directMessageRecipient?.name
            ? `Odbiorca: ${directMessageRecipient.name}${directMessageRecipient.gang ? ` | ${directMessageRecipient.gang}` : ""}`
            : "Najpierw wybierz gracza albo znajomego."}
        </Text>
      </View>
      <TextInput
        value={directMessageDraft}
        onChangeText={setDirectMessageDraft}
        placeholder="Napisz wiadomosc..."
        placeholderTextColor="#6c6c6c"
        style={styles.messageComposerInput}
        multiline
        maxLength={280}
        textAlignVertical="top"
      />
      <Text style={styles.messageComposerMeta}>{directMessageDraft.trim().length}/280</Text>
      <View style={styles.listActionsRow}>
        <Pressable onPress={sendDirectMessageToPlayer} style={styles.inlineButton}>
          <Text style={styles.inlineButtonText}>Wyslij</Text>
        </Pressable>
        <Pressable onPress={closeQuickAction} style={styles.inlineButton}>
          <Text style={styles.inlineButtonText}>Anuluj</Text>
        </Pressable>
      </View>
    </SectionCard>
  );

  const renderCityChat = () => (
    <>
      <SceneArtwork
        eyebrow="Miasto"
        title="Chat miasta"
        lines={["Tutaj lapiesz ludzi do akcji, handlu i testow."]}
        accent={["#2d2417", "#110f0c", "#050505"]}
        source={SCENE_BACKGROUNDS.city}
      />
      <SectionCard title="Globalny chat" subtitle="Wszyscy online widza ten kanal miasta.">
        <View style={styles.chatComposer}>
          <TextInput
            value={cityMessage}
            onChangeText={setCityMessage}
            placeholder="Napisz do miasta..."
            placeholderTextColor="#6c6c6c"
            style={styles.chatInput}
          />
          <Pressable onPress={sendCityMessage} style={styles.inlineButton}>
            <Text style={styles.inlineButtonText}>Wyslij</Text>
          </Pressable>
        </View>
        {(game.online.cityChat || []).map((entry) => (
          <View key={entry.id} style={styles.chatBubble}>
            <Text style={styles.chatAuthor}>{entry.author} <Text style={styles.chatTime}>{entry.time}</Text></Text>
            <Text style={styles.chatText}>{entry.text}</Text>
          </View>
        ))}
      </SectionCard>
    </>
  );

  const renderRankings = () => {
    const byRespect = (game.online?.rankings?.byRespect?.length ? game.online.rankings.byRespect : [...rankingPool].sort((a, b) => b.respect - a.respect)).slice(0, 6);
    const byCash = (game.online?.rankings?.byCash?.length ? game.online.rankings.byCash : [...rankingPool].sort((a, b) => b.cash - a.cash)).slice(0, 6);
    const byHeists = (game.online?.rankings?.byHeists?.length ? game.online.rankings.byHeists : [...rankingPool].sort((a, b) => b.heists - a.heists)).slice(0, 6);
    const byCasino = (game.online?.rankings?.byCasino?.length ? game.online.rankings.byCasino : [...rankingPool].sort((a, b) => b.casino - a.casino)).slice(0, 6);
    const rankingGroups = {
      respect: {
        id: "respect",
        label: "Szacun",
        title: "Topka szacunku",
        entries: byRespect,
        renderValue: (entry) => `${entry.respect} RES`,
      },
      cash: {
        id: "cash",
        label: "Kasa",
        title: "Topka kasy",
        entries: byCash,
        renderValue: (entry) => formatMoney(entry.cash),
      },
      heists: {
        id: "heists",
        label: "Napady",
        title: "Topka napadow",
        entries: byHeists,
        renderValue: (entry) => `${entry.heists} runow`,
      },
      casino: {
        id: "casino",
        label: "Kasyno",
        title: "Topka kasyna",
        entries: byCasino,
        renderValue: (entry) => `${entry.casino} wygr.`,
      },
    };
    const activeRanking = rankingGroups[rankingCategory] || rankingGroups.respect;

    return (
      <>
      <SceneArtwork
        eyebrow="Rankingi"
        title="Topka miasta"
        lines={["Wybierasz kategorie i widzisz jedna czysta liste zamiast sciany kart."]}
          accent={["#382417", "#140f0c", "#050505"]}
          source={SCENE_BACKGROUNDS.profile}
        />
        <View style={styles.planChipRow}>
          {Object.values(rankingGroups).map((group) => (
            <Pressable
              key={group.id}
              onPress={() => setRankingCategory(group.id)}
              style={[styles.planChip, rankingCategory === group.id && styles.planChipActive]}
            >
              <Text style={[styles.planChipText, rankingCategory === group.id && styles.planChipTextActive]}>{group.label}</Text>
            </Pressable>
          ))}
        </View>
        <SectionCard title={activeRanking.title} subtitle="Jedna kategoria naraz. Szybciej to zeskanowac i latwiej znalezc swoja pozycje.">
          {activeRanking.entries.map((entry, index) => (
            <View key={`${activeRanking.id}-${entry.id}`} style={styles.listCard}>
              <View style={styles.listCardHeader}>
                <View style={styles.entityHead}>
                  <EntityBadge visual={getPlayerAvatarVisual(entry)} />
                  <View style={styles.flexOne}>
                    <Text style={styles.listCardTitle}>#{index + 1} {entry.name}</Text>
                    <Text style={styles.listCardMeta}>{entry.gang === "No gang" ? "Solo" : entry.gang}</Text>
                  </View>
                </View>
                <View style={styles.alignEnd}>
                  <Text style={styles.listCardReward}>{activeRanking.renderValue(entry)}</Text>
                  <Tag text={entry.id === "self" ? "TY" : "GRACZ"} />
                </View>
              </View>
            </View>
          ))}
        </SectionCard>
      </>
    );
  };

  const renderReferralProgram = () => (
    <>
      <SceneArtwork
        eyebrow="Polecenia"
        title="Program polecen pod wzrost gry"
        lines={["Nagrody za aktywnych poleconych."]}
        accent={["#4b2f18", "#160f0c", "#050505"]}
        source={SCENE_BACKGROUNDS.city}
      />
      <SectionCard title="Twoj kod polecajacy" subtitle="Kod, aktywacje i progi.">
        <View style={styles.heroBanner}>
          <Text style={styles.heroBannerTitle}>{game.referrals.code}</Text>
          <Text style={styles.heroBannerText}>Nagroda wpada dopiero za aktywnego poleconego.</Text>
        </View>
        <StatLine label="Wyslane zaproszenia" value={`${game.referrals.invited}`} />
        <StatLine label="Aktywni poleceni" value={`${game.referrals.verified}`} />
        <StatLine label="Czekaja na aktywacje" value={`${game.referrals.pending}`} />
        <StatLine label="Zasada anty-farm" value="Nagroda dopiero po progresie poleconego" />
      </SectionCard>

      <SectionCard title="Progi nagrod" subtitle="Cash i bonus XP za aktywnych poleconych.">
        {REFERRAL_MILESTONES.map((milestone) => {
          const claimed = game.referrals.claimedMilestones.includes(milestone.id);
          const unlocked = game.referrals.verified >= milestone.verified;
          return (
            <View key={milestone.id} style={styles.listCard}>
              <View style={styles.listCardHeader}>
                <View style={styles.entityHead}>
                  <EntityBadge visual={BUSINESS_VISUALS.tower} />
                  <View style={styles.flexOne}>
                    <Text style={styles.listCardTitle}>{milestone.verified} aktywnych poleconych</Text>
                    <Text style={styles.listCardMeta}>
                      {formatMoney(milestone.rewardCash)}{milestone.rewardXp ? ` | +${milestone.rewardXp} XP` : ""}
                    </Text>
                  </View>
                </View>
                <Tag text={claimed ? "Odebrane" : unlocked ? "Gotowe" : "Zablokowane"} warning={!claimed && !unlocked} />
              </View>
              <View style={styles.inlineRow}>
                <Text style={styles.costLabel}>Odblokowanie: {game.referrals.verified}/{milestone.verified}</Text>
                <Pressable onPress={() => claimReferralMilestone(milestone)} style={[styles.inlineButton, (!unlocked || claimed) && styles.tileDisabled]}>
                  <Text style={styles.inlineButtonText}>{claimed ? "Odebrane" : "Odbierz"}</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </SectionCard>

      <SectionCard title="Docelowe spiecie online" subtitle="To musi siedziec na backendzie.">
        <View style={styles.lockedPanel}>
          <Text style={styles.lockedPanelText}>Kod przy rejestracji, prog aktywacji i blokada farmy.</Text>
        </View>
      </SectionCard>
    </>
  );

  const marketScreenBaseProps = {
    game,
    styles,
    SceneArtwork,
    SectionCard,
    EntityBadge,
    Tag,
    formatMoney,
    formatDuration,
    products: PRODUCTS,
    drugs: DRUGS,
    sceneBackgrounds: SCENE_BACKGROUNDS,
    productVisuals: PRODUCT_VISUALS,
    drugVisuals: DRUG_VISUALS,
    systemVisuals: SYSTEM_VISUALS,
    contractItems: CONTRACT_ITEMS,
    contractCars: CONTRACT_CARS,
    contractState,
    contractCategoryVisuals: CONTRACT_CATEGORY_VISUALS,
    getContractAssetEffectLine,
    marketState: game.marketState,
    marketMeta: game.marketMeta,
    dealerTradeDraft,
    setDealerTradeDraft,
    actions: {
      buyProduct,
      sellProduct,
      buyDrugFromDealer,
      sellDrugToDealer,
      consumeDrug,
      buyContractItem,
      buyContractCar,
      equipContractAsset,
    },
  };

  const cityScreenProps = {
    section: activeSectionId,
    apiStatus,
    game: projectedScreenGame,
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
    sceneBackgrounds: SCENE_BACKGROUNDS,
    systemVisuals: SYSTEM_VISUALS,
    energyRegenSeconds: ENERGY_REGEN_SECONDS,
    healthRegenSeconds: HEALTH_REGEN_SECONDS,
    healthRegenAmount: HEALTH_REGEN_AMOUNT,
    jailRemaining,
    criticalCareStatus,
    criticalCareModes: {
      public: publicCriticalCareMode,
      private: privateCriticalCareMode,
    },
    criticalCareBlockedActions: CRITICAL_CARE_RULES.blockedActions,
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
    restaurantItems: RESTAURANT_ITEMS,
    gymPasses: GYM_PASSES,
    gymExercises: GYM_EXERCISES,
    taskStates: activeTaskStates,
    taskBoard,
    bankRecentTransfers,
    bankFeedback,
    helpers: {
      hasGymPass,
      inJail,
      nextHeistName: heistCatalog.find((entry) => entry.respect > game.player.respect)?.name ?? "Wszystkie odblokowane",
    },
    actions: {
      openSection: setActiveSection,
      quickHeist: () => {
        const available = heistCatalog.filter((entry) => entry.respect <= game.player.respect);
        executeHeist(available[available.length - 1] ?? heistCatalog[0]);
      },
      collectGangTribute,
      setGangFocus,
      collectBusinessIncome,
      collectEscortIncome,
      claimTask,
      depositCash,
      withdrawCash,
      buyGymPass,
      handleTrain: doGymExercise,
      handleEat: buyMeal,
      handleHeal: heal,
      moveToPrivateClinic,
      bribeOutOfJail,
    },
  };

  const hubScreenProps = {
    styles,
    SceneArtwork,
    SectionCard,
    ActionTile,
    StatLine,
    sceneBackgrounds: SCENE_BACKGROUNDS,
    systemVisuals: SYSTEM_VISUALS,
    formatMoney,
    formatCooldown,
    topTask,
    criticalCareStatus,
    totalBusinessIncome,
    totalEscortIncome,
    onlinePlayerCount: game.online.roster.length,
    focusDistrictSummary,
    hottestDistrictSummary,
    nextHeistTierLabel: nextHeistTier ? `${nextHeistTier.title} przy ${nextHeistTier.unlockRespect} RES` : "Masz wszystkie tiery",
    actions: {
      openSection: setActiveSection,
      openQuickAction,
      logout: handleLogout,
    },
  };
  const casinoScreenProps = {
    apiStatus,
    casinoState,
    styles,
    SceneArtwork,
    SectionCard,
    StatLine,
    ActionTile,
    PlayingCard,
    EntityBadge,
    sceneBackgrounds: SCENE_BACKGROUNDS,
    systemVisuals: SYSTEM_VISUALS,
    formatMoney,
    formatCooldown,
    handValue,
    setCasinoState,
    spinRoulette,
    spinSlot,
    startBlackjack,
    hitBlackjack,
    standBlackjack,
  };

  const empireScreenBaseProps = {
    game: projectedScreenGame,
    styles,
    SceneArtwork,
    SectionCard,
    StatLine,
    ActionTile,
    EntityBadge,
    Tag,
    formatMoney,
    formatAccruedMoney,
    formatLongDuration,
    formatCollectionStamp,
    formatCooldown,
    sceneBackgrounds: SCENE_BACKGROUNDS,
    businessVisuals: BUSINESS_VISUALS,
    escortVisuals: ESCORT_VISUALS,
    factoryVisuals: FACTORY_VISUALS,
    drugVisuals: DRUG_VISUALS,
    supplierVisuals: SUPPLIER_VISUALS,
    systemVisuals: SYSTEM_VISUALS,
    businesses: BUSINESSES,
    escorts: ESCORTS,
    streetDistricts: STREET_DISTRICTS,
    factories: FACTORIES,
    drugs: DRUGS,
    suppliers: SUPPLIERS,
    clubFoundingCashCost: CLUB_FOUNDING_CASH_COST,
    clubNightPlans: CLUB_NIGHT_PLANS,
    clubSystemRules: CLUB_SYSTEM_RULES,
    clubVisitorActions: CLUB_VISITOR_ACTIONS,
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
    focusDistrictSummary,
    districtSummaries,
    helpers: {
      getOwnedEscort,
      getEscortWorkingCount,
      getEscortDistrictCount,
      hasFactory,
      getDrugPoliceProfile,
      getDrugProductionRespectRequirement,
      getDealerPayoutForDrug,
      getClubVenueProfile,
      getClubNightPlan,
      getBusinessUpgradeState,
      getBusinessUpgradePreview,
      getLeadTargetEscortForVenue,
    },
    actions: {
      collectBusinessIncome,
      collectEscortIncome,
      buyBusiness,
      upgradeBusiness,
      buyEscort,
      assignEscortToStreet,
      pullEscortFromStreet,
      sellEscort,
      buyFactory,
      produceDrug,
      buySupply,
      enterClubAsGuest,
      leaveClubAsGuest,
      openClub,
      foundClub,
      setClubNightPlan,
      setClubEntryFee,
      collectClubSafe,
      fortifyClub,
      runClubVisitorAction,
      buyDrugFromDealer,
      sellDrugToDealer,
      consumeDrugFromClub,
      moveDrugToClub,
    },
  };

  const profileScreenBaseProps = {
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
    avatars: avatarOptions,
    setAvatar,
    pickCustomAvatar,
    formatMoney,
    formatCooldown,
    getRankTitle,
    heists: heistCatalog,
    getSoloHeistOdds,
    sceneBackgrounds: SCENE_BACKGROUNDS,
    criticalCareStatus,
    contractState,
    contractItems: ownedContractItems,
    contractCars: ownedContractCars,
    getContractAssetEffectLine,
    onEquipContractLoadout: equipContractAsset,
  };

  const profileMenuScreenProps = {
    styles,
    SceneArtwork,
    SectionCard,
    ActionTile,
    sceneBackgrounds: SCENE_BACKGROUNDS,
    systemVisuals: SYSTEM_VISUALS,
    actions: {
      openSection: setActiveSection,
      logout: handleLogout,
    },
  };

  const heistsScreenProps = {
    section: activeSectionId,
    heists: heistCatalog,
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
    contractState,
    contractHistory,
    contractLoadoutSummaryLines,
    getContractPreviewForContract,
    getContractPreviewLinesForContract,
    availableOperations,
    activeOperation,
    activeOperationStage,
    activeOperationChoices,
    getSoloHeistOdds,
    onExecuteHeist: executeHeist,
    onExecuteContract: executeContract,
    onStartOperation: startOperation,
    onAdvanceOperation: advanceOperation,
    onExecuteOperation: executeOperationPlan,
    onBlockedByCriticalCare: showCriticalCareBlockedNotice,
    onOpenHospital: () => setActiveSection("city", "hospital"),
    sceneBackgrounds: SCENE_BACKGROUNDS,
  };

  const fightClubScreenProps = {
    arena: game.arena,
    activeBoosts: game.activeBoosts,
    player: game.player,
    SectionCard,
    formatMoney,
    formatCooldown,
    criticalCareStatus,
    onOpenHospital: () => setActiveSection("city", "hospital"),
    onStartRun: startFightClubRun,
    onFightNext: resolveFightClubRun,
    onBuyBoost: buyFightClubBoost,
  };

  const renderQuickActionContent = () => {
    switch (quickActionModal) {
      case "bank":
        return <CityScreen {...cityScreenProps} section="bank" />;
      case "casino":
        return <CasinoScreen {...casinoScreenProps} />;
      case "restaurant":
        return <CityScreen {...cityScreenProps} section="restaurant" />;
      case "hospital":
        return <CityScreen {...cityScreenProps} section="hospital" />;
      case "gym":
        return <CityScreen {...cityScreenProps} section="gym" />;
      case "compose-message":
        return renderDirectMessageComposer();
      default:
        return null;
    }
  };

  const quickActionModalTitles = {
    bank: "Bank",
    casino: "Kasyno",
    restaurant: "Restauracja",
    hospital: "Szpital",
    gym: "Trening",
    "compose-message": directMessageRecipient?.name ? `Wiadomosc do ${directMessageRecipient.name}` : "Nowa wiadomosc",
  };

  const renderActiveSection = () => {
    switch (`${tab}:${activeSectionId}`) {
      case "city:districts":
      case "city:dashboard":
      case "city:tasks":
      case "city:bank":
      case "city:gym":
      case "city:restaurant":
      case "city:hospital":
      case "profile:tasks":
      case "profile:bank":
      case "profile:gym":
      case "profile:restaurant":
      case "profile:hospital":
        return <CityScreen {...cityScreenProps} section={activeSectionId === "dashboard" ? "districts" : activeSectionId} />;
      case "profile:casino":
        return <CasinoScreen {...casinoScreenProps} />;
      case "heists:solo":
        return <HeistsScreen {...heistsScreenProps} section="solo" />;
      case "heists:contracts":
        return <HeistsScreen {...heistsScreenProps} section="contracts" />;
      case "heists:fightclub":
        return <FightClubScreen {...fightClubScreenProps} />;
      case "heists:prison":
        return renderPrison();
      case "empire:businesses":
        return <EmpireScreen section="businesses" {...empireScreenBaseProps} />;
      case "empire:factories":
        return <EmpireScreen section="factories" {...empireScreenBaseProps} />;
      case "empire:suppliers":
        return <EmpireScreen section="suppliers" {...empireScreenBaseProps} />;
      case "empire:club":
        return <EmpireScreen section="club" {...empireScreenBaseProps} />;
      case "market:street":
        return <MarketScreen section="drugs" {...marketScreenBaseProps} />;
      case "market:drugs":
        return <MarketScreen section="drugs" {...marketScreenBaseProps} />;
      case "market:items":
        return <MarketScreen section="items" {...marketScreenBaseProps} />;
      case "market:cars":
        return <MarketScreen section="cars" {...marketScreenBaseProps} />;
      case "market:boosts":
        return <MarketScreen section="boosts" {...marketScreenBaseProps} />;
      case "gang:overview":
        return renderGangOverview();
      case "gang:heists":
        return renderGangHeists();
      case "gang:members":
        return renderGangMembers();
      case "gang:chat":
        return renderGangChat();
      case "gang:ops":
        return renderGangOps();
      case "profile:players":
        return renderOnlinePlayers();
      case "profile:friends":
        return renderOnlineFriends();
      case "profile:messages":
        return renderOnlineMessages();
      case "profile:citychat":
        return renderCityChat();
      case "profile:rankings":
        return renderRankings();
      case "profile:summary":
        return <ProfileScreen section="summary" {...profileScreenBaseProps} />;
      case "profile:progress":
        return <ProfileScreen section="progress" {...profileScreenBaseProps} />;
      case "profile:loadout":
        return <ProfileScreen section="loadout" {...profileScreenBaseProps} />;
      case "profile:protection":
        return <ProfileScreen section="protection" {...profileScreenBaseProps} />;
      case "profile:utilities":
        return <ProfileMenuScreen section="utilities" {...profileMenuScreenProps} />;
      case "profile:community":
        return <ProfileMenuScreen section="community" {...profileMenuScreenProps} />;
      case "profile:log":
        return <ProfileScreen section="log" {...profileScreenBaseProps} />;
      default:
        return renderSoloHeists();
    }
  };

  let activeSectionContent;

  try {
    activeSectionContent = isHubActive ? <HubScreen {...hubScreenProps} /> : renderActiveSection();
  } catch (error) {
    console.error("Section render crash", error);
    activeSectionContent = (
      <SectionCard title="Blad ekranu" subtitle="Awaryjny fallback">
        <Text style={styles.emptyText}>Ten ekran wywalil sie podczas renderu. Wroc do innej zakladki albo odswiez appke.</Text>
      </SectionCard>
    );
  }

  if (!authReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ExpoStatusBar style="light" />
        <View style={styles.loadingScreen}>
          <Text style={styles.loadingTitle}>Hustle City</Text>
          <Text style={styles.loadingText}>Laczenie z backendem i odpalanie sejwu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!sessionToken) {
    return (
      <AuthScreen
        busy={authBusy}
        error={authError || startupError}
        onLogin={handleAuthLogin}
        onRegister={handleAuthRegister}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="light" />
      <StatusBar barStyle="light-content" />
      <ScrollView ref={pageScrollRef} contentContainerStyle={[styles.pageScroll, isPhone && styles.pageScrollPhone]}>
        <View style={styles.pageBackdrop}>
          <LinearGradient colors={["#1f1f1f", "#0a0a0a", "#000000"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ambientGlowOne} />
          <LinearGradient colors={["rgba(170,170,170,0.16)", "rgba(0,0,0,0)"]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={styles.ambientGlowTwo} />

          <View style={styles.gameShell}>
            <GameHeader
              playerName={game.player.name}
              rankTitle={getRankTitle(game.player.respect)}
              statusLabel={gameMode === "online_alpha" ? "ONLINE" : "DEMO"}
              level={game.player.respect}
              xp={respectInfo.currentXp}
              xpRequired={respectInfo.requirement}
              xpProgress={respectInfo.progress}
              cash={formatMoney(game.player.cash)}
              bank={formatMoney(game.player.bank)}
              hp={game.player.hp}
              maxHp={game.player.maxHp}
              energy={game.player.energy}
              maxEnergy={game.player.maxEnergy}
              energyFeedback={mealFeedback}
              activeAvatar={activeAvatar}
              criticalCareStatus={criticalCareStatus}
              formatCooldown={formatCooldown}
            />

            {notice && !isPhone ? (
              <Animated.View
                style={[
                  styles.noticeBanner,
                  notice.tone === "success"
                    ? styles.noticeBannerSuccess
                    : notice.tone === "failure"
                      ? styles.noticeBannerFailure
                      : styles.noticeBannerWarning,
                  { opacity: noticeOpacity, transform: [{ translateY: noticeTranslateY }] },
                ]}
              >
                <Text style={styles.noticeTitle}>{notice.title || "INFO"}</Text>
                <Text style={styles.noticeText}>{notice.message}</Text>
                {notice.deltas ? (
                  <View style={styles.noticeDeltaRow}>
                    {notice.deltas.cash ? (
                      <View
                        style={[
                          styles.noticeDeltaChip,
                          notice.deltas.cash > 0 ? styles.noticeDeltaChipPositive : styles.noticeDeltaChipNegative,
                        ]}
                      >
                        <Text style={styles.noticeDeltaText}>{notice.deltas.cash > 0 ? `+${formatMoney(notice.deltas.cash)}` : `-${formatMoney(Math.abs(notice.deltas.cash))}`}</Text>
                      </View>
                    ) : null}
                    {notice.deltas.hp ? (
                      <View
                        style={[
                          styles.noticeDeltaChip,
                          notice.deltas.hp > 0 ? styles.noticeDeltaChipPositive : styles.noticeDeltaChipNegative,
                        ]}
                      >
                        <Text style={styles.noticeDeltaText}>{notice.deltas.hp > 0 ? `HP +${notice.deltas.hp}` : `HP -${Math.abs(notice.deltas.hp)}`}</Text>
                      </View>
                    ) : null}
                    {notice.deltas.heat ? (
                      <View
                        style={[
                          styles.noticeDeltaChip,
                          notice.deltas.heat > 0 ? styles.noticeDeltaChipWarning : styles.noticeDeltaChipPositive,
                        ]}
                      >
                        <Text style={styles.noticeDeltaText}>{notice.deltas.heat > 0 ? `HEAT +${notice.deltas.heat}` : `HEAT ${notice.deltas.heat}`}</Text>
                      </View>
                    ) : null}
                    {notice.deltas.respect ? (
                      <View style={[styles.noticeDeltaChip, styles.noticeDeltaChipPositive]}>
                        <Text style={styles.noticeDeltaText}>{`SZACUN +${notice.deltas.respect}`}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </Animated.View>
            ) : null}

              <View style={styles.tabBarShell}>
                <Pressable onPress={() => setIsHubActive(true)} style={[styles.tabButtonClassic, isHubActive && styles.tabButtonClassicActive, styles.tabButtonHub]}>
                  <View style={styles.tabButtonClassicInner}>
                    <Text style={[styles.tabButtonClassicIcon, isHubActive && styles.tabButtonClassicIconActive]}>{TAB_SIGILS.start}</Text>
                    <Text style={[styles.tabButtonClassicText, isHubActive && styles.tabButtonClassicTextActive]}>Start</Text>
                  </View>
                </Pressable>
                <ScrollView
                  horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabBarClassic}
                contentContainerStyle={styles.tabBarClassicContent}
              >
                {TAB_DEFINITIONS.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setTab(item.id);
                      setIsHubActive(false);
                    }}
                    style={[styles.tabButtonClassic, !isHubActive && tab === item.id && styles.tabButtonClassicActive]}
                    >
                      <View style={styles.tabButtonClassicInner}>
                        <Text style={[styles.tabButtonClassicIcon, !isHubActive && tab === item.id && styles.tabButtonClassicIconActive]}>{TAB_SIGILS[item.id]}</Text>
                        <Text style={[styles.tabButtonClassicText, !isHubActive && tab === item.id && styles.tabButtonClassicTextActive]}>{item.label}</Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
            </View>

            {!isHubActive && isPhone && visibleSections.length > 1 ? (
              <View style={styles.mobileTopSectionRail}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileTopSectionRailContent}>
                    {visibleSections.map((item) => (
                      <Pressable key={item.id} onPress={() => setActiveSection(tab, item.id)} style={[styles.mobileTopSectionChip, activeSectionId === item.id && styles.mobileTopSectionChipActive]}>
                        <View style={styles.mobileTopSectionInner}>
                          <Text style={[styles.mobileTopSectionIcon, activeSectionId === item.id && styles.mobileTopSectionIconActive]}>{TAB_SIGILS[item.id] || "•"}</Text>
                          <Text style={[styles.mobileTopSectionText, activeSectionId === item.id && styles.mobileTopSectionTextActive]}>{item.label}</Text>
                        </View>
                      </Pressable>
                    ))}
                  </ScrollView>
              </View>
            ) : null}

            <View style={[styles.mainBoard, isCompact && styles.mainBoardCompact]}>
              {isPhone || isHubActive || visibleSections.length <= 1 ? null : (
                <View style={[styles.leftRail, isCompact && styles.railCompact]}>
                  <Text style={styles.railHeading}>Menu</Text>
                  {visibleSections.map((item) => (
                    <Pressable key={item.id} onPress={() => setActiveSection(tab, item.id)} style={[styles.railLink, activeSectionId === item.id && styles.railLinkActive]}>
                      <Text style={[styles.railLinkText, activeSectionId === item.id && styles.railLinkTextActive]}>{item.label}</Text>
                    </Pressable>
                  ))}
                  <Pressable onPress={() => setActiveSection("profile", "tasks")} style={styles.cashButtonFrame}>
                    <Text style={styles.cashButtonText}>Zadania</Text>
                  </Pressable>
                </View>
              )}

              <View style={[styles.centerStage, isPhone && styles.centerStagePhone]}>
                {isPhone ? (
                  <></>
                ) : null}
                <View style={styles.contentHeaderBar}>
                  <Text style={styles.contentHeaderLabel}>{isHubActive ? "Start" : activeSection.title}</Text>
                  <Text style={styles.contentHeaderSub}>{isHubActive ? "Hub gry" : "Hustle City"}</Text>
                </View>
                {activeSectionContent}
              </View>

              {isPhone ? null : (
                <View style={[styles.rightRail, isCompact && styles.railCompact]}>
                  <Pressable onPress={() => setIsHubActive(true)} style={styles.sidebarCard}>
                    <Text style={styles.sidebarTitle}>Hub</Text>
                    <Text style={styles.sidebarText}>Wroc do glownego wejscia gry.</Text>
                    <Text style={styles.sidebarTinyText}>Najwazniejsze systemy sa zebrane w jednym miejscu.</Text>
                  </Pressable>

                  <Pressable onPress={() => setActiveSection("profile", "tasks")} style={styles.sidebarCard}>
                    <Text style={styles.sidebarTitle}>Aktywna misja</Text>
                    <Text style={styles.sidebarText}>{topTask?.title || "Brak aktywnej misji"}</Text>
                    <Text style={styles.sidebarTinyText}>{topTask?.description || "Wskocz do misji i odbierz nagrody."}</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
      <QuickActionModal
        visible={Boolean(quickActionModal)}
        title={quickActionModalTitles[quickActionModal] || "Szybka akcja"}
        onClose={closeQuickAction}
      >
        {renderQuickActionContent()}
      </QuickActionModal>
      <ResultModal
        visible={Boolean(notice && isPhone && (!quickActionModal || notice?.allowWhileQuickAction))}
        tone={notice?.tone === "failure" ? "failure" : notice?.tone === "success" ? "success" : "warning"}
        title={notice?.title || "INFO"}
        message={notice?.message || ""}
        onClose={() => setNotice(null)}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AppStartupBoundary>
      <AppRuntime />
    </AppStartupBoundary>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#000000" },
  loadingScreen: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, backgroundColor: "#050608" },
  loadingTitle: { color: "#f4efe8", fontSize: 34, fontWeight: "900", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1.4 },
  loadingText: { color: "#a9b0bc", fontSize: 14, lineHeight: 22, textAlign: "center", maxWidth: 420 },
  loadingDetails: { color: "#ffb38d", fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 14, maxWidth: 460 },
  pageScroll: { paddingVertical: 10, paddingBottom: 26, backgroundColor: "#000000" },
  pageScrollPhone: { paddingBottom: 26 },
  pageBackdrop: { position: "relative", paddingHorizontal: 6 },
  ambientGlowOne: { position: "absolute", left: 40, top: 0, width: 260, height: 260, borderRadius: 200, opacity: 0.3 },
  ambientGlowTwo: { position: "absolute", right: 30, top: 120, width: 340, height: 340, borderRadius: 240, opacity: 0.18 },
  gameShell: {
    width: "100%",
    maxWidth: 1160,
    alignSelf: "center",
    backgroundColor: "#050505",
    borderWidth: 1,
    borderColor: "#272727",
    shadowColor: "#000000",
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 20 },
    elevation: 20,
  },
  topStrip: { minHeight: 126, borderBottomWidth: 1, borderBottomColor: "#343434", overflow: "hidden" },
  topStripVisual: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0 },
  topStripVisualImage: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0 },
  topStripVisualImageInner: { opacity: 0.8 },
  topStripVisualScrim: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0 },
  topStripPhotoLarge: {
    position: "absolute",
    left: 14,
    top: -10,
    width: 240,
    height: 160,
    backgroundColor: "rgba(255,255,255,0.09)",
    transform: [{ rotate: "-5deg" }],
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  topStripPhotoSmall: {
    position: "absolute",
    right: 120,
    top: 18,
    width: 140,
    height: 80,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  topStripContent: { flexDirection: "row", justifyContent: "space-between", gap: 18, paddingHorizontal: 14, paddingVertical: 10, alignItems: "flex-start" },
  topStripContentPhone: { flexDirection: "column", gap: 10, paddingTop: 8, paddingBottom: 8 },
  topStripProfile: { flexDirection: "row", gap: 10, alignItems: "flex-start", width: "32%" },
  topStripProfilePhone: { width: "100%" },
  profileShot: { width: 64, height: 78, borderWidth: 1, borderColor: "#7a7a7a", justifyContent: "space-between", padding: 6 },
  profileShotImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
  profileShotScrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: "45%", backgroundColor: "rgba(0,0,0,0.42)" },
  profileShotSigil: { color: "#f5f1e8", fontSize: 24, fontWeight: "900", letterSpacing: 1.5 },
  profileShotLevel: { color: "#f1c24b", fontSize: 11, fontWeight: "800" },
  profileMeta: { gap: 3, paddingTop: 4 },
  playerAlias: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
  playerRank: { color: "#bcbcbc", fontSize: 12 },
  playerSmall: { color: "#b5912d", fontSize: 11 },
  statCluster: { flexDirection: "row", gap: 14, flex: 1, justifyContent: "flex-end" },
  statClusterPhone: { width: "100%", justifyContent: "flex-start", flexWrap: "wrap", gap: 10 },
  statColumn: { gap: 6, width: 84 },
  statColumnWide: { gap: 6, width: 112 },
  headerStat: { gap: 2 },
  headerStatLabel: { color: "#d0b34d", fontSize: 10, textTransform: "uppercase" },
  headerStatValue: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
  topStatLabel: { color: "#d0b34d", fontSize: 10, textTransform: "uppercase" },
  topStatValue: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
  mastheadPanel: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#3c3125",
    backgroundColor: "#060606",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  mastheadImage: {
    minHeight: 252,
    borderWidth: 1,
    borderColor: "#4f3a24",
    backgroundColor: "#090909",
    overflow: "hidden",
  },
  mastheadImagePhone: { minHeight: 228 },
  mastheadImageInner: { resizeMode: "cover" },
  mastheadImageInnerPhone: { resizeMode: "contain" },
  mastheadOverlay: { minHeight: 252, justifyContent: "flex-end" },
  mastheadHeroCopy: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 18, gap: 8, maxWidth: 560 },
  mastheadEyebrow: { color: "#f4c86a", fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.4 },
  mastheadHeroTitle: { color: "#fff6ea", fontSize: 26, fontWeight: "900", lineHeight: 30, maxWidth: 440 },
  mastheadHeroText: { color: "#d8cab5", fontSize: 13, lineHeight: 18, maxWidth: 380 },
  mastheadHeroTags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 2 },
  noticeBanner: { marginTop: 10, marginHorizontal: 18, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 6, overflow: "hidden" },
  noticeBannerSuccess: { backgroundColor: "rgba(14,44,28,0.94)", borderColor: "#38b46a" },
  noticeBannerFailure: { backgroundColor: "rgba(70,18,24,0.94)", borderColor: "#d25861" },
  noticeBannerWarning: { backgroundColor: "rgba(74,52,16,0.94)", borderColor: "#d3a13d" },
  noticeTitle: { color: "#fff3db", fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.1 },
  noticeText: { color: "#f4efe8", fontSize: 13, lineHeight: 18 },
  noticeDeltaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  noticeDeltaChip: { paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderRadius: 999 },
  noticeDeltaChipPositive: { backgroundColor: "rgba(28,90,52,0.3)", borderColor: "rgba(78,209,124,0.48)" },
  noticeDeltaChipNegative: { backgroundColor: "rgba(112,36,46,0.28)", borderColor: "rgba(218,105,122,0.5)" },
  noticeDeltaChipWarning: { backgroundColor: "rgba(115,83,22,0.28)", borderColor: "rgba(227,182,77,0.48)" },
  noticeDeltaText: { color: "#f7f2ea", fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },
  tabBarShell: { flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#292c33", backgroundColor: "#07080b" },
  tabBarClassic: { flex: 1, backgroundColor: "#07080b", maxHeight: 70 },
  tabBarClassicContent: { paddingHorizontal: 10, paddingVertical: 10, gap: 10, alignItems: "center" },
  tabButtonClassic: { minWidth: 108, height: 50, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", borderRadius: 18, borderWidth: 1, borderColor: "#2f333b", backgroundColor: "#101216" },
  tabButtonClassicActive: { borderColor: "#c7902e", backgroundColor: "#17140f" },
  tabButtonHub: { marginLeft: 8 },
  tabButtonClassicInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  tabButtonClassicIcon: { color: "#949bab", fontSize: 16, fontWeight: "900" },
  tabButtonClassicIconActive: { color: "#f0c24d" },
  tabButtonClassicText: { color: "#c8ccd6", fontSize: 12, fontWeight: "800" },
  tabButtonClassicTextActive: { color: "#f0c24d" },
  mainBoard: { flexDirection: "row", alignItems: "flex-start" },
  mainBoardCompact: { flexDirection: "column" },
  leftRail: { width: 124, padding: 10, backgroundColor: "#080808", borderRightWidth: 1, borderColor: "#1e1e1e", minHeight: 980 },
  rightRail: { width: 156, padding: 10, backgroundColor: "#080808", borderLeftWidth: 1, borderColor: "#1e1e1e", minHeight: 980, gap: 10 },
  railCompact: { width: "100%", minHeight: 0, borderLeftWidth: 0, borderRightWidth: 0, borderTopWidth: 1 },
  railPhone: { paddingHorizontal: 8 },
  railHeading: { color: "#9a9a9a", fontSize: 11, textTransform: "uppercase", marginBottom: 10, letterSpacing: 1 },
  railLink: { borderRadius: 14, borderWidth: 1, borderColor: "transparent", paddingVertical: 8, paddingHorizontal: 10, marginBottom: 6, backgroundColor: "transparent" },
  railLinkActive: { backgroundColor: "#14171d", borderColor: "#4a3b24" },
  railLinkText: { color: "#b9bec8", fontSize: 11, fontWeight: "700" },
  railLinkTextActive: { color: "#f4d37e", fontWeight: "800" },
  cashButtonFrame: { marginTop: 14, borderWidth: 1, borderColor: "#6b6b6b", paddingVertical: 18, paddingHorizontal: 10, alignItems: "center", backgroundColor: "#111111" },
  cashButtonText: { color: "#ffffff", fontWeight: "800", fontSize: 12, textTransform: "uppercase" },
  centerStage: { flex: 1, minHeight: 980, padding: 8, backgroundColor: "#030303" },
  centerStagePhone: { minHeight: 0, padding: 10, backgroundColor: "#050505" },
  contentHeaderBar: { minHeight: 42, backgroundColor: "#0a0c10", borderWidth: 1, borderColor: "#242831", marginBottom: 12, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 18 },
  contentHeaderLabel: { color: "#f0ece5", fontSize: 19, fontWeight: "900" },
  contentHeaderSub: { color: "#7d8594", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 },
  sectionCard: { backgroundColor: "rgba(11,12,16,0.98)", borderRadius: 24, padding: 16, borderWidth: 1, borderColor: "#23262d", marginBottom: 12, overflow: "hidden" },
  sectionHeader: { marginBottom: 14, gap: 6 },
  sectionHeaderAccent: { width: 42, height: 4, borderRadius: 999, backgroundColor: "#c7902e" },
  sectionTitle: { color: "#f3efe7", fontSize: 19, fontWeight: "900" },
  sectionSubtitle: { color: "#9ea5b2", fontSize: 12, lineHeight: 18 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  quickActionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  quickActionCard: { width: "31%", minWidth: 92, flexGrow: 1, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 16, backgroundColor: "#121315", borderWidth: 1, borderColor: "#2d2f36", alignItems: "center", gap: 8 },
  quickActionIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#1c1d22", borderWidth: 1, borderColor: "#3a3c44", alignItems: "center", justifyContent: "center" },
  quickActionIconText: { color: "#f0c24d", fontSize: 11, fontWeight: "900", letterSpacing: 0.7 },
  quickActionTitle: { color: "#f4efe8", fontSize: 12, fontWeight: "800", textAlign: "center" },
  actionTile: { flexBasis: 220, flexGrow: 1, width: undefined, maxWidth: "100%", minWidth: 0, minHeight: 118, borderRadius: 22, borderWidth: 1, borderColor: "#2a2e37", overflow: "hidden" },
  actionTileDanger: { borderColor: "#6a2b31" },
  actionTilePressed: { transform: [{ scale: 0.985 }] },
  tileDisabled: { opacity: 0.45 },
  actionTileGradient: { flex: 1, padding: 14, justifyContent: "space-between" },
  actionTileHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  actionTileVisualWrap: { position: "relative" },
  actionTileVisualGlow: { position: "absolute", width: 50, height: 50, borderRadius: 999, backgroundColor: "rgba(240,194,77,0.12)", left: 4, top: 4 },
  actionTileTitle: { color: "#f4efe8", fontSize: 16, fontWeight: "900", marginBottom: 6 },
  actionTileSubtitle: { color: "#b4ac9f", fontSize: 12, lineHeight: 18 },
  statLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "#1a1d24", gap: 12 },
  statLineLabelWrap: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  statLineLabel: { color: "#a6adba", fontSize: 13, flex: 1 },
  statLineValue: { color: "#f4efe8", fontSize: 13, fontWeight: "800", maxWidth: "58%", flexShrink: 1, textAlign: "right" },
  progressBar: { height: 8, borderRadius: 999, backgroundColor: "#1e1e20", overflow: "hidden", marginTop: 6 },
  progressFill: { height: "100%", backgroundColor: "#c49539" },
  dotRow: { flexDirection: "row", gap: 6, marginTop: 8 },
  progressDot: { width: 10, height: 10, borderRadius: 99, backgroundColor: "#2d2d30" },
  progressDotActive: { backgroundColor: "#d5a045" },
  logEntry: { paddingVertical: 10, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: "#d6a04f", marginBottom: 8, backgroundColor: "#111111", borderRadius: 2 },
  logText: { color: "#ddd8d0", lineHeight: 19, fontSize: 12 },
  listCard: { padding: 13, borderRadius: 20, backgroundColor: "#12141a", borderWidth: 1, borderColor: "#252a33", marginBottom: 10 },
  districtCard: { padding: 10, borderRadius: 18, backgroundColor: "#171a22", borderWidth: 1, borderColor: "#2d333d", marginTop: 10 },
  listCardLocked: { opacity: 0.55 },
  listCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  entityHead: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  miniBadge: { width: 28, height: 28, borderRadius: 9, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", backgroundColor: "#0d0f12" },
  miniBadgeLarge: { width: 34, height: 34, borderRadius: 11 },
  miniBadgeImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
  miniBadgeTint: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  miniBadgeEmoji: { color: "#f3efe7", fontSize: 14, fontWeight: "900" },
  entityBadge: { width: 58, height: 58, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", backgroundColor: "#0d0f12" },
  entityBadgeLarge: { width: 74, height: 74, borderRadius: 20 },
  entityBadgeGlow: { position: "absolute", width: "130%", height: "58%", top: -10, left: -8, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.08)" },
  entityImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
  entityAvatarImage: { top: 4, left: 4, right: 4, bottom: 4, width: undefined, height: undefined },
  entityImageTint: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  entityEmojiWrap: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.18)" },
  entityEmoji: { fontSize: 24 },
  entityEmojiLarge: { fontSize: 32 },
  entityCodePill: { position: "absolute", bottom: 6, right: 6, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.72)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  entityCode: { color: "#f4efe8", fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  listCardTitle: { color: "#f3eee7", fontSize: 15, fontWeight: "900", marginBottom: 4 },
  listCardMeta: { color: "#9ca4b2", fontSize: 12, lineHeight: 18 },
  listCardReward: { color: "#d6a04f", fontSize: 13, fontWeight: "900", maxWidth: "100%", flexShrink: 1, textAlign: "right" },
  listActionsRow: { flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 12 },
  playerRosterCard: { paddingVertical: 10 },
  playerRosterHeader: { marginBottom: 8, alignItems: "center" },
  playerRosterStats: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  playerRosterStat: {
    flexGrow: 1,
    minWidth: 82,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#27282d",
    backgroundColor: "#101114",
  },
  playerRosterStatLabel: {
    color: "#948a7d",
    fontSize: 10,
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.7,
  },
  playerRosterStatValue: { color: "#f4d37e", fontSize: 14, fontWeight: "800" },
  planChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  planChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: "#3a2a21", backgroundColor: "#151110" },
  planChipActive: { borderColor: "#c49539", backgroundColor: "#21170f" },
  planChipText: { color: "#bcae9a", fontSize: 12, fontWeight: "700" },
  planChipTextActive: { color: "#f4d37e" },
  oddsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  oddsBlock: { flex: 1, minWidth: 132, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: "#27282d", backgroundColor: "#101114" },
  oddsLabel: { color: "#948a7d", fontSize: 11, textTransform: "uppercase", marginBottom: 4, letterSpacing: 0.8 },
  oddsValue: { color: "#f4d37e", fontSize: 18, fontWeight: "800" },
  inlineButton: { alignSelf: "flex-start", paddingVertical: 11, paddingHorizontal: 14, borderRadius: 16, backgroundColor: "#151821", borderWidth: 1, borderColor: "#333746" },
  inlineButtonText: { color: "#f6efe6", fontWeight: "800", fontSize: 13 },
  inlineButtonDanger: { backgroundColor: "#221316", borderColor: "#8a3438" },
  inlineButtonDangerText: { color: "#ffb8be" },
  inlineRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 },
  gymBatchControls: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12, marginBottom: 10 },
  gymBatchAdjustButton: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#17181d", borderWidth: 1, borderColor: "#30313a" },
  gymBatchAdjustText: { color: "#f4efe8", fontSize: 18, fontWeight: "900" },
  gymBatchTrack: { flex: 1, flexDirection: "row", gap: 6, flexWrap: "wrap" },
  gymBatchStep: { minWidth: 28, height: 30, paddingHorizontal: 8, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: "#111214", borderWidth: 1, borderColor: "#2f3034" },
  gymBatchStepActive: { backgroundColor: "#1f1712", borderColor: "#c49539" },
  gymBatchStepText: { color: "#91887c", fontSize: 11, fontWeight: "800" },
  gymBatchStepTextActive: { color: "#f4d37e" },
  gymBatchMeta: { color: "#c2b8a9", fontSize: 12, fontWeight: "700", flex: 1 },
  messageComposerInput: { minHeight: 130, borderWidth: 1, borderColor: "#2f3034", backgroundColor: "#111214", color: "#f1f1f1", paddingHorizontal: 12, paddingVertical: 12, borderRadius: 14, marginTop: 12 },
  messageComposerMeta: { color: "#988f84", fontSize: 11, textAlign: "right", marginTop: 8 },
  costLabel: { color: "#c2b8a9", fontWeight: "700", flexShrink: 1 },
  marketRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#1f2024" },
  marketInfo: { marginBottom: 8 },
  marketTitle: { color: "#f4efe8", fontSize: 16, fontWeight: "800", marginBottom: 4 },
  marketMeta: { color: "#988f84", fontSize: 13 },
  marketPrices: { flexDirection: "row", gap: 14, marginBottom: 10, flexWrap: "wrap" },
  marketPrice: { color: "#d6a04f", fontWeight: "700" },
  marketButtons: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  marketButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 2, backgroundColor: "#17181d", borderWidth: 1, borderColor: "#30313a" },
  marketButtonText: { color: "#f4efe8", fontWeight: "700" },
  sidebarCard: { backgroundColor: "#111111", borderWidth: 1, borderColor: "#313131", padding: 10 },
  sidebarCardTall: { backgroundColor: "#101010", borderWidth: 1, borderColor: "#313131", padding: 12, alignItems: "center", justifyContent: "center", minHeight: 146 },
  sidebarTitle: { color: "#d0d0d0", fontWeight: "800", fontSize: 16, marginBottom: 8 },
  sidebarText: { color: "#f0c24d", fontSize: 12, lineHeight: 18, marginBottom: 6 },
  sidebarTinyText: { color: "#9f9f9f", fontSize: 11, lineHeight: 16 },
  sidebarTiny: { color: "#9d9d9d", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  sidebarOnline: { color: "#f1f1f1", fontSize: 24, fontWeight: "800", marginBottom: 8 },
  sidebarNumberSmall: { color: "#ffffff", fontSize: 20, fontWeight: "800", lineHeight: 22, marginBottom: 8 },
  mobileTopSectionRail: { borderBottomWidth: 1, borderBottomColor: "#24262c", backgroundColor: "#090a0d", paddingVertical: 8, paddingHorizontal: 8 },
  mobileTopSectionRailContent: { gap: 8, paddingRight: 4 },
  mobileTopSectionChip: { minHeight: 44, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: "#2e323a", backgroundColor: "#111318", alignItems: "center", justifyContent: "center" },
  mobileTopSectionChipActive: { borderColor: "#c7902e", backgroundColor: "#17140f" },
  mobileTopSectionInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  mobileTopSectionIcon: { color: "#9098a7", fontSize: 14, fontWeight: "900" },
  mobileTopSectionIconActive: { color: "#f0c24d" },
  mobileTopSectionText: { color: "#c8ccd6", fontSize: 11, fontWeight: "800" },
  mobileTopSectionTextActive: { color: "#f0c24d" },
  mobileHudRail: { borderBottomWidth: 1, borderBottomColor: "#1f2126", backgroundColor: "#0b0c10", paddingVertical: 8 },
  mobileHudRailContent: { gap: 8, paddingHorizontal: 8, paddingRight: 14 },
  mobileHudCard: { minWidth: 100, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 16, borderWidth: 1, backgroundColor: "#121317", borderColor: "#2a2c33" },
  mobileHudCardCash: { backgroundColor: "#14120d", borderColor: "#6f5527" },
  mobileHudCardEnergy: { backgroundColor: "#10151a", borderColor: "#32516f" },
  mobileHudCardHp: { backgroundColor: "#14110f", borderColor: "#6f4032" },
  mobileHudCardHeat: { backgroundColor: "#18110f", borderColor: "#875034" },
  mobileHudCardRespect: { backgroundColor: "#13110d", borderColor: "#81662e" },
  mobileHudCardLabel: { color: "#8e9299", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.9, marginBottom: 4 },
  mobileHudCardValue: { color: "#f4efe8", fontSize: 15, fontWeight: "800" },
  mobileHudMissionCard: { minWidth: 180, maxWidth: 220, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: "#604327", backgroundColor: "#16110d", justifyContent: "center" },
  mobileHudMissionLabel: { color: "#aa8952", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  mobileHudMissionTitle: { color: "#fff1dd", fontSize: 13, fontWeight: "800" },
  mobileBottomDock: { marginTop: 10, gap: 8 },
  mobileHudToggle: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16, backgroundColor: "#101114", borderWidth: 1, borderColor: "#292c33", gap: 4 },
  mobileHudToggleActive: { borderColor: "#7d5f2d", backgroundColor: "#14120e" },
  mobileHudToggleTitle: { color: "#f1efe9", fontSize: 13, fontWeight: "800" },
  mobileHudToggleMeta: { color: "#9e9588", fontSize: 11 },
  mobileQuickBoard: { gap: 10, marginBottom: 10 },
  mobileTaskCard: { padding: 14, borderWidth: 1, borderColor: "#3b2f25", backgroundColor: "#120f0d", borderRadius: 18 },
  mobileTaskEyebrow: { color: "#a98a59", fontSize: 10, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4 },
  mobileTaskTitle: { color: "#fff1dd", fontSize: 18, fontWeight: "900", marginBottom: 6 },
  mobileTaskText: { color: "#d5c4ab", fontSize: 12, lineHeight: 17 },
  mobileStatusGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mobileStatusCard: { flexBasis: 160, flexGrow: 1, width: undefined, maxWidth: "100%", minWidth: 0, minHeight: 74, padding: 12, borderRadius: 16, backgroundColor: "#101114", borderWidth: 1, borderColor: "#292c33" },
  mobileStatusLabel: { color: "#8d9199", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  mobileStatusValue: { color: "#f5efe6", fontSize: 15, fontWeight: "800" },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, alignSelf: "flex-start", borderWidth: 1 },
  tagPositive: { backgroundColor: "rgba(44,97,67,0.18)", borderColor: "rgba(84,182,126,0.32)" },
  tagWarning: { backgroundColor: "rgba(113,51,40,0.18)", borderColor: "rgba(208,109,88,0.32)" },
  tagText: { fontSize: 11, fontWeight: "800" },
  tagTextPositive: { color: "#d8f6e4" },
  tagTextWarning: { color: "#ffd6cb" },
  choiceRow: { flexDirection: "row", gap: 8, alignItems: "center", flexWrap: "wrap" },
  choiceChip: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "#3c1717", borderWidth: 1, borderColor: "#6c2d2d" },
  choiceChipActive: { backgroundColor: "#8c2424" },
  choiceChipGreen: { backgroundColor: "#17381f", borderColor: "#355c3a" },
  choiceChipText: { color: "#ffffff", fontWeight: "700" },
  casinoHero: { alignItems: "center", paddingVertical: 22, marginBottom: 12, backgroundColor: "#101112", borderWidth: 1, borderColor: "#252628" },
  casinoNumber: { color: "#f4d37e", fontSize: 54, fontWeight: "900", marginBottom: 8 },
  casinoMeta: { color: "#cfc3ab", fontSize: 12 },
  historyRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 12 },
  historyChip: { paddingHorizontal: 10, paddingVertical: 8, backgroundColor: "#17181a", borderWidth: 1, borderColor: "#2f3034" },
  historyChipRed: { backgroundColor: "#441718", borderColor: "#8c2424" },
  historyChipBlack: { backgroundColor: "#121315", borderColor: "#4f5258" },
  historyChipGreen: { backgroundColor: "#17381f", borderColor: "#3e7b4a" },
  historyChipText: { color: "#f0ede7", fontWeight: "700" },
  chatComposer: { flexDirection: "row", gap: 10, marginBottom: 12, alignItems: "center", flexWrap: "wrap" },
  chatInput: { flex: 1, minWidth: 180, minHeight: 46, borderWidth: 1, borderColor: "#2f3034", backgroundColor: "#111214", color: "#f1f1f1", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14 },
  chatBubble: { padding: 12, backgroundColor: "#111111", borderWidth: 1, borderColor: "#26282b", marginBottom: 8 },
  chatAuthor: { color: "#f0c24d", fontWeight: "800", marginBottom: 4 },
  chatTime: { color: "#999999", fontWeight: "400" },
  chatText: { color: "#dbd5ca", lineHeight: 18 },
  prisonChatWrap: { marginTop: 14 },
  lockedPanel: { marginTop: 12, padding: 14, borderWidth: 1, borderColor: "#2c2e31", backgroundColor: "#121314", borderRadius: 18 },
  lockedPanelText: { color: "#a7a097", lineHeight: 18 },
  heroBanner: { padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#3c2c1d", backgroundColor: "#1a130d", borderRadius: 18 },
  sceneArtwork: { minHeight: 138, marginBottom: 12, borderWidth: 1, borderColor: "#34271f", overflow: "hidden", justifyContent: "flex-end", borderRadius: 18 },
  sceneArtworkBackdrop: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0 },
  sceneArtworkImage: { opacity: 0.92 },
  sceneArtworkTint: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0 },
  sceneCopy: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, gap: 3 },
  sceneEyebrow: { color: "#f0c24d", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.2 },
  sceneTitle: { color: "#f4efe8", fontSize: 20, fontWeight: "900" },
  sceneLine: { color: "#c7baaa", lineHeight: 16, fontSize: 12, maxWidth: "68%" },
  heroBannerTitle: { color: "#f4d37e", fontSize: 20, fontWeight: "900", marginBottom: 6 },
  heroBannerText: { color: "#d8cab5", lineHeight: 18 },
  mobileOverviewGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  mobileOverviewCard: { flexBasis: 160, flexGrow: 1, width: undefined, maxWidth: "100%", minWidth: 0, minHeight: 74, padding: 12, borderRadius: 16, backgroundColor: "#15161a", borderWidth: 1, borderColor: "#2d3037" },
  mobileOverviewLabel: { color: "#8e929a", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  mobileOverviewValue: { color: "#f4efe8", fontSize: 16, fontWeight: "800" },
  mobileOverviewValueSmall: { color: "#f4efe8", fontSize: 13, fontWeight: "800", lineHeight: 18 },
  playerProfilePanel: { gap: 12 },
  playerProfileMain: { flexDirection: "row", gap: 12, alignItems: "stretch", flexWrap: "wrap" },
  playerProfileHero: { flexBasis: 280, flexGrow: 1, width: undefined, maxWidth: "100%", minWidth: 0, minHeight: 220, borderWidth: 1, borderColor: "#5a4123", padding: 16, justifyContent: "space-between" },
  playerProfileMeta: { gap: 5, marginTop: 14 },
  playerProfileName: { color: "#fff7ea", fontSize: 30, fontWeight: "900" },
  playerProfileGang: { color: "#f2c35a", fontSize: 15, fontWeight: "700" },
  playerProfileStatus: { color: "#d6c4aa", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8 },
  mutedLink: { opacity: 0.5 },
  playerStatsBoard: { flex: 1, minWidth: 280, borderWidth: 1, borderColor: "#2f2a24", backgroundColor: "#0f1012", paddingHorizontal: 14, paddingVertical: 8 },
  playerProfileActions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  avatarPanel: { gap: 12, marginBottom: 10 },
  avatarHero: { minHeight: 148, borderWidth: 1, borderColor: "#373737", padding: 14, justifyContent: "flex-end", overflow: "hidden" },
  avatarHeroImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
  avatarHeroOverlay: { position: "absolute", left: 0, right: 0, bottom: 0, height: "45%", backgroundColor: "rgba(0,0,0,0.45)" },
  avatarHeroSigil: { color: "#f6f1e8", fontSize: 34, fontWeight: "900", letterSpacing: 2 },
  avatarHeroName: { color: "#f0c24d", fontSize: 18, fontWeight: "800" },
  avatarPickerButton: { alignSelf: "flex-start", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: "#1a1c21", borderWidth: 1, borderColor: "#3a3d45" },
  avatarPickerButtonText: { color: "#f3efe7", fontSize: 12, fontWeight: "800" },
  avatarGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  avatarChoice: { width: 94, padding: 6, borderWidth: 1, borderColor: "#2f3034", backgroundColor: "#111214", alignItems: "center", gap: 6 },
  avatarChoiceActive: { borderColor: "#d6a04f", backgroundColor: "#19140f" },
  avatarChoiceArt: { width: "100%", height: 82, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarChoiceImage: { width: "100%", height: "100%" },
  avatarChoiceSigil: { color: "#f4efe8", fontSize: 22, fontWeight: "900", letterSpacing: 1.4 },
  avatarChoiceText: { color: "#dfd7cc", fontSize: 12, fontWeight: "700" },
  betInput: { minWidth: 92, minHeight: 42, borderWidth: 1, borderColor: "#5b3529", backgroundColor: "#120f0d", color: "#f4efe8", paddingHorizontal: 12, paddingVertical: 8, textAlign: "center" },
  betPanel: { flexBasis: 160, flexGrow: 1, width: undefined, maxWidth: "100%", minWidth: 0, padding: 12, borderWidth: 1, borderColor: "#2d2d31", backgroundColor: "#101114" },
  betPanelLabel: { color: "#a89d8f", fontSize: 12, marginBottom: 8, textTransform: "uppercase" },
  rouletteWheel: { width: 168, height: 168, borderRadius: 999, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  rouletteRingOuter: { position: "absolute", width: 168, height: 168, borderRadius: 999, borderWidth: 16, borderTopColor: "#8c2424", borderRightColor: "#111111", borderBottomColor: "#8c2424", borderLeftColor: "#174c20" },
  rouletteRingInner: { width: 100, height: 100, borderRadius: 999, backgroundColor: "#111111", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#4e4e4e" },
  rouletteNeedle: { position: "absolute", top: -6, width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 24, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: "#f4d37e" },
  blackjackBoard: { flexDirection: "row", gap: 12, marginBottom: 14, flexWrap: "wrap" },
  blackjackColumn: { flex: 1, minWidth: 220, padding: 12, borderWidth: 1, borderColor: "#2d2f33", backgroundColor: "#0f1012" },
  blackjackLabel: { color: "#f4d37e", fontWeight: "800", marginBottom: 8 },
  blackjackTotal: { color: "#f1efe8", fontWeight: "700", marginTop: 10 },
  cardFan: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  playingCard: { width: 68, height: 96, borderRadius: 8, backgroundColor: "#f7f1e7", borderWidth: 1, borderColor: "#d6cbb8", padding: 8, justifyContent: "space-between", shadowColor: "#000000", shadowOpacity: 0.25, shadowOffset: { width: 0, height: 6 }, shadowRadius: 8, elevation: 4 },
  playingCardBack: { backgroundColor: "#5b3529", borderColor: "#8d6747", alignItems: "center", justifyContent: "center" },
  playingCardBackText: { color: "#f4d37e", fontWeight: "900", fontSize: 18 },
  playingCardRank: { color: "#1f1f1f", fontWeight: "900", fontSize: 22 },
  playingCardSuit: { color: "#8c2424", fontSize: 22, textAlign: "center" },
  playingCardValue: { color: "#1f1f1f", fontSize: 12, textAlign: "right", fontWeight: "700" },
  emptyText: { color: "#9a9187", fontSize: 13 },
  taskMeta: { gap: 6, alignItems: "flex-end" },
  flexOne: { flex: 1 },
  alignEnd: { alignItems: "flex-end", justifyContent: "center", gap: 6 },
});




