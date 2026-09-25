import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIR = path.join(ROOT, "src", "i18n", "locales");
const source = JSON.parse(fs.readFileSync(path.join(DIR, "source.json"), "utf8"));
const resources = Object.fromEntries(["en", "de", "es"].map((locale) => [locale, JSON.parse(fs.readFileSync(path.join(DIR, `${locale}.json`), "utf8"))]));
const keyBySource = new Map(Object.entries(source).map(([key, value]) => [value, key]));

const overrides = {
  "Zaloguj sie nickiem albo mailem i wbijaj do gry.": [
    "Log in with your nickname or email and get back into the city.",
    "Melde dich mit Nickname oder E-Mail an und kehre in die Stadt zurück.",
    "Inicia sesión con tu apodo o correo y vuelve a la ciudad.",
  ],
  "Rejestracja tworzy nowe konto z wlasnym sejwem postaci.": [
    "Registration creates a fresh account with its own character save.",
    "Die Registrierung erstellt ein neues Konto mit eigenem Spielstand.",
    "El registro crea una cuenta nueva con su propia partida.",
  ],
  "Wejdz do miasta": ["Enter the city", "Betritt die Stadt", "Entra en la ciudad"],
  "Stworz konto": ["Create an account", "Konto erstellen", "Crear una cuenta"],
  "Zaloguj": ["Log in", "Anmelden", "Iniciar sesión"],
  "ENERGIA": ["ENERGY", "ENERGIE", "ENERGÍA"],
  "HP": ["HP", "HP", "HP"],
  "XP": ["XP", "XP", "XP"],
  "Log": ["Log", "Protokoll", "Registro"],
  "Swiezak": ["Rookie", "Neuling", "Novato"],
  "DO RES {0}": ["TO RES {0}", "BIS RES {0}", "HASTA RES {0}"],
  "Pierwszy skok": ["First job", "Erster Coup", "Primer golpe"],
  "{0}/{1} skoki": ["{0}/{1} jobs", "{0}/{1} Coups", "{0}/{1} golpes"],
  "Przejdź do skoków": ["Go to jobs", "Zu den Coups", "Ir a los golpes"],
  "Wybierz kolejny skok": ["Choose the next job", "Nächsten Coup wählen", "Elige el siguiente golpe"],
  "Skok i czyste wyjście": ["Job and a clean exit", "Coup mit sauberem Abgang", "Golpe y salida limpia"],
  "Średnie": ["Medium", "Mittel", "Medio"],
  "Wyloguj": ["Log out", "Abmelden", "Cerrar sesión"],
  "{0} akcje": ["{0} actions", "{0} Aktionen", "{0} acciones"],
  "Bank, regeneracja i szybkie sprawy postaci.": [
    "Banking, recovery and everyday character needs.",
    "Bank, Erholung und alles Wichtige für deinen Charakter.",
    "Banco, recuperación y gestiones rápidas del personaje.",
  ],
  "Język": ["Language", "Sprache", "Idioma"],
  "Zmień język bez wylogowania i bez utraty postępu.": [
    "Change the language without logging out or losing progress.",
    "Ändere die Sprache ohne Abmeldung und ohne Spielfortschritt zu verlieren.",
    "Cambia el idioma sin cerrar sesión ni perder el progreso.",
  ],
  "Wybierz przewagę i człowieka, który odbierze twój pierwszy telefon. Każda droga prowadzi przez całą grę; zmienia decyzje, koszty i wyjścia z kłopotów.": [
    "Choose your edge and the contact who takes your first call. Every path spans the full game and changes your options, costs and ways out of trouble.",
    "Wähle deinen Vorteil und den Kontakt für deinen ersten Anruf. Jeder Weg begleitet dich durch das ganze Spiel und verändert Optionen, Kosten und Auswege.",
    "Elige tu ventaja y el contacto que atenderá tu primera llamada. Cada camino recorre todo el juego y cambia tus opciones, costes y salidas.",
  ],
  "Biznesmen": ["Entrepreneur", "Unternehmer", "Empresario"],
  "Diler": ["Dealer", "Dealer", "Traficante"],
  "Hustler": ["Hustler", "Hustler", "Buscavidas"],
  "Król nocy": ["Nightlife King", "König des Nachtlebens", "Rey de la noche"],
  "Egzekutor": ["Enforcer", "Vollstrecker", "Ejecutor"],
  "Miasto": ["City", "Stadt", "Ciudad"],
  "Napady": ["Heists", "Raubzüge", "Golpes"],
  "Biznes": ["Business", "Geschäft", "Negocios"],
  "Rynek": ["Market", "Markt", "Mercado"],
  "Postać": ["Character", "Charakter", "Personaje"],
  "Kasyno": ["Casino", "Casino", "Casino"],
  "Szpital": ["Hospital", "Krankenhaus", "Hospital"],
  "Restauracja": ["Restaurant", "Restaurant", "Restaurante"],
  "Silownia": ["Gym", "Fitnessstudio", "Gimnasio"],
  "Misje": ["Missions", "Missionen", "Misiones"],
  "Zadania": ["Tasks", "Aufgaben", "Tareas"],
  "Kontakty": ["Contacts", "Kontakte", "Contactos"],
  "Dzielnice": ["Districts", "Bezirke", "Distritos"],
  "Skoki": ["Jobs", "Coups", "Golpes"],
  "Kontrakty": ["Contracts", "Aufträge", "Contratos"],
  "Operacje": ["Operations", "Operationen", "Operaciones"],
  "Cela": ["Cell", "Zelle", "Celda"],
  "Wiezienie": ["Prison", "Gefängnis", "Prisión"],
  "Biznesy": ["Businesses", "Betriebe", "Negocios"],
  "Fabryki": ["Factories", "Fabriken", "Fábricas"],
  "Dostawy": ["Supplies", "Lieferungen", "Suministros"],
  "Hurtownie": ["Wholesalers", "Großhandel", "Mayoristas"],
  "Towary": ["Goods", "Waren", "Mercancía"],
  "Itemy": ["Gear", "Ausrüstung", "Equipo"],
  "Auta": ["Cars", "Autos", "Coches"],
  "Boosty": ["Boosts", "Booster", "Potenciadores"],
  "Sklad": ["Crew", "Crew", "Equipo"],
  "Czlonkowie": ["Members", "Mitglieder", "Miembros"],
  "Akcje": ["Actions", "Aktionen", "Acciones"],
  "Profil": ["Profile", "Profil", "Perfil"],
  "Ranga": ["Rank", "Rang", "Rango"],
  "Szacun": ["Respect", "Respekt", "Respeto"],
  "Ekwipunek": ["Loadout", "Ausrüstung", "Equipamiento"],
  "Ochrona": ["Protection", "Schutz", "Protección"],
  "Log wydarzen": ["Event log", "Ereignisprotokoll", "Registro de eventos"],
  "Narzedzia": ["Utilities", "Werkzeuge", "Herramientas"],
  "Spolecznosc": ["Community", "Community", "Comunidad"],
  "Gracze": ["Players", "Spieler", "Jugadores"],
  "Znajomi": ["Friends", "Freunde", "Amigos"],
  "Wiadomosci": ["Messages", "Nachrichten", "Mensajes"],
  "Rankingi": ["Rankings", "Bestenlisten", "Clasificaciones"],
  "Kup": ["Buy", "Kaufen", "Comprar"],
  "Sprzedaj": ["Sell", "Verkaufen", "Vender"],
  "Odbierz": ["Collect", "Abholen", "Recoger"],
  "Wybierz": ["Choose", "Wählen", "Elegir"],
  "Do wyboru": ["Open choice", "Zur Auswahl", "A elegir"],
  "Start": ["Home", "Start", "Inicio"],
  "Wpłać": ["Deposit", "Einzahlen", "Depositar"],
  "Wypłać": ["Withdraw", "Abheben", "Retirar"],
  "Wpłata": ["Deposit", "Einzahlung", "Depósito"],
  "Wypłata": ["Withdrawal", "Auszahlung", "Retiro"],
  "Wpłacono": ["Deposited", "Eingezahlt", "Depositado"],
  "Wypłacono": ["Withdrawn", "Abgehoben", "Retirado"],
  "Przy sobie": ["On hand", "Bei dir", "En mano"],
  "W banku": ["In the bank", "Auf der Bank", "En el banco"],
  "Gotówka przy sobie → Bank": ["Cash on hand → Bank", "Bargeld bei dir → Bank", "Efectivo en mano → Banco"],
  "Bank → Gotówka przy sobie": ["Bank → Cash on hand", "Bank → Bargeld bei dir", "Banco → Efectivo en mano"],
  "Wybór kwoty nie wysyła pieniędzy. Potwierdź poniżej.": [
    "Choosing an amount does not move any money. Confirm below.",
    "Die Auswahl eines Betrags bewegt noch kein Geld. Bestätige unten.",
    "Elegir una cantidad no mueve dinero. Confirma abajo.",
  ],
  "Sekcje · Przesuń pasek lub użyj strzałek": [
    "Sections · Swipe the bar or use the arrows",
    "Abschnitte · Wische die Leiste oder nutze die Pfeile",
    "Secciones · Desliza la barra o usa las flechas",
  ],
  "Sekcje · przesuń pasek lub użyj strzałek": [
    "Sections · Swipe the bar or use the arrows",
    "Abschnitte · Wische die Leiste oder nutze die Pfeile",
    "Secciones · Desliza la barra o usa las flechas",
  ],
  "Piguly": ["Pills", "Pillen", "Pastillas"],
  "Cena siada": ["Price easing", "Preis fällt", "El precio baja"],
  "Zrodlo:": ["Source:", "Quelle:", "Fuente:"],
  "Szacunek": ["Respect", "Respekt", "Respeto"],
  "Szacunek {0}": ["Respect {0}", "Respekt {0}", "Respeto {0}"],
  "· zmiana za": ["· changes in", "· Wechsel in", "· cambia en"],
  "+ wybrane przygotowania ·": ["+ selected prep ·", "+ gewählte Vorbereitung ·", "+ preparación elegida ·"],
  "Anuluj": ["Cancel", "Abbrechen", "Cancelar"],
  "Zamknij": ["Close", "Schließen", "Cerrar"],
  "Konto": ["Account", "Konto", "Cuenta"],
  "Prywatność, instrukcja usuwania i trwałe usunięcie profilu.": [
    "Privacy, deletion instructions and permanent profile removal.",
    "Datenschutz, Löschanleitung und dauerhafte Entfernung des Profils.",
    "Privacidad, instrucciones de eliminación y borrado permanente del perfil.",
  ],
  "Polityka prywatności": ["Privacy policy", "Datenschutzerklärung", "Política de privacidad"],
  "Instrukcja usuwania konta": ["Account deletion instructions", "Anleitung zur Kontolöschung", "Instrucciones para eliminar la cuenta"],
  "Usuń konto na stałe": ["Delete account permanently", "Konto dauerhaft löschen", "Eliminar cuenta permanentemente"],
  "Wpisz aktualny login i hasło. Po kolejnym potwierdzeniu konto zniknie bez możliwości odzyskania.": [
    "Enter your current login and password. After the final confirmation, the account cannot be recovered.",
    "Gib deinen aktuellen Login und dein Passwort ein. Nach der letzten Bestätigung kann das Konto nicht wiederhergestellt werden.",
    "Introduce tu usuario y contraseña actuales. Tras la confirmación final, la cuenta no se podrá recuperar.",
  ],
  "Aktualne hasło": ["Current password", "Aktuelles Passwort", "Contraseña actual"],
  "Przejdź do potwierdzenia": ["Continue to confirmation", "Weiter zur Bestätigung", "Continuar a la confirmación"],
  "Ostateczne potwierdzenie": ["Final confirmation", "Letzte Bestätigung", "Confirmación final"],
  "Konto, postęp i dane należące do gracza zostaną trwale usunięte. Tej operacji nie można cofnąć.": [
    "The account, progress and player-owned data will be permanently deleted. This cannot be undone.",
    "Das Konto, der Fortschritt und die Spielerdaten werden dauerhaft gelöscht. Dieser Vorgang kann nicht rückgängig gemacht werden.",
    "La cuenta, el progreso y los datos del jugador se eliminarán permanentemente. Esta acción no se puede deshacer.",
  ],
  "Nie udało się usunąć konta.": ["The account could not be deleted.", "Das Konto konnte nicht gelöscht werden.", "No se pudo eliminar la cuenta."],
  "Pełny stan QA": ["Full QA state", "Vollständiger QA-Status", "Estado completo de QA"],
  "Najważniejszy progres i własności bez danych logowania.": [
    "Core progress and ownership without login data.",
    "Wichtiger Fortschritt und Besitz ohne Anmeldedaten.",
    "Progreso y propiedades principales sin datos de acceso.",
  ],
  "Profesje i kontakty": ["Professions and contacts", "Berufe und Kontakte", "Profesiones y contactos"],
  "Biznesy i fabryki": ["Businesses and factories", "Betriebe und Fabriken", "Negocios y fábricas"],
  "Klub i gang": ["Club and gang", "Club und Gang", "Club y pandilla"],
  "Plan, operacja, rywal, Imperium": ["Plan, operation, rival, Empire", "Plan, Operation, Rivale, Imperium", "Plan, operación, rival, Imperio"],
};

