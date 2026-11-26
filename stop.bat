@echo off
cd /d "%~dp0"
echo Website stoppen...
docker compose down
echo Gestopt. Je teksten en foto's blijven bewaard.
pause
