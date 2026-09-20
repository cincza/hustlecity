# HUSTLE CITY — etap „Żyjące miasto”

## Cel i zakres

Etap rozwija istniejące dzielnice, kontakty, Heat/presję i gangi. Nie dodaje równoległego systemu mapy, policji, klas ani waluty. Nowy przebieg jest spójny:

**dzielnica → lokalny kontakt → sytuacja → decyzja → zapamiętana konsekwencja → następne zlecenie → reakcja presji i gangu**

## Dzielnice

Trzy istniejące dzielnice mają teraz jawnie inne profile kontaktów:

| Dzielnica | Charakter gameplayu |
| --- | --- |
| Old Town | Niższe wypłaty kontaktów, ale mniej Heat. Dobre miejsce na cichą odbudowę i Biznesmena. |
| Neon Strip | Najwyższe zwykłe wypłaty, lecz dodatkowy Heat. Król nocy ma lokalną drogę rozwiązania problemu. |
| Harbor Line | Premia logistyczna do szansy pilnych zleceń, umiarkowanie większa wypłata i Heat. Diler, Hustler i Egzekutor mają tu własne rozwiązania. |

Rotujące co 6 godzin warunki operacyjne nadal działają. Presja tworzy teraz okazję zamiast samej kary: w stanie watched/crackdown/lockdown pilne zlecenia dostają odpowiednio większą wypłatę, ale tracą skuteczność i generują dodatkowy Heat. Ciche zlecenie nie dostaje premii za kryzys. Lockdown nadal ogranicza dodatnio „gorące” metody, więc alternatywą pozostaje zmiana dzielnicy, cicha profesja, przygotowanie albo ryzykowny pośpiech.

## Kontakty, pamięć i sytuacje

Każda udana umowa buduje zaufanie lokalnego kontaktu. Po 2 sukcesach gracz otrzymuje jedną sytuację tygodniowo w danej dzielnicy:

- **Old Town — „Księga na cudzym biurku”**: ochrona sieci, sprzedaż tropu albo droga Biznesmena przez legalny front.
- **Neon — „VIP bez zaproszenia”**: wygaszenie sytuacji, wykorzystanie tłumu albo przejęcie listy gości przez Króla nocy.
- **Harbor — „Kontener bez właściciela”**: uczciwa dostawa, zdjęcie części ładunku albo drogi Dilera, Hustlera i Egzekutora.

Kontakt przechowuje zaufanie, ostatni wybór oraz historię tygodniowych rozstrzygnięć. Ekran pokazuje, co zapamiętał. Rozwiązania nie różnią się wyłącznie wypłatą: zużywają gotówkę, towar lub zdrowie, zmieniają osobisty Heat i presję dzielnicy, a następnie tworzą ograniczony czasowo i liczbowo skutek dla kolejnej umowy.

Przykłady konsekwencji:

- czyste papiery zmniejszają Heat następnego cichego ruchu;
- sprzedany trop zwiększa wypłatę i Heat następnego pilnego ruchu;
- dobra opinia lub lista gości zmieniają wypłatę i ślad kolejnych umów;
- wolna rampa ogranicza ilość towaru wymaganego w następnym transporcie;
- twarda eskorta chroni przed obrażeniami przy następnym zleceniu.

Konsekwencja jest wyliczana przez serwer, widoczna w wycenie przed zatwierdzeniem i zużywana przy próbie wykonania umowy. Nie można jej skopiować przez ponowienie żądania ani ponownie rozstrzygnąć sytuacji w tym samym tygodniu.

## Klasy i specjalizacje

Podstawowe rozwiązania pozostają dostępne dla każdej klasy. Droga klasowa jest dodatkową wymianą zasobów i sposobem kontroli ryzyka:

- Biznesmen używa legalnego frontu w Old Town;
- Król nocy przejmuje listę gości w Neon;
- Diler podmienia transport w Harbor;
- Hustler rozlicza transport barterem;
- Egzekutor osobiście eskortuje ładunek.

Opanowanie istniejącej specjalizacji po 6 udanych umowach poprawia koszt właściwej drogi: mniej gotówki, mniej towaru albo brak obrażeń dzięki negocjacjom. Nie zwiększa bezwarunkowo nagrody. Liczy się aktualna klasa, więc tożsamość postaci ma znaczenie, ale zawsze istnieją co najmniej dwa rozwiązania ogólne. Żetony premium nie kupują zaufania, sytuacji, konsekwencji, Heat ani wpływów.

