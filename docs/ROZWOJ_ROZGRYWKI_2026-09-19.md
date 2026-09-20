# HUSTLE CITY — profesje, kontakty i ekonomia

Zmiany lokalne, bez commitu i publikacji. Wszystkie próby zapisu wykonano na oddzielnych bazach testowych. Nie zmieniano danych istniejącego lokalnego serwera ani produkcji.

## Punkt wyjścia i diagnoza

Gra miała już sześć rozdziałów kariery, napady, wieloetapowe operacje z warunkami dzielnic, produkcję, handel, kluby oraz rozbudowane gangi: projekty, skarbiec, role, wspólne napady i zadania tygodniowe. Nie wymagały zastąpienia. Rozliczenia rynku, dealera, banku i szeregu innych akcji były już transakcyjne i odporne na ponowienia.

Brakowało wyboru profesji i połączenia jej z decyzjami gospodarczymi. Istniejące `premiumTokens` nie tworzyły kompletnego przepływu zarabiania i wydawania waluty. Osobisty Heat nie wygasał między sesjami. Biznesy miały podobny bazowy zwrot około 40 godzin, a kolejne egzemplarze kosztowały tyle samo; dodatkowo jednorazowo opłacone ulepszenie podnosiło dochód całej rosnącej sieci. Tani bar można było kopiować bez gospodarczej zachęty do dywersyfikacji.

## Co zostało wdrożone

### Profesja i pierwszy kontakt

Pierwsze wejście po zalogowaniu prowadzi do wyboru jednej z pięciu profesji. Dotyczy także wcześniejszych kont bez wybranego archetypu, ale zachowuje ich pieniądze, statystyki, gang, wyposażenie i cały postęp. Po wyborze otwiera się ekran kontaktów. Start gry nadal prowadzi też przez dotychczasowe cztery misje wprowadzające.

| Profesja | Sposób działania na poziomie 1 | Zwykły Heat |
| --- | --- | --- |
| Biznesmen | $300 przygotowania, 1 EN, $430 wypłaty, 3 XP | −4 |
| Diler | 8 fajek z rynku **albo** 3 fajki z własnej produkcji, 2 EN, $420, 6 XP | +4 |
| Hustler | 5 spirytusów z rynku, 2 EN, $450, 6 XP | +2 |
| Król nocy | $150 przygotowania, 2 EN, $350, 6 XP | −2 |
| Egzekutor | 3 EN i 8 HP, $350, 9 XP | +8 |

Wypłata jest kwotą brutto: materiały i przygotowanie trzeba odliczyć. Ceny zakupionego towaru pozostają cenami istniejącego rynku. Żadna profesja nie zamyka głównych systemów gry.

Po 6, 12, 18 i 24 udanych zleceniach można bezpłatnie poznać kolejny wybrany kontakt. Jego metoda jest odtąd dostępna bez płatnej zmiany klasy. To rozwój repertuaru decyzji, nie pięć trwałych premii procentowych. Zmiana głównej profesji kosztuje 3 żetony i jest możliwa tylko w obrębie wypracowanych kontaktów; nie daje dodatkowych prób, zasobów ani resetu postępu. W późniejszej grze profesje mogą zatem zbliżyć się zakresem możliwości — nie są pięcioma odrębnymi kampaniami.

### Zlecenia, miasto i ryzyko

Każda z trzech istniejących dzielnic udostępnia jedną umowę na sześciogodzinne okno. Próba zużywa dostęp niezależnie od wyniku i wybranej profesji. Stare okno jest odrzucane przez serwer. Warunki korzystają z istniejącego harmonogramu operacji: dzień wypłat podnosi wypłatę o 15%, kontrole zwiększają ryzyko pilnych dostaw i Heat głośnych metod.

