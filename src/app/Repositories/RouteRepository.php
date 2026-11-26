<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Database;

/**
 * Routepunten van de boot: waar is de boot op welk moment in de film.
 */
final class RouteRepository
{
    public static function all(): array
    {
        return Database::all('SELECT * FROM route_points ORDER BY time_sec ASC, id ASC');
    }

    /**
     * Vervangt alle routepunten in een keer (het formulier stuurt de hele lijst).
     * @param array<int, array{time_sec: float, lat: float, lng: float}> $points
     */
    public static function replaceAll(array $points): void
    {
        Database::transaction(static function () use ($points): void {
            Database::run('DELETE FROM route_points');
            foreach ($points as $point) {
                Database::run('INSERT INTO route_points (time_sec, lat, lng) VALUES (?, ?, ?)', [$point['time_sec'], $point['lat'], $point['lng']]);
            }
        });
    }

    /**
     * Leest de rijen uit het formulier en controleert ze.
     * Geeft [routepunten gesorteerd op tijd, foutmeldingen] terug.
     */
    public static function validate(array $times, array $lats, array $lngs): array
    {
        $points = [];
        $errors = [];
        foreach ($times as $index => $rawTime) {
            $rawTime = trim((string) $rawTime);
            $lat = filter_var($lats[$index] ?? '', FILTER_VALIDATE_FLOAT);
            $lng = filter_var($lngs[$index] ?? '', FILTER_VALIDATE_FLOAT);
            if ($rawTime === '' && $lat === false && $lng === false) {
                continue; // lege rij overslaan
            }
            $row = $index + 1;
            $time = parse_time($rawTime);
            if ($time === null) {
                $errors[] = "Rij $row: vul een tijd in zoals 1:24.";
                continue;
            }
            if ($lat === false || $lng === false) {
                $errors[] = "Rij $row: kies een plek op de kaart.";
                continue;
            }
            $points[] = ['time_sec' => $time, 'lat' => round($lat, 6), 'lng' => round($lng, 6)];
        }
        if (count($points) < 2) {
            $errors[] = 'Er zijn minstens twee routepunten nodig (begin en eind).';
        }
        usort($points, static fn (array $a, array $b): int => $a['time_sec'] <=> $b['time_sec']);
        return [$points, $errors];
    }
}
