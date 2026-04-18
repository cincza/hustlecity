# Expo Preview First Build

Ta checklista opisuje pierwszy poprawny build `preview` dla tego projektu w Expo / EAS.

Aktualny projekt Expo:

- account: `@czincza`
- slug: `hustle-city-mobile`
- projectId: `2720e4db-c63c-41be-906b-80d38c74b4d3`

## Co jest juz ustawione

Repo ma juz poprawne pliki:

- [app.json](C:\Users\Adam\Documents\New project\app.json)
- [eas.json](C:\Users\Adam\Documents\New project\eas.json)

Profil `preview` jest skonfigurowany jako:

- `distribution: internal`
- `android.buildType: apk`
- `channel: preview`

To znaczy:

- build da sie zainstalowac bez Google Play
- wynikowy artefakt bedzie APK
- build bedzie gotowy pod OTA update na kanale `preview`

## Przed pierwszym buildem

1. Upewnij sie, ze jestes zalogowany do wlasciwego konta Expo:

```bash
npx eas-cli@latest whoami
```

2. Sprawdz lokalny stan projektu:

```bash
npm install
npx expo-doctor
```

3. Upewnij sie, ze backend preview jest juz znany.

W tym projekcie buildy EAS biora backend z [eas.json](C:\Users\Adam\Documents\New project\eas.json), nie z lokalnego `.env`.

Aktualnie `preview` uzywa:

```text
https://hustle-city-api.onrender.com
```

Jesli chcesz inny backend dla preview, zmien `EXPO_PUBLIC_API_BASE_URL` w `build.base.env`.

## Pierwszy build preview

Uruchom:

```bash
npx eas-cli@latest build -p android --profile preview
```

## Co stanie sie po buildzie

- EAS zbuduje Android APK
- dostaniesz link do builda
- z tego linku mozna pobrac APK i zainstalowac je na telefonie

Mozesz tez pozniej sprawdzic buildy:

```bash
npx eas-cli@latest build:list
```

## Instalacja na telefonie

1. Otworz link do builda.
2. Pobierz APK.
3. Zezwol Androidowi na instalacje z linku / pliku.
4. Zainstaluj aplikacje.
5. Otworz appke i zaloguj sie lub zaloz konto.

## Pierwszy smoke test po instalacji

Sprawdz:

1. rejestracja
2. logowanie
3. napad
4. chat
5. zakup karnetu
6. trening na silowni
7. restart aplikacji
8. ponowne logowanie / wznowienie sesji

## Co robic przy kolejnych zmianach

Jesli zmieniasz tylko:

- JavaScript / TypeScript
- style
- obrazki / assety
- logike bez zmian natywnych

to po pierwszym buildzie zwykle nie potrzebujesz nowego APK.

Mozesz wyslac OTA update:

```bash
npx eas-cli@latest update --channel preview --message "preview hotfix"
```

## Kiedy potrzebny jest nowy build zamiast OTA

Nowy build zrob, gdy zmieniasz:

- [app.json](C:\Users\Adam\Documents\New project\app.json)
- zaleznosci natywne Expo / React Native
- pluginy Expo
- package name
- cokolwiek, co zmienia natywna warstwe aplikacji

## Jak sprawdzic OTA preview

Po opublikowaniu update:

1. zamknij aplikacje calkowicie
2. otworz ja ponownie
3. jesli trzeba, zamknij i otworz jeszcze raz

Build `preview` z kanalem `preview` powinien pobrac update w tle i zastosowac go po restarcie.

## Zrodla

- [Expo Build APKs for Android devices](https://docs.expo.dev/build-reference/apk/)
- [Expo Internal distribution](https://docs.expo.dev/build/internal-distribution/)
- [Expo EAS Update getting started](https://docs.expo.dev/eas-update/getting-started/)
- [Expo Send over-the-air updates](https://docs.expo.dev/deploy/send-over-the-air-updates)
