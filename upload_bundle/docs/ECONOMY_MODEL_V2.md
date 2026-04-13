# Hustle City Economy Model v2

Ten dokument zastępuje ogolne zalozenia z `ECONOMY_AND_BALANCE.md` bardziej konkretnym modelem startowym pod closed alpha. To jest model live-service: klient nie moze byc zrodlem prawdy dla rewardow, cooldownow, energii ani pasywnego income.

## ETAP 1 - AUDYT AKTUALNEJ EKONOMII

### Aktualne waluty i stany ekonomiczne

- `cash` - glowna soft waluta przy sobie.
- `bank` - bezpieczny soft storage.
- `respect` - progres, gate unlockow i ranking.
- `heat` - ryzyko policyjne i kara za spam ryzykownych akcji.
- `hp` - zasob bezpieczenstwa do akcji.
- `energy` - glowny limiter petli aktywnej.
- `premiumTokens` - hard currency.

### Aktualne zrodla zarobku

- heisty solo
- heisty gangu
- sprzedaz towaru na rynku
- sprzedaz narkotykow dilerowi
- club night
- biznesy pasywne
- panienki na ulicy
- tipy/kontakty z klubow

### Aktualne sinki i wydatki

- jedzenie
- leczenie / kaucja
- karnety na silownie
- biznesy
- fabryki
- surowce do fabryk
- przejecie lub postawienie klubu
- bank fees na backendzie

### Co wyglada dobrze i powinno zostac

- `energy` jako glowny pacing resource
- `respect` jako gate do unlockow zamiast czystego level gate
- `heat` jako dodatkowy limiter ryzyka
- 12h cap na naliczanie pasywne jako anti-idle measure
- cooldowny heistow po stronie backendu w vertical slice
- bank fees jako trade-off za bezpieczenstwo

### Co jest za slabe albo ryzykowne

- `App.js` dalej liczy sporo ekonomii lokalnie
- pasywne income biznesow i panienek nadal siedza na kliencie
- produkcja dragow, ryzyko nalotu i dealer inventory sa lokalne
- club night jest lokalnym payoutem
- dealer stock jest lokalny i podatny na manipulacje
- klient nadal robi lokalna regeneracje energii poza backendowym slice
- `api.js` mial wbite `localhost`, bez sensownej konfiguracji srodowisk
- current level curve jest bardzo plaska i `respect` wbija sie za szybko w early game

### Mechaniki podatne na szybkie farmienie

- lokalne heisty fallbackowe w `App.js`
- lokalny passive tick co 5s
- club night spam przy niepelnej migracji do backendu
- produkcja/sprzedaz dragow bez serwerowej kontroli stocku i cooldownow
- dealer buy/sell loop po stronie klienta
- gang heists lokalne, w tym podzial hajsu i jailed crew

## Current Economy Risk Report

### Inflation risk

- `cash` moze rosnac zbyt szybko z kilku zrodel naraz: heisty, market flips, club, biznesy, panienki.
- brak pelnej serwerowej kontroli nad pasywnym income oznacza, ze inflacja nie jest jeszcze wiarygodnie ograniczona.
- obecne sinki sa rozproszone i miejscami opcjonalne, przez co w mid game gotowka zacznie sie kumulowac szybciej niz sensowne wydatki.

### Exploit risk

- klient nadal jest w stanie lokalnie liczyc payouty i stany, wiec fallback offline moze byc traktowany jak exploitable sandbox.
- dealer inventory i club sales po stronie klienta sa podatne na manipulacje stanem.
- gang heists i jailed crew liczone lokalnie nie nadaja sie do prawdziwego multi.

### Reward scaling risk

- niektore aktywne rewardy rosna szybciej niz koszt energii i cooldownu.
- heisty wysokich tierow maja dobry flavor, ale bez mocnego heat/hp/cooldown enforcement na serwerze beda generowaly zbyt dobry EV.
- club + drugs + contacts moze zamienic klub w zbyt tani kombajn na value.

### Weak sinks

- leczenie i jedzenie sa za slabe, jesli gracz zarabia duzo na aktywnej petli.
- bank bez fee bylby zbyt bezpieczny; fee juz sa, ale brakuje dodatkowych trade-offow dla bardzo duzych sald.
- biznesy po zakupie potrzebuja mocniejszego upkeepu i claim friction.

### Progression pacing risk

- `respect` rosl za szybko, wiec unlocki mid game moga wchodzic za wczesnie.
- bez twardszej krzywej unlockow gracz za szybko przeskoczy early game i ominie podstawowe petle.

### Premium imbalance risk

- premium nie moze kupowac stalej przewagi bojowej, respektu ani czystego cashu.
- energy refill, jesli nie ma twardego capu dziennego, zamieni sie w pay-to-farm.
- founding shortcut dla klubu moze byc premium convenience, ale nie powinien omijac gate'ow respektu ani gangu.

### Bank abuse risk

- jesli bank chroni 100% bez limitow i prawie bez kosztu, PvP i risk economy traca znaczenie.
- bez rozroznienia cash on hand vs secured bank money gracz zawsze optymalnie przerzuca wszystko do banku.

### Business snowball risk

- `buy and print` bez upkeepu i diminishing returns zniszczy ekonomie po kilku dniach.
- biznesy i panienki musza miec claim cap, upkeep i spadajaca efektywnosc przy masowym stackowaniu.

## ETAP 2 - DOCELOWY MODEL EKONOMII

### 1. Waluty

#### Cash

- glowna waluta operacyjna
- zdobywana przez heisty, rynek, biznesy, klub, eskorte, eventy
- wydawana na: jedzenie, leczenie, gear, biznesy, fabryki, surowce, bank fees, kaucje, lapowki, scouting, klub, vanity cash sinks
- `cash` nie powinien byc bezposrednio kupowany za premium

#### Premium currency

- waluta wygody i vanity
- zdobywana z mikropatnosci, battle pass, ograniczonych eventow, referral milestones
- wydawana na: skiny, avatary, custom profile, extra loadout slots, rename tickets, gang emblem slots, queue helpers, capped energy refill, convenience-only club founding shortcut
- premium NIE powinno kupowac: respektu, stalego ataku/obrony, czystego cashu, gwarantowanych wygranych, permanentnych stat boosts

#### Respect

- nie waluta do wydawania, tylko `progression gate`
- zdobywany przez ryzykowne akcje i wybrane cele tygodniowe
- unlockuje heisty, dzielnice, biznesy, fabryki, role i funkcje social

#### Event token

- opcjonalny dopiero po closed alpha
- osobna waluta na eventy sezonowe
- nie miesza sie z glowna ekonomia i wygasa po sezonie

### 2. Core loop

`energy -> heist/action -> reward -> heat/hp/cooldown -> upgrade/repair/secure money -> lepsze income -> trudniejsze akcje`

Zasady:

