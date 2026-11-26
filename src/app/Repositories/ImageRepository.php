<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Database;

/**
 * Afbeeldingen uit het archief, gekoppeld aan een locatie.
 */
final class ImageRepository
{
    public static function forLocation(int $locationId): array
    {
        return Database::all('SELECT * FROM images WHERE location_id = ? ORDER BY sort_order ASC, id ASC', [$locationId]);
    }

    /** Alle afbeeldingen, gegroepeerd per locatie-id. */
    public static function groupedByLocation(): array
    {
        $grouped = [];
        foreach (Database::all('SELECT * FROM images ORDER BY location_id, sort_order ASC, id ASC') as $row) {
            $grouped[(int) $row['location_id']][] = $row;
        }
        return $grouped;
    }

    public static function find(int $id): ?array
    {
        return Database::one('SELECT * FROM images WHERE id = ?', [$id]);
    }

    public static function count(): int
    {
        return (int) Database::value('SELECT COUNT(*) FROM images');
    }

    /** Voegt een afbeelding achteraan toe bij een locatie. */
    public static function create(int $locationId, array $data): int
    {
        $nextPosition = (int) Database::value('SELECT COALESCE(MAX(sort_order), 0) + 1 FROM images WHERE location_id = ?', [$locationId]);
        Database::run(
            'INSERT INTO images (location_id, image_url, source_url, caption_nl, caption_en, credit, catalog_number, license, sort_order, created_at)
             VALUES (:location_id, :image_url, :source_url, :caption_nl, :caption_en, :credit, :catalog_number, :license, :sort_order, :created_at)',
            $data + ['location_id' => $locationId, 'sort_order' => $nextPosition, 'created_at' => Database::now()]
        );
        return Database::lastId();
    }

    public static function update(int $id, array $data): void
    {
        Database::run(
            'UPDATE images SET image_url = :image_url, source_url = :source_url, caption_nl = :caption_nl, caption_en = :caption_en,
                    credit = :credit, catalog_number = :catalog_number, license = :license
             WHERE id = :id',
            $data + ['id' => $id]
        );
    }

    public static function delete(int $id): void
    {
        Database::run('DELETE FROM images WHERE id = ?', [$id]);
    }

    /** Verplaatst een afbeelding een plek omhoog (-1) of omlaag (+1). */
    public static function move(int $id, int $direction): void
    {
        $image = self::find($id);
        if (!$image) {
            return;
        }
        // Volgorde van alle afbeeldingen bij deze locatie, en de plek van deze afbeelding daarin
        $ids = array_map(static fn (array $row): int => (int) $row['id'], self::forLocation((int) $image['location_id']));
        $from = array_search($id, $ids, true);
        if ($from === false) {
            return;
        }
        $to = $from + ($direction < 0 ? -1 : 1);
        if ($to < 0 || $to >= count($ids)) {
            return; // staat al bovenaan of onderaan
        }
        [$ids[$from], $ids[$to]] = [$ids[$to], $ids[$from]];
        Database::transaction(static function () use ($ids): void {
            foreach ($ids as $index => $imageId) {
                Database::run('UPDATE images SET sort_order = ? WHERE id = ?', [$index + 1, $imageId]);
            }
        });
    }

    /**
     * Controleert de invoer. Geeft [schone data, foutmeldingen per veld] terug.
     * Met $hasUpload = true mag image_url leeg zijn (de afbeelding komt dan uit de upload).
     */
    public static function validate(array $input, bool $hasUpload): array
    {
        $errors = [];
        $data = [
            'image_url'      => input_text($input, 'image_url'),
            'source_url'     => input_text($input, 'source_url'),
            'caption_nl'     => input_text($input, 'caption_nl'),
            'caption_en'     => input_text($input, 'caption_en'),
            'credit'         => input_text($input, 'credit'),
            'catalog_number' => input_text($input, 'catalog_number'),
            'license'        => input_text($input, 'license'),
        ];

        if (!$hasUpload) {
            if ($data['image_url'] === '') {
                $errors['image_url'] = 'Kies een afbeelding om te uploaden of plak een link naar een afbeelding.';
            } elseif (!is_safe_url($data['image_url'])) {
                $errors['image_url'] = 'Dit is geen geldige link. Een link begint met https://';
            }
        }
        if ($data['source_url'] !== '' && !is_safe_url($data['source_url'])) {
            $errors['source_url'] = 'Dit is geen geldige link. Een link begint met https://';
        }
        if ($data['caption_nl'] === '') {
            $errors['caption_nl'] = 'Beschrijf kort wat er op de afbeelding te zien is.';
        }
        // Maximale lengte per veld, gelijk aan de kolommen in de database
        foreach (['caption_nl' => 500, 'caption_en' => 500, 'credit' => 255, 'catalog_number' => 50, 'license' => 50] as $field => $max) {
            if (mb_strlen($data[$field]) > $max) {
                $errors[$field] = "Maximaal $max tekens.";
            }
        }
        $data['source_url'] = $data['source_url'] === '' ? null : $data['source_url'];
        return [$data, $errors];
    }
}
