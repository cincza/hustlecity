import { getTaskStateById, STARTER_TASK_IDS } from "./tasks.js";
import { getTaskDestination } from "./taskGuidance.js";
import { BUSINESSES, FACTORIES } from "./empire.js";

export const CAREER_CHAPTERS = [
  { id: "street", title: "Pierwsza robota", contact: "Leon · kontakt z ulicy", story: "Najpierw wybierz klasę i poznaj zasady. Zrób skok, pilnuj energii, zdrowia oraz Heat i naucz się obracać pieniędzmi.", tasks: STARTER_TASK_IDS },
  { id: "roots", title: "Własne zaplecze", contact: "Leon · pierwsza inwestycja", story: "Z pojedynczych skoków trudno zbudować imperium. Otwórz biznes i uruchom stały dochód.", tasks: ["piec-wejsc", "pierwszy-biznes", "odbierz-haracz"] },
  { id: "supply", title: "Twój łańcuch dostaw", contact: "Mira · pośredniczka", story: "Własny towar daje nowe możliwości. Zbuduj zaplecze, przygotuj partię i znajdź dla niej odbiorcę.", tasks: ["dwa-zrodla-kasy", "pierwsza-fabryka", "wlasny-towar", "reka-dilera"] },
  { id: "crew", title: "Większa robota", contact: "Mira · sieć kontaktów", story: "Sprawdź miejskie plany sesyjne, wyposaż sprzęt i przygotuj pierwszą operację. Gang może ci pomóc, ale tę drogę możesz ukończyć także samodzielnie.", tasks: ["pierwszy-kontrakt", "operacja-na-serio", "trzy-fronty"] },
  { id: "empire", title: "Miasto zna twoje imię", contact: "Leon · własne imperium", story: "Twój lokal, własne dostawy i obecność w dzielnicy. Połącz je w sieć, która pracuje na twoją pozycję.", tasks: ["klub-na-zapleczu", "towar-dla-lokalu", "brudny-obrot", "dzielnica-ma-pamietac"] },
  { id: "network", title: "Za kulisami miasta", contact: "Mira · ostatni układ", story: "Masz pieniądze i zaplecze. Przedsięwzięcia Imperium prowadzą do finału także solo. Zdobądź trzy chronione cele i otwórz drogę do Skarbca miasta.", tasks: ["sieci-dzielnic", "skarb-miasta"] },
];

export function getCareer(snapshot, options = {}) {
  const chapters = CAREER_CHAPTERS.map((chapter) => {
    const steps = chapter.tasks.map((id) => getTaskStateById(id, snapshot, options));
    return { ...chapter, steps, claimedCount: steps.filter((task) => task.claimed).length, total: steps.length };
  });
  const chapter = chapters.find((entry) => entry.claimedCount < entry.total) || chapters.at(-1);
  const finished = chapters.every((entry) => entry.claimedCount === entry.total);
  const current = chapter.steps.find((task) => task.completed && !task.claimed) || chapter.steps.find((task) => !task.claimed) || null;
  let destination = getTaskDestination(current);
  let investment = null;
  if (current?.objective.kind === "businesses_owned") investment = BUSINESSES.find((business) => !(snapshot.businessesOwned || []).some((owned) => owned.id === business.id && owned.count > 0));
  if (current?.objective.kind === "factories_owned") investment = FACTORIES.find((factory) => !snapshot.factoriesOwned?.[factory.id]);
  if (investment && !current?.completed) {
    const player = snapshot.player || snapshot.profile || {};
    const missingCash = Math.max(0, investment.cost - Number(player.cash || 0));
    destination = Number(player.respect || 0) < investment.respect
      ? { tab: "heists", section: "solo", label: `Zdobądź ${investment.respect} RES`, hint: `${investment.name} wymaga ${investment.respect} RES. Zdobywaj XP ze skoków i misji.` }
      : missingCash > 0 && Number(player.bank || 0) >= missingCash
        ? { tab: "city", section: "bank", label: "Przygotuj gotówkę", hint: "Masz środki w banku. Wypłać brakującą kwotę, uwzględniając ewentualną opłatę." }
        : { ...destination, hint: `${investment.name}: $${investment.cost.toLocaleString("pl-PL")}. ${missingCash ? `Do zakupu brakuje $${missingCash.toLocaleString("pl-PL")}.` : "Masz środki na inwestycję."}` };
  }
  return { ...chapter, current, destination, finished, chapters, chapterNumber: chapters.indexOf(chapter) + 1 };
}
