import React, { useEffect, useMemo, useState } from "react";
import { useRef } from "react";
import {
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
import * as ImagePicker from "expo-image-picker";
import {
  buyProductOnline,
  depositOnline,
  executeHeistOnline,
  fetchCasinoMeta,
  fetchMarket,
  fetchMe,
  hitBlackjackOnline,
  loginUser,
  playHighRiskOnline,
  previewClubPvpOnline,
  registerUser,
  sellProductOnline,
  startBlackjackOnline,
  standBlackjackOnline,
  syncClientStateOnline,
  withdrawOnline,
} from "./api";
import {
  CLUB_FOUNDING_CASH_COST,
  CLUB_FOUNDING_PREMIUM_COST,
  CLUB_TAKEOVER_COST,
  ENERGY_REGEN_SECONDS,
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
const GANG_TRIBUTE_COOLDOWN_MS = 20 * 60 * 1000;
const CLUB_NIGHT_COOLDOWN_MS = 12 * 60 * 1000;
const CLUB_ESCORT_SEARCH_COST = 450;
const AVATAR_ART = {
  ghost: require("./assets/avatars/avatar-ghost-face.png"),
  razor: require("./assets/avatars/avatar-razor-face.png"),
  saint: require("./assets/avatars/avatar-saint-face.png"),
  vandal: require("./assets/avatars/avatar-vandal-face.png"),
  venom: require("./assets/avatars/avatar-venom-face.png"),
  boss: require("./assets/avatars/avatar-boss-face.png"),
};
const AVATAR_OPTIONS = [
  { id: "ghost", name: "Ghost", sigil: "GX", colors: ["#4f4f52", "#161618"], image: AVATAR_ART.ghost },
  { id: "razor", name: "Razor", sigil: "RZ", colors: ["#6a2a1d", "#1b0d0a"], image: AVATAR_ART.razor },
  { id: "saint", name: "Saint", sigil: "ST", colors: ["#4b3914", "#171109"], image: AVATAR_ART.saint },
  { id: "vandal", name: "Vandal", sigil: "VN", colors: ["#22463f", "#0d1816"], image: AVATAR_ART.vandal },
  { id: "venom", name: "Venom", sigil: "VN", colors: ["#243055", "#0a0e19"], image: AVATAR_ART.venom },
  { id: "boss", name: "Boss", sigil: "$$", colors: ["#5a4b1f", "#171308"], image: AVATAR_ART.boss },
];

const CHARACTER_ARCHETYPES = [
  {
    id: "pimp",
    name: "Pimp",
    sigil: "PM",
    bonus: "Lepszy klub, kontakty i lekki bonus do zarobku z nocy.",
    starter: { respect: 4, attack: 7, defense: 7, dexterity: 8, charisma: 12, energy: 13, hp: 98, cash: 5000000, bank: 250000 },
  },
  {
    id: "fighter",
    name: "Fighter",
    sigil: "FT",
    bonus: "Mocniejszy start do atakow, fightclubu i napadow na grubo.",
    starter: { respect: 3, attack: 12, defense: 10, dexterity: 7, charisma: 5, energy: 14, hp: 108, cash: 5000000, bank: 250000 },
  },
  {
    id: "runner",
    name: "Runner",
    sigil: "RN",
    bonus: "Wysoka zrecznosc i czystsze wejscie/wyjscie z akcji.",
    starter: { respect: 3, attack: 8, defense: 7, dexterity: 13, charisma: 6, energy: 15, hp: 100, cash: 5000000, bank: 250000 },
  },
  {
    id: "broker",
    name: "Broker",
    sigil: "BR",
    bonus: "Lepszy start pod handel, bank i ekonomie zaplecza.",
    starter: { respect: 5, attack: 6, defense: 6, dexterity: 8, charisma: 10, energy: 13, hp: 96, cash: 5000000, bank: 250000 },
  },
];

const PREMIUM_PACKAGES = [
  { id: "starter", name: "Starter Pack", tokens: 5, bonus: "Avatar frame i szybki refill energii", priceLabel: "9,99 zl" },
  { id: "crew", name: "Crew Pack", tokens: 12, bonus: "Gang, rename i zapas premium uslug", priceLabel: "19,99 zl" },
  { id: "boss", name: "Boss Pack", tokens: 30, bonus: "Duzy zapas tokenow pod uslugi i eventy", priceLabel: "39,99 zl" },
];

const PREMIUM_SERVICES = [
  { id: "rename", name: "Zmiana nicku / avatara", cost: 1, description: "Edycja tozsamosci po starcie gry." },
  { id: "archetype", name: "Zmiana archetypu", cost: 2, description: "Respec postaci na nowy styl gry." },
  { id: "refill", name: "Pelna energia", cost: 1, description: "Natychmiastowe doladowanie paska energii." },
  { id: "jailpass", name: "Karta wyjscia z celi", cost: 1, description: "Natychmiastowy reset odsiadki." },
  { id: "gang", name: "Zalozenie gangu", cost: 2, description: "Premium wejscie w zalozenie wlasnej organizacji." },
];

const REFERRAL_MILESTONES = [
  { id: "ref-1", verified: 1, rewardCash: 5000, rewardPremium: 1, rewardRespect: 0 },
  { id: "ref-3", verified: 3, rewardCash: 18000, rewardPremium: 2, rewardRespect: 1 },
  { id: "ref-5", verified: 5, rewardCash: 42000, rewardPremium: 4, rewardRespect: 2 },
  { id: "ref-10", verified: 10, rewardCash: 125000, rewardPremium: 8, rewardRespect: 4 },
];

const CLUB_MARKET = [
  { id: "club-1", name: "Chrome Mirage", ownerLabel: "Miasto", respect: 20, takeoverCost: CLUB_TAKEOVER_COST, popularity: 24, mood: 64, policeBase: 8, note: "Duzy lokal w centrum. Bezpieczniejszy, ale marza nizsza." },
  { id: "club-2", name: "Velvet Ash", ownerLabel: "Grey Saints", respect: 28, takeoverCost: 1950000, popularity: 34, mood: 70, policeBase: 11, note: "Znany punkt na nocnej mapie miasta. Wyzszy ruch i wyzsza uwaga glin." },
  { id: "club-3", name: "Saint Static", ownerLabel: "Cold Avenue", respect: 36, takeoverCost: 3250000, popularity: 46, mood: 73, policeBase: 14, note: "Gruby lokal pod VIP i mocniejszy towar. Wielkie pieniadze, wielka presja." },
];

const HEISTS = HEIST_DEFINITIONS;

const GANG_HEISTS = [
  { id: "pharma", name: "Magazyn farmaceutyczny", respect: 12, minMembers: 3, reward: [9000, 14000], risk: 0.32, energy: 3 },
  { id: "casino", name: "Sejf kasyna", respect: 20, minMembers: 5, reward: [18000, 28000], risk: 0.4, energy: 4 },
  { id: "port", name: "Kontener w porcie", respect: 30, minMembers: 8, reward: [36000, 54000], risk: 0.49, energy: 5 },
  { id: "armory", name: "Sklad wojskowy", respect: 42, minMembers: 12, reward: [65000, 98000], risk: 0.59, energy: 6 },
  { id: "mint", name: "Miejska mennica", respect: 58, minMembers: 18, reward: [120000, 170000], risk: 0.68, energy: 7 },
];

const BUSINESSES = [
  { id: "bar", name: "Bar na zapleczu", respect: 4, cost: 12000, incomePerMinute: 110, kind: "lokal" },
  { id: "club", name: "Klub nocny", respect: 10, cost: 42000, incomePerMinute: 290, kind: "lokal" },
  { id: "garage", name: "Warsztat chop-shop", respect: 15, cost: 78000, incomePerMinute: 540, kind: "przykrywka" },
  { id: "pilllab", name: "Mini fabryka tabletek", respect: 22, cost: 145000, incomePerMinute: 930, kind: "fabryka" },
  { id: "brew", name: "Destylarnia zaplecza", respect: 30, cost: 240000, incomePerMinute: 1450, kind: "fabryka" },
  { id: "tower", name: "Siec lokali premium", respect: 42, cost: 420000, incomePerMinute: 2550, kind: "imperium" },
];

const ESCORTS = [
  { id: "corner", name: "Uliczna panienka", cost: 14000, respect: 6, cashPerMinute: 70, sellPrice: 8500, note: "Tani start pod ulice. Slaby zarobek, ale szybki obrot." },
  { id: "velvet", name: "Klubowa panienka", cost: 42000, respect: 14, cashPerMinute: 210, sellPrice: 26000, note: "Lepsza klientela i mocniejsza dzialka z nocy." },
  { id: "vip", name: "VIP escort", cost: 98000, respect: 24, cashPerMinute: 540, sellPrice: 61000, note: "Droga zabawka pod gruba klientele i powazniejsze stawki." },
];

const STREET_DISTRICTS = [
  { id: "oldtown", name: "Stare Miasto", respect: 0, incomeMultiplier: 0.82, policeRisk: 0.03, beatRisk: 0.04, escapeRisk: 0.015, note: "Najbezpieczniejsza ulica. Mniej hajsu, mniej przypalu." },
  { id: "neon", name: "Neon Avenue", respect: 8, incomeMultiplier: 1, policeRisk: 0.05, beatRisk: 0.06, escapeRisk: 0.025, note: "Srodek miasta. Dobry balans zarobku i przypalu." },
  { id: "strip", name: "Casino Strip", respect: 16, incomeMultiplier: 1.24, policeRisk: 0.08, beatRisk: 0.085, escapeRisk: 0.035, note: "Lepsza klientela i grubsze stawki, ale gliny czesto robia objazd." },
  { id: "harbor", name: "Port Cienia", respect: 24, incomeMultiplier: 1.52, policeRisk: 0.12, beatRisk: 0.11, escapeRisk: 0.05, note: "Najgrubsza kasa z ulicy. Najwiecej przemocy, donosow i znikniec." },
];

const PRODUCTS = MARKET_PRODUCTS;

const DRUGS = [
  { id: "smokes", name: "Fajki", factoryId: "smokeworks", streetPrice: 65, unlockRespect: 0, batchSize: 4, supplies: { tobacco: 2, packaging: 1 }, effect: { defense: 1, charisma: 1 }, durationSeconds: 540, overdoseRisk: 0.01 },
  { id: "spirit", name: "Spirytus", factoryId: "distillery", streetPrice: 95, unlockRespect: 2, batchSize: 3, supplies: { grain: 2, glass: 1 }, effect: { attack: 1, charisma: 1 }, durationSeconds: 360, overdoseRisk: 0.04 },
  { id: "gbl", name: "GBL", factoryId: "wetlab", streetPrice: 180, unlockRespect: 8, batchSize: 2, supplies: { chemicals: 2, solvent: 1, glass: 1 }, effect: { dexterity: 2, charisma: 1 }, durationSeconds: 420, overdoseRisk: 0.07 },
  { id: "salvia", name: "Salvia", factoryId: "greenhouse", streetPrice: 150, unlockRespect: 10, batchSize: 3, supplies: { herbs: 2, packaging: 1 }, effect: { charisma: 2, defense: 1 }, durationSeconds: 480, overdoseRisk: 0.06 },
  { id: "shrooms", name: "Grzybki", factoryId: "greenhouse", streetPrice: 210, unlockRespect: 12, batchSize: 2, supplies: { spores: 2, herbs: 1, packaging: 1 }, effect: { charisma: 2, dexterity: 1 }, durationSeconds: 540, overdoseRisk: 0.08 },
  { id: "hash", name: "Hasz", factoryId: "greenhouse", streetPrice: 260, unlockRespect: 15, batchSize: 2, supplies: { resin: 2, herbs: 1, packaging: 1 }, effect: { defense: 2, charisma: 1 }, durationSeconds: 600, overdoseRisk: 0.07 },
  { id: "weed", name: "Marihuana", factoryId: "greenhouse", streetPrice: 320, unlockRespect: 18, batchSize: 2, supplies: { herbs: 3, packaging: 1 }, effect: { defense: 2, dexterity: 1 }, durationSeconds: 600, overdoseRisk: 0.05 },
  { id: "amphetamine", name: "Amfetamina", factoryId: "powderlab", streetPrice: 480, unlockRespect: 22, batchSize: 2, supplies: { chemicals: 2, pills: 1, packaging: 1 }, effect: { attack: 2, dexterity: 3 }, durationSeconds: 360, overdoseRisk: 0.11 },
  { id: "opium", name: "Opium", factoryId: "poppyworks", streetPrice: 620, unlockRespect: 26, batchSize: 2, supplies: { poppy: 2, glass: 1, packaging: 1 }, effect: { defense: 3, charisma: 1 }, durationSeconds: 420, overdoseRisk: 0.15 },
  { id: "rohypnol", name: "Rohypnol", factoryId: "powderlab", streetPrice: 760, unlockRespect: 30, batchSize: 2, supplies: { pharma: 2, pills: 1, packaging: 1 }, effect: { defense: 3, dexterity: 1 }, durationSeconds: 420, overdoseRisk: 0.17 },
  { id: "cocaine", name: "Kokaina", factoryId: "cartelrefinery", streetPrice: 980, unlockRespect: 34, batchSize: 2, supplies: { coca: 2, solvent: 1, packaging: 1 }, effect: { charisma: 3, dexterity: 4 }, durationSeconds: 300, overdoseRisk: 0.2 },
  { id: "heroin", name: "Heroina", factoryId: "poppyworks", streetPrice: 1320, unlockRespect: 40, batchSize: 1, supplies: { poppy: 3, chemicals: 1, glass: 1 }, effect: { attack: 4, defense: 2 }, durationSeconds: 300, overdoseRisk: 0.26 },
  { id: "lsd", name: "LSD", factoryId: "acidlab", streetPrice: 1580, unlockRespect: 46, batchSize: 1, supplies: { acid: 2, chemicals: 1, glass: 1 }, effect: { charisma: 5, dexterity: 3 }, durationSeconds: 300, overdoseRisk: 0.24 },
  { id: "ecstasy", name: "Extasy", factoryId: "designerlab", streetPrice: 1860, unlockRespect: 50, batchSize: 1, supplies: { pharma: 2, chemicals: 1, pills: 1, packaging: 1 }, effect: { charisma: 4, defense: 2 }, durationSeconds: 300, overdoseRisk: 0.19 },
  { id: "mescaline", name: "Meskalina", factoryId: "designerlab", streetPrice: 2280, unlockRespect: 56, batchSize: 1, supplies: { cactus: 2, chemicals: 1, glass: 1 }, effect: { charisma: 4, dexterity: 2 }, durationSeconds: 300, overdoseRisk: 0.22 },
];

const SUPPLIERS = [
  { id: "tobacco", name: "Tyton i filtry", unit: "karton", price: 70 },
  { id: "grain", name: "Zboze i zacier", unit: "worek", price: 80 },
  { id: "spores", name: "Zarodniki", unit: "zestaw", price: 95 },
  { id: "herbs", name: "Trawa i nasiona", unit: "paczka", price: 55 },
  { id: "resin", name: "Zywica i prasowanka", unit: "kostka", price: 120 },
  { id: "chemicals", name: "Chemia bazowa", unit: "kanister", price: 110 },
  { id: "pharma", name: "Odczynniki farmaceutyczne", unit: "pakiet", price: 170 },
  { id: "pills", name: "Puste kapsuly", unit: "rolka", price: 75 },
  { id: "solvent", name: "Rozpuszczalnik", unit: "baniak", price: 145 },
  { id: "poppy", name: "Mak i lateks", unit: "skrzynka", price: 210 },
  { id: "coca", name: "Liscie koki", unit: "belka", price: 260 },
  { id: "acid", name: "Kwasy laboratoryjne", unit: "pojemnik", price: 290 },
  { id: "cactus", name: "Kaktusy i ekstrakt", unit: "pakiet", price: 240 },
  { id: "glass", name: "Szklo laboratoryjne", unit: "skrzynka", price: 190 },
  { id: "packaging", name: "Pakowanie i woreczki", unit: "karton", price: 60 },
];

const FACTORIES = [
  { id: "smokeworks", name: "Fabryka fajek", respect: 4, cost: 80000, text: "Tani, szybki towar na poczatek i pod lokalne bary.", unlocks: ["smokes"] },
  { id: "distillery", name: "Destylarnia spirytusu", respect: 6, cost: 125000, text: "Spirytus schodzi zawsze, ale wymaga zaplecza i butelek.", unlocks: ["spirit"] },
  { id: "wetlab", name: "Wet Lab GBL", respect: 10, cost: 240000, text: "Chemia klubowa i szybki zarobek przy dobrym ruchu.", unlocks: ["gbl"] },
  { id: "greenhouse", name: "Szklarnie botaniczne", respect: 14, cost: 450000, text: "Salvia, grzybki, hasz i marihuana dla stalych klientow.", unlocks: ["salvia", "shrooms", "hash", "weed"] },
  { id: "powderlab", name: "Laboratorium proszkow", respect: 22, cost: 820000, text: "Amfetamina i rohypnol, czyli mocniejszy towar z wiekszym ryzykiem.", unlocks: ["amphetamine", "rohypnol"] },
  { id: "poppyworks", name: "Zaklad opium i heroiny", respect: 30, cost: 1250000, text: "Ciezki zarobek, ciezkie ryzyko i bardzo mocny towar.", unlocks: ["opium", "heroin"] },
  { id: "cartelrefinery", name: "Rafineria kokainy", respect: 36, cost: 1800000, text: "Kokaina daje wielkie pieniadze, ale wymaga solidnego lancucha dostaw.", unlocks: ["cocaine"] },
  { id: "acidlab", name: "Acid Lab", respect: 44, cost: 2550000, text: "Produkcja LSD pod najbardziej odklejonych klientow miasta.", unlocks: ["lsd"] },
  { id: "designerlab", name: "Designer Lab", respect: 52, cost: 3600000, text: "Extasy i meskalina dla topowego rynku i najbogatszych ekip.", unlocks: ["ecstasy", "mescaline"] },
];

const RESTAURANT_ITEMS = [
  { id: "burger", name: "Burger uliczny", energy: 3, price: 90 },
  { id: "kebab", name: "Kebab XXL", energy: 5, price: 180 },
  { id: "meal", name: "Obiad ochrony", energy: 8, price: 320 },
  { id: "energybox", name: "Box energetyczny", energy: 12, price: 650 },
];

const GYM_PASSES = [
  { id: "day", name: "Karnet 1 dzien", price: 350, durationMs: 24 * 60 * 60 * 1000 },
  { id: "week", name: "Karnet 7 dni", price: 1800, durationMs: 7 * 24 * 60 * 60 * 1000 },
  { id: "perm", name: "Karnet na stale", price: 8500, durationMs: null },
];

const GYM_EXERCISES = [
  { id: "power", name: "Lawka i ciezary", costEnergy: 2, gains: { attack: 2 }, note: "+2 atak" },
  { id: "guard", name: "Tarcze i obrona", costEnergy: 2, gains: { defense: 2 }, note: "+2 obrona" },
  { id: "reflex", name: "Sprint i refleks", costEnergy: 2, gains: { dexterity: 2 }, note: "+2 zrecznosc" },
  { id: "conditioning", name: "Obwod kondycyjny", costEnergy: 3, gains: { maxHp: 8, hp: 8 }, note: "+8 zdrowie max" },
];

const MARKET = PRODUCTS.reduce((acc, item, index) => {
  acc[item.id] = Math.round(item.basePrice * (1 + ((index % 3) - 1) * 0.08));
  return acc;
}, {});

const DEALER_START_STOCK = DRUGS.reduce((acc, drug, index) => {
  acc[drug.id] = Math.max(20, 90 - index * 4);
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
  smokes: { emoji: "🚬", code: "FK", colors: ["#6a5540", "#231a12"] },
  spirit: { emoji: "🥃", code: "SP", colors: ["#7b5529", "#261709"] },
  gbl: { emoji: "🧪", code: "GB", colors: ["#32696b", "#0f2021"] },
  salvia: { emoji: "🍃", code: "SV", colors: ["#3a7841", "#102313"] },
  shrooms: { emoji: "🍄", code: "GR", colors: ["#8a4435", "#2a120d"] },
  hash: { emoji: "🌿", code: "HS", colors: ["#55763b", "#162010"] },
  weed: { emoji: "🌱", code: "MJ", colors: ["#4d9d55", "#132715"] },
  amphetamine: { emoji: "⚡", code: "AM", colors: ["#8a7136", "#2b210d"] },
  opium: { emoji: "🌺", code: "OP", colors: ["#8f4d62", "#251018"] },
  rohypnol: { emoji: "💊", code: "RH", colors: ["#6273af", "#161c34"] },
  cocaine: { emoji: "❄️", code: "KK", colors: ["#8eb4c7", "#17313b"] },
  heroin: { emoji: "💉", code: "HR", colors: ["#88545f", "#2d1419"] },
  lsd: { emoji: "🌀", code: "LSD", colors: ["#6a57a8", "#1c1431"] },
  ecstasy: { emoji: "💿", code: "EX", colors: ["#b86297", "#351125"] },
  mescaline: { emoji: "🌵", code: "MS", colors: ["#5c8f54", "#182716"] },
};

const BUSINESS_VISUALS = {
  bar: { emoji: "🍺", code: "BAR", colors: ["#8b6329", "#251708"] },
  club: { emoji: "🎧", code: "VIP", colors: ["#7c315e", "#240d1c"], image: UI_ICON_ART.club },
  garage: { emoji: "🔧", code: "GAR", colors: ["#66727d", "#1a1f24"] },
  pilllab: { emoji: "💊", code: "LAB", colors: ["#6579af", "#171b35"] },
  brew: { emoji: "🥃", code: "DST", colors: ["#93622f", "#261607"] },
  tower: { emoji: "🏙️", code: "IMP", colors: ["#51637c", "#121820"], image: UI_ICON_ART.cash },
};

const ESCORT_VISUALS = {
  corner: { emoji: "💋", code: "UL", colors: ["#934050", "#280d15"], image: ESCORT_ART.corner },
  velvet: { emoji: "👠", code: "VIP", colors: ["#a2557d", "#32111f"], image: ESCORT_ART.velvet },
  vip: { emoji: "💎", code: "LUX", colors: ["#b57c34", "#2e1a08"], image: ESCORT_ART.vip },
};

const GANG_VISUALS = {
  "Grey Saints": { emoji: "✝️", code: "GS", colors: ["#6f6f74", "#141418"], image: GANG_ART.greySaints },
  "Cold Avenue": { emoji: "🚘", code: "CA", colors: ["#4d6f94", "#10161f"], image: GANG_ART.coldAvenue },
  "Night Vultures": { emoji: "🦅", code: "NV", colors: ["#8b5439", "#1b0d09"], image: GANG_ART.nightVultures },
  "Velvet Ash": { emoji: "♠️", code: "VA", colors: ["#98577d", "#1b0d16"], image: GANG_ART.velvetAsh },
  default: { emoji: "👥", code: "HC", colors: ["#7e5f2b", "#1a1208"], image: GANG_ART.default },
};

const FACTORY_VISUALS = {
  smokeworks: { emoji: "🚬", code: "FK", colors: ["#6a5540", "#231a12"] },
  distillery: { emoji: "🥃", code: "SP", colors: ["#7b5529", "#261709"] },
  wetlab: { emoji: "🧪", code: "GBL", colors: ["#32696b", "#0f2021"] },
  greenhouse: { emoji: "🌿", code: "BOT", colors: ["#3f7f42", "#112113"] },
  powderlab: { emoji: "⚗️", code: "PDR", colors: ["#80704e", "#211b10"] },
  poppyworks: { emoji: "🌺", code: "OP", colors: ["#8f4d62", "#251018"] },
  cartelrefinery: { emoji: "❄️", code: "KK", colors: ["#8eb4c7", "#17313b"] },
  acidlab: { emoji: "🌀", code: "LSD", colors: ["#6a57a8", "#1c1431"] },
  designerlab: { emoji: "💿", code: "DSN", colors: ["#b86297", "#351125"] },
};

const PRODUCT_VISUALS = {
  smoke: { emoji: "📦", code: "SM", colors: ["#6a5540", "#231a12"] },
  spirytus: { emoji: "🥃", code: "AL", colors: ["#7b5529", "#261709"] },
  weed: { emoji: "🌿", code: "WE", colors: ["#4d9d55", "#132715"] },
  speed: { emoji: "⚡", code: "SP", colors: ["#8a7136", "#2b210d"] },
  oxy: { emoji: "💊", code: "OX", colors: ["#6273af", "#161c34"] },
  coke: { emoji: "❄️", code: "CK", colors: ["#8eb4c7", "#17313b"] },
  crystal: { emoji: "💠", code: "CR", colors: ["#5a80ad", "#13203a"] },
};

const WORLD_PLAYERS = [
  { id: "wp-1", name: "Mako", gang: "Grey Saints", respect: 31, cash: 86400, attack: 28, defense: 24, dexterity: 22, charisma: 14, bounty: 3200, online: true, heists: 72, casino: 8 },
  { id: "wp-2", name: "Dice", gang: "Cold Avenue", respect: 26, cash: 54300, attack: 22, defense: 18, dexterity: 19, charisma: 15, bounty: 1800, online: false, heists: 49, casino: 11 },
  { id: "wp-3", name: "Yuri", gang: "No gang", respect: 18, cash: 21900, attack: 14, defense: 13, dexterity: 17, charisma: 10, bounty: 900, online: true, heists: 28, casino: 2 },
  { id: "wp-4", name: "Twitch", gang: "Night Vultures", respect: 37, cash: 127000, attack: 26, defense: 21, dexterity: 29, charisma: 12, bounty: 4600, online: true, heists: 91, casino: 19 },
  { id: "wp-5", name: "Loco", gang: "No gang", respect: 15, cash: 16700, attack: 16, defense: 12, dexterity: 13, charisma: 8, bounty: 700, online: true, heists: 22, casino: 1 },
  { id: "wp-6", name: "Vera", gang: "Velvet Ash", respect: 42, cash: 188000, attack: 25, defense: 24, dexterity: 31, charisma: 23, bounty: 6100, online: false, heists: 110, casino: 27 },
];

const WORLD_GANGS = [
  {
    id: "gang-grey-saints",
    name: "Grey Saints",
    boss: "Mako",
    viceBoss: "Ash",
    trusted: 4,
    members: 9,
    respect: 31,
    ranking: 2,
    territory: 2,
    influence: 16,
    vault: 48200,
    description: "Stara ekipa od haraczu, klubow i napadow na hurtownie.",
  },
  {
    id: "gang-cold-avenue",
    name: "Cold Avenue",
    boss: "Dice",
    viceBoss: "Razor",
    trusted: 3,
    members: 6,
    respect: 26,
    ranking: 5,
    territory: 1,
    influence: 11,
    vault: 27300,
    description: "Mniejsza, ale bardzo ruchliwa grupa od szybkich akcji i handlu.",
  },
  {
    id: "gang-night-vultures",
    name: "Night Vultures",
    boss: "Twitch",
    viceBoss: "Marv",
    trusted: 5,
    members: 11,
    respect: 37,
    ranking: 1,
    territory: 3,
    influence: 21,
    vault: 76100,
    description: "Ekipa od grubych napadow i nocnego biznesu, bardzo agresywna na miescie.",
  },
  {
    id: "gang-velvet-ash",
    name: "Velvet Ash",
    boss: "Vera",
    viceBoss: "Noir",
    trusted: 4,
    members: 8,
    respect: 42,
    ranking: 3,
    territory: 2,
    influence: 18,
    vault: 92600,
    description: "Gang mocno wkrecony w VIP kluby, eskorte i najdrozszy towar.",
  },
];

const TAB_DEFINITIONS = [
  { id: "city", label: "Miasto", sections: [{ id: "dashboard", label: "Start", title: "Miasto" }, { id: "tasks", label: "Misje", title: "Zadania" }, { id: "bank", label: "Bank", title: "Bank" }, { id: "gym", label: "Silka", title: "Silownia" }, { id: "restaurant", label: "Jedzenie", title: "Restauracja" }, { id: "hospital", label: "Medyk", title: "Szpital" }, { id: "casino", label: "Kasyno", title: "Kasyno" }] },
  { id: "heists", label: "Akcje", sections: [{ id: "solo", label: "Solo", title: "Napady" }, { id: "gang", label: "Ekipa", title: "Napady gangu" }, { id: "fightclub", label: "Fight", title: "Fightclub" }, { id: "prison", label: "Cela", title: "Wiezienie" }] },
  { id: "empire", label: "Biznes", sections: [{ id: "businesses", label: "Cash", title: "Biznesy" }, { id: "factories", label: "Fabryki", title: "Fabryki" }, { id: "suppliers", label: "Dostawy", title: "Hurtownie" }, { id: "club", label: "Klub", title: "Klub" }] },
  { id: "market", label: "Rynek", sections: [{ id: "street", label: "Handel", title: "Handel" }, { id: "drugs", label: "Towar", title: "Narkotyki" }, { id: "boosts", label: "Boosty", title: "Boosty" }] },
  { id: "gang", label: "Gang", sections: [{ id: "overview", label: "Gang", title: "Gang" }, { id: "members", label: "Sklad", title: "Czlonkowie" }, { id: "chat", label: "Chat", title: "Chat gangu" }, { id: "ops", label: "Akcje", title: "Operacje" }] },
  { id: "online", label: "Social", sections: [{ id: "players", label: "Ludzie", title: "Gracze" }, { id: "friends", label: "Znajomi", title: "Znajomi" }, { id: "messages", label: "Msg", title: "Wiadomosci" }, { id: "rankings", label: "Top", title: "Rankingi" }] },
  { id: "premium", label: "Sklep", sections: [{ id: "shop", label: "Sklep", title: "Mikroplatnosci" }, { id: "services", label: "Uslugi", title: "Uslugi premium" }, { id: "referrals", label: "Polecaj", title: "Program polecen" }] },
  { id: "profile", label: "Profil", sections: [{ id: "summary", label: "Profil", title: "Profil" }, { id: "progress", label: "Ranga", title: "Szacun" }, { id: "protection", label: "Ochrona", title: "Ochrona" }, { id: "log", label: "Log", title: "Log wydarzen" }] },
];

const DEFAULT_SECTIONS = TAB_DEFINITIONS.reduce((acc, tab) => {
  acc[tab.id] = tab.sections[0].id;
  return acc;
}, {});

const INITIAL = {
  player: {
    name: "Vin Blaze",
    avatarId: "ghost",
    avatarCustomUri: null,
    rank: "Mlody wilk",
    cash: 5000000,
    bank: 250000,
    premiumTokens: 3,
    energy: 14,
    maxEnergy: 14,
    hp: 100,
    maxHp: 100,
    respect: 7,
    attack: 11,
    defense: 8,
    dexterity: 7,
    charisma: 6,
    heat: 6,
    gymPassTier: null,
    gymPassUntil: null,
    jailUntil: null,
  },
  stats: { heistsDone: 0, heistsWon: 0, totalEarned: 0, gangHeistsWon: 0, casinoWins: 0, drugBatches: 0 },
  gang: {
    joined: false,
    role: null,
    name: null,
    members: 0,
    maxMembers: 30,
    territory: 0,
    influence: 0,
    vault: 0,
    inviteRespectMin: 15,
    createCost: 2,
    chat: [],
    lastTributeAt: 0,
    gearScore: 62,
    jailedCrew: 0,
    crewLockdownUntil: 0,
    membersList: [],
    invites: [
      { id: "inv-1", gangName: "Grey Saints", leader: "Mako", members: 9, territory: 2, inviteRespectMin: 15 },
      { id: "inv-2", gangName: "Cold Avenue", leader: "Dice", members: 6, territory: 1, inviteRespectMin: 18 },
    ],
  },
  businessesOwned: [],
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
    note: null,
    lastRunAt: 0,
    stash: createDrugCounterMap(),
  },
  clubListings: createClubListings(),
  supplies: SUPPLIERS.reduce((acc, item) => {
    acc[item.id] = item.id === "tobacco" ? 2 : item.id === "grain" ? 1 : item.id === "herbs" ? 2 : 0;
    return acc;
  }, {}),
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
  lastTick: Date.now(),
  log: [
    "Hustle City wrze. Lokalne ekipy testuja kazdy nowy ruch na dzielni.",
    "Potrzebujesz szacunu, hajsu i zaplecza, zeby wejsc na wyzszy poziom.",
  ],
  prisonChat: [
    { id: "pr-1", author: "Bolo", text: "Kto ma kontakt na szybsza kaucje?", time: "13:58" },
    { id: "pr-2", author: "Koks", text: "W celi obok siedzi ekipa po skoku na kantor.", time: "14:04" },
  ],
  online: {
    roster: [],
    selectedPlayerId: null,
    selectedGangId: null,
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
  collections: {
    businessCash: 0,
    escortCash: 0,
    businessCollectedAt: null,
    escortCollectedAt: null,
  },
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
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

function getBusinessIncomePerMinute(state) {
  return state.businessesOwned.reduce((sum, owned) => {
    const business = BUSINESSES.find((entry) => entry.id === owned.id);
    return sum + (business ? business.incomePerMinute * owned.count : 0);
  }, 0);
}

function getEscortIncomePerMinute(state) {
  return state.escortsOwned.reduce((sum, owned) => {
    const escort = ESCORTS.find((entry) => entry.id === owned.id);
    if (!escort) return sum;
    return (
      sum +
      Object.entries(getEscortRoutes(owned)).reduce((routeSum, [districtId, count]) => {
        const district = STREET_DISTRICTS.find((entry) => entry.id === districtId) || STREET_DISTRICTS[0];
        return routeSum + escort.cashPerMinute * district.incomeMultiplier * count;
      }, 0)
    );
  }, 0);
}

function getEscortRoutes(owned) {
  if (!owned) return {};
  if (owned.routes) return owned.routes;
  if (owned.working) return { [STREET_DISTRICTS[0].id]: owned.working };
  return {};
}

function getEscortWorkingCount(owned) {
  return Object.values(getEscortRoutes(owned)).reduce((sum, count) => sum + count, 0);
}

function getOwnedEscort(state, escortId) {
  return state.escortsOwned.find((entry) => entry.id === escortId);
}

function getEscortReserveCount(state, escortId) {
  const owned = getOwnedEscort(state, escortId);
  if (!owned) return 0;
  return Math.max(0, owned.count - getEscortWorkingCount(owned));
}

function getEscortDistrictCount(state, escortId, districtId) {
  const owned = getOwnedEscort(state, escortId);
  return getEscortRoutes(owned)[districtId] || 0;
}

function getCollectionTimeToCap(currentAmount, incomePerMinute) {
  if (incomePerMinute <= 0) return null;
  const cap = getPassiveCapAmount(incomePerMinute);
  if (currentAmount >= cap) return 0;
  return ((cap - currentAmount) / incomePerMinute) * 60 * 1000;
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
  return CLUB_MARKET.map((club) => ({ ...club }));
}

function canRunGangHeistRole(role) {
  return role === "Boss" || role === "Vice Boss" || role === "Zaufany";
}

function getGangProfileByName(game, gangName) {
  if (!gangName || gangName === "No gang") return null;
  if (game.gang.joined && game.gang.name === gangName) {
    return {
      id: "self-gang",
      name: game.gang.name,
      boss: game.gang.membersList.find((member) => member.role === "Boss")?.name || game.player.name,
      viceBoss: game.gang.membersList.find((member) => member.role === "Vice Boss")?.name || "-",
      trusted: game.gang.membersList.filter((member) => member.role === "Zaufany").length,
      members: game.gang.members,
      respect: game.player.respect,
      ranking: 4,
      territory: game.gang.territory,
      influence: game.gang.influence,
      vault: game.gang.vault,
      description: "Twoja aktualna organizacja. Tu zarzadzasz ludzmi, zaufaniem i grubymi robotami.",
      membersList: game.gang.membersList,
      eventLog: game.gang.chat,
      self: true,
    };
  }

  const gang = WORLD_GANGS.find((entry) => entry.name === gangName);
  if (!gang) return null;

  const rosterMembers = WORLD_PLAYERS.filter((player) => player.gang === gangName).map((player) => ({
    id: `member-${player.id}`,
    name: player.name,
    role: player.name === gang.boss ? "Boss" : player.name === gang.viceBoss ? "Vice Boss" : player.respect >= gang.respect - 8 ? "Zaufany" : "Czlonek",
    trusted: player.name === gang.boss || player.name === gang.viceBoss || player.respect >= gang.respect - 8,
    respect: player.respect,
    online: player.online,
  }));
  const existingNames = new Set(rosterMembers.map((member) => member.name));

  if (!existingNames.has(gang.boss)) {
    rosterMembers.unshift({ id: `member-boss-${gang.id}`, name: gang.boss, role: "Boss", trusted: true, respect: gang.respect + 6, online: true });
  }
  if (gang.viceBoss && !existingNames.has(gang.viceBoss)) {
    rosterMembers.push({ id: `member-vb-${gang.id}`, name: gang.viceBoss, role: "Vice Boss", trusted: true, respect: Math.max(12, gang.respect - 2), online: true });
  }

  const fillerNames = ["Shade", "Kilo", "Moss", "Tara", "Vex", "Nails", "Iris", "Rook", "Glen", "Hex"];
  let fillerIndex = 0;
  while (rosterMembers.length < gang.members) {
    const fillerName = `${fillerNames[fillerIndex % fillerNames.length]} ${fillerIndex + 1}`;
    rosterMembers.push({
      id: `member-fill-${gang.id}-${fillerIndex}`,
      name: fillerName,
      role: fillerIndex < gang.trusted ? "Zaufany" : "Czlonek",
      trusted: fillerIndex < gang.trusted,
      respect: Math.max(8, gang.respect - 12 + fillerIndex * 2),
      online: fillerIndex % 2 === 0,
    });
    fillerIndex += 1;
  }

  const eventLog = [
    { id: `event-${gang.id}-1`, author: "System", text: `${gang.name} trzyma ${gang.territory} dzielnice i skarbiec ${formatMoney(gang.vault)}.`, time: "00:14" },
    { id: `event-${gang.id}-2`, author: gang.boss, text: "Miasto musi czuc, kto tu rozdaje karty po zmroku.", time: "23:51" },
    { id: `event-${gang.id}-3`, author: "System", text: `Ostatnie ruchy wskazuja na ${gang.influence} pkt wplywu i ranking #${gang.ranking}.`, time: "22:40" },
    { id: `event-${gang.id}-4`, author: gang.viceBoss, text: "Sklad jest gotowy do kolejnej roboty, ale tylko z zaufanymi na froncie.", time: "21:19" },
  ];

  return {
    ...gang,
    membersList: rosterMembers.slice(0, gang.members),
    eventLog,
    self: false,
  };
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
      note: club.note || "Prywatny lokal postawiony na grubej kasie i ryzyku.",
    },
    ...updated,
  ];
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
      note: game.club.note,
    };
  }
  return null;
}