- gracz nie powinien spamowac bez konca, bo ogranicza go `energy`, `hp`, `heat` i `cooldown`
- gracz nie powinien byc martwy po 10 minutach, bo ma miks: pasywny regen energy, food cap, biznes claim, daily goals
- najlepszy income ma wynikac z polaczenia aktywnej gry i umiarkowanego pasywnego empire, nie z jednego loophola

### 3. Energy system

#### Rekomendowany model startowy

- `max energy`: 20
- `regen`: 1 energy co 6 minut
- `full refill from empty`: 120 minut
- `daily premium refill cap`: 2
- `restaurant soft cap`: max 10 dodatkowej energii na godzine z jedzenia
- `energy cap increase`: +1 do max energy na levelach 5, 10, 15, 20; max do 28 bez premium

#### Koszty energii

- easy heist: 2-3
- medium heist: 4-6
- hard heist: 8-10
- elite heist: 12-14
- fight club: 3
- scouting/intel: 1-2
- market/bank/profile/social: 0

#### Dlaczego tak

- 20 energii i 6 minut regen daje 240 energii dziennie z samego czasu
- jedna sesja 20-30 minut pozwala wykonac 4-8 sensownych akcji, ale nie 40
- restoran nie moze zamienic gry w bezkoncowe klikanie, wiec ma cap na godzine

### 4. Heist / action reward curves

Wzor cash EV:

`EV_cash = successChance * avgReward - (1 - successChance) * avgFailCashLoss`

Wzor true EV uproszczony:

`True_EV = EV_cash - (expectedHpLoss * hpValue) - (expectedHeatGain * heatValue)`

Dla startowego balansu przyjmujemy:

- `hpValue` early: 12 cash / 1 HP
- `hpValue` mid: 20 cash / 1 HP
- `hpValue` late: 32 cash / 1 HP

#### Tabela heist tiers

| Tier | Unlock respect | Energy | Cooldown | Representative chance | Avg reward | Avg fail cash loss | HP loss on fail | Heat success/fail | EV cash | Role |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: | --- |
| Tier 1 | 1-9 | 2-3 | 120-300s | 0.72 | 330 | 95 | 8 | 3-5 / 8-12 | 211 | early grind |
| Tier 2 | 10-23 | 4-5 | 420-720s | 0.62 | 1225 | 260 | 14 | 6-8 / 14-17 | 660 | mid setup |
| Tier 3 | 24-41 | 6-8 | 960-1500s | 0.54 | 3950 | 738 | 21 | 10-12 / 21-25 | 1796 | risky spike |
| Tier 4 | 42+ | 10-14 | 2400-3600s | 0.42 | 15225 | 2500 | 33 | 15-20 / 30-38 | 4044 | prestige/high risk |

#### Recommended expected value interpretation

- Tier 1 ma dawac dobry feeling postepu, ale nie eksplodowac cashflow
- Tier 2 staje sie glownym mostem do biznesow i lepszej logistyki
- Tier 3 daje duzy spike, ale za cene wysokiego heatu i ryzyka HP
- Tier 4 jest juz `capital play`, nie codzienny spam

### 5. Progression curve

#### Early game: dzien 1-3

- target aktywny income: `6k-12k cash / h`
- target pasywny income: `0-2k cash / h`
- unlock flow: Tier 1 heists -> pierwszy biznes -> pierwszy sensowny market loop -> Tier 2 heists
- gracz powinien odblokowac pierwszy biznes po `2-4 sesjach`
- gracz nie powinien stawiac klubu ani fabryki przed wyraznym wejciem w mid game

#### Mid game: tydzien 1-2

- target aktywny income: `18k-45k cash / h`
- target pasywny income: `4k-12k cash / h`, ale z claimalnym capem i upkeepiem
- unlock flow: Tier 2/3 heists -> 2-4 biznesy -> pierwsza fabryka niskiego ryzyka -> pierwsze role w gangu
- tempo powinno premiowac decyzje i zarzadzanie ryzykiem, nie samo AFK

#### Late game: po dluzszej grze

- target aktywny income: `70k-140k cash / h`
- target pasywny income: `15k-35k cash / h`
- bardzo wysoki income tylko przy wysokim `heat`, upkeepie, ryzyku nalotu i stalej uwadze gracza
- endgame ma byc napedzany przez prestige systems, gang play i event economy, nie tylko przez kolejne drukowanie cashu

### 6. Business / empire economy

#### Zasady modelu

- biznes daje `claimable passive income`, nie automatyczny wallet credit
- nalicza maksymalnie `12h`
- kazdy claim pobiera `maintenance + laundering/protection fee`
- po 3 biznesach tego samego typu wchodzi `diminishing returns`
- im wiecej masz aktywow, tym wyzszy `raid pressure`

#### Typy biznesow i ich rola

| Typ | Flavor store-safe | Charakter | Mocna strona | Slaba strona |
| --- | --- | --- | --- | --- |
| High-risk high-reward | `labs`, `grey production`, `underground logistics` | wysoki sufit | najlepszy margin | wysoki heat i naloty |
| Stable income | `clubs`, `venues`, `night spots` | przewidywalny dochod | niski variance | wyzszy upkeep przy skali |
| Fast risky cash | `escort / entertainment network` | szybki cashflow | szybki zwrot | ucieczki, pobicia, policyjne loss events |
| Balanced business | `garages`, `shops`, `food spots`, `distribution fronts` | uniwersalny | stabilny ROI | nie wygrywa w zadnej osi |

#### Slot limits

- early game: 2 business slots
- mid game: 4 business slots
- late game: 6 business slots
- dodatkowe sloty tylko przez `respect`, nie przez premium
- escort/entertainment network ma osobny slot bucket max 3
- underground production ma osobny slot bucket max 2

To gwarantuje, ze gracz miesza archetypy zamiast stackowac jeden najlepszy typ aktywa.

#### Formula

- `grossHourly = baseHourly * upgradeMultiplier * districtMultiplier * staffMultiplier`
- `netClaim = grossStored - maintenanceFee - launderingFee - raidLoss`
- `maintenanceFee = grossStored * (0.08 + 0.01 * (upgradeLevel - 1))`
- `launderingFee = grossStored * 0.04`
- `sameTypeDiminishing = 1.0 / (1 + 0.18 * (countOfSameType - 1))`
- `globalEmpireDiminishing = 1.0 / (1 + 0.06 * max(0, totalOwnedBusinesses - 3))`
- `riskPressure = baseRisk + heat * 0.002 + illegalBusinessCount * 0.015`

#### Business progression example - first 5 upgrades

| Upgrade | Unlock respect | Upgrade cost | Gross / h | Maintenance on claim | Net / h before raid | Stored cap (12h) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 5 | 18,000 | 220 | 8% | 202 | 2,424 |
| 2 | 8 | 27,000 | 370 | 9% | 318 | 3,816 |
| 3 | 12 | 41,000 | 610 | 10% | 525 | 6,300 |
| 4 | 17 | 62,000 | 940 | 11% | 799 | 9,588 |
| 5 | 23 | 96,000 | 1,360 | 12% | 1,142 | 13,704 |

