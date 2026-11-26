-- =====================================================================
--  Ontmoet de Oudegracht: startinhoud
--  Teksten en afbeeldingen komen uit 'Bronmateriaal en info' van
--  Het Utrechts Archief (Ellen Blom). Alles is aan te passen in het CMS.
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
--  Eerste beheerder
--  Gebruikersnaam: beheer   Wachtwoord: Oudegracht900!
--  Bij de eerste keer inloggen moet het wachtwoord worden gewijzigd.
-- ---------------------------------------------------------------------
INSERT INTO users (username, display_name, password_hash, role, is_active, must_change_pw) VALUES
('beheer', 'Beheerder HUA', '$2y$10$zincI8bhb50TJDESoxQN0.Kc0dsch.j7ZS9qIcLsQDYSkoVDNdL0W', 'admin', 1, 1);

-- ---------------------------------------------------------------------
--  Locaties
-- ---------------------------------------------------------------------
INSERT INTO locations (id, code, title_nl, title_en, text_nl, text_en, start_time, lat, lng, is_published) VALUES
(1, '1', 'De Gaardbrug', 'The Gaardbrug',
 'De Gaardbrug is een van de bruggen over de Utrechtse Oudegracht en ontleent haar naam aan de vroegere bisschoppelijke tuin, die ook wel de ''gaard'' werd genoemd. Vanaf de brug is er zicht op de Oudegracht en de Domtoren, dit maakt het een populaire plek om foto''s te maken.',
 'The Gaardbrug is one of the bridges across the Oudegracht in Utrecht. It takes its name from the former garden of the bishop, which was also called the ''gaard''. From the bridge you can see the Oudegracht and the Dom Tower, which makes it a popular spot for taking photos.',
 0, 52.089199, 5.121168, 1),

(2, '1a', 'De middeleeuwse werven en werfkelders', 'The medieval wharves and wharf cellars',
 'Langs de gracht zie je de bijzondere combinatie van een hoger gelegen straat en een lager gelegen werf aan het water. Handelaren gebruikten de werfkelders om goederen op te slaan en rechtstreeks vanaf schepen aan te voeren. Zo groeide de Oudegracht uit tot een belangrijke handelsroute door de stad.',
 'Along the canal you can see a special combination: a street at a higher level and a wharf down by the water. Merchants used the wharf cellars to store goods that were unloaded straight from the ships. This is how the Oudegracht grew into an important trade route through the city.',
 22, 52.088800, 5.121420, 1),

(3, '1b', 'Café De Postillon / Gaardbrug OG 148', 'Café De Postillon / Gaardbrug OG 148',
 'Vlak bij de Gaardbrug staat aan de Lijnmarkt het pand waarin Café De Postillon zit. Op de foto uit het archief zie je de voorgevel van het café, met de brug ernaast. Kijk tijdens de film goed naar de huizen links van de boot als de Gaardbrug dichterbij komt.',
 'Close to the Gaardbrug, on the Lijnmarkt, stands the building that houses Café De Postillon. The archive photo shows the front of the café, with the bridge next to it. Watch the houses on the left of the boat in the film as the Gaardbrug comes closer.',
 40, 52.089380, 5.120830, 1),

(4, '1c', 'Lijnmarkt / Lichte Gaard', 'Lijnmarkt / Lichte Gaard',
 'Na de Gaardbrug vaar je tussen de achtergevels van de huizen aan de Lijnmarkt aan de ene kant en de Lichte en Donkere Gaard aan de andere kant. In de verte ligt de Maartensbrug al. De foto''s uit het archief laten dit stuk gracht door de jaren heen zien: van een strenge winter met grote ijspegels tot de werven van nu.',
 'After the Gaardbrug you sail between the backs of the houses on the Lijnmarkt on one side and the Lichte and Donkere Gaard on the other. The Maartensbrug is already visible in the distance. The archive photos show this part of the canal through the years: from a hard winter with huge icicles to the wharves of today.',
 58, 52.089760, 5.120600, 1),

