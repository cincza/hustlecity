# Hustle City

Hustle City to projekt mobilnej gry online inspirowanej klasycznymi gangsterkami przegladarkowymi, ale budowany jako nowy produkt pod telefon.

## Co jest teraz w repo

- jedna aktywna wersja aplikacji; starego duplikatu `upload_bundle/` juz nie ma
- grywalna aplikacja Expo w [App.js](App.js)
- dokument systemów gry w [docs/GAME_BLUEPRINT.md](docs/GAME_BLUEPRINT.md)
- model ekonomii w [docs/ECONOMY_AND_BALANCE.md](docs/ECONOMY_AND_BALANCE.md)
- architektura online w [docs/ONLINE_ARCHITECTURE.md](docs/ONLINE_ARCHITECTURE.md)
- roadmap produkcyjny w [docs/ROADMAP.md](docs/ROADMAP.md)
- backend gry w [backend](backend)

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
- `render.yaml` - produkcyjny deploy API i webowej wersji gry na Render

To znaczy:

- lokalnie frontend bierze API z `.env`
- lokalnie backend bierze config z `backend/.env`, niezaleznie od katalogu startu
- buildy EAS biora produkcyjny backend z `eas.json`
- Render buduje API z `backend/` oraz frontend Expo Web z katalogu głównego

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
- pod prywatne testy online patrz też: [docs/PRIVATE_TESTS_DEPLOY.md](docs/PRIVATE_TESTS_DEPLOY.md)
- pierwszy build Expo preview: [docs/EXPO_PREVIEW_FIRST_BUILD.md](docs/EXPO_PREVIEW_FIRST_BUILD.md)
- pełny flow backend + APK dla testerów: [docs/RENDER_AND_EXPO_TESTER_FLOW.md](docs/RENDER_AND_EXPO_TESTER_FLOW.md)
- skrót Android private test: [docs/ANDROID_PRIVATE_TEST.md](docs/ANDROID_PRIVATE_TEST.md)

## Backend

Wymagany Node.js **24.15.0–24.x**. Konta zapisują się w `DATA_DIR/game.sqlite`; przy pierwszym starcie następuje jednorazowy import istniejącego `users.db`. Procedura kopii i migracji: `docs/TRANSAKCJE_2026-09-09.md`.

1. Wejdz do `backend`.
2. Uruchom `npm install`.
3. Skopiuj `backend/.env.example` do `backend/.env`.
4. Wroc do root projektu.
5. Uruchom `npm run backend`.

Szybki lokalny start z root:

- terminal 1: `npm run backend`
- terminal 2: `npm run web`
- smoke test end-to-end: `npm run smoke`

Konta do testów API twórz przez rejestrację. Nie ma domyślnego konta z publicznym hasłem. Opcjonalny `ADMIN_BOOTSTRAP_PASSWORD` służy do utworzenia zarezerwowanego administratora lub przywrócenia zablokowanego starego konta; wymaga unikalnego hasła o długości co najmniej 12 znaków (maksymalnie 72 bajty UTF-8).

Wazne zmienne backendu:

- `PORT` - port procesu HTTP, uzywany na deployu przez Render / Railway
- `JWT_SECRET` - sekret do podpisywania tokenow
- `CORS_ORIGIN` - dozwolone originy frontendu, po przecinku
- `DATA_DIR` - katalog na `game.sqlite`, jego pliki WAL, stan świata i czaty; w produkcji ustaw go na trwały dysk i wykonuj kopie całego katalogu

Deploy online:

- `Render`: [render.yaml](render.yaml) tworzy `hustle-city-api` i publiczny frontend `hustle-city-web`
- pierwszy deploy krok po kroku: [docs/RENDER_FIRST_DEPLOY.md](docs/RENDER_FIRST_DEPLOY.md)
- `Railway`: repo ma też [railway.json](railway.json); ustaw root directory na `backend`
- konta i sejwy API trafiają na persistent disk do `DATA_DIR/game.sqlite`

Uwaga:

- frontend lokalnie bierze backend z `.env`, a buildy EAS z `eas.json`
- zeby ustawic inny backend lokalnie, zmien `EXPO_PUBLIC_API_BASE_URL` w `.env`
- backend zwraca teraz JSON rowniez dla nieistniejacych tras, wiec frontend nie powinien juz dostawac surowego `Cannot POST ...`
- dane graczy są zapisywane w `DATA_DIR/game.sqlite`; produkcyjny serwis API używa dysku `/var/data`

Smoke test:

- `npm run smoke` odpala lokalny backend na osobnym porcie, robi rejestracje, login, heist, chat, silownie, avatar, bezpieczny sync klienta, restart backendu i sprawdza, czy dane dalej istnieja

## Publiczne adresy Render

- gra: `https://hustle-city-web.onrender.com`
- API i health check: `https://hustle-city-api.onrender.com/health`
