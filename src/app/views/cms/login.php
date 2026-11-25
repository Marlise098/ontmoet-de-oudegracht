<?php
/** @var ?string $error  @var string $username */
use App\Services\Csrf;
?>
<div class="login-card">
    <div class="login-stripes" aria-hidden="true"></div>
    <img src="../assets/img/logo-hua.svg" alt="Het Utrechts Archief" width="96" height="96" class="login-logo">
    <h1>Beheer <span>Ontmoet de Oudegracht</span></h1>
    <p class="muted">Log in om de teksten, foto's en plekken van de app te beheren.</p>

    <?php if ($error): ?>
        <div class="flash flash-error" role="alert"><?= e($error) ?></div>
    <?php endif; ?>

    <form method="post" action="?page=login" class="form" novalidate>
        <?= Csrf::field() ?>
        <div class="field">
            <label for="username">Gebruikersnaam</label>
            <input type="text" id="username" name="username" value="<?= e($username) ?>" autocomplete="username" autocapitalize="none" required autofocus>
        </div>
        <div class="field">
            <label for="password">Wachtwoord</label>
            <div class="password-wrap">
                <input type="password" id="password" name="password" autocomplete="current-password" required>
                <button type="button" class="btn btn-ghost btn-small" data-toggle-password="password" aria-controls="password">Toon</button>
            </div>
        </div>
        <button type="submit" class="btn btn-primary btn-block">Inloggen</button>
    </form>
    <p class="muted small">Wachtwoord vergeten? Vraag een beheerder om een tijdelijk wachtwoord.</p>
    <p class="small"><a href="../">← Terug naar de app</a></p>
</div>
<script>
document.querySelectorAll('[data-toggle-password]').forEach(function (b) {
  b.addEventListener('click', function () {
    var i = document.getElementById(b.dataset.togglePassword);
    var show = i.type === 'password';
    i.type = show ? 'text' : 'password';
    b.textContent = show ? 'Verberg' : 'Toon';
  });
});
</script>
