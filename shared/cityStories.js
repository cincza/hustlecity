import { DISTRICTS, applyDistrictActivity } from "./districts.js";

const WEEK_MS = 7 * 86400000;
const weekKey = (now) => Math.floor((now - 4 * 86400000) / WEEK_MS);
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
const fail = (message) => { throw Object.assign(new Error(message), { statusCode: 400 }); };
const CLASS_NAMES = { broker: "Biznesmen", dealer: "Diler", hustler: "Hustler", host: "Król nocy", enforcer: "Egzekutor" };

export const CITY_SITUATIONS = [
  {
    id: "oldtown-ledger", districtId: "oldtown", contact: "Mecenas", title: "Księga na cudzym biurku",
    text: "Mecenas wie, kto wyniósł kopię księgi. Możesz ochronić sieć albo zamienić przeciek w ryzykowną okazję.",
    choices: [
      { id: "protect", label: "Odkup księgę · $500", text: "Mniej presji i cichy następny ruch.", cost: 500, trust: 2, pressure: -6, consequence: { kind: "quiet-cover", label: "Czyste papiery", uses: 1, hours: 36 } },
      { id: "sell", label: "Sprzedaj trop · +$900", text: "Gotówka teraz; kolejny pilny ruch jest cenniejszy i głośniejszy.", cash: 900, heat: 4, trust: -2, pressure: 7, consequence: { kind: "hot-lead", label: "Gorący trop", uses: 1, hours: 36 } },
      { id: "front", label: "Przepuść przez legalny front · $650", text: "Opcja Biznesmena. Najmocniej uspokaja dzielnicę.", classId: "broker", cost: 650, trust: 3, pressure: -9, consequence: { kind: "quiet-cover", label: "Ślad przez front", uses: 2, hours: 48 } },
    ],
  },
  {
    id: "neon-afterparty", districtId: "neon", contact: "Organizatorka", title: "VIP bez zaproszenia",
    text: "Znany klient chce wejść tylnymi drzwiami. Organizatorka zapamięta, czy ochronisz lokal, czy wyciśniesz noc do końca.",
    choices: [
      { id: "calm", label: "Wygasz sytuację · $350", text: "Spokojniejsza dzielnica i dobra opinia przed kolejną umową.", cost: 350, trust: 2, pressure: -5, consequence: { kind: "good-word", label: "Dobre słowo", uses: 1, hours: 36 } },
      { id: "hype", label: "Wpuść tłum · +$700", text: "Dochód teraz i gorąca okazja później, ale policja zauważy ruch.", cash: 700, heat: 3, trust: -1, pressure: 8, consequence: { kind: "neon-hype", label: "Rozgrzany Neon", uses: 1, hours: 36 } },
      { id: "guest-list", label: "Przejmij listę gości · $250", text: "Opcja Króla nocy. Kontakt otwiera lepszą, cichą umowę.", classId: "host", cost: 250, trust: 3, pressure: -7, consequence: { kind: "guest-list", label: "Lista gości", uses: 2, hours: 48 } },
    ],
  },
  {
    id: "harbor-container", districtId: "harbor", contact: "Łącznik", title: "Kontener bez właściciela",
    text: "Łącznik ma kilka godzin, zanim magazyn zostanie przeszukany. Liczy się logistyka, nie sam klik po nagrodę.",
    choices: [
      { id: "deliver", label: "Dowieź zgodnie z umową · $450", text: "Budujesz zaufanie i oszczędzasz towar w następnym transporcie.", cost: 450, trust: 2, pressure: -4, consequence: { kind: "harbor-route", label: "Wolna rampa", uses: 1, hours: 36 } },
      { id: "skim", label: "Zdejmij część ładunku · +$800", text: "Gotówka i lepsza kolejna wypłata kosztem Heat i presji.", cash: 800, heat: 5, trust: -2, pressure: 7, consequence: { kind: "skimmed-cargo", label: "Lewy ładunek", uses: 1, hours: 36 } },
      { id: "dealer-route", label: "Podmień transport · 4 Fajki", text: "Opcja Dilera. Mały wkład towaru otwiera dwa tańsze przewozy.", classId: "dealer", goods: "smoke", quantity: 4, trust: 3, pressure: -6, consequence: { kind: "harbor-route", label: "Trasa Łącznika", uses: 2, hours: 48 } },
      { id: "hustler-route", label: "Rozlicz barterem · 3 Spirytus", text: "Opcja Hustlera. Zamieniasz zapas na dwa sprawniejsze przewozy.", classId: "hustler", goods: "spirytus", quantity: 3, trust: 3, pressure: -5, consequence: { kind: "harbor-route", label: "Barter portowy", uses: 2, hours: 48 } },
      { id: "escort", label: "Osobiście eskortuj ładunek", text: "Opcja Egzekutora. Ryzykujesz 8 HP, ale zabezpieczasz następną wypłatę.", classId: "enforcer", damage: 8, trust: 2, pressure: 2, consequence: { kind: "hard-escort", label: "Twarda eskorta", uses: 1, hours: 36 } },
    ],
  },
  {
    id: "oldtown-audit", districtId: "oldtown", contact: "Archiwistka", title: "Audyt o jeden dzień za wcześnie",
    text: "Kontroler dostał listę frontów, ale Archiwistka zna kolejność wizyt. Możesz kupić czas, podsunąć fałszywy trop albo wejść osobiście.",
    choices: [
      { id: "delay", label: "Przesuń audyt · $700", text: "Drogi spokój daje dwa tańsze, ciche zlecenia.", cost: 700, trust: 2, pressure: -7, consequence: { kind: "clean-window", label: "Okno bez kontroli", uses: 2, hours: 48 } },
      { id: "decoy-ledger", label: "Podrzuć fałszywą księgę · 5 Fajek", text: "Towar opłaca kuriera, ale fałszywy ślad podnosi stawkę kolejnego pilnego ruchu.", goods: "smoke", quantity: 5, heat: 3, trust: 1, pressure: 2, consequence: { kind: "inside-schedule", label: "Znany grafik kontroli", uses: 1, hours: 36 } },
      { id: "audit-muscle", label: "Przekonaj kontrolera osobiście", text: "Opcja Egzekutora. Ryzykujesz zdrowiem, żeby przerwać serię kontroli bez wypłaty.", classId: "enforcer", damage: 10, heat: 5, trust: 3, pressure: -9, consequence: { kind: "clean-window", label: "Kontroler patrzy w bok", uses: 2, hours: 48 } },
    ],
  },
  {
    id: "neon-blackout", districtId: "neon", contact: "Techniczka", title: "Ciemna godzina Neonu",
    text: "Awaria wygasiła kamery i terminale. To krótka okazja, ale każdy sposób przywrócenia ruchu zostawi inny ślad.",
    choices: [
      { id: "generator", label: "Postaw awaryjne zasilanie · $600", text: "Ruch wraca spokojnie, a techniczka otwiera cichą trasę przez monitoring.", cost: 600, trust: 2, pressure: -5, consequence: { kind: "camera-loop", label: "Pętla monitoringu", uses: 2, hours: 36 } },
      { id: "dark-sale", label: "Wykorzystaj ciemność · +$1 100", text: "Natychmiastowy utarg budzi plotki i wzmacnia następny pilny ruch.", cash: 1100, heat: 6, trust: -2, pressure: 9, consequence: { kind: "decoy-crowd", label: "Tłum bez nagrań", uses: 1, hours: 24 } },
      { id: "dealer-backup", label: "Zasil zaplecze towarem · 4 Fajki", text: "Opcja Dilera. Obsługa bierze zapłatę w towarze i ukrywa kolejne dostawy.", classId: "dealer", goods: "smoke", quantity: 4, trust: 3, pressure: -6, consequence: { kind: "camera-loop", label: "Martwe kamery", uses: 2, hours: 48 } },
    ],
  },
  {
    id: "harbor-strike", districtId: "harbor", contact: "Brygadzista", title: "Nocna zmiana staje",
    text: "Dokerzy zatrzymali rampy. Możesz uczciwie pokryć zmianę, rozbić solidarność albo zamienić konflikt w nocny układ.",
    choices: [
      { id: "pay-shift", label: "Pokryj zmianę · $800", text: "Kosztowna ugoda obniża presję i otwiera sprawniejszy przewóz.", cost: 800, trust: 3, pressure: -8, consequence: { kind: "union-route", label: "Pierwszeństwo na rampie", uses: 2, hours: 48 } },
      { id: "break-line", label: "Złam blokadę · +$1 200", text: "Towar rusza od razu, ale następna dostawa będzie nerwowa i głośna.", cash: 1200, heat: 7, trust: -3, pressure: 10, consequence: { kind: "owing-favor", label: "Dług wobec nocnej zmiany", uses: 1, hours: 36 } },
      { id: "host-table", label: "Przenieś rozmowy do klubu · $350", text: "Opcja Króla nocy. Neutralny stół uspokaja ludzi i oszczędza zasoby następnego przewozu.", classId: "host", cost: 350, trust: 3, pressure: -7, consequence: { kind: "union-route", label: "Układ po godzinach", uses: 2, hours: 48 } },
    ],
  },
];

