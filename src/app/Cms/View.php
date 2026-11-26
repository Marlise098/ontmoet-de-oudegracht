<?php
declare(strict_types=1);

namespace App\Cms;

/**
 * Rendert CMS-pagina's binnen de vaste layout.
 */
final class View
{
    public static function render(string $view, array $vars = [], string $layout = 'layout'): void
    {
        $file = APP_ROOT . '/views/cms/' . $view . '.php';
        if (!is_file($file)) {
            throw new \RuntimeException("View '$view' bestaat niet.");
        }
        extract($vars, EXTR_SKIP);
        ob_start();
        require $file;
        $content = ob_get_clean();

        // Oude formulierwaarden zijn na een keer tonen niet meer nodig
        unset($_SESSION['old'], $_SESSION['errors']);

        require APP_ROOT . '/views/cms/' . $layout . '.php';
    }

    /** Foutmelding bij een formulierveld (met id voor aria-describedby). */
    public static function error(array $errors, string $field): string
    {
        if (empty($errors[$field])) {
            return '';
        }
        return '<p class="field-error" id="err-' . e($field) . '"><span aria-hidden="true">⚠</span> ' . e($errors[$field]) . '</p>';
    }

    /** Attributen voor een veld met (mogelijke) fout. */
    public static function invalid(array $errors, string $field): string
    {
        return !empty($errors[$field]) ? ' aria-invalid="true" aria-describedby="err-' . e($field) . '"' : '';
    }
}
