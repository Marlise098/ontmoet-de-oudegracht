<?php
declare(strict_types=1);

namespace App\Services;

use App\Repositories\ActivityRepository;
use App\Repositories\UserRepository;

/**
 * Inloggen, uitloggen en rechten in het CMS.
 */
final class Auth
{
    private static ?array $user = null;

    /** Start een veilige sessie. */
    public static function startSession(string $name): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }
        $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
        session_name($name);
        session_set_cookie_params([
            'lifetime' => 0,
            'path'     => '/',
            'secure'   => $secure,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        ini_set('session.use_strict_mode', '1');
        session_start();

        // Sessie verloopt na 2 uur zonder activiteit
        $now = time();
        if (isset($_SESSION['last_seen']) && $now - $_SESSION['last_seen'] > 7200) {
            $_SESSION = [];
            session_regenerate_id(true);
            flash('info', 'Je was een tijd niet actief en bent uitgelogd. Log opnieuw in.');
        }
        $_SESSION['last_seen'] = $now;
    }

    /**
     * Probeert in te loggen. Geeft null bij succes, anders een foutmelding.
     */
    public static function attempt(string $username, string $password, array $security): ?string
    {
        $username = strtolower(trim($username));
        if ($username === '' || $password === '') {
            return 'Vul je gebruikersnaam en wachtwoord in.';
        }
        if (ActivityRepository::failedLogins($username, $security['lockout_minutes']) >= $security['max_login_attempts']) {
            return 'Te veel mislukte pogingen. Probeer het over ' . $security['lockout_minutes'] . ' minuten opnieuw.';
        }

        $user = UserRepository::findByUsername($username);
        // Ook bij een onbekende gebruiker een hash controleren, zodat de responstijd gelijk blijft
        $hash = $user['password_hash'] ?? '$2y$10$zincI8bhb50TJDESoxQN0.Kc0dsch.j7ZS9qIcLsQDYSkoVDNdL0W';
        $valid = password_verify($password, $hash);

        if (!$user || !$valid || !(int) $user['is_active']) {
            ActivityRepository::log('login_failed', 'Mislukte inlogpoging', ['id' => null, 'username' => $username]);
            return 'De gebruikersnaam of het wachtwoord klopt niet.';
        }

        if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
            UserRepository::setPassword((int) $user['id'], $password, (bool) $user['must_change_pw']);
        }

        session_regenerate_id(true);
        $_SESSION['user_id'] = (int) $user['id'];
        UserRepository::touchLogin((int) $user['id']);
        ActivityRepository::log('login', '', $user);
        self::$user = null;
        return null;
    }

    public static function logout(): void
    {
        $user = self::user();
        if ($user) {
            ActivityRepository::log('logout', '', $user);
        }
        $_SESSION = [];
        session_regenerate_id(true);
    }

    /** De ingelogde gebruiker, of null. */
    public static function user(): ?array
    {
        if (self::$user !== null) {
            return self::$user;
        }
        $id = $_SESSION['user_id'] ?? null;
        if (!$id) {
            return null;
        }
        $user = UserRepository::find((int) $id);
        if (!$user || !(int) $user['is_active']) {
            unset($_SESSION['user_id']);
            return null;
        }
        unset($user['password_hash']);
        return self::$user = $user;
    }

    public static function isAdmin(): bool
    {
        return (self::user()['role'] ?? '') === 'admin';
    }
}
