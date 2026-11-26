# Testrapport — Ontmoet de Oudegracht

**Versie:** november 2026 · **Testomgeving:** PHP 8.3, SQLite-testdatabase, Google Chrome (headless) · **Team:** M & A Studio

## 1. Testplan

We testen op vier niveaus, gekoppeld aan de eisen uit de briefing en de beoordelingscriteria:

| Soort | Wat | Hoe |
|---|---|---|
| Unit | Hulpfuncties (tijd omrekenen, escaping, URL-controle) en validatie van alle formulieren | Automatisch, `src/tests/run-tests.php` |
| Integratie | Database: startinhoud, sortering, relaties tussen plekken en foto's | Automatisch |
| End-to-end | De bezoekers-app, de API en alle CMS-acties via HTTP, inclusief beveiliging | Automatisch, tegen een draaiende server |
| Handmatig | Bediening met aanraken en muis, kaart en zoom, fotoviewer, taalwissel, schermformaten, toegankelijkheid | Testscenario's hieronder, met schermafbeeldingen in Chrome |

### Tests opnieuw draaien

```bash
php src/tests/sqlite-setup.php /tmp/og-test.sqlite
DB_DRIVER=sqlite DB_PATH=/tmp/og-test.sqlite php -S 127.0.0.1:8099 -t src/public src/public/router.php &
DB_DRIVER=sqlite DB_PATH=/tmp/og-test.sqlite php src/tests/run-tests.php http://127.0.0.1:8099
```

## 2. Resultaten automatische tests

**69 van 69 tests geslaagd.**

```
Hulpfuncties
  ✓ parse_time("1:24") = 84
  ✓ parse_time("84") = 84
  ✓ parse_time("1:24,5") = 84.5
  ✓ parse_time("abc") is ongeldig
  ✓ parse_time("1:75") is ongeldig
  ✓ format_time(136) = "2:16"
  ✓ e() maakt HTML onschadelijk
  ✓ is_safe_url accepteert https
  ✓ is_safe_url weigert javascript:
  ✓ is_safe_url weigert //andere-site

Validatie
  ✓ Lege plek geeft fouten voor code, titel, tekst, tijd en positie
  ✓ Geldige plek heeft geen fouten
  ✓ Tijd 2:30 wordt 150 seconden
  ✓ Positie buiten Utrecht wordt geweigerd
  ✓ Afbeelding met javascript:-link wordt geweigerd
  ✓ Afbeelding zonder beschrijving wordt geweigerd
  ✓ Wachtwoord "kort1" is te kort
  ✓ Wachtwoord zonder cijfer wordt geweigerd
  ✓ Goed wachtwoord wordt geaccepteerd
  ✓ Route met één punt wordt geweigerd
  ✓ Routepunten worden op tijd gesorteerd
  ✓ Instellingen: lege titel en ongeldige tijd worden geweigerd

Database
  ✓ Seed bevat 8 plekken
  ✓ Seed bevat 22 afbeeldingen
  ✓ Alle plekken hebben een Engelse tekst
  ✓ Plekken zijn gesorteerd op filmtijd

Bezoekers-app (http://127.0.0.1:8099)
  ✓ Startpagina laadt (200)
  ✓ Startpagina bevat de film
  ✓ Startpagina bevat het HUA-logo
  ✓ Startpagina bevat colofon en intro
  ✓ API geeft geldige JSON
  ✓ API bevat 8 plekken in NL en EN
  ✓ API bevat de route van de boot
  ✓ API weigert POST (405)
  ✓ Film is bereikbaar

CMS: inloggen en beveiliging
  ✓ Zonder inloggen doorgestuurd naar login
  ✓ Loginformulier heeft CSRF-token
  ✓ Inloggen met verkeerd token wordt geweigerd
  ✓ Verkeerd wachtwoord geeft melding
  ✓ Juist wachtwoord logt in
  ✓ Eerst eigen wachtwoord kiezen (doorsturen naar account)
  ✓ Te kort nieuw wachtwoord wordt geweigerd
  ✓ Wachtwoord wijzigen lukt
  ✓ Pagina 'dashboard' laadt zonder fouten
  ✓ Pagina 'locations' laadt zonder fouten
  ✓ Pagina 'location_form' laadt zonder fouten
  ✓ Pagina 'route' laadt zonder fouten
  ✓ Pagina 'settings' laadt zonder fouten
  ✓ Pagina 'users' laadt zonder fouten
  ✓ Pagina 'help' laadt zonder fouten
  ✓ Pagina 'account' laadt zonder fouten
  ✓ Onbekende pagina geeft 404

CMS: plekken beheren
  ✓ Onvolledige plek wordt niet opgeslagen en toont fouten
  ✓ Nieuwe plek wordt opgeslagen
  ✓ Nieuwe plek staat op 2:40 in de film
  ✓ HTML in titel wordt veilig getoond in de app
  ✓ Verborgen plek verdwijnt uit de app

CMS: afbeeldingen
  ✓ Twee afbeeldingen toegevoegd
  ✓ Volgorde wijzigen werkt
  ✓ Afbeelding met gevaarlijke link wordt geweigerd
  ✓ Afbeelding verwijderen werkt
  ✓ Plek verwijderen verwijdert ook de afbeeldingen

CMS: route, teksten en gebruikers
  ✓ Route opslaan werkt
  ✓ Welkomsttitel wijzigen werkt
  ✓ Gebruiker aanmaken werkt
  ✓ Laatste beheerder kan geen redacteur worden
  ✓ Je kunt jezelf niet verwijderen
  ✓ Gebruiker verwijderen werkt
  ✓ Na uitloggen geen toegang meer

69 van 69 tests geslaagd
```

