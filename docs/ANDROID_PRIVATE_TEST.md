# Android Private Test

Najprostsza droga dla 2-3 znajomych:

## 1. Wystaw backend

Najpierw wrzuc backend na Render.

Po deployu sprawdz:

- `https://twoj-backend.onrender.com/health`

## 2. Podmien API URL

Ustaw prawdziwy backend w:

- [C:\Users\Adam\Documents\New project\eas.json](C:\Users\Adam\Documents\New project\eas.json)
- albo lokalnie w `.env`

Docelowo ma tam byc:

```json
"EXPO_PUBLIC_API_BASE_URL": "https://twoj-backend.onrender.com"
```

## 3. Zbuduj APK dla testerow

W katalogu projektu:

```powershell
cd "C:\Users\Adam\Documents\New project"
npm install
npx eas login
npx eas build -p android --profile preview
```

Profil `preview` robi:

- `internal distribution`
- `APK`

czyli plik, ktory latwo wyslac 2-3 osobom do testow.

## 4. Wyslij testerom

Po buildzie EAS da Ci link do pobrania APK.

Wysylasz ten link znajomym i oni:

1. pobieraja APK
2. instaluja aplikacje
3. loguja sie albo tworza konto

## 5. Co musisz miec ustawione

### Backend env

- `PORT`
- `JWT_SECRET`
- `CORS_ORIGIN`

### Frontend env

- `EXPO_PUBLIC_API_BASE_URL=https://twoj-backend.onrender.com`

## 6. Szybki smoke test przed wysylka

Sprawdz na swoim telefonie:

1. rejestracja
2. logowanie
3. market
4. bank
5. kasyno
6. heist

Jesli to dziala, build nadaje sie do wysylki na pierwszy prywatny test.
