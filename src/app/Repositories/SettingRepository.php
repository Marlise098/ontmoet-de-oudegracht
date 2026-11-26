<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Database;

/**
 * Instellingen en vaste teksten (sleutel => waarde).
 */
final class SettingRepository
{
    /**
     * Alle velden die in het CMS te bewerken zijn, met label en type.
     * 'group' bepaalt onder welk kopje het veld staat.
     */
    public const FIELDS = [
        'site_title_nl'  => ['label' => 'Titel van de app (NL)', 'type' => 'text', 'group' => 'Titel', 'required' => true],
        'site_title_en'  => ['label' => 'Titel van de app (EN)', 'type' => 'text', 'group' => 'Titel'],
        'subtitle_nl'    => ['label' => 'Ondertitel (NL)', 'type' => 'text', 'group' => 'Titel'],
        'subtitle_en'    => ['label' => 'Ondertitel (EN)', 'type' => 'text', 'group' => 'Titel'],
        'intro_title_nl' => ['label' => 'Kop van het welkomstscherm (NL)', 'type' => 'text', 'group' => 'Welkomstscherm', 'required' => true],
        'intro_title_en' => ['label' => 'Kop van het welkomstscherm (EN)', 'type' => 'text', 'group' => 'Welkomstscherm'],
        'intro_text_nl'  => ['label' => 'Tekst van het welkomstscherm (NL)', 'type' => 'textarea', 'group' => 'Welkomstscherm', 'required' => true],
        'intro_text_en'  => ['label' => 'Tekst van het welkomstscherm (EN)', 'type' => 'textarea', 'group' => 'Welkomstscherm'],
        'about_hua_nl'   => ['label' => 'Over Het Utrechts Archief (NL)', 'type' => 'textarea', 'group' => 'Colofon'],
        'about_hua_en'   => ['label' => 'Over Het Utrechts Archief (EN)', 'type' => 'textarea', 'group' => 'Colofon'],
        'about_app_nl'   => ['label' => 'Over deze applicatie (NL)', 'type' => 'textarea', 'group' => 'Colofon'],
        'about_app_en'   => ['label' => 'Over deze applicatie (EN)', 'type' => 'textarea', 'group' => 'Colofon'],
        'makers'         => ['label' => 'Makers van de applicatie', 'type' => 'text', 'group' => 'Colofon'],
        'contact'        => ['label' => 'Contactgegevens', 'type' => 'text', 'group' => 'Colofon'],
        'film_credit'    => ['label' => 'Bronvermelding van de film', 'type' => 'text', 'group' => 'Film'],
        'video_url'      => ['label' => 'Adres van het filmbestand', 'type' => 'url', 'group' => 'Film', 'required' => true,
                             'help' => 'Standaard: /media/oudegracht-film-v1.mp4'],
        'video_poster'   => ['label' => 'Stilstaand beeld voordat de film start', 'type' => 'url', 'group' => 'Film'],
        'idle_timeout'   => ['label' => 'Na hoeveel seconden zonder aanraking terug naar de wachtstand', 'type' => 'number', 'group' => 'Digibord',
                             'help' => 'Bijvoorbeeld 180 (= 3 minuten). Vul 0 in om dit uit te zetten.'],
    ];

    /** Alle instellingen. Velden die nog niet in de database staan, zijn een lege tekst. */
    public static function all(): array
    {
        $values = array_fill_keys(array_keys(self::FIELDS), '');
        foreach (Database::all('SELECT setting_key, value FROM settings') as $row) {
            $values[$row['setting_key']] = $row['value'];
        }
        return $values;
    }

    public static function get(string $key, string $default = ''): string
    {
        $value = Database::value('SELECT value FROM settings WHERE setting_key = ?', [$key]);
        return $value === null ? $default : (string) $value;
    }

    /** Slaat een instelling op. Bestaat de sleutel nog niet, dan wordt hij toegevoegd. */
    public static function set(string $key, string $value): void
    {
        // rowCount() is 0 als de sleutel ontbreekt, maar ook als de waarde niet veranderde.
        // Daarom daarna nog controleren of de sleutel echt ontbreekt.
        $updated = Database::run('UPDATE settings SET value = ? WHERE setting_key = ?', [$value, $key])->rowCount();
        if ($updated === 0 && (int) Database::value('SELECT COUNT(*) FROM settings WHERE setting_key = ?', [$key]) === 0) {
            Database::run('INSERT INTO settings (setting_key, value) VALUES (?, ?)', [$key, $value]);
        }
    }

    /** Controleert de invoer. Geeft [waarden per sleutel, foutmeldingen per veld] terug. */
    public static function validate(array $input): array
    {
        $data = [];
        $errors = [];
        foreach (self::FIELDS as $key => $field) {
            $value = input_text($input, $key);
            if (!empty($field['required']) && $value === '') {
                $errors[$key] = 'Dit veld is verplicht.';
            }
            if ($field['type'] === 'url' && $value !== '' && !is_safe_url($value)) {
                $errors[$key] = 'Vul een geldig adres in (begint met / of https://).';
            }
            if ($field['type'] === 'number' && ($value === '' || !ctype_digit($value) || (int) $value > 3600)) {
                $errors[$key] = 'Vul een heel getal in tussen 0 en 3600.';
            }
            $data[$key] = $value;
        }
        return [$data, $errors];
    }
}
