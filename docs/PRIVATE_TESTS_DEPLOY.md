# Private Online Tests

Ten projekt jest przygotowany do pierwszych prywatnych testow online z kilkoma znajomymi bez zmiany mechanik gry.

## 1. Backend deploy na Render

Repo ma gotowy plik [render.yaml](C:\Users\Adam\Documents\New project\render.yaml).

### Kroki

1. Wrzuc repo na GitHub.
2. Zaloguj sie do Render.
3. Kliknij `New +` -> `Blueprint`.
4. Wybierz repo z projektem.
5. Render wykryje [render.yaml](C:\Users\Adam\Documents\New project\render.yaml).
6. Ustaw sekrety:
   - `JWT_SECRET`
   - `CORS_ORIGIN`
7. Deploy.
8. Po deployu sprawdz:
   - `https://twoj-backend.onrender.com/health`

### Wazne env

- `JWT_SECRET=jakis-dlugi-losowy-sekret`
- `CORS_ORIGIN=http://localhost:8090,https://twoj-frontend-url`

## 2. Backend deploy na Railway

Repo ma gotowy plik [railway.json](C:\Users\Adam\Documents\New project\railway.json).

### Kroki

1. Zaloguj sie do Railway.
2. Kliknij `New Project` -> `Deploy from GitHub repo`.
3. Wybierz repo.
4. Ustaw `Root Directory` na `backend`.
5. Ustaw env:
   - `JWT_SECRET`
   - `CORS_ORIGIN`
6. Deploy.
7. Sprawdz:
   - `https://twoj-backend.up.railway.app/health`

## 3. Publiczny API URL dla frontendu

Frontend korzysta z:

- [C:\Users\Adam\Documents\New project\src\constants\env.js](C:\Users\Adam\Documents\New project\src\constants\env.js)

W katalogu glownym ustaw `.env` na podstawie [C:\Users\Adam\Documents\New project\.env.example](C:\Users\Adam\Documents\New project\.env.example):

```env
EXPO_PUBLIC_API_BASE_URL=https://twoj-backend.onrender.com
```

To jest URL, ktory frontend ma uzywac zarowno na komputerze, jak i na telefonie.

## 4. Test na telefonie

Najprostsza droga na pierwsze testy:

1. Ustaw `EXPO_PUBLIC_API_BASE_URL` na publiczny backend.
2. W katalogu glownym uruchom:

```powershell
npm install
npm run start:tunnel
```

3. Otworz `Expo Go` na telefonie.
4. Zeskanuj QR.
5. Zarejestruj nowe konto albo zaloguj sie seedem:
   - login: `boss`
   - haslo: `1234`

## 5. Readiness checklist

Projekt jest gotowy do pierwszego testu prywatnego, jesli:

- backend odpowiada na `/health`
- frontend ma ustawione `EXPO_PUBLIC_API_BASE_URL`
- logowanie i rejestracja dzialaja
- `GET /me` dziala po zalogowaniu
- market, bank, kasyno i heisty przechodza przez backend

## 6. Ograniczenia na ten etap

- dane userow sa zapisywane do `backend/data/users.db`
- jesli hosting nie ma persistent disk / volume, konta i sejwy moga zniknac po redeployu
- do pierwszych testow prywatnych to wystarczy, ale do stalego online trzeba potem przejsc na PostgreSQL
