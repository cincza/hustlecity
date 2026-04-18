# Hustle City

Hustle City to projekt mobilnej gry online inspirowanej klasycznymi gangsterkami przegladarkowymi, ale budowany jako nowy produkt pod telefon.

## Co jest teraz w repo

- grywalny prototyp aplikacji Expo w [App.js](C:\Users\Adam\Documents\New project\App.js)
- dokument systemow gry w [docs/GAME_BLUEPRINT.md](C:\Users\Adam\Documents\New project\docs\GAME_BLUEPRINT.md)
- model ekonomii w [docs/ECONOMY_AND_BALANCE.md](C:\Users\Adam\Documents\New project\docs\ECONOMY_AND_BALANCE.md)
- architektura online w [docs/ONLINE_ARCHITECTURE.md](C:\Users\Adam\Documents\New project\docs\ONLINE_ARCHITECTURE.md)
- roadmap produkcyjny w [docs/ROADMAP.md](C:\Users\Adam\Documents\New project\docs\ROADMAP.md)
- szkic backendu w [backend](C:\Users\Adam\Documents\New project\backend)

## Frontend

1. W katalogu glownym uruchom `npm install`.
2. Skopiuj `.env.example` do `.env` i ustaw `EXPO_PUBLIC_API_BASE_URL`, jesli laczysz sie z backendem spoza localhost.
2. Uruchom `npm run web`, jesli chcesz sprawdzic projekt na komputerze.
3. Otworz `http://localhost:8090` w przegladarce.
4. Jesli chcesz Expo/telefon, uruchom `npm run start`.
5. Jesli chcesz telefon spoza lokalnej sieci albo bez zabawy z LAN, uruchom `npm run start:tunnel`.

Uwaga:

- frontend jest ustawiony na port `8090`, bo domyslny port Expo `8081` byl zajety przez inne procesy na tej maszynie
- jesli odpalasz `npm run start`, Metro rowniez wystartuje na `8090`
- publiczny backend ustawiasz przez `EXPO_PUBLIC_API_BASE_URL`, np. `https://hustle-city-api.onrender.com`
- pod prywatne testy online patrz tez: [docs/PRIVATE_TESTS_DEPLOY.md](C:\Users\Adam\Documents\New project\docs\PRIVATE_TESTS_DEPLOY.md)
- szybki build Android dla 2-3 testerow: [docs/ANDROID_PRIVATE_TEST.md](C:\Users\Adam\Documents\New project\docs\ANDROID_PRIVATE_TEST.md)

## Backend

1. Wejdz do `backend`.
2. Uruchom `npm install`.
3. Skopiuj `.env.example` do `.env`.
4. Uruchom `npm run dev`.

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
- `Railway`: repo ma gotowy [railway.json](C:\Users\Adam\Documents\New project\railway.json), ustaw root directory na `backend`
- jesli chcesz zachowac konta i sejwy po redeployu, backend musi miec persistent disk / volume, bo `backend/data/users.db` jest plikiem lokalnym

Uwaga:

- frontend domyslnie celuje w `https://hustle-city-api.onrender.com`; lokalny backend ustawiasz przez `EXPO_PUBLIC_API_BASE_URL`
- zeby ustawic inny backend, ustaw `EXPO_PUBLIC_API_BASE_URL`
- backend zwraca teraz JSON rowniez dla nieistniejacych tras, wiec frontend nie powinien juz dostawac surowego `Cannot POST ...`
- userzy sa zapisywani do `DATA_DIR/users.db`; lokalnie przetrwa to restart procesu, ale na darmowym Render Web Service pliki sa efemeryczne i znikaja po restarcie / spin-downie

Smoke test:

- `node tools/smoke-test.mjs` odpala lokalny backend na osobnym porcie, robi rejestracje, login, heist, chat, silownie, avatar, bezpieczny sync klienta, restart backendu i sprawdza, czy dane dalej istnieja

## Najblizszy cel

Budujemy teraz vertical slice online:

- auth
- profil
- napady
- bank
- rynek
- biznesy
- zapis postepu online