export function getCitySituationTemplate(districtId, now = Date.now()) {
  const pool = CITY_SITUATIONS.filter((entry) => entry.districtId === districtId);
  if (!pool.length) return null;
  return pool[weekKey(now) % pool.length];
}

export function normalizeCityStories(value = {}, now = Date.now()) {
  const relations = {};
  for (const district of DISTRICTS) {
    const saved = value?.relations?.[district.id] || {};
    relations[district.id] = {
      trust: clamp(saved.trust, 0, 20),
      lastChoiceId: typeof saved.lastChoiceId === "string" ? saved.lastChoiceId : null,
      resolved: Array.isArray(saved.resolved) ? saved.resolved.filter((entry) => Number.isFinite(entry?.week)).slice(0, 8) : [],
    };
  }
  const consequences = (Array.isArray(value?.consequences) ? value.consequences : [])
    .filter((entry) => CITY_SITUATIONS.some((s) => s.districtId === entry?.districtId) && Number(entry?.uses) > 0 && Number(entry?.expiresAt) > now)
    .map((entry) => ({ id: String(entry.id), districtId: entry.districtId, kind: String(entry.kind), label: String(entry.label || "Konsekwencja"), uses: Math.min(3, Math.floor(Number(entry.uses))), expiresAt: Number(entry.expiresAt), choiceId: String(entry.choiceId || "") }))
    .slice(0, 12);
  return { relations, consequences };
}

