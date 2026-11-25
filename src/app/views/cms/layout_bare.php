<?php /** @var string $content */ ?><!doctype html>
<html lang="nl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Inloggen · CMS Ontmoet de Oudegracht</title>
    <link rel="icon" href="../assets/img/logo-hua.svg" type="image/svg+xml">
    <link rel="stylesheet" href="../assets/css/cms.css">
</head>
<body class="cms cms-bare">
<main id="main" class="bare-main">
    <?php foreach (take_flashes() as $flash): ?>
        <div class="flash flash-<?= e($flash['type']) ?>" role="status"><?= e($flash['message']) ?></div>
    <?php endforeach; ?>
    <?= $content ?>
</main>
</body>
</html>