(5, '2', 'De Maartensbrug', 'The Maartensbrug',
 'De Maartensbrug is de oudste brug over de Utrechtse Oudegracht. De brug werd oorspronkelijk de Borchbrug genoemd, omdat hij toegang gaf tot de bisschoppelijke burcht op de plek van het huidige Domplein. De eerste stenen brug werd in 1404 gebouwd en in 1906 verbreed om ruimte te maken voor het toenemende verkeer en de paardentram. De huidige naam verwijst naar Sint-Maarten, de beschermheilige van Utrecht.',
 'The Maartensbrug is the oldest bridge across the Oudegracht in Utrecht. It was originally called the Borchbrug, because it led to the bishop''s castle where the Domplein is today. The first stone bridge was built in 1404 and widened in 1906 to make room for the growing traffic and the horse-drawn tram. Its current name refers to Saint Martin, the patron saint of Utrecht.',
 84, 52.090404, 5.120380, 1),

(6, '2a', 'De Vismarkt', 'The Vismarkt (fish market)',
 'De Vismarkt is de oudste markt van Utrecht. Al eeuwenlang wordt op het gedeelte van de Oudegracht tussen de Stadhuisbrug en de Maartensbrug vis verhandeld. Dit deel van de gracht ontleent zijn naam dan ook aan de markt.',
 'The Vismarkt is the oldest market in Utrecht. For centuries, fish has been traded on the part of the Oudegracht between the Stadhuisbrug and the Maartensbrug. That is why this part of the canal is named after the market.',
 106, 52.090650, 5.120460, 1),

(7, '3', 'De Kalisbrug', 'The Kalisbrug',
 'De Kalisbrug, ook wel Visbrug genoemd, vormde een belangrijk onderdeel van de Vismarkt en diende als visafslag. Wanneer er voldoende vis was aangevoerd, kondigde de stadsomroeper de verkoop aan. De vis werd vers gehouden in viskaren die in de gracht hingen en verkocht vanaf visbanken op de brug. De traditionele vismarkt verdween aan het begin van de 20e eeuw, maar in de winkels aan de Vismarkt bleven nog lange tijd visverkopers actief. De laatste traditionele viswinkel sloot in 1970.',
 'The Kalisbrug, also called the Visbrug (fish bridge), was an important part of the fish market and served as the fish auction. When enough fish had been brought in, the town crier announced the sale. The fish was kept fresh in fish crates hanging in the canal and sold from fish stalls on the bridge. The traditional fish market disappeared at the start of the 20th century, but fishmongers stayed active in the shops on the Vismarkt for a long time. The last traditional fish shop closed in 1970.',
 114, 52.090970, 5.120250, 1),

(8, '5', 'De Stadhuisbrug en het stadhuis', 'The Stadhuisbrug and the town hall',
 'De Stadhuisbrug dankt haar naam aan het Utrechtse stadhuis dat direct aan de brug ligt. Op deze plek zetelde het stadsbestuur al vanaf de 14e eeuw. De brug ontstond in de 16e eeuw, toen twee bestaande bruggen, de Broodbrug en de Huidenbrug, met elkaar werden verbonden en overkluisd. Het plein dat hierdoor ontstond, werd gebruikt voor openbare afkondigingen van besluiten van het stadsbestuur en kreeg later de naam Stadhuisbrug.',
 'The Stadhuisbrug is named after Utrecht''s town hall, which stands right next to the bridge. The city council has been based here since the 14th century. The bridge was created in the 16th century, when two existing bridges, the Broodbrug and the Huidenbrug, were joined together and vaulted over. The square that was created this way was used to publicly announce decisions of the city council and was later named Stadhuisbrug.',
 136, 52.091550, 5.119700, 1);

