<?php
/**
 * Kleine hulpfuncties die overal gebruikt worden.
 */
declare(strict_types=1);

/** HTML-veilig maken (tegen XSS). */
function e(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** Doorsturen naar een andere pagina en stoppen. */
function redirect(string $url): never
{
    header('Location: ' . $url);
    exit;
}

/** Flash-melding opslaan voor de volgende pagina (succes/fout). */
function flash(string $type, string $message): void
{
    $_SESSION['flash'][] = ['type' => $type, 'message' => $message];
}

/** Flash-meldingen ophalen (en wissen). */
function take_flashes(): array
{
    $messages = $_SESSION['flash'] ?? [];
    unset($_SESSION['flash']);
    return $messages;
}

/** Formulierwaarde van een vorige (mislukte) poging ophalen. */
function old(string $key, mixed $default = ''): mixed
{
    return $_SESSION['old'][$key] ?? $default;
}

/** Seconden als m:ss tonen, bijvoorbeeld 84 -> "1:24". */
function format_time(float|int|string $seconds): string
{
    $s = max(0, (int) round((float) $seconds));
    return sprintf('%d:%02d', intdiv($s, 60), $s % 60);
}

/** "1:24" of "84" of "1:24.5" omzetten naar seconden. Geeft null bij ongeldige invoer. */
function parse_time(string $input): ?float
{
    $input = trim(str_replace(',', '.', $input));
    if ($input === '') {
        return null;
    }
    if (preg_match('/^(\d{1,3}):([0-5]?\d(?:\.\d+)?)$/', $input, $m)) {
        return (int) $m[1] * 60 + (float) $m[2];
    }
    if (preg_match('/^\d+(?:\.\d+)?$/', $input)) {
        return (float) $input;
    }
    return null;
}

/** Tekst inkorten voor overzichten. */
function excerpt(string $text, int $length = 120): string
{
    $text = trim(preg_replace('/\s+/', ' ', $text) ?? '');
    return mb_strlen($text) > $length ? rtrim(mb_substr($text, 0, $length - 1)) . '…' : $text;
}

/** Is dit een geldige http(s)-URL of een pad binnen de site? */
function is_safe_url(string $url): bool
{
    if ($url === '') {
        return false;
    }
    if (str_starts_with($url, '/') && !str_starts_with($url, '//')) {
        return true;
    }
    if (str_starts_with($url, 'uploads/')) {
        return true;
    }
    return (bool) filter_var($url, FILTER_VALIDATE_URL) && preg_match('#^https?://#i', $url);
}
