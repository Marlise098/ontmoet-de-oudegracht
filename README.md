# ontmoet-de-oudegracht
Webapplicatie en CMS voor Het Utrechts Archief — M & A Studio

## Lokaal starten met Docker

Vereist: Docker met Docker Compose.

1. Start vanuit de projectmap:

   ```sh
   docker compose up --build
   ```

2. Open [http://localhost](http://localhost).

De website en CMS-demo worden door dezelfde PHP/Apache-container geserveerd. De projectmap is als volume gekoppeld, zodat lokale wijzigingen direct zichtbaar zijn. Stop de container met `Ctrl+C`; gebruik `docker compose down` om de service te verwijderen.
