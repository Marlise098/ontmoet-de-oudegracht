<?php
/** @var string $content  @var string $title */
use App\Services\Auth;
use App\Services\Csrf;

$user = Auth::user();
$page = $_GET['page'] ?? 'dashboard';
$nav = [
    'dashboard' => ['Overzicht', ['dashboard']],
    'locations' => ['Plekken en foto\'s', ['locations', 'location_form']],
    'route'     => ['Route van de boot', ['route']],
    'settings'  => ['Teksten en instellingen', ['settings']],
];
if (Auth::isAdmin()) {
    $nav['users'] = ['Gebruikers', ['users', 'user_form']];
}
$nav['help'] = ['Handleiding', ['help']];
$asset = static function (string $path): string {
    $file = __DIR__ . '/../../../public/' . $path;
    return '../' . $path . (is_file($file) ? '?v=' . filemtime($file) : '');
};
?><!doctype html>
<html lang="nl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title><?= e($title ?? 'CMS') ?> · CMS Ontmoet de Oudegracht</title>
    <link rel="icon" href="../assets/img/logo-hua.svg" type="image/svg+xml">
    <link rel="stylesheet" href="<?= e($asset('assets/vendor/leaflet/leaflet.css')) ?>">
    <link rel="stylesheet" href="<?= e($asset('assets/css/map.css')) ?>">
    <link rel="stylesheet" href="<?= e($asset('assets/css/cms.css')) ?>">
</head>
<body class="cms">
<a class="skip-link" href="#main">Naar de inhoud</a>

<header class="cms-top">
    <a class="cms-brand" href="?page=dashboard">
        <img src="../assets/img/logo-hua.svg" alt="" width="48" height="48">
        <span><strong>Ontmoet de Oudegracht</strong><small>Beheer</small></span>
    </a>
    <div class="cms-top-actions">
        <a class="btn btn-ghost" href="../" target="_blank" rel="noopener">
            <span aria-hidden="true">↗</span> Bekijk de app
        </a>
        <?php if ($user): ?>
            <a class="cms-user" href="?page=account" title="Mijn account">
                <span class="avatar" aria-hidden="true"><?= e(mb_strtoupper(mb_substr($user['display_name'], 0, 1))) ?></span>
                <span><?= e($user['display_name']) ?></span>
            </a>
            <form method="post" action="?page=logout" class="inline">
                <?= Csrf::field() ?>
                <button type="submit" class="btn btn-ghost">Uitloggen</button>
            </form>
        <?php endif; ?>
    </div>
</header>

<div class="cms-shell">
    <nav class="cms-nav" aria-label="Hoofdmenu">
        <ul>
            <?php foreach ($nav as $key => [$label, $pages]): ?>
                <li>
                    <a href="?page=<?= e($key) ?>"<?= in_array($page, $pages, true) ? ' aria-current="page"' : '' ?>><?= e($label) ?></a>
                </li>
            <?php endforeach; ?>
        </ul>
    </nav>

    <main id="main" class="cms-main" tabindex="-1">
        <?php foreach (take_flashes() as $flash): ?>
            <div class="flash flash-<?= e($flash['type']) ?>" role="<?= $flash['type'] === 'error' ? 'alert' : 'status' ?>">
                <?= e($flash['message']) ?>
            </div>
        <?php endforeach; ?>

        <?= $content ?>
    </main>
</div>

<script src="<?= e($asset('assets/vendor/leaflet/leaflet.js')) ?>"></script>
<script src="<?= e($asset('assets/js/map-data.js')) ?>"></script>
<script src="<?= e($asset('assets/js/oudegracht-map.js')) ?>"></script>
<script src="<?= e($asset('assets/js/cms.js')) ?>"></script>
</body>
</html>
