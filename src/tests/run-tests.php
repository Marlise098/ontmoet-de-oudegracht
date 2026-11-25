<?php
/**
 * Automatische tests voor Ontmoet de Oudegracht.
 *
 * 1. Unit-tests van hulpfuncties en validatie (geen server nodig)
 * 2. End-to-end tests via HTTP tegen een draaiende server
 *
 * Gebruik (vanuit de hoofdmap van de repository):
 *   php src/tests/sqlite-setup.php /tmp/og-test.sqlite
 *   DB_DRIVER=sqlite DB_PATH=/tmp/og-test.sqlite php -S 127.0.0.1:8099 -t src/public src/public/router.php &
 *   DB_DRIVER=sqlite DB_PATH=/tmp/og-test.sqlite php src/tests/run-tests.php http://127.0.0.1:8099
 */
declare(strict_types=1);

require __DIR__ . '/../app/bootstrap.php';

use App\Repositories\ImageRepository;
use App\Repositories\LocationRepository;
use App\Repositories\RouteRepository;
use App\Repositories\SettingRepository;
use App\Repositories\UserRepository;

$base = rtrim($argv[1] ?? 'http://127.0.0.1:8099', '/');
$passed = 0;
$failed = [];

function check(string $name, bool $ok, string $extra = ''): void
{
    global $passed, $failed;
    if ($ok) {
        $passed++;
        echo "  \033[32m✓\033[0m $name\n";
    } else {
        $failed[] = $name;
        echo "  \033[31m✗ $name\033[0m" . ($extra !== '' ? " — $extra" : '') . "\n";
    }
}

/* ===================================================================
 *  1. Unit-tests
 * =================================================================== */
echo "\nHulpfuncties\n";
check('parse_time("1:24") = 84', parse_time('1:24') === 84.0);
check('parse_time("84") = 84', parse_time('84') === 84.0);
check('parse_time("1:24,5") = 84.5', parse_time('1:24,5') === 84.5);
check('parse_time("abc") is ongeldig', parse_time('abc') === null);
check('parse_time("1:75") is ongeldig', parse_time('1:75') === null);
check('format_time(136) = "2:16"', format_time(136) === '2:16');
check('e() maakt HTML onschadelijk', e('<script>"x"</script>') === '&lt;script&gt;&quot;x&quot;&lt;/script&gt;');
check('is_safe_url accepteert https', is_safe_url('https://hetutrechtsarchief.nl/beeld/1'));
check('is_safe_url weigert javascript:', !is_safe_url('javascript:alert(1)'));
check('is_safe_url weigert //andere-site', !is_safe_url('//evil.example/x.jpg'));

echo "\nValidatie\n";
[, $err] = LocationRepository::validate([]);
check('Lege plek geeft fouten voor code, titel, tekst, tijd en positie',
    isset($err['code'], $err['title_nl'], $err['text_nl'], $err['start_time'], $err['position']));
[$data, $err] = LocationRepository::validate([
    'code' => '4', 'title_nl' => 'Test', 'text_nl' => 'Tekst', 'start_time' => '2:30', 'lat' => '52.091', 'lng' => '5.120',
]);
check('Geldige plek heeft geen fouten', $err === [], json_encode($err));
check('Tijd 2:30 wordt 150 seconden', $data['start_time'] === 150.0);
[, $err] = LocationRepository::validate(['code' => '4', 'title_nl' => 'T', 'text_nl' => 'T', 'start_time' => '1:00', 'lat' => '48.85', 'lng' => '2.35']);
check('Positie buiten Utrecht wordt geweigerd', isset($err['position']));
[, $err] = ImageRepository::validate(['image_url' => 'javascript:alert(1)', 'caption_nl' => 'x'], false);
check('Afbeelding met javascript:-link wordt geweigerd', isset($err['image_url']));
[, $err] = ImageRepository::validate(['caption_nl' => ''], true);
check('Afbeelding zonder beschrijving wordt geweigerd', isset($err['caption_nl']));
check('Wachtwoord "kort1" is te kort', UserRepository::passwordProblem('kort1') !== null);
check('Wachtwoord zonder cijfer wordt geweigerd', UserRepository::passwordProblem('alleenletters') !== null);
check('Goed wachtwoord wordt geaccepteerd', UserRepository::passwordProblem('boottocht1929gracht') === null);
[, $err] = RouteRepository::validate(['0:10'], ['52.09'], ['5.12']);
check('Route met één punt wordt geweigerd', $err !== []);
[$pts, $err] = RouteRepository::validate(['1:00', '0:10'], ['52.091', '52.089'], ['5.120', '5.121']);
check('Routepunten worden op tijd gesorteerd', $err === [] && $pts[0]['time_sec'] === 10.0);
[, $err] = SettingRepository::validate(['site_title_nl' => '', 'idle_timeout' => 'abc', 'video_url' => '/media/x.mp4', 'intro_title_nl' => 'x', 'intro_text_nl' => 'x']);
check('Instellingen: lege titel en ongeldige tijd worden geweigerd', isset($err['site_title_nl'], $err['idle_timeout']));