-- ---------------------------------------------------------------------
--  Afbeeldingen uit de beeldbank van Het Utrechts Archief
-- ---------------------------------------------------------------------
INSERT INTO images (location_id, image_url, source_url, caption_nl, caption_en, credit, catalog_number, license, sort_order) VALUES
(1, 'https://images.memorix.nl/utr/thumb/640x480/45bf8b14-9fbb-5ee3-e367-37bb389da136.jpg', 'https://hetutrechtsarchief.nl/beeld/E154E77CBAE1BBADE0538F04000A554F',
 'Gezicht op de Oudegracht vanaf de Gaardbrug, met links de achtergevels van de panden aan de Lijnmarkt en rechts de Donkere Gaard.',
 'View of the Oudegracht from the Gaardbrug, with the backs of the buildings on the Lijnmarkt on the left and the Donkere Gaard on the right.',
 'Het Utrechts Archief, fotograaf/filmer', '903109', 'CC BY 4.0', 1),
(1, 'https://images.memorix.nl/utr/thumb/640x480/04bbe625-233d-6fbc-1cf0-80fdf45af226.jpg', 'https://hetutrechtsarchief.nl/beeld/0B35692A2EFE5C49924AB82E3B6FEA43',
 'Doorkijk onder de boog van de Gaardbrug, met op de achtergrond de Maartensbrug en rechts de Donkere Gaard.',
 'View under the arch of the Gaardbrug, with the Maartensbrug in the background and the Donkere Gaard on the right.',
 'C. Stevens, fotograaf', '22122', '', 2),

(2, 'https://images.memorix.nl/utr/thumb/640x480/200fa696-de16-1a7b-9ffe-39f4d816e754.jpg', 'https://hetutrechtsarchief.nl/beeld/17304FEB14DD50B580B52031DBDAE08C',
 'De werfkelder ter hoogte van Oudegracht 190, met links een gedeelte van de Gaardbrug.',
 'The wharf cellar near Oudegracht 190, with part of the Gaardbrug on the left.',
 'Gemeentearchief Utrecht, fotograaf', '67316', '', 1),

(3, 'https://images.memorix.nl/utr/thumb/640x480/bab94e7e-2735-9736-19ff-fd6ae697f104.jpg', 'https://hetutrechtsarchief.nl/beeld/FF48325FF02695B5E0538F04000A4889',
 'De voorgevel van Lijnmarkt 50 (Café De Postillon) bij de Gaardbrug.',
 'The front of Lijnmarkt 50 (Café De Postillon) next to the Gaardbrug.',
 'D.C. Goosen, fotograaf', '906087', '', 1),

(4, 'https://images.memorix.nl/utr/thumb/640x480/29c41d21-8d09-875a-133c-0550e14207a5.jpg', 'https://hetutrechtsarchief.nl/beeld/B92A187339A5B6C3E0534701000ABA07',
 'De Oudegracht vanaf de Gaardbrug, met links de huizen aan de Lijnmarkt, rechts de Donkere Gaard en op de achtergrond de Maartensbrug.',
 'The Oudegracht from the Gaardbrug, with the houses on the Lijnmarkt on the left, the Donkere Gaard on the right and the Maartensbrug in the background.',
 'Euro Color Cards, fotograaf', '852287', '', 1),
(4, 'https://images.memorix.nl/utr/thumb/640x480/9eccfde2-851f-cb84-0fcd-c581f2f4f0a7.jpg', 'https://hetutrechtsarchief.nl/beeld/74208D558E535B50BA7C6690258D82BD',
 'De Oudegracht met op de achtergrond de Maartensbrug; links de Lijnmarkt, rechts de huizen Donkere Gaard 1-13.',
 'The Oudegracht with the Maartensbrug in the background; the Lijnmarkt on the left and the houses at Donkere Gaard 1-13 on the right.',
 'Het Utrechts Archief', '1587', '', 2),
(4, 'https://images.memorix.nl/utr/thumb/640x480/4e7d74fd-ec94-d774-3896-bed862f9cd0e.jpg', 'https://hetutrechtsarchief.nl/beeld/FCC5D27D5122834BE0538F04000A363D',
 'Grote ijspegels aan de afvoeren naar de Oudegracht onder de Lichte Gaard, gezien vanaf de Maartensbrug.',
 'Huge icicles hanging from the drains into the Oudegracht below the Lichte Gaard, seen from the Maartensbrug.',
 'D.C. Goosen, fotograaf', '905747', '', 3),