#### Ile biznesow warto miec

- early: 1-2
- mid: 3-5
- late: 6-10 roznych, ale z diminishing returns i upkeepiem

#### Store-safe naming guidance

Zeby utrzymac klimat i ograniczyc ryzyko publikacyjne:

- zamiast doslownych nazw bardzo twardych substancji lub tresci, w UI produkcyjnym uzywaj bardziej `crime fantasy` labels:
  - `street product`
  - `club goods`
  - `grey lab`
  - `night venue`
  - `entertainment network`
- lore i art direction moga zostac mroczne i gangsterskie, ale labels pod store review powinny byc mniej doslowne
- backend i economy IDs tez warto trzymac neutralne, np. `venue`, `lab`, `goods`, `contact`, `runner`

### 7. Bank economy

#### Rekomendowany model startowy

- bank chroni `100% zdeponowanych srodkow`
- depozyt:
  - fee 0% do 2,500
  - powyzej 2,500 fee 0.5%, min 10
- wyplata:
  - fee 2%, min 15
- przelewy player-to-player: zablokowane do czasu anti-abuse tooling
- duze wyplaty `50k+` moga podbijac `heat` o 1-2 jako anty-pranie i anty-mule guard

#### Dlaczego

- bank ma byc bezpieczny, ale nie darmowy
- cash on hand musi miec sens, bo sluzy do ryzyka, zakupow i bycia okradzionym
- fee sprawiaja, ze ciagle przerzucanie tam i z powrotem nie jest optymalnym exploit loopem

### 8. Cash sinks

#### Sinki obowiazkowe od alpha

- leczenie i lekarze
- gear repair / gear replacement
- kaucja / bribery
- business maintenance
- laundering fees
- bank fees
- scouting / intel przed trudnymi akcjami
- gang vault contributions
- factory upkeep / transport protection

#### Sinki kosmetyczno-luksusowe za cash

- custom frames profilu
- drozsze tablice klubowe
- club decor tiers
- vanity garage skins
- jednorazowe event tables / VIP room buys

#### Sinki ograniczajace inflacje bez frustracji

- protection fee dla biznesow i klubow
- coroczna? nie, zamiast tego `claim-based fee`
- sponsorowane eventy klubowe za cash
- reputacyjne lapowki redukujace heat

### 9. Anti-inflation i anti-snowball

#### Wdrozyc od razu

- 12h passive cap
- maintenance fees
- bank fees
- cooldown enforcement
- heat pressure
- hp cost
- diminishing returns dla stackowania tego samego typu biznesu
- dealer sell rate ponizej buy rate
- brak player-to-player cash transfer na start

#### Wdrozyc po alpha / early beta

- regional market fluctuation
- anti-alt rules po device fingerprint / account age
- laundering license / legal cover levels
- gang territory upkeep
- economy segmentation per district

### 9.1 Market supply and pricing

#### Supply model

- brak resetu o `00:00`
- market aktualizuje sie co `5 minut` przy ruchu API
- kazdy produkt ma:
  - `streetStock`
  - `fallbackStock`
  - `demandScore`
- `streetStock` to tansza podaz uliczna / churn rynku
- `fallbackStock` to NPC reserve, drozszy od rynku graczy

#### Refill model

- refill jest `hourly`, ale naliczany w malych porcjach co tick
- wielkosc refillu zalezy od:
  - bazowej podaży produktu
  - liczby aktywnych graczy
  - aktualnej scarcity
- im bardziej puste polki, tym szybciej refill dobija do targetu

#### Pricing model

- `streetPrice` rosnie, gdy:
  - total supply spada
  - demandScore rosnie
- `streetPrice` spada, gdy:
  - towaru robi sie za duzo
  - gracze duzo sprzedaja
- `fallbackPrice = streetPrice * 1.16`
- `sellPrice` jest ponizej buy price i dodatkowo spada przy oversupply

#### Anti-monopoly rules

- per order limit `12` buy
- nie mozna kupic wiecej niz `42%` aktualnej plynnosci w jednym orderze
- NPC fallback zawsze trzyma minimalny floor, wiec rynek nie schodzi do zera
- oversupply po stronie sprzedazy zbija sellPrice, wiec dumpowanie towaru nie jest nieskonczenie oplacalne

### 9.2 Factories, wholesale and boosts

#### Rola systemu

- `fabryki` sa endgame capital play
- `hurtownia` odblokowuje sie dopiero po posiadaniu pierwszej fabryki
- `boosty` sa bonusem taktycznym, nie motorem nieskonczonego snowballa

#### Fabryki - model

- startowy `slot limit`: 1 fabryka
- dodatkowy slot przy `respect 28`
- trzeci i ostatni slot przy `respect 44`
- twardy cap: `3 fabryki`

To blokuje strategie `kup 8 fabryk i drukuj wszystko`.

#### Maintenance cost

Przy kazdym claimie / batch settlement:

- `upkeep = grossClaim * 12%`
- `laundering = grossClaim * 5%`
- `wholesale maintenance = grossClaim * 2% / 3.5% / 5%` zalezne od poziomu hurtowni
- `diminishing penalty = grossClaim * (1 - factoryDiminishing) * 12%`

Wzor:

`factoryDiminishing = clamp(1 - max(0, ownedFactories - 1) * 0.22, 0.44, 1)`

#### Raid / strata risk

Wzor startowy:

`raidChance = clamp(0.03 + heat*0.0018 + illegalTier*0.025 + stockExposure*0.006 + max(0, ownedFactories-1)*0.02, 0.03, 0.58)`

Gdzie:

- `illegalTier`:
  - low tier lab / legal-ish front: 1
  - mid tier synthesis: 2
  - high tier restricted product: 3-4
- `stockExposure` to uproszczona skala od 0 do 10 zależna od ilosci zalegajacego towaru

Skutek nalotu:

- 20-40% utraty batch stocku
- dodatkowe `heat +8 do +18`
- 10-25% szansy na czasowy lockdown hurtowni

#### Diminishing returns

- pierwsza fabryka: `100%`
- druga fabryka: `78%` efektywnosci dodatkowej
- trzecia fabryka: `56%` efektywnosci dodatkowej

To oznacza, ze kolejne fabryki nadal sa dobre, ale nie wygrywaja solo calej ekonomii.

#### Hurtownia - poziomy

| Tier | Unlock | Cost | Storage slots | Batch multiplier | Quality access | Maintenance |
| --- | --- | ---: | ---: | ---: | --- | ---: |
| 1 | 1 fabryka, respect 18 | 0 | 6 | 1.0x | standard | 2% |
| 2 | 1 fabryka, respect 28 | 145,000 | 10 | 1.35x | standard, refined | 3.5% |
| 3 | 2 fabryki, respect 42 | 390,000 | 16 | 1.8x | standard, refined, elite | 5% |

