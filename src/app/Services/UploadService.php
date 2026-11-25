<?php
declare(strict_types=1);

namespace App\Services;

use RuntimeException;

/**
 * Veilig uploaden van afbeeldingen.
 * - controleert het echte bestandstype (niet alleen de extensie)
 * - maakt een nieuwe, willekeurige bestandsnaam
 * - verkleint grote foto's zodat ze snel laden op het digibord
 */
final class UploadService
{
    public function __construct(private array $config)
    {
    }

    /** Is er een bestand meegestuurd in dit veld? */
    public static function hasFile(string $field): bool
    {
        return isset($_FILES[$field]) && ($_FILES[$field]['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE;
    }

    /**
     * Slaat de upload op en geeft het pad terug (bijv. "uploads/2026/ab12cd.jpg").
     * @throws RuntimeException met een begrijpelijke melding
     */
    public function storeImage(string $field): string
    {
        $file = $_FILES[$field] ?? null;
        if (!$file || !is_array($file)) {
            throw new RuntimeException('Er is geen bestand ontvangen.');
        }
        if ($file['error'] === UPLOAD_ERR_INI_SIZE || $file['error'] === UPLOAD_ERR_FORM_SIZE) {
            throw new RuntimeException('Het bestand is te groot. Kies een afbeelding kleiner dan ' . $this->maxMb() . ' MB.');
        }
        if ($file['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
            throw new RuntimeException('Het uploaden is mislukt. Probeer het opnieuw.');
        }
        if ($file['size'] > $this->config['max_bytes']) {
            throw new RuntimeException('Het bestand is te groot. Kies een afbeelding kleiner dan ' . $this->maxMb() . ' MB.');
        }

        $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']) ?: '';
        $extension = $this->config['mime'][$mime] ?? null;
        if ($extension === null || @getimagesize($file['tmp_name']) === false) {
            throw new RuntimeException('Dit bestandstype wordt niet ondersteund. Gebruik een JPG-, PNG- of WebP-afbeelding.');
        }

        $subdir = date('Y');
        $dir = rtrim($this->config['dir'], '/') . '/' . $subdir;
        if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
            throw new RuntimeException('De uploadmap kon niet worden aangemaakt. Neem contact op met de beheerder.');
        }

        $name = bin2hex(random_bytes(10)) . '.' . $extension;
        $target = $dir . '/' . $name;

        if (!$this->resizeInto($file['tmp_name'], $target, $mime) && !move_uploaded_file($file['tmp_name'], $target)) {
            throw new RuntimeException('Het bestand kon niet worden opgeslagen.');
        }
        @chmod($target, 0644);

        return $this->config['url'] . '/' . $subdir . '/' . $name;
    }

    /** Verwijdert een eerder geüploade afbeelding (alleen binnen de uploadmap). */
    public function delete(string $path): void
    {
        $prefix = $this->config['url'] . '/';
        if (!str_starts_with($path, $prefix)) {
            return; // externe afbeelding: niets te verwijderen
        }
        $full = realpath(rtrim($this->config['dir'], '/') . '/' . substr($path, strlen($prefix)));
        $base = realpath($this->config['dir']);
        if ($full && $base && str_starts_with($full, $base) && is_file($full)) {
            @unlink($full);
        }
    }

    /** Verkleint naar max. 1600 px breed. Geeft false als dat niet kan (dan wordt het origineel gebruikt). */
    private function resizeInto(string $source, string $target, string $mime): bool
    {
        if (!function_exists('imagecreatetruecolor')) {
            return false;
        }
        [$width, $height] = getimagesize($source) ?: [0, 0];
        $max = 1600;
        if ($width <= $max && $height <= $max) {
            return false;
        }
        $image = match ($mime) {
            'image/jpeg' => @imagecreatefromjpeg($source),
            'image/png'  => @imagecreatefrompng($source),
            'image/webp' => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($source) : false,
            default      => false,
        };
        if (!$image) {
            return false;
        }
        $ratio = min($max / $width, $max / $height);
        $resized = imagescale($image, (int) round($width * $ratio), (int) round($height * $ratio));
        if (!$resized) {
            return false;
        }
        $ok = match ($mime) {
            'image/jpeg' => imagejpeg($resized, $target, 85),
            'image/png'  => imagepng($resized, $target, 6),
            'image/webp' => imagewebp($resized, $target, 85),
        };
        return $ok;
    }

    private function maxMb(): int
    {
        return (int) floor($this->config['max_bytes'] / 1024 / 1024);
    }
}
