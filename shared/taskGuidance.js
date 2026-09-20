import { getTaskStateById, STARTER_TASK_IDS } from "./tasks.js";

const destinations = {
  operation_targets: ["heists", "operations", "Otwórz sieć operacji", "Każdy cel liczy się raz. Zwycięstwa i odblokowania zostają zapisane na stałe."],
  operations_completed: ["heists", "operations", "Zaplanuj operację", "Przygotuj pięć etapów. Sprawdź koszt całkowity i ryzyko przed finałem."],
  heists_done: ["heists", "solo", "Przejdź do skoków", "Wybierz Kieszonkowca. Jedna próba kosztuje 1 EN; wynik nie blokuje pierwszej nagrody."],
  heists_won: ["heists", "solo", "Przejdź do skoków", "Wybierz napad i sprawdź jego szanse przed akcją."],
  respect_reached: ["heists", "solo", "Zdobywaj szacun", "Wykonuj skoki i odbieraj XP z ukończonych misji."],
  gym_trainings: ["city", "gym", "Idź na trening", "Kup karnet, jeśli go nie masz, i wykonaj jedną serię wybranego ćwiczenia."],
  gym_pass: ["city", "gym", "Kup karnet", "Wybierz karnet na siłowni."],
  bank_deposit_total: ["city", "bank", "Otwórz bank", "Wpłać łącznie $3000. Wcześniejsze wpłaty również się liczą."],
  market_trade_pair_count: ["market", "street", "Handluj towarami", "Kup łącznie 3 zwykłe towary i sprzedaj 3. Ceny mogą się zmieniać; nagroda czeka po wykonaniu obu kroków."],
  meals_eaten: ["city", "restaurant", "Idź do restauracji", "Jedz, kiedy brakuje energii. Restauracja uzupełnia do 15 EN w godzinę."],
  heals_used: ["city", "hospital", "Otwórz szpital", "Leczenie przydaje się po utracie HP. Przy pełnym zdrowiu wybierz inną misję."],
  drugs_bought: ["market", "drugs", "Otwórz dilera"],
  dealer_sales_value: ["market", "drugs", "Otwórz dilera"],
  businesses_owned: ["empire", "businesses", "Sprawdź biznesy"],
  business_collections: ["empire", "businesses", "Odbierz dochód"],
  wealth_total: ["empire", "businesses", "Rozwijaj dochód"],
  factories_owned: ["empire", "factories", "Sprawdź fabryki"],
  drug_batches: ["empire", "factories", "Otwórz produkcję"],
  produced_drug_sales_value: ["market", "drugs", "Otwórz dilera"],
  club_owned: ["empire", "club", "Sprawdź lokale"],
  club_stash_moves: ["empire", "club", "Otwórz klub"],
  gang_joined: ["gang", "overview", "Znajdź ekipę"],
  gang_members: ["gang", "members", "Sprawdź skład"],
  gang_vault_contributed: ["gang", "overview", "Otwórz skarbiec"],
  gang_heists_participated: ["gang", "heists", "Otwórz napady gangu"],
  district_presence: ["city", "districts", "Sprawdź dzielnice"],
  first_contract: ["heists", "contracts", "Przygotuj kontrakt"],
};

export function getTaskDestination(task) {
  if (!task || task.onlineDisabled || task.claimed) return null;
  const destination = destinations[task.objective?.kind];
  if (!destination) return null;
  const [tab, section, label, hint] = destination;
  return { tab, section, label, hint: hint || task.description };
}

export function getStarterJourney(snapshot, options = {}) {
  const steps = STARTER_TASK_IDS.map((id) => getTaskStateById(id, snapshot, options));
  const claimedCount = steps.filter((task) => task.claimed).length;
  // A finished task takes priority even if the player chose their own order.
  const current = steps.find((task) => task.completed && !task.claimed && !task.onlineDisabled)
    || steps.find((task) => !task.claimed && !task.onlineDisabled) || null;
  return { steps, claimedCount, total: steps.length, finished: claimedCount === steps.length, current };
}