#### Lepsze komponenty = wyzsze wymagania

| Quality | Wholesale tier | Buy cost mult | Yield mult | Risk mod | Boost potency |
| --- | ---: | ---: | ---: | ---: | ---: |
| Standard | 1 | 1.00x | 1.00x | 1.00x | 1.00x |
| Refined | 2 | 1.38x | 1.08x | 0.96x | 1.08x |
| Elite | 3 | 1.82x | 1.15x | 0.92x | 1.15x |

Czyli lepsze komponenty:

- sa drozsze
- wymagaja lepszej hurtowni
- daja troche lepszy yield i potency
- ale nie na tyle, zeby lamac ekonomie

#### Boosty - caps i stacking

- globalny cap bonusu na pojedynczy stat: `24%`
- max `2` rodziny boostow jednoczesnie
- domyslny czas: `30 min`
- domyslny cooldown po zuzyciu tej samej rodziny: `20 min`

Stacking ma diminishing returns:

- pierwszy boost rodziny: 100% swojej mocy
- drugi: ~58%
- trzeci: jeszcze mniej, ale nigdy ponizej floor weight `12%`

Efekt koncowy jest dodatkowo clampowany do `24%`.

To blokuje petle:

`fabryki -> mocniejsze boosty -> lepsze heisty -> jeszcze wiecej kasy -> jeszcze wiecej fabryk`

bo:

- fabryki maja upkeep i ryzyko
- fabryki maja slot cap
- boosty maja hard cap, czas trwania i cooldown
- stacking boostow ma diminishing returns

### 9.3 Clubs and street income

#### Kluby - rola ekonomiczna

- klub ma `maly base income`
- glowny zarobek klubu ma pochodzic z `ruchu innych graczy`
- wlasne wejscia wlasciciela maja znaczenie pomocnicze, nie glowny profit source

#### Model klubu

- tick ekonomiczny: co `10 minut`
- base hourly income: `180 cash / h`
- visitor spend:
  - min `28`
  - max `64`
- max clients / tick:
  - baza `3`
  - +`1` przy duzej popularnosci
  - +`1` przy bardzo wysokiej popularnosci
  - maksymalnie `5`

#### Wzor klubowego income

`effectiveTraffic = min(visitorsCap, playerTraffic*0.55 + selfVisits*0.2)`

`crowdIncome = effectiveTraffic * visitorSpend`

`grossTick = (baseHourlyIncome * tickMinutes/60 + crowdIncome) * diminishing`

`netTick = grossTick - upkeep(18%) - laundering(6%)`

To oznacza:

- pusty klub nie zarabia prawie nic
- klub z ruchem graczy zarabia sensownie
- wlasciciel nie moze sam nabic ogromnej wartosci przez AFK siedzenie

#### Diminishing returns

- drugi klub tej samej kategorii: `72%`
- trzeci: `52%`
- dalej spada jeszcze mocniej

Czyli jeden dobry klub z ruchem jest lepszy niz bezmyslny spam kilku slabiej odwiedzanych lokali.

#### Skalowanie z ruchem graczy

- ruch innych graczy podnosi profit znacznie mocniej niz obecność właściciela
- dlatego `playerTrafficWeight = 0.55`, a `selfTrafficWeight = 0.2`
- klub z realnym community ma byc mocniejszy od martwego lokalu wlasciciela

#### Street income - zasady

- bazowa szansa znalezienia / triggeru: `3%`
- boosty moga to podniesc tylko lekko
- twardy max: `5.5%`
- cooldown na szukanie / triggerowanie: `12 minut`

Wzor:

`streetChance = clamp(0.03 + boostScore*0.0025 + venueBonus*0.001, 0.03, 0.055)`

Czyli:

- bez boostow nadal masz okolo 3%
- boosty pomagaja, ale nie robia z tego farmy
- nawet mocno przygotowany gracz nie przebija ~5.5%

#### Street income - capy i anti-spam

- `hourly claim cap = baseHourlyIncome * 10`
- `daily claim cap = baseHourlyIncome * 22`
- diminishing returns po `3` aktywnych trasach
- kazda dodatkowa trasa ponad 3 obcina wydajnosc o `18%`

Wzor:

`streetDiminishing = clamp(1 - max(0, activeRoutes - 3) * 0.18, 0.4, 1)`

#### Street income - heat i risk

- kazdy claim generuje heat:
  - `heatGain = claimedUnits * 0.004`
- risk event chance:

`riskChance = clamp(0.035 + heat*0.0015 + districtRisk*0.08, 0.03, 0.32)`

Efekt:

- im bardziej gracz cisnie ulice, tym bardziej rosnie heat
- bardziej niebezpieczne dzielnice nadal oplacaja sie, ale podbijaja szanse przypalu
- nie da sie latwo farmic ulicy bez ceny w ryzyku

#### Anti-farming effect

- niski base chance
- cooldown 12 min
- cap godzinowy i dobowy
- diminishing returns przy zbyt wielu aktywnych trasach
- heat jako naturalny limiter
- risk events jako cash leak

### 10. Premium currency

#### Mozna sprzedawac

- avatary
- ramki profilu
- rename ticket
- gang emblem pack
- club decor pack
- battle pass
- capped energy refill: max 2 dziennie
- queue helper: max 3 dziennie
- additional cosmetic stash/loadout slots

#### Nie wolno sprzedawac

- stalego ataku / obrony / zrecznosci
- czystego respektu
- gwarantowanego sukcesu heistu
- permanentnych mnoznikow cashu
- nieograniczonych energy refill
- bezposredniego pakietu `cash za premium`

#### Fair premium rules

- convenience ma miec `hard caps`
- premium shortcut nie moze omijac gate'ow respektu, gangu ani unlockow
- ranking powinien byc utrudniony do zdominowania przez gracza placacego tylko refillami

### 11. Live-ops / retention economy

#### Daily rewards

- dzien 1: food pack + 150 cash
- dzien 2: 1 scouting token
- dzien 3: 250 cash + medkit
- dzien 4: vanity fragment
- dzien 5: 1 capped queue helper
- dzien 6: 400 cash
- dzien 7: premium dust / pass XP, nie czysty power

#### Weekly objectives

- 3-5 zadan tygodniowo
- reward mix: cash, cosmetics currency, soft utility
- brak gigantycznych zastrzykow cashu

#### Comeback mechanics

- newbie protection do level 5 / respect 20
- returning player pack po 72h nieobecnosci:
  - 20-30 minut buffered progress help
  - 1 repair voucher
  - 1 medkit
  - nie wiecej niz 10% tygodniowego progresu

## ETAP 3 - KONKRETNE LICZBY I TABELA BALANSU

