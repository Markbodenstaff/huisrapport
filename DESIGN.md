---
version: alpha
name: Huisrapport
description: Leesbaar Nederlands woningrapport met een herkenbare blauwe adreszoeker.
colors:
  primary: '#2e6da4'
  text: '#25313c'
  muted: '#566370'
  background: '#f5f7f9'
  surface: '#ffffff'
  border: '#dde2e5'
typography:
  sans:
    fontFamily: '"Avenir Next", Avenir, system-ui, sans-serif'
rounded:
  DEFAULT: '12px'
  search: '16px'
spacing:
  page-max: '1040px'
  section-gap: '44px'
components:
  search:
    minHeight: '52px'
  action:
    minHeight: '44px'
---

# Huisrapport

## Overview
Een praktisch dossier voor bezoekers die een Nederlands adres onderzoeken. De adreszoeker is de primaire taak; het rapport is een leesoppervlak. De bestaande blauwe identiteit blijft behouden. De startpagina gebruikt een illustratieve luchtfoto met één gemarkeerde woning en radarringen voor buurtgegevens. Dit is geen foto van een opgezocht adres; openbare registratiegegevens dragen het rapport. Geen verzonnen waardes.

Runtime token ownership: `public/styles.css` is de canonieke bron. Dit document beschrijft die waarden; er zijn geen gegenereerde adapters. `primary` → `--accent`, `text` → `--text`, `muted` → `--muted`, `background` → `--bg`, `surface` → `--surface`, `border` → `--border`, `page-max` → `--page-width`, DEFAULT → `--radius`. De zoekradius en sectieafstand staan bij hun componentregels.

## Colors
Blauw voor acties en datavisualisatie, wit voor het zoekvlak en gegevens, koel grijs voor de pagina. Bronnotities gebruiken dezelfde leesbare secundaire tekstkleur als andere toelichting. Alleen de hero gebruikt een donkerblauwe foto-overlay voor leesbaarheid. Hero-tokens: `--hero-ink` (#102c48), `--hero-text` (#ffffff), `--hero-muted` (#e2edf6), beheerd in `public/styles.css`.

## Typography
De bestaande sans-serif wordt verfijnd met lokaal beschikbare Avenir en een systeemfallback. Koppen zijn steviger dan toelichting. Tabulaire cijfers ondersteunen vergelijking. Nederlandse tekst, gewone zinskapitalisatie en regelbreedtes tot circa 75 tekens.

## Layout
Een enkele kolom tot 1040px inclusief paginapadding; zoeken vóór rapport en interessepeiling. Onder 650px stapelen de zoekacties, bronlinks en aanvullende opties. Vier rapportcijfers worden twee kolommen. Rapportnavigatie wordt op mobiel niet vastgezet om schermruimte vrij te houden.

## Elevation & Depth
Hiërarchie via witruimte, dunne lijnen en oppervlakkleur. Geen schaduwen of geneste kaarten. Uitbreidingen zijn compacte selectierijen.

## Shapes
12px voor hoofdcomponenten, 16px voor het zoekvlak. De bestaande huiscontour blijft het merkbeeld.

## Components
Zoeken heeft een expliciet label, voorbeeldactie, gekoppelde hulptekst en status. Ongeldige invoer krijgt focus en aria-invalid. Resultaten blijven echte knoppen. Primaire acties hebben hover-, focus- en disabled-staten. Voorbeeld- en printknoppen worden in `public/app.js` met addEventListener gekoppeld; een statische HTML-scanner kan die koppelingen missen.

Rapportgegevens behouden hun bron en onderscheid tussen woning en buurt. Interesse is een vrijblijvende peiling, geen bestelling. Bij een ingeschakeld afgeschermd rapportarchief krijgt de adreszoeker vóór het openen een opslagmelding met de ingestelde bewaartermijn. De footer beschrijft dezelfde opslag. Het beheer volgt de bestaande typografie en blauwe acties; rapporten delen de renderer met de publieke site.

Bewegingsreductie geldt zowel voor ankerlinks als voor het automatisch scrollen naar het rapport. Print laat zoeken en interessepeiling weg.

## Do's and Don'ts
- Geef zoeken voorrang boven uitbreidingen.
- Houd onbekende cijfers herkenbaar als ontbrekend.
- Gebruik bronnotities niet als nauwelijks leesbare voetnoten.
- Voeg geen waardeschatting, energielabel of verkoopclaim toe zonder bron.

## Headerbeeld
Het goedgekeurde radarbeeld staat lokaal als geoptimaliseerde JPEG. Op brede schermen staat witte tekst links en de gemarkeerde woning rechts; de witte adreszoeker volgt onder de tekst. Onder 800px staat het beeld boven de tekst en het formulier om het huis en de zoekactie zichtbaar te houden. Bij ontbrekend beeld blijft de donkerblauwe achtergrond leesbaar. Geen animatie. Zoeker, resultaten en rapportgedrag blijven ongewijzigd.
