# Huisrapport

Nederlandse website voor openbare woning- en buurtgegevens. De adreszoeker gebruikt PDOK, woningregistraties komen uit BAG en buurtcijfers uit CBS. Ontbrekende gegevens worden niet geschat.

## Ontwikkelen

Node.js 20 of hoger voor tests en bouwscripts. De website heeft geen pakketafhankelijkheden.

```sh
python3 -m http.server 8765 --directory public
node --test tests/*.test.js
node scripts/build.mjs
node scripts/validate-artifact.mjs
```

De lokale bestandsserver toont de website. De interesse-endpoints vereisen de Worker en een R2-binding `BUCKET`; zonder opslag meldt het formulier dat opslaan niet beschikbaar is.

## Bestanden

- `public/`: HTML, stijlen en browsercode.
- `worker/`: website- en interesse-endpoints.
- `scripts/`: bouw en controle van het Worker-bestand.
- `tests/`: gegevensverwerking en interesse-endpoints.
- `DESIGN.md`: vormgevingsafspraken.

## Scheiding tussen code en lokale gegevens

Deze repository bevat uitsluitend beoordeelde websitebroncode en ontwikkelinstructies. Onderzoeksdocumenten, interne roadmap, klantgegevens, inzendingen, exports, archieven, sleutels en hostingaccountgegevens blijven buiten Git.

De bouw genereert `dist/server/index.js`. Een bestaande lokale `.openai/hosting.json` wordt alleen voor Sites-publicatie naar `dist/` gekopieerd. Beide mappen zijn uitgesloten van Git. Deze hostingkoppeling moet op een nieuwe computer lokaal worden ingesteld. Een build publiceert de site niet automatisch.

Voeg nieuwe bronbestanden alleen toe na controle op privégegevens; maak zo nodig de toelatingslijst in `.gitignore` specifieker. Geheimen horen in lokale omgevingsvariabelen of in de hostingconfiguratie, nooit in browsercode.
