import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { FACTORIES, SUPPLIERS, getDrugBatchSupplyCost } from "../shared/empire.js";
import { DRUGS, getDealerPayoutForDrug } from "../shared/socialGameplay.js";

const HOST = "127.0.0.1";
const PORT = 4100;
const BASE_URL = `http://${HOST}:${PORT}`;
const AUTH_REGISTER_DELAY_MS = 2600;
const AUTH_LOGIN_DELAY_MS = 1300;

async function delay(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth(retries = 40) {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}/health`);
      if (response.ok) {
        return;
      }
    } catch (_error) {}
    await delay(500);
  }
  throw new Error("Backend nie wystartowal na czas.");
}

async function request(pathname, { method = "GET", token, body } = {}) {
  const response = await fetch(`${BASE_URL}${pathname}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (_error) {
      throw new Error(`Endpoint ${pathname} nie zwrocil JSON: ${text.slice(0, 120)}`);
    }
  }

  if (!response.ok) {
    throw new Error(`${pathname} -> HTTP ${response.status}: ${data.error || "unknown error"}`);
  }

  return data;
}

async function expectRequestFailure(pathname, options = {}, pattern) {
  try {
    await request(pathname, options);
  } catch (error) {
    if (pattern && !pattern.test(String(error.message || ""))) {
      throw new Error(`Endpoint ${pathname} zwrocil inny blad niz oczekiwano: ${error.message}`);
    }
    return;
  }

  throw new Error(`Endpoint ${pathname} mial zwrocic blad, ale przeszedl.`);
}

function startServer(dataDir) {
  const child = spawn(
    process.execPath,
    ["backend/src/server.js"],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        HOST,
        PORT: String(PORT),
        NODE_ENV: "test",
        JWT_SECRET: "smoke-test-secret",
        CORS_ORIGIN: "http://localhost:8090",
        DATA_DIR: dataDir,
        ALPHA_TEST_STARTING_CASH: "7500000",
        ALPHA_TEST_STARTING_BANK: "5000000",
        ALPHA_TEST_STARTING_RESPECT: "30",
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  child.stdout.on("data", (chunk) => {
    process.stdout.write(`[backend] ${chunk}`);
  });
  child.stderr.on("data", (chunk) => {
    process.stderr.write(`[backend] ${chunk}`);
  });

  return child;
}

async function stopServer(child) {
  if (!child || child.killed) return;

  await new Promise((resolve) => {
    child.once("exit", () => resolve());
    child.kill();
    setTimeout(() => resolve(), 5000);
  });
}

async function forceUsersIntoJail(dataDir, logins, durationMs = 15 * 60 * 1000) {
  const usersDbPath = path.join(dataDir, "users.db");
  const safeLogins = new Set(
    (Array.isArray(logins) ? logins : [logins])
      .map((entry) => String(entry || "").trim().toLowerCase())
      .filter(Boolean)
  );
  if (!safeLogins.size) {
    throw new Error("Brak loginow do ustawienia jail state w smoke tescie.");
  }

  const now = Date.now();
  const content = await readFile(usersDbPath, "utf8");
  const nextLines = content
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const doc = JSON.parse(line);
      const usernameLower = String(doc?.usernameLower || "").trim().toLowerCase();
      if (!safeLogins.has(usernameLower)) {
        return line;
      }

      doc.playerData = doc.playerData || {};
      doc.playerData.profile = doc.playerData.profile || {};
      doc.playerData.profile.jailUntil = now + durationMs;
      return JSON.stringify(doc);
    });

  await writeFile(usersDbPath, `${nextLines.join("\n")}\n`, "utf8");
}

function assertFactoryRecipeProfitability() {
  const factoryNames = Object.fromEntries(FACTORIES.map((factory) => [factory.id, factory.name]));

  for (const drug of DRUGS) {
    const supplyCost = getDrugBatchSupplyCost(drug, SUPPLIERS);
    const payout = getDealerPayoutForDrug(drug) * Number(drug.batchSize || 0);
    const profit = payout - supplyCost;

    if (profit <= 0) {
      throw new Error(
        `Balans fabryki znowu jest na minusie: ${factoryNames[drug.factoryId] || drug.factoryId} / ${drug.name} daje ${profit}.`
      );
    }
  }
}

