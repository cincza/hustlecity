# Render Backend + Expo APK For Testers

Ta checklista opisuje pelny, najprostszy flow dla kilku testerow:

1. backend na Render
2. APK preview z Expo / EAS
3. wysylka linku do testerow
4. pozniejsze hotfixy przez OTA na kanale `preview`

## Etap 1: backend na Render

Najpierw zrob backend deploy wedlug:

- [RENDER_FIRST_DEPLOY.md](C:\Users\Adam\Documents\New project\docs\RENDER_FIRST_DEPLOY.md)

Po deployu sprawdz:

```text
https://twoj-backend.onrender.com/health
```

To musi zwracac JSON.

Potem sprawdz jeszcze:

```text
https://twoj-backend.onrender.com/heists
https://twoj-backend.onrender.com/chat/global
https://twoj-backend.onrender.com/social/rankings
```

Oczekiwany wynik:

- brak `Cannot GET ...`
- brak HTML
- odpowiedzi JSON

## Etap 2: ustaw backend dla builda preview

Buildy EAS korzystaja w tym projekcie z:

- [eas.json](C:\Users\Adam\Documents\New project\eas.json)

Jesli chcesz, zeby testerzy laczyli sie z nowym backendem Render, ustaw tam:

```json
"EXPO_PUBLIC_API_BASE_URL": "https://twoj-backend.onrender.com"
```

Dokladniej: zmien wartosc w `build.base.env`.

## Etap 3: zrob pierwszy build APK

Korzystaj z:

- [EXPO_PREVIEW_FIRST_BUILD.md](C:\Users\Adam\Documents\New project\docs\EXPO_PREVIEW_FIRST_BUILD.md)

Komenda:

```bash
npx eas-cli@latest build -p android --profile preview
```

## Etap 4: wyslij testerom link

Po buildzie EAS da Ci URL do APK.

Tester:

1. otwiera link
2. pobiera APK
3. instaluje aplikacje
4. uruchamia appke

## Etap 5: pierwszy test testerski

Popros testera, zeby sprawdzil:

1. rejestracja nowego konta
2. logowanie
3. napad
4. chat miasta
5. zakup karnetu
6. trening na silowni
7. zamkniecie i ponowne otwarcie appki
8. czy konto i postep nadal sa zapisane

## Etap 6: szybkie hotfixy bez nowego APK

Jesli po testach poprawiasz tylko warstwe JS / assety, wrzuc OTA:

```bash
npx eas-cli@latest update --channel preview --message "tester hotfix"
```

Po tym:

1. tester zamyka aplikacje
2. otwiera ponownie
3. jesli trzeba, powtarza restart drugi raz

## Kiedy trzeba nowy APK zamiast OTA

Nowy build jest potrzebny, gdy zmieniasz:

- `app.json`
- zaleznosci natywne
- pluginy Expo
- package name
- inne elementy warstwy natywnej

## Minimalna checklista przed wysylka do ludzi

1. `npm run smoke` przechodzi lokalnie
2. backend Render odpowiada JSON-em na `/health`
3. build `preview` powstal bez bledu
4. APK instaluje sie na Twoim telefonie
5. Ty sam przechodzisz podstawowy flow gry

## Najczestsze problemy

- build preview wskazuje stary backend, bo nie zaktualizowano `eas.json`
- backend jest live, ale nie ma persistent disku
- tester ma stary APK i OTA nie wystarczy, bo zmiana byla natywna
- backend odpowiada HTML, bo na Render siedzi zly serwis / zly commit

## Zrodla

- [Expo Internal distribution](https://docs.expo.dev/build/internal-distribution/)
- [Expo Build APKs for Android devices](https://docs.expo.dev/build-reference/apk/)
- [Expo EAS Update getting started](https://docs.expo.dev/eas-update/getting-started/)
- [Render Web Services](https://render.com/docs/web-services)
- [Render Persistent Disks](https://render.com/docs/disks)