echo "\nDatabase\n";
check('Seed bevat 8 plekken', LocationRepository::count() === 8);
check('Seed bevat 22 afbeeldingen', ImageRepository::count() === 22);
check('Alle plekken hebben een Engelse tekst', count(array_filter(LocationRepository::all(), fn ($l) => trim($l['text_en']) === '')) === 0);
$times = array_map('floatval', array_column(LocationRepository::all(), 'start_time'));
$sorted = $times;
sort($sorted);
check('Plekken zijn gesorteerd op filmtijd', $times === $sorted);

/* ===================================================================
 *  2. End-to-end via HTTP
 * =================================================================== */
echo "\nBezoekers-app ($base)\n";

$cookies = [];
function http(string $method, string $url, array $data = [], bool $follow = false): array
{
    global $cookies;
    $headers = [];
    if ($cookies) {
        $headers[] = 'Cookie: ' . implode('; ', array_map(fn ($k, $v) => "$k=$v", array_keys($cookies), $cookies));
    }
    $opts = ['http' => ['method' => $method, 'ignore_errors' => true, 'follow_location' => 0, 'header' => $headers]];
    if ($method === 'POST') {
        $opts['http']['header'][] = 'Content-Type: application/x-www-form-urlencoded';
        $opts['http']['content'] = http_build_query($data);
    }
    $body = @file_get_contents($url, false, stream_context_create($opts));
    $status = 0;
    $location = null;
    foreach ($http_response_header ?? [] as $h) {
        if (preg_match('#^HTTP/\S+ (\d+)#', $h, $m)) $status = (int) $m[1];
        if (preg_match('#^Set-Cookie: ([^=]+)=([^;]*)#i', $h, $m)) $cookies[$m[1]] = $m[2];
        if (preg_match('#^Location: (.*)$#i', $h, $m)) $location = trim($m[1]);
    }
    if ($follow && $location) {
        $next = str_starts_with($location, 'http') ? $location : preg_replace('#\?.*$#', '', $url) . $location;
        return http('GET', $next);
    }
    return ['status' => $status, 'body' => (string) $body, 'location' => $location];
}
function token(string $html): string
{
    return preg_match('/name="_token" value="([a-f0-9]+)"/', $html, $m) ? $m[1] : '';
}

$r = http('GET', "$base/");
check('Startpagina laadt (200)', $r['status'] === 200);
check('Startpagina bevat de film', str_contains($r['body'], '<video id="film"'));
check('Startpagina bevat het HUA-logo', str_contains($r['body'], 'logo-hua.svg'));
check('Startpagina bevat colofon en intro', str_contains($r['body'], 'id="colofon"') && str_contains($r['body'], 'id="intro"'));
$r = http('GET', "$base/api/content.php");
$json = json_decode($r['body'], true);
check('API geeft geldige JSON', is_array($json));
check('API bevat 8 plekken in NL en EN', count($json['locations'] ?? []) === 8 && isset($json['locations'][0]['title']['en']));
check('API bevat de route van de boot', count($json['route'] ?? []) >= 2);
$r = http('POST', "$base/api/content.php");
check('API weigert POST (405)', $r['status'] === 405);
$r = http('GET', "$base/media/oudegracht-film-v1.mp4");
check('Film is bereikbaar', $r['status'] === 200 || $r['status'] === 206);

