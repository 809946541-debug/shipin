@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto :no_node

node studio\lib\doctor.js
echo.
pause
exit /b 0

:no_node
echo 找不到 Node.js，请先运行 install.bat
pause
exit /b 1
