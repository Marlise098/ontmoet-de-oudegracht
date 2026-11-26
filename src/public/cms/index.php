<?php
/**
 * CMS 'Ontmoet de Oudegracht': de enige ingang voor alle beheerpagina's.
 */
declare(strict_types=1);

require __DIR__ . '/../../app/bootstrap.php';

use App\Cms\Controller;
use App\Services\Auth;

Auth::startSession($config['security']['session_name']);

header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('Cache-Control: no-store');

(new Controller($config))->handle((string) ($_GET['page'] ?? 'dashboard'));
