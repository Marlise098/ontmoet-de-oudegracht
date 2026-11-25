<?php
declare(strict_types=1);

namespace App\Cms;

use App\Database;
use App\Repositories\ActivityRepository;
use App\Repositories\ImageRepository;
use App\Repositories\LocationRepository;
use App\Repositories\RouteRepository;
use App\Repositories\SettingRepository;
use App\Repositories\UserRepository;
use App\Services\Auth;
use App\Services\Csrf;
use App\Services\UploadService;
use RuntimeException;

/**
 * Alle pagina's en acties van het CMS.
 * Elke actie heet zoals de 'page'-parameter in de URL (cms/?page=...).
 */
final class Controller
{
    /** Pagina's die zonder inloggen bereikbaar zijn. */
    private const PUBLIC_PAGES = ['login'];

    /** Pagina's die alleen een beheerder mag gebruiken. */
    private const ADMIN_PAGES = ['users', 'user_form', 'user_save', 'user_delete', 'user_reset'];

    private UploadService $uploads;

    public function __construct(private array $config)
    {
        $this->uploads = new UploadService($config['uploads']);
    }

    public function handle(string $page): void
    {
        if (!preg_match('/^[a-z_]+$/', $page) || !method_exists($this, 'page_' . $page)) {
            $page = 'not_found';
        }

        $user = Auth::user();
        if (!$user && !in_array($page, self::PUBLIC_PAGES, true)) {
            if ($page !== 'dashboard') {
                flash('info', 'Log eerst in om verder te gaan.');
            }
            redirect('?page=login');
        }
        if ($user && $page === 'login') {
            redirect('?page=dashboard');
        }
        // Eerst een eigen wachtwoord kiezen
        if ($user && (int) $user['must_change_pw'] && !in_array($page, ['account', 'logout'], true)) {
            flash('info', 'Kies eerst een eigen wachtwoord voordat je verdergaat.');
            redirect('?page=account');
        }
        if (in_array($page, self::ADMIN_PAGES, true) && !Auth::isAdmin()) {
            http_response_code(403);
            View::render('message', ['title' => 'Geen toegang', 'message' => 'Alleen een beheerder kan gebruikers beheren.']);
            return;
        }
        // Elk formulier moet een geldig CSRF-token hebben (login controleert dit zelf)
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && $page !== 'login' && !Csrf::valid($_POST['_token'] ?? null)) {
            flash('error', 'Het formulier was verlopen. Probeer het nog een keer.');
            redirect('?page=dashboard');
        }

