import { getStreetIncomeDiminishing } from "./economy.js";
import { ESCORTS } from "./socialGameplay.js";

export const STREET_DISTRICTS = [
  {
    id: "oldtown",
    name: "Stare Miasto",
    respect: 0,
    incomeMultiplier: 0.82,
    policeRisk: 0.03,
    beatRisk: 0.04,
    escapeRisk: 0.015,
    note: "Najbezpieczniejsza ulica. Mniej hajsu, mniej przypalu.",
  },
  {
    id: "neon",
    name: "Neon Avenue",
    respect: 8,
    incomeMultiplier: 1,
    policeRisk: 0.05,
    beatRisk: 0.06,
    escapeRisk: 0.025,
    note: "Srodek miasta. Dobry balans zarobku i przypalu.",
  },
  {
    id: "strip",
    name: "Casino Strip",
    respect: 16,
    incomeMultiplier: 1.24,
    policeRisk: 0.08,
    beatRisk: 0.085,
    escapeRisk: 0.035,
    note: "Lepsza klientela i grubsze stawki, ale gliny czesto robia objazd.",
  },
  {
    id: "harbor",
    name: "Port Cienia",
    respect: 24,
    incomeMultiplier: 1.52,
    policeRisk: 0.12,
    beatRisk: 0.11,
    escapeRisk: 0.05,
    note: "Najgrubsza kasa z ulicy. Najwiecej przemocy, donosow i znikniec.",
  },
];

export function findStreetDistrictById(districtId) {
  return STREET_DISTRICTS.find((entry) => entry.id === districtId) || null;
}

export function getEscortRoutes(owned) {
  if (!owned || typeof owned !== "object") return {};
  if (owned.routes && typeof owned.routes === "object" && !Array.isArray(owned.routes)) {
    return Object.fromEntries(
      Object.entries(owned.routes)
        .map(([districtId, count]) => [String(districtId || "").trim(), Math.max(0, Math.floor(Number(count || 0)))])
        .filter(([districtId, count]) => districtId && count > 0 && findStreetDistrictById(districtId))
    );
  }
  if (Number(owned.working || 0) > 0) {
    return { [STREET_DISTRICTS[0].id]: Math.max(0, Math.floor(Number(owned.working || 0))) };
  }
  return {};
}

export function getEscortWorkingCount(owned) {
  return Object.values(getEscortRoutes(owned)).reduce(
    (sum, count) => sum + Math.max(0, Math.floor(Number(count || 0))),
    0
  );
}

export function normalizeEscortsOwned(escortsOwned) {
  if (!Array.isArray(escortsOwned)) return [];
  return escortsOwned
    .filter((entry) => entry && typeof entry === "object" && typeof entry.id === "string")
    .map((entry) => {
      const routes = getEscortRoutes(entry);
      return {
        id: String(entry.id || "").trim(),
        count: Math.max(0, Math.floor(Number(entry.count || 0))),
        working: getEscortWorkingCount({ ...entry, routes }),
        routes,
      };
    })
    .filter((entry) => entry.id && entry.count > 0);
}

export function getOwnedEscort(state, escortId) {
  return (state?.escortsOwned || []).find((entry) => entry.id === escortId) || null;
}

export function getEscortReserveCount(state, escortId) {
  const owned = getOwnedEscort(state, escortId);
  if (!owned) return 0;
  return Math.max(0, Number(owned.count || 0) - getEscortWorkingCount(owned));
}

export function getEscortDistrictCount(state, escortId, districtId) {
  const owned = getOwnedEscort(state, escortId);
  return Math.max(0, Math.floor(Number(getEscortRoutes(owned)[districtId] || 0)));
}

export function getEscortRouteCount(escortsOwned = []) {
  return normalizeEscortsOwned(escortsOwned).reduce((sum, entry) => sum + getEscortWorkingCount(entry), 0);
}

export function getEscortIncomePerMinute(state) {
  const escortsOwned = normalizeEscortsOwned(Array.isArray(state) ? state : state?.escortsOwned || []);
  const diminishing = getStreetIncomeDiminishing(getEscortRouteCount(escortsOwned));

  return escortsOwned.reduce((sum, owned) => {
    const escort = ESCORTS.find((entry) => entry.id === owned.id);
    if (!escort) return sum;

    return (
      sum +
      Object.entries(getEscortRoutes(owned)).reduce((routeSum, [districtId, count]) => {
        const district = findStreetDistrictById(districtId) || STREET_DISTRICTS[0];
        return routeSum + Number(escort.cashPerMinute || 0) * Number(district.incomeMultiplier || 1) * count * diminishing;
      }, 0)
    );
  }, 0);
}
