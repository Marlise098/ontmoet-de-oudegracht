@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  LET OP: dit wist de database en zet alle plekken, teksten, foto's en
echo  gebruikers terug naar de startinhoud. Wijzigingen uit het CMS gaan verloren.
echo.
set /p ok="Typ JA om door te gaan: "
if /i not "%ok%"=="JA" (
    echo Afgebroken.
    pause
    exit /b 0
)
docker compose down -v
docker compose up --build -d
echo.
echo Database is opnieuw gevuld. Open http://localhost/
pause
