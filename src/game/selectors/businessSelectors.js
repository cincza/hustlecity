export {
  getBusinessEffectiveIncomePerMinute,
  getBusinessIncomePerMinute,
  getBusinessUpgradeCost,
  getBusinessUpgradePreview,
  getBusinessUpgradeState,
} from "../../../shared/empire.js";

export function getOwnedBusinessCount(state) {
  return (Array.isArray(state?.businessesOwned) ? state.businessesOwned : []).reduce(
    (sum, owned) => sum + Number(owned.count || 0),
    0
  );
}
