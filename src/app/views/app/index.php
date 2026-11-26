<?php
/** @var array $content  @var callable $asset */
$t = $content['texts'];
?><!doctype html>
<html lang="nl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="description" content="<?= e($t['subtitle']['nl']) ?> — Het Utrechts Archief">
    <meta name="theme-color" content="#14285a">
    <title><?= e($t['title']['nl']) ?> · Het Utrechts Archief</title>
    <link rel="icon" href="assets/img/logo-hua.svg" type="image/svg+xml">
    <link rel="preconnect" href="https://service.pdok.nl" crossorigin>
    <link rel="stylesheet" href="<?= e($asset('assets/vendor/leaflet/leaflet.css')) ?>">
    <link rel="stylesheet" href="<?= e($asset('assets/css/map.css')) ?>">
    <link rel="stylesheet" href="<?= e($asset('assets/css/app.css')) ?>">
</head>
<body>
<a class="skip-link" href="#film">Naar de film</a>

<header class="topbar">
    <button type="button" class="brand" data-open="colofon" aria-label="Over Het Utrechts Archief en deze applicatie">
        <img src="assets/img/logo-hua.svg" alt="Het Utrechts Archief" width="72" height="72">
    </button>
    <div class="titles">
        <h1 data-i18n-content="title"><?= e($t['title']['nl']) ?></h1>
        <p class="subtitle" data-i18n-content="subtitle"><?= e($t['subtitle']['nl']) ?></p>
    </div>
    <nav class="top-actions" aria-label="Menu">
        <div class="lang-switch" role="group" aria-label="Taal / Language">
            <button type="button" data-lang="nl" aria-pressed="true" lang="nl">NL</button>
            <button type="button" data-lang="en" aria-pressed="false" lang="en">EN</button>
        </div>
        <button type="button" class="pill-btn" data-open="intro">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 15.5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Zm1.3-5.2c-.6.4-.8.6-.8 1.2v.3h-2v-.4c0-1.3.6-1.9 1.4-2.4.6-.4 1-.7 1-1.3 0-.6-.5-1.1-1.3-1.1-.8 0-1.4.5-1.5 1.3l-2-.3C8.4 7.9 9.9 6.8 12 6.8c2 0 3.4 1.2 3.4 2.9 0 1.3-.8 2-2.1 2.6Z"/></svg>
            <span data-i18n="help">Uitleg</span>
        </button>
        <button type="button" class="pill-btn" data-open="colofon">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-6h2v6Zm-1-8a1.25 1.25 0 1 1 0-2.5A1.25 1.25 0 0 1 12 9Z"/></svg>
            <span data-i18n="colofon">Colofon</span>
        </button>
    </nav>
</header>

