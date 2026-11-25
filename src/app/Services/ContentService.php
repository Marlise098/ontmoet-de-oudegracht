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
    public static function forVisitors(): array
    {
        $settings = SettingRepository::all();
        $images = ImageRepository::groupedByLocation();

        $locations = [];
        foreach (LocationRepository::all(true) as $loc) {
            $id = (int) $loc['id'];
            $locations[] = [
                'id'    => $id,
                'code'  => $loc['code'],
                'time'  => (float) $loc['start_time'],
                'lat'   => (float) $loc['lat'],
                'lng'   => (float) $loc['lng'],
                'title' => ['nl' => $loc['title_nl'], 'en' => $loc['title_en'] !== '' ? $loc['title_en'] : $loc['title_nl']],
                'text'  => ['nl' => $loc['text_nl'], 'en' => $loc['text_en'] !== '' ? $loc['text_en'] : $loc['text_nl']],
                'images' => array_map(static fn (array $img): array => [
                    'src'     => $img['image_url'],
                    'source'  => $img['source_url'],
                    'caption' => ['nl' => $img['caption_nl'], 'en' => $img['caption_en'] !== '' ? $img['caption_en'] : $img['caption_nl']],
                    'credit'  => $img['credit'],
                    'catalog' => $img['catalog_number'],
                    'license' => $img['license'],
                ], $images[$id] ?? []),
            ];
        }

        $route = array_map(static fn (array $p): array => [
            't'   => (float) $p['time_sec'],
            'lat' => (float) $p['lat'],
            'lng' => (float) $p['lng'],
        ], RouteRepository::all());

        $bilingual = static fn (string $key): array => [
            'nl' => $settings[$key . '_nl'] ?? '',
            'en' => ($settings[$key . '_en'] ?? '') !== '' ? $settings[$key . '_en'] : ($settings[$key . '_nl'] ?? ''),
        ];

        return [
            'texts' => [
                'title'      => $bilingual('site_title'),
                'subtitle'   => $bilingual('subtitle'),
                'introTitle' => $bilingual('intro_title'),
                'introText'  => $bilingual('intro_text'),
                'aboutHua'   => $bilingual('about_hua'),
                'aboutApp'   => $bilingual('about_app'),
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
}
