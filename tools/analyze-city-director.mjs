import {
  CITY_DIRECTOR_EPOCH,
  CITY_EVENT_WINDOW_MS,
  applyCityEventMarketQuote,
  getCityEventAt,
  getDealerCityEventPricing,
} from "../shared/cityDirector.js";

const windows = 90;
const counts = {};
let narrowestMarketSpread = Infinity;
let narrowestDealerSpread = Infinity;
const variants = new Set();

for (let slot = 0; slot < windows; slot += 1) {
  const event = getCityEventAt(CITY_DIRECTOR_EPOCH + slot * CITY_EVENT_WINDOW_MS + 1);
  counts[event.id] = (counts[event.id] || 0) + 1;
  variants.add(`${event.id}:${event.productId}:${event.drugId}`);
  const buy = applyCityEventMarketQuote({ total: 100 }, event, "buy", event.productId).total;
  const sell = applyCityEventMarketQuote({ total: 82, payoutPerUnit: 82 }, event, "sell", event.productId).total;
  narrowestMarketSpread = Math.min(narrowestMarketSpread, buy - sell);
  const dealer = getDealerCityEventPricing(event, event.drugId);
  narrowestDealerSpread = Math.min(
    narrowestDealerSpread,
    Math.ceil(100 * dealer.buyMultiplier) - Math.floor(72 * dealer.sellMultiplier)
  );
}

console.log(JSON.stringify({
  simulatedDays: windows / 2,
  windows,
  archetypeCounts: counts,
  distinctVariants: variants.size,
  narrowestMarketBuySellSpreadPerBase100: narrowestMarketSpread,
  narrowestDealerBuySellSpreadPerBase100: narrowestDealerSpread,
  instantArbitrageFound: narrowestMarketSpread <= 0 || narrowestDealerSpread <= 0,
}, null, 2));
