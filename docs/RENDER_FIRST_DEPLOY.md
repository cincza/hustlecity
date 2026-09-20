# Render: pierwszy deploy gry online

Repozytorium zawiera jeden Blueprint [render.yaml](../render.yaml), który tworzy dwa serwisy:

- `hustle-city-api` — API Node.js z persistent diskiem,
- `hustle-city-web` — statyczny eksport Expo Web.

Docelowe adresy:

- gra: `https://hustle-city-web.onrender.com`,
- API: `https://hustle-city-api.onrender.com`,
- health check: `https://hustle-city-api.onrender.com/health`.

## Kontrola przed wysłaniem

Uruchom z katalogu głównego:

```powershell
npm run check
npm test
npm run smoke
$env:EXPO_PUBLIC_API_BASE_URL='https://hustle-city-api.onrender.com'
npm run export:web
```

Folder `dist/` jest wynikiem lokalnego eksportu i nie trafia do Git. Render tworzy go ponownie podczas builda.

## Pierwsze podłączenie Blueprintu

1. W Render Dashboard wybierz `New` → `Blueprint`.
2. Podepnij repozytorium `cincza/hustlecity` i branch `main`.
3. Render odczyta `render.yaml` i pokaże API oraz statyczny frontend.
4. Ustaw `ADMIN_BOOTSTRAP_PASSWORD` na unikalne hasło administratora: minimum 12 znaków, maksimum 72 bajty UTF-8. Nie używaj hasła lokalnego testera.
5. Zatwierdź utworzenie usług.

`JWT_SECRET` jest generowany po stronie Rendera. `CORS_ORIGIN` oraz publiczny URL API frontendu są już powiązane z nazwami usług w Blueprintcie. API korzysta z planu Starter, ponieważ trwały dysk jest konieczny do zachowania kont i postępu po redeployu.

Kolejne pushe do `main` automatycznie uruchamiają deploy obu serwisów.

## Weryfikacja po deployu

1. Zaczekaj, aż oba serwisy mają stan `Live`.
2. Otwórz `https://hustle-city-api.onrender.com/health` i sprawdź odpowiedź JSON.
3. Otwórz `https://hustle-city-web.onrender.com` i utwórz zwykłe konto testowe.
4. Sprawdź logowanie, jedną akcję gry i odświeżenie strony.
5. Zrestartuj API i potwierdź, że konto oraz postęp nadal istnieją.

W logach API wpis `store-initialized` powinien wskazywać `dataDir` równy `/var/data/hustle-city`.

Chronione endpointy bez tokena mogą zwrócić błąd autoryzacji w JSON. Nie powinny zwracać HTML ani `Cannot GET/POST`.

## Ważne zasady

- Nie commituj `.env`, `backend/.env`, `data/`, plików SQLite ani lokalnych logów.
- Nie umieszczaj sekretów w zmiennych `EXPO_PUBLIC_*`; są widoczne w paczce frontendu.
- Backup produkcji powinien obejmować cały katalog `/var/data/hustle-city`, w tym pliki WAL SQLite.
- Jeśli zmienisz nazwę któregoś serwisu, popraw jednocześnie `CORS_ORIGIN` i `EXPO_PUBLIC_API_BASE_URL` w `render.yaml`.

## Źródła

- [Render Blueprints](https://render.com/docs/infrastructure-as-code)
- [Render Blueprint Spec](https://render.com/docs/blueprint-spec)
- [Render Static Sites](https://render.com/docs/static-sites)
- [Render Persistent Disks](https://render.com/docs/disks)
- [Expo: deploy web](https://docs.expo.dev/deploy/web/)
