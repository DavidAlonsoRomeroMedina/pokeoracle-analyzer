@echo off
rem ===========================================================================
rem  PokeOracle - doble clic: genera mostrar-qr.html, lo abre y arranca .NET
rem
rem  Flujo automatico:
rem    1) Detecta IPv4 local
rem    2) Escribe mostrar-qr.html en la raiz del repo
rem    3) Abre ese HTML en el navegador (start)
rem    4) Arranca la WebApi en http://0.0.0.0:5110
rem
rem  Uso:
rem    run-app.bat
rem    run-app.bat --no-browser
rem    run-app.bat --rebuild-ui
rem ===========================================================================
setlocal EnableExtensions
cd /d "%~dp0"

rem --- Preferir PowerShell (misma logica robusta que run-app.ps1) ---
where powershell >nul 2>&1
if not errorlevel 1 (
    set "PS_ARGS="
    if /i "%~1"=="--no-browser" set "PS_ARGS=-NoBrowser"
    if /i "%~1"=="--rebuild-ui" set "PS_ARGS=-RebuildFrontend"
    if /i "%~2"=="--no-browser" set "PS_ARGS=%PS_ARGS% -NoBrowser"
    if /i "%~2"=="--rebuild-ui" set "PS_ARGS=%PS_ARGS% -RebuildFrontend"
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-app.ps1" %PS_ARGS%
    exit /b %ERRORLEVEL%
)

rem --- Fallback CMD puro si no hay PowerShell ---
set "OPEN_BROWSER=1"
set "REBUILD_UI=0"
if /i "%~1"=="--no-browser" set "OPEN_BROWSER=0"
if /i "%~1"=="--rebuild-ui" set "REBUILD_UI=1"
if /i "%~2"=="--no-browser" set "OPEN_BROWSER=0"
if /i "%~2"=="--rebuild-ui" set "REBUILD_UI=1"

set "LAN_PORT=5110"
set "PROJECT_DIR=%~dp0PokeOracle-Backend\PokeOracle.WebApi"
set "WWWROOT_INDEX=%PROJECT_DIR%\wwwroot\index.html"
set "FRONTEND_DIR=%~dp0pokeoracle-assistant"
set "QR_HTML=%~dp0mostrar-qr.html"

where dotnet >nul 2>&1
if errorlevel 1 (
    echo No se encontro el SDK de .NET.
    exit /b 1
)

if "%REBUILD_UI%"=="1" goto :build_ui
if not exist "%WWWROOT_INDEX%" goto :build_ui
goto :detect_ip

:build_ui
where npm >nul 2>&1
if errorlevel 1 (
    echo Falta wwwroot y no hay npm.
    exit /b 1
)
echo Construyendo la web app...
pushd "%FRONTEND_DIR%"
if not exist "node_modules\" call npm install
call npm run build:dotnet
if errorlevel 1 ( popd & exit /b 1 )
popd

:detect_ip
rem Preferir 192.168.x (Wi-Fi/aula), luego 10.x; Docker 172.17-31 solo como ultimo recurso
set "LOCAL_IP="
set "IP_192="
set "IP_10="
set "IP_17216="
set "IP_DOCKER="
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /R /C:"IPv4"') do (
    call :consider_ip %%A
)
if defined IP_192 (
    set "LOCAL_IP=%IP_192%"
) else if defined IP_10 (
    set "LOCAL_IP=%IP_10%"
) else if defined IP_17216 (
    set "LOCAL_IP=%IP_17216%"
) else if defined IP_DOCKER (
    set "LOCAL_IP=%IP_DOCKER%"
)
if defined LOCAL_IP for /f "tokens=* delims= " %%C in ("%LOCAL_IP%") do set "LOCAL_IP=%%C"

if not defined LOCAL_IP (
    echo No se pudo detectar IPv4 local. Revisa el Wi-Fi.
    exit /b 1
)

set "LAN_URL=http://%LOCAL_IP%:%LAN_PORT%"
goto :write_qr

:consider_ip
set "CAND=%*"
for /f "tokens=* delims= " %%C in ("%CAND%") do set "CAND=%%C"
echo %CAND%| findstr /R "^127\." >nul && exit /b 0
echo %CAND%| findstr /R "^169\.254\." >nul && exit /b 0
echo %CAND%| findstr /R "^192\.168\." >nul && (
    if not defined IP_192 set "IP_192=%CAND%"
    exit /b 0
)
echo %CAND%| findstr /R "^10\." >nul && (
    if not defined IP_10 set "IP_10=%CAND%"
    exit /b 0
)
echo %CAND%| findstr /R "^172\.16\." >nul && (
    if not defined IP_17216 set "IP_17216=%CAND%"
    exit /b 0
)
echo %CAND%| findstr /R "^172\.1[7-9]\. ^172\.2[0-9]\. ^172\.3[01]\." >nul && (
    if not defined IP_DOCKER set "IP_DOCKER=%CAND%"
    exit /b 0
)
exit /b 0