Zwykła umowa ma gwarantowaną wypłatę przy spełnieniu warunków. Wariant pilny daje 50% większą wypłatę i dodatkowe 10 Heat, ale może zostać przechwycony: wtedy przepadają koszty, towar i próba. Szansa uwzględnia osobisty Heat, warunki oraz istniejącą presję dzielnicy; klient nie ustala nagrody ani wyniku.

Blokada dzielnicy zmienia dostępne decyzje: zwykłe głośne dostawy są niedostępne, pozostaje dyskretna metoda Biznesmena/Króla nocy albo ryzykowny transport pilny. Udane zlecenia rozwijają wpływ; spokojne metody obniżają presję, głośne zostawiają ślad. Osobisty Heat wygasa o 1 punkt na 15 minut, z zachowaniem niepełnego interwału. Wielokrotne odświeżanie niczego nie przyspiesza. Stare konto nie dostaje wstecznego wyzerowania Heat.

Po 9 zleceniach i 5 RES dostępny jest drugi poziom kontaktu; po 24 i 15 RES trzeci. Potrzebne jest odpowiednie zaplecze: biznes, fabryka, klub, 25 sprzedanych towarów lub ukończona operacja. Zwiększa się skala umowy. Diler może faktycznie dostarczać własną produkcję; magazyn zakupionych narkotyków pozostaje oddzielny. Podpowiedzi na ekranie Start pokazują dostępne kontakty i gotowe nagrody.

### Jedna waluta i prestiż

Wykorzystano istniejące żetony `premiumTokens`. Dziewięć udanych umów w tygodniu daje 2 żetony, raz na tydzień. Pierwsza sieć kontaktów daje 3; dalsze cele 4, 6 i 10. Żetony opłacają zmianę wypracowanej profesji oraz trzy warianty wizytówki za 2/4/6 żetonów. Posiadana wizytówka może być wybierana ponownie bez opłaty. Tytuł zdobytego celu i wariant wizytówki pojawiają się na ekranie kontaktów.

**Prawdziwy zakup żetonów za pieniądze nie jest uruchomiony.** Nie dodano pozornego zakupu ani endpointu ufającego deklaracji klienta o zapłacie. Do uruchomienia płatności pozostaje wybór operatora i weryfikacja płatności/paragonów po stronie serwera. Zgodnie z priorytetem tego etapu nie wykonywano integracji sklepów ani publikacji.

Nie ma sprzedaży energii, siły, XP, gotówki, lepszego lootu czy statystyk gangu. Zapłata nie odblokowuje niewypracowanej profesji.

### Gangi i cele dalszej gry

Do istniejącej tablicy gangu dochodzi „Sieć kontaktów”: 9 udanych umów członków w dzielnicy gangu daje jednorazowo $1800 do wspólnego skarbca oraz istniejące efekty wpływu i odciążenia dzielnicy. Aktualizacja dodaje nowe zadanie bez resetowania trwającego tygodnia. Zapis członków, postępu, nagrody i potwierdzenia operacji używa wspólnej transakcji.

Zachowano wymagania założenia gangu: 15 RES i $250 000. Już stanowią etap progresji. Nie dodano premium jako obowiązkowej bramki ani drugiego systemu gildii.

Nowe cele prestiżowe wymagają różnych aktywności, nie samego salda:

- Pierwszy krąg: po 3 udane umowy w każdej dzielnicy.
- Patron dzielnicy: 24 umowy, 2 różne biznesy, 1 operacja i fundusz $100 000.
- Mecenas miasta: 60 umów, kontakty w trzech dzielnicach, fabryka, 3 operacje i $1 000 000.
- Legenda miasta: 150 umów, 5 poznanych profesji, 5 różnych biznesów, 3 fabryki, 10 operacji i $10 000 000.

Fundusze są rzeczywistym wydatkiem. Dają tytuły i żetony, bez przewagi bojowej. Rozbudowują motywację wokół istniejących operacji; nie zastępują ich nową kampanią fabularną.

## Balans i symulacja

