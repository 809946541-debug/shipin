@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ==========================================
echo   手绘财经视频工坊 - Windows 安装
echo ==========================================
echo.

where node >nul 2>nul
if errorlevel 1 goto :no_node

echo [OK] Node.js
node -v
echo.

echo == 1/3 安装 npm 依赖 ==
call npm install --omit=dev
if errorlevel 1 goto :fail
echo.

echo == 2/3 安装配音依赖 edge-tts ==
where python >nul 2>nul
if errorlevel 1 goto :no_python
python -m pip install --upgrade edge-tts
if errorlevel 1 goto :fail
echo.

echo == 3/3 环境自检 ==
node studio\lib\doctor.js
if errorlevel 1 goto :fail

echo.
echo 安装完成。双击 start.bat 启动服务。
pause
exit /b 0

:no_node
echo [缺少] 未找到 Node.js
echo        请安装 Node 18 及以上：https://nodejs.org/zh-cn/download
echo        安装后重新运行 install.bat
goto :fail

:no_python
echo [缺少] 未找到 Python
echo        请安装 Python 3.9 及以上：https://www.python.org/downloads/windows/
echo        安装时勾选 "Add python.exe to PATH"
goto :fail

:fail
echo.
echo 安装未完成，请按上面提示处理后重试。
pause
exit /b 1
