-- =====================================================================
--  Ontmoet de Oudegracht — databaseschema
--  Het Utrechts Archief · M & A Studio
--
--  Wordt automatisch ingeladen door de MariaDB-container
--  (map src/database is gekoppeld aan /docker-entrypoint-initdb.d).
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
--  Gebruikers van het CMS
--  role: 'admin'  = alles, inclusief gebruikersbeheer
--        'editor' = content beheren (locaties, afbeeldingen, route, teksten)
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
    username        VARCHAR(50)  NOT NULL,
    display_name    VARCHAR(100) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20)  NOT NULL DEFAULT 'editor',
    is_active       TINYINT(1)   NOT NULL DEFAULT 1,
    must_change_pw  TINYINT(1)   NOT NULL DEFAULT 0,
    last_login_at   DATETIME     NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Locaties (hotspots) langs de gracht
--  start_time = seconde in de film waarop de informatie actief wordt
--  lat / lng  = plek van de hotspot op de kaart
-- ---------------------------------------------------------------------
CREATE TABLE locations (
    id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    code          VARCHAR(10)   NOT NULL,
    title_nl      VARCHAR(150)  NOT NULL,
    title_en      VARCHAR(150)  NOT NULL DEFAULT '',
    text_nl       TEXT          NOT NULL,
    text_en       TEXT          NOT NULL,
    start_time    DECIMAL(7,2)  NOT NULL DEFAULT 0,
    lat           DECIMAL(9,6)  NOT NULL,
    lng           DECIMAL(9,6)  NOT NULL,
    is_published  TINYINT(1)    NOT NULL DEFAULT 1,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_locations_time (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Afbeeldingen uit het archief, per locatie
--  image_url  = de afbeelding zelf (extern of /uploads/...)
--  source_url = de pagina in de beeldbank van Het Utrechts Archief
-- ---------------------------------------------------------------------
CREATE TABLE images (
    id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
    location_id     INT UNSIGNED NOT NULL,
    image_url       VARCHAR(500) NOT NULL,
    source_url      VARCHAR(500) NULL,
    caption_nl      VARCHAR(500) NOT NULL DEFAULT '',
    caption_en      VARCHAR(500) NOT NULL DEFAULT '',
    credit          VARCHAR(255) NOT NULL DEFAULT '',
    catalog_number  VARCHAR(50)  NOT NULL DEFAULT '',
    license         VARCHAR(50)  NOT NULL DEFAULT '',
    sort_order      INT          NOT NULL DEFAULT 0,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_images_location (location_id, sort_order),
    CONSTRAINT fk_images_location FOREIGN KEY (location_id)
        REFERENCES locations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Route van de boot: op welk moment in de film is de boot waar?
--  Tussen twee punten beweegt het bootje vloeiend over de gracht.
-- ---------------------------------------------------------------------
CREATE TABLE route_points (
    id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
    time_sec  DECIMAL(7,2) NOT NULL,
    lat       DECIMAL(9,6) NOT NULL,
    lng       DECIMAL(9,6) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_route_time (time_sec)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Instellingen en vaste teksten (intro, colofon, ...)
-- ---------------------------------------------------------------------
CREATE TABLE settings (
    setting_key  VARCHAR(64) NOT NULL,
    value        TEXT        NOT NULL,
    PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Logboek van wijzigingen in het CMS (wie deed wat, wanneer)
-- ---------------------------------------------------------------------
CREATE TABLE activity_log (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id     INT UNSIGNED NULL,
    username    VARCHAR(50)  NOT NULL DEFAULT '',
    action      VARCHAR(50)  NOT NULL,
    details     VARCHAR(255) NOT NULL DEFAULT '',
    ip_address  VARCHAR(45)  NOT NULL DEFAULT '',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_log_created (created_at),
    KEY idx_log_action (action, username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
