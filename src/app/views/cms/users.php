<?php
/** @var array $users  @var array $me */
use App\Repositories\UserRepository;
use App\Services\Csrf;
?>
<div class="page-head">
    <div>
        <h1>Gebruikers</h1>
        <p class="lead">Wie mag het CMS gebruiken? <strong>Redacteuren</strong> beheren de inhoud, <strong>beheerders</strong> kunnen ook gebruikers toevoegen.</p>
    </div>
    <a class="btn btn-primary" href="?page=user_form">+ Nieuwe gebruiker</a>
</div>

<div class="table-wrap">
    <table class="table">
        <caption class="visually-hidden">Alle gebruikers</caption>
        <thead>
        <tr><th scope="col">Naam</th><th scope="col">Gebruikersnaam</th><th scope="col">Rol</th><th scope="col">Status</th><th scope="col">Laatst ingelogd</th><th scope="col"><span class="visually-hidden">Acties</span></th></tr>
        </thead>
        <tbody>
        <?php foreach ($users as $u): $isMe = (int) $u['id'] === (int) $me['id']; ?>
            <tr>
                <td><?= e($u['display_name']) ?><?= $isMe ? ' <span class="tag">jij</span>' : '' ?></td>
                <td><?= e($u['username']) ?></td>
                <td><?= e($u['role'] === 'admin' ? 'Beheerder' : 'Redacteur') ?></td>
                <td><?= (int) $u['is_active'] ? '<span class="ok-text">Actief</span>' : '<span class="warn-text">Uitgeschakeld</span>' ?></td>
                <td><?= $u['last_login_at'] ? e(date('d-m-Y H:i', strtotime($u['last_login_at']))) : '<span class="muted">nog nooit</span>' ?></td>
                <td class="actions">
                    <a class="btn btn-small" href="?page=user_form&amp;id=<?= (int) $u['id'] ?>">Bewerken</a>
                    <?php if (!$isMe): ?>
                        <form method="post" action="?page=user_reset" class="inline" data-confirm="Een nieuw tijdelijk wachtwoord maken voor <?= e($u['display_name']) ?>? Het oude wachtwoord werkt daarna niet meer.">
                            <?= Csrf::field() ?>
                            <input type="hidden" name="id" value="<?= (int) $u['id'] ?>">
                            <button type="submit" class="btn btn-small">Wachtwoord resetten</button>
                        </form>
                        <form method="post" action="?page=user_delete" class="inline" data-confirm="<?= e($u['display_name']) ?> verwijderen? Diegene kan daarna niet meer inloggen.">
                            <?= Csrf::field() ?>
                            <input type="hidden" name="id" value="<?= (int) $u['id'] ?>">
                            <button type="submit" class="btn btn-small btn-danger-ghost">Verwijderen</button>
                        </form>
                    <?php endif; ?>
                </td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
</div>
