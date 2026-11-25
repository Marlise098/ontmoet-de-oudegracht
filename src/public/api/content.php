<?php
/**
 * JSON-API met alle inhoud voor de bezoekers-app.
 * GET /api/content.php
 */
declare(strict_types=1);

require __DIR__ . '/../../app/bootstrap.php';

use App\Services\ContentService;

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    exit;
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

echo json_encode(ContentService::forVisitors(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