export function getCitySituation(player, districtId, now = Date.now()) {
  const situation = getCitySituationTemplate(districtId, now);
  if (!situation) return null;
  const stories = normalizeCityStories(player?.contacts?.stories, now);
  const relation = stories.relations[districtId];
  const resolved = relation.resolved.some((entry) => entry.week === weekKey(now));
  const currentClass = player?.contacts?.classId || null;
  const mastery = Number(player?.contacts?.methods?.[currentClass] || 0) >= 6;
  const choices = situation.choices.map((choice) => {
    const reasons = [];
    if (choice.classId && choice.classId !== currentClass) reasons.push(`Tylko aktualna klasa: ${CLASS_NAMES[choice.classId] || choice.classId}`);
    const masteredRoute = choice.classId === currentClass && mastery;
    const cost = Math.max(0, Number(choice.cost || 0) - (masteredRoute ? 100 : 0));
    const quantity = Math.max(0, Number(choice.quantity || 0) - (masteredRoute ? 1 : 0));
    const damage = Math.max(0, Number(choice.damage || 0) - (masteredRoute ? 8 : 0));
    if (Number(player?.profile?.cash || 0) < cost) reasons.push(`Potrzebujesz $${cost}`);
    if (quantity && Number(player?.inventory?.[choice.goods] || 0) < quantity) reasons.push(`Potrzebujesz ${quantity} × ${choice.goods === "smoke" ? "Fajki" : "Spirytus"}`);
    if (Number(player?.profile?.hp || 0) <= damage) reasons.push("Za mało zdrowia");
    let label = choice.label;
    if (Number(choice.cost || 0) !== cost) label = label.replace(`$${choice.cost}`, `$${cost}`);
    if (Number(choice.quantity || 0) !== quantity) label = label.replace(String(choice.quantity), String(quantity));
    const masteryBenefit = masteredRoute ? (Number(choice.cost || 0) ? `koszt niższy o $${Number(choice.cost) - cost}` : Number(choice.quantity || 0) ? `wkład mniejszy o ${Number(choice.quantity) - quantity}` : Number(choice.damage || 0) ? "bez obrażeń dzięki negocjacjom" : null) : null;
    return { ...choice, label, cost, quantity, damage, masteryBenefit, reasons };
  });
  return { ...situation, week: weekKey(now), relation, unlocked: relation.trust >= 2, resolved, currentClass, mastery, choices };
}

export function recordContactTrust(contacts, districtId, delta = 1, now = Date.now()) {
  const stories = normalizeCityStories(contacts.stories, now);
  stories.relations[districtId].trust = clamp(stories.relations[districtId].trust + delta, 0, 20);
  contacts.stories = stories;
  return stories.relations[districtId];
}

