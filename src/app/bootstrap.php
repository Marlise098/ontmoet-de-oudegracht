<?php
/**
 * Startpunt voor elke pagina: laadt configuratie, klassen en foutafhandeling.
 */
declare(strict_types=1);

define('APP_ROOT', __DIR__);

$config = require __DIR__ . '/config.php';

date_default_timezone_set($config['app']['timezone']);
mb_internal_encoding('UTF-8');

$isDev = $config['app']['env'] === 'development';
ini_set('display_errors', $isDev ? '1' : '0');
error_reporting(E_ALL);

// Eenvoudige autoloader voor de klassen in app/ (namespace App\...)
spl_autoload_register(static function (string $class): void {
    $prefix = 'App\\';
    if (strncmp($class, $prefix, strlen($prefix)) !== 0) {
        return;
    }
    $file = __DIR__ . '/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
    if (is_file($file)) {
        require $file;
    }
});

require __DIR__ . '/helpers.php';

App\Database::configure($config['db']);

// Onverwachte fouten: netjes loggen en een vriendelijke melding tonen
set_exception_handler(static function (Throwable $e) use ($isDev): void {
    error_log('[oudegracht] ' . $e::class . ': ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    if (!headers_sent()) {
        http_response_code(500);
    }
    $wantsJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json')
        || str_contains($_SERVER['SCRIPT_NAME'] ?? '', '/api/');
    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Er ging iets mis op de server.'] + ($isDev ? ['detail' => $e->getMessage()] : []));
        return;
    }
    $detail = $isDev ? '<pre>' . e($e->getMessage() . "\n" . $e->getTraceAsString()) . '</pre>' : '';
    echo '<!doctype html><html lang="nl"><meta charset="utf-8"><title>Er ging iets mis</title>'
        . '<body style="font-family:Arial,sans-serif;padding:2rem;max-width:40rem">'
        . '<h1>Er ging iets mis</h1><p>Probeer het over een paar seconden opnieuw. '
        . 'Blijft dit gebeuren? Neem dan contact op met de beheerder.</p>' . $detail . '</body></html>';
});
