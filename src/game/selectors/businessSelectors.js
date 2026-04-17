export function getBusinessUpgradeState(state, businessId) {
  const upgrades = state?.businessUpgrades || {};
  const current = upgrades?.[businessId] || {};
  return {
    speedLevel: Number(current.speedLevel || 0),
    cashLevel: Number(current.cashLevel || 0),
    totalLevel: Number(current.speedLevel || 0) + Number(current.cashLevel || 0),
  };
}

export function getBusinessEffectiveIncomePerMinute(state, business, count = 1) {
  const baseIncome = Number(business?.incomePerMinute || 0);
  const upgrade = getBusinessUpgradeState(state, business?.id);
  const speedMultiplier = Math.pow(1.12, upgrade.speedLevel);
  const cashMultiplier = Math.pow(1.18, upgrade.cashLevel);
  return baseIncome * speedMultiplier * cashMultiplier * Number(count || 0);
}

export function getBusinessUpgradeCost(state, business, path) {
  const safePath = path === "speed" ? "speed" : "cash";
  const upgrade = getBusinessUpgradeState(state, business?.id);
  const level = safePath === "speed" ? upgrade.speedLevel : upgrade.cashLevel;
  return Math.round(Number(business?.cost || 0) * (0.45 + level * 0.2));
}

export function getBusinessUpgradePreview(state, business, count = 1) {
  const currentIncome = getBusinessEffectiveIncomePerMinute(state, business, count);
  const speedCost = getBusinessUpgradeCost(state, business, "speed");
  const cashCost = getBusinessUpgradeCost(state, business, "cash");
  const speedState = {
    ...state,
    businessUpgrades: {
      ...(state?.businessUpgrades || {}),
      [business.id]: {
        ...getBusinessUpgradeState(state, business.id),
        speedLevel: getBusinessUpgradeState(state, business.id).speedLevel + 1,
        cashLevel: getBusinessUpgradeState(state, business.id).cashLevel,
      },
    },
  };
  const cashState = {
    ...state,
    businessUpgrades: {
      ...(state?.businessUpgrades || {}),
      [business.id]: {
        ...getBusinessUpgradeState(state, business.id),
        speedLevel: getBusinessUpgradeState(state, business.id).speedLevel,
        cashLevel: getBusinessUpgradeState(state, business.id).cashLevel + 1,
      },
    },
  };

  return {
    currentIncome,
    speedCost,
    cashCost,
    nextSpeedIncome: getBusinessEffectiveIncomePerMinute(speedState, business, count),
    nextCashIncome: getBusinessEffectiveIncomePerMinute(cashState, business, count),
  };
}

export function getBusinessIncomePerMinute(state, businesses) {
  const safeBusinesses = Array.isArray(businesses) ? businesses : [];
  const ownedBusinesses = Array.isArray(state?.businessesOwned) ? state.businessesOwned : [];

  return ownedBusinesses.reduce((sum, owned) => {
    const business = safeBusinesses.find((entry) => entry.id === owned.id);
    return sum + (business ? getBusinessEffectiveIncomePerMinute(state, business, Number(owned.count || 0)) : 0);
  }, 0);
}

export function getOwnedBusinessCount(state) {
  return (Array.isArray(state?.businessesOwned) ? state.businessesOwned : []).reduce(
    (sum, owned) => sum + Number(owned.count || 0),
    0
  );
}