(4, 'https://images.memorix.nl/utr/thumb/640x480/7031d74f-2d2c-380f-827c-200e860b7527.jpg', 'https://hetutrechtsarchief.nl/beeld/914585185317B66CE0534701000A4FFB',
 'De Oudegracht met rechts de Lichte Gaard, in het midden de Maartensbrug en links de Lijnmarkt.',
 'The Oudegracht with the Lichte Gaard on the right, the Maartensbrug in the middle and the Lijnmarkt on the left.',
 'Fotodienst GAU, fotograaf', '835793', '', 4),
(4, 'https://images.memorix.nl/utr/thumb/640x480/1bc62776-9554-9803-a99e-cad07c40cc99.jpg', 'https://hetutrechtsarchief.nl/beeld/E7B5AE826B105025BA2D34396DA909A1',
 'De voorgevels van de Lichte Gaard, met op de achtergrond de Maartensbrug en de Vismarkt.',
 'The fronts of the houses on the Lichte Gaard, with the Maartensbrug and the Vismarkt in the background.',
 'H. Kruythof, fotograaf', '22275', '', 5),

(5, 'https://images.memorix.nl/utr/thumb/640x480/13d36fd9-e198-7c4d-3ec7-8a19b2e9190b.jpg', 'https://hetutrechtsarchief.nl/beeld/C744769E072555D49E2E03E92DBCB604',
 'De Maartensbrug gezien vanaf de Gaardbrug; op de achtergrond het stadhuis.',
 'The Maartensbrug seen from the Gaardbrug, with the town hall in the background.',
 'Fotodienst GAU, fotograaf', '822378', '', 1),
(5, 'https://images.memorix.nl/utr/thumb/640x480/5ff85650-d6df-156b-8847-09ec37cf4534.jpg', 'https://hetutrechtsarchief.nl/beeld/62665B8EA2525EC3A01EDA19075CF809',
 'De Maartensbrug vanaf de werf onder de Lichte Gaard, met daarachter de Choorstraat.',
 'The Maartensbrug from the wharf below the Lichte Gaard, with the Choorstraat behind it.',
 'Fotodienst GAU, fotograaf', '822375', '', 2),
(5, 'https://images.memorix.nl/utr/thumb/640x480/b1b788e0-8305-3e79-8c04-3d3d508cec04.jpg', 'https://hetutrechtsarchief.nl/beeld/B2BD88E3DE5B2173E0534701000A486F',
 'Een schuit met kratten in de Oudegracht, ter hoogte van de Maartensbrug.',
 'A barge loaded with crates in the Oudegracht, near the Maartensbrug.',
 'S. Budde, fotograaf', '406922', '', 3),
(5, 'https://images.memorix.nl/utr/thumb/640x480/a7ac7eab-039b-04d7-f63a-53fc99777f49.jpg', 'https://hetutrechtsarchief.nl/beeld/9196B3E9A5CA84CCE0534701000AE217',
 'De Vismarkt aan het begin van de avond, gezien vanaf de Maartensbrug.',
 'The Vismarkt in the early evening, seen from the Maartensbrug.',
 'Fotodienst HUA, fotograaf', '843972', '', 4),
(5, 'https://images.memorix.nl/utr/thumb/640x480/9b44fffd-b5a8-2bf0-2665-507eb24613bb.jpg', 'https://hetutrechtsarchief.nl/beeld/40B5CB65EE7835E2E0638F04000A82E2',
 'Een rondvaartboot gezien vanaf de Maartensbrug, met links de Zoutmarkt, in het midden de Kalisbrug en rechts de Vismarkt.',
 'A canal tour boat seen from the Maartensbrug, with the Zoutmarkt on the left, the Kalisbrug in the middle and the Vismarkt on the right.',
 'Het Utrechts Archief, fotograaf/filmer', '914725', '', 5),

