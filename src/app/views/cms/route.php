<?php
/** @var array $points  @var array $errors  @var array $locations  @var string $videoUrl */
use App\Services\Csrf;

$rows = array_map(static fn ($p) => [
    'time' => isset($p['time_sec']) ? format_time($p['time_sec']) : '',
    'lat'  => (string) $p['lat'],
    'lng'  => (string) $p['lng'],
], $points);
$mapLocations = array_map(static fn ($l) => ['id' => (int) $l['id'], 'code' => $l['code'], 'lat' => (float) $l['lat'], 'lng' => (float) $l['lng']], $locations);
?>
<div class="page-head">
    <div>
        <h1>Route van de boot</h1>
        <p class="lead">Het bootje op de kaart vaart mee met de film. Een routepunt zegt: <em>op dit moment in de film is de boot hier</em>. Tussen twee punten vaart het bootje vanzelf over de gracht.</p>
    </div>
</div>

<?php if ($errors): ?>
    <div class="error-summary" role="alert" tabindex="-1" data-focus>
        <h2>Controleer het volgende:</h2>
        <ul><?php foreach ($errors as $message): ?><li><?= e($message) ?></li><?php endforeach; ?></ul>
    </div>
<?php endif; ?>

<form method="post" action="?page=route" class="form" id="route-form" novalidate>
    <?= Csrf::field() ?>
    <div class="route-editor">
        <div class="route-left">
            <video id="picker-video" src="<?= e(str_starts_with($videoUrl, '/') ? '..' . $videoUrl : $videoUrl) ?>" controls preload="metadata" playsinline></video>
            <ol class="route-steps">
                <li>Spoel de film naar een moment, bijvoorbeeld als de boot onder een brug door vaart.</li>
                <li>Druk op <strong>Nieuw routepunt</strong>: de tijd wordt overgenomen.</li>
                <li>Tik op de kaart waar de boot op dat moment is.</li>
            </ol>
            <button type="button" class="btn btn-primary" id="route-add">+ Nieuw routepunt op dit moment</button>
        </div>
        <div class="map-picker map-picker-tall" id="route-map"
             data-locations="<?= e(json_encode($mapLocations)) ?>">
            <svg class="map-picker-svg" role="img" aria-label="Kaart met de routepunten van de boot"></svg>
            <div class="map-picker-tools">
                <button type="button" class="btn btn-small" data-map="in" aria-label="Inzoomen">+</button>
                <button type="button" class="btn btn-small" data-map="out" aria-label="Uitzoomen">−</button>
                <button type="button" class="btn btn-small" data-map="reset">Hele kaart</button>
            </div>
        </div>
    </div>

    <div class="table-wrap">
        <table class="table route-table" id="route-table">
            <caption class="visually-hidden">Routepunten</caption>
            <thead>
            <tr><th scope="col">Punt</th><th scope="col">Tijd in de film</th><th scope="col">Plek op de kaart</th><th scope="col"><span class="visually-hidden">Acties</span></th></tr>
            </thead>
            <tbody>
            <?php foreach ($rows as $i => $row): ?>
                <tr>
                    <td><span class="code-badge code-badge-small"><?= $i + 1 ?></span></td>
                    <td><input type="text" name="time[]" value="<?= e($row['time']) ?>" inputmode="decimal" aria-label="Tijd van punt <?= $i + 1 ?>" class="input-time"></td>
                    <td>
                        <input type="hidden" name="lat[]" value="<?= e($row['lat']) ?>">
                        <input type="hidden" name="lng[]" value="<?= e($row['lng']) ?>">
                        <button type="button" class="btn btn-small" data-pick>Kies op kaart</button>
                        <span class="muted small" data-coords></span>
                    </td>
                    <td class="actions"><button type="button" class="btn btn-small btn-danger-ghost" data-remove>Verwijderen</button></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <template id="route-row">
        <tr>
            <td><span class="code-badge code-badge-small"></span></td>
            <td><input type="text" name="time[]" value="" inputmode="decimal" class="input-time"></td>
            <td>
                <input type="hidden" name="lat[]" value="">
                <input type="hidden" name="lng[]" value="">
                <button type="button" class="btn btn-small" data-pick>Kies op kaart</button>
                <span class="muted small" data-coords></span>
            </td>
            <td class="actions"><button type="button" class="btn btn-small btn-danger-ghost" data-remove>Verwijderen</button></td>
        </tr>
    </template>

    <div class="sticky-actions">
        <button type="submit" class="btn btn-primary btn-large">Route opslaan</button>
        <a class="btn btn-ghost" href="?page=route">Wijzigingen ongedaan maken</a>
        <span class="dirty-note" id="dirty-note" hidden>Je hebt wijzigingen die nog niet zijn opgeslagen.</span>
    </div>
</form>
