<?php
/**
 * Router voor de ingebouwde PHP-server (alleen voor ontwikkelen/testen).
 * Apache (Docker) gebruikt dit bestand niet.
 *
 *   php -S localhost:8000 -t src/public src/public/router.php
 */
declare(strict_types=1);

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

// /media/... komt uit de map website.prototype/media (net als de Alias in Apache)
if (str_starts_with($path, '/media/')) {
    $file = realpath(__DIR__ . '/../../website.prototype/media/' . basename($path));
    if ($file && is_file($file)) {
        $types = ['mp4' => 'video/mp4', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png'];
        $type = $types[strtolower(pathinfo($file, PATHINFO_EXTENSION))] ?? 'application/octet-stream';
        $size = filesize($file);
        header('Content-Type: ' . $type);
        header('Accept-Ranges: bytes');
        // Ondersteuning voor 'Range' zodat doorspoelen in de video werkt
        if (preg_match('/bytes=(\d*)-(\d*)/', $_SERVER['HTTP_RANGE'] ?? '', $m)) {
            $start = $m[1] === '' ? 0 : (int) $m[1];
            $end = $m[2] === '' ? $size - 1 : min((int) $m[2], $size - 1);
            http_response_code(206);
            header("Content-Range: bytes $start-$end/$size");
            header('Content-Length: ' . ($end - $start + 1));
            $fh = fopen($file, 'rb');
            fseek($fh, $start);
            $left = $end - $start + 1;
            while ($left > 0 && !feof($fh)) {
                $chunk = fread($fh, min(1 << 16, $left));
                echo $chunk;
                $left -= strlen($chunk);
            }
            fclose($fh);
            return true;
        }
        header('Content-Length: ' . $size);
        readfile($file);
        return true;
    }
    http_response_code(404);
    return true;
}

// /cms en /cms/ -> CMS
if ($path === '/cms' || $path === '/cms/') {
    require __DIR__ . '/cms/index.php';
    return true;
}

return false; // bestaande bestanden (CSS, JS, PHP) normaal serveren
