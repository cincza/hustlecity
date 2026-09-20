# HUSTLE CITY — osobiste konsekwencje i rywale

Data zamknięcia etapu: 2026-09-19

## 1. Pamięć rywali

Gracz ma najwyżej jeden aktywny konflikt. Rekord przechowuje rywala, dzielnicę, dokładną przyczynę, źródłowy identyfikator zdarzenia, poprzedni wynik, poziom eskalacji, zignorowanie ostrzeżenia, wybraną klasę, gang oraz klucz wydarzenia z chwili powstania. Zamknięte konflikty trafiają do krótkiej historii. Źródła są zapamiętywane osobno, więc jedno zdarzenie nie może ponownie wygenerować rywala.

## 2. Źródła konfliktu

Konflikt może powstać po częściowym lub nieudanym finale dużej operacji, agresywnym rozwiązaniu dużej operacji przy wysokim Heat, bardzo wysokim Heat po operacji, agresywnym wykorzystaniu sytuacji kontaktu (`sell`, `hype`, `skim`) albo problematycznej pilnej umowie. System nie losuje przeciwnika bez przyczyny i nie tworzy konfliktu po każdej akcji.

## 3. Archetypy

- Ivo Varga w Old Town: ekonomiczny rywal i księgowy starego układu; blokuje legalne przykrywki.
- Mara Voss w Neonie: właścicielka zamkniętych klubów; używa ochrony, list gości i dostępu do nocnych lokali.
- Żelazne Psy w Harbor: brutalna ekipa przemytników; naciska na trasy, rampy i ładunki.

## 4. Krótki łańcuch

Źródłowe zdarzenie tworzy ostrzeżenie. Pierwsza odpowiedź może zakończyć konflikt albo świadomie przenieść go do finału. Brak reakcji przez 12 godzin oznacza zignorowanie i automatyczną eskalację. Finał zawsze kończy aktywny konflikt wynikiem zapisanym w historii. Łańcuch ma dwa kroki decyzyjne i nie zamienia się w kampanię.

## 5. Eskalacja i wygaszanie

Przy niskim Heat gracz może zejść z radaru. Może też zapłacić, użyć kontaktu, drogi klasy albo przejść do konfrontacji. Finał oferuje ustępstwo, mediację, rozwiązanie klasowe, kontrakcję oraz — jeśli warunki zostały zachowane — gang. Zignorowanie, konfrontacja i rozwiązania siłowe zwiększają Heat lub presję; spokojne rozwiązania je obniżają.

## 6. Klasy

- Biznesmen używa środków bankowych i legalnych dokumentów.
- Diler oddaje kontrolowaną partię własnej produkcji.
- Hustler rozlicza konflikt spirytusem i pośrednikami.
- Król nocy organizuje neutralne spotkanie za gotówkę i energię.
- Egzekutor ryzykuje HP, przyspiesza finał i dostaje własny wariant konfrontacji.

Klasa jest zapisywana przy narodzinach konfliktu. Późniejsza zmiana nie podmienia dostępnej drogi.

## 7. Kontakty

System korzysta z istniejącego zaufania dzielnicowego. Mediacja zużywa dwa punkty na etapie ostrzeżenia lub trzy w finale. Nie powstała druga relacja ani nowa reputacja.

## 8. Gangi

Pomoc gangu jest dostępna tylko wtedy, gdy gracz należał do tej ekipy przy powstaniu konfliktu, a dla przygotowania kontrakcji gang musiał skupiać się na właściwej dzielnicy. W momencie użycia gracz nadal musi należeć do tego samego gangu. Pomoc kosztuje gotówkę lub energię oraz podnosi presję i Heat.

## 9. Operacje i tablica planów

Aktywny rywal w dzielnicy zwiększa koszt przygotowania operacji o 10% na etapie ostrzeżenia lub 18% w finale, zmniejsza szansę o 3 albo 6 punktów procentowych i dokłada 2 albo 4 Heat. Wpływ jest zapisywany przy starcie operacji, więc późniejsze zamknięcie konfliktu nie zmienia rozpoczętego planu. Aktywny konflikt może pojawić się na miejskiej tablicy planów, ale konkuruje z innymi kierunkami i nie zastępuje całej tablicy.

## 10. Konsekwencje finału

Możliwy wynik to rozejm po zejściu z radaru, opłacony spokój, mediacja, rozwiązanie klasowe, ustępstwo, zwycięstwo gangu, złamanie nacisku rywala albo kosztowne przetrwanie. Efekty używają gotówki, banku, towaru, energii, HP, Heat, presji, wpływu, zaufania, XP i respektu. Nie ma nowej waluty. Finały nie wypłacają dużej gotówki — główną nagrodą jest odzyskanie swobody działania.

## 11. Zabezpieczenia

- źródłowy klucz blokuje ponowne utworzenie tego samego konfliktu;
- jeden aktywny konflikt zapobiega spamowi i kolejce rywali;
- zmiana klasy, gangu, dzielnicy fokusu oraz wygaśnięcie wydarzenia nie zmieniają snapshotu;
- każda opcja ponownie sprawdza aktualne zasoby;
- ostrzeżenie po terminie jest rozliczane jako finał również przy starym kliencie;
- zamknięty konflikt znika przed ponownym rozliczeniem;
- `/rivals/respond` korzysta z blokady gracza, transakcji SQLite, revision check i idempotency receipt;
- premium nie jest czytane ani wydawane przez system;
- historia i lista źródeł mają limity rozmiaru.

## 12. Testy

Testy jednostkowe obejmują przyczynę i deduplikację, snapshot klasy i gangu, walidację kosztów, ignorowanie ostrzeżenia, dwuetapową konfrontację, pojedynczy finał, kontakt jako źródło, modyfikator operacji, tablicę planów, brak wpływu premium oraz serializację. Test API uruchamia odizolowany backend, zapisuje konflikt w SQLite, restartuje serwer, rozlicza finał, restartuje ponownie i potwierdza idempotentne odtworzenie bez drugiego kosztu.

## 13. Świadomie pominięte

Nie powstały frakcje, osobna reputacja rywali, mapa wpływów NPC, dyplomacja, terytoria przeciwników, kampania fabularna, nowa policja, waluta, sklep, premium boost, APK, deployment ani pełny balance pass. Nie dodano dziesiątek losowych NPC.

## 14. Następny etap jakości

Największy kolejny wzrost jakości da warstwa prezentacji i reżyserii: krótkie wejścia rywali z portretem, charakterystycznym językiem, dźwiękiem oraz widoczną zmianą sceny dzielnicy. Mechanika pamięci już istnieje; następny etap powinien sprawić, żeby gracz emocjonalnie rozpoznawał Vargę, Marę i Żelazne Psy bez rozbudowy systemowej.