function getClubVenueProfile(game, venue) {
  if (!venue) {
    return {
      escortBonus: 0,
      contactChance: 0,
      drugChance: 0,
      eventChance: 0,
      salesMultiplier: 1,
      raidModifier: 1,
      label: "Poza lokalem",
    };
  }

  const popularity = venue.popularity || 0;
  const mood = venue.mood || 0;
  const respect = venue.respect || 0;
  const policeBase = venue.policeBase || 0;
  const prestige = popularity * 0.6 + mood * 0.32 + respect * 0.22 - policeBase * 1.4;

  const escortBonus = clamp(0.008 + popularity * 0.0012 + mood * 0.0006 - policeBase * 0.0008, 0.008, 0.09);
  const contactChance = clamp(0.06 + popularity * 0.0022 + mood * 0.0014 - policeBase * 0.001, 0.06, 0.34);
  const drugChance = clamp(0.05 + popularity * 0.002 + respect * 0.0018 - policeBase * 0.0011, 0.05, 0.32);
  const eventChance = clamp(0.08 + popularity * 0.0018 + mood * 0.0012, 0.08, 0.36);
  const salesMultiplier = clamp(1 + popularity / 180 + mood / 260, 1, 1.85);
  const raidModifier = clamp(1 + policeBase / 40 - mood / 500, 0.92, 1.3);

  const label =
    prestige >= 78
      ? "Topowy lokal. VIP-y, kontakty i gruby ruch."
      : prestige >= 52
        ? "Mocny klub z dobrym obrotem i kontaktami."
        : "Sredni lokal. Cos sie dzieje, ale bez szalu.";

  return { escortBonus, contactChance, drugChance, eventChance, salesMultiplier, raidModifier, label };
}

