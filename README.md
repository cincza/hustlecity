# Hustle City

Hustle City to projekt mobilnej gry online inspirowanej klasycznymi gangsterkami przegladarkowymi, ale budowany jako nowy produkt pod telefon.

## Co jest teraz w repo

- jedna aktywna wersja aplikacji; starego duplikatu `upload_bundle/` juz nie ma
- grywalny prototyp aplikacji Expo w [App.js](C:\Users\Adam\Documents\New project\App.js)
- dokument systemow gry w [docs/GAME_BLUEPRINT.md](C:\Users\Adam\Documents\New project\docs\GAME_BLUEPRINT.md)
- model ekonomii w [docs/ECONOMY_AND_BALANCE.md](C:\Users\Adam\Documents\New project\docs\ECONOMY_AND_BALANCE.md)
- architektura online w [docs/ONLINE_ARCHITECTURE.md](C:\Users\Adam\Documents\New project\docs\ONLINE_ARCHITECTURE.md)
- roadmap produkcyjny w [docs/ROADMAP.md](C:\Users\Adam\Documents\New project\docs\ROADMAP.md)
- szkic backendu w [backend](C:\Users\Adam\Documents\New project\backend)

Aktywna struktura:

- `backend/` - API, persystencja, logika serwera
- `src/` - ekrany, API klienta, hooki i uslugi frontendu
- `shared/` - wspolne modele, ekonomia i progresja
- `tools/` - smoke testy i skrypty pomocnicze

## Jedna sciezka pracy

Jedyny aktywny flow projektu jest teraz taki:

- `app.json` - tozsamosc aplikacji Expo i OTA
- `eas.json` - profile buildow Expo i produkcyjny URL backendu dla buildow
- `.env` - lokalny URL backendu dla frontendu podczas pracy developerskiej
- `backend/.env` - lokalny config API i persystencji
- `render.yaml` - produkcyjny deploy backendu na Render

To znaczy:

- lokalnie frontend bierze API z `.env`
- lokalnie backend bierze config z `backend/.env`, niezaleznie od katalogu startu
- buildy EAS biora produkcyjny backend z `eas.json`
- Render deployuje tylko `backend/`

## Frontend

1. W katalogu glownym uruchom `npm install`.
2. Skopiuj `.env.example` do `.env`.
3. Dla lokalnej pracy zostaw `EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:4000`.
4. Jesli testujesz na telefonie, zmien ten URL na adres LAN komputera albo na publiczny backend.
5. Uruchom `npm run web`, jesli chcesz sprawdzic projekt na komputerze.
6. Otworz `http://localhost:8090` w przegladarce.
7. Jesli chcesz Expo/telefon, uruchom `npm run start`.
8. Jesli chcesz telefon spoza lokalnej sieci albo bez zabawy z LAN, uruchom `npm run start:tunnel`.

Uwaga:

- frontend jest ustawiony na port `8090`, bo domyslny port Expo `8081` byl zajety przez inne procesy na tej maszynie
- jesli odpalasz `npm run start`, Metro rowniez wystartuje na `8090`
- publiczny backend ustawiasz przez `EXPO_PUBLIC_API_BASE_URL`, np. `https://hustle-city-api.onrender.com`, ale lokalny `.env.example` celowo startuje od `127.0.0.1`
- pod prywatne testy online patrz tez: [docs/PRIVATE_TESTS_DEPLOY.md](C:\Users\Adam\Documents\New project\docs\PRIVATE_TESTS_DEPLOY.md)
- pierwszy build Expo preview: [docs/EXPO_PREVIEW_FIRST_BUILD.md](C:\Users\Adam\Documents\New project\docs\EXPO_PREVIEW_FIRST_BUILD.md)
- pelny flow backend + APK dla testerow: [docs/RENDER_AND_EXPO_TESTER_FLOW.md](C:\Users\Adam\Documents\New project\docs\RENDER_AND_EXPO_TESTER_FLOW.md)
- stary skrot Android private test: [docs/ANDROID_PRIVATE_TEST.md](C:\Users\Adam\Documents\New project\docs\ANDROID_PRIVATE_TEST.md)

## Backend

1. Wejdz do `backend`.
2. Uruchom `npm install`.
3. Skopiuj `backend/.env.example` do `backend/.env`.
4. Wroc do root projektu.
5. Uruchom `npm run backend`.

Szybki lokalny start z root:

- terminal 1: `npm run backend`
- terminal 2: `npm run web`
- smoke test end-to-end: `npm run smoke`

Konta do testow API:

- login: `boss`
- haslo: `1234`

Wazne zmienne backendu:

- `PORT` - port procesu HTTP, uzywany na deployu przez Render / Railway
- `JWT_SECRET` - sekret do podpisywania tokenow
- `CORS_ORIGIN` - dozwolone originy frontendu, po przecinku
- `DATA_DIR` - katalog na pliki `users.db` i `global-chat.db`; w produkcji ustaw go na sciezke z persistent diskiem

Deploy backendu:

- `Render`: repo ma gotowy [render.yaml](C:\Users\Adam\Documents\New project\render.yaml)
- pierwszy czysty deploy krok po kroku: [docs/RENDER_FIRST_DEPLOY.md](C:\Users\Adam\Documents\New project\docs\RENDER_FIRST_DEPLOY.md)
- `Railway`: repo ma gotowy [railway.json](C:\Users\Adam\Documents\New project\railway.json), ustaw root directory na `backend`
- jesli chcesz zachowac konta i sejwy po redeployu, backend musi miec persistent disk / volume, bo `backend/data/users.db` jest plikiem lokalnym

Uwaga:

- frontend lokalnie bierze backend z `.env`, a buildy EAS z `eas.json`
- zeby ustawic inny backend lokalnie, zmien `EXPO_PUBLIC_API_BASE_URL` w `.env`
- backend zwraca teraz JSON rowniez dla nieistniejacych tras, wiec frontend nie powinien juz dostawac surowego `Cannot POST ...`
- userzy sa zapisywani do `DATA_DIR/users.db`; lokalnie przetrwa to restart procesu, ale na darmowym Render Web Service pliki sa efemeryczne i znikaja po restarcie / spin-downie

Smoke test:

- `npm run smoke` odpala lokalny backend na osobnym porcie, robi rejestracje, login, heist, chat, silownie, avatar, bezpieczny sync klienta, restart backendu i sprawdza, czy dane dalej istnieja

## Najblizszy cel

Budujemy teraz vertical slice online:

- auth
- profil
- napady
- bank
- rynek
- biznesy
- zapis postepu online
