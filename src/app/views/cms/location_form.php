<?php
/**
 * @var ?array $location  @var array $images  @var array $others  @var array $route
 * @var string $videoUrl  @var array $errors  @var ?array $editImage
 */
use App\Cms\View;
use App\Services\Csrf;

$isNew = $location === null;
$v = static function (string $field, mixed $default = '') use ($location) {
    return old($field, $location[$field] ?? $default);
};
$timeValue = old('start_time', $location ? format_time($location['start_time']) : '');
// Was er net een mislukte poging om deze plek op te slaan? Dan die keuze tonen.
$hasLocationOld = !empty($_SESSION['old']) && !isset($_SESSION['old']['caption_nl']);
$published = $hasLocationOld ? !empty($_SESSION['old']['is_published']) : ($isNew || (bool) $location['is_published']);
$mapOthers = array_map(static fn ($l) => ['id' => (int) $l['id'], 'code' => $l['code'], 'lat' => (float) $l['lat'], 'lng' => (float) $l['lng']], $others);
$mapRoute = array_map(static fn ($p) => ['t' => (float) $p['time_sec'], 'lat' => (float) $p['lat'], 'lng' => (float) $p['lng']], $route);
$imageErrors = isset($_SESSION['old']['caption_nl']) ? $errors : [];
$locationErrors = isset($_SESSION['old']['caption_nl']) ? [] : $errors;
?>
<nav class="breadcrumb" aria-label="Kruimelpad"><a href="?page=locations">Plekken</a> <span aria-hidden="true">›</span> <?= $isNew ? 'Nieuwe plek' : e($location['code'] . ' ' . $location['title_nl']) ?></nav>

<div class="page-head">
    <h1><?= $isNew ? 'Nieuwe plek toevoegen' : 'Plek bewerken' ?></h1>
    <?php if (!$isNew): ?>
        <form method="post" action="?page=location_delete" class="inline"
              data-confirm="Weet je zeker dat je '<?= e($location['title_nl']) ?>' wilt verwijderen? Ook de <?= count($images) ?> foto('s) bij deze plek worden verwijderd. Dit kan niet ongedaan worden gemaakt.">
            <?= Csrf::field() ?>
            <input type="hidden" name="id" value="<?= (int) $location['id'] ?>">
            <button type="submit" class="btn btn-danger-ghost">Plek verwijderen</button>
        </form>
    <?php endif; ?>
</div>

<?php if ($locationErrors): ?>
    <div class="error-summary" role="alert" tabindex="-1" data-focus>
        <h2>Controleer het volgende:</h2>
        <ul>
            <?php foreach ($locationErrors as $field => $message): ?>
                <li><a href="#<?= e($field === 'position' ? 'map-picker' : $field) ?>"><?= e($message) ?></a></li>
            <?php endforeach; ?>
        </ul>
    </div>
<?php endif; ?>

