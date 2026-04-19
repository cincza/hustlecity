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
  claimClubOnline,
  claimGangGoalOnline,
  claimTaskOnline,
  collectBusinessIncomeOnline,
  collectEscortIncomeOnline,
  contributeGangOnline,
  consumeDrugOnline,
  createGangOnline,
  deleteGangOnline,
  attackPlayerOnline,
  depositOnline,
  executeOperationPlanOnline,
  executeHeistOnline,
  executeGangHeistOnline,
  fetchFriendListOnline,
  fetchCasinoMeta,
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
  loginUser,
  investGangProjectOnline,
  invitePlayerToGangOnline,
  joinGangOnline,
  leaveGangOnline,
  placeBountyOnline,
  playHighRiskOnline,
  playFightClubRoundOnline,
  performClubActionOnline,
  playSlotOnline,
  previewClubPvpOnline,
  registerUser,
  consumeClubDrugOnline,
  moveDrugToClubOnline,
  produceDrugOnline,
  pullEscortFromStreetOnline,
  runClubNightOnline,
  sellEscortOnline,
  sellDrugToDealerOnline,
  sellProductOnline,
  sendGlobalChatMessageOnline,
  sendDirectMessageOnline,
  setClubPlanOnline,
  setGangFocusOnline,
  updateGangSettingsOnline,
  startOperationOnline,
  startBlackjackOnline,
  standBlackjackOnline,
  sendPrisonChatMessageOnline,
  trainAtGymOnline,
  upgradeBusinessOnline,
  updateAvatarOnline,
  visitClubOnline,
  withdrawOnline,
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
import { GameHeader, QuickActionModal, ResultModal } from "./src/components/GameShellUI";
import { BUSINESSES } from "./src/game/config/businesses";
import { blockIfOnlineAlpha } from "./src/game/authority";
import { getGameMode } from "./src/game/modes";
import { getNextHeistTier } from "./src/game/config/heistTiers";
import { getBusinessIncomePerMinute, getBusinessUpgradeCost, getBusinessUpgradePreview, getBusinessUpgradeState } from "./src/game/selectors/businessSelectors";
import {
  FACTORIES,
  SUPPLIERS,
  createSupplyCounterMap,
  getDrugPoliceProfile as getSharedDrugPoliceProfile,
  normalizeBusinessCollections,
  normalizeBusinessUpgrades,
  normalizeBusinessesOwned,
  normalizeFactoriesOwned,
  normalizeSupplies,
} from "./shared/empire.js";
import { applyXpProgression } from "./shared/progression.js";
import {
  canRunGangHeistRole,
  GANG_HEISTS,
  getGangHeistBonusRate,
  getGangHeistOdds,
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
  getGangProjectCost,
  getGangProjectEffects,
  getGangProjectLevel,
  getGangWeeklyProgress,
  GANG_PROJECTS,
  normalizeGangState,
} from "./shared/gangProjects.js";
import { normalizeAdminGrantPresets } from "./shared/admin.js";
import { GYM_EXERCISES, GYM_PASSES, RESTAURANT_ITEMS } from "./shared/playerActions.js";
import {
  createOperationsState,
  getActiveOperationStage,
  getOperationById,
  getOperationChoicesForStage,
  normalizeOperationsState,
  OPERATION_CATALOG,
  OPERATION_STAGE_ORDER,
} from "./shared/operations.js";
import { getTaskStates as getSharedTaskStates } from "./shared/tasks.js";
import {
  CLUB_ESCORT_SEARCH_COST,
  CLUB_NIGHT_PLANS,
  CLUB_SYSTEM_RULES,
  CLUB_VISITOR_ACTIONS,
  CLUB_MARKET,
  DEALER_START_STOCK,
  DRUGS,
  ESCORTS,
  FIGHT_CLUB_ENERGY_COST,
  PLAYER_BOUNTY_COST,
  PLAYER_BOUNTY_INCREMENT,
  createClubGuestState,
  getClubNightPlan,
  getClubPressureAfterDecay,
  getClubPressureLabel,
  getClubTrafficAfterDecay,
  getClubTrafficLabel,
  getClubVenueProfile as getSharedClubVenueProfile,
  getClubVisitDiminishing,
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
const GANG_TRIBUTE_COOLDOWN_MS = 20 * 60 * 1000;
const CLUB_NIGHT_COOLDOWN_MS = 12 * 60 * 1000;
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
  tobacco: { ...SYSTEM_VISUALS.supplier, code: "TYT" },
  grain: { ...SYSTEM_VISUALS.supplier, code: "ZRN" },
  herbs: { ...SYSTEM_VISUALS.supplier, code: "ZIO" },
  chemicals: { ...SYSTEM_VISUALS.supplier, code: "CHM" },
  packaging: { ...SYSTEM_VISUALS.supplier, code: "PAK" },
  glass: { ...SYSTEM_VISUALS.supplier, code: "GLS" },
  solvent: { ...SYSTEM_VISUALS.supplier, code: "SOL" },
  spores: { ...SYSTEM_VISUALS.supplier, code: "SPR" },
  resin: { ...SYSTEM_VISUALS.supplier, code: "RSN" },
  pills: { ...SYSTEM_VISUALS.supplier, code: "PIL" },
  pharma: { ...SYSTEM_VISUALS.supplier, code: "MED" },
  coca: { ...SYSTEM_VISUALS.supplier, code: "COC" },
  poppy: { ...SYSTEM_VISUALS.supplier, code: "POP" },
  acid: { ...SYSTEM_VISUALS.supplier, code: "ACD" },
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

const TAB_DEFINITIONS = [
  {
    id: "city",
    label: "Miasto",
    sections: [
      { id: "dashboard", label: "Miasto", title: "Miasto" },
      { id: "tasks", label: "Misje", title: "Zadania" },
      { id: "bank", label: "Bank", title: "Bank" },
      { id: "gym", label: "Silownia", title: "Silownia" },
      { id: "restaurant", label: "Jedzenie", title: "Restauracja" },
      { id: "hospital", label: "Szpital", title: "Szpital" },
    ],
  },
  { id: "heists", label: "Napady", sections: [{ id: "solo", label: "Solo", title: "Napady" }, { id: "fightclub", label: "Fight", title: "Fightclub" }, { id: "prison", label: "Cela", title: "Wiezienie" }] },
  { id: "empire", label: "Biznes", sections: [{ id: "businesses", label: "Biznesy", title: "Biznesy" }, { id: "factories", label: "Fabryki", title: "Fabryki" }, { id: "suppliers", label: "Dostawy", title: "Hurtownie" }, { id: "club", label: "Klub", title: "Klub" }] },
  { id: "market", label: "Rynek", sections: [{ id: "drugs", label: "Towar", title: "Narkotyki" }, { id: "boosts", label: "Boosty", title: "Boosty" }] },
  { id: "gang", label: "Gang", sections: [{ id: "overview", label: "Gang", title: "Gang" }, { id: "heists", label: "Napady", title: "Napady gangu" }, { id: "members", label: "Sklad", title: "Czlonkowie" }, { id: "chat", label: "Chat", title: "Chat gangu" }, { id: "ops", label: "Akcje", title: "Operacje" }] },
  {
    id: "profile",
    label: "Postac",
    sections: [
      { id: "summary", label: "Profil", title: "Profil" },
      { id: "progress", label: "Ranga", title: "Szacun" },
      { id: "protection", label: "Ochrona", title: "Ochrona" },
      { id: "log", label: "Log", title: "Log wydarzen" },
      { id: "utilities", label: "Narzedzia", title: "Narzedzia", hidden: true },
      { id: "community", label: "Kontakt", title: "Spolecznosc", hidden: true },
      { id: "casino", label: "Kasyno", title: "Kasyno", hidden: true },
      { id: "tasks", label: "Misje", title: "Zadania", hidden: true },
      { id: "bank", label: "Bank", title: "Bank", hidden: true },
      { id: "gym", label: "Silownia", title: "Silownia", hidden: true },
      { id: "restaurant", label: "Jedzenie", title: "Restauracja", hidden: true },
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
    isAdmin: false,
    adminGrantPresets: [],
    adminRespectPresets: [],
  },
  stats: { heistsDone: 0, heistsWon: 0, totalEarned: 0, gangHeistsWon: 0, casinoWins: 0, drugBatches: 0 },
  gang: createGangState(),
  city: createCityState(),
  operations: createOperationsState(),
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
  heists: Number.isFinite(entry?.heists) ? entry.heists : 0,
  casino: Number.isFinite(entry?.casino) ? entry.casino : 0,
});

const normalizeAdminState = (adminState) => ({
  isAdmin: Boolean(adminState?.isAdmin),
  grantPresets: normalizeAdminGrantPresets(adminState?.grantPresets),
  respectPresets: normalizeAdminGrantPresets(adminState?.respectPresets),
});
const normalizePlayerAttackTargetCooldowns = (cooldowns, now = Date.now()) => {
  if (!cooldowns || typeof cooldowns !== "object" || Array.isArray(cooldowns)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(cooldowns)
      .map(([targetUserId, until]) => [String(targetUserId || "").trim(), Math.max(0, Number(until || 0))])
      .filter(([targetUserId, until]) => targetUserId && until > now)
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
      stash: { ...(game.club.stash || {}) },
      districtId: game.club.districtId || null,
      securityLevel: game.club.securityLevel,
      defenseReadiness: game.club.defenseReadiness,
      threatLevel: game.club.threatLevel,
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

function getSoloHeistOdds(player, effectivePlayer, gang, heist) {
  const playerPower = effectivePlayer.attack * 1.25 + effectivePlayer.defense * 0.85 + effectivePlayer.dexterity * 1.5 + player.respect * 0.45;
  const heistDifficulty = heist.respect * 1.75 + heist.energy * 4 + heist.risk * 55;
  const chance = clamp(0.42 + (playerPower - heistDifficulty) / 115 + gang.members * 0.0025 - player.heat * 0.0025, 0.05, 0.92);
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
    <Pressable onPress={onPress} accessibilityState={{ disabled }} style={[styles.actionTile, danger && styles.actionTileDanger, disabled && styles.tileDisabled]}>
      <View style={styles.actionTileHeader}>
        {visual ? <MiniBadge visual={visual} large /> : null}
        <Text style={styles.actionTileTitle}>{title}</Text>
      </View>
      <Text style={styles.actionTileSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function Tag({ text, warning }) {
  return (
    <View style={[styles.tag, warning && styles.tagWarning]}>
      <Text style={styles.tagText}>{text}</Text>
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
  const [bankAmountDraft, setBankAmountDraft] = useState("1000");
  const [dealerTradeDraft, setDealerTradeDraft] = useState("1");
  const [notice, setNotice] = useState(null);
  const [quickActionModal, setQuickActionModal] = useState(null);
  const [adminDeleteBusyLogin, setAdminDeleteBusyLogin] = useState("");
  const [gangSettingsBusy, setGangSettingsBusy] = useState(false);
  const noticeOpacity = useRef(new Animated.Value(0)).current;
  const noticeTranslateY = useRef(new Animated.Value(-12)).current;
  const previousGameRef = useRef(INITIAL);
  const pageScrollRef = useRef(null);
  const didHydrateFeedbackRef = useRef(false);
  const lastExplicitNoticeAtRef = useRef(0);
  const handledNoticeLogsRef = useRef(new Map());
  const didHydrateSessionRef = useRef(false);
  const [gangProfileView, setGangProfileView] = useState("actions");
  const [casinoState, setCasinoState] = useState(createInitialCasinoState);
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
  const jailRemaining = game.player.jailUntil ? Math.max(0, game.player.jailUntil - Date.now()) : 0;
  const taskStates = useMemo(
    () => getSharedTaskStates(game, { mode: gameMode }),
    [game, gameMode]
  );
  const topTask =
    taskStates.find((task) => !task.claimed && !task.onlineDisabled) ||
    taskStates.find((task) => !task.onlineDisabled) ||
    taskStates[0];
  const nextHeistTier = getNextHeistTier(game.player.respect);
  const heistCatalog =
    Array.isArray(game.online?.heists) && game.online.heists.length
      ? game.online.heists.map(normalizeHeistDefinition).filter(Boolean)
      : HEISTS.map(normalizeHeistDefinition).filter(Boolean);
  const inGang = Boolean(game.gang.joined);
  const gangTributeRemaining = Math.max(0, GANG_TRIBUTE_COOLDOWN_MS - (Date.now() - (game.gang.lastTributeAt || 0)));
  const clubNightRemaining = Math.max(0, CLUB_NIGHT_COOLDOWN_MS - (Date.now() - (game.club.lastRunAt || 0)));
  const selectedWorldPlayerAttackCooldownRemaining = Math.max(
    0,
    Number(
      selectedWorldPlayer?.id
        ? game.cooldowns?.playerAttackTargets?.[selectedWorldPlayer.id] || 0
        : 0
    ) - Date.now()
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
  const adminState = useMemo(
    () => normalizeAdminState({
      isAdmin: game.player.isAdmin,
      grantPresets: game.player.adminGrantPresets,
      respectPresets: game.player.adminRespectPresets,
    }),
    [game.player.isAdmin, game.player.adminGrantPresets, game.player.adminRespectPresets]
  );

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
              playerAttackTargets: normalizePlayerAttackTargetCooldowns(
                serverUser.cooldowns?.playerAttackTargets
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
    mergeServerUser(me.user, { prices: me.market, products: me.marketState, clubMarket: me.clubMarket, gangs: me.gangs });
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
        mergeServerUser(me.user, { prices: me.market, products: me.marketState, clubMarket: me.clubMarket, gangs: me.gangs });
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
    if (!sessionToken || apiStatus !== "online") return undefined;
    const timer = setInterval(() => {
      refreshProfileState(sessionToken).catch(() => {});
      refreshMarketState(sessionToken).catch(() => {});
      refreshCasinoState(sessionToken).catch(() => {});
      refreshSocialState(sessionToken).catch(() => {});
      if (inJail(game.player)) {
        refreshPrisonChatState(sessionToken).catch(() => {});
      }
    }, 45000);
    return () => clearInterval(timer);
  }, [sessionToken, apiStatus, game.player.jailUntil]);

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
        const healthPool =
          prev.player.hp >= prev.player.maxHp
            ? 0
            : (prev.hpRegenRemainder || 0) + elapsedSeconds;
        const hpRecovered = Math.floor(healthPool / HEALTH_REGEN_SECONDS) * HEALTH_REGEN_AMOUNT;
        let hpRegenRemainder =
          prev.player.hp >= prev.player.maxHp
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
    pageScrollRef.current?.scrollTo?.({ y: 0, animated: false });
  }, [tab, activeSectionId, isPhone]);

  const canDoStreetAction = (message) => {
    if (inJail(game.player)) {
      pushLog(message || "Siedzisz w wiezieniu. Najpierw odsiadka albo kaucja.");
      return false;
    }
    return true;
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
    if (!canDoStreetAction("Z celi nie dojdziesz na silownie.")) return;
    if (sessionToken && apiStatus === "online") {
      try {
        const result = await trainAtGymOnline(sessionToken, exercise.id, safeRepetitions);
        mergeServerUser(result.user);
        showExplicitNotice(buildGymExerciseNotice(exercise, result.result));
        return;
      } catch (error) {
        pushLog(error.message);
        return;
      }
    }
    if (!hasGymPass(game.player)) return pushLog("Najpierw kup karnet na silownie.");
    if (game.player.energy < exercise.costEnergy) return pushLog("Za malo energii na trening.");

    const maxSeries = Math.floor(game.player.energy / Math.max(1, exercise.costEnergy));
    if (safeRepetitions > maxSeries) {
      return pushLog(`Masz energii tylko na ${maxSeries} ${maxSeries === 1 ? "serie" : "serii"}.`);
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
        log: [
          safeRepetitions > 1
            ? `Silownia zaliczona x${safeRepetitions}: ${exercise.name}. ${exercise.note}.`
            : `Silownia zaliczona: ${exercise.name}. ${exercise.note}.`,
          ...prev.log,
        ].slice(0, 16),
      };
    });
    showExplicitNotice(
      buildGymExerciseNotice(exercise, {
        repetitions: safeRepetitions,
        energySpent,
        totalGains,
      })
    );
  };

  const buyMeal = async (meal) => {
    if (!canDoStreetAction("Wiezienie serwuje tylko standardowy kociolek.")) return;
    if (sessionToken && apiStatus === "online") {
      try {
        const result = await buyMealOnline(sessionToken, meal.id);
        mergeServerUser(result.user);
        return;
      } catch (error) {
        pushLog(error.message);
        return;
      }
    }
    if (game.player.cash < meal.price) return pushLog(`Brakuje kasy na ${meal.name}.`);
    updateLocalPlayer(
      {
        cash: game.player.cash - meal.price,
        energy: clamp(game.player.energy + meal.energy, 0, game.player.maxEnergy),
      },
      `Zjedzone: ${meal.name}. Energia +${meal.energy}.`
    );
  };

  const heal = async () => {
    if (sessionToken && apiStatus === "online") {
      try {
        const result = await healOnline(sessionToken);
        mergeServerUser(result.user);
        return;
      } catch (error) {
        pushLog(error.message);
        return;
      }
    }
    if (game.player.cash < 220) return pushLog("Brakuje kasy na lekarza.");
    updateLocalPlayer(
      {
        cash: game.player.cash - 220,
        hp: clamp(game.player.hp + 30, 0, game.player.maxHp),
        heat: clamp(game.player.heat - 2, 0, 100),
      },
      "Lekarz poskladal Cie do kupy. Wracasz do gry."
    );
  };

  const fightClubRound = async () => {
    if (!canDoStreetAction("Fightclub nie dziala zza krat.")) return;
    if (game.player.energy < FIGHT_CLUB_ENERGY_COST) return pushLog("Za malo energii na sparing.");

    if (sessionToken && apiStatus === "online") {
      try {
        const result = await playFightClubRoundOnline(sessionToken);
        mergeServerUser(result.user);
        showExplicitNotice({
          tone: result?.result?.success ? "success" : "warning",
          title: result?.result?.success ? "FIGHTCLUB WYGRANY" : "FIGHTCLUB PRZEGRANY",
          message: result?.result?.logMessage || "Sparing rozliczony przez backend.",
          deltas: null,
        });
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }

    if (!requireOfflineDemoAuthority("Fightclub")) return;

    const score = effectivePlayer.attack * 0.4 + effectivePlayer.defense * 0.25 + effectivePlayer.dexterity * 0.35 + Math.random() * 10;
    if (score >= 16) {
      setGame((prev) => ({
        ...prev,
        player: applyProgressionToPlayer(
          {
            ...prev.player,
            energy: prev.player.energy - FIGHT_CLUB_ENERGY_COST,
            attack: prev.player.attack + 1,
            dexterity: prev.player.dexterity + 1,
          },
          8
        ).player,
        log: ["Fightclub wygrany. +8 XP, +1 atak, +1 zrecznosc.", ...prev.log].slice(0, 16),
      }));
      return;
    }

    setGame((prev) => ({
      ...prev,
      player: {
        ...prev.player,
        energy: prev.player.energy - FIGHT_CLUB_ENERGY_COST,
        hp: clamp(prev.player.hp - 10, 0, prev.player.maxHp),
      },
      log: ["Fightclub przegrany. Obite rylo, ale nauka zostaje.", ...prev.log].slice(0, 16),
    }));
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

    const { chance, jailChance } = getSoloHeistOdds(game.player, effectivePlayer, game.gang, heist);

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

  const executeGangHeist = async (heist) => {
    if (!canDoStreetAction()) return;
    if (sessionToken && apiStatus === "online") {
      try {
        const result = await executeGangHeistOnline(sessionToken, heist.id);
        mergeServerUser(result.user, result);
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }
    if (!requireOfflineDemoAuthority("Napady gangu")) return;
    if (!game.gang.joined) return pushLog("Najpierw musisz byc w gangu.");
    if (!canRunGangHeistRole(game.gang.role)) return pushLog("Napady gangu odpalaja tylko Boss, Vice Boss albo Zaufany.");
    if (game.gang.members < heist.minMembers) return pushLog(`Ten napad wymaga ${heist.minMembers} ludzi w ekipie.`);
    if (game.gang.members - game.gang.jailedCrew < heist.minMembers) return pushLog("Za duzo ludzi siedzi. Nie masz pelnego skladu do tej roboty.");
    if (game.player.respect < heist.respect) return pushLog(`Masz za niski szacunek. Wymagany szacunek: ${heist.respect}.`);
    if (game.player.energy < heist.energy) return pushLog(`Potrzebujesz ${heist.energy} energii.`);

    const { chance } = getGangHeistOdds(game.player, effectivePlayer, game.gang, heist);
    const participants = Math.min(game.gang.members - game.gang.jailedCrew, Math.max(heist.minMembers, heist.minMembers + Math.floor(game.gang.influence / 6)));

    if (Math.random() < chance) {
      const gangBonusRate = getGangHeistBonusRate(game.gang);
      const gain = Math.floor((randomBetween(heist.reward[0], heist.reward[1]) + Math.floor(game.gang.gearScore * 60)) * (1 + gangBonusRate));
      const share = Math.max(600, Math.floor(gain / participants));
      const xpGain = Math.max(7, randomBetween(Math.ceil(heist.minMembers * 2.5), heist.minMembers * 4));
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
        gang: {
          ...prev.gang,
          vault: prev.gang.vault + Math.floor(gain * 0.12),
          influence: prev.gang.influence + 2,
          territory: prev.gang.territory + (Math.random() < 0.25 ? 1 : 0),
          gearScore: clamp(prev.gang.gearScore - randomBetween(1, 3) + 1, 28, 100),
          chat: [{ id: `gang-${Date.now()}`, author: "System", text: `Napad gangu udany: ${heist.name}. Dzialka na leb: ${formatMoney(share)}.`, time: nowTimeLabel() }, ...prev.gang.chat].slice(0, 14),
        },
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
    setGame((prev) => ({
      ...prev,
      player: {
        ...prev.player,
        energy: prev.player.energy - heist.energy,
        hp: clamp(prev.player.hp - 16, 0, prev.player.maxHp),
        heat: clamp(prev.player.heat + Math.ceil(heist.risk * 26), 0, 100),
      },
      gang: {
        ...prev.gang,
        vault: clamp(prev.gang.vault - Math.floor(heist.reward[0] * 0.2), 0, 999999999),
        gearScore: clamp(prev.gang.gearScore - gearLoss, 18, 100),
        jailedCrew: clamp(prev.gang.jailedCrew + jailedCrew, 0, prev.gang.members - 1),
        crewLockdownUntil: Date.now() + (150 + heist.energy * 45) * 1000,
        chat: [{ id: `gang-${Date.now()}`, author: "System", text: `Wtopa na robocie: ${heist.name}. Siedzi ${jailedCrew} ludzi, sprzet spalony.`, time: nowTimeLabel() }, ...prev.gang.chat].slice(0, 14),
      },
      log: [`Napad gangu nie siadl: ${heist.name}. Siada ${jailedCrew} ludzi i leci ${gearLoss} pkt sprzetu.`, ...prev.log].slice(0, 16),
    }));

    if (Math.random() < heist.risk * 0.7) {
      applyJail(120 + heist.energy * 40, heist.name);
    }
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
      stats: { ...prev.stats, totalEarned: prev.stats.totalEarned + payout },
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

      if (sessionToken) {
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

  // TODO: TO_MIGRATE_TO_SERVER - owner-side traffic -> night payout loop is still local in demo mode,
  // but visitor utility/progress uses backend authority when online.
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
              : actionResult?.cashTip || actionResult?.heatReduced || actionResult?.hpRecovered
                ? "success"
                : "warning",
          title:
            action.id === "scout"
              ? "SCOUT"
              : action.id === "hunt"
                ? actionResult?.escort
                  ? "LEAD DOMKNIETY"
                  : "LEAD ROSNIE"
                : "LAY LOW",
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
        : { visits: 0, lastVisitAt: 0, tipDayKey: dayKey, tipValueToday: 0, tipCountToday: 0 };
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
  const buySupply = async (supply) => {
    if (!canDoStreetAction()) return;
    if (sessionToken && apiStatus === "online") {
      try {
        const result = await buyFactorySupplyOnline(sessionToken, supply.id, 1);
        mergeServerUser(result.user);
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }
    if (!requireOfflineDemoAuthority("Kupowanie dostaw")) return;
    if (game.player.cash < supply.price) return pushLog(`Brakuje gotowki na ${supply.name}.`);

    setGame((prev) => ({
      ...prev,
      player: { ...prev.player, cash: prev.player.cash - supply.price },
      supplies: { ...prev.supplies, [supply.id]: prev.supplies[supply.id] + 1 },
      log: [`Kupiono ${supply.unit}: ${supply.name}.`, ...prev.log].slice(0, 16),
    }));
  };

  // TODO: TO_MIGRATE_TO_SERVER - production recipes, raid risk, maintenance, yield scaling and inventory output are critical economy authority
  const produceDrug = async (drug) => {
    if (!canDoStreetAction()) return;
    if (sessionToken && apiStatus === "online") {
      try {
        const result = await produceDrugOnline(sessionToken, drug.id);
        mergeServerUser(result.user);
        if (result?.result?.jailSeconds) {
          setActiveSection("heists", "prison");
        }
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }
    if (!requireOfflineDemoAuthority("Produkcja w fabryce")) return;
    if (!hasFactory(game, drug.factoryId)) return pushLog(`Najpierw musisz miec ${FACTORIES.find((entry) => entry.id === drug.factoryId)?.name}.`);
    if (game.player.respect < drug.unlockRespect) return pushLog(`Masz za niski szacunek. Wymagany szacunek: ${drug.unlockRespect}.`);

    for (const [supplyId, amount] of Object.entries(drug.supplies)) {
      if (game.supplies[supplyId] < amount) {
        const supplyName = SUPPLIERS.find((entry) => entry.id === supplyId)?.name || supplyId;
        return pushLog(`Brakuje skladnika: ${supplyName}.`);
      }
    }

    const policeProfile = getDrugPoliceProfile(drug);
    const bustChance = clamp(policeProfile.risk + game.player.heat * 0.0022 - effectivePlayer.dexterity * 0.003, 0.03, 0.52);
    const busted = Math.random() < bustChance;
    const jailSeconds = busted && drug.unlockRespect >= 30 && Math.random() < bustChance * 0.42 ? randomBetween(180, 420) : 0;

    setGame((prev) => {
      const nextSupplies = { ...prev.supplies };
      Object.entries(drug.supplies).forEach(([supplyId, amount]) => {
        nextSupplies[supplyId] -= amount;
      });

      if (busted) {
        const fine = Math.floor(drug.streetPrice * (1.05 + policeProfile.risk));
        return {
          ...prev,
          supplies: nextSupplies,
          player: {
            ...prev.player,
            cash: Math.max(0, prev.player.cash - fine),
            heat: clamp(prev.player.heat + policeProfile.heatGain + 5, 0, 100),
            jailUntil: jailSeconds ? Date.now() + jailSeconds * 1000 : prev.player.jailUntil,
          },
          log: [
            jailSeconds
              ? `Nalot na produkcji ${drug.name}. Strata ${formatMoney(fine)} i cela na ${Math.ceil(jailSeconds / 60)} min.`
              : `Policja weszla na produkcje ${drug.name}. Strata ${formatMoney(fine)} i spalone skladniki.`,
            ...prev.log,
          ].slice(0, 16),
        };
      }

      return {
        ...prev,
        supplies: nextSupplies,
        drugInventory: { ...prev.drugInventory, [drug.id]: prev.drugInventory[drug.id] + drug.batchSize },
        player: {
          ...prev.player,
          heat: clamp(prev.player.heat + policeProfile.heatGain, 0, 100),
        },
        stats: { ...prev.stats, drugBatches: prev.stats.drugBatches + 1 },
        log: [`Wyprodukowano ${drug.batchSize} szt. ${drug.name}. Ryzyko: ${policeProfile.label}.`, ...prev.log].slice(0, 16),
      };
    });

    if (jailSeconds) {
      setActiveSection("heists", "prison");
    }
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
      setGame((prev) => ({
        ...prev,
        drugInventory: { ...prev.drugInventory, [drug.id]: prev.drugInventory[drug.id] - 1 },
        player: {
          ...prev.player,
          hp: clamp(prev.player.hp - randomBetween(28, 55), 1, prev.player.maxHp),
          heat: clamp(prev.player.heat + 8, 0, 100),
        },
        log: [`Przedawkowanie po ${drug.name}. Ledwo stoisz na nogach.`, ...prev.log].slice(0, 16),
      }));
      return;
    }

    setGame((prev) => ({
      ...prev,
      drugInventory: { ...prev.drugInventory, [drug.id]: prev.drugInventory[drug.id] - 1 },
      activeBoosts: [...prev.activeBoosts, { id: `${drug.id}-${Date.now()}`, name: drug.name, effect: drug.effect, expiresAt: Date.now() + drug.durationSeconds * 1000 }],
      log: [`Weszlo ${drug.name}. Staty podbite na ${Math.round(drug.durationSeconds / 60)} min.`, ...prev.log].slice(0, 16),
    }));
  };

  // TODO: TO_MIGRATE_TO_SERVER - dealer stock and buy pricing must be centrally controlled to prevent client exploits
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
      log: [`Kupiles od dilera: ${drug.name} x${quantity} za ${formatMoney(drug.streetPrice * quantity)}.`, ...prev.log].slice(0, 16),
    }));
  };

  // TODO: TO_MIGRATE_TO_SERVER - dealer sell-back and stock refill loop must be validated on backend
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

    setGame((prev) => ({
      ...prev,
      player: { ...prev.player, cash: prev.player.cash + payout },
      drugInventory: { ...prev.drugInventory, [drug.id]: prev.drugInventory[drug.id] - quantity },
      dealerInventory: { ...prev.dealerInventory, [drug.id]: (prev.dealerInventory[drug.id] || 0) + quantity },
      stats: { ...prev.stats, totalEarned: prev.stats.totalEarned + payout },
      log: [`Sprzedales dilerowi ${drug.name} x${quantity} za ${formatMoney(payout)}.`, ...prev.log].slice(0, 16),
    }));
  };

  // TODO: TO_MIGRATE_TO_SERVER - club takeover cost, ownership, player-driven traffic and upkeep need persistence and anti-abuse checks
  const openClub = async (listing) => {
    if (!canDoStreetAction()) return;
    if (game.club.owned) return pushLog("Klub juz jest Twoj.");
    if (!listing) return pushLog("Wybierz lokal z listy klubow.");

    if (sessionToken) {
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

  // TODO: TO_MIGRATE_TO_SERVER - club founding must be validated server-side before production
  const foundClub = () => {
    if (!canDoStreetAction()) return;
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

    setGame((prev) => ({
      ...prev,
      drugInventory: { ...prev.drugInventory, [drug.id]: Math.max(0, Number(prev.drugInventory[drug.id] || 0) - quantity) },
      club: {
        ...prev.club,
        stash: { ...prev.club.stash, [drug.id]: Number(prev.club.stash?.[drug.id] || 0) + quantity },
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
            hp: clamp(prev.player.hp - damage, 1, prev.player.maxHp),
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

  // TODO: TO_MIGRATE_TO_SERVER - club tick income, player-driven traffic, raid rolls and stash consumption are high-value economy actions
  const runClubNight = () => {
    if (!canDoStreetAction()) return;
    if (!game.club.owned) return pushLog("Bez klubu nie ma co odpalac nocy.");
    if (!insideOwnClub) return pushLog("Musisz siedziec we wlasnym klubie, zeby odpalic noc i pilnowac stolow.");
    if (clubNightRemaining > 0) return pushLog(`Klub juz pracuje. Wroc za ${formatCooldown(clubNightRemaining)}.`);

    if (sessionToken) {
      runClubNightOnline(sessionToken)
        .then((result) => {
          mergeServerUser(result.user, { clubMarket: result.clubMarket });
          showExplicitNotice({
            tone: "success",
            title: "NOC KLUBU",
            message: result?.result?.logMessage || "Lokal domknal noc.",
            deltas: null,
          });
        })
        .catch((error) => pushLog(error.message));
      return;
    }

    if (!requireOfflineDemoAuthority("Noc klubu")) return;

    const clubSnapshot = syncClubRuntimeState(game.club);
    const clubVenue = {
      id: clubSnapshot.sourceId,
      name: clubSnapshot.name,
      ownerLabel: clubSnapshot.ownerLabel,
      respect: clubSnapshot.respect || 0,
      popularity: clubSnapshot.popularity,
      mood: clubSnapshot.mood,
      policeBase: clubSnapshot.policeBase,
      policePressure: clubSnapshot.policePressure,
      traffic: clubSnapshot.traffic,
      nightPlanId: clubSnapshot.nightPlanId,
      note: clubSnapshot.note,
    };
    const profile = getClubVenueProfile({ ...game, club: clubSnapshot }, clubVenue);
    const totalUnits = DRUGS.reduce((sum, drug) => sum + (clubSnapshot.stash[drug.id] || 0), 0);
    if (!totalUnits) return pushLog("Klub stoi pusty. Dorzuc najpierw towar z fabryk.");
    const trafficLevel = clamp(Number(clubSnapshot.traffic || 0), 0, CLUB_SYSTEM_RULES.nightlyTrafficHardCap);
    const trafficWeight = clamp(trafficLevel / CLUB_SYSTEM_RULES.nightlyTrafficSoftCap, 0, 1.2);
    const pressureDrag = Math.max(0, (Math.max(0, clubPolice.pressure - 48) / 36));
    const effectiveTraffic = Math.max(0, trafficLevel - pressureDrag);
    const starterFloorDemand = totalUnits > 0 ? 1 : 0;
    const demandBudget = Math.max(
      starterFloorDemand,
      Math.min(
        9,
        Math.floor(effectiveTraffic / 2.6) + (profile.plan.id === "showtime" && effectiveTraffic >= 7 ? 1 : 0)
      )
    );

    if (demandBudget <= 0) {
      return pushLog("Presja zabila noc. Uspokoj dzielnice albo podbij ruch w lokalu.");
    }

    const workingStock = DRUGS.reduce((acc, drug) => {
      acc[drug.id] = Number(clubSnapshot.stash[drug.id] || 0);
      return acc;
    }, {});
    const soldByDrug = {};
    let remainingDemand = demandBudget;

    while (remainingDemand > 0) {
      const candidate = DRUGS
        .filter((drug) => workingStock[drug.id] > 0)
        .sort(
          (left, right) =>
            workingStock[right.id] * (1 + right.streetPrice / 7000) -
            workingStock[left.id] * (1 + left.streetPrice / 7000)
        )[0];

      if (!candidate) break;
      soldByDrug[candidate.id] = (soldByDrug[candidate.id] || 0) + 1;
      workingStock[candidate.id] -= 1;
      remainingDemand -= 1;
    }

    const soldUnits = Object.values(soldByDrug).reduce((sum, amount) => sum + amount, 0);
    if (!soldUnits) {
      return pushLog("Kolejka byla, ale nie zeszlo nic konkretnego ze stashu.");
    }

    let grossIncome = 0;
    Object.entries(soldByDrug).forEach(([drugId, amount]) => {
      const drug = DRUGS.find((entry) => entry.id === drugId);
      if (!drug || !amount) return;
      const perUnit = Math.max(
        80,
        Math.floor(drug.streetPrice * profile.nightIncomeFactor * (0.58 + trafficWeight * 0.28))
      );
      grossIncome += perUnit * amount;
    });

    const projectedPressure = clamp(
      Number(clubSnapshot.policePressure || 0) +
        effectiveTraffic * 1.4 +
        soldUnits * 1.8 +
        Math.max(0, totalUnits - soldUnits) * 0.18 +
        game.player.heat * 0.08,
      0,
      100
    );
    const incidentChance = clamp(
      0.03 + Math.max(0, projectedPressure - 58) / 190 + trafficWeight * 0.05,
      0.03,
      0.24
    );
    const incidentTriggered = Math.random() < incidentChance;
    const incidentLoss = incidentTriggered ? Math.floor(grossIncome * (0.12 + Math.random() * 0.08)) : 0;
    const netIncome = Math.max(0, grossIncome - incidentLoss);
    const quietNight = trafficLevel < 1.25;
    const soldSummary = Object.entries(soldByDrug)
      .filter(([, amount]) => amount > 0)
      .map(([drugId, amount]) => {
        const drug = DRUGS.find((entry) => entry.id === drugId);
        return drug ? `${amount}x ${drug.name}` : null;
      })
      .filter(Boolean)
      .slice(0, 3)
      .join(", ");
    const nextTraffic = Number((Math.max(0, trafficLevel * 0.34)).toFixed(3));
    const nextPressure = clamp(
      Number(clubSnapshot.policePressure || 0) + effectiveTraffic * 0.9 + soldUnits * 0.7 + (incidentTriggered ? 5.5 : 2.1),
      0,
      100
    );
    const recentIncident = incidentTriggered
      ? {
          tone: "risk",
          text: `Patrol przecial sale i scial ${formatMoney(incidentLoss)} z utargu.`,
          createdAt: Date.now(),
        }
      : {
          tone: quietNight ? "calm" : trafficLevel >= 12 ? "buzz" : "calm",
          text:
            quietNight
              ? "Lokal przepchnal cicha noc i rozruszal zaplecze bez szumu."
              : trafficLevel >= 12
              ? "Kolejka dowiozla noc, ale lokal robi sie coraz glosniejszy."
              : "Noc zamknieta czysto. Ruch byl umiarkowany i bez zbednego szumu.",
          createdAt: Date.now(),
        };

    setGame((prev) => {
      const nextStash = { ...clubSnapshot.stash };
      Object.entries(soldByDrug).forEach(([drugId, amount]) => {
        nextStash[drugId] = Math.max(0, Number(nextStash[drugId] || 0) - Number(amount || 0));
      });

      const nextClub = {
        ...clubSnapshot,
        popularity: clamp(clubSnapshot.popularity + (incidentTriggered ? -1 : trafficLevel >= 9 ? 2 : 1), 0, 100),
        mood: clamp(clubSnapshot.mood + (incidentTriggered ? -4 : soldUnits >= 4 ? 2 : 1), 0, 100),
        policePressure: nextPressure,
        traffic: nextTraffic,
        lastTrafficAt: Date.now(),
        lastRunAt: Date.now(),
        recentIncident,
        stash: nextStash,
      };

      return {
        ...prev,
        player: {
          ...prev.player,
          cash: prev.player.cash + netIncome,
          heat: clamp(prev.player.heat + (incidentTriggered ? 4 : 1), 0, 100),
        },
        stats: { ...prev.stats, totalEarned: prev.stats.totalEarned + netIncome },
        club: nextClub,
        clubListings: syncClubListing(prev.clubListings, nextClub, prev.club.ownerLabel || getPlayerClubOwnerLabel(prev)),
        log: [
          incidentTriggered
            ? `${prev.club.name}: noc domknieta na ${formatMoney(netIncome)}. Patrol przycial ${formatMoney(incidentLoss)}. Poszlo: ${soldSummary || "skromny miks"}.`
            : quietNight
              ? `${prev.club.name}: cicha noc domknieta na ${formatMoney(netIncome)}. Poszlo: ${soldSummary || "skromny miks"}.`
              : `${prev.club.name}: noc dowiozla ${formatMoney(netIncome)}. Ruch ${Math.round(trafficLevel)} i zeszlo: ${soldSummary || "skromny miks"}.`,
          ...prev.log,
        ].slice(0, 16),
      };
    });

    showExplicitNotice({
      tone: incidentTriggered ? "warning" : "success",
      title: incidentTriggered ? "NOC Z PRESJA" : "NOC DOMKNIETA",
      message: incidentTriggered
        ? `${clubSnapshot.name} wyciagnal ${formatMoney(netIncome)}, ale patrol przycial ${formatMoney(incidentLoss)}.`
        : quietNight
          ? `${clubSnapshot.name} zamknal cicha noc na ${formatMoney(netIncome)}.`
          : `${clubSnapshot.name} zamknal noc na ${formatMoney(netIncome)} przy ruchu ${Math.round(trafficLevel)}.`,
      deltas: null,
    });
  };

  const fortifyClub = async () => {
    if (!canDoStreetAction()) return;
    if (!game.club.owned) return pushLog("Najpierw musisz miec swoj lokal.");
    if (!insideOwnClub) return pushLog("Zabezpieczenie lokalu ustawiasz tylko bedac u siebie.");

    if (sessionToken) {
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
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }

    setGame((prev) => ({
      ...prev,
      club: {
        ...prev.club,
        visitId: listing.id,
      },
      log: [
        `Wchodzisz do ${listing.name}. Masz teraz Scout, Hunt Contacts i Lay Low.`,
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

  const promoteClub = () => {
    if (!requireOfflineDemoAuthority("Promocja klubu")) return;
    if (!game.club.owned) return pushLog("Najpierw otworz klub.");
    if (!insideOwnClub) return pushLog("Promo lokalu odpalasz tylko bedac w srodku swojego klubu.");
    if (game.player.cash < 1200) return pushLog("Brakuje kasy na promo lokalu.");
    updateLocalPlayer({ cash: game.player.cash - 1200 }, "Promo odpalone. Klub zaczyna byc glosny na miescie.");
    setGame((prev) => {
      const baseClub = syncClubRuntimeState(prev.club, Date.now());
      const nextClub = {
        ...baseClub,
        popularity: clamp(baseClub.popularity + 6, 0, 100),
        mood: clamp(baseClub.mood + 3, 0, 100),
        traffic: clamp(Number(baseClub.traffic || 0) + 1.8, 0, CLUB_SYSTEM_RULES.nightlyTrafficHardCap),
        policePressure: clamp(Number(baseClub.policePressure || 0) + 1.4, 0, 100),
        recentIncident: {
          tone: "buzz",
          text: "Promo rozkrecilo wejscie i ustawilo lekka kolejke pod lokalem.",
          createdAt: Date.now(),
        },
      };
      return {
        ...prev,
        club: nextClub,
        clubListings: syncClubListing(prev.clubListings, nextClub, prev.club.ownerLabel || getPlayerClubOwnerLabel(prev)),
      };
    });
  };

  // TODO: TO_MIGRATE_TO_SERVER - local market fallback must be removed; supply generation,
  // pricing and inventory mutation must stay server-authoritative.
  const buyProduct = async (product) => {
    if (!canDoStreetAction()) return;
    if (sessionToken) {
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
      log: [`Kupiono 1 sztuke: ${product.name}.`, ...prev.log].slice(0, 16),
    }));
  };

  // TODO: TO_MIGRATE_TO_SERVER - local market fallback must be removed; pricing and payouts
  // must be resolved only by backend.
  const sellProduct = async (product) => {
    if (!canDoStreetAction()) return;
    if (sessionToken) {
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
      stats: { ...prev.stats, totalEarned: prev.stats.totalEarned + sellPrice },
      log: [`Sprzedano ${product.name} za ${formatMoney(sellPrice)}.`, ...prev.log].slice(0, 16),
    }));
  };

  const promoteGangMember = (targetRole) => {
    if (!game.gang.joined) return;
    if (game.gang.role !== "Boss") return pushLog("Tylko boss ustawia role w ekipie.");

    setGame((prev) => {
      const members = [...prev.gang.membersList];
      if (targetRole === "Vice Boss") {
        const candidate = members.find((member) => member.role === "Zaufany");
        if (!candidate) return prev;
        const currentVice = members.find((member) => member.role === "Vice Boss");
        if (currentVice) currentVice.role = "Zaufany";
        candidate.role = "Vice Boss";
        candidate.trusted = true;
      } else {
        const candidate = members.find((member) => member.role === "Czlonek");
        if (!candidate) return prev;
        candidate.role = "Zaufany";
        candidate.trusted = true;
      }

      return {
        ...prev,
        gang: {
          ...prev.gang,
          membersList: members,
          chat: [{ id: `gang-${Date.now()}`, author: "System", text: `Boss ustawia role: ${targetRole}.`, time: nowTimeLabel() }, ...prev.gang.chat].slice(0, 14),
        },
        log: [`Awans w gangu: ${targetRole}.`, ...prev.log].slice(0, 16),
      };
    });
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

    if (sessionToken) {
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
    const district = findDistrictById(districtId);

    if (sessionToken) {
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

    if (sessionToken) {
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
    if (sessionToken) {
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
    if (!sessionToken) return pushLog("Operacje w tej wersji sa liczone po stronie backendu.");
    try {
      const result = await startOperationOnline(sessionToken, operationId);
      mergeServerUser(result.user);
    } catch (error) {
      pushLog(error.message);
    }
  };

  const advanceOperation = async (choiceId) => {
    if (!sessionToken) return pushLog("Operacje w tej wersji sa liczone po stronie backendu.");
    try {
      const result = await advanceOperationOnline(sessionToken, choiceId);
      mergeServerUser(result.user);
    } catch (error) {
      pushLog(error.message);
    }
  };

  const executeOperationPlan = async () => {
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

    if (sessionToken) {
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

    if (sessionToken) {
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

    if (sessionToken) {
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

  // TODO: TO_MIGRATE_TO_SERVER - local bank fallback should be deleted before alpha; all
  // transfers, fees and balance validation must be backend-only.
  const depositCash = async () => {
    const parsed = Number.parseInt(bankAmountDraft.replace(/[^\d]/g, ""), 10);
    if (!parsed || parsed <= 0) return pushLog("Wpisz sensowna kwote do wplaty.");
    const amount = Math.min(parsed, Math.max(0, game.player.cash));
    if (!amount) return pushLog("Nie masz gotowki do wplaty.");
    if (parsed > game.player.cash) return pushLog("Nie masz tyle gotowki przy sobie.");

    if (sessionToken) {
      try {
        const result = await depositOnline(sessionToken, amount);
        mergeServerUser(result.user);
        setBankAmountDraft(String(amount));
        return;
      } catch (error) {
        pushLog(error.message);
        return;
      }
    }

    updateLocalPlayer({ cash: game.player.cash - amount, bank: (game.player.bank || 0) + amount }, `Wplacono do banku ${formatMoney(amount)}.`);
    setBankAmountDraft(String(amount));
  };

  // TODO: TO_MIGRATE_TO_SERVER - local bank fallback should be deleted before alpha; all
  // withdrawals, fees and balance validation must be backend-only.
  const withdrawCash = async () => {
    const bankBalance = game.player.bank || 0;
    const parsed = Number.parseInt(bankAmountDraft.replace(/[^\d]/g, ""), 10);
    if (!parsed || parsed <= 0) return pushLog("Wpisz sensowna kwote do wyplaty.");
    const amount = Math.min(parsed, Math.max(0, bankBalance));
    if (!amount) return pushLog("Nie masz nic w banku.");
    if (parsed > bankBalance) return pushLog("Nie masz tyle siana na koncie.");

    if (sessionToken) {
      try {
        const result = await withdrawOnline(sessionToken, amount);
        mergeServerUser(result.user);
        setBankAmountDraft(String(amount));
        return;
      } catch (error) {
        pushLog(error.message);
        return;
      }
    }

    updateLocalPlayer({ cash: game.player.cash + amount, bank: Math.max(0, (game.player.bank || 0) - amount) }, `Wyplacono z banku ${formatMoney(amount)}.`);
    setBankAmountDraft(String(amount));
  };

  const claimTask = async (task) => {
    if (sessionToken && apiStatus === "online") {
      try {
        const result = await claimTaskOnline(sessionToken, task.id);
        mergeServerUser(result.user);
      } catch (error) {
        pushLog(error.message);
      }
      return;
    }
    if (!requireOfflineDemoAuthority("Misje i nagrody")) return;
    if (!task.completed || task.claimed) return;
    setGame((prev) => ({
      ...prev,
      player: applyProgressionToPlayer(
        { ...prev.player, cash: prev.player.cash + task.rewardCash },
        task.rewardXp
      ).player,
      tasksClaimed: [...prev.tasksClaimed, task.id],
      stats: { ...prev.stats, totalEarned: prev.stats.totalEarned + task.rewardCash },
      log: [`Odebrano zadanie: ${task.title}. ${formatMoney(task.rewardCash)} i +${task.rewardXp} XP.`, ...prev.log].slice(0, 16),
    }));
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

  const sendGangAllianceOffer = (gangProfile) => {
    if (!gangProfile || gangProfile.self) return pushLog("To Twoj gang. Tu nie wysylasz sobie sojuszu.");
    if (!game.gang.joined) return pushLog("Sojusz wysyla juz konkretna ekipa, nie solo gracz.");
    if (game.gang.name === gangProfile.name) return pushLog("To Twoj gang.");

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

  const buildClubPvpPayload = (gangProfile) => ({
    attacker: {
      attack: effectivePlayer.attack,
      defense: effectivePlayer.defense,
      dexterity: effectivePlayer.dexterity,
      respect: game.player.respect,
      heat: game.player.heat,
      gangMembers: game.gang.members,
      gangInfluence: game.gang.influence,
      committedCrew: Math.max(1, Math.min(game.gang.members, 4)),
      intelBonus: 0,
    },
    defender: {
      ownerAttack: gangProfile?.respect ? Math.max(8, Math.round(gangProfile.respect * 0.32)) : 10,
      ownerDefense: gangProfile?.respect ? Math.max(8, Math.round(gangProfile.respect * 0.28)) : 10,
      ownerDexterity: gangProfile?.respect ? Math.max(7, Math.round(gangProfile.respect * 0.24)) : 9,
      ownerRespect: gangProfile?.respect || 0,
      ownerHeat: 18,
      gangMembers: gangProfile?.members || 1,
      gangInfluence: gangProfile?.influence || 0,
      popularity: 35,
      mood: 62,
      recentTraffic: Math.max(2, Math.round((gangProfile?.members || 1) / 2)),
      recentIncomingAttacks: 0,
      recentIncomingFromSameAttacker: 0,
      clubAgeHours: 96,
      defenderShieldSeconds: 0,
      clubCash: gangProfile?.vault || 0,
      targetUnclaimedIncome: Math.max(1200, Math.round((gangProfile?.influence || 0) * 240)),
      targetNetWorth: Math.max((gangProfile?.vault || 0) * 4, 20000),
      clubSecurityLevel: Math.max(0, Math.round((gangProfile?.territory || 1) / 2)),
      baseNet: Math.max(1800, Math.round((gangProfile?.influence || 0) * 320)),
    },
  });

  // TODO: TO_MIGRATE_TO_SERVER - gang/club PvP chance, protection windows, grief locks,
  // loss caps and cooldown enforcement must be computed server-side before live multiplayer.
  const attackGangProfile = async (gangProfile) => {
    if (!gangProfile || gangProfile.self) return pushLog("Nie zaatakujesz wlasnego gangu z poziomu tej akcji.");
    if (!canDoStreetAction("Atak na gang odpalasz dopiero po wyjsciu z celi.")) return;
    if (!requireOfflineDemoAuthority("Finalny wynik PvP")) return;
    if (!game.gang.joined) return pushLog("Na gang idzie sie ze swoja ekipa, nie solo.");
    if (game.player.energy < 3) return pushLog("Potrzebujesz 3 energii na akcje przeciw gangowi.");

    let successChance;
    let previewLoss = null;
    if (sessionToken && apiStatus === "online") {
      try {
        const preview = await previewClubPvpOnline(sessionToken, buildClubPvpPayload(gangProfile));
        successChance = preview.raidChance?.chance;
        previewLoss = preview.lossPreview || null;
      } catch (error) {
        pushLog(error.message);
      }
    }

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
            ...normalizePlayerAttackTargetCooldowns(prev.cooldowns?.playerAttackTargets),
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
            ...normalizePlayerAttackTargetCooldowns(prev.cooldowns?.playerAttackTargets),
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
    const bet = Number(casinoState.slotBet || 0);
    if (bet < 100) return pushLog("Minimalna stawka slota to $100.");
    if (bet > 50000) {
      setCasinoState((prev) => ({ ...prev, slotBet: "50000" }));
      return pushLog("Na ten automat max stawka to $50tys.");
    }
    if (game.player.cash < bet) return pushLog(`Potrzebujesz ${formatMoney(bet)} na spin automatu.`);

    if (sessionToken && apiStatus === "online") {
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

  // TODO: TO_MIGRATE_TO_SERVER - roulette still has an offline fallback path below.
  // Online mode already delegates stake validation, cooldowns, RNG and rewards to backend high-risk bet rules.
  const spinRoulette = async () => {
    if (!canDoStreetAction("Kasyno nie wpuszcza ludzi w kajdankach.")) return;
    if (casinoState.rouletteSpinning) return;
    const bet = Number(casinoState.rouletteBet || 0);
    if (bet > 15000) {
      setCasinoState((prev) => ({ ...prev, rouletteBet: "15000" }));
      return pushLog("Na ten stol max stawka to $15tys.");
    }
    if (bet < 50) return pushLog("Minimalna stawka ruletki to $50.");
    if (game.player.cash < bet) return pushLog(`Potrzebujesz ${formatMoney(bet)} na wejscie do ruletki.`);

    if (sessionToken && apiStatus === "online") {
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
    if (sessionToken && apiStatus === "online") {
      const bet = Number(casinoState.blackjack.bet || 0);
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
    const bet = Number(casinoState.blackjack.bet || 0);
    if (bet < 50) return pushLog("Minimalna stawka blackjacka to $50.");
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

  const isOnlineAuthority = Boolean(sessionToken && apiStatus === "online");
  const totalBusinessIncome = getBusinessIncomePerMinute(game, BUSINESSES);
  const totalEscortIncome = getEscortIncomePerMinute(game);
  const businessCollectionCap = getPassiveCapAmount(totalBusinessIncome);
  const escortCollectionCap = getPassiveCapAmount(totalEscortIncome);
  const projectedBusinessCash = getProjectedBusinessCash(
    game.collections,
    totalBusinessIncome,
    businessCollectionCap,
    isOnlineAuthority
  );
  const projectedEscortCash = getProjectedEscortCash(
    game.collections,
    totalEscortIncome,
    escortCollectionCap,
    isOnlineAuthority
  );
  const projectedScreenGame =
    isOnlineAuthority &&
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
          const odds = getSoloHeistOdds(game.player, effectivePlayer, game.gang, heist);
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
        lines={["Sklad, szacun i wplywy decyduja, czy robota siada."]}
        accent={["#422418", "#160f0c", "#050505"]}
        source={SCENE_BACKGROUNDS.gangWide}
      />
      <SectionCard title="Napady gangu" subtitle="Sklad i szacun decyduja o wejsciu.">
        {GANG_HEISTS.map((heist) => {
          const roleLocked = !canRunGangHeistRole(game.gang.role);
          const memberLocked = game.gang.members < heist.minMembers;
          const respectLocked = game.player.respect < heist.respect;
          const crewLocked = game.gang.members - game.gang.jailedCrew < heist.minMembers;
          const lockdownLocked = crewLockdownRemaining > 0;
          const locked = roleLocked || memberLocked || respectLocked || crewLocked || lockdownLocked;
          const odds = getGangHeistOdds(game.player, effectivePlayer, game.gang, heist);
          const ctaLabel = roleLocked
            ? "Za niska ranga"
            : lockdownLocked
              ? "Ekipa lezy po wtapie"
              : crewLocked
                ? "Za malo wolnych ludzi"
                : memberLocked || respectLocked
                  ? "Za malo ludzi albo szacunu"
                  : "Odpal napad gangu";
          return (
            <View key={heist.id} style={[styles.listCard, locked && styles.listCardLocked]}>
              <View style={styles.listCardHeader}>
                <View style={styles.flexOne}>
                  <Text style={styles.listCardTitle}>{heist.name}</Text>
                  <Text style={styles.listCardMeta}>Szacun {heist.respect} | Min. ludzi {heist.minMembers} | Energia {heist.energy}</Text>
                </View>
                <Text style={styles.listCardReward}>{formatMoney(heist.reward[0])} - {formatMoney(heist.reward[1])}</Text>
              </View>
              <View style={styles.oddsRow}>
                <View style={styles.oddsBlock}>
                  <Text style={styles.oddsLabel}>Szansa ekipy</Text>
                  <Text style={styles.oddsValue}>{Math.round(odds.chance * 100)}%</Text>
                </View>
                <View style={styles.oddsBlock}>
                  <Text style={styles.oddsLabel}>Sklad</Text>
                  <Text style={styles.oddsValue}>{game.gang.members}/{heist.minMembers}</Text>
                </View>
              </View>
              <ProgressBar progress={odds.chance} />
              <View style={styles.inlineRow}>
                <Text style={styles.costLabel}>Wplywy: {game.gang.influence} | Teren: {game.gang.territory}</Text>
                <Pressable onPress={() => executeGangHeist(heist)} style={[styles.inlineButton, locked && styles.tileDisabled]}>
                  <Text style={styles.inlineButtonText}>{ctaLabel}</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </SectionCard>
    </>
  );

  const renderPrison = () => (
    <SectionCard title="Wiezienie" subtitle="Cela, kaucja i chat celi.">
      <SceneArtwork
        eyebrow="Cela"
        title="Zimna odsiadka"
        lines={["Krata, licznik i szybka kaucja."]}
        accent={["#2b2f34", "#121417", "#040404"]}
        source={SCENE_BACKGROUNDS.prison}
      />
      <StatLine label="Status" value={inJail(game.player) ? "Odsiadka trwa" : "Cela pusta"} />
      <StatLine label="Pozostalo" value={inJail(game.player) ? formatDuration(jailRemaining) : "--:--"} />
      <StatLine label="Kaucja teraz" value={inJail(game.player) ? formatMoney(400 + Math.ceil(jailRemaining / 1000) * 8) : formatMoney(0)} />
      <View style={styles.grid}>
        <ActionTile title="Wyjdz za kaucje" subtitle="Drogo, ale szybciej wracasz na ulice." onPress={bribeOutOfJail} disabled={!inJail(game.player)} />
      </View>
      {inJail(game.player) ? (
        <View style={styles.prisonChatWrap}>
          <Text style={styles.sectionSubtitle}>Chat wiezienny widza i pisza tylko osadzeni.</Text>
          <View style={styles.chatComposer}>
            <TextInput value={prisonMessage} onChangeText={setPrisonMessage} placeholder="Napisz z celi..." placeholderTextColor="#6c6c6c" style={styles.chatInput} />
            <Pressable onPress={sendPrisonMessage} style={styles.inlineButton}>
              <Text style={styles.inlineButtonText}>Wyslij</Text>
            </Pressable>
          </View>
          {(Array.isArray(game.prisonChat) ? game.prisonChat : []).map((entry) => (
            <View key={entry.id} style={styles.chatBubble}>
              <Text style={styles.chatAuthor}>{entry.author} <Text style={styles.chatTime}>{entry.time}</Text></Text>
              <Text style={styles.chatText}>{entry.text}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.lockedPanel}>
          <Text style={styles.lockedPanelText}>Chat wiezienny jest ukryty, dopoki nie siedzisz.</Text>
        </View>
      )}
    </SectionCard>
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
                <StatLine label="Ludzie" value={`${selectedGangProfile.members}`} />
                <StatLine label="Teren" value={`${selectedGangProfile.territory}`} />
                <StatLine label="Wplywy" value={`${selectedGangProfile.influence}`} />
                <StatLine label="Skarbiec" value={formatMoney(selectedGangProfile.vault)} />
                <StatLine label="Wejscie od" value={`${selectedGangProfile.inviteRespectMin} RES`} />
                <StatLine label="Szacun ekipy" value={`${selectedGangProfile.respect}`} />
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
                <Pressable onPress={() => attackGangProfile(selectedGangProfile)} style={styles.inlineButton}>
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
                <Text style={styles.listCardMeta}>Szybkie akcje wobec ekipy.</Text>
                <StatLine label="Boss" value={selectedGangProfile.boss} />
                <StatLine label="Vice Boss" value={selectedGangProfile.viceBoss} />
                <StatLine label="Potencjal skladu" value={`${selectedGangProfile.members} ludzi | ${selectedGangProfile.influence} wplywu | ${selectedGangProfile.territory} dzielnice`} />
              </View>
            ) : null}

            {gangProfileView === "members" ? (
              <View style={styles.listCard}>
                <Text style={styles.listCardTitle}>Sklad gangu</Text>
                <Text style={styles.listCardMeta}>Boss, zaufani i zwykli ludzie ekipy.</Text>
                {selectedGangProfile.membersList?.map((member) => (
                  <View key={member.id} style={styles.listCard}>
                    <View style={styles.inlineRow}>
                      <View style={styles.flexOne}>
                        <Text style={styles.listCardTitle}>{member.name}</Text>
                        <Text style={styles.listCardMeta}>{member.role} | Szacun {member.respect ?? "-"} | {member.online ? "Online" : "Offline"}</Text>
                      </View>
                      <Tag text={member.trusted ? "Zaufany" : "Czlonek"} warning={!member.trusted} />
                    </View>
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
          <StatLine label="Aktualna liczba ludzi" value={`${game.gang.members}`} />
          <StatLine label="Do pelnego skladu" value={`${game.gang.maxMembers - game.gang.members}`} />
          <StatLine label="Wplyw na napady" value={`+${Math.round(game.gang.members * 0.9)} mocy gangu`} />
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
                  <Pressable onPress={() => inviteCandidate(candidate.id)} style={[styles.inlineButton, (game.gang.role !== "Boss" || candidate.respect < game.gang.inviteRespectMin) && styles.tileDisabled]}>
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
            <Text style={styles.listCardTitle}>Przerzut fokusu</Text>
            <Text style={styles.listCardMeta}>Jedna decyzja dla gangu. Tam idzie projekt, operacja i cisnienie tygodnia.</Text>
            <View style={styles.listActionsRow}>
              {districtSummaries.map((district) => (
                <Pressable
                  key={`focus-${district.id}`}
                  onPress={() => setGangFocus(district.id)}
                  style={[styles.inlineButton, game.gang.focusDistrictId === district.id && styles.tileDisabled]}
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
                    </View>
                    <Pressable onPress={() => investGangProject(project.id)} style={[styles.inlineButton, locked && styles.tileDisabled]}>
                      <Text style={styles.inlineButtonText}>{locked ? "Max" : formatMoney(cost)}</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
          <View style={styles.listCard}>
            <Text style={styles.listCardTitle}>Nagroda tygodnia</Text>
            <Text style={styles.listCardMeta}>{gangGoalProgress.goal?.summary}</Text>
            <Text style={styles.listCardMeta}>
              Nagroda: {formatMoney(gangGoalProgress.goal?.rewards?.vaultCash || 0)} do skarbca i puls w fokusie.
            </Text>
            <Pressable
              onPress={claimGangGoal}
              style={[styles.inlineButton, (!gangGoalProgress.completed || gangGoalProgress.claimed) && styles.tileDisabled]}
            >
              <Text style={styles.inlineButtonText}>{gangGoalProgress.claimed ? "Odebrane" : "Odbierz"}</Text>
            </Pressable>
          </View>
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
                  <Text style={styles.playerProfileStatus}>{selectedWorldPlayer.online ? "Online" : "Offline"} | {getRankTitle(selectedWorldPlayer.respect)}</Text>
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
                    selectedWorldPlayer.respect < game.gang.inviteRespectMin && styles.tileDisabled,
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
                disabled={!selectedWorldPlayer.online || selectedWorldPlayerAttackCooldownRemaining > 0}
                style={[
                  styles.inlineButton,
                  (!selectedWorldPlayer.online || selectedWorldPlayerAttackCooldownRemaining > 0) && styles.tileDisabled,
                ]}
              >
                <Text style={styles.inlineButtonText}>
                  {!selectedWorldPlayer.online
                    ? "Offline"
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
          <Pressable key={player.id} style={styles.listCard} onPress={() => openWorldPlayerProfile(player.id)}>
            <View style={styles.listCardHeader}>
              <View style={styles.entityHead}>
                <EntityBadge visual={getPlayerAvatarVisual(player)} />
                <View style={styles.flexOne}>
                  <Text style={styles.listCardTitle}>{player.name}</Text>
                  <Text style={styles.listCardMeta}>{player.gang} | Szacun {player.respect} | Kasa {formatMoney(player.cash)}</Text>
                </View>
              </View>
              <Tag text={player.online ? "ONLINE" : "OFFLINE"} warning={!player.online} />
            </View>
            <View style={styles.oddsRow}>
              <View style={styles.oddsBlock}>
                <Text style={styles.oddsLabel}>Atak / Obrona</Text>
                <Text style={styles.oddsValue}>{player.attack}/{player.defense}</Text>
              </View>
              <View style={styles.oddsBlock}>
                <Text style={styles.oddsLabel}>Zrecznosc</Text>
                <Text style={styles.oddsValue}>{player.dexterity}</Text>
              </View>
              <View style={styles.oddsBlock}>
                <Text style={styles.oddsLabel}>Bounty</Text>
                <Text style={styles.oddsValue}>{formatMoney(player.bounty)}</Text>
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

    const RankingCard = ({ title, entries }) => (
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {entries.map((entry, index) => (
          <View key={`${title}-${entry.id}`} style={styles.listCard}>
            <View style={styles.inlineRow}>
              <View style={styles.entityHead}>
                <EntityBadge visual={getPlayerAvatarVisual(entry)} />
                <View>
                  <Text style={styles.listCardTitle}>#{index + 1} {entry.name}</Text>
                  <Text style={styles.listCardMeta}>{entry.gang}</Text>
                </View>
              </View>
              <Tag text={entry.id === "self" ? "TY" : "GRACZ"} />
            </View>
          </View>
        ))}
      </View>
    );

    return (
      <>
      <SceneArtwork
        eyebrow="Rankingi"
        title="Topka miasta"
        lines={["Szacun, kasa, napady i kasyno."]}
          accent={["#382417", "#140f0c", "#050505"]}
          source={SCENE_BACKGROUNDS.profile}
        />
        <RankingCard title="Szacun" entries={byRespect} />
        <RankingCard title="Kasa" entries={byCash} />
        <RankingCard title="Napady" entries={byHeists} />
        <RankingCard title="Kasyno" entries={byCasino} />
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
    marketState: game.marketState,
    marketMeta: game.marketMeta,
    dealerTradeDraft,
    setDealerTradeDraft,
    actions: { buyProduct, sellProduct, buyDrugFromDealer, sellDrugToDealer, consumeDrug },
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
    clubNightRemaining,
    bankAmountDraft,
    setBankAmountDraft,
    restaurantItems: RESTAURANT_ITEMS,
    gymPasses: GYM_PASSES,
    gymExercises: GYM_EXERCISES,
    taskStates,
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
      fightClubRound,
      collectGangTribute,
      runClubNight,
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
    topTask,
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
    clubNightRemaining,
    focusDistrictSummary,
    districtSummaries,
    helpers: {
      getOwnedEscort,
      getEscortWorkingCount,
      getEscortDistrictCount,
      hasFactory,
      getDrugPoliceProfile,
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
      fortifyClub,
      promoteClub,
      runClubNight,
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
    getRankTitle,
    heists: heistCatalog,
    getSoloHeistOdds,
    sceneBackgrounds: SCENE_BACKGROUNDS,
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
    heists: heistCatalog,
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
    onExecuteHeist: executeHeist,
    onStartOperation: startOperation,
    onAdvanceOperation: advanceOperation,
    onExecuteOperation: executeOperationPlan,
    sceneBackgrounds: SCENE_BACKGROUNDS,
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
    restaurant: "Jedzenie",
    hospital: "Szpital",
    gym: "Trening",
    "compose-message": directMessageRecipient?.name ? `Wiadomosc do ${directMessageRecipient.name}` : "Nowa wiadomosc",
  };

  const renderActiveSection = () => {
    switch (`${tab}:${activeSectionId}`) {
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
        return <CityScreen {...cityScreenProps} section={activeSectionId} />;
      case "profile:casino":
        return <CasinoScreen {...casinoScreenProps} />;
      case "heists:solo":
        return <HeistsScreen {...heistsScreenProps} />;
      case "heists:fightclub":
        return (
          <SectionCard title="Fightclub" subtitle="Szybki sparing pod staty i respekt.">
            <View style={styles.grid}>
              <ActionTile title="Walka 1v1" subtitle="Koszt 3 energii. Zysk: sila, zrecznosc, szacun." visual={SYSTEM_VISUALS.pvp} onPress={fightClubRound} danger />
            </View>
          </SectionCard>
        );
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
              hp={game.player.hp}
              maxHp={game.player.maxHp}
              energy={game.player.energy}
              maxEnergy={game.player.maxEnergy}
              activeAvatar={activeAvatar}
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
  tabBarShell: { flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#3c2f1f", backgroundColor: "#060606" },
  tabBarClassic: { flex: 1, backgroundColor: "#060606", maxHeight: 66 },
  tabBarClassicContent: { paddingHorizontal: 8, paddingVertical: 10, gap: 10, alignItems: "center" },
  tabButtonClassic: { minWidth: 110, height: 52, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", borderRadius: 999, borderWidth: 1, borderColor: "#5d4418", backgroundColor: "#0b0b0b" },
  tabButtonClassicActive: { borderColor: "#c7902e", backgroundColor: "#14120d" },
  tabButtonHub: { marginLeft: 8 },
  tabButtonClassicInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  tabButtonClassicIcon: { color: "#c7902e", fontSize: 16, fontWeight: "900" },
  tabButtonClassicIconActive: { color: "#f0c24d" },
  tabButtonClassicText: { color: "#d7d7d7", fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  tabButtonClassicTextActive: { color: "#f0c24d" },
  mainBoard: { flexDirection: "row", alignItems: "flex-start" },
  mainBoardCompact: { flexDirection: "column" },
  leftRail: { width: 124, padding: 10, backgroundColor: "#080808", borderRightWidth: 1, borderColor: "#1e1e1e", minHeight: 980 },
  rightRail: { width: 156, padding: 10, backgroundColor: "#080808", borderLeftWidth: 1, borderColor: "#1e1e1e", minHeight: 980, gap: 10 },
  railCompact: { width: "100%", minHeight: 0, borderLeftWidth: 0, borderRightWidth: 0, borderTopWidth: 1 },
  railPhone: { paddingHorizontal: 8 },
  railHeading: { color: "#9a9a9a", fontSize: 11, textTransform: "uppercase", marginBottom: 10, letterSpacing: 1 },
  railLink: { borderBottomWidth: 1, borderColor: "#151515", paddingVertical: 5, paddingHorizontal: 4 },
  railLinkActive: { backgroundColor: "#151515", borderLeftWidth: 2, borderLeftColor: "#d6a04f" },
  railLinkText: { color: "#d0d0d0", fontSize: 11 },
  railLinkTextActive: { color: "#f4d37e", fontWeight: "700" },
  cashButtonFrame: { marginTop: 14, borderWidth: 1, borderColor: "#6b6b6b", paddingVertical: 18, paddingHorizontal: 10, alignItems: "center", backgroundColor: "#111111" },
  cashButtonText: { color: "#ffffff", fontWeight: "800", fontSize: 12, textTransform: "uppercase" },
  centerStage: { flex: 1, minHeight: 980, padding: 8, backgroundColor: "#030303" },
  centerStagePhone: { minHeight: 0, padding: 10, backgroundColor: "#050505" },
  contentHeaderBar: { height: 28, backgroundColor: "#09090b", borderWidth: 1, borderColor: "#2c2c2f", marginBottom: 8, paddingHorizontal: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  contentHeaderLabel: { color: "#f0c24d", fontSize: 18, fontWeight: "800" },
  contentHeaderSub: { color: "#666666", fontSize: 11, textTransform: "uppercase" },
  sectionCard: { backgroundColor: "rgba(12,12,13,0.95)", borderRadius: 18, padding: 14, borderWidth: 1, borderColor: "#2a2a2d", marginBottom: 10 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { color: "#d3d3d3", fontSize: 20, fontWeight: "700", marginBottom: 4 },
  sectionSubtitle: { color: "#8c8c8c", fontSize: 12, lineHeight: 18 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickActionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickActionCard: { width: "31%", minWidth: 92, flexGrow: 1, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 16, backgroundColor: "#121315", borderWidth: 1, borderColor: "#2d2f36", alignItems: "center", gap: 8 },
  quickActionIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#1c1d22", borderWidth: 1, borderColor: "#3a3c44", alignItems: "center", justifyContent: "center" },
  quickActionIconText: { color: "#f0c24d", fontSize: 11, fontWeight: "900", letterSpacing: 0.7 },
  quickActionTitle: { color: "#f4efe8", fontSize: 12, fontWeight: "800", textAlign: "center" },
  actionTile: { flexBasis: 220, flexGrow: 1, width: undefined, maxWidth: "100%", minWidth: 0, minHeight: 106, padding: 14, borderRadius: 18, backgroundColor: "#141414", borderWidth: 1, borderColor: "#303030", justifyContent: "space-between" },
  actionTileDanger: { backgroundColor: "#24110f", borderColor: "#6a2b20" },
  tileDisabled: { opacity: 0.45 },
  actionTileHeader: { gap: 10, marginBottom: 8 },
  actionTileTitle: { color: "#f0f0f0", fontSize: 16, fontWeight: "800", marginBottom: 6 },
  actionTileSubtitle: { color: "#aaa79d", fontSize: 12, lineHeight: 18 },
  statLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#1b1b1d", gap: 12 },
  statLineLabelWrap: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  statLineLabel: { color: "#a69e93", fontSize: 13, flex: 1 },
  statLineValue: { color: "#f4efe8", fontSize: 13, fontWeight: "700", maxWidth: "58%", flexShrink: 1, textAlign: "right" },
  progressBar: { height: 8, borderRadius: 999, backgroundColor: "#1e1e20", overflow: "hidden", marginTop: 6 },
  progressFill: { height: "100%", backgroundColor: "#c49539" },
  dotRow: { flexDirection: "row", gap: 6, marginTop: 8 },
  progressDot: { width: 10, height: 10, borderRadius: 99, backgroundColor: "#2d2d30" },
  progressDotActive: { backgroundColor: "#d5a045" },
  logEntry: { paddingVertical: 10, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: "#d6a04f", marginBottom: 8, backgroundColor: "#111111", borderRadius: 2 },
  logText: { color: "#ddd8d0", lineHeight: 19, fontSize: 12 },
  listCard: { padding: 12, borderRadius: 18, backgroundColor: "#111214", borderWidth: 1, borderColor: "#2b2b31", marginBottom: 10 },
  districtCard: { padding: 10, borderRadius: 16, backgroundColor: "#17181c", borderWidth: 1, borderColor: "#2f3138", marginTop: 10 },
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
  listCardTitle: { color: "#f3eee7", fontSize: 15, fontWeight: "800", marginBottom: 4 },
  listCardMeta: { color: "#999082", fontSize: 12, lineHeight: 18 },
  listCardReward: { color: "#d6a04f", fontSize: 13, fontWeight: "800", maxWidth: "100%", flexShrink: 1, textAlign: "right" },
  listActionsRow: { flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 12 },
  planChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  planChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: "#3a2a21", backgroundColor: "#151110" },
  planChipActive: { borderColor: "#c49539", backgroundColor: "#21170f" },
  planChipText: { color: "#bcae9a", fontSize: 12, fontWeight: "700" },
  planChipTextActive: { color: "#f4d37e" },
  oddsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  oddsBlock: { flex: 1, minWidth: 132, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: "#27282d", backgroundColor: "#101114" },
  oddsLabel: { color: "#948a7d", fontSize: 11, textTransform: "uppercase", marginBottom: 4, letterSpacing: 0.8 },
  oddsValue: { color: "#f4d37e", fontSize: 18, fontWeight: "800" },
  inlineButton: { alignSelf: "flex-start", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 2, backgroundColor: "#201712", borderWidth: 1, borderColor: "#5b3529" },
  inlineButtonText: { color: "#f6efe6", fontWeight: "700", fontSize: 13 },
  inlineButtonDanger: { backgroundColor: "#2a1214", borderColor: "#8a3438" },
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
  mobileTopSectionChip: { minHeight: 42, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: "#5d4418", backgroundColor: "#101114", alignItems: "center", justifyContent: "center" },
  mobileTopSectionChipActive: { borderColor: "#c7902e", backgroundColor: "#17140d" },
  mobileTopSectionInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  mobileTopSectionIcon: { color: "#c7902e", fontSize: 14, fontWeight: "900" },
  mobileTopSectionIconActive: { color: "#f0c24d" },
  mobileTopSectionText: { color: "#d7d7d7", fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
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
  tag: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "#1f271f", borderRadius: 999, alignSelf: "flex-start" },
  tagWarning: { backgroundColor: "#3b261c" },
  tagText: { color: "#d7d7d7", fontSize: 11, fontWeight: "700" },
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
});