function getDrugPoliceProfile(drug) {
  const risk = clamp(0.04 + drug.unlockRespect * 0.0045 + drug.streetPrice / 9000 + drug.overdoseRisk * 0.28, 0.05, 0.48);
  const heatGain = Math.max(1, Math.round(drug.unlockRespect / 10 + drug.streetPrice / 1200));
  const label = risk >= 0.32 ? "Bardzo goraco" : risk >= 0.2 ? "Srednie ryzyko" : "Raczej cicho";

  return { risk, heatGain, label };
}

function getClubPoliceProfile(game) {
  if (!game.club.owned) {
    return { pressure: 0, raidChance: 0, totalUnits: 0, label: "Brak lokalu" };
  }

  const totalUnits = DRUGS.reduce((sum, drug) => sum + (game.club.stash[drug.id] || 0), 0);
  const stashSignal = DRUGS.reduce((sum, drug) => {
    const police = getDrugPoliceProfile(drug);
    return sum + (game.club.stash[drug.id] || 0) * (drug.streetPrice / 220 + police.risk * 12);
  }, 0);
  const pressure = clamp(
    game.club.policeBase * 3 + totalUnits * 1.8 + stashSignal / 18 + game.club.popularity * 0.45 + game.player.heat * 0.65,
    0,
    100
  );
  const raidChance = clamp(0.04 + pressure / 180, 0.05, 0.72);
  const label = raidChance >= 0.45 ? "Nalot bardzo realny" : raidChance >= 0.28 ? "Gliny cos czuja" : "W granicach rozsadku";

  return { pressure, raidChance, totalUnits, label };
}

function getSoloHeistOdds(player, effectivePlayer, gang, heist) {
  const playerPower = effectivePlayer.attack * 1.25 + effectivePlayer.defense * 0.85 + effectivePlayer.dexterity * 1.5 + player.respect * 0.45;
  const heistDifficulty = heist.respect * 1.75 + heist.energy * 4 + heist.risk * 55;
  const chance = clamp(0.42 + (playerPower - heistDifficulty) / 115 + gang.members * 0.0025 - player.heat * 0.0025, 0.05, 0.92);
  const jailChance = clamp(heist.risk * 0.8 + player.heat * 0.005 - effectivePlayer.defense * 0.006 - effectivePlayer.dexterity * 0.004, 0.08, 0.68);

  return { chance, jailChance };
}

function getGangHeistOdds(player, effectivePlayer, gang, heist) {
  const gangPower =
    effectivePlayer.attack * 1.1 +
    effectivePlayer.defense * 0.8 +
    effectivePlayer.dexterity * 1.0 +
    player.respect * 0.45 +
    gang.members * 2.4 +
    gang.influence * 1.2;
  const gangDifficulty = heist.respect * 1.5 + heist.energy * 5 + heist.minMembers * 4 + heist.risk * 60;
  const chance = clamp(0.35 + (gangPower - gangDifficulty) / 140 - player.heat * 0.002, 0.06, 0.9);

  return { chance };
}

