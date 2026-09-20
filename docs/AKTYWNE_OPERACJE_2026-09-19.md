# HUSTLE CITY — aktywne operacje

Data zamknięcia etapu: 2026-09-19

## 1. Stan przed zmianą

Operacje miały dobry katalog, pięć etapów przygotowań, wymagania infrastruktury, koszty, dzielnice, Heat, gangowe projekty i trwały postęp. Największą luką był finał: po przygotowaniach pojedyncze wywołanie serwera natychmiast losowało sukces lub porażkę. Gracz nie reagował na rozwój akcji, a zmiana klasy, gangu lub aktywnego wydarzenia przed finałem mogła zmienić wynik planu.

## 2. Nowy zamknięty cykl

Małe i średnie operacje zachowały szybkie rozliczenie. Cztery duże cele (`syndicate-ledger`, `neon-reserve`, `harbor-convoy`, `city-vault`) działają teraz jako: okazja → pięć przygotowań → wejście → zapisana komplikacja → decyzja → pełny sukces, częściowy sukces, porażka albo taktyczny odwrót → konsekwencje.

## 3. Typy akcji

- szybkie skoki pozostają krótkim ruchem sesyjnym;
- średnie operacje korzystają z przygotowań i natychmiastowego finału;
- duże operacje mają dodatkową fazę kryzysu i osobną decyzję gracza.

## 4. Przygotowania

Pozostało pięć czytelnych etapów: rozpoznanie, wejście, sprzęt, ekipa i odwrót. Każdy wybór wydaje zasób dokładnie raz i wpływa na szansę, przeciek, Heat albo utrzymanie łupu. Biznes, fabryka, narzędzie i auto otwierają alternatywy, lecz nie blokują całej operacji.

## 5. Podejścia w komplikacji

- dociśnięcie planu: brak nowego kosztu, większy potencjał łupu i większy ślad;
- opłacenie wyjścia: gotówka za bezpieczeństwo i niższą marżę;
- kontakt dzielnicy: dwa punkty zaufania za oczyszczenie śladu;
- droga klasy: inny zasób i inna konsekwencja dla każdej profesji;
- ekipa gangu: płatna osłona, bez podnoszenia maksymalnego łupu;
- taktyczny odwrót: brak postępu i nagrody, zwrot 12% bazowego kosztu przygotowania.

## 6. Klasy

- Biznesmen korzysta ze środków bankowych i legalnego frontu.
- Diler zużywa własny towar z produkcji, żeby stworzyć drugą trasę.
- Hustler płaci spirytusem w barterze.
- Król nocy zużywa dodatkową energię, by ukryć ekipę w nocnym ruchu.
- Egzekutor ryzykuje HP, Heat i przeciek, zachowując mocniejsze wejście oraz większą część łupu.

Klasa jest zapisywana przy rozpoczęciu operacji. Późniejsza zmiana klasy nie podmienia dostępnej drogi w trwającym planie.

## 7. Kontakty i gang

Kontakt wykorzystuje istniejące zaufanie dzielnicowe i realnie je zużywa. Gang daje opcjonalną osłonę tylko wtedy, gdy przy starcie należał do gracza i skupiał się na tej dzielnicy. Przy rozliczeniu gracz musi nadal należeć do tej samej ekipy. Pomoc kosztuje gotówkę, więc gang nie tworzy darmowego mnożnika zysku.

## 8. Komplikacje

Old Town dostaje ślad w księgach, Neon świadka na zapleczu, Harbor zamknięty punkt kontroli, a Skarbiec miasta alarm międzydzielnicowy. Komplikacja zapisuje nazwę, opis, czas wejścia i parametry ryzyka. Restart aplikacji nie generuje nowej sytuacji.

## 9. Konsekwencje

Pełny sukces daje łup, XP, postęp celu, statystykę ukończeń, Heat i wpływ na dzielnicę. Częściowy sukces daje 42% wariantu łupu, około 45% zwykłego XP, obrażenia i Heat, ale nie odblokowuje kolejnego celu. Porażka zabiera gotówkę i HP, może uruchomić intensywną terapię lub więzienie. Odwrót chroni przed pełną katastrofą, ale nie daje XP ani postępu.

## 10. Miasto i plan sesji

Warunki wydarzenia miasta, klasa i efekty projektów gangu są zamrażane przy rozpoczęciu operacji. Bieżące Heat, presja oraz wpływy kształtują wejście. Aktywna duża operacja staje się najwyższym priorytetem miejskiej tablicy planów; tablica rozpoznaje sukces, częściowy wynik, porażkę i odwrót z historii konkretnego uruchomienia.

## 11. Ochrona przed exploitami

- energia finału jest pobierana przed komplikacją i tylko raz;
- ponowne `execute` w fazie komplikacji jest odrzucane;
- odpowiedź ma osobny transakcyjny endpoint z idempotency key;
- po rozliczeniu aktywny rekord znika, więc nagrody nie da się odebrać ponownie;
- koszty odpowiedzi są sprawdzane ponownie w chwili rozliczenia;
- zmiana klasy, gangu i wygaśnięcie wydarzenia nie rerollują zapisanego kontekstu;
- porzucenie planu nie zwraca przygotowań ani energii;
- trwały postęp jest przyznawany wyłącznie za pełny sukces;
- SQLite, revision check, action lock i transakcyjny receipt obejmują również `/operations/resolve`.

## 12. Weryfikacja

- `npm run check`: 129 plików JS/JSX, 0 błędów;
- `npm test`: 99/99 testów;
- `npm run smoke`: pełny smoke API, SQLite i restarty, kod wyjścia 0;
- testy nowego systemu obejmują persystencję komplikacji, pojedyncze zużycie energii, brak rerolla, snapshot klasy i gangu, ponowną walidację kosztów, pełny i częściowy wynik, double claim, odwrót, transakcyjność endpointu oraz integrację tablicy planów;
- frontend i backend odpowiadają lokalnie na portach 8090 i 4000.

Krótka symulacja reprezentatywnej postaci wykazała dla dobrze przygotowanych dużych operacji około 63–84% pełnego sukcesu zależnie od celu i reakcji. Okno częściowego sukcesu ograniczono tak, aby nawet mocny plan zachowywał co najmniej 10% ryzyka pełnej porażki. Wariant agresywny ma wyższą wartość oczekiwaną, a wariant opłacony redukuje ryzyko kosztem marży.

## 13. Świadomie pominięte

Nie dodano nowej waluty, frakcji, reputacji, osobnej policji, wieloosobowego lobby operacji, nowych sklepów, premium boostów, APK, hostingu ani pełnego endgame balance pass. Nie przebudowano szybkich skoków, ponieważ ich krótki rytm jest potrzebny jako kontrast dla dużych planów.

## 14. Następny wzrost frajdy

Kolejny etap powinien skupić się na grywalnych kontratakach i rywalach miasta: zapamiętywani przeciwnicy, którzy reagują na wyniki operacji i wracają w krótkich łańcuchach 2–3 decyzji. Powinni korzystać z obecnych dzielnic, Heat, kontaktów i gangu, bez dokładania nowej gospodarki. To nada konsekwencjom twarz i stworzy historie, które gracz pamięta po zamknięciu operacji.
