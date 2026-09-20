# Backend

Minimalny backend pod prywatne testy online dla `Hustle City`.

## Co dziala teraz

- Express API
- `POST /auth/register`
- `POST /auth/login`
- middleware auth na waznych endpointach
- JWT
- hashowanie hasel przez `bcryptjs`
- zapis kont i stanu graczy do `DATA_DIR/game.sqlite`, atomowe rozliczenia kilku kont i trwałe potwierdzenia wybranych operacji
- profile, market, bank, kasyno, heisty
- `GET /health`

## Jak uruchomic lokalnie

Wymagany Node.js **24.15.0 lub nowsze 24.x**. Przy pierwszym starcie konta są importowane z `users.db` bez zmiany oryginału. Przed migracją istniejącego środowiska zatrzymaj backend i wykonaj kopię całego `DATA_DIR`. Szczegóły migracji, kopii i ograniczeń: `docs/TRANSAKCJE_2026-09-09.md` w głównym katalogu projektu.

1. Skopiuj [backend/.env.example](C:\Users\Adam\Documents\New project\backend\.env.example) do `backend/.env`
2. Ustaw `JWT_SECRET`
3. Uruchom:

```powershell
cd "C:\Users\Adam\Documents\New project\backend"
npm install
npm run dev
```

## Deploy

- `Render`: gotowy [render.yaml](C:\Users\Adam\Documents\New project\render.yaml)
- `Railway`: gotowy [railway.json](C:\Users\Adam\Documents\New project\railway.json), ustaw root directory na `backend`
- Podepnij trwały dysk dla całego `DATA_DIR`, obejmujący bazę SQLite, WAL, stan świata i czaty.
- pelny krok po kroku: [docs/PRIVATE_TESTS_DEPLOY.md](C:\Users\Adam\Documents\New project\docs\PRIVATE_TESTS_DEPLOY.md)

## Wazne env

- `PORT`
- `JWT_SECRET`
- `CORS_ORIGIN`

## Administrator

Nie ma domyślnego konta z publicznym hasłem. `ADMIN_BOOTSTRAP_PASSWORD` opcjonalnie tworzy zarezerwowanego administratora lub przywraca zablokowane stare konto. Ustaw unikalne hasło: minimum 12 znaków, maksimum 72 bajty UTF-8. Bez tej zmiennej serwer nie tworzy administratora.