## Gang

Do istniejącej tablicy zadań dodano cel **„Miasto pamięta”**. Trzech różnych członków musi w tym samym tygodniu rozwiązać własną sytuację w aktualnej dzielnicy gangu. Jedna osoba nie może nabić celu trzy razy. Zmiana dzielnicy przed ukończeniem rozpoczyna zbieranie reakcji dla nowego miejsca; po odebraniu nagroda nie powtarza się.

Nagroda: $3000 do skarbca, +4 wpływu i -4 presji. Decyzje i ich osobiste konsekwencje pozostają własnością graczy, a gang dostaje tylko postęp wspólnej reakcji. Stan synchronizuje się między członkami, przechodzi do nowo dołączającego członka i resetuje w kolejnym tygodniu. Premium nie wpływa na postęp ani nagrodę.

## Persystencja i bezpieczeństwo

Nowe akcje korzystają z istniejącego endpointu kontaktów, blokad gracza/gangu, transakcji SQLite i paragonów idempotencji. Zapis obejmuje równocześnie zasoby, relację, historię, konsekwencję, miasto oraz — jeśli dotyczy — wspólny stan gangu. Nie ma osobnego, słabszego magazynu danych.

Test API potwierdza:

- zachowanie decyzji, gotówki, presji i konsekwencji po restarcie serwera;
- identyczną odpowiedź na ponowienie z tym samym kluczem operacji;
- brak drugiego naliczenia gotówki lub presji;
- odrzucenie nowej próby ponownego rozwiązania tej samej sytuacji.

## Balans i pomiary

Skrypt `node tools/analyze-city-stage.mjs` wylicza 45 kombinacji: 5 klas × 3 dzielnice × 3 poziomy presji. Nie wykonuje kont, timerów ani pełnego przejścia gry. Wynik jest zapisany pomocniczo w `.codex-local/city-stage-balance.json`.

W badanym zestawie szansa pilnego zlecenia mieściła się w zakresie 58–84%. Przy wysokiej presji wypłata rośnie, ale rośnie też Heat, spada szansa powodzenia i pozostaje ryzyko utraty wejściowych kosztów lub towaru. Skrypt nie przelicza towaru na stałą kwotę, ponieważ jego cena jest dynamiczna na istniejącym rynku.

## Weryfikacja

- 81/81 testów jednostkowych i integracyjnych;
- pełny smoke test na izolowanej bazie, obejmujący restart i odtworzenie stanu;
- kontrola składni 121 plików JS/JSX;
- kontrola diffu bez błędów whitespace;
- osobne testy profili dzielnic, ryzyka przy wysokiej presji, pamięci kontaktu, jednorazowego zużycia konsekwencji, dróg klasowych, braku wpływu premium oraz trzech unikalnych członków gangu.

Nie wykonywano pełnego playthrough, deploymentu, publikacji ani zmian danych produkcyjnych. Zmiany nie zostały commitowane.

## Świadomie poza zakresem

Nie dodano ogromnej kampanii tekstowej, większej mapy, dziesiątek losowych popupów, nowej waluty, drugiego systemu policji ani osobnego systemu gildii. Nie zmieniano rynku, klubów i napadów w osobne generatory wydarzeń. Nie dodano monetyzacji nowych mechanik.

Obecne sytuacje są krótkimi pętlami decyzja → późniejszy skutek, a nie wielorozdziałowymi questami. Taki zakres pozwala zweryfikować, czy gracze rozumieją zależność między decyzją, presją i kolejną umową, zanim powstanie większa liczba treści.

## Najlepszy następny etap

Największy wzrost jakości da **serwerowy dyrektor miasta**: mały kalendarz kilku wspólnych wydarzeń wpływających jednocześnie na rynek, kluby, operacje i kontakty w konkretnej dzielnicy. Powinien wykorzystywać obecne warunki i konsekwencje, pokazywać przyczynę każdej zmiany oraz zbierać telemetrię wyborów. Dzięki temu miasto będzie zmieniało plan dnia całej społeczności, bez dokładania pustych ekranów i kolejnych walut.
