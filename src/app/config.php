<?php
/**
 * Configuratie. Waarden komen uit omgevingsvariabelen (zie compose.yaml),
 * met verstandige standaardwaarden voor de Docker-opzet.
 */
declare(strict_types=1);

$env = static function (string $key, string $default = ''): string {
    $value = getenv($key);
    return ($value === false || $value === '') ? $default : $value;
};

return [
    'app' => [
        'env'      => $env('APP_ENV', 'production'),   // 'development' toont foutmeldingen
        'timezone' => 'Europe/Amsterdam',
    ],
    'db' => [
        'driver'   => $env('DB_DRIVER', 'mysql'),       // 'mysql' of 'sqlite' (alleen voor tests)
        'host'     => $env('DB_HOST', 'db'),
        'port'     => $env('DB_PORT', '3306'),
        'name'     => $env('DB_NAME', 'ontmoet'),
        'user'     => $env('DB_USER', 'root'),
        'pass'     => $env('DB_PASS', 'root'),
        'path'     => $env('DB_PATH', ''),              // pad naar sqlite-bestand
    ],
    'uploads' => [
        'dir'       => __DIR__ . '/../public/uploads',
        'url'       => 'uploads',
        'max_bytes' => 8 * 1024 * 1024,                 // 8 MB per afbeelding
        'mime'      => [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
        ],
    ],
    'security' => [
        'max_login_attempts' => 5,      // pogingen ...
        'lockout_minutes'    => 10,     // ... binnen zoveel minuten
        'session_name'       => 'oudegracht_cms',
    ],
];
