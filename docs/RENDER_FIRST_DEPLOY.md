# Render First Deploy

Ten projekt ma teraz jeden poprawny flow deployu backendu:

- repo: `https://github.com/cincza/hustlecity.git`
- branch: `main`
- blueprint: [render.yaml](C:\Users\Adam\Documents\New project\render.yaml)
- backend root: `backend/`

## Przed deployem

1. Upewnij sie, ze lokalnie backend przechodzi smoke test:
   - `npm run smoke`
2. Upewnij sie, ze zmiany sa wypchniete na GitHub do brancha `main`.
3. Sprawdz, czy w [render.yaml](C:\Users\Adam\Documents\New project\render.yaml) nadal sa:
   - `rootDir: backend`
   - `plan: starter`
   - `disk.mountPath: /var/data`
   - `DATA_DIR=/var/data/hustle-city`

## Czysty pierwszy deploy na Render

1. Zaloguj sie do Render Dashboard.
2. Kliknij `New`.
3. Wybierz `Blueprint`.
4. Podepnij repo `cincza/hustlecity`.
5. Wybierz branch `main`.
6. Render powinien wykryc [render.yaml](C:\Users\Adam\Documents\New project\render.yaml).
7. Na ekranie tworzenia sprawdz:
   - service name: `hustle-city-api`
   - runtime: `node`
   - root directory: `backend`
   - build command: `npm ci`
   - start command: `npm start`
   - health check path: `/health`
8. Potwierdz plan `Starter`.
   - Persistent disk wymaga platnej uslugi webowej na Render.
9. Potwierdz disk:
   - name: `hustle-city-api-data`
   - mount path: `/var/data`
   - size: `1 GB`
10. Ustaw sekretne env vars:
   - `JWT_SECRET`
   - `CORS_ORIGIN`

## Polecane wartosci env

`JWT_SECRET`

- ustaw dlugi losowy sekret, nie testowy placeholder

`CORS_ORIGIN`

- dla lokalnego web:
  - `http://localhost:8090,http://127.0.0.1:8090`
- jesli dochodzi frontend release / Expo web pod domena:
  - dodaj te domeny po przecinku

Przyklad:

```text
http://localhost:8090,http://127.0.0.1:8090,https://twoj-frontend.netlify.app
```

## Po deployu

1. Wejdz w `Events` i poczekaj, az deploy bedzie `Live`.
2. Otworz logi uslugi.
3. Znajdz wpis `store-initialized`.
4. Sprawdz, czy `dataDir` wskazuje:

```text
/var/data/hustle-city
```

5. Sprawdz health endpoint:

```text
https://twoj-serwis.onrender.com/health
```

Powinien zwrocic JSON.

## Twarde testy po wdrozeniu

Sprawdz po deployu te endpointy:

```text
GET /health
GET /chat/global
GET /social/rankings
GET /heists
POST /player/gym/pass
```

Oczekiwany wynik:

- brak HTML typu `Cannot GET ...`
- odpowiedzi JSON
- dla chronionych tras moze byc JSON z bledem autoryzacji bez tokena

## Test persystencji

1. Zaloz nowe konto.
2. Zrob napad.
3. Kup karnet.
4. Zrob trening.
5. Wyslij wiadomosc na chat.
6. Zrestartuj usluge na Render.
7. Zaloguj sie ponownie.
8. Sprawdz:
   - konto istnieje
   - kasa sie zgadza
   - staty zostaly
   - chat nadal dziala

## Gdy cos jest nie tak

Najczestsze przyczyny:

- deploy poszedl bez `render.yaml`
- zly branch
- brak `Starter`
- brak dysku
- `DATA_DIR` nie wskazuje `/var/data/hustle-city`
- stary commit na GitHub

## Zrodla

- [Render Web Services](https://render.com/docs/web-services)
- [Render Blueprints](https://render.com/docs/infrastructure-as-code)
- [Render Blueprint Spec](https://render.com/docs/blueprint-spec)
- [Render Persistent Disks](https://render.com/docs/disks)
- [Render Deploys](https://render.com/docs/deploys/)