<main class="layout">
    <section class="film-panel" aria-labelledby="film-heading">
        <h2 id="film-heading" class="visually-hidden" data-i18n="filmHeading">Film van de Oudegracht uit 1929</h2>
        <div class="video-wrap">
            <video id="film" playsinline preload="auto"
                   poster="<?= e($content['video']['poster']) ?>"
                   aria-describedby="film-credit">
                <source src="<?= e($content['video']['src']) ?>" type="video/mp4">
            </video>
            <span class="film-year" aria-hidden="true">1929</span>
            <button type="button" class="big-play" id="big-play" aria-label="Film afspelen">
                <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </button>
            <button type="button" class="video-hotspot" id="video-hotspot" hidden>
                <span class="hotspot-pulse" aria-hidden="true"></span>
                <span class="hotspot-code" id="video-hotspot-code"></span>
                <span class="hotspot-text">
                    <span class="hotspot-label" data-i18n="nowPassing">Je vaart nu langs</span>
                    <strong id="video-hotspot-title"></strong>
                </span>
            </button>
            <p class="video-error" id="video-error" hidden data-i18n="videoError">De film kan nu niet worden geladen.</p>
        </div>

        <div class="controls" role="group" aria-label="Bediening van de film">
            <button type="button" class="ctrl" id="btn-prev" data-i18n-label="prevStop" aria-label="Vorige plek">
                <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
            </button>
            <button type="button" class="ctrl" id="btn-back" data-i18n-label="back10" aria-label="10 seconden terug">
                <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M11 18V6l-8.5 6 8.5 6Zm.5-6 8.5 6V6l-8.5 6Z"/></svg>
            </button>
            <button type="button" class="ctrl ctrl-play" id="btn-play" aria-label="Afspelen">
                <svg class="i-play" aria-hidden="true" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                <svg class="i-pause" aria-hidden="true" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            </button>
            <button type="button" class="ctrl" id="btn-fwd" data-i18n-label="fwd10" aria-label="10 seconden vooruit">
                <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 18l8.5-6L4 6v12Zm9-12v12l8.5-6L13 6Z"/></svg>
            </button>
            <button type="button" class="ctrl" id="btn-next" data-i18n-label="nextStop" aria-label="Volgende plek">
                <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
            <span class="ctrl-sep" aria-hidden="true"></span>
            <button type="button" class="ctrl" id="btn-mute" aria-pressed="false" data-i18n-label="sound" aria-label="Geluid">
                <svg class="i-sound" aria-hidden="true" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54z"/></svg>
                <svg class="i-muted" aria-hidden="true" viewBox="0 0 24 24"><path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0 0 21 12a9 9 0 0 0-7-8.77v2.06A7 7 0 0 1 19 12zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a9 9 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/></svg>
            </button>
            <label class="volume">
                <span class="visually-hidden" data-i18n="volume">Volume</span>
                <input type="range" id="volume" min="0" max="1" step="0.05" value="0.8">
            </label>
            <output class="clock" id="clock" aria-live="off">0:00 / 0:00</output>
        </div>

        <div class="timeline">
            <div class="timeline-track" id="timeline-track">
                <div class="timeline-progress" id="timeline-progress"></div>
                <div class="timeline-markers" id="timeline-markers"></div>
                <input type="range" class="scrubber" id="scrubber" min="0" max="1000" step="1" value="0" aria-label="Positie in de film" data-i18n-label="position">
            </div>
        </div>
        <p class="film-credit" id="film-credit"><?= e($content['filmCredit']) ?></p>
    </section>

    <aside class="side">
        <section class="map-card" aria-labelledby="map-heading">
            <div class="card-head">
                <h2 id="map-heading" data-i18n="mapHeading">Waar vaart de boot?</h2>
                <div class="map-tools" role="group" aria-label="Kaart">
                    <button type="button" class="tool" id="map-follow" aria-pressed="true" data-i18n-label="follow" aria-label="Volg de boot">
                        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8.94 3A9 9 0 0 0 13 3.06V1h-2v2.06A9 9 0 0 0 3.06 11H1v2h2.06A9 9 0 0 0 11 20.94V23h2v-2.06A9 9 0 0 0 20.94 13H23v-2h-2.06ZM12 19a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z"/></svg>
                    </button>
                    <button type="button" class="tool" id="map-zoom-out" data-i18n-label="zoomOut" aria-label="Uitzoomen">
                        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 11h14v2H5z"/></svg>
                    </button>
                    <button type="button" class="tool" id="map-zoom-in" data-i18n-label="zoomIn" aria-label="Inzoomen">
                        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/></svg>
                    </button>
                    <button type="button" class="tool" id="map-reset" data-i18n-label="zoomReset" aria-label="Hele kaart tonen">
                        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 4h6v2H6v4H4V4Zm10 0h6v6h-2V6h-4V4ZM4 14h2v4h4v2H4v-6Zm14 0h2v6h-6v-2h4v-4Z"/></svg>
                    </button>
                </div>
            </div>
            <div class="map-viewport" id="map-viewport">
                <div id="map" class="map" role="region" aria-labelledby="map-heading" aria-describedby="map-desc"></div>
                <p id="map-desc" class="visually-hidden" data-i18n="mapDesc">Kaart van de Oudegracht met de route van de boot en de plekken uit de film. Tik op een genummerd punt om daarheen te gaan.</p>
                <div class="minimap" id="minimap" hidden aria-hidden="true"><div id="minimap-map" class="minimap-map"></div></div>
                <button type="button" class="base-switch" id="map-base" aria-pressed="false">
                    <span class="base-switch-thumb" aria-hidden="true"></span>
                    <span data-i18n="aerial">Luchtfoto</span>
                </button>
                <p class="map-hint" data-i18n="mapHint">Tik op een nummer om erheen te varen</p>
                <p class="map-offline" id="map-offline" hidden data-i18n="mapOffline">Geen internet: je ziet een eenvoudige kaart.</p>
            </div>
            <ol class="stop-list visually-hidden" id="stop-list" aria-label="Plekken in de film"></ol>
        </section>

        <section class="info-card" id="info-card" aria-live="polite" aria-labelledby="info-title">
            <div class="info-head">
                <span class="code-badge" id="info-code" aria-hidden="true"></span>
                <div>
                    <p class="eyebrow" id="info-eyebrow" data-i18n="aboutThisPlace">Over deze plek</p>
                    <h2 id="info-title"></h2>
                </div>
            </div>
            <div class="info-body" id="info-body"></div>
            <div class="gallery" id="gallery" role="list"></div>
            <div class="info-actions">
                <button type="button" class="action-btn" id="btn-maps">
                    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"/></svg>
                    <span data-i18n="viewNow">Zo ziet het er nu uit</span>
                </button>
            </div>
        </section>
    </aside>