function getTaskStates(game) {
  const tasks = [
    { id: "gym-pass", title: "Wejdz na silownie", description: "Kup dowolny karnet na silownie.", completed: hasGymPass(game.player), rewardCash: 500, rewardRespect: 2 },
    { id: "first-wave", title: "Pierwsza fala napadow", description: "Wykonaj 3 napady.", completed: game.stats.heistsDone >= 3, rewardCash: 900, rewardRespect: 2 },
    { id: "crew", title: "Rozbuduj ekipe", description: "Miej przynajmniej 6 ludzi w gangu.", completed: game.gang.members >= 6, rewardCash: 1300, rewardRespect: 3 },
    { id: "lab", title: "Odpal pierwsza partie", description: "Wyprodukuj 2 partie dragow.", completed: game.stats.drugBatches >= 2, rewardCash: 2000, rewardRespect: 4 },
    { id: "club", title: "Otworz klub", description: "Przejmij lub otworz swoj klub.", completed: game.club.owned, rewardCash: 3000, rewardRespect: 4 },
  ];

  return tasks.map((task) => ({ ...task, claimed: game.tasksClaimed.includes(task.id) }));
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
  return (
    <View style={styles.sceneArtwork}>
      {source ? (
        <ImageBackground source={source} style={styles.sceneArtworkBackdrop} imageStyle={styles.sceneArtworkImage} />
      ) : (
        <LinearGradient colors={accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sceneArtworkBackdrop} />
      )}
      <LinearGradient colors={["rgba(0,0,0,0.12)", "rgba(0,0,0,0.56)", "rgba(0,0,0,0.9)"]} start={{ x: 0.2, y: 0 }} end={{ x: 0.7, y: 1 }} style={styles.sceneArtworkTint} />
      <View style={styles.sceneGlow} />
      <View style={styles.sceneBars}>
        {[44, 82, 58, 116, 72, 94, 52].map((height, index) => (
          <View key={`${title}-${index}`} style={[styles.sceneBar, { height }]} />
        ))}
      </View>
      <View style={styles.sceneCopy}>
        <Text style={styles.sceneEyebrow}>{eyebrow}</Text>
        <Text style={styles.sceneTitle}>{title}</Text>
        {lines.map((line, index) => (
          <Text key={`${title}-line-${index}`} style={styles.sceneLine}>
            {line}
          </Text>
        ))}
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
  const safeVisual = visual || { emoji: "⬛", code: "HC", colors: ["#3a3a3a", "#111111"] };
  return (
    <LinearGradient colors={safeVisual.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.entityBadge, large && styles.entityBadgeLarge]}>
      <View style={styles.entityBadgeGlow} />
      {safeVisual.image ? (
        <>
          <Image source={safeVisual.image} style={styles.entityImage} resizeMode="cover" />
          <LinearGradient colors={["rgba(0,0,0,0.04)", "rgba(0,0,0,0.22)", "rgba(0,0,0,0.76)"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.entityImageTint} />
        </>
      ) : (
        <View style={styles.entityEmojiWrap}>
          <Text style={[styles.entityEmoji, large && styles.entityEmojiLarge]}>{safeVisual.emoji}</Text>
        </View>
      )}
      <View style={styles.entityCodePill}>
        <Text style={styles.entityCode}>{safeVisual.code}</Text>
      </View>
    </LinearGradient>
  );
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
  const [tab, setTab] = useState("city");
  const [sectionByTab, setSectionByTab] = useState(DEFAULT_SECTIONS);
  const [sessionToken, setSessionToken] = useState(null);
  const [apiStatus, setApiStatus] = useState("offline");
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [startupError, setStartupError] = useState("");
  const [mobileHudOpen, setMobileHudOpen] = useState(false);
  const [gangMessage, setGangMessage] = useState("");
  const [prisonMessage, setPrisonMessage] = useState("");
  const [gangDraftName, setGangDraftName] = useState("Night Reign");
  const [bankAmountDraft, setBankAmountDraft] = useState("1000");
  const [notice, setNotice] = useState(null);
  const noticeOpacity = useRef(new Animated.Value(0)).current;
  const noticeTranslateY = useRef(new Animated.Value(-12)).current;
  const previousGameRef = useRef(INITIAL);
  const pageScrollRef = useRef(null);
  const didHydrateFeedbackRef = useRef(false);
  const lastExplicitNoticeAtRef = useRef(0);
  const didHydrateSessionRef = useRef(false);
  const lastSyncedGameRef = useRef("");
  const [gangProfileView, setGangProfileView] = useState("actions");
  const [casinoState, setCasinoState] = useState({
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
  const activeSectionId = sectionByTab[tab] || activeTab.sections[0].id;
  const activeSection = activeTab.sections.find((entry) => entry.id === activeSectionId) || activeTab.sections[0];
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
  const successRate = game.stats.heistsDone > 0 ? Math.round((game.stats.heistsWon / game.stats.heistsDone) * 100) : 0;
  const jailRemaining = game.player.jailUntil ? Math.max(0, game.player.jailUntil - Date.now()) : 0;
  const taskStates = useMemo(() => getTaskStates(game), [game]);
  const inGang = Boolean(game.gang.joined);
  const gangTributeRemaining = Math.max(0, GANG_TRIBUTE_COOLDOWN_MS - (Date.now() - (game.gang.lastTributeAt || 0)));
  const clubNightRemaining = Math.max(0, CLUB_NIGHT_COOLDOWN_MS - (Date.now() - (game.club.lastRunAt || 0)));
  const crewLockdownRemaining = Math.max(0, (game.gang.crewLockdownUntil || 0) - Date.now());

  const mergeServerUser = (serverUser, marketPayload) => {
    const safeProfile = serverUser?.profile;
    if (!safeProfile) {
      throw new Error("Backend zwrocil niepelny profil gracza.");
    }

    setGame((prev) => ({
      ...prev,
      player: {
        ...prev.player,
        name: safeProfile.name || prev.player.name,
        avatarId: safeProfile.avatarId || prev.player.avatarId,
        avatarCustomUri: typeof safeProfile.avatarCustomUri === "string" ? safeProfile.avatarCustomUri : prev.player.avatarCustomUri,
        rank: getRankTitle(safeProfile.respect ?? prev.player.respect),
        cash: Number.isFinite(safeProfile.cash) ? safeProfile.cash : prev.player.cash,
        energy: Number.isFinite(safeProfile.energy) ? safeProfile.energy : prev.player.energy,
        maxEnergy: Number.isFinite(safeProfile.maxEnergy) ? safeProfile.maxEnergy : prev.player.maxEnergy,
        hp: clamp(Number.isFinite(safeProfile.hp) ? safeProfile.hp : prev.player.hp, 0, prev.player.maxHp),
        respect: Number.isFinite(safeProfile.respect) ? safeProfile.respect : prev.player.respect,
        attack: Number.isFinite(safeProfile.attack) ? safeProfile.attack : prev.player.attack,
        defense: Number.isFinite(safeProfile.defense) ? safeProfile.defense : prev.player.defense,
        dexterity: Number.isFinite(safeProfile.dexterity) ? safeProfile.dexterity : prev.player.dexterity,
        charisma: Number.isFinite(safeProfile.charisma) ? safeProfile.charisma : prev.player.charisma,
        heat: Number.isFinite(safeProfile.heat) ? safeProfile.heat : prev.player.heat,
        bank: Number.isFinite(safeProfile.bank) ? safeProfile.bank : prev.player.bank,
      },
      stats: { ...prev.stats, ...(serverUser?.stats || {}) },
      inventory: serverUser.inventory || prev.inventory,
      log: Array.isArray(serverUser?.log) && serverUser.log.length ? serverUser.log : prev.log,
      ...normalizeMarketPayload(marketPayload, prev.market, prev.marketState, prev.marketMeta),
      }));
    };

  const restoreClientGameSnapshot = (snapshot) => {
      if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
        return;
      }

      const legacyFactoryState = snapshot.factoryState || {};
      const normalizedFactoriesOwned = (() => {
        if (snapshot.factoriesOwned && typeof snapshot.factoriesOwned === "object" && !Array.isArray(snapshot.factoriesOwned)) {
          return snapshot.factoriesOwned;
        }

        if (Array.isArray(legacyFactoryState.ownedFactories)) {
          return legacyFactoryState.ownedFactories.reduce((acc, entry) => {
            if (!entry) return acc;
            if (typeof entry === "string") {
              acc[entry] = Math.max(1, acc[entry] || 0);
              return acc;
            }
            if (typeof entry === "object" && typeof entry.id === "string") {
              acc[entry.id] = Number.isFinite(entry.count) ? Math.max(0, entry.count) : Math.max(1, acc[entry.id] || 0);
            }
            return acc;
          }, {});
        }

        return INITIAL.factoriesOwned;
      })();

      setGame({
        ...INITIAL,
        ...snapshot,
        player: { ...INITIAL.player, ...(snapshot.player || {}), avatarCustomUri: typeof snapshot.player?.avatarCustomUri === "string" ? snapshot.player.avatarCustomUri : INITIAL.player.avatarCustomUri },
        stats: { ...INITIAL.stats, ...(snapshot.stats || {}) },
        inventory: { ...INITIAL.inventory, ...(snapshot.inventory || {}) },
        market: { ...INITIAL.market, ...(snapshot.market || {}) },
        marketState: { ...INITIAL.marketState, ...(snapshot.marketState || {}) },
        marketMeta: { ...INITIAL.marketMeta, ...(snapshot.marketMeta || {}) },
        collections: { ...INITIAL.collections, ...(snapshot.collections || {}) },
        gang: { ...INITIAL.gang, ...(snapshot.gang || {}) },
        club: { ...INITIAL.club, ...(snapshot.club || {}) },
        referrals: { ...INITIAL.referrals, ...(snapshot.referrals || {}) },
        online: {
          ...INITIAL.online,
          ...(snapshot.online || {}),
          roster: [],
        },
        supplierStock: { ...INITIAL.supplierStock, ...(snapshot.supplierStock || {}) },
        supplierOrderDraft: { ...INITIAL.supplierOrderDraft, ...(snapshot.supplierOrderDraft || {}) },
        dealerStock: { ...INITIAL.dealerStock, ...(snapshot.dealerStock || {}) },
        factoriesOwned: normalizedFactoriesOwned,
        gangInvites: Array.isArray(snapshot.gangInvites) ? snapshot.gangInvites : INITIAL.gangInvites,
        clubMarket: Array.isArray(snapshot.clubMarket) ? snapshot.clubMarket : INITIAL.clubMarket,
        contacts: Array.isArray(snapshot.contacts) ? snapshot.contacts : INITIAL.contacts,
        onlinePlayers: Array.isArray(snapshot.onlinePlayers) ? snapshot.onlinePlayers : INITIAL.onlinePlayers,
        messages: Array.isArray(snapshot.messages) ? snapshot.messages : INITIAL.messages,
        friends: Array.isArray(snapshot.friends) ? snapshot.friends : INITIAL.friends,
        rankings: Array.isArray(snapshot.rankings) ? snapshot.rankings : INITIAL.rankings,
        activeBoosts: Array.isArray(snapshot.activeBoosts) ? snapshot.activeBoosts : INITIAL.activeBoosts,
        log: Array.isArray(snapshot.log) && snapshot.log.length ? snapshot.log : INITIAL.log,
        factoryState: {
          ...INITIAL.factoryState,
          ...legacyFactoryState,
          ownedFactories: Array.isArray(legacyFactoryState?.ownedFactories)
            ? legacyFactoryState.ownedFactories
            : INITIAL.factoryState.ownedFactories,
          shipments: Array.isArray(legacyFactoryState?.shipments)
            ? legacyFactoryState.shipments
            : INITIAL.factoryState.shipments,
          stock: { ...INITIAL.factoryState.stock, ...(legacyFactoryState?.stock || {}) },
        },
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
      const clientSnapshot = me.user?.clientState?.game;
      if (clientSnapshot && typeof clientSnapshot === "object") {
        restoreClientGameSnapshot(clientSnapshot);
      }
      mergeServerUser(me.user, { prices: me.market, products: me.marketState });
      didHydrateSessionRef.current = true;
      try {
        lastSyncedGameRef.current = JSON.stringify(clientSnapshot || null);
      } catch (_error) {
        lastSyncedGameRef.current = "";
      }
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
      refreshMarketState(sessionToken).catch(() => {});
      refreshCasinoState(sessionToken).catch(() => {});
    }, 45000);
    return () => clearInterval(timer);
  }, [sessionToken, apiStatus]);

  useEffect(() => {
    if (!sessionToken || apiStatus !== "online" || !authReady || !didHydrateSessionRef.current) {
      return undefined;
    }

    let serializedGame = "";
    try {
      serializedGame = JSON.stringify(game);
    } catch (_error) {
      return undefined;
    }

    if (!serializedGame || serializedGame === lastSyncedGameRef.current) {
      return undefined;
    }

    const timer = setTimeout(() => {
      syncClientStateOnline(sessionToken, game)
        .then(() => {
          lastSyncedGameRef.current = serializedGame;
        })
        .catch(() => {});
    }, 1200);

    return () => clearTimeout(timer);
  }, [game, sessionToken, apiStatus, authReady]);

  useEffect(() => {
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
        const passiveMinutes = elapsedSeconds / 60;
        const businessIncome = getBusinessIncomePerMinute(prev);
        const escortIncome = getEscortIncomePerMinute(prev);
        const nextCollections = {
          businessCash: Math.min((prev.collections?.businessCash || 0) + businessIncome * passiveMinutes, getPassiveCapAmount(businessIncome)),
          escortCash: Math.min((prev.collections?.escortCash || 0) + escortIncome * passiveMinutes, getPassiveCapAmount(escortIncome)),
          businessCollectedAt: prev.collections?.businessCollectedAt || null,
          escortCollectedAt: prev.collections?.escortCollectedAt || null,
        };
        const logLines = [...prev.log];

        expiredBoosts.forEach((boost) => {
          logLines.unshift(`Efekt ${boost.name} minal. Organizm wraca do normy.`);
        });

        const nextPlayer = {
          ...prev.player,
          energy: clamp(prev.player.energy + energyRecovered, 0, prev.player.maxEnergy),
          heat: clamp(prev.player.heat - Math.floor(elapsedSeconds / 180), 0, 100),
        };
        const nextEscortsOwned = prev.escortsOwned.map((entry) => ({
          ...entry,
          routes: { ...getEscortRoutes(entry) },
        }));

        let escortPool = nextCollections.escortCash;
        let streetHeatGain = 0;

        nextEscortsOwned.forEach((entry) => {
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

        const cleanedEscortsOwned = nextEscortsOwned.filter((entry) => entry.count > 0);
        const nextEscortIncome = getEscortIncomePerMinute({ ...prev, escortsOwned: cleanedEscortsOwned });
        nextCollections.escortCash = Math.min(escortPool, getPassiveCapAmount(nextEscortIncome));

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
          lastTick: now,
          log: logLines.slice(0, 16),
        };
      });
    }, 5000);

    return () => clearInterval(timer);
  }, []);

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
    lastExplicitNoticeAtRef.current = Date.now();
    setNotice({
      id: Date.now(),
      tone,
      title: getExplicitNoticeTitle(message, tone),
      message,
      deltas: null,
    });
  };

  const setActiveSection = (tabId, sectionId) => {
    setSectionByTab((prev) => ({ ...prev, [tabId]: sectionId }));
    if (tabId !== tab) setTab(tabId);
  };

  useEffect(() => {
    pageScrollRef.current?.scrollTo?.({ y: 0, animated: false });
    if (!isPhone) return;
    setMobileHudOpen(false);
  }, [tab, activeSectionId, isPhone]);

  const canDoStreetAction = (message) => {
    if (inJail(game.player)) {
      pushLog(message || "Siedzisz w wiezieniu. Najpierw odsiadka albo kaucja.");
      return false;
    }
    return true;
  };

  const updateLocalPlayer = (changes, message) => {
    setGame((prev) => ({
      ...prev,
      player: {
        ...prev.player,
        ...changes,
        rank: getRankTitle(changes.respect ?? prev.player.respect),
      },
      log: message ? [message, ...prev.log].slice(0, 16) : prev.log,
    }));
  };

  const setAvatar = (avatarId) => {
    const avatar = getAvatarById(avatarId, avatarOptions);
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

  const buyGymPass = (pass) => {
    if (!canDoStreetAction("Nie kupisz karnetu z celi.")) return;
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

  const doGymExercise = (exercise) => {
    if (!canDoStreetAction("Z celi nie dojdziesz na silownie.")) return;
    if (!hasGymPass(game.player)) return pushLog("Najpierw kup karnet na silownie.");
    if (game.player.energy < exercise.costEnergy) return pushLog("Za malo energii na trening.");

    setGame((prev) => {
      const player = { ...prev.player, energy: prev.player.energy - exercise.costEnergy };
      if (exercise.gains.attack) player.attack += exercise.gains.attack;
      if (exercise.gains.defense) player.defense += exercise.gains.defense;
      if (exercise.gains.dexterity) player.dexterity += exercise.gains.dexterity;
      if (exercise.gains.maxHp) player.maxHp += exercise.gains.maxHp;
      if (exercise.gains.hp) player.hp = clamp(prev.player.hp + exercise.gains.hp, 0, player.maxHp);

      return {
        ...prev,
        player: { ...player, rank: getRankTitle(player.respect) },
        log: [`Silownia zaliczona: ${exercise.name}. ${exercise.note}.`, ...prev.log].slice(0, 16),
      };
    });
  };

  const buyMeal = (meal) => {
    if (!canDoStreetAction("Wiezienie serwuje tylko standardowy kociolek.")) return;
    if (game.player.cash < meal.price) return pushLog(`Brakuje kasy na ${meal.name}.`);
    updateLocalPlayer(
      {
        cash: game.player.cash - meal.price,
        energy: clamp(game.player.energy + meal.energy, 0, game.player.maxEnergy),
      },
      `Zjedzone: ${meal.name}. Energia +${meal.energy}.`
    );
  };

  const heal = () => {
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

  const fightClubRound = () => {
    if (!canDoStreetAction("Fightclub nie dziala zza krat.")) return;
    if (game.player.energy < 3) return pushLog("Za malo energii na sparing.");

    const score = effectivePlayer.attack * 0.4 + effectivePlayer.defense * 0.25 + effectivePlayer.dexterity * 0.35 + Math.random() * 10;
    if (score >= 16) {
      setGame((prev) => ({
        ...prev,
        player: {
          ...prev.player,
          energy: prev.player.energy - 3,
          respect: prev.player.respect + 2,
          attack: prev.player.attack + 1,
          dexterity: prev.player.dexterity + 1,
          rank: getRankTitle(prev.player.respect + 2),
        },
        log: ["Fightclub wygrany. +2 szacunu, +1 atak, +1 zrecznosc.", ...prev.log].slice(0, 16),
      }));
      return;
    }

    setGame((prev) => ({
      ...prev,
      player: {
        ...prev.player,
        energy: prev.player.energy - 3,
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

  const bribeOutOfJail = () => {
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
    if (!canDoStreetAction()) return;
    if (game.player.respect < heist.respect) return pushLog(`Za niski szacun. Potrzebujesz ${heist.respect}.`);
    if (game.player.energy < heist.energy) return pushLog(`Brakuje energii. Potrzebujesz ${heist.energy}.`);

    if (sessionToken && apiStatus === "online") {
      try {
        const result = await executeHeistOnline(sessionToken, heist.id);
        mergeServerUser(result.user);
        return;
      } catch (error) {
        pushLog(error.message);
      }
    }

    const { chance, jailChance } = getSoloHeistOdds(game.player, effectivePlayer, game.gang, heist);

    if (Math.random() < chance) {
      const gain = randomBetween(heist.reward[0], heist.reward[1]);
      const respectGain = Math.max(1, Math.floor(heist.respect / 5));
      setGame((prev) => ({
        ...prev,
        player: {
          ...prev.player,
          cash: prev.player.cash + gain,
          respect: prev.player.respect + respectGain,
          energy: prev.player.energy - heist.energy,
          heat: clamp(prev.player.heat + Math.ceil(heist.risk * 14), 0, 100),
          rank: getRankTitle(prev.player.respect + respectGain),
        },
        stats: {
          ...prev.stats,
          heistsDone: prev.stats.heistsDone + 1,
          heistsWon: prev.stats.heistsWon + 1,
          totalEarned: prev.stats.totalEarned + gain,
        },
        log: [`Napad udany: ${heist.name}. Wpada ${formatMoney(gain)} i +${respectGain} szacunu.`, ...prev.log].slice(0, 16),
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
      const sentence = 70 + heist.energy * 35 + Math.round(heist.risk * 180);
      applyJail(sentence, heist.name);
    }
  };

  // TODO: TO_MIGRATE_TO_SERVER - gang heist outcome, jailed crew, vault changes and payout split must be validated on backend
  const executeGangHeist = (heist) => {
    if (!canDoStreetAction()) return;
    if (!game.gang.joined) return pushLog("Najpierw musisz byc w gangu.");
    if (!canRunGangHeistRole(game.gang.role)) return pushLog("Napady gangu odpalaja tylko Boss, Vice Boss albo Zaufany.");
    if (game.gang.members < heist.minMembers) return pushLog(`Ten napad wymaga ${heist.minMembers} ludzi w ekipie.`);
    if (game.gang.members - game.gang.jailedCrew < heist.minMembers) return pushLog("Za duzo ludzi siedzi. Nie masz pelnego skladu do tej roboty.");
    if (game.player.respect < heist.respect) return pushLog(`Za niski szacun. Potrzebujesz ${heist.respect}.`);
    if (game.player.energy < heist.energy) return pushLog(`Potrzebujesz ${heist.energy} energii.`);

    const { chance } = getGangHeistOdds(game.player, effectivePlayer, game.gang, heist);
    const participants = Math.min(game.gang.members - game.gang.jailedCrew, Math.max(heist.minMembers, heist.minMembers + Math.floor(game.gang.influence / 6)));

    if (Math.random() < chance) {
      const gain = randomBetween(heist.reward[0], heist.reward[1]) + Math.floor(game.gang.gearScore * 60);
      const share = Math.max(600, Math.floor(gain / participants));
      const respectGain = Math.max(2, Math.floor(heist.respect / 5));
      setGame((prev) => ({
        ...prev,
        player: {
          ...prev.player,
          cash: prev.player.cash + share,
          respect: prev.player.respect + respectGain,
          energy: prev.player.energy - heist.energy,
          heat: clamp(prev.player.heat + Math.ceil(heist.risk * 18), 0, 100),
          rank: getRankTitle(prev.player.respect + respectGain),
        },
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
        log: [`Napad gangu udany: ${heist.name}. Uczestnikow ${participants}, Twoja dzialka ${formatMoney(share)}.`, ...prev.log].slice(0, 16),
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
  const buyBusiness = (business) => {
    if (!canDoStreetAction()) return;
    if (game.player.respect < business.respect) return pushLog(`Najpierw wbij ${business.respect} szacunu.`);
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

  // TODO: TO_MIGRATE_TO_SERVER - passive business claim must come from server-side accrual and claim cap validation
  const collectBusinessIncome = () => {
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
  const collectEscortIncome = () => {
    const payout = Math.floor(game.collections?.escortCash || 0);
    if (payout <= 0) return pushLog("Na razie ulica nic jeszcze nie oddala.");

    setGame((prev) => ({
      ...prev,
      player: { ...prev.player, cash: prev.player.cash + payout },
      stats: { ...prev.stats, totalEarned: prev.stats.totalEarned + payout },
      collections: { ...prev.collections, escortCash: 0, escortCollectedAt: Date.now() },
      log: [`Odebrales z ulicy ${formatMoney(payout)}. Dziewczyny rozliczone.`, ...prev.log].slice(0, 16),
    }));
  };

  // TODO: TO_MIGRATE_TO_SERVER - escort acquisition and scaling need server validation before real multiplayer launch
  const buyEscort = (escort) => {
    if (!canDoStreetAction()) return;
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

  // TODO: TO_MIGRATE_TO_SERVER - club traffic, search cooldown and low-chance street trigger logic are still local economy logic
  const findEscortInClub = () => {
    if (!canDoStreetAction()) return;
    if (!currentClubVenue) return pushLog("Najpierw wejdz do jakiegos klubu. Dopiero tam szukasz kontaktow.");
    if (game.player.cash < CLUB_ESCORT_SEARCH_COST) return pushLog(`Brakuje ${formatMoney(CLUB_ESCORT_SEARCH_COST)} na wejscie i szukanie kontaktow.`);

    const chance = escortFindChance;
    const unlocked = ESCORTS.filter((escort) => escort.respect <= game.player.respect);
    const found = Math.random() < chance;

    if (!found || !unlocked.length) {
      const eventRoll = Math.random();
      if (eventRoll < currentClubProfile.eventChance) {
        if (eventRoll < currentClubProfile.drugChance) {
          const unlockedDrugs = DRUGS.filter((drug) => drug.unlockRespect <= game.player.respect);
          const foundDrug = unlockedDrugs[randomBetween(0, Math.max(0, unlockedDrugs.length - 1))];
          if (foundDrug) {
            return setGame((prev) => ({
              ...prev,
              player: { ...prev.player, cash: prev.player.cash - CLUB_ESCORT_SEARCH_COST },
              drugInventory: { ...prev.drugInventory, [foundDrug.id]: prev.drugInventory[foundDrug.id] + 1 },
              log: [`W ${currentClubVenue.name} wpada probka: ${foundDrug.name}. Lokal ma klimat i towar krazy po stolach.`, ...prev.log].slice(0, 16),
            }));
          }
        }

        if (eventRoll < currentClubProfile.contactChance) {
          const tipCash = Math.floor(180 + currentClubVenue.popularity * 14 + currentClubVenue.mood * 9);
          const respectTip = currentClubVenue.popularity >= 32 ? 1 : 0;
          return setGame((prev) => ({
            ...prev,
            player: {
              ...prev.player,
              cash: prev.player.cash - CLUB_ESCORT_SEARCH_COST + tipCash,
              respect: prev.player.respect + respectTip,
            },
            online: {
              ...prev.online,
              messages: [
                {
                  id: `msg-club-${Date.now()}`,
                  from: currentClubVenue.ownerLabel,
                  subject: `Kontakt z ${currentClubVenue.name}`,
                  preview: `Lokal podrzuca trop. Wpada ${formatMoney(tipCash)} i nowy numer do ludzi z zaplecza.`,
                  time: nowTimeLabel(),
                },
                ...prev.online.messages,
              ].slice(0, 12),
            },
            log: [`${currentClubVenue.name} podrzuca kontakt. Wpada ${formatMoney(tipCash)}${respectTip ? " i +1 respektu" : ""}.`, ...prev.log].slice(0, 16),
          }));
        }
      }

      return setGame((prev) => ({
        ...prev,
        player: { ...prev.player, cash: prev.player.cash - CLUB_ESCORT_SEARCH_COST },
        log: [`Obszedles ${currentClubVenue.name} i spaliles ${formatMoney(CLUB_ESCORT_SEARCH_COST)}. Nic konkretnego dzis nie wpadlo.`, ...prev.log].slice(0, 16),
      }));
    }

    const weightedPool = unlocked.flatMap((escort) => Array.from({ length: Math.max(1, 32 - escort.respect) }, () => escort));
    const escort = weightedPool[randomBetween(0, weightedPool.length - 1)];

    setGame((prev) => {
      const owned = prev.escortsOwned.find((entry) => entry.id === escort.id);
      const escortsOwned = owned
        ? prev.escortsOwned.map((entry) => (entry.id === escort.id ? { ...entry, count: entry.count + 1, working: getEscortWorkingCount(entry), routes: { ...getEscortRoutes(entry) } } : entry))
        : [...prev.escortsOwned, { id: escort.id, count: 1, working: 0, routes: {} }];

      return {
        ...prev,
        player: { ...prev.player, cash: prev.player.cash - CLUB_ESCORT_SEARCH_COST },
        escortsOwned,
        log: [`W ${currentClubVenue.name} siada kontakt: ${escort.name}. Dragowy klimat podbil szanse wejscia na ${Math.round(chance * 100)}%.`, ...prev.log].slice(0, 16),
      };
    });
  };

  // TODO: TO_MIGRATE_TO_SERVER - escort street assignment affects passive economy and must move to server state
  const assignEscortToStreet = (escort, districtId) => {
    if (!canDoStreetAction()) return;
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

  const pullEscortFromStreet = (escort, districtId) => {
    if (!canDoStreetAction()) return;
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

  const sellEscort = (escort) => {
    if (!canDoStreetAction()) return;
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
  const buyFactory = (factory) => {
    if (!canDoStreetAction()) return;
    if (game.player.respect < factory.respect) return pushLog(`Za niski szacun. Potrzebujesz ${factory.respect}.`);
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
  const buySupply = (supply) => {
    if (!canDoStreetAction()) return;
    if (game.player.cash < supply.price) return pushLog(`Brakuje gotowki na ${supply.name}.`);

    setGame((prev) => ({
      ...prev,
      player: { ...prev.player, cash: prev.player.cash - supply.price },
      supplies: { ...prev.supplies, [supply.id]: prev.supplies[supply.id] + 1 },
      log: [`Kupiono ${supply.unit}: ${supply.name}.`, ...prev.log].slice(0, 16),
    }));
  };

  // TODO: TO_MIGRATE_TO_SERVER - production recipes, raid risk, maintenance, yield scaling and inventory output are critical economy authority
  const produceDrug = (drug) => {
    if (!canDoStreetAction()) return;
    if (!hasFactory(game, drug.factoryId)) return pushLog(`Najpierw musisz miec ${FACTORIES.find((entry) => entry.id === drug.factoryId)?.name}.`);
    if (game.player.respect < drug.unlockRespect) return pushLog(`Za niski szacun. Potrzebujesz ${drug.unlockRespect}.`);

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
  const buyDrugFromDealer = (drug) => {
    if (!canDoStreetAction()) return;
    if (game.player.respect < drug.unlockRespect) return pushLog(`Diler puszcza ${drug.name} dopiero od ${drug.unlockRespect} szacunu.`);
    if ((game.dealerInventory?.[drug.id] || 0) <= 0) return pushLog(`Diler nie ma juz ${drug.name} na stanie.`);
    if (game.player.cash < drug.streetPrice) return pushLog(`Brakuje ${formatMoney(drug.streetPrice)} na ${drug.name}.`);

    setGame((prev) => ({
      ...prev,
      player: { ...prev.player, cash: prev.player.cash - drug.streetPrice },
      drugInventory: { ...prev.drugInventory, [drug.id]: prev.drugInventory[drug.id] + 1 },
      dealerInventory: { ...prev.dealerInventory, [drug.id]: Math.max(0, (prev.dealerInventory[drug.id] || 0) - 1) },
      log: [`Kupiles od dilera: ${drug.name} za ${formatMoney(drug.streetPrice)}.`, ...prev.log].slice(0, 16),
    }));
  };

  // TODO: TO_MIGRATE_TO_SERVER - dealer sell-back and stock refill loop must be validated on backend
  const sellDrugToDealer = (drug) => {
    if (!canDoStreetAction()) return;
    if (game.drugInventory[drug.id] <= 0) return pushLog(`Nie masz czego sprzedac: ${drug.name}.`);
    const payout = Math.max(20, Math.floor(drug.streetPrice * 0.72));

    setGame((prev) => ({
      ...prev,
      player: { ...prev.player, cash: prev.player.cash + payout },
      drugInventory: { ...prev.drugInventory, [drug.id]: prev.drugInventory[drug.id] - 1 },
      dealerInventory: { ...prev.dealerInventory, [drug.id]: (prev.dealerInventory[drug.id] || 0) + 1 },
      stats: { ...prev.stats, totalEarned: prev.stats.totalEarned + payout },
      log: [`Sprzedales dilerowi ${drug.name} za ${formatMoney(payout)}.`, ...prev.log].slice(0, 16),
    }));
  };

  // TODO: TO_MIGRATE_TO_SERVER - club takeover cost, ownership, player-driven traffic and upkeep need persistence and anti-abuse checks
  const openClub = (listing) => {
    if (!canDoStreetAction()) return;
    if (game.club.owned) return pushLog("Klub juz jest Twoj.");
    if (!listing) return pushLog("Wybierz lokal z listy klubow.");
    if (game.player.respect < listing.respect) return pushLog(`Na ten lokal potrzebujesz ${listing.respect} szacunu.`);
    if (game.player.cash < listing.takeoverCost) return pushLog(`Brakuje ${formatMoney(listing.takeoverCost)} na przejecie ${listing.name}.`);

    setGame((prev) => ({
      ...prev,
      player: { ...prev.player, cash: prev.player.cash - listing.takeoverCost },
      club: {
        ...prev.club,
        owned: true,
        sourceId: listing.id,
        visitId: listing.id,
        ownerLabel: clubOwnerLabel,
        name: listing.name,
        popularity: listing.popularity,
        mood: listing.mood,
        policeBase: listing.policeBase,
        note: listing.note,
      },
      clubListings: syncClubListing(
        prev.clubListings,
        {
          ...prev.club,
          owned: true,
          sourceId: listing.id,
          ownerLabel: clubOwnerLabel,
          name: listing.name,
          popularity: listing.popularity,
          mood: listing.mood,
          policeBase: listing.policeBase,
          note: listing.note,
        },
        clubOwnerLabel
      ),
      log: [`Przejales ${listing.name}. Teraz nocne pieniadze zaczynaja isc do Ciebie.`, ...prev.log].slice(0, 16),
    }));
  };

  // TODO: TO_MIGRATE_TO_SERVER - premium shortcut and club founding must be validated server-side before production
  const foundClub = (mode) => {
    if (!canDoStreetAction()) return;
    if (game.club.owned) return pushLog("Masz juz swoj klub.");
    if (!game.gang.joined) return pushLog("Nowy klub od zera stawia juz konkretna ekipa, nie solo typ.");
    if (game.gang.role !== "Boss") return pushLog("Nowy lokal moze postawic tylko boss gangu.");
    if (game.player.respect < 26) return pushLog("Na zalozenie nowego klubu potrzebujesz minimum 26 szacunu.");

    if (mode === "premium" && game.player.premiumTokens < CLUB_FOUNDING_PREMIUM_COST) {
      return pushLog(`Brakuje ${CLUB_FOUNDING_PREMIUM_COST} premium na ekspresowe postawienie lokalu.`);
    }
    if (mode !== "premium" && game.player.cash < CLUB_FOUNDING_CASH_COST) {
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
      note: "Nowy lokal postawiony od zera. Wysokie koszty, wysoki potencjal i wieksza uwaga sluzb.",
    };

    setGame((prev) => ({
      ...prev,
      player: {
        ...prev.player,
        cash: mode === "premium" ? prev.player.cash : prev.player.cash - CLUB_FOUNDING_CASH_COST,
        premiumTokens: mode === "premium" ? prev.player.premiumTokens - CLUB_FOUNDING_PREMIUM_COST : prev.player.premiumTokens,
      },
      club: {
        ...prev.club,
        owned: true,
        sourceId: newListing.id,
        visitId: newListing.id,
        ownerLabel,
        name: newListing.name,
        popularity: newListing.popularity,
        mood: newListing.mood,
        policeBase: newListing.policeBase,
        note: newListing.note,
      },
      clubListings: syncClubListing(prev.clubListings, { ...prev.club, ...newListing, owned: true }, ownerLabel),
      log: [
        mode === "premium"
          ? `Premium poszlo w ruch. ${clubName} otwiera sie od razu na mapie miasta.`
          : `Wylales gruby hajs i postawiles od zera ${clubName}.`,
        ...prev.log,
      ].slice(0, 16),
    }));
  };

  // TODO: TO_MIGRATE_TO_SERVER - club stash is economy state and must not live only on the client
  const moveDrugToClub = (drug) => {
    if (!game.club.owned) return pushLog("Najpierw musisz miec klub.");
    if (!insideOwnClub) return pushLog("Musisz fizycznie wejsc do swojego klubu, zeby wrzucic towar na stash.");
    if (game.drugInventory[drug.id] <= 0) return pushLog(`Nie masz na stanie ${drug.name}.`);

    setGame((prev) => ({
      ...prev,
      drugInventory: { ...prev.drugInventory, [drug.id]: prev.drugInventory[drug.id] - 1 },
      club: { ...prev.club, stash: { ...prev.club.stash, [drug.id]: prev.club.stash[drug.id] + 1 } },
      log: [`Przerzucono 1 szt. ${drug.name} do klubu.`, ...prev.log].slice(0, 16),
    }));
  };

  // TODO: TO_MIGRATE_TO_SERVER - club tick income, player-driven traffic, raid rolls and stash consumption are high-value economy actions
  const runClubNight = () => {
    if (!canDoStreetAction()) return;
    if (!game.club.owned) return pushLog("Bez klubu nie ma co odpalac nocy.");
    if (!insideOwnClub) return pushLog("Musisz siedziec we wlasnym klubie, zeby odpalic noc i pilnowac stolow.");
    if (clubNightRemaining > 0) return pushLog(`Klub juz pracuje. Wroc za ${formatCooldown(clubNightRemaining)}.`);

    const totalUnits = DRUGS.reduce((sum, drug) => sum + game.club.stash[drug.id], 0);
    if (!totalUnits) return pushLog("Klub stoi pusty. Dorzuc najpierw towar z fabryk.");

    const soldByDrug = {};
    let income = 0;
    let nightSignal = 0;

    DRUGS.forEach((drug) => {
      const stock = game.club.stash[drug.id];
      const sold = Math.min(stock, Math.max(0, randomBetween(0, Math.min(stock, 2))));
      const policeProfile = getDrugPoliceProfile(drug);
      soldByDrug[drug.id] = sold;
      income += sold * Math.floor(drug.streetPrice * (1.2 + game.club.popularity / 100) * currentClubProfile.salesMultiplier);
      nightSignal += sold * (drug.streetPrice / 200 + policeProfile.risk * 14);
    });

    if (!income) return pushLog("Noc byla slaba. Nikt nie bral konkretnego towaru.");

    const raidChance = clamp(
      (0.05 + game.club.policeBase * 0.012 + nightSignal / 150 + game.player.heat * 0.002 + game.club.popularity * 0.002) *
        currentClubProfile.raidModifier,
      0.05,
      0.74
    );
    const raided = Math.random() < raidChance;
    const jailSeconds = raided && raidChance >= 0.34 && Math.random() < raidChance * 0.28 ? randomBetween(240, 600) : 0;

    setGame((prev) => {
      const nextStash = { ...prev.club.stash };
      Object.entries(soldByDrug).forEach(([drugId, amount]) => {
        nextStash[drugId] -= amount;
      });

      const raidLoss = raided ? Math.floor(income * (0.4 + Math.random() * 0.2)) : 0;
      const netIncome = Math.max(0, income - raidLoss);
      const nextClub = {
        ...prev.club,
        popularity: clamp(prev.club.popularity + (raided ? -4 : 2), 0, 100),
        mood: clamp(prev.club.mood + (raided ? -8 : 4), 0, 100),
        lastRunAt: Date.now(),
        stash: nextStash,
      };

      return {
        ...prev,
        player: {
          ...prev.player,
          cash: prev.player.cash + netIncome,
          heat: clamp(prev.player.heat + (raided ? 12 : 3), 0, 100),
          jailUntil: jailSeconds ? Date.now() + jailSeconds * 1000 : prev.player.jailUntil,
        },
        stats: { ...prev.stats, totalEarned: prev.stats.totalEarned + netIncome },
        club: nextClub,
        clubListings: syncClubListing(prev.clubListings, nextClub, prev.club.ownerLabel || getPlayerClubOwnerLabel(prev)),
        log: [
          raided
            ? `Nalot w ${prev.club.name}. Zostaje ${formatMoney(netIncome)}, ale gliny zgarnely ${formatMoney(raidLoss)}.`
            : `${prev.club.name} zarobil ${formatMoney(netIncome)}. Towar poszedl w ludzi.`,
          ...prev.log,
        ].slice(0, 16),
      };
    });

    if (jailSeconds) {
      setActiveSection("heists", "prison");
    }
  };

  const enterClubAsGuest = (listing) => {
    if (!canDoStreetAction()) return;
    if (!listing) return pushLog("Nie ma takiego lokalu na mapie miasta.");
    setGame((prev) => ({
      ...prev,
      club: {
        ...prev.club,
        visitId: listing.id,
      },
      log: [
        `Wchodzisz do ${listing.name}. Wlasciciel: ${listing.ownerLabel}. Lokal daje ${Math.round(getClubVenueProfile(prev, listing).eventChance * 100)}% szansy na event klubowy.`,
        ...prev.log,
      ].slice(0, 16),
    }));
  };

  const leaveClubAsGuest = () => {
    if (!currentClubVenue) return pushLog("Nie jestes teraz w zadnym klubie.");

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
    if (!game.club.owned) return pushLog("Najpierw otworz klub.");
    if (!insideOwnClub) return pushLog("Promo lokalu odpalasz tylko bedac w srodku swojego klubu.");
    if (game.player.cash < 1200) return pushLog("Brakuje kasy na promo lokalu.");
    updateLocalPlayer({ cash: game.player.cash - 1200 }, "Promo odpalone. Klub zaczyna byc glosny na miescie.");
    setGame((prev) => {
      const nextClub = { ...prev.club, popularity: clamp(prev.club.popularity + 8, 0, 100) };
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
    if (!game.gang.joined) return;
    if (!gangMessage.trim()) return;
    setGame((prev) => ({
      ...prev,
      gang: { ...prev.gang, chat: [{ id: `gang-${Date.now()}`, author: game.player.name, text: gangMessage.trim(), time: nowTimeLabel() }, ...prev.gang.chat].slice(0, 14) },
    }));
    setGangMessage("");
  };

  const sendPrisonMessage = () => {
    if (!inJail(game.player)) return;
    if (!prisonMessage.trim()) return;
    setGame((prev) => ({
      ...prev,
      prisonChat: [{ id: `pr-${Date.now()}`, author: prev.player.name, text: prisonMessage.trim(), time: nowTimeLabel() }, ...prev.prisonChat].slice(0, 18),
    }));
    setPrisonMessage("");
  };

  const createGang = () => {
    if (!canDoStreetAction("Gangu nie zakladasz z celi.")) return;
    if (game.gang.joined) return pushLog("Juz jestes w gangu.");
    if (game.player.premiumTokens < game.gang.createCost) return pushLog(`Zalozenie gangu kosztuje ${game.gang.createCost} premium.`);
    if (game.player.respect < 15) return pushLog("Na zalozenie gangu potrzebujesz co najmniej 15 szacunu.");

    const cleanName = gangDraftName.trim();
    if (cleanName.length < 3) return pushLog("Nazwa gangu jest za krotka.");

    setGame((prev) => ({
      ...prev,
      player: { ...prev.player, premiumTokens: prev.player.premiumTokens - prev.gang.createCost },
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
      log: [`Zakladasz gang ${cleanName}. Premium -${prev.gang.createCost}.`, ...prev.log].slice(0, 16),
    }));
  };

  const joinGang = (inviteId) => {
    if (!canDoStreetAction("Do gangu dolaczasz dopiero po wyjsciu z celi.")) return;
    if (game.gang.joined) return pushLog("Najpierw opusc obecny gang.");
    const invite = game.gang.invites.find((entry) => entry.id === inviteId);
    if (!invite) return;
    if (game.player.respect < invite.inviteRespectMin) return pushLog(`Ten gang bierze od ${invite.inviteRespectMin} szacunu.`);

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

  const changeGangInviteThreshold = (delta) => {
    if (!game.gang.joined) return;
    if (game.gang.role !== "Boss") return pushLog("Tylko boss ustawia prog zaproszen.");
    setGame((prev) => ({
      ...prev,
      gang: {
        ...prev.gang,
        inviteRespectMin: clamp(prev.gang.inviteRespectMin + delta, 15, 60),
      },
    }));
  };

  const inviteCandidate = (candidateId) => {
    if (!game.gang.joined) return;
    if (game.gang.role !== "Boss") return pushLog("Tylko boss moze wysylac zaproszenia.");
    const candidate = (game.online?.roster || []).find((entry) => entry.id === candidateId);
    if (!candidate) return;
    if (candidate.gang !== "No gang") return pushLog("Ten gracz jest juz w gangu.");
    if (candidate.respect < game.gang.inviteRespectMin) return pushLog("Ten kandydat nie dobija do ustawionego progu szacunu.");

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
      }
    }

    updateLocalPlayer({ cash: game.player.cash + amount, bank: Math.max(0, (game.player.bank || 0) - amount) }, `Wyplacono z banku ${formatMoney(amount)}.`);
    setBankAmountDraft(String(amount));
  };

  const claimTask = (task) => {
    if (!task.completed || task.claimed) return;
    setGame((prev) => ({
      ...prev,
      player: { ...prev.player, cash: prev.player.cash + task.rewardCash, respect: prev.player.respect + task.rewardRespect, rank: getRankTitle(prev.player.respect + task.rewardRespect) },
      tasksClaimed: [...prev.tasksClaimed, task.id],
      stats: { ...prev.stats, totalEarned: prev.stats.totalEarned + task.rewardCash },
      log: [`Odebrano zadanie: ${task.title}. ${formatMoney(task.rewardCash)} i +${task.rewardRespect} szacunu.`, ...prev.log].slice(0, 16),
    }));
  };

  const claimReferralMilestone = (milestone) => {
    if (game.referrals.verified < milestone.verified) return pushLog(`Prog odblokuje sie przy ${milestone.verified} aktywnych poleconych.`);
    if (game.referrals.claimedMilestones.includes(milestone.id)) return pushLog("Ta nagroda z polecen jest juz odebrana.");

    setGame((prev) => ({
      ...prev,
      player: {
        ...prev.player,
        cash: prev.player.cash + milestone.rewardCash,
        premiumTokens: prev.player.premiumTokens + milestone.rewardPremium,
        respect: prev.player.respect + milestone.rewardRespect,
        rank: getRankTitle(prev.player.respect + milestone.rewardRespect),
      },
      referrals: {
        ...prev.referrals,
        claimedMilestones: [...prev.referrals.claimedMilestones, milestone.id],
      },
      log: [
        `Program polecen: odebrane ${formatMoney(milestone.rewardCash)}, +${milestone.rewardPremium} premium${milestone.rewardRespect ? ` i +${milestone.rewardRespect} szacunu` : ""}.`,
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

  const addWorldPlayerFriend = (player) => {
    if (game.online.friends.some((entry) => entry.id === player.id)) return pushLog(`${player.name} juz siedzi w znajomych.`);

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

  const sendQuickMessageToPlayer = (player) => {
    setGame((prev) => ({
      ...prev,
      online: {
        ...prev.online,
        messages: [
          { id: `msg-${Date.now()}`, from: player.name, subject: "Szybka wiadomosc", preview: `Hej, ${prev.player.name}. Widzimy sie na miescie.`, time: nowTimeLabel() },
          ...prev.online.messages,
        ].slice(0, 20),
      },
      log: [`Odpaliles szybka wiadomosc do ${player.name}.`, ...prev.log].slice(0, 16),
    }));
    setActiveSection("online", "messages");
  };

  const placeBountyOnPlayer = (player) => {
    if (!canDoStreetAction("Nie ustawisz bounty z celi.")) return;
    const price = 2500;
    if (game.player.cash < price) return pushLog(`Brakuje ${formatMoney(price)} na wystawienie bounty.`);

    setGame((prev) => ({
      ...prev,
      player: { ...prev.player, cash: prev.player.cash - price },
      online: {
        ...prev.online,
        roster: prev.online.roster.map((entry) => (entry.id === player.id ? { ...entry, bounty: entry.bounty + 1500 } : entry)),
        messages: [
          { id: `msg-${Date.now()}`, from: "System", subject: "Bounty wystawione", preview: `Na glowe ${player.name} dorzucono ${formatMoney(1500)} bounty.`, time: nowTimeLabel() },
          ...prev.online.messages,
        ].slice(0, 20),
      },
      log: [`Wystawiles bounty na ${player.name}. Koszt ${formatMoney(price)}.`, ...prev.log].slice(0, 16),
    }));
  };

  const attackWorldPlayer = (player) => {
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

  const totalBusinessIncome = getBusinessIncomePerMinute(game);
  const totalEscortIncome = getEscortIncomePerMinute(game);
  const businessCollectionCap = getPassiveCapAmount(totalBusinessIncome);
  const escortCollectionCap = getPassiveCapAmount(totalEscortIncome);
  const businessCapEta = getCollectionTimeToCap(game.collections?.businessCash || 0, totalBusinessIncome);
  const escortCapEta = getCollectionTimeToCap(game.collections?.escortCash || 0, totalEscortIncome);
  const escortFindChance = currentClubVenue
    ? clamp(escortBaseFindChance + currentClubProfile.escortBonus, 0.03, 0.26)
    : escortBaseFindChance;

  const renderSoloHeists = () => (
    <>
      <SceneArtwork
        eyebrow="Napady"
        title="Kazdy prog ma swoja cene"
        lines={["Atak, obrona i zrecznosc realnie pompuja szanse wejscia oraz wyjscia z akcji.", "Im grubszy napad, tym wieksza wyplata, ale tez ryzyko odsiadki i utraty hajsu."]}
        accent={["#4f2219", "#180d0a", "#050505"]}
        source={SCENE_BACKGROUNDS.heists}
      />
      <SectionCard title="Napady" subtitle="Zrecznosc juz dziala w formule sukcesu, tak samo heat i obrona.">
        {HEISTS.map((heist) => {
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
        lines={["Najlatwiejszy skok rusza od 3 ludzi, a najwyzsze progi chca juz pelnej maszyny.", "Tu liczy sie szacun, liczebnosc, wplywy i to czy Twoj gang wyglada jak instytucja."]}
        accent={["#422418", "#160f0c", "#050505"]}
        source={SCENE_BACKGROUNDS.gangWide}
      />
      <SectionCard title="Napady gangu" subtitle="Kazdy skok ma wymagana liczbe ludzi. Najlatwiejszy rusza od 3 osob.">
        {GANG_HEISTS.map((heist) => {
          const locked = game.player.respect < heist.respect || game.gang.members < heist.minMembers;
          const odds = getGangHeistOdds(game.player, effectivePlayer, game.gang, heist);
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
                  <Text style={styles.inlineButtonText}>{locked ? "Za malo ludzi albo szacunu" : "Odpal napad gangu"}</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </SectionCard>
    </>
  );

  const renderPrison = () => (
    <SectionCard title="Wiezienie" subtitle="Jesli akcja nie siada, mozesz tu trafic. Jest licznik, kaucja i osobny chat celi.">
      <SceneArtwork
        eyebrow="Cela"
        title="Zimna odsiadka"
        lines={["Krata, beton i szept ludzi, ktorzy wpadli na zlej akcji.", "Chat celi jest widoczny tylko dla tych, ktorzy siedza."]}
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
          {game.prisonChat.map((entry) => (
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
    <SectionCard title="Gang" subtitle="To instytucja, do ktorej nie wpadasz od razu. Najpierw zakladasz premium albo przyjmujesz zaproszenie.">
      {selectedGangProfile ? (
        <SectionCard title="Profil gangu" subtitle="Klikasz nazwe gangu i wpadasz w jego karte tak samo jak przy profilu gracza.">
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
                <StatLine label="Szacun ekipy" value={`${selectedGangProfile.respect}`} />
              </View>
            </View>
            <Text style={styles.listCardMeta}>{selectedGangProfile.description}</Text>
            <View style={styles.playerProfileActions}>
              {!selectedGangProfile.self ? (
                <Pressable onPress={() => sendQuickMessageToPlayer({ name: selectedGangProfile.boss })} style={styles.inlineButton}>
                  <Text style={styles.inlineButtonText}>Napisz do bossa</Text>
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
                <Text style={styles.listCardMeta}>
                  Tu masz szybki dostep do rzeczy, ktore w starej browserowce odpalalo sie od razu z profilu ekipy:
                  wiadomosc do bossa, propozycja sojuszu, rozpoznanie skladu i szybki nacisk na ich zaplecze.
                </Text>
                <StatLine label="Boss" value={selectedGangProfile.boss} />
                <StatLine label="Vice Boss" value={selectedGangProfile.viceBoss} />
                <StatLine label="Potencjal skladu" value={`${selectedGangProfile.members} ludzi | ${selectedGangProfile.influence} wplywu | ${selectedGangProfile.territory} dzielnice`} />
              </View>
            ) : null}

            {gangProfileView === "members" ? (
              <View style={styles.listCard}>
                <Text style={styles.listCardTitle}>Sklad gangu</Text>
                <Text style={styles.listCardMeta}>Boss, vice boss, zaufani i zwykli ludzie ekipy. To ma dawac szybki ogląd, z kim masz do czynienia.</Text>
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
                <Text style={styles.listCardMeta}>Szybki podglad ostatnich ruchow, klimatu i aktywnosci ekipy.</Text>
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
            : ["Zakladasz wlasny gang premium albo przyjmujesz zaproszenie od ekipy.", "Po wejsciu odblokowuje sie sklad, operacje i chat gangu."]
        }
        accent={["#3d2418", "#17100c", "#050505"]}
        source={SCENE_BACKGROUNDS.gangWide}
      />
      {!game.gang.joined ? (
        <>
          <View style={styles.heroBanner}>
            <Text style={styles.heroBannerTitle}>Brak gangu</Text>
            <Text style={styles.heroBannerText}>Zakladka sluzy teraz do zalozenia wlasnej organizacji albo wejscia do jednej z ekip, ktore juz chodza po miescie.</Text>
          </View>
          <View style={styles.listCard}>
            <Text style={styles.listCardTitle}>Zaloz wlasny gang</Text>
            <Text style={styles.listCardMeta}>Koszt premium: {game.gang.createCost}. Potrzebujesz tez 15 szacunu.</Text>
            <View style={styles.inlineRow}>
              <TextInput value={gangDraftName} onChangeText={setGangDraftName} placeholder="Nazwa gangu" placeholderTextColor="#6c6c6c" style={styles.chatInput} />
              <Pressable onPress={createGang} style={styles.inlineButton}>
                <Text style={styles.inlineButtonText}>Zaloz</Text>
              </Pressable>
            </View>
            <Text style={styles.listCardMeta}>Masz premium: {game.player.premiumTokens}</Text>
          </View>
          <SectionCard title="Zaproszenia" subtitle="Dolaczyc mozesz tylko wtedy, gdy dobijasz do progu szacunu.">
            {game.gang.invites.map((invite) => (
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
            ))}
          </SectionCard>
        </>
      ) : (
        <>
          <View style={styles.heroBanner}>
            <Text style={styles.heroBannerTitle}>{game.gang.name}</Text>
            <Text style={styles.heroBannerText}>Rola: {game.gang.role}. Pilnujesz progu zaproszen, skarbca i ludzi w ekipie.</Text>
          </View>
          <StatLine label="Nazwa" value={game.gang.name} />
          <StatLine label="Liczba ludzi" value={`${game.gang.members}/${game.gang.maxMembers}`} />
          <StatLine label="Teren" value={`${game.gang.territory}`} />
          <StatLine label="Wplywy" value={`${game.gang.influence}`} />
          <StatLine label="Skarbiec" value={formatMoney(game.gang.vault)} />
          <StatLine label="Sprzet gangu" value={`${game.gang.gearScore}/100`} />
          <StatLine label="Ludzie w celi" value={game.gang.jailedCrew ? `${game.gang.jailedCrew} (${formatDuration(crewLockdownRemaining)})` : "0"} />
          <StatLine label="Prog zaproszen" value={`${game.gang.inviteRespectMin} szacunu`} />
          <StatLine label="Nastepny haracz" value={formatCooldown(gangTributeRemaining)} />
          <View style={styles.grid}>
            <ActionTile title="Odbierz haracz" subtitle={gangTributeRemaining > 0 ? `Kolejna koperta za ${formatCooldown(gangTributeRemaining)}.` : "Regularna wyplata z terenu i ochrony."} onPress={collectGangTribute} disabled={gangTributeRemaining > 0} danger />
            <ActionTile title="Podnies prog" subtitle="Boss moze zaostrzyc wejscie do gangu." onPress={() => changeGangInviteThreshold(1)} disabled={game.gang.role !== "Boss"} />
            <ActionTile title="Obniz prog" subtitle="Najnizej do 15 szacunu." onPress={() => changeGangInviteThreshold(-1)} disabled={game.gang.role !== "Boss"} />
            <ActionTile title="Awansuj vicebossa" subtitle="Boss moze wskazac nowa prawa reke z zaufanych." onPress={() => promoteGangMember("Vice Boss")} disabled={game.gang.role !== "Boss"} />
            <ActionTile title="Awansuj zaufanego" subtitle="Boss podnosi zwyklego czlonka do robot na zaufaniu." onPress={() => promoteGangMember("Zaufany")} disabled={game.gang.role !== "Boss"} />
            <ActionTile title="Opusc gang" subtitle="Wychodzisz i wracasz na solo." onPress={leaveGang} />
          </View>
        </>
      )}
    </SectionCard>
  );

  const renderGangMembers = () => (
    <SectionCard title="Czlonkowie" subtitle="Napady gangu maja opierac sie o prawdziwych graczy. Najprostszy wymaga 3 ludzi.">
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
          <SectionCard title="Gracze do zaproszenia" subtitle="Na liscie sa tylko prawdziwi gracze z online, bez gangu i z odpowiednim szacunem.">
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
    <SectionCard title="Chat gangu" subtitle="To juz nie martwa zakladka. Mozesz pisac i widziec log ekipy.">
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
    <SectionCard title="Operacje gangu" subtitle="Szybki podglad, czy ekipa jest gotowa na grubsze roboty.">
      {!game.gang.joined ? (
        <View style={styles.lockedPanel}>
          <Text style={styles.lockedPanelText}>Operacje gangu odblokuja sie dopiero po wejsciu do organizacji.</Text>
        </View>
      ) : (
        <>
          <StatLine label="Udane napady gangu" value={`${game.stats.gangHeistsWon}`} />
          <StatLine label="Kto odpala akcje" value="Boss / Vice Boss / Zaufany" />
          <StatLine label="Podzial hajsu" value="Dzialka na wszystkich uczestnikow" />
          <StatLine label="Konsekwencje wtopy" value="Ludzie i sprzet leca, czesc skladu siada" />
          <StatLine label="Minimalny kolejny prog" value={GANG_HEISTS.find((entry) => entry.minMembers > game.gang.members)?.name ?? "Kazdy prog odblokowany liczebnie"} />
          <StatLine label="Najblizsza blokada przez szacun" value={GANG_HEISTS.find((entry) => entry.respect > game.player.respect)?.name ?? "Szacun wystarcza na wszystko"} />
        </>
      )}
    </SectionCard>
  );

  const rankingPool = useMemo(() => {
    const selfEntry = {
      id: "self",
      name: game.player.name,
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
        lines={["Tu maja byc prawdziwi ludzie, nie boty."]}
        accent={["#342418", "#140f0c", "#050505"]}
        source={SCENE_BACKGROUNDS.gang}
      />
      {selectedWorldPlayer ? (
        <SectionCard title="Profil gracza" subtitle="Krotka karta i szybkie akcje.">
          <View style={styles.playerProfilePanel}>
            <View style={styles.playerProfileMain}>
              <LinearGradient colors={selectedWorldPlayer.online ? ["#57411a", "#1a1209"] : ["#363636", "#111111"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.playerProfileHero}>
                <EntityBadge visual={selectedWorldPlayer.gang !== "No gang" ? getGangVisual(selectedWorldPlayer.gang) : selectedWorldPlayer.online ? BUSINESS_VISUALS.club : FACTORY_VISUALS.smokeworks} large />
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
              <Pressable onPress={() => sendQuickMessageToPlayer(selectedWorldPlayer)} style={styles.inlineButton}>
                <Text style={styles.inlineButtonText}>Wyslij wiadomosc</Text>
              </Pressable>
              <Pressable onPress={() => attackWorldPlayer(selectedWorldPlayer)} style={styles.inlineButton}>
                <Text style={styles.inlineButtonText}>Atakuj</Text>
              </Pressable>
              <Pressable onPress={() => addWorldPlayerFriend(selectedWorldPlayer)} style={styles.inlineButton}>
                <Text style={styles.inlineButtonText}>Dodaj do znajomych</Text>
              </Pressable>
              <Pressable onPress={() => placeBountyOnPlayer(selectedWorldPlayer)} style={styles.inlineButton}>
                <Text style={styles.inlineButtonText}>Wystaw bounty</Text>
              </Pressable>
              <Pressable onPress={closeWorldPlayerProfile} style={styles.inlineButton}>
                <Text style={styles.inlineButtonText}>Wroc do listy</Text>
              </Pressable>
            </View>
          </View>
        </SectionCard>
      ) : null}
      <SectionCard title="Gracze" subtitle="Ludzie online na serwerze.">
        {!game.online.roster.length ? (
          <View style={styles.lockedPanel}>
            <Text style={styles.lockedPanelText}>Na razie pusto. Jak ludzie wejda online, pojawia sie tutaj.</Text>
          </View>
        ) : null}
        {game.online.roster.map((player) => (
          <Pressable key={player.id} style={styles.listCard} onPress={() => openWorldPlayerProfile(player.id)}>
            <View style={styles.listCardHeader}>
              <View style={styles.entityHead}>
                <EntityBadge visual={player.gang !== "No gang" ? getGangVisual(player.gang) : player.online ? BUSINESS_VISUALS.tower : FACTORY_VISUALS.smokeworks} />
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
    <SectionCard title="Znajomi" subtitle="Tu laduja ludzie, ktorych chcesz miec pod reka do kontaktu albo wspolnego grania.">
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
        </View>
      ))}
    </SectionCard>
  );

  const renderOnlineMessages = () => (
    <SectionCard title="Wiadomosci" subtitle="Tu pojdzie prywatna skrzynka i rozmowy 1 na 1.">
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

  const renderRankings = () => {
    const byRespect = [...rankingPool].sort((a, b) => b.respect - a.respect).slice(0, 6);
    const byCash = [...rankingPool].sort((a, b) => b.cash - a.cash).slice(0, 6);
    const byHeists = [...rankingPool].sort((a, b) => b.heists - a.heists).slice(0, 6);
    const byCasino = [...rankingPool].sort((a, b) => b.casino - a.casino).slice(0, 6);

    const RankingCard = ({ title, entries }) => (
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {entries.map((entry, index) => (
          <View key={`${title}-${entry.id}`} style={styles.listCard}>
            <View style={styles.inlineRow}>
              <View style={styles.entityHead}>
                <EntityBadge visual={entry.id === "self" ? BUSINESS_VISUALS.tower : FACTORY_VISUALS.designerlab} />
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
          lines={["Szacun, hajs, napady i kasyno. Te listy maja od razu mowic, kto jest grubym graczem.", "Docelowo beda lecialy z prawdziwej bazy i zywych statystyk online."]}
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

  const renderPremiumShop = () => (
    <>
      <SceneArtwork
        eyebrow="Premium"
        title="Miejsce na mikroplatnosci"
        lines={["Jest gdzie monetyzowac gre: tokeny, uslugi premium i pozniejsze eventy.", "To jest UI pod sklep i oferty, zamiast doklejania ich na sile gdzies z boku."]}
        accent={["#4b2a18", "#160f0c", "#050505"]}
        source={SCENE_BACKGROUNDS.casino}
      />
      <SectionCard title="Pakiety tokenow" subtitle="Sklep jest czytelny i gotowy pod pozniejsze spiecie z platnosciami.">
        {PREMIUM_PACKAGES.map((pack) => (
          <View key={pack.id} style={styles.listCard}>
            <View style={styles.listCardHeader}>
              <View style={styles.entityHead}>
                <EntityBadge visual={BUSINESS_VISUALS.tower} />
                <View style={styles.flexOne}>
                  <Text style={styles.listCardTitle}>{pack.name}</Text>
                  <Text style={styles.listCardMeta}>{pack.tokens} tokenow | {pack.bonus}</Text>
                </View>
              </View>
              <Text style={styles.listCardReward}>{pack.priceLabel}</Text>
            </View>
          </View>
        ))}
      </SectionCard>
    </>
  );

  const renderPremiumServices = () => (
    <SectionCard title="Uslugi premium" subtitle="Tu beda trafialy wszystkie sensowne uslugi monetizacyjne bez rozwalania balansu gry.">
      {PREMIUM_SERVICES.map((service) => (
        <View key={service.id} style={styles.listCard}>
          <View style={styles.listCardHeader}>
            <View style={styles.entityHead}>
              <EntityBadge visual={PRODUCT_VISUALS.crystal} />
              <View style={styles.flexOne}>
                <Text style={styles.listCardTitle}>{service.name}</Text>
                <Text style={styles.listCardMeta}>{service.description}</Text>
              </View>
            </View>
            <Tag text={`${service.cost} premium`} warning />
          </View>
        </View>
      ))}
      <View style={styles.lockedPanel}>
        <Text style={styles.lockedPanelText}>Google login i prawdziwe zakupy w sklepie wymagaja jeszcze podpiecia backendu, OAuth i sklepowych integracji. UI i miejsce w grze sa juz przygotowane.</Text>
      </View>
    </SectionCard>
  );

  const renderReferralProgram = () => (
    <>
      <SceneArtwork
        eyebrow="Polecenia"
        title="Program polecen pod wzrost gry"
        lines={["To ma byc zdrowy viral: nagradzamy za aktywnego gracza, nie za samo zalozenie multikonta.", "Docelowo polecony powinien dobic np. 15 szacunu i chwile pograc, zanim odpali nagrode."]}
        accent={["#4b2f18", "#160f0c", "#050505"]}
        source={SCENE_BACKGROUNDS.city}
      />
      <SectionCard title="Twoj kod polecajacy" subtitle="Ten system nadaje sie idealnie pod start gry, promocje ekip i pozniejszy marketing.">
        <View style={styles.heroBanner}>
          <Text style={styles.heroBannerTitle}>{game.referrals.code}</Text>
          <Text style={styles.heroBannerText}>Kod powinien dzialac przy pierwszym logowaniu lub zakladaniu konta. Nagroda wpada dopiero za aktywnego poleconego.</Text>
        </View>
        <StatLine label="Wyslane zaproszenia" value={`${game.referrals.invited}`} />
        <StatLine label="Aktywni poleceni" value={`${game.referrals.verified}`} />
        <StatLine label="Czekaja na aktywacje" value={`${game.referrals.pending}`} />
        <StatLine label="Zasada anty-farm" value="Nagroda dopiero po progresie poleconego" />
      </SectionCard>

      <SectionCard title="Progi nagrod" subtitle="Nagrody sa fajne, ale nie moga rozwalac balansu. Tu lepiej dawac premium, troche kasy i lekki bonus szacunu.">
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
                      {formatMoney(milestone.rewardCash)} | +{milestone.rewardPremium} premium{milestone.rewardRespect ? ` | +${milestone.rewardRespect} szacunu` : ""}
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

      <SectionCard title="Docelowe spiecie online" subtitle="To powinno byc w backendzie, bo inaczej ludzie beda to farmic.">
        <View style={styles.lockedPanel}>
          <Text style={styles.lockedPanelText}>Najlepsza wersja: kod przy rejestracji, aktywacja nagrody dopiero po wbiciu progu gry, blokada self-ref i kontrola urzadzen/IP. Wtedy masz i wzrost, i monetyzacje bez smieci.</Text>
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
    actions: { buyProduct, sellProduct, buyDrugFromDealer, sellDrugToDealer, consumeDrug },
  };

  const cityScreenProps = {
    section: activeSectionId,
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
    sceneBackgrounds: SCENE_BACKGROUNDS,
    systemVisuals: SYSTEM_VISUALS,
    energyRegenSeconds: ENERGY_REGEN_SECONDS,
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
    restaurantItems: RESTAURANT_ITEMS,
    gymPasses: GYM_PASSES,
    gymExercises: GYM_EXERCISES,
    taskStates,
    helpers: {
      hasGymPass,
      inJail,
      nextHeistName: HEISTS.find((entry) => entry.respect > game.player.respect)?.name ?? "Wszystkie odblokowane",
    },
    actions: {
      quickHeist: () => {
        const available = HEISTS.filter((entry) => entry.respect <= game.player.respect);
        executeHeist(available[available.length - 1] ?? HEISTS[0]);
      },
      fightClubRound,
      collectGangTribute,
      runClubNight,
      collectBusinessIncome,
      collectEscortIncome,
      claimTask,
      depositCash,
      withdrawCash,
      buyGymPass,
      doGymExercise,
      buyMeal,
      heal,
      bribeOutOfJail,
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
    startBlackjack,
    hitBlackjack,
    standBlackjack,
  };

  const empireScreenBaseProps = {
    game,
    styles,
    SceneArtwork,
    SectionCard,
    StatLine,
    ActionTile,
    EntityBadge,
    Tag,
    formatMoney,
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
    clubFoundingPremiumCost: CLUB_FOUNDING_PREMIUM_COST,
    clubEscortSearchCost: CLUB_ESCORT_SEARCH_COST,
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
    escortFindChance,
    clubNightRemaining,
    helpers: { getOwnedEscort, getEscortWorkingCount, getEscortDistrictCount, hasFactory, getDrugPoliceProfile, getClubVenueProfile },
    actions: {
      collectBusinessIncome,
      collectEscortIncome,
      buyBusiness,
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
      promoteClub,
      runClubNight,
      findEscortInClub,
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
    heists: HEISTS,
    getSoloHeistOdds,
    sceneBackgrounds: SCENE_BACKGROUNDS,
  };

  const renderActiveSection = () => {
    switch (`${tab}:${activeSectionId}`) {
      case "city:dashboard":
      case "city:tasks":
      case "city:bank":
      case "city:gym":
      case "city:restaurant":
      case "city:hospital":
        return <CityScreen {...cityScreenProps} />;
      case "city:casino":
        return <CasinoScreen {...casinoScreenProps} />;
      case "heists:solo":
        return renderSoloHeists();
      case "heists:gang":
        return renderGangHeists();
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
        return <MarketScreen section="street" {...marketScreenBaseProps} />;
      case "market:drugs":
        return <MarketScreen section="drugs" {...marketScreenBaseProps} />;
      case "market:boosts":
        return <MarketScreen section="boosts" {...marketScreenBaseProps} />;
      case "gang:overview":
        return renderGangOverview();
      case "gang:members":
        return renderGangMembers();
      case "gang:chat":
        return renderGangChat();
      case "gang:ops":
        return renderGangOps();
      case "online:players":
        return renderOnlinePlayers();
      case "online:friends":
        return renderOnlineFriends();
      case "online:messages":
        return renderOnlineMessages();
      case "online:rankings":
        return renderRankings();
      case "premium:shop":
        return renderPremiumShop();
      case "premium:services":
        return renderPremiumServices();
      case "premium:referrals":
        return renderReferralProgram();
      case "profile:summary":
        return <ProfileScreen section="summary" {...profileScreenBaseProps} />;
      case "profile:progress":
        return <ProfileScreen section="progress" {...profileScreenBaseProps} />;
      case "profile:protection":
        return <ProfileScreen section="protection" {...profileScreenBaseProps} />;
      case "profile:log":
        return <ProfileScreen section="log" {...profileScreenBaseProps} />;
      default:
        return <CityScreen {...cityScreenProps} />;
    }
  };

  const topTask = taskStates.find((task) => !task.claimed) || taskStates[0];
  const mobileStatusCards = [
    { label: "Bank", value: formatMoney(game.player.bank || 0) },
    { label: "Napady", value: `${game.stats.heistsDone}` },
    { label: "Skutecznosc", value: `${successRate}%` },
    { label: "Gang", value: `${game.gang.members}/30` },
    { label: "Heat", value: `${game.player.heat}%` },
    { label: "Boosty", value: `${game.activeBoosts.length}` },
  ];
  let activeSectionContent;

  try {
    activeSectionContent = renderActiveSection();
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
            <LinearGradient colors={["#505050", "#1b1b1b", "#090909"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.topStrip}>
              <View style={styles.topStripVisual}>
                <ImageBackground source={SCENE_BACKGROUNDS.city} style={styles.topStripVisualImage} imageStyle={styles.topStripVisualImageInner} />
                <LinearGradient colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.82)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.topStripVisualScrim} />
                <View style={styles.topStripPhotoLarge} />
                <View style={styles.topStripPhotoSmall} />
              </View>

              <View style={[styles.topStripContent, isPhone && styles.topStripContentPhone]}>
                <View style={[styles.topStripProfile, isPhone && styles.topStripProfilePhone]}>
                  <LinearGradient colors={activeAvatar.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.profileShot}>
                    {activeAvatar.image ? <Image source={activeAvatar.image} style={styles.profileShotImage} /> : null}
                    {activeAvatar.image ? <View style={styles.profileShotScrim} /> : null}
                    {!activeAvatar.image ? <Text style={styles.profileShotSigil}>{activeAvatar.sigil}</Text> : null}
                    <Text style={styles.profileShotLevel}>LVL {respectInfo.level}</Text>
                  </LinearGradient>
                  <View style={styles.profileMeta}>
                    <Text style={styles.playerAlias}>{game.player.name}</Text>
                    <Text style={styles.playerRank}>{getRankTitle(game.player.respect)}</Text>
                    <Text style={styles.playerSmall}>Status API: {apiStatus === "online" ? "online" : "lokalny fallback"}</Text>
                  </View>
                </View>

                <View style={[styles.statCluster, isPhone && styles.statClusterPhone]}>
                  <View style={styles.statColumn}>
                    <HeaderStat label="Energia" value={`${game.player.energy}/${game.player.maxEnergy}`} />
                    <HeaderStat label="Atak" value={`${effectivePlayer.attack}`} />
                    <HeaderStat label="Zdrowie" value={`${game.player.hp}/${game.player.maxHp}`} />
                  </View>
                  <View style={styles.statColumn}>
                    <HeaderStat label="Obrona" value={`${effectivePlayer.defense}`} />
                    <HeaderStat label="Zrecznosc" value={`${effectivePlayer.dexterity}`} />
                    <HeaderStat label="Kasa" value={formatMoney(game.player.cash)} />
                  </View>
                  <View style={styles.statColumnWide}>
                    <Text style={styles.topStatLabel}>Szacun</Text>
                    <Text style={styles.topStatValue}>{game.player.respect}</Text>
                    <ProgressBar progress={respectInfo.progress} />
                    <ProgressDots progress={respectInfo.progress} />
                  </View>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.mastheadPanel}>
              <ImageBackground
                source={SCENE_BACKGROUNDS.gangWide}
                style={[styles.mastheadImage, isPhone && styles.mastheadImagePhone]}
                imageStyle={[styles.mastheadImageInner, isPhone && styles.mastheadImageInnerPhone]}
              >
                <LinearGradient colors={["rgba(8,8,8,0.05)", "rgba(8,8,8,0.28)", "rgba(8,8,8,0.9)"]} start={{ x: 0.1, y: 0 }} end={{ x: 0.85, y: 1 }} style={styles.mastheadOverlay}>
                  <View style={styles.mastheadHeroCopy}>
                    <Text style={styles.mastheadEyebrow}>Hustle City</Text>
                    <Text style={styles.mastheadHeroTitle}>Miasto bierzesz po swojemu</Text>
                    <Text style={styles.mastheadHeroText}>{inJail(game.player) ? `Cela jeszcze ${formatDuration(jailRemaining)}.` : "Fury, stol, bron i szybka kasa."}</Text>
                    <View style={styles.mastheadHeroTags}>
                      <Tag text="Fury" />
                      <Tag text="Kluby" />
                      <Tag text="Blackjack" />
                      <Tag text="Napady" warning />
                      <Tag text="Towar" />
                    </View>
                  </View>
                </LinearGradient>
              </ImageBackground>
            </View>

            {notice ? (
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

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabBarClassic}
              contentContainerStyle={styles.tabBarClassicContent}
            >
              {TAB_DEFINITIONS.map((item) => (
                <Pressable key={item.id} onPress={() => setTab(item.id)} style={[styles.tabButtonClassic, tab === item.id && styles.tabButtonClassicActive]}>
                  <Text style={[styles.tabButtonClassicText, tab === item.id && styles.tabButtonClassicTextActive]}>{item.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {isPhone ? (
              <View style={styles.mobileTopSectionRail}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileTopSectionRailContent}>
                  {activeTab.sections.map((item) => (
                    <Pressable key={item.id} onPress={() => setActiveSection(tab, item.id)} style={[styles.mobileTopSectionChip, activeSectionId === item.id && styles.mobileTopSectionChipActive]}>
                      <Text style={[styles.mobileTopSectionText, activeSectionId === item.id && styles.mobileTopSectionTextActive]}>{item.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <View style={[styles.mainBoard, isCompact && styles.mainBoardCompact]}>
              {isPhone ? null : (
                <View style={[styles.leftRail, isCompact && styles.railCompact]}>
                  <Text style={styles.railHeading}>Menu</Text>
                  {activeTab.sections.map((item) => (
                    <Pressable key={item.id} onPress={() => setActiveSection(tab, item.id)} style={[styles.railLink, activeSectionId === item.id && styles.railLinkActive]}>
                      <Text style={[styles.railLinkText, activeSectionId === item.id && styles.railLinkTextActive]}>{item.label}</Text>
                    </Pressable>
                  ))}
                  <Pressable onPress={() => setActiveSection("city", "tasks")} style={styles.cashButtonFrame}>
                    <Text style={styles.cashButtonText}>Zadania</Text>
                  </Pressable>
                </View>
              )}

              <View style={[styles.centerStage, isPhone && styles.centerStagePhone]}>
                {isPhone ? (
                  <></>
                ) : null}
                <View style={styles.contentHeaderBar}>
                  <Text style={styles.contentHeaderLabel}>{activeSection.title}</Text>
                  <Text style={styles.contentHeaderSub}>Hustle City</Text>
                </View>
                {activeSectionContent}
                {isPhone ? (
                  <View style={styles.mobileBottomDock}>
                    <Pressable onPress={() => setMobileHudOpen((prev) => !prev)} style={[styles.mobileHudToggle, mobileHudOpen && styles.mobileHudToggleActive]}>
                      <Text style={styles.mobileHudToggleTitle}>{mobileHudOpen ? "Schowaj panel" : "Panel gracza"}</Text>
                      <Text style={styles.mobileHudToggleMeta}>{topTask?.title || "Brak zadania"}</Text>
                    </Pressable>
                    {mobileHudOpen ? (
                      <View style={styles.mobileQuickBoard}>
                        <Pressable onPress={() => setActiveSection("city", "tasks")} style={styles.mobileTaskCard}>
                          <Text style={styles.mobileTaskEyebrow}>Misja</Text>
                          <Text style={styles.mobileTaskTitle}>{topTask.title}</Text>
                          <Text style={styles.mobileTaskText}>{topTask.description}</Text>
                        </Pressable>
                        <View style={styles.mobileStatusGrid}>
                          {mobileStatusCards.map((card) => (
                            <View key={card.label} style={styles.mobileStatusCard}>
                              <Text style={styles.mobileStatusLabel}>{card.label}</Text>
                              <Text style={styles.mobileStatusValue}>{card.value}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>

              {isPhone ? null : (
                <View style={[styles.rightRail, isCompact && styles.railCompact]}>
                  <Pressable onPress={() => setActiveSection("city", "tasks")} style={styles.sidebarCard}>
                    <Text style={styles.sidebarTitle}>Zadanie</Text>
                    <Text style={styles.sidebarText}>{topTask.title}</Text>
                    <Text style={styles.sidebarTinyText}>{topTask.description}</Text>
                  </Pressable>

                  <View style={styles.sidebarCard}>
                    <Text style={styles.sidebarTitle}>Status</Text>
                    <StatLine label="Bank" value={formatMoney(game.player.bank || 0)} visual={SYSTEM_VISUALS.bank} />
                    <StatLine label="Napady" value={`${game.stats.heistsDone}`} visual={SYSTEM_VISUALS.heist} />
                    <StatLine label="Skutecznosc" value={`${successRate}%`} visual={SYSTEM_VISUALS.respect} />
                    <StatLine label="Gang" value={`${game.gang.members}/30`} visual={SYSTEM_VISUALS.gang} />
                  </View>

                  <View style={styles.sidebarCard}>
                    <Text style={styles.sidebarTitle}>Szacun</Text>
                    <Text style={styles.sidebarText}>Poziom {respectInfo.level}</Text>
                    <ProgressBar progress={respectInfo.progress} />
                    <ProgressDots progress={respectInfo.progress} />
                  </View>

                  <View style={styles.sidebarCardTall}>
                    <Text style={styles.sidebarTiny}>Heat</Text>
                    <Text style={styles.sidebarOnline}>{game.player.heat}%</Text>
                    <Text style={styles.sidebarTiny}>Odsiadka</Text>
                    <Text style={styles.sidebarNumberSmall}>{inJail(game.player) ? formatDuration(jailRemaining) : "WOLNY"}</Text>
                    <Text style={styles.sidebarTiny}>Boosty</Text>
                    <Text style={styles.sidebarOnline}>{game.activeBoosts.length}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
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
  topStripContentPhone: { flexDirection: "column" },
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
  statClusterPhone: { width: "100%", justifyContent: "flex-start" },
  statColumn: { gap: 6, width: 90 },
  statColumnWide: { gap: 6, width: 120 },
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
  tabBarClassic: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#3c3c3c", backgroundColor: "#0b0b0b", maxHeight: 54 },
  tabBarClassicContent: { paddingHorizontal: 8, paddingVertical: 8, gap: 8, alignItems: "center" },
  tabButtonClassic: { minWidth: 76, paddingVertical: 9, paddingHorizontal: 12, borderWidth: 1, borderColor: "#2f2f2f", backgroundColor: "#0d0d0d", alignItems: "center", borderRadius: 999 },
  tabButtonClassicActive: { backgroundColor: "#181818", borderColor: "#8e6c34" },
  tabButtonClassicText: { color: "#b7b7b7", fontSize: 12, fontWeight: "700" },
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
  actionTile: { width: "48%", minHeight: 106, padding: 14, borderRadius: 18, backgroundColor: "#141414", borderWidth: 1, borderColor: "#303030", justifyContent: "space-between" },
  actionTileDanger: { backgroundColor: "#24110f", borderColor: "#6a2b20" },
  tileDisabled: { opacity: 0.45 },
  actionTileHeader: { gap: 10, marginBottom: 8 },
  actionTileTitle: { color: "#f0f0f0", fontSize: 16, fontWeight: "800", marginBottom: 6 },
  actionTileSubtitle: { color: "#aaa79d", fontSize: 12, lineHeight: 18 },
  statLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#1b1b1d", gap: 12 },
  statLineLabelWrap: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  statLineLabel: { color: "#a69e93", fontSize: 13, flex: 1 },
  statLineValue: { color: "#f4efe8", fontSize: 13, fontWeight: "700", maxWidth: "54%", textAlign: "right" },
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
  listCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 12 },
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
  entityImageTint: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  entityEmojiWrap: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.18)" },
  entityEmoji: { fontSize: 24 },
  entityEmojiLarge: { fontSize: 32 },
  entityCodePill: { position: "absolute", bottom: 6, right: 6, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.72)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  entityCode: { color: "#f4efe8", fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  listCardTitle: { color: "#f3eee7", fontSize: 15, fontWeight: "800", marginBottom: 4 },
  listCardMeta: { color: "#999082", fontSize: 12, lineHeight: 18 },
  listCardReward: { color: "#d6a04f", fontSize: 13, fontWeight: "800", maxWidth: 110, textAlign: "right" },
  oddsRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  oddsBlock: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: "#27282d", backgroundColor: "#101114" },
  oddsLabel: { color: "#948a7d", fontSize: 11, textTransform: "uppercase", marginBottom: 4, letterSpacing: 0.8 },
  oddsValue: { color: "#f4d37e", fontSize: 18, fontWeight: "800" },
  inlineButton: { alignSelf: "flex-start", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 2, backgroundColor: "#201712", borderWidth: 1, borderColor: "#5b3529" },
  inlineButtonText: { color: "#f6efe6", fontWeight: "700", fontSize: 13 },
  inlineRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
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
  mobileTopSectionChip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, backgroundColor: "#121317", borderWidth: 1, borderColor: "#2d2f36" },
  mobileTopSectionChipActive: { backgroundColor: "#1a1510", borderColor: "#a77732" },
  mobileTopSectionText: { color: "#d1d4da", fontSize: 11, fontWeight: "700" },
  mobileTopSectionTextActive: { color: "#f0c24d" },
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
  mobileStatusCard: { width: "48%", minHeight: 74, padding: 12, borderRadius: 16, backgroundColor: "#101114", borderWidth: 1, borderColor: "#292c33" },
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
  chatComposer: { flexDirection: "row", gap: 10, marginBottom: 12, alignItems: "center" },
  chatInput: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: "#2f3034", backgroundColor: "#111214", color: "#f1f1f1", paddingHorizontal: 12, paddingVertical: 10 },
  chatBubble: { padding: 12, backgroundColor: "#111111", borderWidth: 1, borderColor: "#26282b", marginBottom: 8 },
  chatAuthor: { color: "#f0c24d", fontWeight: "800", marginBottom: 4 },
  chatTime: { color: "#999999", fontWeight: "400" },
  chatText: { color: "#dbd5ca", lineHeight: 18 },
  prisonChatWrap: { marginTop: 14 },
  lockedPanel: { marginTop: 12, padding: 14, borderWidth: 1, borderColor: "#2c2e31", backgroundColor: "#121314" },
  lockedPanelText: { color: "#a7a097", lineHeight: 18 },
  heroBanner: { padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#3c2c1d", backgroundColor: "#1a130d" },
  sceneArtwork: { minHeight: 150, marginBottom: 12, borderWidth: 1, borderColor: "#34271f", overflow: "hidden", justifyContent: "flex-end", borderRadius: 18 },
  sceneArtworkBackdrop: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0 },
  sceneArtworkImage: { opacity: 0.92 },
  sceneArtworkTint: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0 },
  sceneGlow: { position: "absolute", width: 180, height: 180, borderRadius: 999, backgroundColor: "rgba(255,190,120,0.08)", top: -30, right: -30 },
  sceneBars: { position: "absolute", left: 16, right: 16, bottom: 0, flexDirection: "row", alignItems: "flex-end", gap: 8 },
  sceneBar: { flex: 1, backgroundColor: "rgba(255,255,255,0.08)", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.2)" },
  sceneCopy: { padding: 16, gap: 5 },
  sceneEyebrow: { color: "#f0c24d", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.2 },
  sceneTitle: { color: "#f4efe8", fontSize: 24, fontWeight: "900" },
  sceneLine: { color: "#c7baaa", lineHeight: 18, maxWidth: "78%" },
  heroBannerTitle: { color: "#f4d37e", fontSize: 20, fontWeight: "900", marginBottom: 6 },
  heroBannerText: { color: "#d8cab5", lineHeight: 18 },
  mobileOverviewGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  mobileOverviewCard: { width: "48%", minHeight: 74, padding: 12, borderRadius: 16, backgroundColor: "#15161a", borderWidth: 1, borderColor: "#2d3037" },
  mobileOverviewLabel: { color: "#8e929a", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  mobileOverviewValue: { color: "#f4efe8", fontSize: 16, fontWeight: "800" },
  mobileOverviewValueSmall: { color: "#f4efe8", fontSize: 13, fontWeight: "800", lineHeight: 18 },
  playerProfilePanel: { gap: 12 },
  playerProfileMain: { flexDirection: "row", gap: 12, alignItems: "stretch", flexWrap: "wrap" },
  playerProfileHero: { width: 280, minHeight: 220, borderWidth: 1, borderColor: "#5a4123", padding: 16, justifyContent: "space-between" },
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
  betPanel: { width: "48%", padding: 12, borderWidth: 1, borderColor: "#2d2d31", backgroundColor: "#101114" },
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

