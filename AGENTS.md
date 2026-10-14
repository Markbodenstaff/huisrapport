# Werkwijze voor Huisrapport

## Branches en lokale isolatie
- Schrijf nooit rechtstreeks naar `main`. Ook fixes en documentatie gaan via een eigen branch en pull request.
- Gebruik één branch per taak: `feature/<onderwerp>`, `fix/<onderwerp>` of `chore/<onderwerp>`.
- Elke chat die lokaal bestanden wijzigt gebruikt een eigen Git-worktree en blijft daarin werken. Een andere branch in dezelfde werkmap is geen isolatie.
- Deel geen werkmap tussen gelijktijdig schrijvende chats. Wissel niet van branch in een werkmap die door een andere chat wordt gebruikt.
- Gebruik uitsluitend GitHub-bestandstools op de eigen branch wanneer lokale Git-authenticatie ontbreekt; wijzig dan geen gedeelde lokale bestanden.

## Begin van een taak
- Lees dit bestand en de relevante product- en ontwerpafspraken.
- Controleer de actuele remote versie van `main`, open pull requests en lokale wijzigingen vóór het maken van een branch.
- Start vanaf de actuele remote versie, niet vanaf een mogelijk verouderde lokale kopie.
- Vermeld taak, branch, werkmap en verwachte bestanden in de chat. Stem overlap in gedeelde bestanden vooraf af met de coördinerende chat of de gebruiker.
- Berichten naar andere chats worden alleen verstuurd met expliciete toestemming van de gebruiker.

## Wijzigingen en overdracht
- Beperk de diff tot de eigen taak. Behoud wijzigingen van andere chats en herschrijf geen gezamenlijke geschiedenis.
- Upload geen volledige repositorysnapshot uit een verouderde werkmap. Baseer commits op de actuele eigen remote branch en wijzig alleen taakbestanden.
- Force-push nooit `main`. Overschrijf ook geen andere taakbranch.
- Test de relevante werking en voer de bestaande tests en `npm run build` uit bij codewijzigingen.
- Maak een pull request naar `main` met probleem, oplossing, uitgevoerde controles en eventuele beperkingen.
- Meld de PR-link en openstaande beslissingen in de chat. Een PR betekent nog geen publicatie.

## Integratie en publicatie
- De gebruiker wijst één coördinerende chat aan. Tot die aanwijzing voegt geen chat zelfstandig PR's samen.
- De coördinerende chat controleert overlap en conflicten en voegt PR's één voor één samen, binnen expliciet verleende merge-autorisatie.
- Werk de taakbranch bij met de laatste `main` en controleer de gecombineerde werking vóór samenvoegen.
- SiteGround volgt `main` met automatische deployment. Samenvoegen naar `main` is daarmee ook een publicatiehandeling.
- Controleer na publicatie de deploymentcommit en de relevante live werking. Een geslaagde build bewijst geen werkende server of database.
- GitHub-branchbeveiliging is een aparte instelling; deze regels activeren die niet automatisch.

## Hosting, database en privégegevens
- Eén aangewezen beheerder beheert SiteGround-instellingen, databaseconfiguratie en productiegegevens. Andere chats veranderen die niet zonder afstemming.
- Databasewijzigingen moeten bestaande gegevens behouden en een terugvalpad hebben. Geen exports of productiegegevens in Git.
- Houd wachtwoorden, tokens, `.env`, `.env-local`, hostingkoppelingen, logs, rapportarchieven, onderzoeksdocumenten en interne plannen lokaal of in de hostingomgeving.
- Publiceer alleen beoordeelde websitecode, tests en ontwikkelinstructies. Controleer de uploadselectie; vertrouw niet alleen op `.gitignore`.
- Gesynchroniseerde projectbestanden onder `sources/` blijven ongewijzigd en buiten de website-repository.