echo "\nCMS: inloggen en beveiliging\n";
$r = http('GET', "$base/cms/?page=dashboard");
check('Zonder inloggen doorgestuurd naar login', $r['status'] === 302 && str_contains((string) $r['location'], 'page=login'));
$r = http('GET', "$base/cms/?page=login");
$tok = token($r['body']);
check('Loginformulier heeft CSRF-token', strlen($tok) === 64);
$r = http('POST', "$base/cms/?page=login", ['username' => 'beheer', 'password' => 'Oudegracht900!', '_token' => 'fout']);
check('Inloggen met verkeerd token wordt geweigerd', $r['status'] === 200 && str_contains($r['body'], 'verlopen'));
$r = http('POST', "$base/cms/?page=login", ['username' => 'beheer', 'password' => 'verkeerd', '_token' => $tok]);
check('Verkeerd wachtwoord geeft melding', str_contains($r['body'], 'klopt niet'));
$r = http('POST', "$base/cms/?page=login", ['username' => 'beheer', 'password' => 'Oudegracht900!', '_token' => $tok]);
check('Juist wachtwoord logt in', $r['status'] === 302);
$r = http('GET', "$base/cms/?page=dashboard");
check('Eerst eigen wachtwoord kiezen (doorsturen naar account)', str_contains((string) $r['location'], 'page=account'));
$r = http('POST', "$base/cms/?page=account", ['_token' => $tok, 'current_password' => 'Oudegracht900!', 'new_password' => 'kort', 'repeat_password' => 'kort']);
check('Te kort nieuw wachtwoord wordt geweigerd', str_contains($r['body'], 'minstens 10 tekens'));
$r = http('POST', "$base/cms/?page=account", ['_token' => $tok, 'current_password' => 'Oudegracht900!', 'new_password' => 'TestWachtwoord2026', 'repeat_password' => 'TestWachtwoord2026']);
check('Wachtwoord wijzigen lukt', str_contains((string) $r['location'], 'dashboard'));
foreach (['dashboard', 'locations', 'location_form', 'route', 'settings', 'users', 'help', 'account'] as $p) {
    $r = http('GET', "$base/cms/?page=$p");
    check("Pagina '$p' laadt zonder fouten", $r['status'] === 200 && !preg_match('/Fatal error|Warning:|Notice:/', $r['body']));
}
$r = http('GET', "$base/cms/?page=../../etc/passwd");
check('Onbekende pagina geeft 404', $r['status'] === 404);

echo "\nCMS: plekken beheren\n";
$r = http('POST', "$base/cms/?page=location_save", ['_token' => $tok, 'code' => '', 'title_nl' => '', 'text_nl' => '', 'start_time' => 'x']);
$r2 = http('GET', "$base/cms/?page=location_form");
check('Onvolledige plek wordt niet opgeslagen en toont fouten', str_contains($r2['body'], 'error-summary') && LocationRepository::count() === 8);
$r = http('POST', "$base/cms/?page=location_save", [
    '_token' => $tok, 'code' => '4', 'title_nl' => 'Testplek <b>vet</b>', 'title_en' => 'Test place', 'text_nl' => 'Testtekst',
    'text_en' => '', 'start_time' => '2:40', 'lat' => '52.0916', 'lng' => '5.1193', 'is_published' => '1',
]);
check('Nieuwe plek wordt opgeslagen', LocationRepository::count() === 9);
$new = array_values(array_filter(LocationRepository::all(), fn ($l) => $l['code'] === '4'))[0] ?? null;
check('Nieuwe plek staat op 2:40 in de film', $new && (float) $new['start_time'] === 160.0);
$r = http('GET', "$base/");
check('HTML in titel wordt veilig getoond in de app', !str_contains($r['body'], '<b>vet</b>') && str_contains($r['body'], 'Testplek'));
$r = http('POST', "$base/cms/?page=location_toggle", ['_token' => $tok, 'id' => $new['id']]);
$json = json_decode(http('GET', "$base/api/content.php")['body'], true);
check('Verborgen plek verdwijnt uit de app', count($json['locations']) === 8);

