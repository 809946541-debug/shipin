@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto :no_node

if "%PORT%"=="" set "PORT=4180"

if not "%STUDIO_TOKEN%"=="" goto :hastoken
set "STUDIO_TOKEN="
set /p "STUDIO_TOKEN=请设置访问口令（直接回车=不设口令，仅本机可访问）: "
:hastoken

if "%STUDIO_TOKEN%"=="" goto :local

if "%HOST%"=="" set "HOST=0.0.0.0"
echo.
echo 已监听全部网卡，端口 %PORT%
echo 访问地址：http://本机IP:%PORT%/?token=%STUDIO_TOKEN%
echo 若打不开，请在 Windows 防火墙放行 TCP %PORT%
goto :run

:local
set "HOST=127.0.0.1"
echo.
echo 未设置口令，仅本机可访问：http://127.0.0.1:%PORT%

:run
if not exist studio\data mkdir studio\data
echo.
echo 关闭本窗口即停止服务
echo.
node studio\server.js
echo.
echo 服务已退出，按任意键关闭窗口
pause
exit /b 0

:no_node
echo 找不到 Node.js，请先运行 install.bat
pause
exit /b 1
