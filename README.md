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
| Entrypoint, indien gevraagd | `server/index.js` |
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

Voer éénmaal `npm run db:setup` uit met deze variabelen ingesteld. Dit maakt alleen de tabel `huisrapport_interest` als deze nog niet bestaat; bestaande gegevens blijven behouden. Wanneer SiteGround geen terminal biedt, voer deze SQL uit in de databasebeheerder:

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