### Level curve - first 10 levels

| Level | Respect threshold | Energy cap | Active cash / h target | Passive cash / h target | Key unlock intent |
| --- | ---: | ---: | ---: | ---: | --- |
| 1 | 0 | 20 | 4k-6k | 0 | onboarding |
| 2 | 10 | 20 | 5k-7k | 0 | first Tier 1 consistency |
| 3 | 24 | 20 | 6k-8k | 0-300 | first meaningful market loop |
| 4 | 42 | 20 | 7k-10k | 300-700 | better food/heal pressure |
| 5 | 64 | 21 | 8k-12k | 500-1.2k | first business unlock sweet spot |
| 6 | 92 | 21 | 10k-14k | 800-1.8k | Tier 2 setup |
| 7 | 126 | 21 | 12k-18k | 1k-2.5k | second business or first upgrade |
| 8 | 166 | 21 | 15k-22k | 1.4k-3.5k | factory scouting stage |
| 9 | 214 | 21 | 18k-26k | 2k-4.5k | Tier 3 preparation |
| 10 | 270 | 22 | 22k-32k | 2.5k-6k | proper mid game entry |

### First 4 heist tiers - detailed operating model

| Tier | Unlock | Energy | Cooldown | Avg reward | Avg fail loss | Avg fail HP | Heat success | Heat fail | Session target |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | respect 1 | 2-3 | 2-5 min | 180-520 | 50-160 | 6-10 | 3-5 | 8-12 | 5-7 runs / session |
| 2 | respect 10 | 4-5 | 7-12 min | 900-1.8k | 140-420 | 12-18 | 6-8 | 14-17 | 3-4 runs / session |
| 3 | respect 24 | 6-8 | 16-25 min | 2.3k-6k | 350-1.25k | 16-28 | 10-12 | 21-25 | 2-3 runs / session |
| 4 | respect 42 | 10-14 | 40-60 min | 7.6k-22k | 1.2k-4.2k | 22-42 | 15-20 | 30-38 | 1-2 runs / session |

### Premium convenience caps

- premium energy refill: max 2 / day
- queue helper: max 3 / day
- rename ticket: no combat effect
- club founding premium shortcut: only if all normal unlocks are already met

### 9.4 PvP and club attacks

#### Goals

- players and gangs can pressure clubs, but no one loses everything in one hit
- theft is limited to `5%-20%`
- bigger players and gangs carry real exposure when they sit on valuable clubs
- smaller players can still punch up through underdog modifiers
- repeated griefing on one target is blocked by cooldowns and defender shields

#### Attack and defense logic

**Attack score**

`attackScore = attack*1.18 + dexterity*1.06 + defense*0.42 + respect*0.58 + gangMembers*2.35 + gangInfluence*1.8 + (committedCrew-1)*7.5 + intelBonus - heatPenalty`

Where:

- `heatPenalty = heat * 0.14`
- more crew helps, but only on committed operations
- raw stat stacking is not enough without respect and gang support

**Defense score**

`defenseScore = ownerDefense*1.16 + ownerAttack*0.34 + ownerDexterity*0.52 + ownerRespect*0.44 + securityLevel*18 + gangMembers*1.9 + gangInfluence*0.85 + popularity*0.18 + mood*0.12 + recentTraffic*1.1 - heatDrag`

Where:

- `heatDrag = ownerHeat * 0.10`
- clubs with stronger traffic are more exposed, but also justify heavier security investment
- security upgrades are meaningful, but not absolute immunity

**Chance**

`chance = clamp(0.42 + underdogBonus - overdogPenalty + exposureBonus - chainPenalty + (attackScore-defenseScore)/340, 0.12, 0.82)`

Modifiers:

- `underdogBonus`: up to `+12%`
- `overdogPenalty`: up to `-14%`
- `exposureBonus`: up to `+8%`
- `chainPenalty`: up to `-18%`

#### Cooldowns and anti-grief

- player club attack cooldown: `45 min`
- gang attack cooldown: `90 min`
- defender shield after any resolved attack: `75 min`
- same attacker -> same target repeat cooldown: `4 h`
- max incoming attacks on one club per `24 h`: `4`
- max incoming attacks from one attacker per `24 h`: `2`

#### Newbie and grief protection

- starter club shield: first `48 h` after founding
- grief protection respect threshold: below `18 respect`
- if attacker power is over `2.35x` defender power on a low-respect club:
  - attack is either blocked by protection
  - or loss is forced down to `5%`

#### How loss is calculated

The attacker never drains total wealth. Only part of the club's liquid cashflow is exposed.

`liquidPool = clubCash + unclaimedIncome`

`safeReserve = liquidPool * 65%`

`raidablePool = max(0, liquidPool - safeReserve)`

`stealRate = clamp(0.05 + successChance*0.08 + marginBonus + underdogBonus*0.4 - securityMitigation, 0.05, 0.20)`

Where:

- `securityMitigation = securityLevel * 1.4%`, capped at `6%`
- `marginBonus` can add up to `+5%`
- protected clubs cap loss to `5%`

Final cash loss:

`cashLoss = min(raidablePool * stealRate, targetNetWorth * 3.5%)`

Repair and cleanup cost:

`repairCost = cashLoss * 18%`

This means:

- clubs are worth attacking
- but they cannot be zeroed out by one raid
- club owners always keep a protected reserve
- raid success creates pressure, not total deletion

#### What must be backend-only

- attack score calculation
- defense score calculation
- underdog / overdog modifier
- shield and protection checks
- cooldown enforcement
- same-target repeat lock
- daily incoming attack limits
- steal rate
- safe reserve
- final cash loss
- repair cost
- audit logs for every club raid attempt and resolution

### 9.5 Main loop anti-snowball control

Core loop under control:

`fabryki -> boosty -> lepsze akcje -> wiecej cashu -> kolejne fabryki`

This loop cannot stay linear in a live-service game. It now gets controlled by four layers:

#### 1. Maintenance scaling

Base factory settlement already pays upkeep, laundering and warehouse maintenance. On top of that:

`empireMaintenanceMultiplier = clamp(1 + extraFactories*0.18 + illegalBusinesses*0.06 + activeBoostFamilies*0.08 + extraStreetRoutes*0.04, 1, 2.4)`

Meaning:

- first factory keeps normal economics
- second and third factory push operational cost up hard
- running many illegal assets at once is expensive
- stacking boost families adds extra operating pressure

Recommended use:

- casual player with `1` factory and `0-1` active boost family feels little pressure
- hardcore player with `3` factories, `2` boost families and multiple illegal loops pays materially more every settlement

#### 2. Diminishing returns on action spam

First short session should feel good. Repeated grinding in one window should fall off.

Window:

- `45 min`
- first `3` heists in the window are clean

After that:

`successPenalty = clamp(overflowRuns*2.5% + extraBoostFamilies*2% + extraFactories*1.2% + highTierPressure, 0, 14%)`

