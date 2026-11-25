<?php
/** @var ?array $editUser  @var array $errors  @var array $me */
use App\Cms\View;
use App\Repositories\UserRepository;
use App\Services\Csrf;

$isNew = $editUser === null;
$v = static fn (string $f, mixed $d = '') => old($f, $editUser[$f] ?? $d);
$active = !empty($_SESSION['old']) ? !empty($_SESSION['old']['is_active']) : ($isNew || (int) $editUser['is_active']);
?>
<nav class="breadcrumb" aria-label="Kruimelpad"><a href="?page=users">Gebruikers</a> <span aria-hidden="true">›</span> <?= $isNew ? 'Nieuw' : e($editUser['display_name']) ?></nav>
<h1><?= $isNew ? 'Nieuwe gebruiker' : 'Gebruiker bewerken' ?></h1>

<section class="panel panel-narrow">
    <form method="post" action="?page=user_save" class="form" novalidate>
        <?= Csrf::field() ?>
        <input type="hidden" name="id" value="<?= (int) ($editUser['id'] ?? 0) ?>">
        <div class="field">
            <label for="display_name">Naam</label>
            <input type="text" id="display_name" name="display_name" value="<?= e($v('display_name')) ?>" required<?= View::invalid($errors, 'display_name') ?>>
            <?= View::error($errors, 'display_name') ?>
        </div>
        <div class="field">
            <label for="username">Gebruikersnaam</label>
            <p class="hint" id="username-hint">Kleine letters, bijvoorbeeld <em>ellen.blom</em>.</p>
            <input type="text" id="username" name="username" value="<?= e($v('username')) ?>" autocapitalize="none" required aria-describedby="username-hint"<?= View::invalid($errors, 'username') ?>>
            <?= View::error($errors, 'username') ?>
        </div>
        <fieldset class="field">
            <legend>Rol</legend>
            <?php foreach (UserRepository::ROLES as $role => $label): ?>
                <label class="check">
                    <input type="radio" name="role" value="<?= e($role) ?>"<?= $v('role', 'editor') === $role ? ' checked' : '' ?>>
                    <span><?= e($label) ?></span>
                </label>
            <?php endforeach; ?>
            <?= View::error($errors, 'role') ?>
        </fieldset>
        <?php if ($isNew): ?>
            <div class="field">
                <label for="password">Tijdelijk wachtwoord</label>
                <p class="hint" id="password-hint">Minstens 10 tekens met een letter en een cijfer. Bij de eerste keer inloggen kiest de gebruiker een eigen wachtwoord.</p>
                <input type="text" id="password" name="password" autocomplete="off" required aria-describedby="password-hint"<?= View::invalid($errors, 'password') ?>>
                <?= View::error($errors, 'password') ?>
            </div>
        <?php endif; ?>
        <label class="check">
            <input type="checkbox" name="is_active" value="1"<?= $active ? ' checked' : '' ?>>
            <span>Account is actief (mag inloggen)</span>
        </label>
        <?= View::error($errors, 'is_active') ?>
        <div class="form-actions">
            <button type="submit" class="btn btn-primary"><?= $isNew ? 'Gebruiker aanmaken' : 'Opslaan' ?></button>
            <a class="btn btn-ghost" href="?page=users">Annuleren</a>
        </div>
    </form>
</section>