        $this->{'page_' . $page}();
    }

    /* =================================================================
     *  Inloggen
     * ================================================================= */

    private function page_login(): void
    {
        $error = null;
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            if (!Csrf::valid($_POST['_token'] ?? null)) {
                $error = 'Het formulier was verlopen. Probeer het nog een keer.';
            } else {
                $error = Auth::attempt((string) ($_POST['username'] ?? ''), (string) ($_POST['password'] ?? ''), $this->config['security']);
                if ($error === null) {
                    redirect('?page=dashboard');
                }
            }
        }
        View::render('login', ['error' => $error, 'username' => (string) ($_POST['username'] ?? '')], 'layout_bare');
    }

    private function page_logout(): void
    {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            Auth::logout();
            flash('success', 'Je bent uitgelogd.');
        }
        redirect('?page=login');
    }

    /* =================================================================
     *  Overzicht
     * ================================================================= */

    private function page_dashboard(): void
    {
        $locations = LocationRepository::all();
        $images = ImageRepository::groupedByLocation();

        // Aandachtspunten zodat de redactie ziet wat er nog moet gebeuren
        $todo = [];
        foreach ($locations as $loc) {
            $id = (int) $loc['id'];
            $link = '?page=location_form&id=' . $id;
            if (trim($loc['title_en']) === '' || trim($loc['text_en']) === '') {
                $todo[] = ['text' => "Engelse vertaling ontbreekt bij {$loc['code']} {$loc['title_nl']}", 'link' => $link];
            }
            if (empty($images[$id])) {
                $todo[] = ['text' => "Nog geen afbeeldingen bij {$loc['code']} {$loc['title_nl']}", 'link' => $link . '#afbeeldingen'];
            }
            if (!(int) $loc['is_published']) {
                $todo[] = ['text' => "{$loc['code']} {$loc['title_nl']} is verborgen voor bezoekers", 'link' => $link];
            }
        }
        $noLicense = 0;
        foreach ($images as $list) {
            foreach ($list as $img) {
                if (trim($img['license']) === '') {
                    $noLicense++;
                }
            }
        }
        if ($noLicense > 0) {
            $todo[] = ['text' => "Bij $noLicense afbeelding(en) is de licentie nog niet ingevuld", 'link' => '?page=locations'];
        }

        View::render('dashboard', [
            'title'      => 'Overzicht',
            'locations'  => $locations,
            'imageCount' => ImageRepository::count(),
            'routeCount' => count(RouteRepository::all()),
            'todo'       => $todo,
            'activity'   => ActivityRepository::recent(12),
        ]);
    }

    /* =================================================================
     *  Locaties
     * ================================================================= */

    private function page_locations(): void
    {
        View::render('locations', ['title' => 'Plekken langs de gracht', 'locations' => LocationRepository::all()]);
    }

    private function page_location_form(): void
    {
        $id = (int) ($_GET['id'] ?? 0);
        $location = $id ? LocationRepository::find($id) : null;
        if ($id && !$location) {
            $this->notFound('Deze plek bestaat niet (meer).');
            return;
        }
        $settings = SettingRepository::all();
        View::render('location_form', [
            'title'     => $location ? 'Plek bewerken: ' . $location['code'] . ' ' . $location['title_nl'] : 'Nieuwe plek toevoegen',
            'location'  => $location,
            'images'    => $location ? ImageRepository::forLocation($id) : [],
            'others'    => array_values(array_filter(LocationRepository::all(), static fn ($l) => (int) $l['id'] !== $id)),
            'route'     => RouteRepository::all(),
            'videoUrl'  => $settings['video_url'],
            'errors'    => $_SESSION['errors'] ?? [],
            'editImage' => isset($_GET['image']) ? ImageRepository::find((int) $_GET['image']) : null,
        ]);
    }

    private function page_location_save(): void
    {
        $this->requirePost();
        $id = (int) ($_POST['id'] ?? 0);
        if ($id && !LocationRepository::find($id)) {
            $this->notFound('Deze plek bestaat niet (meer).');
            return;
        }
        [$data, $errors] = LocationRepository::validate($_POST);
        if ($errors) {
            $_SESSION['errors'] = $errors;
            $_SESSION['old'] = $_POST;
            flash('error', 'Niet alles is goed ingevuld. Bekijk de rode meldingen hieronder.');
            redirect('?page=location_form' . ($id ? '&id=' . $id : ''));
        }
        if ($id) {
            LocationRepository::update($id, $data);
            $this->log('location_update', $data['code'] . ' ' . $data['title_nl']);
            flash('success', 'De plek "' . $data['title_nl'] . '" is opgeslagen.');
        } else {
            $id = LocationRepository::create($data);
            $this->log('location_create', $data['code'] . ' ' . $data['title_nl']);
            flash('success', 'De plek "' . $data['title_nl'] . '" is toegevoegd. Voeg nu afbeeldingen toe.');
            redirect('?page=location_form&id=' . $id . '#afbeeldingen');
        }
        redirect('?page=location_form&id=' . $id);
    }

    private function page_location_toggle(): void
    {
        $this->requirePost();
        $location = LocationRepository::find((int) ($_POST['id'] ?? 0));
        if (!$location) {
            $this->notFound('Deze plek bestaat niet (meer).');
            return;
        }
        $publish = !(int) $location['is_published'];
        LocationRepository::setPublished((int) $location['id'], $publish);
        $this->log('location_publish', $location['code'] . ' ' . ($publish ? 'zichtbaar' : 'verborgen'));
        flash('success', '"' . $location['title_nl'] . '" is nu ' . ($publish ? 'zichtbaar' : 'verborgen') . ' voor bezoekers.');
        redirect('?page=locations');
    }

    private function page_location_delete(): void
    {
        $this->requirePost();
        $location = LocationRepository::find((int) ($_POST['id'] ?? 0));
        if (!$location) {
            $this->notFound('Deze plek bestaat niet (meer).');
            return;
        }
        $images = ImageRepository::forLocation((int) $location['id']);
        Database::transaction(static fn () => LocationRepository::delete((int) $location['id']));
        foreach ($images as $img) {
            $this->uploads->delete($img['image_url']);
        }
        $this->log('location_delete', $location['code'] . ' ' . $location['title_nl']);
        flash('success', 'De plek "' . $location['title_nl'] . '" en ' . count($images) . ' afbeelding(en) zijn verwijderd.');
        redirect('?page=locations');
    }

    /* =================================================================
     *  Afbeeldingen
     * ================================================================= */

    private function page_image_save(): void
    {
        $this->requirePost();
        $locationId = (int) ($_POST['location_id'] ?? 0);
        $imageId = (int) ($_POST['image_id'] ?? 0);
        $back = '?page=location_form&id=' . $locationId;
        if (!LocationRepository::find($locationId)) {
            $this->notFound('Deze plek bestaat niet (meer).');
            return;
        }
        $existing = $imageId ? ImageRepository::find($imageId) : null;
        if ($imageId && (!$existing || (int) $existing['location_id'] !== $locationId)) {
            $this->notFound('Deze afbeelding bestaat niet (meer).');
            return;
        }

        $hasUpload = UploadService::hasFile('upload');
        [$data, $errors] = ImageRepository::validate($_POST, $hasUpload || ($existing && trim((string) ($_POST['image_url'] ?? '')) === ''));
        if ($existing && $data['image_url'] === '' && !$hasUpload) {
            $data['image_url'] = $existing['image_url']; // bestaande afbeelding houden
        }

        if (!$errors && $hasUpload) {
            try {
                $data['image_url'] = $this->uploads->storeImage('upload');
            } catch (RuntimeException $e) {
                $errors['upload'] = $e->getMessage();
            }
        }
        if ($errors) {
            $_SESSION['errors'] = $errors;
            $_SESSION['old'] = $_POST;
            flash('error', 'De afbeelding is niet opgeslagen. Bekijk de rode meldingen.');
            redirect($back . ($imageId ? '&image=' . $imageId : '') . '#afbeelding-formulier');
        }

        if ($existing) {
            if ($existing['image_url'] !== $data['image_url']) {
                $this->uploads->delete($existing['image_url']);
            }
            ImageRepository::update($imageId, $data);
            $this->log('image_update', excerpt($data['caption_nl'], 80));
            flash('success', 'De afbeelding is bijgewerkt.');
        } else {
            ImageRepository::create($locationId, $data);
            $this->log('image_create', excerpt($data['caption_nl'], 80));
            flash('success', 'De afbeelding is toegevoegd.');
        }
        redirect($back . '#afbeeldingen');
    }

    private function page_image_delete(): void
    {
        $this->requirePost();
        $image = ImageRepository::find((int) ($_POST['id'] ?? 0));
        if (!$image) {
            $this->notFound('Deze afbeelding bestaat niet (meer).');
            return;
        }
        ImageRepository::delete((int) $image['id']);
        $this->uploads->delete($image['image_url']);
        $this->log('image_delete', excerpt($image['caption_nl'], 80));
        flash('success', 'De afbeelding is verwijderd.');
        redirect('?page=location_form&id=' . $image['location_id'] . '#afbeeldingen');
    }

    private function page_image_move(): void
    {
        $this->requirePost();
        $image = ImageRepository::find((int) ($_POST['id'] ?? 0));
        if (!$image) {
            $this->notFound('Deze afbeelding bestaat niet (meer).');
            return;
        }
        ImageRepository::move((int) $image['id'], ($_POST['direction'] ?? '') === 'up' ? -1 : 1);
        $this->log('image_move', excerpt($image['caption_nl'], 80));
        redirect('?page=location_form&id=' . $image['location_id'] . '#afbeelding-' . $image['id']);
    }

    /* =================================================================
     *  Route van de boot
     * ================================================================= */

    private function page_route(): void
    {
        $errors = [];
        $points = RouteRepository::all();
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            [$points, $errors] = RouteRepository::validate(
                (array) ($_POST['time'] ?? []),
                (array) ($_POST['lat'] ?? []),
                (array) ($_POST['lng'] ?? [])
            );
            if (!$errors) {
                RouteRepository::replaceAll($points);
                $this->log('route_update', count($points) . ' routepunten');
                flash('success', 'De route van de boot is opgeslagen.');
                redirect('?page=route');
            }
            flash('error', 'De route is niet opgeslagen. Bekijk de meldingen.');
        }
        View::render('route', [
            'title'     => 'Route van de boot',
            'points'    => $points,
            'errors'    => $errors,
            'locations' => LocationRepository::all(),
            'videoUrl'  => SettingRepository::get('video_url'),
        ]);
    }

    /* =================================================================
     *  Teksten en instellingen
     * ================================================================= */

    private function page_settings(): void
    {
        $errors = [];
        $values = SettingRepository::all();
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            [$values, $errors] = SettingRepository::validate($_POST);
            if (!$errors) {
                Database::transaction(static function () use ($values): void {
                    foreach ($values as $key => $value) {
                        SettingRepository::set($key, $value);
                    }
                });
                $this->log('settings_update');
                flash('success', 'De teksten en instellingen zijn opgeslagen.');
                redirect('?page=settings');
            }
            flash('error', 'Niet alles is goed ingevuld. Bekijk de rode meldingen.');
        }
        View::render('settings', ['title' => 'Teksten en instellingen', 'values' => $values, 'errors' => $errors]);
    }

    /* =================================================================
     *  Eigen account
     * ================================================================= */

    private function page_account(): void
    {
        $user = Auth::user();
        $errors = [];
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $full = UserRepository::find((int) $user['id']);
            $current = (string) ($_POST['current_password'] ?? '');
            $new = (string) ($_POST['new_password'] ?? '');
            $repeat = (string) ($_POST['repeat_password'] ?? '');
            if (!password_verify($current, $full['password_hash'])) {
                $errors['current_password'] = 'Je huidige wachtwoord klopt niet.';
            }
            if ($problem = UserRepository::passwordProblem($new)) {
                $errors['new_password'] = $problem;
            } elseif ($new === $current) {
                $errors['new_password'] = 'Kies een ander wachtwoord dan je huidige.';
            }
            if ($new !== $repeat) {
                $errors['repeat_password'] = 'De twee nieuwe wachtwoorden zijn niet gelijk.';
            }
            if (!$errors) {
                UserRepository::setPassword((int) $user['id'], $new);
                session_regenerate_id(true);
                $this->log('password_change');
                flash('success', 'Je wachtwoord is gewijzigd.');
                redirect('?page=dashboard');
            }
        }
        View::render('account', ['title' => 'Mijn account', 'user' => $user, 'errors' => $errors]);
    }

    /* =================================================================
     *  Gebruikers (alleen beheerder)
     * ================================================================= */

    private function page_users(): void
    {
        View::render('users', ['title' => 'Gebruikers', 'users' => UserRepository::all(), 'me' => Auth::user()]);
    }

    private function page_user_form(): void
    {
        $id = (int) ($_GET['id'] ?? 0);
        $editUser = $id ? UserRepository::find($id) : null;
        if ($id && !$editUser) {
            $this->notFound('Deze gebruiker bestaat niet (meer).');
            return;
        }
        View::render('user_form', [
            'title'    => $editUser ? 'Gebruiker bewerken' : 'Nieuwe gebruiker',
            'editUser' => $editUser,
            'errors'   => $_SESSION['errors'] ?? [],
            'me'       => Auth::user(),
        ]);
    }

    private function page_user_save(): void
    {
        $this->requirePost();
        $id = (int) ($_POST['id'] ?? 0);
        $existing = $id ? UserRepository::find($id) : null;
        if ($id && !$existing) {
            $this->notFound('Deze gebruiker bestaat niet (meer).');
            return;
        }
        [$data, $errors] = UserRepository::validate($_POST, $id ?: null);
        $password = (string) ($_POST['password'] ?? '');
        if (!$existing && ($problem = UserRepository::passwordProblem($password))) {
            $errors['password'] = $problem;
        }
        // De laatste actieve beheerder mag niet worden uitgeschakeld of gedegradeerd
        if ($existing && $existing['role'] === 'admin' && (int) $existing['is_active']
            && ($data['role'] !== 'admin' || !$data['is_active']) && UserRepository::countActiveAdmins() <= 1) {
            $errors['role'] = 'Er moet altijd minstens één actieve beheerder zijn.';
        }
        if ($existing && (int) $existing['id'] === (int) Auth::user()['id'] && !$data['is_active']) {
            $errors['is_active'] = 'Je kunt je eigen account niet uitschakelen.';
        }
        if ($errors) {
            $_SESSION['errors'] = $errors;
            $_SESSION['old'] = $_POST;
            flash('error', 'Niet alles is goed ingevuld. Bekijk de rode meldingen.');
            redirect('?page=user_form' . ($id ? '&id=' . $id : ''));
        }
        if ($existing) {
            UserRepository::update($id, $data);
            $this->log('user_update', $data['username']);
            flash('success', 'De gebruiker ' . $data['display_name'] . ' is opgeslagen.');
        } else {
            UserRepository::create($data, $password);
            $this->log('user_create', $data['username']);
            flash('success', 'De gebruiker ' . $data['display_name'] . ' is aangemaakt. Bij de eerste keer inloggen kiest diegene een eigen wachtwoord.');
        }
        redirect('?page=users');
    }

    private function page_user_reset(): void
    {
        $this->requirePost();
        $target = UserRepository::find((int) ($_POST['id'] ?? 0));
        if (!$target) {
            $this->notFound('Deze gebruiker bestaat niet (meer).');
            return;
        }
        $temp = self::temporaryPassword();
        UserRepository::setPassword((int) $target['id'], $temp, true);
        $this->log('user_update', 'tijdelijk wachtwoord voor ' . $target['username']);
        flash('success', 'Tijdelijk wachtwoord voor ' . $target['display_name'] . ': ' . $temp . ' — geef dit persoonlijk door. Bij het inloggen moet een nieuw wachtwoord worden gekozen.');
        redirect('?page=users');
    }

    private function page_user_delete(): void
    {
        $this->requirePost();
        $target = UserRepository::find((int) ($_POST['id'] ?? 0));
        if (!$target) {
            $this->notFound('Deze gebruiker bestaat niet (meer).');
            return;
        }
        if ((int) $target['id'] === (int) Auth::user()['id']) {
            flash('error', 'Je kunt jezelf niet verwijderen.');
        } elseif ($target['role'] === 'admin' && UserRepository::countActiveAdmins() <= 1) {
            flash('error', 'Dit is de laatste beheerder. Maak eerst iemand anders beheerder.');
        } else {
            UserRepository::delete((int) $target['id']);
            $this->log('user_delete', $target['username']);
            flash('success', 'De gebruiker ' . $target['display_name'] . ' is verwijderd.');
        }
        redirect('?page=users');
    }

    /* =================================================================
     *  Handleiding en overig
     * ================================================================= */

    private function page_help(): void
    {
        View::render('help', ['title' => 'Handleiding']);
    }

    private function page_not_found(): void
    {
        $this->notFound('Deze pagina bestaat niet.');
    }

    private function notFound(string $message): void
    {
        http_response_code(404);
        View::render('message', ['title' => 'Niet gevonden', 'message' => $message]);
    }

    private function requirePost(): void
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            redirect('?page=dashboard');
        }
    }

    private function log(string $action, string $details = ''): void
    {
        ActivityRepository::log($action, $details, Auth::user());
    }

    /** Leesbaar tijdelijk wachtwoord, bijvoorbeeld "gracht-4827-brug". */
    private static function temporaryPassword(): string
    {
        $words = ['gracht', 'brug', 'werf', 'kelder', 'boot', 'dom', 'markt', 'kade', 'sloep', 'toren'];
        return $words[random_int(0, 9)] . '-' . random_int(1000, 9999) . '-' . $words[random_int(0, 9)];
    }
}
