@echo off
setlocal
cd /d "%~dp0\.."
docker compose up --detach --build
