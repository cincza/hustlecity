# Backend

Minimalny backend pod prywatne testy online dla `Hustle City`.

## Co dziala teraz

- Express API
- `POST /auth/register`
- `POST /auth/login`
- middleware auth na waznych endpointach
- JWT
- hashowanie hasel przez `bcryptjs`
- zapis userow i stanu gracza do `backend/data/users.db`
- profile, market, bank, kasyno, heisty
- `GET /health`

## Jak uruchomic lokalnie

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
- jesli chcesz zachowac konta i stan po restarcie hostingu, podepnij persistent disk / volume dla `backend/data/users.db`
- pelny krok po kroku: [docs/PRIVATE_TESTS_DEPLOY.md](C:\Users\Adam\Documents\New project\docs\PRIVATE_TESTS_DEPLOY.md)

## Wazne env

- `PORT`
- `JWT_SECRET`
- `CORS_ORIGIN`

## Seed

- login: `boss`
- haslo: `1234`