(6, 'https://images.memorix.nl/utr/thumb/640x480/1bd5ff65-b4dd-9ad4-46c1-c90205d6073a.jpg', 'https://hetutrechtsarchief.nl/beeld/72DD2DCB9BAC546FBBBCF5C1111CC735',
 'Restauratie van de kelder aan de Zoutmarkt achter Choorstraat 42. Links een deel van de Maartensbrug.',
 'Restoration of the cellar on the Zoutmarkt behind Choorstraat 42. Part of the Maartensbrug on the left.',
 'F.F. van der Werf, fotograaf', '816418', '', 1),

(7, 'https://images.memorix.nl/utr/thumb/640x480/e29cbbe4-0136-9b3c-7be8-5d3086733270.jpg', 'https://hetutrechtsarchief.nl/beeld/452C4EF2E0F15EDA9ACADF86F8E57F51',
 'De Oudegracht en de Vismarkt uit het zuiden, met de Kalisbrug met het visafslaghuisje en op de achtergrond het stadhuis.',
 'The Oudegracht and the Vismarkt from the south, with the Kalisbrug and its fish auction house, and the town hall in the background.',
 'W.C. van Dijk (1826-1881), fotograaf/tekenaar', '603347', '', 1),
(7, 'https://images.memorix.nl/utr/thumb/640x480/6a4beb57-13d8-9fbe-2bd1-5e51dfcc26ce.jpg', 'https://hetutrechtsarchief.nl/beeld/B92F162A1FAB12C0E0534701000A2676',
 'Het terras op de Kalisbrug, met op de achtergrond de panden aan de Vismarkt.',
 'The terrace on the Kalisbrug, with the buildings on the Vismarkt in the background.',
 'Euro Color Cards, fotograaf', '852310', '', 2),
(7, 'https://images.memorix.nl/utr/thumb/640x480/326389fa-ea1e-fc17-7418-1cb844feed51.jpg', 'https://hetutrechtsarchief.nl/beeld/B92C390A7BF7CB12E0534701000AB712',
 'De Kalisbrug met een terras op de werf; links de Zoutmarkt, rechts de Vismarkt en op de achtergrond het stadhuis.',
 'The Kalisbrug with a terrace on the wharf; the Zoutmarkt on the left, the Vismarkt on the right and the town hall in the background.',
 'Euro Color Cards, fotograaf', '852298', '', 3),

(8, 'https://images.memorix.nl/utr/thumb/640x480/6fe37b70-546a-32ad-eb7a-7bd61764cbfa.jpg', 'https://hetutrechtsarchief.nl/beeld/AA8056D41AB75229B8D85A70192C714D',
 'De westzijde van de Stadhuisbrug, gezien uit het zuidwesten.',
 'The west side of the Stadhuisbrug, seen from the south-west.',
 'Fotodienst GAU, fotograaf', '83650', '', 1),
(8, 'https://images.memorix.nl/utr/thumb/640x480/14615f55-344c-5a52-1751-a88aeecf6548.jpg', 'https://hetutrechtsarchief.nl/beeld/E368FFAC3A8A51798AB601A94CEAB7AE',
 'De werf langs de Oudegracht tussen de Bezembrug (achtergrond) en de Stadhuisbrug.',
 'The wharf along the Oudegracht between the Bezembrug (background) and the Stadhuisbrug.',
 'W.M.P.A. en M.L. Bakx, fotografen', '119657', '', 2),
(8, 'https://images.memorix.nl/utr/thumb/640x480/7c7ea0d0-d183-1a9f-1e34-745f7560ae9a.jpg', 'https://hetutrechtsarchief.nl/beeld/DB73D181F47BBAE0E0538F04000AC07C',
 'Het terras aan de Oudegracht ter hoogte van de Stadhuisbrug.',
 'The terrace on the Oudegracht near the Stadhuisbrug.',
 'J.M. Vermeulen, fotograaf', '856849', '', 3),