### Gevonden en opgeloste fouten

| # | Gevonden bij | Probleem | Oplossing |
|---|---|---|---|
| 1 | End-to-end test *Inloggen met verkeerd token* | Bij een verlopen inlogformulier stuurde het CMS door naar het overzicht in plaats van een melding op het inlogscherm te tonen. | De CSRF-controle voor het inlogformulier wordt nu op de inlogpagina zelf afgehandeld, met de melding "Het formulier was verlopen". |
| 2 | Handmatig, schermafbeelding 1920×1080 | De kaart was te klein: een staande kaart in een liggend vak. | De kaart past zich nu automatisch aan het vak aan (`fit`/`autoFit`) en start ingezoomd op de boot met *Volg de boot* aan. De minimap geeft het overzicht. |
| 3 | Handmatig, iPad staand (820×1180) | Hotspot 1 in de tijdlijn viel half buiten beeld. | Extra ruimte links en rechts van de tijdlijn. |
| 4 | Handmatig | Hotspot 1b lag over de gracht, zodat het bootje erachter verdween. | Het punt is verplaatst naar de oever (Lijnmarkt). |
| 5 | Handmatig, testdatabase | Lege regels in de welkomsttekst werden als `\n` getoond. | Het testscript zet `\n` om, net als MariaDB dat doet. |

## 3. Handmatige testscenario's