`rewardMultiplier = clamp(1 - overflowRuns*6% - extraBoostFamilies*3% - highTierPressure, 0.72, 1)`

`heatMultiplier = clamp(1 + overflowRuns*9% + extraFactories*6% + highTierPressure*5%, 1, 1.55)`

`hpRiskBonus = clamp(overflowRuns*1.5% + heat*0.08%, 0, 10%)`

This keeps:

- short 20-minute sessions fun
- long sessions strategic instead of braindead grind
- top-end players pushed into rotation, scouting, risk management and timing

#### 3. Risk escalation on illegal empire

Factories already have raid risk. Now large illegal setups push that risk further:

`raidChance = base + heat*0.0018 + illegalTier*0.025 + stockExposure*0.006 + extraFactories*0.02 + illegalBusinesses*0.012 + activeBoostFamilies*0.018 + recentBatchSettlements*0.01`

This means:

- bigger empire = bigger exposure
- stronger boosts are not free
- burst-producing too many batches too quickly creates visible risk

#### 4. Anti-idle farming

Idle play cannot outperform active play.

Passive accrual:

- soft cap starts after `4 h`
- hard cap remains `12 h`

Decay:

`idleClaimDecayMultiplier = clamp(1 - extraHoursAfter4h*5%, 0.6, 1)`

At `12 h` the player is still protected from losing everything, but receives only around `60%` efficiency on the oldest idle portion instead of perfect AFK value.

This keeps:

- casual players safe if they miss a few hours
- no reward for disappearing for days and returning to absurd stacks

#### What to ship now

- empire maintenance multiplier
- heist pressure window
- reward multiplier floor at `72%`
- success penalty cap at `14%`
- heat multiplier cap at `1.55`
- passive soft-cap decay after `4 h`
- raid escalation from factories + boosts + illegal assets

#### What to ship later

- district efficiency modifiers by territory saturation
- rotating law-enforcement pressure events
- per-business category weekly tax pressure
- adaptive catch-up modifiers based on server percentile, not raw account age

### 9.6 Casino as controlled money sink

Casino should burn excess cash, create emotion and remain optional. It cannot be part of PvP power.

#### Design goals

- optional side loop
- strong cash sink
- no premium shortcut to better odds
- backend RNG only
- clear stake limits and daily loss control

#### Slot machine

Target:

- `RTP: 88.8%`
- `house edge: 11.2%`

Stake rules:

- min bet: `100`
- max bet: `6000`
- dynamic max stake also capped to `22%` of current daily loss cap

Weighted payout table:

| Outcome | Weight | Probability | Multiplier | EV contribution |
| --- | ---: | ---: | ---: | ---: |
| `777 JACKPOT` | 8 | 0.8% | 28x | 0.224 |
| `Triple hit` | 30 | 3.0% | 8x | 0.240 |
| `Double match` | 120 | 12.0% | 2.0x | 0.240 |
| `Lucky cherry` | 160 | 16.0% | 1.15x | 0.184 |
| `Miss` | 682 | 68.2% | 0x | 0.000 |

Total:

- `RTP = 0.888`
- `house edge = 0.112`

#### High-risk bet

Target:

- `RTP: 88%`
- `house edge: 12%`

Rules:

- min bet: `500`
- max bet: `15000`
- dynamic max stake capped to `35%` of current daily loss cap
- `44%` win chance
- `2.0x` payout on win

Formula:

`RTP = winChance * payoutMultiplier = 0.44 * 2.0 = 0.88`

This is simple, emotional and efficient as a sink.

#### Blackjack

Blackjack makes sense, but only when fully server-authoritative.

Recommended:

- target RTP around `92%`
- no local deck logic in production
- hidden dealer card and whole hand state on backend

For now:

- treat blackjack as `preview / future migration`
- do not trust current local implementation for live economy

#### Daily loss cap

Optional but recommended for launch:

`dailyLossCap = clamp(25000 + respect*900 + max(0, level-1)*2500, 25000, 180000)`

Examples:

- fresh player: `25,000`
- mid player: `~45,000-70,000`
- heavy late-game player: capped at `180,000`

This protects weaker players while still letting wealthy players burn meaningful cash.

#### Backend-only requirements

- all RNG
- weighted outcome selection
- stake validation
- daily loss cap tracking
- action cooldowns
- rate limiting
- cash mutation
- audit logs for wins above threshold and suspicious betting streaks

## ETAP 4 - BACKEND AUTHORITY

### Backend Economy Authority Checklist

#### Co musi zostac usuniete z klienta jako source of truth

- supply generation
- dynamic pricing
- factory production batches
- boost activation / duration / cooldown
- heist success chance final roll
- heist reward calculation
- gang heist final roll i jailed crew
- PvP outcome and loss calculation
- casino RNG
- passive income accumulation
- club night payout
- drug production outcome
- dealer stock mutation
- energy regeneration
- jail timers affecting economy

#### Co moze zostac na kliencie tylko do wyswietlania

- predicted odds / preview
- preview EV
- progress bars
- locally formatted timers
- disabled button states
- listy ikon, opisow i flavour text

#### Co wymaga walidacji serwerowej

- market quantity / bet / amount payloads
- reward calculation
- success chance
- respect gates
- unlock gates
- supply mutation
- pricing mutation
- factory slot limits
- factory recipes and input ownership
- boost family caps
- PvP target protection
- casino daily loss cap
- business purchase
- factory purchase
- drug recipe input
- bank deposit / withdraw
- premium spend
- passive claim cap

#### Co wymaga rate limiting

- auth
- heist execute
- market buy/sell
- bank operations
- casino operations
- club PvP preview / resolve
- gang invites
- club event triggers
- social actions that can spam notifications

#### Co wymaga audyt logow

- supply refresh snapshots
- price spikes and large trade deltas
- factory batch settlements
- boost activations
- PvP raid outcomes
- casino wins above threshold
- premium spend
- bank withdraws
- large cash inflows
- repeated failed validations
- suspicious alt-like referrals
- gang vault operations
- admin economy overrides

## ETAP 5 - WDROZENIE / PRZYGOTOWANIE POD WDROZENIE

## ETAP 4B - KONKRETNE LICZBY I TABELE BALANSU

To jest `balance snapshot` oparty o aktualne reguly w `shared/economy.js` oraz aktualne dane domenowe z `App.js`. Tam, gdzie backend nie ma jeszcze finalnych endpointow produkcji, ponizej jest wpisany `model startowy`, zeby dalo sie zaczac balansowanie bez zgadywania.

### Supply per hour

Market supply jest juz backend-authoritative. Refill nie robi resetu o `00:00`, tylko dobija w czasie.

Wzor:

- `street refill / h = hourlyStreetRefill + activePlayers * hourlyStreetRefillPerActivePlayer`
- `fallback refill / h = hourlyFallbackRefill + activePlayers * hourlyFallbackRefillPerActivePlayer`