:write_qr
rem Generar mostrar-qr.html en la raiz
> "%QR_HTML%" (
    echo ^<!DOCTYPE html^>
    echo ^<html lang="es"^>^<head^>^<meta charset="utf-8"^/^>
    echo ^<meta name="viewport" content="width=device-width, initial-scale=1"^/^>
    echo ^<title^>PokeOracle · Escanea el QR^</title^>
    echo ^<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"^>^</script^>
    echo ^<style^>
    echo body{margin:0;min-height:100vh;display:grid;place-items:center;background:#070b14;color:#fff;font-family:Segoe UI,sans-serif;text-align:center;padding:24px}
    echo .card{width:min(560px,100%%^);background:rgba(18,24,38,.88^);border:1px solid rgba(255,255,255,.16^);border-radius:28px;padding:32px;box-shadow:0 24px 70px rgba(0,0,0,.4^)}
    echo .qr{width:min(420px,86vw^);aspect-ratio:1;margin:0 auto 22px;padding:18px;background:#fff;border-radius:24px;display:grid;place-items:center}
    echo .qr img,.qr canvas{width:100%%;height:100%%;object-fit:contain}
    echo a{display:block;word-break:break-all;padding:14px;border-radius:16px;background:rgba(0,0,0,.4^);color:#fbbf24;font:700 1.15rem Consolas,monospace;text-decoration:none}
    echo ^</style^>^</head^>^<body^>^<div class="card"^>
    echo ^<h1^>PokeOracle^</h1^>
    echo ^<p^>Escanea este codigo con el movil^(misma Wi-Fi^)^</p^>
    echo ^<div class="qr" id="qr"^>^<img src="https://api.qrserver.com/v1/create-qr-code/?size=420x420^&amp;margin=8^&amp;data=%LAN_URL%" alt="QR" onerror="this.onerror=null;this.src='https://quickchart.io/qr?size=420^&amp;text=%LAN_URL%';setTimeout^(function^(^){if^(!document.querySelector^('#qr img'^)^|^|^!document.querySelector^('#qr img'^).complete^)renderJsQr^(^);},2500^);" /^>^</div^>
    echo ^<a href="%LAN_URL%"^>%LAN_URL%^</a^>
    echo ^<p^>IP: %LOCAL_IP% · Puerto 5110^</p^>
    echo ^</div^>
    echo ^<script^>function renderJsQr^(^){var h=document.getElementById^('qr'^);h.innerHTML='';if^(typeof QRCode==='undefined'^){h.innerHTML='^<p style=color:#111^>%LAN_URL%^</p^>';return;}QRCode.toCanvas^('%LAN_URL%',{width:380,margin:2},function^(e,c^){if^(e^){h.innerHTML='^<p style=color:#111^>%LAN_URL%^</p^>';return;}h.appendChild^(c^);}^);}^</script^>
    echo ^</body^>^</html^>
)

echo.
echo   ==========================================================
echo      PokeOracle  -  QR listo para escanear
echo   ==========================================================
echo.
echo    Archivo   : mostrar-qr.html
echo    URL movil : %LAN_URL%
echo    IP local  : %LOCAL_IP%
echo.
echo    Firewall ^(Admin PowerShell^):
echo    New-NetFirewallRule -DisplayName "PokeOracle 5110" -Direction Inbound -Protocol TCP -LocalPort 5110 -Action Allow -Profile Private
echo.

if "%OPEN_BROWSER%"=="1" (
    start "" "%QR_HTML%"
    echo    Navegador abierto con mostrar-qr.html
    echo.
)

echo    Arrancando servidor en http://0.0.0.0:5110 ...
echo    Detener con Ctrl+C
echo.

pushd "%PROJECT_DIR%"
set "ASPNETCORE_URLS=http://0.0.0.0:%LAN_PORT%"
set "ASPNETCORE_ENVIRONMENT=Development"
dotnet run --no-launch-profile
popd

echo.
echo    PokeOracle detenido.
echo.
exit /b 0
