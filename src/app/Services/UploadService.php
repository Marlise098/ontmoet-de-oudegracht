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
    /** Grotere foto's worden verkleind tot maximaal zoveel pixels breed of hoog. */
    private const MAX_IMAGE_SIZE = 1600;

    /** Kwaliteit bij het opnieuw opslaan van JPG- en WebP-bestanden (0 tot 100). */
    private const JPEG_QUALITY = 85;

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
            throw $this->tooLarge();
        }
        if ($file['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
            throw new RuntimeException('Het uploaden is mislukt. Probeer het opnieuw.');
        }
        if ($file['size'] > $this->config['max_bytes']) {
            throw $this->tooLarge();
        }

        // Het echte bestandstype controleren, niet alleen de extensie

        $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']) ?: '';
        $extension = $this->config['mime'][$mime] ?? null;
        if ($extension === null || @getimagesize($file['tmp_name']) === false) {
            throw new RuntimeException('Dit bestandstype wordt niet ondersteund. Gebruik een JPG-, PNG- of WebP-afbeelding.');
        }

        // Per jaar een eigen map, bijvoorbeeld uploads/2026
        $yearFolder = date('Y');
        $dir = rtrim($this->config['dir'], '/') . '/' . $yearFolder;
        if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
            throw new RuntimeException('De uploadmap kon niet worden aangemaakt. Neem contact op met de beheerder.');
        }

        // Willekeurige naam, zodat niemand een bestaand bestand kan overschrijven of raden
        $name = bin2hex(random_bytes(10)) . '.' . $extension;
        $target = $dir . '/' . $name;

        // Eerst proberen te verkleinen; lukt dat niet (of is het niet nodig), dan het origineel opslaan
        if (!$this->resizeInto($file['tmp_name'], $target, $mime) && !move_uploaded_file($file['tmp_name'], $target)) {
            throw new RuntimeException('Het bestand kon niet worden opgeslagen.');
        }
        @chmod($target, 0644);

        return $this->config['url'] . '/' . $yearFolder . '/' . $name;
    }

    /** Verwijdert een eerder geuploade afbeelding (alleen binnen de uploadmap). */
    public function delete(string $path): void
    {
        $prefix = $this->config['url'] . '/';
        if (!str_starts_with($path, $prefix)) {
            return; // externe afbeelding: niets te verwijderen
        }
        // realpath() lost '..' op; zo kan een pad nooit buiten de uploadmap uitkomen
        $file = realpath(rtrim($this->config['dir'], '/') . '/' . substr($path, strlen($prefix)));
        $uploadDir = realpath($this->config['dir']);
        if ($file && $uploadDir && str_starts_with($file, $uploadDir) && is_file($file)) {
            @unlink($file);
        }
    }

    /**
     * Verkleint een foto tot maximaal MAX_IMAGE_SIZE pixels en slaat hem op in $target.
     * Geeft false als verkleinen niet nodig is of niet lukt; dan wordt het origineel gebruikt.
     */
    private function resizeInto(string $source, string $target, string $mime): bool
    {
        if (!function_exists('imagecreatetruecolor')) {
            return false; // GD-extensie ontbreekt
        }
        [$width, $height] = getimagesize($source) ?: [0, 0];
        $max = self::MAX_IMAGE_SIZE;
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
        return match ($mime) {
            'image/jpeg' => imagejpeg($resized, $target, self::JPEG_QUALITY),
            'image/png'  => imagepng($resized, $target, 6),
            'image/webp' => imagewebp($resized, $target, self::JPEG_QUALITY),
        };
    }

    /** Foutmelding voor een te groot bestand, met de toegestane grootte in MB. */
    private function tooLarge(): RuntimeException
    {
        $maxMb = (int) floor($this->config['max_bytes'] / 1024 / 1024);
        return new RuntimeException('Het bestand is te groot. Kies een afbeelding kleiner dan ' . $maxMb . ' MB.');
    }
}
