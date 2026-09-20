# Miejska tablica planów — zamknięty etap

## 1. Co zostało wdrożone

Na ekranie Start działa kompaktowa miejska tablica planów. Pokazuje maksymalnie trzy kierunki wynikające z bieżącego stanu postaci i świata. Gracz może prowadzić jeden plan naraz, wybrać sposób rozegrania, przejść do najbliższego kroku, zobaczyć postęp i domknąć finał.

## 2. Typy planów

- **Okno wydarzenia miasta** — reakcja na aktywne wydarzenie i późniejsza umowa w dotkniętej dzielnicy.
- **Skok i czyste wyjście** — napad połączony z decyzją o zabezpieczeniu części środków w banku.
- **Telefon, który nie poczeka** — cicha lub pilna umowa kontaktowa; sukces i komplikacja prowadzą do innych konsekwencji.
- **Partia z odbiorcą** — produkcja zakończona sprzedażą własnego towaru albo dostawą do własnego klubu.
- **Obrót z zaplecza** — odbiór biznesu połączony z realną sprzedażą na rynku.

## 3. Powiązanie z istniejącą grą

Plany nie tworzą osobnych atrap akcji. Postęp pochodzi z istniejących, autorytatywnych liczników napadów, wpłat bankowych, odbiorów biznesu, handlu, produkcji, sprzedaży dilerskiej, stashu klubu, historii kontaktów i reakcji na wydarzenie miasta. Tablica prowadzi gracza do właściwej sekcji istniejącego interfejsu.

## 4. Klasy

Klasa daje alternatywną reakcję w planie wydarzenia oraz wpływa na realne wymagania i ekonomię umowy kontaktowej. Nazwa drogi klasy jest czytelna dla gracza. Plan pojawia się tylko wtedy, gdy wybrane podejście jest obecnie wykonalne; żetony premium nie zastępują towaru, energii, gotówki, zdrowia ani rozwoju kontaktu.

## 5. Gra solo i gang

Każdy archetyp planu można rozegrać solo. Gang jest opcjonalnym kontekstem: jeśli jego dzielnica fokusu pokrywa się z wydarzeniem miasta, historia planu zmienia się w odpowiedź ekipy, a istniejąca reakcja członka nadal zasila wspólny cel. Sam plan nie dodaje gangu siły ani płatnych premii.

## 6. Wydarzenia miasta

Aktualne wydarzenie wpływa na ranking propozycji, dzielnicę, opis ryzyka, czas dostępności oraz ścieżki odpowiedzi. Plan wydarzenia wymaga dokładnie tej reakcji, którą gracz wybrał na tablicy, i późniejszej umowy w tej samej dzielnicy. Okna krótsze niż 15 minut nie są oferowane.

## 7. Postęp i persystencja

W chwili przyjęcia zapisywany jest punkt bazowy wszystkich używanych liczników. Wcześniejsze działania nie zaliczają planu. Aktywny plan, wybrana droga, punkt bazowy, finały i odrzucone propozycje są zapisane w profilu i odtwarzane po restarcie serwera. Standardowy plan ma 12 godzin od przyjęcia; wydarzenie może zamknąć plan wcześniej.

## 8. Zabezpieczenia

- tylko jeden aktywny plan;
- nagroda zapisywana razem ze zmianą profilu w jednej transakcji;
- idempotency key dla przyjęcia, odpuszczenia i finału;
- ponowienie po utracie odpowiedzi zwraca ten sam rezultat;
- ten sam klucz planu można odebrać tylko raz;
- odpuszczenie blokuje reroll tej samej propozycji w jej dziennym kluczu;
- serwerowy czas kontroluje wygaśnięcie;
- nie można odebrać finału po wygaśnięciu;
- klient nie przesyła postępu ani wartości nagrody.

## 9. Ekonomia

Nagrody wykorzystują istniejącą gotówkę, XP, Heat, wpływ, presję i zaufanie kontaktu. Maksymalna dodatkowa gotówka za plan to 900$, a XP 10. Plan nigdy nie przyznaje ani nie pobiera waluty premium. Komplikacja w umowie nie pozwala rerollować wyniku: plan można domknąć za mniejszą nagrodę, co chroni tempo sesji bez kasowania konsekwencji.

## 10. Testy

- 94/94 testy całego repozytorium;
- 7 testów domenowych tablicy oraz test API w izolowanej bazie;
- restart serwera z aktywnym planem;
- ponowienie przyjęcia i finału z tym samym kluczem;
- brak podwójnej gotówki i brak zmian premium;
- blokada postępu sprzed przyjęcia;
- sukces i komplikacja kontaktu;
- wygaśnięcie, odpuszczenie, solo, gang, klasy, biznes i fabryka;
- symulacja pięciu profili potwierdzająca limit trzech propozycji;
- smoke test pełnego przepływu przez realne endpointy;
- kontrola składni 129 plików i wizualny przegląd webowego UI.

## 11. Świadomie poza zakresem

Nie powstała nowa waluta, kampania, mapa, hosting, deployment ani nowy system zadań. Nie przebudowano też istniejących operacji i kariery. Tablica jest warstwą reżyserującą już działające systemy, więc etap pozostał zamknięty i nie dubluje wcześniejszej zawartości.

## 12. Następny etap

Największą wartość da teraz **tożsamość świata i frakcji NPC**: 3–4 rozpoznawalne organizacje z relacjami do dzielnic, kontaktów i wydarzeń, krótką pamięcią reakcji gracza oraz ofertami wynikającymi z reputacji. System powinien zasilać tablicę planów nowymi wariantami bez tworzenia osobnej kampanii i bez sprzedawania siły.
