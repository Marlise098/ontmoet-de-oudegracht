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

    public static function create(int $locationId, array $data): int
    {
        $next = (int) Database::value('SELECT COALESCE(MAX(sort_order), 0) + 1 FROM images WHERE location_id = ?', [$locationId]);
        Database::run(
            'INSERT INTO images (location_id, image_url, source_url, caption_nl, caption_en, credit, catalog_number, license, sort_order, created_at)
             VALUES (:location_id, :image_url, :source_url, :caption_nl, :caption_en, :credit, :catalog_number, :license, :sort_order, :created_at)',
            $data + ['location_id' => $locationId, 'sort_order' => $next, 'created_at' => Database::now()]
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

    /** Verplaatst een afbeelding één plek omhoog (-1) of omlaag (+1). */
    public static function move(int $id, int $direction): void
    {
        $image = self::find($id);
        if (!$image) {
            return;
        }
        $siblings = self::forLocation((int) $image['location_id']);
        $ids = array_map(static fn ($r) => (int) $r['id'], $siblings);
        $pos = array_search($id, $ids, true);
        $target = $pos + ($direction < 0 ? -1 : 1);
        if ($pos === false || $target < 0 || $target >= count($ids)) {
            return;
        }
        [$ids[$pos], $ids[$target]] = [$ids[$target], $ids[$pos]];
        Database::transaction(static function () use ($ids): void {
            foreach ($ids as $i => $imageId) {
                Database::run('UPDATE images SET sort_order = ? WHERE id = ?', [$i + 1, $imageId]);
            }
        });
    }

    /** Controleert de invoer. image_url mag leeg zijn als er een upload is. */
    public static function validate(array $input, bool $hasUpload): array
    {
        $errors = [];
        $data = [
            'image_url'      => trim((string) ($input['image_url'] ?? '')),
            'source_url'     => trim((string) ($input['source_url'] ?? '')),
            'caption_nl'     => trim((string) ($input['caption_nl'] ?? '')),
            'caption_en'     => trim((string) ($input['caption_en'] ?? '')),
            'credit'         => trim((string) ($input['credit'] ?? '')),
            'catalog_number' => trim((string) ($input['catalog_number'] ?? '')),
            'license'        => trim((string) ($input['license'] ?? '')),
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
        foreach (['caption_nl' => 500, 'caption_en' => 500, 'credit' => 255, 'catalog_number' => 50, 'license' => 50] as $field => $max) {
            if (mb_strlen($data[$field]) > $max) {
                $errors[$field] = "Maximaal $max tekens.";
            }
        }
        $data['source_url'] = $data['source_url'] === '' ? null : $data['source_url'];
        return [$data, $errors];
    }
}