<form method="post" action="?page=location_save" class="form" id="location-form" novalidate>
    <?= Csrf::field() ?>
    <input type="hidden" name="id" value="<?= (int) ($location['id'] ?? 0) ?>">

    <section class="panel">
        <h2><span class="step">1</span> Naam en nummer</h2>
        <div class="field-row">
            <div class="field field-narrow">
                <label for="code">Nummer</label>
                <p class="hint" id="code-hint">Zoals in het bronmateriaal, bijv. 2 of 2a.</p>
                <input type="text" id="code" name="code" maxlength="10" value="<?= e($v('code')) ?>" required aria-describedby="code-hint"<?= View::invalid($locationErrors, 'code') ?>>
                <?= View::error($locationErrors, 'code') ?>
            </div>
            <div class="field">
                <label for="title_nl">Titel <span class="lang-tag">NL</span></label>
                <input type="text" id="title_nl" name="title_nl" maxlength="150" value="<?= e($v('title_nl')) ?>" required<?= View::invalid($locationErrors, 'title_nl') ?>>
                <?= View::error($locationErrors, 'title_nl') ?>
            </div>
            <div class="field">
                <label for="title_en">Titel <span class="lang-tag">EN</span> <span class="optional">(optioneel)</span></label>
                <input type="text" id="title_en" name="title_en" maxlength="150" value="<?= e($v('title_en')) ?>" lang="en"<?= View::invalid($locationErrors, 'title_en') ?>>
                <?= View::error($locationErrors, 'title_en') ?>
            </div>
        </div>
    </section>

    <section class="panel">
        <h2><span class="step">2</span> Verhaal bij deze plek</h2>
        <p class="hint">Schrijf kort en helder: de app staat op een groot digibord en wordt gebruikt door families. Een lege regel begint een nieuwe alinea.</p>
        <div class="field-row">
            <div class="field">
                <label for="text_nl">Tekst <span class="lang-tag">NL</span></label>
                <textarea id="text_nl" name="text_nl" rows="9" required data-counter<?= View::invalid($locationErrors, 'text_nl') ?>><?= e($v('text_nl')) ?></textarea>
                <?= View::error($locationErrors, 'text_nl') ?>
            </div>
            <div class="field">
                <label for="text_en">Tekst <span class="lang-tag">EN</span> <span class="optional">(optioneel — anders wordt de Nederlandse tekst getoond)</span></label>
                <textarea id="text_en" name="text_en" rows="9" lang="en" data-counter><?= e($v('text_en')) ?></textarea>
            </div>
        </div>
    </section>

    <section class="panel">
        <h2><span class="step">3</span> Moment in de film</h2>
        <p class="hint">Speel de film af en druk op <strong>Gebruik dit moment</strong> zodra de boot bij deze plek is.</p>
        <div class="video-picker">
            <video id="picker-video" src="<?= e(str_starts_with($videoUrl, '/') ? '..' . $videoUrl : $videoUrl) ?>" controls preload="metadata" playsinline></video>
            <div class="video-picker-side">
                <div class="field">
                    <label for="start_time">Starttijd (minuten:seconden)</label>
                    <input type="text" id="start_time" name="start_time" inputmode="decimal" placeholder="bijv. 1:24" value="<?= e((string) $timeValue) ?>" required<?= View::invalid($locationErrors, 'start_time') ?>>
                    <?= View::error($locationErrors, 'start_time') ?>
                </div>
                <button type="button" class="btn btn-primary" id="use-video-time">⏱ Gebruik dit moment</button>
                <button type="button" class="btn" id="goto-video-time">▶ Bekijk dit moment</button>
            </div>
        </div>
    </section>

    <section class="panel">
        <h2><span class="step">4</span> Plek op de kaart</h2>
        <p class="hint">Tik op de kaart waar deze plek ligt. De rode stip is de plek die je kiest; de blauwe nummers zijn de andere plekken. Zoom in met + of door te scrollen.</p>
        <div class="map-picker" id="map-picker" tabindex="-1"
             data-others="<?= e(json_encode($mapOthers)) ?>"
             data-route="<?= e(json_encode($mapRoute)) ?>">
            <svg class="map-picker-svg" role="img" aria-label="Kaart van de Oudegracht om een plek te kiezen"></svg>
            <div class="map-picker-tools">
                <button type="button" class="btn btn-small" data-map="in" aria-label="Inzoomen">+</button>
                <button type="button" class="btn btn-small" data-map="out" aria-label="Uitzoomen">−</button>
                <button type="button" class="btn btn-small" data-map="reset">Hele kaart</button>
            </div>
        </div>
        <input type="hidden" id="lat" name="lat" value="<?= e((string) $v('lat')) ?>">
        <input type="hidden" id="lng" name="lng" value="<?= e((string) $v('lng')) ?>">
        <p class="hint" id="position-text" aria-live="polite"></p>
        <?= View::error($locationErrors, 'position') ?>
    </section>

    <section class="panel">
        <h2><span class="step">5</span> Zichtbaarheid</h2>
        <label class="check">
            <input type="checkbox" name="is_published" value="1"<?= $published ? ' checked' : '' ?>>
            <span>Toon deze plek aan bezoekers</span>
        </label>
        <p class="hint">Zet dit uit als je nog aan de tekst werkt.</p>
    </section>

    <div class="sticky-actions">
        <button type="submit" class="btn btn-primary btn-large"><?= $isNew ? 'Plek toevoegen' : 'Wijzigingen opslaan' ?></button>
        <a class="btn btn-ghost" href="?page=locations">Annuleren</a>
        <span class="dirty-note" id="dirty-note" hidden>Je hebt wijzigingen die nog niet zijn opgeslagen.</span>
    </div>