</main>

<!-- Welkomstscherm (intro-popup) -->
<dialog class="modal modal-intro" id="intro" aria-labelledby="intro-title">
    <div class="modal-stripes" aria-hidden="true"></div>
    <img class="intro-logo" src="assets/img/logo-hua.svg" alt="Het Utrechts Archief" width="96" height="96">
    <h2 id="intro-title" data-i18n-content="introTitle"><?= e($t['introTitle']['nl']) ?></h2>
    <div class="intro-text" id="intro-text"></div>
    <ul class="intro-steps">
        <li><span class="step-icon" aria-hidden="true">▶</span><span data-i18n="step1">Start de film en vaar mee</span></li>
        <li><span class="step-icon" aria-hidden="true">1</span><span data-i18n="step2">Tik op een nummer op de kaart</span></li>
        <li><span class="step-icon" aria-hidden="true">⤢</span><span data-i18n="step3">Tik op een foto om in te zoomen</span></li>
    </ul>
    <div class="intro-lang" role="group" aria-label="Kies je taal / Choose your language">
        <button type="button" data-lang="nl" aria-pressed="true" lang="nl">Nederlands</button>
        <button type="button" data-lang="en" aria-pressed="false" lang="en">English</button>
    </div>
    <button type="button" class="primary-btn" id="intro-start" data-i18n="start" autofocus>Start de boottocht</button>
</dialog>

