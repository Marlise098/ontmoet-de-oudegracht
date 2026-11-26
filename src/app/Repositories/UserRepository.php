<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Database;

/**
 * Gebruikers van het CMS.
 */
final class UserRepository
{
    public const ROLES = [
        'admin'  => 'Beheerder (alles, ook gebruikers)',
        'editor' => 'Redacteur (inhoud bewerken)',
    ];

    public static function all(): array
    {
        return Database::all('SELECT id, username, display_name, role, is_active, last_login_at, created_at FROM users ORDER BY display_name');
    }

    public static function find(int $id): ?array
    {
        return Database::one('SELECT * FROM users WHERE id = ?', [$id]);
    }

    public static function findByUsername(string $username): ?array
    {
        return Database::one('SELECT * FROM users WHERE username = ?', [$username]);
    }

    public static function countActiveAdmins(): int
    {
        return (int) Database::value("SELECT COUNT(*) FROM users WHERE role = 'admin' AND is_active = 1");
    }

    public static function create(array $data, string $password): int
    {
        Database::run(
            'INSERT INTO users (username, display_name, password_hash, role, is_active, must_change_pw, created_at)
             VALUES (?, ?, ?, ?, ?, 1, ?)',
            [$data['username'], $data['display_name'], password_hash($password, PASSWORD_DEFAULT), $data['role'], $data['is_active'], Database::now()]
        );
        return Database::lastId();
    }

    public static function update(int $id, array $data): void
    {
        Database::run(
            'UPDATE users SET username = ?, display_name = ?, role = ?, is_active = ? WHERE id = ?',
            [$data['username'], $data['display_name'], $data['role'], $data['is_active'], $id]
        );
    }

    public static function setPassword(int $id, string $password, bool $mustChange = false): void
    {
        Database::run(
            'UPDATE users SET password_hash = ?, must_change_pw = ? WHERE id = ?',
            [password_hash($password, PASSWORD_DEFAULT), $mustChange ? 1 : 0, $id]
        );
    }

    /** Slaat het moment van inloggen op. */
    public static function touchLogin(int $id): void
    {
        Database::run('UPDATE users SET last_login_at = ? WHERE id = ?', [Database::now(), $id]);
    }

    public static function delete(int $id): void
    {
        Database::run('DELETE FROM users WHERE id = ?', [$id]);
    }

    /**
     * Wachtwoordregels: minstens 10 tekens, met een letter en een cijfer.
     * Geeft de foutmelding terug, of null als het wachtwoord goed is.
     */
    public static function passwordProblem(string $password): ?string
    {
        if (mb_strlen($password) < 10) {
            return 'Het wachtwoord moet minstens 10 tekens lang zijn.';
        }
        if (!preg_match('/[A-Za-z]/', $password) || !preg_match('/\d/', $password)) {
            return 'Gebruik in het wachtwoord minstens één letter en één cijfer.';
        }
        return null;
    }

    /**
     * Controleert de invoer. Geeft [schone data, foutmeldingen per veld] terug.
     * $existingId is de gebruiker die bewerkt wordt (null bij een nieuwe gebruiker).
     */
    public static function validate(array $input, ?int $existingId): array
    {
        $errors = [];
        $data = [
            'username'     => strtolower(input_text($input, 'username')),
            'display_name' => input_text($input, 'display_name'),
            'role'         => (string) ($input['role'] ?? 'editor'),
            'is_active'    => !empty($input['is_active']) ? 1 : 0,
        ];
        if (!preg_match('/^[a-z0-9._-]{3,50}$/', $data['username'])) {
            $errors['username'] = 'Gebruik 3 tot 50 tekens: kleine letters, cijfers, punt, streepje of underscore.';
        } else {
            $sameName = self::findByUsername($data['username']);
            if ($sameName && (int) $sameName['id'] !== $existingId) {
                $errors['username'] = 'Deze gebruikersnaam bestaat al.';
            }
        }
        if ($data['display_name'] === '') {
            $errors['display_name'] = 'Vul een naam in.';
        }
        if (!array_key_exists($data['role'], self::ROLES)) {
            $errors['role'] = 'Kies een rol.';
        }
        return [$data, $errors];
    }
}
