<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Database;

/**
 * Locaties (hotspots) langs de gracht.
 */
final class LocationRepository
{
    /** Alle locaties, gesorteerd op het moment in de film. */
    public static function all(bool $onlyPublished = false): array
    {
        $sql = 'SELECT l.*, (SELECT COUNT(*) FROM images i WHERE i.location_id = l.id) AS image_count
                FROM locations l'
            . ($onlyPublished ? ' WHERE l.is_published = 1' : '')
            . ' ORDER BY l.start_time ASC, l.code ASC';
        return Database::all($sql);
    }

    public static function find(int $id): ?array
    {
        return Database::one('SELECT * FROM locations WHERE id = ?', [$id]);
    }

    public static function count(): int
    {
        return (int) Database::value('SELECT COUNT(*) FROM locations');
    }

    public static function create(array $data): int
    {
        $now = Database::now();
        Database::run(
            'INSERT INTO locations (code, title_nl, title_en, text_nl, text_en, start_time, lat, lng, is_published, created_at, updated_at)
             VALUES (:code, :title_nl, :title_en, :text_nl, :text_en, :start_time, :lat, :lng, :is_published, :created_at, :updated_at)',
            $data + ['created_at' => $now, 'updated_at' => $now]
        );
        return Database::lastId();
    }

    public static function update(int $id, array $data): void
    {
        Database::run(
            'UPDATE locations SET code = :code, title_nl = :title_nl, title_en = :title_en, text_nl = :text_nl,
                    text_en = :text_en, start_time = :start_time, lat = :lat, lng = :lng,
                    is_published = :is_published, updated_at = :updated_at
             WHERE id = :id',
            $data + ['id' => $id, 'updated_at' => Database::now()]
        );
    }

    public static function setPublished(int $id, bool $published): void
    {
        Database::run('UPDATE locations SET is_published = ?, updated_at = ? WHERE id = ?', [$published ? 1 : 0, Database::now(), $id]);
    }

    public static function delete(int $id): void
    {
        // De afbeeldingen eerst zelf verwijderen. In MariaDB doet ON DELETE CASCADE dit ook,
        // maar zo werkt het ook in de SQLite-testdatabase.
        Database::run('DELETE FROM images WHERE location_id = ?', [$id]);
        Database::run('DELETE FROM locations WHERE id = ?', [$id]);
    }

    /**
     * Controleert de invoer uit het formulier.
     * Geeft [schone data, foutmeldingen per veld] terug.
     */
    public static function validate(array $input): array
    {
        $errors = [];
        $data = [
            'code'         => input_text($input, 'code'),
            'title_nl'     => input_text($input, 'title_nl'),
            'title_en'     => input_text($input, 'title_en'),
            'text_nl'      => input_text($input, 'text_nl'),
            'text_en'      => input_text($input, 'text_en'),
            'is_published' => !empty($input['is_published']) ? 1 : 0,
        ];

        if ($data['code'] === '') {
            $errors['code'] = 'Vul een nummer in, bijvoorbeeld 2 of 2a.';
        } elseif (mb_strlen($data['code']) > 10) {
            $errors['code'] = 'Het nummer mag maximaal 10 tekens zijn.';
        }
        if ($data['title_nl'] === '') {
            $errors['title_nl'] = 'Vul een Nederlandse titel in.';
        } elseif (mb_strlen($data['title_nl']) > 150) {
            $errors['title_nl'] = 'De titel mag maximaal 150 tekens zijn.';
        }
        if (mb_strlen($data['title_en']) > 150) {
            $errors['title_en'] = 'De titel mag maximaal 150 tekens zijn.';
        }
        if ($data['text_nl'] === '') {
            $errors['text_nl'] = 'Vul een Nederlandse tekst in.';
        }

        $time = parse_time((string) ($input['start_time'] ?? ''));
        if ($time === null) {
            $errors['start_time'] = 'Vul een tijd in zoals 1:24 (minuten:seconden).';
        } elseif ($time > 3600) {
            $errors['start_time'] = 'Deze tijd is langer dan de film.';
        }
        $data['start_time'] = $time ?? 0;

        // De plek moet in (de buurt van) de binnenstad van Utrecht liggen
        $lat = filter_var($input['lat'] ?? '', FILTER_VALIDATE_FLOAT);
        $lng = filter_var($input['lng'] ?? '', FILTER_VALIDATE_FLOAT);
        if ($lat === false || $lng === false || $lat < 52.0 || $lat > 52.2 || $lng < 5.0 || $lng > 5.25) {
            $errors['position'] = 'Tik op de kaart om de plek van dit punt te kiezen.';
        }
        $data['lat'] = $lat === false ? 0 : round($lat, 6);
        $data['lng'] = $lng === false ? 0 : round($lng, 6);

        return [$data, $errors];
    }
}