export function resolveCitySituation(player, districtId, choiceId, now = Date.now()) {
  const view = getCitySituation(player, districtId, now);
  if (!view) fail("Nieznana sytuacja miejska.");
  if (view.resolved) fail("Ta sytuacja została już rozwiązana w tym tygodniu.");
  if (!view.unlocked) fail("Kontakt jeszcze cię nie zna. Zamknij 2 udane umowy w tej dzielnicy.");
  const choice = view.choices.find((entry) => entry.id === choiceId);
  if (!choice) fail("Nieznane rozwiązanie sytuacji.");
  if (choice.reasons.length) fail(choice.reasons.join(". "));
  const profile = player.profile;
  profile.cash = Math.max(0, Number(profile.cash || 0) - choice.cost + Number(choice.cash || 0));
  profile.hp = Math.max(0, Number(profile.hp || 0) - Number(choice.damage || 0));
  profile.heat = clamp(Number(profile.heat || 0) + Number(choice.heat || 0), 0, 100);
  if (choice.quantity) player.inventory[choice.goods] -= choice.quantity;
  const stories = normalizeCityStories(player.contacts.stories, now);
  const relation = stories.relations[districtId];
  relation.trust = clamp(relation.trust + choice.trust, 0, 20);
  relation.lastChoiceId = choice.id;
  relation.resolved.unshift({ week: view.week, situationId: view.id, choiceId: choice.id, at: now });
  relation.resolved = relation.resolved.slice(0, 8);
  stories.consequences.unshift({ id: `${view.id}:${view.week}`, districtId, kind: choice.consequence.kind, label: choice.consequence.label, uses: choice.consequence.uses, expiresAt: now + choice.consequence.hours * 3600000, choiceId: choice.id });
  player.contacts.stories = stories;
  player.city = applyDistrictActivity(player.city, { districtId, pressureDelta: choice.pressure, threatDelta: Math.max(0, Number(choice.heat || 0) / 2), influenceDelta: choice.trust > 0 ? 1 : 0, actionFamily: "city-situation", eventText: `${view.contact}: ${choice.label}`, now }).city;
  return { message: `${view.contact} zapamięta tę decyzję. ${choice.consequence.label} wpłynie na następne zlecenie.`, citySituationResolved: true, districtId };
}

export function applyCityConsequenceToQuote(quote, storiesValue, now = Date.now()) {
  const stories = normalizeCityStories(storiesValue, now);
  const item = stories.consequences.find((entry) => entry.districtId === quote.districtId && (
    !["quiet-cover", "hot-lead"].includes(entry.kind) || (entry.kind === "quiet-cover" ? quote.mode === "quiet" : quote.mode === "rush")
  ));
  if (!item) return { quote, consequence: null };
  const next = { ...quote };
  if (item.kind === "quiet-cover") next.heat -= 4;
  if (item.kind === "hot-lead") { next.reward = Math.round(next.reward * 1.2); next.heat += 4; }
  if (item.kind === "good-word") { next.reward = Math.round(next.reward * 1.08); next.heat -= 1; }
  if (item.kind === "neon-hype") { next.reward = Math.round(next.reward * 1.18); next.heat += 5; }
  if (item.kind === "guest-list") { next.reward = Math.round(next.reward * 1.1); next.heat -= 2; }
  if (item.kind === "harbor-route" && next.quantity) next.quantity = Math.max(1, Math.ceil(next.quantity * 0.7));
  if (item.kind === "skimmed-cargo") { next.reward = Math.round(next.reward * 1.15); next.heat += 3; }
  if (item.kind === "hard-escort") { next.reward = Math.round(next.reward * 1.12); next.damage = 0; }
  if (item.kind === "clean-window") { next.cost = Math.max(0, Math.round(Number(next.cost || 0) * 0.65)); next.heat -= 2; }
  if (item.kind === "inside-schedule") { next.chance = Math.min(0.98, Number(next.chance || 1) + 0.08); next.reward = Math.round(next.reward * 1.08); }
  if (item.kind === "camera-loop") { next.heat -= 5; next.chance = Math.min(0.98, Number(next.chance || 1) + 0.05); }
  if (item.kind === "decoy-crowd") { next.reward = Math.round(next.reward * 1.16); next.heat += 3; }
  if (item.kind === "union-route") { if (next.quantity) next.quantity = Math.max(1, next.quantity - 2); next.energy = Math.max(1, Number(next.energy || 1) - 1); }
  if (item.kind === "owing-favor") { next.reward = Math.round(next.reward * 0.88); next.heat += 2; }
  return { quote: next, consequence: { id: item.id, label: item.label, uses: item.uses, expiresAt: item.expiresAt } };
}

export function consumeCityConsequence(contacts, consequenceId, now = Date.now()) {
  if (!consequenceId) return;
  const stories = normalizeCityStories(contacts.stories, now);
  const item = stories.consequences.find((entry) => entry.id === consequenceId);
  if (item) item.uses--;
  stories.consequences = stories.consequences.filter((entry) => entry.uses > 0);
  contacts.stories = stories;
}