<!-- Colofon -->
<dialog class="modal modal-colofon" id="colofon" aria-labelledby="colofon-title">
    <button type="button" class="modal-close" data-close data-i18n-label="close" aria-label="Sluiten">×</button>
    <div class="colofon-head">
        <img src="assets/img/logo-hua.svg" alt="Het Utrechts Archief" width="88" height="88">
        <h2 id="colofon-title" data-i18n="colofon">Colofon</h2>
    </div>
    <h3 data-i18n="aboutHua">Over Het Utrechts Archief</h3>
    <p data-i18n-content="aboutHua"></p>
    <h3 data-i18n="aboutApp">Over deze applicatie</h3>
    <p data-i18n-content="aboutApp"></p>
    <dl class="colofon-list">
        <dt data-i18n="makers">Gemaakt door</dt><dd><?= e($content['makers']) ?></dd>
        <dt data-i18n="client">Opdrachtgever</dt><dd>Het Utrechts Archief</dd>
        <dt data-i18n="film">Film</dt><dd><?= e($content['filmCredit']) ?></dd>
        <dt data-i18n="photos">Foto's</dt><dd data-i18n="photosCredit">Beeldbank Het Utrechts Archief. Bij elke foto staan de maker en het catalogusnummer.</dd>
        <dt data-i18n="mapData">Kaart</dt><dd data-i18n="mapCredit">Achtergrondkaart en luchtfoto van PDOK (Kadaster en Beeldmateriaal Nederland, CC BY 4.0). Loop van de gracht: © OpenStreetMap-bijdragers.</dd>
        <dt data-i18n="contact">Contact</dt><dd><?= e($content['contact']) ?></dd>
    </dl>
</dialog>

<!-- Afbeelding groot bekijken, met zoom -->
<dialog class="modal modal-lightbox" id="lightbox" aria-labelledby="lightbox-caption">
    <button type="button" class="modal-close" data-close data-i18n-label="close" aria-label="Sluiten">×</button>
    <div class="lightbox-stage" id="lightbox-stage">
        <img id="lightbox-img" alt="" draggable="false">
    </div>
    <div class="lightbox-bar">
        <button type="button" class="tool" id="lb-prev" data-i18n-label="prevPhoto" aria-label="Vorige foto">‹</button>
        <div class="lightbox-meta">
            <p id="lightbox-caption"></p>
            <p class="lightbox-credit" id="lightbox-credit"></p>
        </div>
        <div class="lightbox-zoom" role="group" aria-label="Zoom">
            <button type="button" class="tool" id="lb-zoom-out" data-i18n-label="zoomOut" aria-label="Uitzoomen">−</button>
            <button type="button" class="tool" id="lb-zoom-in" data-i18n-label="zoomIn" aria-label="Inzoomen">+</button>
        </div>
        <button type="button" class="tool" id="lb-next" data-i18n-label="nextPhoto" aria-label="Volgende foto">›</button>
    </div>
</dialog>

<!-- De plek nu (Google Maps) -->
<dialog class="modal modal-maps" id="maps" aria-labelledby="maps-title">
    <button type="button" class="modal-close" data-close data-i18n-label="close" aria-label="Sluiten">×</button>
    <h2 id="maps-title"></h2>
    <div class="maps-views" role="group" aria-label="Weergave" data-i18n-label="mapsViews">
        <button type="button" class="maps-view" data-view="satellite" aria-pressed="true" data-i18n="viewSatellite">Van boven</button>
        <button type="button" class="maps-view" data-view="street" aria-pressed="false" data-i18n="viewStreet">Rondkijken in 3D</button>
    </div>
    <div class="maps-frame" id="maps-frame"></div>
    <p class="maps-note" id="maps-note"></p>
</dialog>

<!-- Wachtstand: de app laat zichzelf zien (film zonder geluid) tot iemand het scherm aanraakt -->
<button type="button" class="attract" id="attract" hidden>
    <span class="attract-call">
        <span class="attract-icon" aria-hidden="true"></span>
        <span class="attract-text">
            <span class="attract-nl">Tik om aan boord te gaan</span>
            <span class="attract-en" lang="en">Tap to come aboard</span>
        </span>
    </span>
</button>

<noscript><p class="noscript">Zet JavaScript aan om de film en de kaart te gebruiken.</p></noscript>

<script>window.OUDEGRACHT = <?= json_encode($content, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?>;</script>
<script src="<?= e($asset('assets/vendor/leaflet/leaflet.js')) ?>"></script>
<script src="<?= e($asset('assets/js/map-data.js')) ?>"></script>
<script src="<?= e($asset('assets/js/oudegracht-map.js')) ?>"></script>
<script src="<?= e($asset('assets/js/app.js')) ?>"></script>
</body>
</html>
