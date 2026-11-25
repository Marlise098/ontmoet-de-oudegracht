<?php
/** @var array $user  @var array $errors */
use App\Cms\View;
use App\Repositories\UserRepository;
use App\Services\Csrf;
?>
<div class="page-head">
    <div>
        <h1>Mijn account</h1>
        <p class="lead">Ingelogd als <strong><?= e($user['display_name']) ?></strong> (<?= e($user['username']) ?>) — <?= e(UserRepository::ROLES[$user['role']] ?? $user['role']) ?>.</p>
    </div>
</div>

<section class="panel panel-narrow">
    <h2>Wachtwoord wijzigen</h2>
    <?php if ((int) $user['must_change_pw']): ?>
        <div class="flash flash-info">Je gebruikt een tijdelijk wachtwoord. Kies een eigen wachtwoord om verder te gaan.</div>
    <?php endif; ?>
    <form method="post" action="?page=account" class="form" novalidate>
        <?= Csrf::field() ?>
        <div class="field">
            <label for="current_password">Huidig wachtwoord</label>
            <input type="password" id="current_password" name="current_password" autocomplete="current-password" required<?= View::invalid($errors, 'current_password') ?>>
            <?= View::error($errors, 'current_password') ?>
        </div>
        <div class="field">
            <label for="new_password">Nieuw wachtwoord</label>
            <p class="hint" id="pw-hint">Minstens 10 tekens, met minstens één letter en één cijfer. Tip: gebruik een zin, zoals <em>boottocht-over-de-gracht-1929</em>.</p>
            <input type="password" id="new_password" name="new_password" autocomplete="new-password" required aria-describedby="pw-hint"<?= View::invalid($errors, 'new_password') ?>>
            <?= View::error($errors, 'new_password') ?>
        </div>
        <div class="field">
            <label for="repeat_password">Herhaal het nieuwe wachtwoord</label>
            <input type="password" id="repeat_password" name="repeat_password" autocomplete="new-password" required<?= View::invalid($errors, 'repeat_password') ?>>
            <?= View::error($errors, 'repeat_password') ?>
        </div>
        <button type="submit" class="btn btn-primary">Wachtwoord opslaan</button>
    </form>
</section>
