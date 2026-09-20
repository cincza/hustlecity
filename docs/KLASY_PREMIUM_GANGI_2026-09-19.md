# Hustle City — klasy, żetony i gangi

## Zakres zamkniętego etapu

Rozwinięto istniejące kontakty, pięć profesji, premiumTokens oraz system gangów. Nie powstały równoległe waluty, gildie ani nowy system progresji. Wybór profesji, darmowa nauka metod, nagrody kontaktów i podstawowe projekty gangu istniały przed tym etapem. Nowe są specjalizacje zdobywane praktyką, zakup żetonów przez Checkout, historia portfela, emblematy gangu i zadanie wymagające współpracy różnych członków.

## Profesje i specjalizacje

| Profesja | Podstawowa decyzja | Specjalizacja po 6 sukcesach daną metodą |
| --- | --- | --- |
| Biznesmen | Kapitał za dyskretny dochód, małe zużycie energii; biznes zwiększa skalę umów | Finansowanie bezpośrednio z banku za $40 dodatkowej prowizji |
| Diler | Dostawa zakupionego towaru albo własnej produkcji; fabryka zwiększa skalę | $60 dodatkowego kosztu za obniżenie Heat dostawy o 3 |
| Hustler | Obrót towarem zależny od ceny rynkowej; historia handlu otwiera większą skalę | Barter: dwa razy więcej fajek zamiast spirytusu |
| Król nocy | Finansowanie spotkań i ograniczanie Heat; lokal otwiera większe zlecenia | Lista gości: wypłata niższa o $100, koszt energii mniejszy o 1, odpowiednio mniej XP |
| Egzekutor | Brak kapitału wejściowego, ale koszt zdrowia, energii i Heat; operacje zwiększają skalę | Negocjacje za $120: brak obrażeń, koszt mniejszy o 1 EN i 4 Heat, odpowiednio mniej XP |

Wariant standardowy zawsze pozostaje dostępny. Specjalizacje są wymianą zasobów, nie bezwarunkowym ulepszeniem. Po pierwszym wejściu konto bez profesji wybiera ją bezpłatnie. Nie resetuje to starych kont. Kolejne metody można poznać bez żetonów po 6/12/18/24 udanych zleceniach. Wszystkie klasy zachowują dostęp do biznesów, produkcji, rynku, napadów i gangów.

Zmiana deklarowanej profesji kosztuje 3 żetony i wymaga wcześniejszego poznania docelowej metody. Nie zmienia statystyk, majątku, opanowanych metod, specjalizacji, liczników, limitów kontaktów ani progresji. Wyuczone metody pozostają dostępne niezależnie od aktualnej profesji. Zapłata nie pozwala więc szybciej odblokować silniejszego sposobu gry.

## Jedna waluta premium

Żetony są przechowywane w istniejącym premiumTokens. Bezpłatne i zakupione mają identyczne zastosowania:

- zmiana profesji: 3;
- osobiste wizytówki: 2/4/6;
- emblematy gangu: podstawowy bezpłatny, noir 4, korona 6. Kupuje boss z osobistego salda; emblemat należy do gangu. Ponowne wybieranie posiadanych znaków jest darmowe.

Znaki są widoczne w panelu gangu, katalogu ekip i profilu gangu. Nie dodają siły, wpływu, dochodu ani pozycji rankingowej. Nie dodano płatnych resetów specjalizacji — warianty nie są wzajemnie wykluczające i taki produkt nie miałby uzasadnienia.

Darmowe źródła: 3 jednorazowo za po 3 udane kontakty w każdej z 3 dzielnic; 2 za 9 udanych kontaktów w tygodniu; dalsze jednorazowe cele prestiżowe dają 4/6/10, wymagając rozwoju majątku, operacji i finansowania celów za $100 tys./$1 mln/$10 mln. To nieopłacalny sposób kupowania przewagi: żetony nie kupują przewagi. Powtarzalne źródło daje 104 żetony w 52 rozliczonych tygodniach, niezależnie od intensywności dalszego farmienia.

Pierwsze 3 żetony są osiągalne w 3 oknach kontaktów, zwykle 1–2 dni przy regularnych powrotach i udanych zleceniach. Późniejsza zmiana profesji wymaga oszczędności z 1–2 tygodniowych odbiorów; nie jest codziennym darmowym przełącznikiem. Podstawową zmianę stylu poprzez wyuczone metody można wykonać bez niej.

## Zakup i bezpieczeństwo zapisu

Pakiety początkowe: 10 żetonów za 9,90 zł; 30 za 24,90 zł. Są to wartości startowe produktu, nie wynik badania konwersji. Koszt pojedynczej zmiany profesji odpowiada około 2,49–2,97 zł zakupionych żetonów, z uwzględnieniem konieczności kupienia całego pakietu.

Backend tworzy sesję Stripe Checkout na podstawie własnego katalogu. Klient nie określa kwoty ani liczby żetonów. Powrót na stronę nie nalicza nagrody. Naliczanie następuje dopiero po podpisanym zdarzeniu paid, zgodnym z trwałym zamówieniem: sesja, właściciel, pakiet, kwota i waluta muszą pasować.

Podpis sprawdzany jest na oryginalnych bajtach żądania z tolerancją 300 sekund. Saldo, historia i stan zamówienia zapisują się w jednej transakcji SQLite. Trwały stan paid chroni również przed ponownym naliczeniem przez inne zdarzenie i po restarcie, niezależnie od czasu przechowywania zwykłych paragonów akcji. Usługi premium korzystają z istniejących blokad, transakcji i idempotencji. Panel pokazuje ostatnie wpisy portfela; zapis kontaktów zachowuje ostatnie 40, a płatne zamówienia są osobnymi trwałymi dokumentami.

