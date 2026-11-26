@echo off
chcp 65001 >nul
title Ontmoet de Oudegracht
cd /d "%~dp0"

echo.
echo  ===  Ontmoet de Oudegracht  ===
echo.

where docker >nul 2>nul
if errorlevel 1 (
    echo  Docker is niet gevonden. Installeer en start Docker Desktop en probeer het opnieuw.
    pause
    exit /b 1
)

docker info >nul 2>nul
if errorlevel 1 (
    echo  Docker Desktop draait nog niet. Start Docker Desktop, wacht tot het klaar is
    echo  en dubbelklik daarna opnieuw op start.bat.
    pause
    exit /b 1
)

where git >nul 2>nul
if not errorlevel 1 (
    echo  Nieuwste versie ophalen van GitHub...
    git pull
    echo.
)

echo  Website starten (de eerste keer duurt dit een paar minuten)...
docker compose up --build -d
if errorlevel 1 (
    echo.
    echo  Starten is mislukt. Bekijk de melding hierboven.
    pause
    exit /b 1
)

echo.
echo  Wachten tot de website klaar is...
timeout /t 8 /nobreak >nul
start "" http://localhost/

echo.
echo  Klaar!
echo    App:        http://localhost/
echo    CMS:        http://localhost/cms/     (eerste keer: beheer / Oudegracht900!)
echo    phpMyAdmin: http://localhost:8081/
echo.
echo  Stoppen: dubbelklik op stop.bat
echo.
pause