(8, 'https://images.memorix.nl/utr/thumb/640x480/7c13e223-7096-8232-b06e-4fdefca7077f.jpg', 'https://hetutrechtsarchief.nl/beeld/B92BB223D89518E0E0534701000A7B09',
 'De Oudegracht vanaf de Stadhuisbrug, met het bankgebouw van Vlaer en Kol (Oudegracht 158) en links de bioscopen Camera en Studio.',
 'The Oudegracht from the Stadhuisbrug, with the Vlaer en Kol bank building (Oudegracht 158) and the Camera and Studio cinemas on the left.',
 'Euro Color Cards, fotograaf', '852288', '', 4);

-- ---------------------------------------------------------------------
--  Route van de boot (afgeleid van de filmbeelden)
-- ---------------------------------------------------------------------
INSERT INTO route_points (time_sec, lat, lng) VALUES
(0,   52.088420, 5.121470),
(54,  52.089199, 5.121168),
(70,  52.089560, 5.120870),
(104, 52.090404, 5.120380),
(124, 52.090970, 5.120250),
(136, 52.091200, 5.120080),
(150, 52.091400, 5.119870),
(183, 52.091600, 5.119400);

-- ---------------------------------------------------------------------
--  Instellingen en vaste teksten
-- ---------------------------------------------------------------------
INSERT INTO settings (setting_key, value) VALUES
('site_title_nl', 'Ontmoet de Oudegracht'),
('site_title_en', 'Meet the Oudegracht'),
('subtitle_nl', 'Een boottocht door 1929'),
('subtitle_en', 'A boat trip through 1929'),
('intro_title_nl', 'Welkom aan boord!'),
('intro_title_en', 'Welcome aboard!'),
('intro_text_nl', 'In 1929 voer een filmer met een boot over de Oudegracht, van de Gaardbrug tot aan het stadhuis. Tussen de Gaardbrug en de Bezembrug ligt een bijzonder stuk van de Utrechtse Oudegracht. Je vindt er historische bruggen, oude handelshuizen, werfkelders en sporen van het middeleeuwse handelsleven.\n\nKijk mee met de film. Op de kaart zie je waar de boot vaart. Tik op een punt op de kaart om er meteen naartoe te varen, of tik op een foto om hem groter te bekijken.'),
('intro_text_en', 'In 1929 a filmmaker sailed a boat along the Oudegracht, from the Gaardbrug to the town hall. Between the Gaardbrug and the Bezembrug lies a special part of Utrecht''s Oudegracht. You will find historic bridges, old merchant houses, wharf cellars and traces of medieval trade.\n\nWatch the film. The map shows where the boat is sailing. Tap a point on the map to sail straight there, or tap a photo to see it bigger.'),
('about_hua_nl', 'Het Utrechts Archief is het geheugen van de stad en provincie Utrecht. Wij bewaren documenten, foto''s, films en kaarten over de geschiedenis van Utrecht en zorgen ervoor dat deze bronnen voor iedereen beschikbaar zijn.'),
('about_hua_en', 'Het Utrechts Archief is the memory of the city and province of Utrecht. We keep documents, photos, films and maps about the history of Utrecht and make sure these sources are available to everyone.'),
('about_app_nl', 'Deze webapplicatie is gemaakt voor de tentoonstelling ''Ontmoet de Oudegracht'' (2027), ter ere van 900 jaar Oudegracht. De film uit 1929 en alle foto''s komen uit de collectie van Het Utrechts Archief.'),
('about_app_en', 'This web application was made for the exhibition ''Meet the Oudegracht'' (2027), celebrating 900 years of the Oudegracht. The 1929 film and all photos come from the collection of Het Utrechts Archief.'),
('makers', 'M & A Studio — studenten Webdevelopment'),
('contact', 'Het Utrechts Archief · Hamburgerstraat 28, Utrecht · hetutrechtsarchief.nl'),
('film_credit', 'Filmopname Oudegracht, 1929 — collectie Het Utrechts Archief'),
('video_url', '/media/oudegracht-film-v1.mp4'),
('video_poster', '/media/oudegracht-poster-v1.jpg'),
('idle_timeout', '180');
