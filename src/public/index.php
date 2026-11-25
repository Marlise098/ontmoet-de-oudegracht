<?php
/**
 * Bezoekers-app 'Ontmoet de Oudegracht' (digibord / iPad / browser).
 */
declare(strict_types=1);

require __DIR__ . '/../app/bootstrap.php';

use App\Services\ContentService;

$content = ContentService::forVisitors();

/** Versienummer voor CSS/JS, zodat het digibord na een update niet de oude versie toont. */
$asset = static function (string $path): string {
    $file = __DIR__ . '/' . $path;
    return $path . (is_file($file) ? '?v=' . filemtime($file) : '');
};

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

require __DIR__ . '/../app/views/app/index.php';