let applied = 0;
for (const [phrase, translations] of Object.entries(overrides)) {
  const key = keyBySource.get(phrase);
  if (!key) continue;
  ["en", "de", "es"].forEach((locale, index) => { resources[locale][key] = translations[index]; });
  applied += 1;
}

const preserveExactly = new Set([
  "{0}/delete-account/", "{0}/privacy/", "account-delete:{0}", "account.delete", "activeHeistLobby",
]);
for (const [key, phrase] of Object.entries(source)) {
  if (String(phrase).startsWith("/") || preserveExactly.has(phrase)) {
    for (const locale of ["en", "de", "es"]) resources[locale][key] = phrase;
  }
}

for (const [locale, resource] of Object.entries(resources)) {
  if (locale === "de") {
    for (const key of Object.keys(resource)) {
      resource[key] = resource[key]
        .replace(/Wählen Sie/g, "Wähle").replace(/Machen Sie/g, "Mach")
        .replace(/Nutzen Sie/g, "Nutze").replace(/Verwenden Sie/g, "Nutze")
        .replace(/Prüfen Sie/g, "Prüfe").replace(/Vergleichen Sie/g, "Vergleiche")
        .replace(/Sichern Sie/g, "Sichere").replace(/Kehren Sie/g, "Kehre")
        .replace(/Schließen Sie/g, "Schließe").replace(/Gewinnen Sie/g, "Gewinne")
        .replace(/Bereiten Sie/g, "Bereite").replace(/bevor Sie handeln/g, "bevor du handelst")
        .replace(/Ihre Situation/g, "deine Situation").replace(/Ihres Berufsstandes/g, "deines Berufs")
        .replace(/und wählen Sie/g, "und wähle").replace(/zahlen Sie/g, "zahle")
        .replace(/und sichern Sie sich/g, "und sichere dir").replace(/Sichere Ihr Bargeld/g, "Sichere dein Bargeld")
        .replace(/bestätigen Sie selbst/g, "bestätigst du selbst")
        .replace(/Sie kaufen/g, "Du kaufst").replace(/was Sie bei sich haben/g, "was du bei dir hast")
        .replace(/Treten Sie/g, "Tritt").replace(/erstellen Sie/g, "erstelle")
        .replace(/Hier wissen Sie/g, "Hier siehst du").replace(/Überprüfen Sie/g, "Prüfe")
        .replace(/Klicken Sie/g, "Tippe").replace(/Entnehmen Sie/g, "Nimm")
        .replace(/Wechseln Sie/g, "Wechsle").replace(/Beweisen Sie/g, "Beweise")
        .replace(/Übernehmen Sie/g, "Übernimm").replace(/Kümmern Sie sich/g, "Kümmere dich")
        .replace(/Rüsten Sie/g, "Rüste").replace(/Bitten Sie/g, "Bitte")
        .replace(/Öffnen Sie/g, "Öffne").replace(/Ihr Team/g, "dein Team")
        .replace(/Ihrem Kapital/g, "deinem Kapital").replace(/für Sie/g, "für dich");
    }
  }
  if (locale === "es") {
    for (const key of Object.keys(resource)) {
      resource[key] = resource[key]
        .replace(/Seleccione/g, "Elige").replace(/seleccione/g, "elige")
        .replace(/Utilice/g, "Usa").replace(/utilice/g, "usa")
        .replace(/Verifique/g, "Comprueba").replace(/Compare/g, "Compara")
        .replace(/Asegure/g, "Asegura").replace(/Elija/g, "Elige").replace(/elija/g, "elige")
        .replace(/su profesión/g, "tu profesión").replace(/su efectivo/g, "tu efectivo");
    }
  }
  fs.writeFileSync(path.join(DIR, `${locale}.json`), `${JSON.stringify(resource, null, 2)}\n`);
}
console.log(`Zastosowano ${applied} recznych korekt jakosciowych.`);
