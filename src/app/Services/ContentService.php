<?php
declare(strict_types=1);

namespace App\Services;

use App\Repositories\ImageRepository;
use App\Repositories\LocationRepository;
use App\Repositories\RouteRepository;
use App\Repositories\SettingRepository;

/**
 * Stelt alle inhoud samen die de bezoekers-app nodig heeft, in beide talen.
 */
final class ContentService
{
    /** Alle gepubliceerde inhoud voor de bezoekers-app (wordt als JSON in de pagina gezet). */
    public static function forVisitors(): array
    {
        $settings = SettingRepository::all();
        $imagesByLocation = ImageRepository::groupedByLocation();

        $locations = [];
        foreach (LocationRepository::all(true) as $location) {
            $id = (int) $location['id'];
            $locations[] = [
                'id'     => $id,
                'code'   => $location['code'],
                'time'   => (float) $location['start_time'],
                'lat'    => (float) $location['lat'],
                'lng'    => (float) $location['lng'],
                'title'  => self::bothLanguages($location, 'title'),
                'text'   => self::bothLanguages($location, 'text'),
                'images' => array_map(static fn (array $image): array => [
                    'src'     => $image['image_url'],
                    'source'  => $image['source_url'],
                    'caption' => self::bothLanguages($image, 'caption'),
                    'credit'  => $image['credit'],
                    'catalog' => $image['catalog_number'],
                    'license' => $image['license'],
                ], $imagesByLocation[$id] ?? []),
            ];
        }

        $route = array_map(static fn (array $point): array => [
            't'   => (float) $point['time_sec'],
            'lat' => (float) $point['lat'],
            'lng' => (float) $point['lng'],
        ], RouteRepository::all());

        return [
            'texts' => [
                'title'      => self::bothLanguages($settings, 'site_title'),
                'subtitle'   => self::bothLanguages($settings, 'subtitle'),
                'introTitle' => self::bothLanguages($settings, 'intro_title'),
                'introText'  => self::bothLanguages($settings, 'intro_text'),
                'aboutHua'   => self::bothLanguages($settings, 'about_hua'),
                'aboutApp'   => self::bothLanguages($settings, 'about_app'),
            ],
            'makers'      => $settings['makers'],
            'contact'     => $settings['contact'],
            'filmCredit'  => $settings['film_credit'],
            'video'       => ['src' => $settings['video_url'], 'poster' => $settings['video_poster']],
            'idleTimeout' => (int) $settings['idle_timeout'],
            'locations'   => $locations,
            'route'       => $route,
        ];
    }

    /**
     * Zet de velden {$field}_nl en {$field}_en om naar ['nl' => ..., 'en' => ...].
     * Is de Engelse tekst leeg, dan wordt de Nederlandse tekst gebruikt.
     */
    private static function bothLanguages(array $row, string $field): array
    {
        $dutch = $row[$field . '_nl'] ?? '';
        $english = $row[$field . '_en'] ?? '';
        return ['nl' => $dutch, 'en' => $english !== '' ? $english : $dutch];
    }
}
