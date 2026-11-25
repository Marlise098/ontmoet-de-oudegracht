<?php
/** @var array $locations */
use App\Services\Csrf;
?>
<div class="page-head">
    <div>
        <h1>Plekken langs de gracht</h1>
        <p class="lead">Elke plek is een genummerd punt op de kaart en in de tijdlijn. Zodra de film bij de starttijd is, ziet de bezoeker de tekst en foto's van die plek.</p>
    </div>
    <a class="btn btn-primary" href="?page=location_form">+ Nieuwe plek</a>
</div>

<?php if (!$locations): ?>
    <div class="empty">
        <p>Er zijn nog geen plekken.</p>
        <a class="btn btn-primary" href="?page=location_form">Voeg de eerste plek toe</a>
    </div>
<?php else: ?>
    <div class="table-wrap">
        <table class="table table-locations">
            <caption class="visually-hidden">Alle plekken, op volgorde van de film</caption>
            <thead>
            <tr>
                <th scope="col">Nr.</th>
                <th scope="col">Plek</th>
                <th scope="col">In de film</th>
                <th scope="col">Foto's</th>
                <th scope="col">Engels</th>
                <th scope="col">Zichtbaar</th>
                <th scope="col"><span class="visually-hidden">Acties</span></th>
            </tr>
            </thead>
            <tbody>
            <?php foreach ($locations as $loc): ?>
                <tr<?= (int) $loc['is_published'] ? '' : ' class="is-hidden-row"' ?>>
                    <td><span class="code-badge"><?= e($loc['code']) ?></span></td>
                    <td>
                        <a class="row-title" href="?page=location_form&amp;id=<?= (int) $loc['id'] ?>"><?= e($loc['title_nl']) ?></a>
                        <span class="muted small"><?= e(excerpt($loc['text_nl'], 90)) ?></span>
                    </td>
                    <td><span class="time-chip"><?= e(format_time($loc['start_time'])) ?></span></td>
                    <td><?= (int) $loc['image_count'] ?: '<span class="warn-text">geen</span>' ?></td>
                    <td><?= trim($loc['text_en']) !== '' ? '<span class="ok-text">✓</span>' : '<span class="warn-text">ontbreekt</span>' ?></td>
                    <td>
                        <form method="post" action="?page=location_toggle" class="inline">
                            <?= Csrf::field() ?>
                            <input type="hidden" name="id" value="<?= (int) $loc['id'] ?>">
                            <button type="submit" class="switch" role="switch" aria-checked="<?= (int) $loc['is_published'] ? 'true' : 'false' ?>"
                                    aria-label="<?= e($loc['title_nl']) ?> zichtbaar voor bezoekers">
                                <span class="switch-track"><span class="switch-thumb"></span></span>
                                <span class="switch-text"><?= (int) $loc['is_published'] ? 'Ja' : 'Nee' ?></span>
                            </button>
                        </form>
                    </td>
                    <td class="actions">
                        <a class="btn btn-small" href="?page=location_form&amp;id=<?= (int) $loc['id'] ?>">Bewerken</a>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
<?php endif; ?>
