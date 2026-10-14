# Huisrapport

Website voor openbare woning- en buurtgegevens, met een Node.js-server voor SiteGround. De adreszoeker gebruikt PDOK, woningregistraties komen uit BAG en buurtcijfers uit CBS. Onbekende cijfers worden niet geschat.

## SiteGround instellen

Koppel `Markbodenstaff/huisrapport`, branch `main`, als Node.js-project. Instellingen voor deze repository:

| Instelling | Waarde |
|---|---|
| Framework | Gewone Node.js-app / Other, indien beschikbaar |
| Node.js | 22 of hoger; lokaal getest op 24 |
| Projectmap | Repository-root (`.`) |
| Package manager | npm |
| Installatie | `npm ci` |
| Build | `npm run build` |
| Start | `npm start` |
| Entrypoint, indien gevraagd | `index.js` |
| Outputmap, indien gevraagd | Repository-root (`.`), niet `public` of `dist` |

De server luistert op `0.0.0.0` en gebruikt de door hosting ingestelde `PORT` (lokaal standaard 3000). De map `public/` wordt door de server aangeboden; servercode en configuratie worden nooit als websitebestanden aangeboden. `/health` is de beschikbaarheidscontrole.

Stel `NODE_ENV=production` en `APP_ORIGIN=https://uw-tijdelijke-domein` in bij SiteGround. Gebruik de exacte origin zonder pad. Pas `APP_ORIGIN` aan wanneer u naar het eigen domein verhuist. Dit is nodig voor veilige formulierinzendingen achter de HTTPS-proxy. De server vertrouwt geen doorgestuurde host/protocolheaders.

De site en adreszoeker werken zonder database. Het interesseformulier meldt dan dat opslaan niet beschikbaar is en bevestigt geen succesvolle inzending.

## MySQL voor interesse-inzendingen

Maak een MySQL-database en gebruiker aan in SiteGround. Vul de volgende omgevingsvariabelen in de hostinginstellingen in (geen wachtwoorden in GitHub):

- `DB_HOST`: de databasehost die SiteGround opgeeft.
- `DB_PORT`: standaard 3306.
- `DB_NAME`: databasenaam.
- `DB_USER`: databasegebruiker.
- `DB_PASSWORD`: databasewachtwoord.
- `DB_SSL`: `true` wanneer de database TLS vereist; certificaatcontrole blijft ingeschakeld.

Bij starten maakt de server automatisch de tabellen `huisrapport_interest` en `huisrapport_reports` aan wanneer een database is ingesteld. De databasegebruiker heeft daarvoor CREATE-rechten nodig; de database zelf moet eerst in SiteGround worden aangemaakt. U kunt ook vooraf `npm run db:setup` uitvoeren. Bestaande tabellen en gegevens blijven behouden. Wanneer SiteGround geen terminal biedt, voer deze SQL uit in de databasebeheerder:

```sql
CREATE TABLE IF NOT EXISTS huisrapport_interest (
 id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 payload TEXT NOT NULL
);
```

De payload bevat uitsluitend gekozen onderdelen, tijdstip en schema-versie; de sleutel is hetzelfde willekeurige browserkenmerk als voorheen. Opnieuw inzenden vervangt de eerdere keuze voor die sleutel. Er worden geen adres, naam, e-mailadres of IP-adres in het applicatierecord opgeslagen. Geaggregeerde aantallen blijven beschikbaar via `/api/interesse-totaal`. Hosting en bronproviders kunnen technische toegangslogs verwerken.

## Ontwikkelen en controleren

```sh
npm ci
npm test
npm run build
npm start
```

Open `http://localhost:3000`. `npm run build` controleert de serversyntax; er is geen frontend-compilatie nodig. Node leest lokale `.env`-bestanden niet automatisch. Voor lokale databasecontrole kunt u met Node 22+ `node --env-file=.env server/index.js` gebruiken; de lokale `.env` blijft buiten Git.

## Bestanden en scheiding van gegevens

- `public/`: browserbestanden.
- `server/`: Node.js-server en MySQL-adapter.
- `worker/`: behouden gedeelde requesthandler en compatibiliteit met de eerdere Worker.
- `scripts/`: database-initialisatie en de eerdere Worker-bouwscripts.
- `tests/`: gegevens-, formulier-, opslagadapter- en HTTP-controles.
- `.env.example`: lege configuratievelden; geen echte sleutels.
- `DESIGN.md`: vormgevingsafspraken.

Alleen beoordeelde websitebroncode en ontwikkelinstructies horen in Git. Onderzoeksdocumenten, interne plannen, klantgegevens, inzendingen, database-exports, sleutels, hostingkoppelingen en tijdelijke archieven blijven erbuiten. `.gitignore` sluit deze uit. Controleer nieuwe bestanden voordat u ze toevoegt.

## Overgang en terugval

