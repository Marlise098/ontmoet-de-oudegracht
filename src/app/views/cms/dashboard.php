<?php
/** @var array $locations  @var int $imageCount  @var int $routeCount  @var array $todo  @var array $activity */
use App\Repositories\ActivityRepository;
use App\Services\Auth;

$published = count(array_filter($locations, static fn ($l) => (int) $l['is_published']));
?>
<div class="page-head">
    <div>
        <h1>Goedendag, <?= e(Auth::user()['display_name']) ?></h1>
        <p class="lead">Hier beheer je de inhoud van de app <em>Ontmoet de Oudegracht</em>. Wijzigingen zijn direct zichtbaar op het digibord.</p>
    </div>
    <a class="btn btn-primary" href="?page=location_form">+ Nieuwe plek</a>
</div>

<section class="stats" aria-label="Cijfers">
    <a class="stat" href="?page=locations">
        <strong><?= count($locations) ?></strong>
        <span>plekken langs de gracht<br><small><?= $published ?> zichtbaar voor bezoekers</small></span>
    </a>
    <a class="stat" href="?page=locations">
        <strong><?= $imageCount ?></strong>
        <span>foto's uit het archief</span>
    </a>
    <a class="stat" href="?page=route">
        <strong><?= $routeCount ?></strong>
        <span>routepunten van de boot</span>
    </a>
</section>

<div class="grid-2">
    <section class="panel">
        <h2>Nog te doen</h2>
        <?php if (!$todo): ?>
            <p class="ok-msg">✓ Alles is ingevuld. Goed bezig!</p>
        <?php else: ?>
            <ul class="todo-list">
                <?php foreach ($todo as $item): ?>
                    <li><a href="<?= e($item['link']) ?>"><?= e($item['text']) ?></a></li>
                <?php endforeach; ?>
            </ul>
        <?php endif; ?>
    </section>

    <section class="panel">
        <h2>Snel naar</h2>
        <ul class="quick-links">
            <li><a href="?page=locations">Teksten en foto's per plek aanpassen</a></li>
            <li><a href="?page=settings">Welkomsttekst en colofon aanpassen</a></li>
            <li><a href="?page=route">Route van de boot op de kaart bijstellen</a></li>
            <li><a href="?page=help">Handleiding lezen</a></li>
        </ul>
    </section>
</div>

<section class="panel">
    <h2>Laatste wijzigingen</h2>
    <?php if (!$activity): ?>
        <p class="muted">Er is nog niets gewijzigd.</p>
    <?php else: ?>
        <table class="table">
            <thead><tr><th scope="col">Wanneer</th><th scope="col">Wie</th><th scope="col">Wat</th></tr></thead>
            <tbody>
            <?php foreach ($activity as $row): ?>
                <tr>
                    <td><?= e(date('d-m-Y H:i', strtotime($row['created_at']))) ?></td>
                    <td><?= e($row['username']) ?></td>
                    <td><?= e(ActivityRepository::label($row['action'])) ?><?= $row['details'] !== '' ? ': <span class="muted">' . e($row['details']) . '</span>' : '' ?></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
</section>