Konfiguracja wyłącznie backendowa: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, PREMIUM_RETURN_URL. Webhook: POST /premium/webhook, zdarzenia checkout.session.completed oraz checkout.session.async_payment_succeeded. Brak konfiguracji wyłącza zakupy, pozostawiając darmowe nagrody i wydawanie żetonów.

Implementację oparto na dokumentacji [tworzenia Checkout](https://docs.stripe.com/api/checkout/sessions/create), [podpisów](https://docs.stripe.com/webhooks/signature) i [naliczania zakupów](https://docs.stripe.com/checkout/fulfillment). W tym etapie nie uruchomiono rzeczywistych płatności ani testu na koncie Stripe. Testy używają fałszywego transportu operatora i lokalnie podpisanych zdarzeń. Przed sprzedażą konieczne są testy operatora oraz obsługa zwrotów i sporów; automatyzacji refundacji ani zakupów sklepów mobilnych ten etap nie obejmuje.

## Gangi

Zachowano istniejące wymagania: 15 respektu i $250 000 gotówki, brak aktualnego gangu i więzienia, poprawna unikalna nazwa. Koszt premium wynosi ZERO. Kupno dowolnej liczby żetonów nie zastępuje respektu ani gotówki. Dołączenie do istniejącego gangu pozostaje wcześniejszą drogą do wspólnej gry, zależną od rekrutacji i wymagań ekipy.

Istniejące projekty, siedziba/zabezpieczenia, napady, wpływy dzielnic i zadania pozostają podstawą rozwoju. Nowe zadanie „Każdy ma swoją robotę” wymaga udanych kontaktów w dzielnicy gangu, z możliwością przypisania trzech różnych metod do trzech różnych członków. Jedna osoba wykonująca trzy metody nie wystarczy. Gracze o tej samej klasie mogą je wykonać po darmowym poznaniu innych metod — płatna zmiana klasy nie jest potrzebna.

Nagroda raz na tydzień: $3600 do skarbca, +3 wpływu w dzielnicy, -3 presji. Zmiana dzielnicy nie umożliwia ponownego odbioru. Postęp i emblemat synchronizują się między członkami; nowy członek otrzymuje aktualny stan gangu. Istniejące zadanie 9 kontaktów pozostaje dostępne także mniejszym ekipom.

## Obliczenia balansu

Uruchomienie: node tools/analyze-class-premium.mjs. To kilkadziesiąt operacji matematycznych, bez kont, oczekiwania na timery ani pełnego playthrough.

15 respektu wymaga 2450 XP od poziomu 1. Model zakłada 2–3 sesje dziennie w różnych oknach kontaktów, 20 odnowionej energii + 15 z posiłków na sesję, trzy standardowe kontakty oraz zużycie pozostałej energii na pierwszy napad. Przedział szans powodzenia pochodzi z definicji tego napadu. Wynik: 20–35 dni przy 2 sesjach lub 13–23 dni przy 3 sesjach, zależnie od metody i skuteczności. Nie uwzględnia XP z questów i późniejszych napadów ani opóźnień więzienia, leczenia i braku towaru. To orientacyjny zakres tempa XP, nie gwarancja terminu założenia gangu.

Dla kosztu gotówkowego: cztery już posiadane bary dają $28 800 brutto/dobę przy regularnym odbiorze, czyli około 9 dni odkładania $250 tys. BEZ wydatków. Budowa takiego zaplecza, jedzenie i inne zakupy wymagają dodatkowego czasu. Rozsądny orientacyjny cel to kilka tygodni regularnej gry; pełny czas wymaga późniejszej telemetrii graczy, nie deklaracji na podstawie samego wzoru.

Żadna klasa nie dominuje wszystkich zasobów: efektywność energii konkuruje z wypłatą na okno, zapotrzebowaniem na kapitał/towar, zdrowiem i Heat. Nie oznacza to dowodu idealnego balansu — rynek i zachowania graczy mogą zmienić atrakcyjność. Wspólny limit kontaktów i darmowy dostęp do wszystkich metod ograniczają skutki nietrafionego pierwszego wyboru.

## Weryfikacja

- Pełny zestaw testów jednostkowych i integracyjnych; dodatkowo testy pięciu specjalizacji, braku obejścia wymagań gangu przez premium, uprawnień i kosztów emblematów oraz przypisania metod do członków.
- Test izolowanego API i SQLite: zły podpis, zła kwota, brak konfiguracji, wymuszony błąd zapisu dokumentu zamówienia i rollback salda, ponowienie płatności, inne ID zdarzenia, restart i ponowienie zakupu kosmetyki.
- Pełny istniejący smoke test rozszerzony o współpracę trzech prawdziwych kont testowych, wspólny stan i niedozwolone zakupy emblematów. Dane w katalogach tymczasowych.
- Kontrola składni i krótki model matematyczny. Bez pełnego przechodzenia gry, APK, deploymentu i mobile QA. Bez commitów, publikacji i zmian danych produkcyjnych.

## Następny duży etap

Kampania dzielnicowa: krótkie wątki kontaktów z rozgałęzieniami, konsekwencjami dla relacji i celami zespołowymi wykorzystującymi istniejące systemy. Powinna nadać znaczenie wyborom oraz zapewnić powód do powrotu po pierwszym tygodniu, zamiast dodawać kolejną niezależną walutę czy mechanikę.