De huidige Sites/Worker-publicatie en oude R2-gegevens worden door deze wijziging niet aangepast. SiteGround gebruikt MySQL voor nieuwe inzendingen; bestaande R2-inzendingen worden niet automatisch geïmporteerd. Zet de domeinkoppeling pas om na controle op het tijdelijke domein. Terugval: laat het domein bij de bestaande hosting staan of herstel de vorige publicatie. Verwijder oude opslag pas na een afzonderlijk besluit.

SiteGround kan wijzigingen op de gekoppelde branch automatisch publiceren. De feitelijke deployment en databaseverbinding moeten na het koppelen op SiteGround worden gecontroleerd.

## Afgeschermd rapportarchief en beheer

Stel bij SiteGround naast de databasevariabelen ook dit in:

- `LOG_REPORTS=true`
- `REPORT_RETENTION_DAYS=365` (één jaar, op verzoek van de eigenaar)
- `ADMIN_USER`: uw gekozen beheernaam
- `ADMIN_PASSWORD`: een uniek sterk wachtwoord van minimaal 16 tekens
- `APP_ORIGIN`: de exacte HTTPS-origin van de site

Ga daarna naar `/admin` op uw domein. De browser vraagt de aparte beheerlogin; deze is niet uw GitHub- of SiteGround-wachtwoord. Alle beheerroutes en opgeslagen rapportresultaten vereisen die login, hebben `no-store` en zijn uitgesloten van indexering. Er zijn geen wachtwoorden in deze repository. Gebruik uitsluitend HTTPS voor beheer.

Het archief bewaart het gekozen adres waarvoor daadwerkelijk een rapport is geopend, een servertijdstip en de BAG-/CBS-resultaten inclusief bronlinks en ontbrekende gegevens. Het bevat geen losse zoektekst, alle autocomplete-suggesties, naam, e-mailadres, IP-adres of koppeling met interesse-inzendingen. De server haalt de gegevens zelf op via het gekozen PDOK-adreskenmerk; browserinhoud wordt niet als rapport geaccepteerd. Het opgeslagen rapport wordt in beheer met dezelfde renderer weergegeven, zonder nieuwe bronaanvraag.

Het overzicht toont 100 rapporten per pagina met navigatie en geaggregeerde interessecijfers. Het archief schakelt alleen in met database, geldige bewaartermijn, HTTPS-origin en beheerlogin. Bij inschakeling krijgen bezoekers een opslagmelding bij de adreszoeker en aangepaste privacytekst in de footer. Geen inschakeling zonder deze melding.

De server verwijdert verlopen rapportrecords bij starten en daarna dagelijks; verlopen records worden onmiddellijk uitgesloten van beheeroverzichten. Bij een opslagstoring blijft het rapport voor de bezoeker beschikbaar maar verschijnt het niet in beheer; de serverlog meldt de storing zonder adres of brongegevens. Eerdere rapportaanvragen kunnen niet achteraf worden teruggehaald. De rapportbewaartermijn geldt niet automatisch voor de afzonderlijke interessepeiling.

Nieuwe schema voor handmatige initialisatie, indien nodig:

```sql
CREATE TABLE IF NOT EXISTS huisrapport_reports (
 id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 created_at DATETIME(3) NOT NULL,
 address VARCHAR(255) NOT NULL,
 snapshot MEDIUMTEXT NOT NULL,
 INDEX reports_created_at (created_at)
);
```

Zet `LOG_REPORTS=false` om nieuwe archivering te stoppen. De bestaande archiefgegevens blijven in de database; export en verwijdering zijn afzonderlijke beheerstappen en horen nooit in Git. Automatische opschoning geldt zolang de archieffunctie actief is.

SiteGround kan de projectmap rechtstreeks starten met `node .`. Het veld `main` in `package.json` wijst daarom naar het startbestand `index.js` in de hoofdmap. Zowel `node .` als `npm start` starten dezelfde server.

## Diagnose van het starten

`index.js` schrijft de opstartstappen naar `.startup-status.json` in de bronmap. Dit lokale bestand wordt niet opgenomen in Git en wordt niet door de website aangeboden. Het bevat uitsluitend tijdstippen, Node-versie, numerieke luisterpoort en vaste foutcodes; geen omgevingswaarden, wachtwoorden, adressen, databasegebruikers of volledige foutmeldingen. Bekijk het bij een startprobleem in SiteGround File Manager onder `.nodeapp/latest/app_source`.

`listening` betekent dat de HTTP-server daadwerkelijk is gestart. `startup-failed` of `http-server-failed` bevat een afgeschermde foutcode. Wanneer het bestand ontbreekt, is niet bewezen dat het nieuwe startbestand is uitgevoerd: ook schrijfrechten of een andere startlocatie kunnen dat verklaren.

Bij starten leest de app als terugval de SiteGround-instellingen uit `.nodeapp/.env-local` en daarna eventueel een lokale `.env`. Bestaande procesinstellingen hebben voorrang; de luisterpoort wordt nooit uit deze bestanden overgenomen. De diagnose bevat uitsluitend ja/nee-controles voor beheer- en databaseconfiguratie, geen waarden.
