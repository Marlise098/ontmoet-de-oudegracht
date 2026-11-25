<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Database;

/**
 * Logboek van acties in het CMS.
 */
final class ActivityRepository
{
    public static function log(string $action, string $details = '', ?array $user = null): void
    {
        Database::run(
            'INSERT INTO activity_log (user_id, username, action, details, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [
                $user['id'] ?? null,
                $user['username'] ?? '',
                $action,
                mb_substr($details, 0, 255),
                substr((string) ($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45),
                Database::now(),
            ]
        );
    }

    public static function recent(int $limit = 15): array
    {
        $limit = max(1, min(100, $limit));
        return Database::all(
            "SELECT * FROM activity_log WHERE action NOT IN ('login_failed') ORDER BY created_at DESC, id DESC LIMIT $limit"
        );
    }

    /** Aantal mislukte inlogpogingen voor een gebruikersnaam in de afgelopen minuten. */
    public static function failedLogins(string $username, int $minutes): int
    {
        $since = date('Y-m-d H:i:s', time() - $minutes * 60);
        return (int) Database::value(
            "SELECT COUNT(*) FROM activity_log WHERE action = 'login_failed' AND username = ? AND created_at >= ?",
            [$username, $since]
        );
    }

    /** Leesbare omschrijving van een actie. */
    public static function label(string $action): string
    {
        return [
            'login'            => 'Ingelogd',
            'logout'           => 'Uitgelogd',
            'location_create'  => 'Locatie toegevoegd',
            'location_update'  => 'Locatie gewijzigd',
            'location_delete'  => 'Locatie verwijderd',
            'location_publish' => 'Zichtbaarheid gewijzigd',
            'image_create'     => 'Afbeelding toegevoegd',
            'image_update'     => 'Afbeelding gewijzigd',
            'image_delete'     => 'Afbeelding verwijderd',
            'image_move'       => 'Volgorde afbeeldingen gewijzigd',
            'route_update'     => 'Route van de boot gewijzigd',
            'settings_update'  => 'Teksten en instellingen gewijzigd',
            'user_create'      => 'Gebruiker toegevoegd',
            'user_update'      => 'Gebruiker gewijzigd',
            'user_delete'      => 'Gebruiker verwijderd',
            'password_change'  => 'Wachtwoord gewijzigd',
        ][$action] ?? $action;
    }
}