#### Tabela startowa - supply na godzine

| Produkt | Street refill / h formula | NPC fallback / h formula | Przy 1 aktywnym graczu | Przy 10 aktywnych graczach |
| --- | --- | --- | ---: | ---: |
| Fajki | `22 + 1.4 * players` | `6 + 0.5 * players` | 29.9 total / h | 47.0 total / h |
| Spirytus | `16 + 1.1 * players` | `5 + 0.4 * players` | 22.5 total / h | 36.0 total / h |
| Ziolko | `9 + 0.75 * players` | `3 + 0.28 * players` | 13.0 total / h | 22.3 total / h |
| Speed | `6 + 0.48 * players` | `2 + 0.18 * players` | 8.7 total / h | 14.6 total / h |
| Piguly | `4 + 0.32 * players` | `1.4 + 0.12 * players` | 5.8 total / h | 9.8 total / h |
| Bialy towar | `2.1 + 0.16 * players` | `0.85 + 0.08 * players` | 3.2 total / h | 5.4 total / h |
| Crystal | `1.4 + 0.1 * players` | `0.55 + 0.05 * players` | 2.1 total / h | 3.5 total / h |

Uwagi:

- `NPC fallback` jest zawsze drozszy, bo ma `1.16x` markup.
- jeden order nie moze zabrac wiecej niz `42%` plynnosci rynku.
- jeden order kupna ma cap `12`, a sprzedazy `20`.

### Produkcja fabryk

Fabryki sa dalej czesciowo `TO_MIGRATE_TO_SERVER`, wiec tutaj jest `proponowany model startowy`, zgodny z obecnym kosztem, unlockami, batch size i maintenance backendowym.

#### Twarde backendowe reguly juz ustalone

- sloty fabryk: `1 / 2 / 3` przy respect `0 / 28 / 44`
- hard cap: `3`
- upkeep: `12%`
- laundering: `5%`
- hurtownia maintenance: `2% / 3.5% / 5%`
- diminishing dodatkowych fabryk:
  - `1 fabryka = 100%`
  - `2 fabryki = 78%`
  - `3 fabryki = 56%`
- raid chance:
  - `0.03 + heat*0.0018 + illegalTier*0.025 + stockExposure*0.006 + extra scaling penalties`

#### Model startowy - batch timing i throughput

Wzor:

- `units / h = batchSize * (60 / batchMinutes) * qualityYieldMultiplier`
- `gross street value / h = units / h * streetPrice`

#### Tabela fabryk

| Fabryka | Respect | Cost | Produkty | Batch time start | Units / h standard | Gross street value / h | Komentarz |
| --- | ---: | ---: | --- | ---: | ---: | ---: | --- |
| Fabryka fajek | 4 | 80,000 | Fajki | 18 min | 13.3 | ~867 | bridge factory, niskie ryzyko |
| Destylarnia spirytusu | 6 | 125,000 | Spirytus | 22 min | 8.2 | ~777 | stabilny low-mid throughput |
| Wet Lab GBL | 10 | 240,000 | GBL | 28 min | 4.3 | ~386 | pierwszy bardziej ryzykowny lab |
| Szklarnie botaniczne | 14 | 450,000 | Salvia / Grzybki / Hasz / Marihuana | 32 min | 3.8-5.6 | ~656-1,200 | uniwersalna fabryka mid game |
| Laboratorium proszkow | 22 | 820,000 | Amfetamina / Rohypnol | 38 min | 3.2 | ~1,516-2,400 | dobry margin, duzy heat |
| Zaklad opium i heroiny | 30 | 1,250,000 | Opium / Heroina | 45 min | 1.3-2.7 | ~1,653-1,760 | wysoki risk, niski throughput |
| Rafineria kokainy | 36 | 1,800,000 | Kokaina | 52 min | 2.3 | ~2,262 | high-risk high-reward |
| Acid Lab | 44 | 2,550,000 | LSD | 58 min | 1.0 | ~1,634 | top tier potency, niski volume |
| Designer Lab | 52 | 3,600,000 | Extasy / Meskalina | 64 min | 0.9 | ~1,744-2,138 | late-game premium lab |

To sa wartosci `gross street value / h`, nie czysty profit. Realny profit pomniejszaja:

- koszty komponentow
- upkeep `12%`
- laundering `5%`
- maintenance hurtowni
- scaling maintenance z `loopControl`
- raid loss

#### Koszt komponentow / batch - przyklad startowy

| Produkt | Batch size | Components / batch | Cost / batch | Gross batch value | Margin before maintenance |
| --- | ---: | --- | ---: | ---: | ---: |
| Fajki | 4 | `2x tobacco + 1x packaging` | 200 | 260 | 60 |
| Spirytus | 3 | `2x grain + 1x glass` | 350 | 285 | -65 |
| GBL | 2 | `2x chemicals + 1x solvent + 1x glass` | 570 | 360 | -210 |
| Marihuana | 2 | `3x herbs + 1x packaging` | 225 | 640 | 415 |
| Amfetamina | 2 | `2x chemicals + 1x pills + 1x packaging` | 355 | 960 | 605 |
| Kokaina | 2 | `2x coca + 1x solvent + 1x packaging` | 725 | 1,960 | 1,235 |
| LSD | 1 | `2x acid + 1x chemicals + 1x glass` | 870 | 1,580 | 710 |
| Meskalina | 1 | `2x cactus + 1x chemicals + 1x glass` | 780 | 2,280 | 1,500 |

Wniosek startowy:

- low-tier fabryki powinny byc glownie o `unlock / utility / boost access`, nie o czystym drukowaniu kasy
- prawdziwy margin zaczyna sie od `greenhouse / powderlab` wzwyz
- to dobrze podpiera model `endgame capital play`

### Kluby

#### Twarde backendowe reguly

- base income: `180 / h`
- tick: `10 min`
- base income / tick: `30`
- visitor spend: `28-64`
- club capacity:
  - `3` przy popularity `0-39`
  - `4` przy popularity `40-79`
  - `5` przy popularity `80+`
- upkeep: `18%`
- laundering: `6%`
- same-category diminishing: `0.72^extraClubs`

Wzor:

- `visitorsCap = 3 + min(2, floor(popularity / 40))`
- `grossTick = (30 + crowdIncome) * diminishing`
- `netTick = grossTick - upkeep - laundering`

#### Tabela klubow - obecny model

Zakladamy `1` klub tej kategorii i sredni spend klienta `46`.

| Klub | Popularity | Takeover cost | Visitors cap / tick | Net / tick bez ruchu | Net / h bez ruchu | Net / tick przy full traffic | Net / h przy full traffic |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Chrome Mirage | 24 | 1,750,000 | 3 | 24 | 144 | 128 | 768 |
| Velvet Ash | 34 | 1,950,000 | 3 | 24 | 144 | 128 | 768 |
| Saint Static | 46 | 3,250,000 | 4 | 24 | 144 | 164 | 984 |