async function main() {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), "hustle-city-smoke-"));
  let server = null;

  try {
    assertFactoryRecipeProfitability();
    server = startServer(dataDir);
    await waitForHealth();

    const unique = Date.now();
    const login = `smoke${unique}`;
    const noEmailLoginOne = `sna${unique}`;
    const noEmailLoginTwo = `snb${unique}`;
    const password = "smoke123";
    const chatText = `smoke-message-${unique}`;

    const registerResult = await request("/auth/register", {
      method: "POST",
      body: {
        login,
        username: login,
        email: `${login}@example.com`,
        password,
      },
    });

    const token = registerResult.token;
    if (!token) {
      throw new Error("Rejestracja nie zwrocila tokena.");
    }

    const depositAmount = 12345;
    const depositedBank = await request("/bank/deposit", {
      method: "POST",
      token,
      body: { amount: depositAmount },
    });

    if (Number(depositedBank?.user?.profile?.cash || 0) !== 7500000 - depositAmount) {
      throw new Error("Bank deposit nadal zjada dodatkowa kase.");
    }
    if (Number(depositedBank?.user?.profile?.bank || 0) !== 5000000 + depositAmount) {
      throw new Error("Bank deposit nie podniosl salda o pelna kwote.");
    }

    const withdrawnBank = await request("/bank/withdraw", {
      method: "POST",
      token,
      body: { amount: depositAmount },
    });

    if (Number(withdrawnBank?.user?.profile?.cash || 0) !== 7500000) {
      throw new Error("Bank withdraw nadal zjada dodatkowa kase.");
    }
    if (Number(withdrawnBank?.user?.profile?.bank || 0) !== 5000000) {
      throw new Error("Bank withdraw nie odjal pelnej kwoty bez fee.");
    }

    await delay(AUTH_REGISTER_DELAY_MS);
    const noEmailRegisterOne = await request("/auth/register", {
      method: "POST",
      body: {
        login: noEmailLoginOne,
        username: noEmailLoginOne,
        password,
      },
    });

    await delay(AUTH_REGISTER_DELAY_MS);
    const noEmailRegisterTwo = await request("/auth/register", {
      method: "POST",
      body: {
        login: noEmailLoginTwo,
        username: noEmailLoginTwo,
        password,
      },
    });

    if (!noEmailRegisterOne.token || !noEmailRegisterTwo.token) {
      throw new Error("Rejestracja bez maila nie zwrocila tokena.");
    }

    await request("/auth/login", {
      method: "POST",
      body: { login, password },
    });

    await delay(AUTH_LOGIN_DELAY_MS);
    await request("/auth/login", {
      method: "POST",
      body: { login: noEmailLoginOne, password },
    });

    await delay(AUTH_LOGIN_DELAY_MS);
    await request("/auth/login", {
      method: "POST",
      body: { login: noEmailLoginTwo, password },
    });

    const heists = await request("/heists", { token });
    const starterHeist = heists.heists?.find((entry) => entry.id === "pickpocket") || heists.heists?.[0];
    if (!starterHeist) {
      throw new Error("Backend nie zwrocil katalogu napadow.");
    }

    const preMe = await request("/me", { token });
    const cashBeforeHeist = preMe.user.profile.cash;
    const attackBeforeGym = preMe.user.profile.attack;

    const heistResult = await request(`/heists/${starterHeist.id}/execute`, {
      method: "POST",
      token,
    });

    await request(`/heists/${starterHeist.id}/execute`, {
      method: "POST",
      token,
    });

    await request(`/heists/${starterHeist.id}/execute`, {
      method: "POST",
      token,
    });

    await request("/chat/global", {
      method: "POST",
      token,
      body: { text: chatText },
    });

    await request("/player/gym/pass", {
      method: "POST",
      token,
      body: { passId: "day" },
    });

    const claimedGymTask = await request("/tasks/claim", {
      method: "POST",
      token,
      body: { taskId: "gym-pass" },
    });

    if (!claimedGymTask?.result?.rewardCash) {
      throw new Error("Claim taska gym-pass nie zwrocil nagrody.");
    }

    const gymTrainResult = await request("/player/gym/train", {
      method: "POST",
      token,
      body: { exerciseId: "power", repetitions: 3 },
    });

    if (gymTrainResult?.result?.repetitions !== 3) {
      throw new Error("Backend nie policzyl treningu wieloserii.");
    }

    const claimedFirstWaveTask = await request("/tasks/claim", {
      method: "POST",
      token,
      body: { taskId: "first-wave" },
    });

    if (!claimedFirstWaveTask?.result?.rewardXp) {
      throw new Error("Claim taska first-wave nie zwrocil XP.");
    }

    await expectRequestFailure(
      "/tasks/claim",
      {
        method: "POST",
        token,
        body: { taskId: "crew" },
      },
      /gang|serwerowo/i
    );

    const initialDistricts = await request("/districts", { token });
    if (!Array.isArray(initialDistricts?.districts) || initialDistricts.districts.length !== 3) {
      throw new Error("Backend nie zwrocil trzech dzielnic MVP.");
    }

    const createdGang = await request("/gang/create", {
      method: "POST",
      token,
      body: { gangName: "Smoke Syndicate" },
    });

    if (!createdGang?.user?.gang?.joined || createdGang.user.gang.name !== "Smoke Syndicate") {
      throw new Error("Tworzenie gangu nie zapisalo nowego stanu backendowego.");
    }
    if (!Array.isArray(createdGang?.gangs) || !createdGang.gangs.some((entry) => entry.name === "Smoke Syndicate")) {
      throw new Error("Katalog gangow nie pokazuje nowo zalozonego gangu.");
    }

    const updatedGangSettings = await request("/gang/settings", {
      method: "POST",
      token,
      body: { inviteRespectMin: 30 },
    });

    if (Number(updatedGangSettings?.user?.gang?.inviteRespectMin || 0) !== 30) {
      throw new Error("Ustawienia gangu nie zapisaly progu wejscia.");
    }
    if (!Array.isArray(updatedGangSettings?.gangs) || !updatedGangSettings.gangs.some((entry) => entry.name === "Smoke Syndicate" && Number(entry.inviteRespectMin || 0) === 30)) {
      throw new Error("Katalog gangow nie odswiezyl progu wejscia po zmianie ustawien.");
    }

    const focusedGang = await request("/gang/focus", {
      method: "POST",
      token,
      body: { districtId: "neon" },
    });

    if (focusedGang?.user?.gang?.focusDistrictId !== "neon") {
      throw new Error("Gang focus nie przelaczyl sie na Neon.");
    }

    const gangTribute = await request("/gang/tribute", {
      method: "POST",
      token,
      body: { amount: 12000 },
    });

    if (Number(gangTribute?.user?.gang?.vault || 0) < 16000) {
      throw new Error("Wrzutka do skarbca nie podniosla vaultu gangu.");
    }

    const investedGangProject = await request("/gang/projects/invest", {
      method: "POST",
      token,
      body: { projectId: "district-push" },
    });

    if (Number(investedGangProject?.user?.gang?.projects?.["district-push"] || 0) < 1) {
      throw new Error("Projekt gangu nie wskoczyl na pierwszy poziom.");
    }

    const casinoMeta = await request("/casino/meta", { token });
    if (!casinoMeta?.limits?.slot || !casinoMeta?.limits?.highRisk) {
      throw new Error("Kasyno nie zwrocilo limitow backendowych.");
    }

    const slotBet = Math.max(100, Number(casinoMeta?.limits?.slot?.minBet || 100));
    const slotSpin = await request("/casino/slot", {
      method: "POST",
      token,
      body: { bet: slotBet },
    });

    if (!slotSpin?.outcome?.id || !slotSpin?.user?.profile) {
      throw new Error("Slot online nie zwrocil kompletnego wyniku backendowego.");
    }
    if (!Number.isFinite(Number(slotSpin?.net))) {
      throw new Error("Slot online nie zwrocil netto rozliczenia.");
    }

    await delay(1000);

    const clubPvpPreview = await request("/club-pvp/preview", {
      method: "POST",
      token,
      body: {
        attacker: {
          attack: 34,
          defense: 28,
          dexterity: 30,
          respect: 30,
          heat: 12,
          gangMembers: 3,
          gangInfluence: 8,
          committedCrew: 3,
          intelBonus: 0,
        },
        defender: {
          ownerAttack: 26,
          ownerDefense: 24,
          ownerDexterity: 22,
          ownerRespect: 28,
          ownerHeat: 18,
          gangMembers: 4,
          gangInfluence: 10,
          popularity: 42,
          mood: 60,
          recentTraffic: 5,
          recentIncomingAttacks: 0,
          recentIncomingFromSameAttacker: 0,
          clubAgeHours: 96,
          defenderShieldSeconds: 0,
          clubCash: 24000,
          targetUnclaimedIncome: 4800,
          targetNetWorth: 90000,
          clubSecurityLevel: 2,
          baseNet: 5400,
        },
      },
    });

    if (!Number.isFinite(Number(clubPvpPreview?.raidChance?.chance))) {
      throw new Error("Club PvP preview nie zwrocil szansy najazdu.");
    }
    if (Number(clubPvpPreview?.cooldowns?.sameTargetRepeatCooldownSeconds || 0) <= 0) {
      throw new Error("Club PvP preview nie zwrocil cooldownu celu.");
    }

    const boughtBusiness = await request("/businesses/buy", {
      method: "POST",
      token,
      body: { businessId: "tower" },
    });

    if (!Array.isArray(boughtBusiness?.user?.businessesOwned) || !boughtBusiness.user.businessesOwned.some((entry) => entry.id === "tower")) {
      throw new Error("Kupno biznesu nie zapisalo ownership na backendzie.");
    }

    await delay(1300);

    const collectedBusiness = await request("/businesses/collect", {
      method: "POST",
      token,
    });

    if (!Number.isFinite(collectedBusiness?.result?.payout) || collectedBusiness.result.payout <= 0) {
      throw new Error("Collect biznesu nie zwrocil dodatniego payoutu.");
    }
    if (Math.floor(Number(collectedBusiness?.user?.collections?.businessCash || 0)) !== 0) {
      throw new Error("Collect biznesu nie wyzerowal skrytki.");
    }

    const boughtFactory = await request("/factories/buy", {
      method: "POST",
      token,
      body: { factoryId: "smokeworks" },
    });

    if (Number(boughtFactory?.user?.factoriesOwned?.smokeworks || 0) <= 0) {
      throw new Error("Kupno fabryki nie zapisalo ownership.");
    }

    await request("/factories/supplies/buy", {
      method: "POST",
      token,
      body: { supplyId: "tobacco", quantity: 2 },
    });

    const boughtPackaging = await request("/factories/supplies/buy", {
      method: "POST",
      token,
      body: { supplyId: "packaging", quantity: 1 },
    });

    if (Number(boughtPackaging?.user?.supplies?.tobacco || 0) < 2 || Number(boughtPackaging?.user?.supplies?.packaging || 0) < 1) {
      throw new Error("Kupno dostaw nie podnioslo stanu supplies.");
    }

    let producedDrug = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      producedDrug = await request("/factories/produce", {
        method: "POST",
        token,
        body: { drugId: "smokes" },
      });
      if (!producedDrug?.result?.busted) {
        break;
      }

      await request("/factories/supplies/buy", {
        method: "POST",
        token,
        body: { supplyId: "tobacco", quantity: 2 },
      });
      await request("/factories/supplies/buy", {
        method: "POST",
        token,
        body: { supplyId: "packaging", quantity: 1 },
      });
    }

    if (producedDrug?.result?.busted) {
      throw new Error("Produkcja smokes trafila bust 3 razy pod rzad, przez co smoke stalby sie losowy.");
    }
    if (Number(producedDrug?.user?.drugInventory?.smokes || 0) <= 0) {
      throw new Error("Produkcja nie dodala towaru do magazynu.");
    }
    if (!producedDrug?.result?.districtId) {
      throw new Error("Produkcja nie zwrocila dzielnicy fabryki.");
    }
    if (Number(producedDrug?.user?.stats?.drugBatches || 0) < 1) {
      throw new Error("Produkcja nie podniosla statystyki drugBatches.");
    }

    await request("/player/profile/avatar", {
      method: "POST",
      token,
      body: { avatarId: "boss" },
    });

    const midMe = await request("/me", { token });
    const players = await request("/social/players", { token });
    const rankings = await request("/social/rankings", { token });
    const chat = await request("/chat/global", { token });

    if (!Array.isArray(players.players) || !players.players.some((entry) => entry.name === login)) {
      throw new Error("Gracz nie pojawia sie w katalogu social.");
    }

    const socialEntry = players.players.find((entry) => entry.name === login);
    if (socialEntry?.avatarId !== "boss") {
      throw new Error("Katalog social nie zwraca avatarId gracza.");
    }

    const adminLogin = await request("/auth/login", {
      method: "POST",
      body: { login: "czincza11", password: "1234" },
    });

    const adminToken = adminLogin?.token;
    if (!adminToken) {
      throw new Error("Logowanie admina nie zwrocilo tokena.");
    }

      const grantAmount = 20000;
      const grantResult = await request(`/admin/players/${socialEntry.id}/grant-cash`, {
        method: "POST",
        token: adminToken,
        body: { amount: grantAmount },
    });

    if (Number(grantResult?.result?.amount || 0) !== grantAmount) {
      throw new Error("Admin grant nie zwrocil prawidlowej kwoty.");
    }

    const postGrantMe = await request("/me", { token });
      if (Number(postGrantMe?.user?.profile?.cash || 0) < Number(midMe?.user?.profile?.cash || 0) + grantAmount) {
        throw new Error("Admin grant nie dosypal gotowki wskazanemu graczowi.");
      }

      const respectGrantAmount = 10;
      const respectGrantResult = await request(`/admin/players/${socialEntry.id}/grant-respect`, {
        method: "POST",
        token: adminToken,
        body: { amount: respectGrantAmount },
      });

      if (Number(respectGrantResult?.result?.amount || 0) !== respectGrantAmount) {
        throw new Error("Admin respect grant nie zwrocil prawidlowej kwoty.");
      }

      const postRespectGrantMe = await request("/me", { token });
      if (Number(postRespectGrantMe?.user?.profile?.respect || 0) < Number(postGrantMe?.user?.profile?.respect || 0) + respectGrantAmount) {
        throw new Error("Admin respect grant nie podbil szacunku wskazanemu graczowi.");
      }

    const rankingEntries = [
      ...(rankings.byRespect || []),
      ...(rankings.byCash || []),
      ...(rankings.byHeists || []),
      ...(rankings.byCasino || []),
    ];
    if (!rankingEntries.some((entry) => entry.name === login)) {
      throw new Error("Gracz nie pojawia sie w rankingach.");
    }

    const rankedPlayer = rankingEntries.find((entry) => entry.name === login);
    if (rankedPlayer?.avatarId !== "boss") {
      throw new Error("Rankingi nie zwracaja avatarId gracza.");
    }

    if (!Array.isArray(chat.messages) || !chat.messages.some((entry) => entry.text === chatText)) {
      throw new Error("Wiadomosc chatu nie zostala zapisana.");
    }

    if (midMe.user.profile.attack <= attackBeforeGym) {
      throw new Error("Trening na silowni nie podniosl statystyki ataku.");
    }

    const firstAttackTarget = players.players.find((entry) => entry.name === noEmailLoginTwo);
    const secondAttackTarget = players.players.find((entry) => entry.name === noEmailLoginOne);
    if (!firstAttackTarget?.id || !secondAttackTarget?.id) {
      throw new Error("Nie znaleziono celow do testu ataku gracza.");
    }

    const gangInviteResult = await request("/gang/invite", {
      method: "POST",
      token,
      body: { targetUserId: secondAttackTarget.id },
    });

    if (!gangInviteResult?.result?.message) {
      throw new Error("Zaproszenie do gangu nie zwrocilo komunikatu backendowego.");
    }

    const secondGangInviteResult = await request("/gang/invite", {
      method: "POST",
      token,
      body: { targetUserId: firstAttackTarget.id },
    });

    if (!secondGangInviteResult?.result?.message) {
      throw new Error("Drugie zaproszenie do gangu nie zwrocilo komunikatu backendowego.");
    }

    await delay(AUTH_LOGIN_DELAY_MS);
    const invitedUserLogin = await request("/auth/login", {
      method: "POST",
      body: { login: noEmailLoginOne, password },
    });
    const invitedUserMe = await request("/me", { token: invitedUserLogin.token });
    if (!Array.isArray(invitedUserMe?.user?.gang?.invites) || !invitedUserMe.user.gang.invites.some((entry) => entry.gangName === "Smoke Syndicate" && Number(entry.inviteRespectMin || 0) === 30)) {
      throw new Error("Zaproszony gracz nie dostal invite do zywego gangu.");
    }

    const joinedGangOne = await request("/gang/join", {
      method: "POST",
      token: invitedUserLogin.token,
      body: { invite: invitedUserMe.user.gang.invites.find((entry) => entry.gangName === "Smoke Syndicate") },
    });

    if (!joinedGangOne?.user?.gang?.joined || joinedGangOne.user.gang.name !== "Smoke Syndicate") {
      throw new Error("Pierwszy zaproszony gracz nie dolaczyl do gangu.");
    }

    const secondInvitedUserMe = await request("/me", { token: noEmailRegisterTwo.token });
    if (!Array.isArray(secondInvitedUserMe?.user?.gang?.invites) || !secondInvitedUserMe.user.gang.invites.some((entry) => entry.gangName === "Smoke Syndicate")) {
      throw new Error("Drugi zaproszony gracz nie dostal invite do gangu.");
    }

    const joinedGangTwo = await request("/gang/join", {
      method: "POST",
      token: noEmailRegisterTwo.token,
      body: { invite: secondInvitedUserMe.user.gang.invites.find((entry) => entry.gangName === "Smoke Syndicate") },
    });

    if (!joinedGangTwo?.user?.gang?.joined || joinedGangTwo.user.gang.name !== "Smoke Syndicate") {
      throw new Error("Drugi zaproszony gracz nie dolaczyl do gangu.");
    }

    const postJoinGangState = await request("/me", { token });
    if (Number(postJoinGangState?.user?.gang?.members || 0) < 3) {
      throw new Error("Boss nie widzi pelnego skladu po dolaczeniu ludzi do gangu.");
    }

    const trustedRoleResult = await request("/gang/members/role", {
      method: "POST",
      token,
      body: { targetUserId: firstAttackTarget.id, role: "Zaufany" },
    });

    if (!trustedRoleResult?.user?.gang?.membersList?.some((member) => member.id === firstAttackTarget.id && member.role === "Zaufany")) {
      throw new Error("Zmiana rangi na Zaufanego nie odswiezyla skladu gangu.");
    }

    const firstViceRoleResult = await request("/gang/members/role", {
      method: "POST",
      token,
      body: { targetUserId: secondAttackTarget.id, role: "Vice Boss" },
    });

    if (!firstViceRoleResult?.user?.gang?.membersList?.some((member) => member.id === secondAttackTarget.id && member.role === "Vice Boss")) {
      throw new Error("Zmiana rangi na Vice Bossa nie odswiezyla skladu gangu.");
    }

    const secondViceRoleResult = await request("/gang/members/role", {
      method: "POST",
      token,
      body: { targetUserId: firstAttackTarget.id, role: "Vice Boss" },
    });

    const finalGangMembers = secondViceRoleResult?.user?.gang?.membersList || [];
    if (!finalGangMembers.some((member) => member.id === firstAttackTarget.id && member.role === "Vice Boss")) {
      throw new Error("Przerzut Vice Bossa na innego czlonka nie zadzialal.");
    }
    if (!finalGangMembers.some((member) => member.id === secondAttackTarget.id && member.role === "Zaufany")) {
      throw new Error("Poprzedni Vice Boss nie zostal cofniety na Zaufanego.");
    }

    const liveGangDirectory = await request("/gangs", { token });
    const smokeSyndicate = (liveGangDirectory?.gangs || []).find((entry) => entry.name === "Smoke Syndicate");
    if (!smokeSyndicate?.membersList?.some((member) => member.id === firstAttackTarget.id && member.role === "Vice Boss")) {
      throw new Error("Katalog gangow nie pokazuje nowego Vice Bossa.");
    }

    const gangHeistResult = await request("/gang/heists/pharma/execute", {
      method: "POST",
      token,
    });

    if (!/success|failure/i.test(String(gangHeistResult?.result?.result || ""))) {
      throw new Error("Napad gangu nie zwrocil poprawnego wyniku backendowego.");
    }
    if (gangHeistResult?.user?.gang?.name !== "Smoke Syndicate") {
      throw new Error("Napad gangu nie zwrocil zsynchronizowanego stanu gangu.");
    }
    if (!Array.isArray(gangHeistResult?.gangs) || !gangHeistResult.gangs.some((entry) => entry.name === "Smoke Syndicate")) {
      throw new Error("Napad gangu nie odswiezyl katalogu gangow.");
    }
    if (Number(gangHeistResult?.user?.profile?.jailUntil || 0) > Date.now()) {
      const bribeAfterGangHeist = await request("/player/jail/bribe", {
        method: "POST",
        token,
      });
      if (Number(bribeAfterGangHeist?.user?.profile?.jailUntil || 0) > Date.now()) {
        throw new Error("Bribe po wpadce na napadzie gangu nie wypuscil gracza z celi.");
      }
    }

    const attackResult = await request(`/social/players/${firstAttackTarget.id}/attack`, {
      method: "POST",
      token,
    });

    if (!attackResult?.result?.message) {
      throw new Error("Atak na gracza nie zwrocil wyniku akcji.");
    }
    if (Number(attackResult?.user?.cooldowns?.playerAttackTargets?.[firstAttackTarget.id] || 0) <= Date.now()) {
      throw new Error("Atak na gracza nie ustawil cooldownu per target po stronie backendu.");
    }

    await delay(1900);
    const secondTargetAttackResult = await request(`/social/players/${secondAttackTarget.id}/attack`, {
      method: "POST",
      token,
    });

    if (!secondTargetAttackResult?.result?.message) {
      throw new Error("Atak na drugiego gracza nie zwrocil wyniku akcji.");
    }
    if (Number(secondTargetAttackResult?.user?.cooldowns?.playerAttackTargets?.[secondAttackTarget.id] || 0) <= Date.now()) {
      throw new Error("Atak na drugiego gracza nie ustawil osobnego cooldownu.");
    }

    await delay(1900);
    await expectRequestFailure(
      `/social/players/${firstAttackTarget.id}/attack`,
      {
        method: "POST",
        token,
      },
      /na tego gracza odpalisz kolejny atak za|cooldown/i
    );

    const fightClubResult = await request("/fightclub/round", {
      method: "POST",
      token,
    });

    if (!fightClubResult?.result?.logMessage) {
      throw new Error("Fightclub nie zwrocil wyniku rundy.");
    }

    const dealerTradeStartingSmokes = Number(fightClubResult?.user?.drugInventory?.smokes || 0);
    const boughtDealerBatch = await request("/dealer/buy", {
      method: "POST",
      token,
      body: { drugId: "smokes", quantity: 3 },
    });

    if (Number(boughtDealerBatch?.user?.drugInventory?.smokes || 0) !== dealerTradeStartingSmokes + 3) {
      throw new Error("Dealer buy x3 nie dodal pelnej ilosci towaru.");
    }

    const consumeResult = await request("/dealer/consume", {
      method: "POST",
      token,
      body: { drugId: "smokes" },
    });

    if (typeof consumeResult?.result?.overdose !== "boolean") {
      throw new Error("Zarzucenie towaru nie zwrocilo wyniku na backendzie.");
    }
    if (
      !consumeResult?.result?.overdose &&
      !Array.isArray(consumeResult?.user?.activeBoosts)
    ) {
      throw new Error("Boost po zarzuceniu nie zostal zwrocony z backendu.");
    }
    const smokesAfterConsume = Number(consumeResult?.user?.drugInventory?.smokes || 0);
    if (smokesAfterConsume !== dealerTradeStartingSmokes + 2) {
      throw new Error("Dealer consume nie odjal jednej sztuki towaru.");
    }

    const soldDealerBatch = await request("/dealer/sell", {
      method: "POST",
      token,
      body: { drugId: "smokes", quantity: 2 },
    });

    if (Number(soldDealerBatch?.user?.drugInventory?.smokes || 0) !== smokesAfterConsume - 2) {
      throw new Error("Dealer sell x2 nie odjal poprawnej ilosci towaru.");
    }

    const friendResult = await request(`/social/friends/${firstAttackTarget.id}`, {
      method: "POST",
      token,
    });

    if (!friendResult?.result?.message) {
      throw new Error("Dodawanie znajomego nie zwrocilo wyniku.");
    }

    const directMessageText = "Wpadnij na akcje po zmroku.";
    const directMessageResult = await request(`/social/messages/${firstAttackTarget.id}`, {
      method: "POST",
      token,
      body: { message: directMessageText },
    });

    if (!directMessageResult?.result?.message) {
      throw new Error("Prywatna wiadomosc nie zwrocila wyniku.");
    }

    const bountyResult = await request(`/social/players/${firstAttackTarget.id}/bounty`, {
      method: "POST",
      token,
    });

    if (!bountyResult?.result?.increment) {
      throw new Error("Bounty nie podnioslo nagrody za glowe.");
    }

    await request("/clubs/visit", {
      method: "POST",
      token,
      body: { mode: "enter", venueId: "club-1" },
    });

    const escortSearchResult = await request("/clubs/action", {
      method: "POST",
      token,
      body: { venueId: "club-1", actionId: "scout" },
    });

    if (escortSearchResult?.result?.actionId !== "scout" || !escortSearchResult?.result?.outcome) {
      throw new Error("Akcji klubowej nie rozliczono na backendzie.");
    }

    const cornerEscortCountBefore = Number(
      escortSearchResult?.user?.escortsOwned?.find((entry) => entry.id === "corner")?.count || 0
    );

    const boughtEscort = await request("/escorts/buy", {
      method: "POST",
      token,
      body: { escortId: "corner" },
    });

    if (Number(boughtEscort?.user?.escortsOwned?.find((entry) => entry.id === "corner")?.count || 0) !== cornerEscortCountBefore + 1) {
      throw new Error("Kupno eskorty online nie dodalo kontaktu.");
    }

    const assignedEscort = await request("/escorts/assign", {
      method: "POST",
      token,
      body: { escortId: "corner", districtId: "oldtown" },
    });

    if (Number(assignedEscort?.user?.escortsOwned?.find((entry) => entry.id === "corner")?.routes?.oldtown || 0) <= 0) {
      throw new Error("Wystawienie eskorty na ulice nie zapisalo trasy.");
    }

    await delay(2200);
    const collectedEscort = await request("/escorts/collect", {
      method: "POST",
      token,
    });

    if (!Number.isFinite(collectedEscort?.result?.payout) || collectedEscort.result.payout <= 0) {
      throw new Error("Odbior z ulicy nie zwrocil dodatniego payoutu.");
    }

    const pulledEscort = await request("/escorts/pull", {
      method: "POST",
      token,
      body: { escortId: "corner", districtId: "oldtown" },
    });

    if (Number(pulledEscort?.user?.escortsOwned?.find((entry) => entry.id === "corner")?.routes?.oldtown || 0) !== 0) {
      throw new Error("Sciagniecie eskorty z ulicy nie wyczyscilo trasy.");
    }

    const soldEscort = await request("/escorts/sell", {
      method: "POST",
      token,
      body: { escortId: "corner" },
    });

    if (Number(soldEscort?.user?.escortsOwned?.find((entry) => entry.id === "corner")?.count || 0) !== cornerEscortCountBefore) {
      throw new Error("Sprzedaz eskorty online nie oddala poprawnego stanu.");
    }

    const claimedClub = await request("/clubs/claim", {
      method: "POST",
      token,
      body: { venueId: "club-2" },
    });

    if (!claimedClub?.user?.club?.owned || claimedClub.user.club.sourceId !== "club-2") {
      throw new Error("Przejecie klubu nie zapisalo ownership na backendzie.");
    }
    const claimedClubMarketEntry = Array.isArray(claimedClub?.clubMarket)
      ? claimedClub.clubMarket.find((entry) => entry.id === "club-2")
      : null;
    if (!claimedClubMarketEntry || claimedClubMarketEntry.ownerLabel !== login) {
      throw new Error("Rynek klubow nie odswiezyl wlasciciela po przejeciu lokalu.");
    }

    const claimedClubTask = await request("/tasks/claim", {
      method: "POST",
      token,
      body: { taskId: "club" },
    });

    if (!claimedClubTask?.result?.rewardCash) {
      throw new Error("Task klubu nie zwrocil nagrody po przejeciu lokalu.");
    }

    const clubPlan = await request("/clubs/plan", {
      method: "POST",
      token,
      body: { planId: "guestlist" },
    });

    if (clubPlan?.user?.club?.nightPlanId !== "guestlist") {
      throw new Error("Plan nocy nie zapisal sie po stronie backendu.");
    }

    const fortifiedClub = await request("/clubs/fortify", {
      method: "POST",
      token,
    });

    if (Number(fortifiedClub?.user?.club?.securityLevel || 0) < 1) {
      throw new Error("Fortyfikacja klubu nie podniosla security level.");
    }

    const clubStashMove = await request("/clubs/stash/move", {
      method: "POST",
      token,
      body: { drugId: "smokes", quantity: 2 },
    });

    if (Number(clubStashMove?.result?.quantity || 0) !== 2) {
      throw new Error("Przerzut towaru do stashu klubu nie zwrocil prawidlowej ilosci.");
    }
    if (Number(clubStashMove?.user?.club?.stash?.smokes || 0) < 2) {
      throw new Error("Stash klubu nie przyjal towaru po stronie backendu.");
    }

    await request("/clubs/visit", {
      method: "POST",
      token: noEmailRegisterTwo.token,
      body: { mode: "enter", venueId: "club-2" },
    });

    const clubConsume = await request("/clubs/stash/consume", {
      method: "POST",
      token: noEmailRegisterTwo.token,
      body: { venueId: "club-2", drugId: "smokes" },
    });

    if (!clubConsume?.result?.logMessage) {
      throw new Error("Konsumpcja towaru ze stashu klubu nie zwrocila wyniku.");
    }
    if (Number(clubConsume?.result?.stashCount || 0) !== 1) {
      throw new Error("Stash klubu nie odjal sztuki po konsumpcji goscia.");
    }
    if (
      !clubConsume?.result?.overdose &&
      !Array.isArray(clubConsume?.user?.activeBoosts)
    ) {
      throw new Error("Konsumpcja towaru z klubu nie odswiezyla boostow gracza.");
    }

    const clubNight = await request("/clubs/night", {
      method: "POST",
      token,
    });

    if (!Number.isFinite(clubNight?.result?.payout) || clubNight.result.payout <= 0) {
      throw new Error("Run night klubu nie zwrocil dodatniego payoutu.");
    }
    if (!clubNight?.user?.club?.lastNightSummary || Number(clubNight.user.club.lastNightSummary.payout || 0) <= 0) {
      throw new Error("Run night klubu nie zapisuje czytelnego podsumowania nocy.");
    }

    const districtsAfterClub = await request("/districts", { token });
    const neonDistrict = districtsAfterClub?.districts?.find((entry) => entry.id === "neon");
    if (!neonDistrict || Number(neonDistrict.influence || 0) <= 0) {
      throw new Error("Klub i fokus gangu nie zostawily sladu influence w Neon.");
    }

    const toppedUpEnergy = await request("/player/restaurant/eat", {
      method: "POST",
      token,
      body: { itemId: "energybox" },
    });

    if (Number(toppedUpEnergy?.user?.profile?.energy || 0) < 3) {
      throw new Error("Restauracja nie dowiozla energii pod final operacji.");
    }

    const operationsSnapshot = await request("/operations", { token });
    if (!Array.isArray(operationsSnapshot?.catalog) || operationsSnapshot.catalog.length < 3) {
      throw new Error("Katalog operacji nie zwrocil listy MVP.");
    }

    const startedOperation = await request("/operations/start", {
      method: "POST",
      token,
      body: { operationId: "vip-lift" },
    });

    if (startedOperation?.user?.operations?.active?.operationId !== "vip-lift") {
      throw new Error("Start operacji nie zapisuje aktywnego planu.");
    }

    const operationChoices = [
      "inside-tip",
      "quiet-entry",
      "burner-kit",
      "tight-crew",
      "burner-sedan",
    ];

    for (const choiceId of operationChoices) {
      const step = await request("/operations/advance", {
        method: "POST",
        token,
        body: { choiceId },
      });
      if (!step?.user?.operations?.active && choiceId !== operationChoices[operationChoices.length - 1]) {
        throw new Error(`Operacja zgubila aktywny stan po ruchu ${choiceId}.`);
      }
    }

    const executedOperation = await request("/operations/execute", {
      method: "POST",
      token,
    });

    if (executedOperation?.user?.operations?.active !== null) {
      throw new Error("Operacja nie wyczyscila aktywnego planu po execute.");
    }
    if (!Array.isArray(executedOperation?.user?.operations?.history) || !executedOperation.user.operations.history.length) {
      throw new Error("Operacja nie zapisala sie do historii backendowej.");
    }

    const friendsSnapshot = await request("/social/friends", { token });
    const messagesSnapshot = await request("/social/messages", { token });

    if (!Array.isArray(friendsSnapshot.friends) || !friendsSnapshot.friends.some((entry) => entry.id === firstAttackTarget.id)) {
      throw new Error("Znajomy nie pojawia sie w liscie znajomych.");
    }

    if (!Array.isArray(messagesSnapshot.messages) || messagesSnapshot.messages.length === 0) {
      throw new Error("Lista prywatnych wiadomosci jest pusta po wysylce.");
    }
    if (!messagesSnapshot.messages.some((entry) => entry.preview === directMessageText)) {
      throw new Error("Prywatna wiadomosc nie zapisala wpisanej tresci.");
    }

    await stopServer(server);
    await forceUsersIntoJail(dataDir, [login, noEmailLoginTwo]);
    server = startServer(dataDir);
    await waitForHealth();

    const jailedLogin = await request("/auth/login", {
      method: "POST",
      body: { login, password },
    });
    await delay(AUTH_LOGIN_DELAY_MS);
    const jailedOtherLogin = await request("/auth/login", {
      method: "POST",
      body: { login: noEmailLoginTwo, password },
    });
    await delay(AUTH_LOGIN_DELAY_MS);
    const freeUserLogin = await request("/auth/login", {
      method: "POST",
      body: { login: noEmailLoginOne, password },
    });

    const prisonMessageText = `cela-${unique}`;
    const prisonFeedBefore = await request("/chat/prison", { token: jailedLogin.token });
    if (!Array.isArray(prisonFeedBefore.messages)) {
      throw new Error("Chat wiezienia nie zwrocil listy wiadomosci.");
    }

    const prisonPost = await request("/chat/prison", {
      method: "POST",
      token: jailedLogin.token,
      body: { text: prisonMessageText },
    });

    if (!Array.isArray(prisonPost?.messages) || !prisonPost.messages.some((entry) => entry.text === prisonMessageText)) {
      throw new Error("Wysylka wiadomosci do chatu wiezienia nie zapisala wpisu.");
    }

    const prisonOtherFeed = await request("/chat/prison", { token: jailedOtherLogin.token });
    if (!Array.isArray(prisonOtherFeed.messages) || !prisonOtherFeed.messages.some((entry) => entry.text === prisonMessageText)) {
      throw new Error("Drugi osadzony nie widzi wpisu z chatu wiezienia.");
    }

    await expectRequestFailure(
      "/chat/prison",
      {
        token: freeUserLogin.token,
      },
      /osadzeni|cela/i
    );

    await expectRequestFailure(
      "/chat/prison",
      {
        method: "POST",
        token: freeUserLogin.token,
        body: { text: "wolny gracz" },
      },
      /osadzeni|cela/i
    );

    const preSyncMe = await request("/me", { token });

    const syncResult = await request("/sync/client-state", {
      method: "POST",
      token,
      body: {
        game: {
          ui: {
            screen: "fake-screen",
          },
          player: {
            cash: 999999999,
            respect: 999999999,
            attack: 999999999,
          },
        },
      },
    });

    if (!syncResult.ok || syncResult.authoritative !== true) {
      throw new Error("Sync klienta nie zwrocil potwierdzenia autorytatywnego backendu.");
    }

    const postSyncMe = await request("/me", { token });
    if (postSyncMe.user.profile.cash !== preSyncMe.user.profile.cash) {
      throw new Error("Sync klienta nadpisal gotowke na backendzie.");
    }
    if (postSyncMe.user.profile.attack !== preSyncMe.user.profile.attack) {
      throw new Error("Sync klienta nadpisal statystyki na backendzie.");
    }
    if (postSyncMe.user.clientState?.screen !== "fake-screen") {
      throw new Error("Backend nie zachowal bezpiecznego podsumowania stanu klienta.");
    }

    await stopServer(server);
    server = startServer(dataDir);
    await waitForHealth();

    const relogin = await request("/auth/login", {
      method: "POST",
      body: { login, password },
    });

    const persistedMe = await request("/me", { token: relogin.token });
    const persistedChat = await request("/chat/global", { token: relogin.token });
    const persistedPrisonChat = await request("/chat/prison", { token: relogin.token });

    if (persistedMe.user.profile.attack !== preSyncMe.user.profile.attack) {
      throw new Error("Atak po restarcie backendu nie zostal zachowany.");
    }

    if (persistedMe.user.profile.cash === cashBeforeHeist) {
      throw new Error("Stan gotowki wyglada jakby napad nie zostal zapisany.");
    }

    if (persistedMe.user.profile.avatarId !== "boss") {
      throw new Error("Avatar gracza nie przetrwal restartu backendu.");
    }

    if (!persistedMe.user.gang?.joined || persistedMe.user.gang?.focusDistrictId !== "neon") {
      throw new Error("Gang MVP nie przetrwal restartu backendu.");
    }

    if (Number(persistedMe.user.gang?.projects?.["district-push"] || 0) < 1) {
      throw new Error("Projekt gangu nie przetrwal restartu backendu.");
    }

    if (!persistedMe.user.club?.owned || persistedMe.user.club?.sourceId !== "club-2") {
      throw new Error("Ownership klubu nie przetrwal restartu backendu.");
    }

    if (!Array.isArray(persistedMe.user.tasksClaimed) || !persistedMe.user.tasksClaimed.includes("club")) {
      throw new Error("Claim taska klubu nie przetrwal restartu backendu.");
    }

    if (!persistedMe.user.city?.districts?.neon) {
      throw new Error("Stan dzielnic nie przetrwal restartu backendu.");
    }

    if (!Array.isArray(persistedMe.user.operations?.history) || !persistedMe.user.operations.history.length) {
      throw new Error("Historia operacji nie przetrwala restartu backendu.");
    }

    if (!persistedMe.user.online?.friends?.some((entry) => entry.id === firstAttackTarget.id)) {
      throw new Error("Znajomi nie przetrwali restartu backendu.");
    }

    if (!persistedMe.user.online?.messages?.length) {
      throw new Error("Prywatne wiadomosci nie przetrwaly restartu backendu.");
    }

    if (persistedMe.user.clientState?.screen !== "fake-screen") {
      throw new Error("Bezpieczne podsumowanie client state nie przetrwalo restartu backendu.");
    }

    if (!persistedChat.messages.some((entry) => entry.text === chatText)) {
      throw new Error("Chat nie przetrwal restartu backendu.");
    }

    if (!persistedPrisonChat.messages.some((entry) => entry.text === prisonMessageText)) {
      throw new Error("Chat wiezienia nie przetrwal restartu backendu.");
    }

    const deletedGang = await request("/gang/delete", {
      method: "POST",
      token: relogin.token,
    });

    if (deletedGang?.user?.gang?.joined) {
      throw new Error("Usuniecie gangu nie wyczyscilo stanu bossa.");
    }

    const gangsAfterDelete = await request("/gangs", { token: relogin.token });
    if (Array.isArray(gangsAfterDelete?.gangs) && gangsAfterDelete.gangs.some((entry) => entry.name === "Smoke Syndicate")) {
      throw new Error("Usuniety gang dalej widnieje w katalogu gangow.");
    }

    const freeUserAfterDelete = await request("/me", { token: freeUserLogin.token });
    if (Array.isArray(freeUserAfterDelete?.user?.gang?.invites) && freeUserAfterDelete.user.gang.invites.some((entry) => entry.gangName === "Smoke Syndicate")) {
      throw new Error("Usuniecie gangu nie wyczyscilo invite u zaproszonego gracza.");
    }

    const summary = {
      register: "ok",
      registerWithoutEmail: "ok",
      login: "ok",
      heist: heistResult.result,
      tasks: "ok",
      businesses: collectedBusiness.result.payout,
      factories: Number(producedDrug.user.drugInventory.smokes || 0),
      chat: "ok",
      gym: "ok",
      avatar: "ok",
      playerAttack: attackResult.result.success ? "ok-success" : "ok-failed",
      fightClub: fightClubResult.result.success ? "ok-success" : "ok-failed",
      dealer: "ok",
      friends: "ok",
      directMessages: "ok",
      bounty: bountyResult.result.increment,
      clubAction: escortSearchResult.result.outcome,
      gang: "ok",
      gangInvite: "ok",
      gangHeist: gangHeistResult.result.result,
      gangDelete: "ok",
      districts: districtsAfterClub.districts.length,
        gangProject: investedGangProject.result.level,
        adminGrant: "ok",
        adminRespectGrant: "ok",
        clubOwnership: claimedClub.user.club.sourceId,
      clubNight: clubNight.result.payout,
      operation: executedOperation.result.success ? "ok-success" : "ok-failed",
      prisonChat: "ok",
      clientStateAuthority: "ok",
      persistenceAfterRestart: "ok",
      socialPlayers: players.players.length,
      rankingsVisible: true,
    };

    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } finally {
    await stopServer(server);
    await rm(dataDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