</form>

<?php if (!$isNew): ?>
<section class="panel" id="afbeeldingen">
    <h2>Foto's bij deze plek <span class="count"><?= count($images) ?></span></h2>
    <p class="hint">Bezoekers zien de foto's in deze volgorde en kunnen erop tikken om in te zoomen. Gebruik bij voorkeur foto's uit de beeldbank van Het Utrechts Archief en vul de maker en het catalogusnummer in.</p>

    <?php if (!$images): ?>
        <p class="empty-inline">Nog geen foto's. Voeg hieronder de eerste toe.</p>
    <?php else: ?>
        <ol class="image-list">
            <?php foreach ($images as $i => $img): ?>
                <li class="image-item" id="afbeelding-<?= (int) $img['id'] ?>">
                    <img src="<?= e(str_starts_with($img['image_url'], 'uploads/') ? '../' . $img['image_url'] : $img['image_url']) ?>" alt="" loading="lazy" onerror="this.classList.add('is-broken')">
                    <div class="image-meta">
                        <p class="image-caption"><?= e($img['caption_nl']) ?></p>
                        <p class="muted small">
                            <?= e($img['credit'] ?: 'Maker onbekend') ?>
                            <?= $img['catalog_number'] !== '' ? ' · cat.nr. ' . e($img['catalog_number']) : '' ?>
                            · <?= $img['license'] !== '' ? e($img['license']) : '<span class="warn-text">licentie nog invullen</span>' ?>
                            <?= trim($img['caption_en']) === '' ? ' · <span class="warn-text">Engels ontbreekt</span>' : '' ?>
                        </p>
                        <?php if ($img['source_url']): ?>
                            <a class="small" href="<?= e($img['source_url']) ?>" target="_blank" rel="noopener">Bekijk in de beeldbank ↗</a>
                        <?php endif; ?>
                    </div>
                    <div class="image-actions">
                        <form method="post" action="?page=image_move" class="inline">
                            <?= Csrf::field() ?>
                            <input type="hidden" name="id" value="<?= (int) $img['id'] ?>">
                            <input type="hidden" name="direction" value="up">
                            <button type="submit" class="btn btn-small" aria-label="Foto <?= $i + 1 ?> omhoog"<?= $i === 0 ? ' disabled' : '' ?>>↑</button>
                        </form>
                        <form method="post" action="?page=image_move" class="inline">
                            <?= Csrf::field() ?>
                            <input type="hidden" name="id" value="<?= (int) $img['id'] ?>">
                            <input type="hidden" name="direction" value="down">
                            <button type="submit" class="btn btn-small" aria-label="Foto <?= $i + 1 ?> omlaag"<?= $i === count($images) - 1 ? ' disabled' : '' ?>>↓</button>
                        </form>
                        <a class="btn btn-small" href="?page=location_form&amp;id=<?= (int) $location['id'] ?>&amp;image=<?= (int) $img['id'] ?>#afbeelding-formulier">Bewerken</a>
                        <form method="post" action="?page=image_delete" class="inline" data-confirm="Deze foto verwijderen? Dit kan niet ongedaan worden gemaakt.">
                            <?= Csrf::field() ?>
                            <input type="hidden" name="id" value="<?= (int) $img['id'] ?>">
                            <button type="submit" class="btn btn-small btn-danger-ghost">Verwijderen</button>
                        </form>
                    </div>
                </li>
            <?php endforeach; ?>
        </ol>
    <?php endif; ?>

    <?php
    $img = $editImage && (int) $editImage['location_id'] === (int) $location['id'] ? $editImage : null;
    $iv = static function (string $field) use ($img) {
        return old($field, $img[$field] ?? '');
    };
    ?>
    <form method="post" action="?page=image_save" enctype="multipart/form-data" class="form image-form" id="afbeelding-formulier" novalidate>
        <?= Csrf::field() ?>
        <input type="hidden" name="location_id" value="<?= (int) $location['id'] ?>">
        <input type="hidden" name="image_id" value="<?= (int) ($img['id'] ?? 0) ?>">
        <h3><?= $img ? 'Foto bewerken' : 'Foto toevoegen' ?></h3>

        <?php if ($imageErrors): ?>
            <div class="error-summary" role="alert" tabindex="-1" data-focus>
                <h2>De foto is niet opgeslagen:</h2>
                <ul><?php foreach ($imageErrors as $message): ?><li><?= e($message) ?></li><?php endforeach; ?></ul>
            </div>
        <?php endif; ?>

        <div class="field-row">
            <div class="field">
                <label for="upload">Foto uploaden <span class="optional">(JPG, PNG of WebP, max. 8 MB)</span></label>
                <input type="file" id="upload" name="upload" accept="image/jpeg,image/png,image/webp"<?= View::invalid($imageErrors, 'upload') ?>>
                <?= View::error($imageErrors, 'upload') ?>
            </div>
            <div class="field">
                <label for="image_url">… of link naar een afbeelding</label>
                <input type="url" id="image_url" name="image_url" placeholder="https://images.memorix.nl/..." value="<?= e($iv('image_url')) ?>"<?= View::invalid($imageErrors, 'image_url') ?>>
                <?= View::error($imageErrors, 'image_url') ?>
                <?php if ($img): ?><p class="hint">Laat dit staan om de huidige foto te houden.</p><?php endif; ?>
            </div>
        </div>
        <div class="image-preview" id="image-preview" hidden><img alt="Voorbeeld van de gekozen foto"></div>
        <div class="field-row">
            <div class="field">
                <label for="caption_nl">Beschrijving <span class="lang-tag">NL</span></label>
                <textarea id="caption_nl" name="caption_nl" rows="3" maxlength="500"<?= View::invalid($imageErrors, 'caption_nl') ?>><?= e($iv('caption_nl')) ?></textarea>
                <?= View::error($imageErrors, 'caption_nl') ?>
            </div>
            <div class="field">
                <label for="caption_en">Beschrijving <span class="lang-tag">EN</span> <span class="optional">(optioneel)</span></label>
                <textarea id="caption_en" name="caption_en" rows="3" maxlength="500" lang="en"><?= e($iv('caption_en')) ?></textarea>
            </div>
        </div>
        <div class="field-row field-row-4">
            <div class="field">
                <label for="credit">Maker / fotograaf</label>
                <input type="text" id="credit" name="credit" maxlength="255" value="<?= e($iv('credit')) ?>">
            </div>
            <div class="field">
                <label for="catalog_number">Catalogusnummer</label>
                <input type="text" id="catalog_number" name="catalog_number" maxlength="50" value="<?= e($iv('catalog_number')) ?>">
            </div>
            <div class="field">
                <label for="license">Licentie</label>
                <input type="text" id="license" name="license" maxlength="50" list="licenses" placeholder="bijv. CC BY 4.0" value="<?= e($iv('license')) ?>">
                <datalist id="licenses">
                    <option value="CC BY 4.0"><option value="CC0 / Publiek domein"><option value="Auteursrecht voorbehouden">
                </datalist>
            </div>
            <div class="field">
                <label for="source_url">Link naar de beeldbank</label>
                <input type="url" id="source_url" name="source_url" placeholder="https://hetutrechtsarchief.nl/beeld/..." value="<?= e((string) $iv('source_url')) ?>"<?= View::invalid($imageErrors, 'source_url') ?>>
                <?= View::error($imageErrors, 'source_url') ?>
            </div>
        </div>
        <div class="form-actions">
            <button type="submit" class="btn btn-primary"><?= $img ? 'Foto opslaan' : 'Foto toevoegen' ?></button>
            <?php if ($img): ?><a class="btn btn-ghost" href="?page=location_form&amp;id=<?= (int) $location['id'] ?>#afbeeldingen">Annuleren</a><?php endif; ?>
        </div>
    </form>
</section>
<?php else: ?>
    <p class="hint panel">Foto's toevoegen kan nadat je de plek hebt opgeslagen.</p>
<?php endif; ?>
