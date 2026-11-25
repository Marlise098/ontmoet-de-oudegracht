<?php
/**
 * Maakt een SQLite-testdatabase van het MySQL-schema en de seed.
 * Alleen voor automatische tests en snel lokaal bekijken zonder Docker.
 *
 * Gebruik: php src/tests/sqlite-setup.php /tmp/oudegracht.sqlite
 */
declare(strict_types=1);

$target = $argv[1] ?? sys_get_temp_dir() . '/oudegracht-test.sqlite';
@unlink($target);

$pdo = new PDO('sqlite:' . $target, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$pdo->exec('PRAGMA foreign_keys = ON');

$convert = static function (string $sql): string {
    $sql = preg_replace('/^\s*SET NAMES .*?;\s*$/mi', '', $sql);
    $sql = preg_replace('/\)\s*ENGINE=.*?;/s', ');', $sql);
    $sql = preg_replace('/INT\s+UNSIGNED\s+NOT\s+NULL\s+AUTO_INCREMENT/', 'INTEGER', $sql);
    $sql = preg_replace('/,\s*PRIMARY KEY \(id\)/', '', $sql);
    $sql = preg_replace('/\bid\s+INTEGER\b/', 'id INTEGER PRIMARY KEY AUTOINCREMENT', $sql);
    $sql = preg_replace('/INT\s+UNSIGNED/', 'INTEGER', $sql);
    $sql = preg_replace('/,\s*UNIQUE KEY \w+ \((\w+)\)/', ', UNIQUE ($1)', $sql);
    $sql = preg_replace('/,\s*KEY \w+ \([^)]*\)/', '', $sql);
    $sql = preg_replace('/CONSTRAINT \w+ FOREIGN KEY/', 'FOREIGN KEY', $sql);
    return $sql;
};

$dir = __DIR__ . '/../database';
foreach (['01_schema.sql', '02_seed.sql'] as $file) {
    $sql = $convert((string) file_get_contents("$dir/$file"));
    $sql = str_replace('\\n', "\n", $sql); // MySQL leest \n in tekst als regelafbreking, SQLite niet
    $pdo->exec($sql);
}

$count = $pdo->query('SELECT COUNT(*) FROM locations')->fetchColumn();
echo "SQLite-testdatabase klaar: $target ($count locaties)\n";