Wniosek:

- base income klubu jest maly
- prawdziwy sens ekonomiczny klubu zaczyna sie dopiero od ruchu innych graczy
- to spelnia zalozenie `player-driven income`

#### Security upkeep - przyklad

Wzor:

- `security upkeep = baseNet * 3.5% * securityLevel`

Przy `baseNet = 1,000 / h`:

| Security level | Extra upkeep / h |
| --- | ---: |
| 0 | 0 |
| 1 | 35 |
| 2 | 70 |
| 3 | 105 |

### Boosty

Boosty nie maja jeszcze finalnego katalogu backendowego per item, ale caps i stacking juz sa twarde. Ponizej jest `model startowy` dla potency.

#### Twarde backendowe reguly

- globalny cap jednego statu: `24%`
- max aktywne rodziny boostow: `2`
- duration: `30 min`
- cooldown tej samej rodziny: `20 min`
- stacking diminishing: `58%`
- minimalna waga kolejnego stacka: `12%`

#### Tabela boostow - model startowy

| Tier boosta | Surowa moc | Realna moc po capach | Czas | Cooldown | Rola |
| --- | ---: | ---: | ---: | ---: | --- |
| Light | +4% do 1 statu | +4% | 30 min | 20 min | early tactical |
| Standard | +8% do 1 statu | +8% | 30 min | 20 min | core combat utility |
| Strong | +12% do 1 statu | +12% | 30 min | 20 min | risky pre-heist commit |
| Dual | +8% do 1 statu, +4% do 2 stat | max zgodnie z family cap | 30 min | 20 min | late utility mix |
| Stacked second family | +8% nominalnie | ~+4.6% efektywnie przy 58% weight | 30 min | 20 min | side-grade, nie hard snowball |

Przyklad:

- pierwszy boost `+12% attack`
- drugi boost z tej samej osi `+8% attack`
- efektywny drugi wklad `8% * 0.58 = 4.64%`
- razem `16.64%`, nadal ponizej globalnego capu `24%`

### PvP i napady na kluby

#### Twarde backendowe reguly

- steal rate: `5-20%`
- safe reserve: `65%`
- repair cost: `18%` skradzionej kwoty
- max ataki na klub / 24h: `4`
- max od tego samego napastnika / 24h: `2`
- shield po ataku: `75 min`
- repeat cooldown na ten sam cel: `4 h`

Wzor straty:

- `liquidPool = clubCash + unclaimedIncome`
- `safeReserve = liquidPool * 65%`
- `raidablePool = liquidPool - safeReserve`
- `cashLoss = min(raidablePool * stealRate, targetNetWorth * 3.5%)`
- `repairCost = cashLoss * 18%`

#### Tabela PvP - przyklad strat

Przy `liquidPool = 100,000`, czyli `raidablePool = 35,000`.

| Steal rate | Cash stolen | Repair cost | Total defender pain |
| --- | ---: | ---: | ---: |
| 5% | 1,750 | 315 | 2,065 |
| 10% | 3,500 | 630 | 4,130 |
| 15% | 5,250 | 945 | 6,195 |
| 20% | 7,000 | 1,260 | 8,260 |

To dobrze trzyma zalozenie:

- nie mozna stracic wszystkiego
- duze kluby dalej maja realne ryzyko
- male kluby nie sa kasowane jednym kliknieciem

### Kasyno

Kasyno jest juz backend-authoritative dla `slot` i `high-risk`.

#### Tabela kasyna

| Gra | Min bet | Max bet | RTP | House edge | Daily bet share cap | Cooldown |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Slot | 100 | 6,000 | 88.8% | 11.2% | 22% daily loss capu | 4 s |
| High-risk | 500 | 15,000 | 88.0% | 12.0% | 35% daily loss capu | 4 s |
| Blackjack preview | 100 | 5,000 | 92.0% target | 8.0% target | do ustalenia po migracji | n/a |

#### Slot - payout table

Total weight = `1000`.

| Outcome | Weight | Chance | Multiplier |
| --- | ---: | ---: | ---: |
| 777 JACKPOT | 8 | 0.8% | 28x |
| Triple hit | 30 | 3.0% | 8x |
| Double match | 120 | 12.0% | 2x |
| Lucky cherry | 160 | 16.0% | 1.15x |
| Miss | 682 | 68.2% | 0x |

#### High-risk - payout table

| Outcome | Chance | Multiplier | EV |
| --- | ---: | ---: | ---: |
| Win | 44% | 2.0x | 0.88 |
| Lose | 56% | 0x | 0 |

### Co jest juz twarde, a co jest jeszcze modelem startowym

Juz twarde w backendzie:

- supply per hour formulas
- pricing rules
- club capacity formula
- club upkeep / laundering
- boost caps / stacking caps
- PvP steal floor i cap
- casino odds, RTP i limity stawek

Jeszcze model startowy do dopiecia endpointami:

- batch time i exact throughput fabryk
- per-item potency boostow
- finalna tabela produkcji / claimu dla kazdego typu produktu

### Co jest juz przygotowane w repo

- wspolny economy config w `shared/economy.js`
- backend config reexport w `backend/src/config/economy.js`
- frontend constants reexport w `src/constants/economy.js`
- backend liczy:
  - market snapshot
  - market supply / pricing rules
  - bank fees
  - casino RTP / bet limits / RNG
  - heist success/fail
  - heist cooldown
  - energy regen
  - club PvP preview rules

### Co nadal jest do migracji

- biznesy
- escort street income
- klub
- dealer inventory
- fabryki i recipes
- boost activation state
- gang heists
- prison chat / social locks powiazane z ekonomia

## ETAP 6 - PODSUMOWANIE

## Final Economy Model Summary

- `cash` ma byc glowna waluta operacyjna, ale pod kontrola sinkow, fees i risk systems
- `premium` ma byc convenience + vanity only, z twardymi capami
- `energy 20 / +1 co 6 min` daje sensowne sesje bez spamowania
- heisty maja miec czytelny EV, ale prawdziwy koszt rowniez w `hp` i `heat`
- biznesy i empire maja byc capowane przez upkeep, claim cap i diminishing returns
- bank ma chronic pieniadze, ale za fee i bez darmowego naduzycia
- backend musi zostac source of truth dla wszystkich liczb, ktore moga byc exploitable

## Najwazniejsze dalsze kroki przed closed alpha

1. przeniesc biznesy, klub, eskorty, dealer i fabryki na backend
2. dorobic persistence w PostgreSQL
3. dodac Redis albo inny storage pod cooldowns, passive accrual i hot state
4. odciac klient od lokalnego rewardowania i lokalnego passive ticka
5. dodac rate limiting i economy audit logs
6. postawic telemetry pod retention, LTV i economy health