`node tools/simulate-progression.mjs` porównuje stare reguły, nowe reguły i pięć profesji. Eksportowana funkcja pozwala zmieniać ziarno, liczbę dni oraz strategię inwestowania (`bars`/`diverse`). Model używa wspólnych definicji napadów, szans, XP, kontaktów i biznesów.

Założenia: trzy krótkie sesje dziennie; pula 20 energii odnowionej i 15 z posiłków na sesję; wykonany start kariery; odnawianie zdrowia między sesjami; zakup materiałów po cenie modelowej. **To model czułości, nie symulacja całej gry.** Pomija czas odsiadek, przerwy na leczenie, braki towaru, zaawansowane zadania i zyski fabryk/klubów. Nie zastępuje obserwacji prawdziwej rozgrywki. Wszystkie dane są obiektami w pamięci.

W próbce 100 ziaren na wariant mediana to 3 RES po pierwszym dniu; po tygodniu około 9 RES dla każdej profesji i 7 RES bez kontaktów. Próg 8 RES dla pierwszej fabryki wypada w modelu profesji około 15–17 sesji. Dostępne środki zależą od inwestycji; nie jest to obietnica dojścia do każdego zakupu w konkretnym dniu.

W referencyjnym przebiegu stara strategia kopiowania baru kończyła tydzień z 59 barami. Nowa z 7. Kolejny egzemplarz kosztuje `cena bazowa × (1 + 0,5 × już posiadana liczba)`: pierwszy bar $12 000, drugi $18 000, trzeci $24 000. Dochód dotychczasowych lokali pozostaje taki sam. Koszt przyszłego ulepszenia jest mnożony przez liczbę lokali, które obejmuje.

W tym samym przebiegu Biznesmen reinwestujący tylko w bary kończy z dochodem $2100/h; wybierający dostępny korzystniejszy typ biznesu z $3900/h i dwoma typami lokali. To mierzalna zachęta do innej inwestycji. Nie zmieniano w ciemno całej krzywej XP, treningu, limitów fabryk ani ekonomii kasyna. Ich globalna równowaga wymaga pełniejszego modelu niż zastosowany tutaj.

## Weryfikacja i ograniczenia

Wynik końcowy: **68/68 testów**, pełny smoke z restartem zakończony powodzeniem, **112 plików JS/JSX bez błędów składni**, eksport web i Android poprawny, `git diff --check` bez błędów. Zestaw obejmuje wcześniejsze regresje oraz nowe scenariusze. Nie wykonano commitu.

Dodano testy profesji, obu magazynów dostaw, ryzyka, blokady dzielnicy, nauki metod, kosztów sieci biznesowej, zaniku Heat, nagród tygodniowych i celów późnej gry. Test błędu SQLite sprawdza rollback żetonów wraz z potwierdzeniem operacji. Próby API obejmują ponowienia i restart z zachowaniem klasy oraz wykonanej umowy. Pełny smoke obejmuje też współpracę kontaktów z gangiem.

Sprawdzono interfejs na wąskiej stronie przeglądarki: logowanie, wybór klasy, automatyczne przejście do kontaktów, wypłatę, XP, blokadę powtórzenia oraz zachowanie postępu po restarcie serwera. Eksport web i Android przechodzi. Nie wykonywano testów na fizycznym telefonie.

Największa pozostała luka do skończonej gry to **treść długiej kampanii i konsekwencje decyzji**: obecne metody są różnymi rozliczeniami umów, a cele prestiżowe nie są rozbudowanymi historiami kontaktów. Kolejny etap powinien rozwijać kilka istniejących kontaktów w autorskie łańcuchy sytuacji i operacji, z decyzjami wpływającymi na kolejne zadania. Równolegle potrzebny jest pełniejszy model ekonomii produkcji, klubów i aktywności gangów oraz testy dłuższych sesji z graczami. Sama większa liczba przycisków lub droższe tytuły nie domkną tej luki.