echo "\nCMS: afbeeldingen\n";
$r = http('POST', "$base/cms/?page=image_save", ['_token' => $tok, 'location_id' => $new['id'], 'image_url' => 'https://example.org/a.jpg', 'caption_nl' => 'Eerste']);
$r = http('POST', "$base/cms/?page=image_save", ['_token' => $tok, 'location_id' => $new['id'], 'image_url' => 'https://example.org/b.jpg', 'caption_nl' => 'Tweede', 'license' => 'CC BY 4.0']);
$imgs = ImageRepository::forLocation((int) $new['id']);
check('Twee afbeeldingen toegevoegd', count($imgs) === 2);
http('POST', "$base/cms/?page=image_move", ['_token' => $tok, 'id' => $imgs[1]['id'], 'direction' => 'up']);
$imgs = ImageRepository::forLocation((int) $new['id']);
check('Volgorde wijzigen werkt', $imgs[0]['caption_nl'] === 'Tweede');
http('POST', "$base/cms/?page=image_save", ['_token' => $tok, 'location_id' => $new['id'], 'image_url' => 'javascript:alert(1)', 'caption_nl' => 'Fout']);
check('Afbeelding met gevaarlijke link wordt geweigerd', count(ImageRepository::forLocation((int) $new['id'])) === 2);
http('POST', "$base/cms/?page=image_delete", ['_token' => $tok, 'id' => $imgs[0]['id']]);
check('Afbeelding verwijderen werkt', count(ImageRepository::forLocation((int) $new['id'])) === 1);
http('POST', "$base/cms/?page=location_delete", ['_token' => $tok, 'id' => $new['id']]);
check('Plek verwijderen verwijdert ook de afbeeldingen', LocationRepository::count() === 8 && count(ImageRepository::forLocation((int) $new['id'])) === 0);

echo "\nCMS: route, teksten en gebruikers\n";
$route = RouteRepository::all();
http('POST', "$base/cms/?page=route", ['_token' => $tok, 'time' => ['0:00', '1:00', '3:00'], 'lat' => ['52.0884', '52.0904', '52.0916'], 'lng' => ['5.1215', '5.1204', '5.1194']]);
check('Route opslaan werkt', count(RouteRepository::all()) === 3);
RouteRepository::replaceAll(array_map(fn ($p) => ['time_sec' => (float) $p['time_sec'], 'lat' => (float) $p['lat'], 'lng' => (float) $p['lng']], $route));

$settings = SettingRepository::all();
http('POST', "$base/cms/?page=settings", ['_token' => $tok, 'intro_title_nl' => 'Hallo test'] + $settings);
check('Welkomsttitel wijzigen werkt', SettingRepository::get('intro_title_nl') === 'Hallo test');
http('POST', "$base/cms/?page=settings", ['_token' => $tok] + $settings);

http('POST', "$base/cms/?page=user_save", ['_token' => $tok, 'username' => 'redacteur.test', 'display_name' => 'Test Redacteur', 'role' => 'editor', 'password' => 'Welkom2026gracht', 'is_active' => '1']);
$editor = UserRepository::findByUsername('redacteur.test');
check('Gebruiker aanmaken werkt', $editor !== null && $editor['role'] === 'editor');
$admin = UserRepository::findByUsername('beheer');
http('POST', "$base/cms/?page=user_save", ['_token' => $tok, 'id' => $admin['id'], 'username' => 'beheer', 'display_name' => 'Beheerder HUA', 'role' => 'editor', 'is_active' => '1']);
check('Laatste beheerder kan geen redacteur worden', UserRepository::findByUsername('beheer')['role'] === 'admin');
http('POST', "$base/cms/?page=user_delete", ['_token' => $tok, 'id' => $admin['id']]);
check('Je kunt jezelf niet verwijderen', UserRepository::findByUsername('beheer') !== null);
http('POST', "$base/cms/?page=user_delete", ['_token' => $tok, 'id' => $editor['id']]);
check('Gebruiker verwijderen werkt', UserRepository::findByUsername('redacteur.test') === null);

http('POST', "$base/cms/?page=logout", ['_token' => $tok]);
$r = http('GET', "$base/cms/?page=dashboard");
check('Na uitloggen geen toegang meer', str_contains((string) $r['location'], 'page=login'));

/* =================================================================== */
$total = $passed + count($failed);
echo "\n" . ($failed ? "\033[31m" : "\033[32m") . "$passed van $total tests geslaagd\033[0m\n";
if ($failed) {
    echo "Mislukt:\n - " . implode("\n - ", $failed) . "\n";
}
exit($failed ? 1 : 0);
