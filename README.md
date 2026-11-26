# ontmoet-de-oudegracht
Webapplicatie en CMS voor Het Utrechts Archief — M & A Studio

Interactieve webapplicatie voor de tentoonstelling **'Ontmoet de Oudegracht'** (maart 2027, 900 jaar Oudegracht).
Bezoekers varen mee met een film uit 1929, van de Gaardbrug tot het stadhuis. Op een kaart vaart een bootje mee,
en bij elke bijzondere plek verschijnen het verhaal en oude foto's uit de beeldbank van Het Utrechts Archief.
Medewerkers beheren alle inhoud zelf via een eenvoudig CMS.

## Wat zit erin?

**Bezoekers-app** (`/`): gemaakt voor een groot digibord met aanraakscherm, en werkt ook op een iPad en in de browser.

- De film uit 1929, met grote knoppen voor afspelen, pauzeren, 10 seconden terug of vooruit, vorige en volgende plek, en geluid aan/uit met volume.
- Een tijdlijn met genummerde **hotspots**. Tik erop om naar die plek te springen.
- Een interactieve **kaart van de Oudegracht** waarop het bootje live met de film meevaart. Je kunt in- en uitzoomen met knoppen, knijpen of scrollen, en de kaart verschuiven. De **minimap** laat zien welk stuk je bekijkt, en met **Volg de boot** blijft het bootje in beeld.
- Bij elke plek een tekst en **foto's uit het archief**. Tik op een foto om hem groot te bekijken en in te zoomen. Bij elke foto staan de maker, het catalogusnummer en de licentie.
- In beeld verschijnt **"Je vaart nu langs …"** zodra de boot bij een plek komt.
- **Zo ziet het er nu uit**: een satellietbeeld van Google Maps van die plek, met een link naar de 3D-weergave.
- Een **welkomstscherm (intro-popup)** met uitleg en een taalkeuze tussen **Nederlands en Engels**.
- Een **colofon** met het logo, informatie over HUA en de app, de makers en de bronnen.
- Op het **digibord** gaat de app na een tijd zonder aanraking automatisch terug naar het welkomstscherm. Hoe lang dat duurt, stel je in via het CMS.
- **Toegankelijkheid**: de app werkt met het toetsenbord en met een schermlezer (labels en live-regio's), heeft een duidelijke focusrand en grote aanraakdoelen (minimaal 48–56 px), en houdt rekening met de instelling 'minder beweging'.

**CMS** (`/cms/`): gemaakt voor medewerkers zonder technische kennis.

- Plekken toevoegen, bewerken, verbergen en verwijderen. Het moment in de film kies je door de film af te spelen en op *Gebruik dit moment* te drukken. De plek kies je door op de kaart te tikken.
- Foto's toevoegen via upload of link, ze bewerken, hun volgorde wijzigen en ze verwijderen. Geüploade foto's worden automatisch verkleind.
- De route van de boot bijstellen: een moment in de film koppel je aan een plek op de kaart.
- Alle vaste teksten aanpassen in het NL en EN: welkomstscherm, colofon en titel.
- Gebruikers beheren met de rollen *beheerder* en *redacteur*.
- Een overzicht met wat er nog te doen is, een logboek van wijzigingen en een ingebouwde handleiding.
- **Beveiliging**:
  - wachtwoorden worden versleuteld opgeslagen (`password_hash`)
  - bescherming tegen CSRF
  - prepared statements tegen SQL-injectie
  - escaping tegen XSS
  - inloggen wordt geblokkeerd na 5 foute pogingen
  - bij de eerste keer inloggen moet je een eigen wachtwoord kiezen
  - de sessie verloopt na 2 uur zonder activiteit
  - geüploade bestanden worden gecontroleerd en er worden geen scripts uitgevoerd in de uploadmap

## Starten met Docker

**Snelste manier (Windows):** start Docker Desktop en dubbelklik op **`start.bat`**.
Het script haalt de nieuwste versie op, start de website en opent hem in je browser.
Met `stop.bat` stop je de website. Met `reset-database.bat` zet je de database terug naar de startinhoud.

Of via de terminal:

```bash
docker compose up --build
```

| Wat | Adres |
|---|---|
| Bezoekers-app | http://localhost/ |
| CMS | http://localhost/cms/ |
| phpMyAdmin | http://localhost:8081/ |
| Oud prototype | http://localhost/prototype/Open-website.html |

De database wordt bij de **eerste** start automatisch gevuld met alle plekken, teksten en foto's uit het bronmateriaal
(`src/database/01_schema.sql` en `02_seed.sql`).

> Heb je de database al eerder gestart met een oudere versie? Gooi dan eerst de oude database weg:
> `docker compose down -v`, en start daarna opnieuw.

**Eerste keer inloggen in het CMS:** gebruikersnaam `beheer`, wachtwoord `Oudegracht900!`.
Daarna vraagt het CMS je meteen om een eigen wachtwoord te kiezen.

## Starten zonder Docker (snel bekijken)

Hiervoor heb je alleen PHP 8.2 of hoger nodig. Er wordt dan een SQLite-testdatabase gebruikt:

```bash
php src/tests/sqlite-setup.php /tmp/oudegracht.sqlite
DB_DRIVER=sqlite DB_PATH=/tmp/oudegracht.sqlite APP_ENV=development php -S localhost:8000 -t src/public src/public/router.php
```

## Tests

```bash
php src/tests/sqlite-setup.php /tmp/og-test.sqlite
DB_DRIVER=sqlite DB_PATH=/tmp/og-test.sqlite php -S 127.0.0.1:8099 -t src/public src/public/router.php &
DB_DRIVER=sqlite DB_PATH=/tmp/og-test.sqlite php src/tests/run-tests.php http://127.0.0.1:8099
```

Er zijn 69 automatische tests: unit-tests, validatie, database en end-to-end tests van de app en het CMS.
Zie [docs/testrapport.md](docs/testrapport.md).

## Mappenstructuur

```
├── compose.yaml, Dockerfile, docker/   Docker-opzet (Apache + PHP 8.2, MariaDB, phpMyAdmin)
├── docs/                               Debriefing, planning, technisch ontwerp, testrapport, logboek
├── src/
│   ├── app/                            PHP-code (niet direct bereikbaar via de browser)
│   │   ├── bootstrap.php, config.php   Opstarten en configuratie (omgevingsvariabelen)
│   │   ├── Database.php                PDO-verbinding met prepared statements
│   │   ├── Repositories/               Data per tabel, inclusief validatie
│   │   ├── Services/                   Inloggen, CSRF, uploads, inhoud voor de app
│   │   ├── Cms/                        Controller en view-rendering van het CMS
│   │   └── views/                      HTML-templates (app en CMS)
│   ├── database/                       Schema en startinhoud (MySQL/MariaDB)
│   ├── public/                         Webroot
│   │   ├── index.php                   Bezoekers-app
│   │   ├── api/content.php             JSON-API met alle inhoud
│   │   ├── cms/index.php               CMS
│   │   ├── assets/                     CSS, JavaScript, logo
│   │   └── uploads/                    Geüploade foto's
│   └── tests/                          Automatische tests
└── website.prototype/                  Eerder prototype + de film (media/)
```

## Gebruikte technieken

PHP 8.2 zonder framework, MariaDB, HTML5 en CSS3 (grid, flexbox en custom properties), en vanilla JavaScript (ES2020).
De kaart is een eigen SVG-component op basis van OpenStreetMap-gegevens. Daardoor werkt hij zonder externe bibliotheken en ook zonder internet.
Meer hierover staat in het [technisch ontwerp](docs/technisch-ontwerp.md).

## Bronnen

- Film en foto's: collectie en beeldbank van Het Utrechts Archief
- Teksten: 'Bronmateriaal en info' van Het Utrechts Archief (Ellen Blom)
- Kaartgegevens: © OpenStreetMap-bijdragers (ODbL)
- Huisstijl: Huisstijlmanual Het Utrechts Archief