| # | Scenario | Verwacht | Resultaat |
|---|---|---|---|
| H1 | De app openen op 1920×1080 (digibord) | De wachtstand: de film speelt zonder geluid, de boot vaart mee en onderin staat *Tik om aan boord te gaan / Tap to come aboard* | ✓ Geslaagd |
| H1b | Ergens op het scherm tikken in de wachtstand | Het welkomstscherm met logo, uitleg, taalkeuze en de knop *Start de boottocht*; de film pauzeert | ✓ Geslaagd |
| H2 | Op *Start de boottocht* tikken | Het welkomstscherm sluit en de film start vanaf het begin, met geluid | ✓ Geslaagd |
| H3 | De film naar 1:58 spoelen | De informatiekaart toont *3 De Kalisbrug*, de hotspot in beeld zegt "Je vaart nu langs De Kalisbrug", hotspot 3 is rood in de tijdlijn en op de kaart, en het bootje vaart bij de Kalisbrug | ✓ Geslaagd |
| H4 | Op hotspot 2 op de kaart tikken | De film springt naar 1:24 en de informatie toont *De Maartensbrug* | ✓ Geslaagd |
| H5 | Naar het Engels wisselen | Alle teksten, de titel en de knoppen in het Engels ("Meet the Oudegracht", "Where is the boat?") | ✓ Geslaagd |
| H6 | Op een foto tikken en daarna op + | De fotoviewer opent met beschrijving, maker en catalogusnummer, en de foto zoomt in | ✓ Geslaagd |
| H7 | In de fotoviewer vegen of op › tikken | De volgende foto ("Foto 2 van 5") | ✓ Geslaagd |
| H8 | In- en uitzoomen op de kaart | De kaart zoomt in; de minimap verschijnt met een rood kader op de huidige positie | ✓ Geslaagd |
| H9 | *Volg de boot* aan en de film afspelen | Het bootje blijft in het midden van de kaart | ✓ Geslaagd |
| H10 | De app op iPad staand (820×1180) | Film, bediening, tijdlijn, kaart en informatie staan onder elkaar; alles is bruikbaar | ✓ Geslaagd (na oplossing 3) |
| H11 | Colofon openen via het logo | Een pop-up met logo, Over HUA, Over de app, makers, opdrachtgever en bronnen | ✓ Geslaagd |
| H12 | De app niet aanraken, met de film gepauzeerd of met het welkomstscherm open | De app laadt opnieuw en staat weer in de wachtstand | ✓ Geslaagd (getest met een reset na 10 seconden; standaard is 180 seconden) |
| H13 | Het CMS-formulier van een plek | Stap 1–5 duidelijk, de film om de tijd te kiezen, de kaart met de gekozen plek als rode stip | ✓ Geslaagd |
| H14 | Bediening met het toetsenbord | K speelt af of pauzeert, M zet het geluid uit | ✓ Geslaagd |
| H15 | Tab door alle knoppen; Esc sluit vensters | Zichtbare focusrand; vensters sluiten met Esc | ◻ Nog te testen met een echte gebruiker (de focusstijl en `<dialog>` zijn ingebouwd) |
| H16 | Archieffoto's laden vanuit de beeldbank (images.memorix.nl) | De foto's verschijnen | ⚠ Niet te testen in onze testomgeving, die geen internet heeft. Op een computer met internet testen. Is een foto niet bereikbaar, dan verbergt de app hem netjes. |
| H17 | De app op 3840×2160 (4K-digibord zonder schaling) | Alles is evenredig groter en ziet eruit als op Full HD; slepen op de kaart beweegt de kaart even ver als de vinger | ✓ Geslaagd |
| H18 | *Zo ziet het er nu uit* en dan *Rondkijken in 3D* | Street View van de plek binnen de app; tikken in Google Maps opent geen nieuw tabblad | ✓ Geslaagd |
| H19 | Lang vasthouden op tekst (aanraakscherm) | Er wordt geen tekst geselecteerd en er opent geen menu | ✓ Geslaagd (`user-select: none`, contextmenu uit op aanraakschermen) |

## 4. Toegankelijkheid

| Controle | Resultaat |
|---|---|
| Alle iconknoppen hebben een `aria-label` (NL en EN) | ✓ |
| Formulierfouten in het CMS zijn gekoppeld met `aria-invalid` en `aria-describedby`, plus een foutoverzicht met links | ✓ |
| Kleurcontrast van de tekst (paars #14285a op wit) | ✓ 13:1 |
| Aanraakdoelen minimaal 48 px (ook de nummers in de tijdlijn en de volumeschuif), op het digibord 52–72 px | ✓ |
| Kleinste tekst op het digibord minimaal 15 px (hints, bronvermelding, kopjes) | ✓ |
| `prefers-reduced-motion` zet de animaties uit | ✓ |
| Alternatief voor de kaart voor schermlezers (lijst met plekken) | ✓ |
| Ondertiteling of tekstversie van de film | ⚠ Nog open. De film heeft tussentitels en muziek. Een tekstversie is een verbetervoorstel. |

## 5. Nog te testen op echte apparaten

Deze tests kunnen we pas doen met de echte apparatuur:

1. **Digibord van HUA**: knijpen en vegen op het echte scherm, de leesbaarheid van een afstand, en de geluidssterkte in de zaal.
2. **iPad (Safari)**: het afspelen van de video en de `<dialog>`-vensters (ondersteund vanaf iOS 15.4).
3. **Met internet**: het laden van alle 22 archieffoto's en de Google Maps-weergave.
4. **Docker-installatie**: `docker compose up --build`, inclusief het automatisch vullen van MariaDB. Onze automatische tests draaien op SQLite met hetzelfde schema.
5. **Gebruikerstest met families en met een HUA-medewerker (CMS)**: begrijpen ze zonder uitleg hoe het werkt?

## 6. Verbetervoorstellen

- Een tekstversie of ondertiteling bij de film (WCAG 1.2).
- In het CMS een knop om een archieffoto lokaal op te slaan, zodat de app ook zonder internet alle foto's toont.
- De tijden van de plekken samen met HUA nalopen. Ze zijn nu afgeleid van de filmbeelden (bijvoorbeeld de Maartensbrug rond 1:44 en de Kalisbrug met de visafslag rond 2:04).
