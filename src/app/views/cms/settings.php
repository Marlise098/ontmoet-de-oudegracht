<?php
/** @var array $values  @var array $errors */
use App\Cms\View;
use App\Repositories\SettingRepository;
use App\Services\Csrf;

$groups = [];
foreach (SettingRepository::FIELDS as $key => $field) {
    $groups[$field['group']][$key] = $field;
}
$intros = [
    'Titel'          => 'Bovenaan de app, naast het logo.',
    'Welkomstscherm' => 'Het venster dat bezoekers als eerste zien. Een lege regel begint een nieuwe alinea.',
    'Colofon'        => 'Het venster achter de knop "Colofon" en het logo.',
    'Film'           => 'Welke film de app afspeelt. Alleen aanpassen als er een nieuw filmbestand is.',
    'Digibord'       => 'Instellingen voor gebruik op het digibord in de tentoonstelling.',
];
?>
<div class="page-head">
    <div>
        <h1>Teksten en instellingen</h1>
        <p class="lead">Vaste teksten van de app, in het Nederlands en Engels. Laat je een Engels veld leeg, dan ziet de bezoeker de Nederlandse tekst.</p>
    </div>
</div>

<?php if ($errors): ?>
    <div class="error-summary" role="alert" tabindex="-1" data-focus>
        <h2>Controleer het volgende:</h2>
        <ul>
            <?php foreach ($errors as $key => $message): ?>
                <li><a href="#<?= e($key) ?>"><?= e(SettingRepository::FIELDS[$key]['label'] . ': ' . $message) ?></a></li>
            <?php endforeach; ?>
        </ul>
    </div>
<?php endif; ?>

<form method="post" action="?page=settings" class="form" id="settings-form" novalidate>
    <?= Csrf::field() ?>
    <?php foreach ($groups as $group => $fields): ?>
        <section class="panel">
            <h2><?= e($group) ?></h2>
            <p class="hint"><?= e($intros[$group] ?? '') ?></p>
            <div class="field-row">
                <?php foreach ($fields as $key => $field): ?>
                    <div class="field<?= $field['type'] === 'textarea' ? ' field-wide-half' : '' ?>">
                        <label for="<?= e($key) ?>"><?= e($field['label']) ?><?= empty($field['required']) ? '' : ' <span class="req" aria-hidden="true">*</span>' ?></label>
                        <?php if (!empty($field['help'])): ?><p class="hint" id="help-<?= e($key) ?>"><?= e($field['help']) ?></p><?php endif; ?>
                        <?php if ($field['type'] === 'textarea'): ?>
                            <textarea id="<?= e($key) ?>" name="<?= e($key) ?>" rows="6"<?= str_ends_with($key, '_en') ? ' lang="en"' : '' ?><?= View::invalid($errors, $key) ?>><?= e($values[$key] ?? '') ?></textarea>
                        <?php else: ?>
                            <input type="<?= $field['type'] === 'number' ? 'number' : 'text' ?>" id="<?= e($key) ?>" name="<?= e($key) ?>"
                                   value="<?= e($values[$key] ?? '') ?>"<?= $field['type'] === 'number' ? ' min="0" max="3600" step="1"' : '' ?>
                                   <?= str_ends_with($key, '_en') ? ' lang="en"' : '' ?><?= !empty($field['help']) ? ' aria-describedby="help-' . e($key) . '"' : '' ?><?= View::invalid($errors, $key) ?>>
                        <?php endif; ?>
                        <?= View::error($errors, $key) ?>
                    </div>
                <?php endforeach; ?>
            </div>
        </section>
    <?php endforeach; ?>

    <div class="sticky-actions">
        <button type="submit" class="btn btn-primary btn-large">Opslaan</button>
        <a class="btn btn-ghost" href="?page=settings">Annuleren</a>
        <span class="dirty-note" id="dirty-note" hidden>Je hebt wijzigingen die nog niet zijn opgeslagen.</span>
    </div>
</form>
