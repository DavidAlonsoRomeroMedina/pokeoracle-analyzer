@echo off
rem ===========================================================================
rem  PokeOracle - arranque para presentacion en clase (doble clic)
rem
rem  Uso:
rem    run-app.bat                 HTTP en 0.0.0.0:5110 + QR para moviles
rem    run-app.bat http            Igual (recomendado para la misma Wi-Fi)
rem    run-app.bat https           HTTPS + HTTP (el QR sigue siendo HTTP)
rem    run-app.bat --no-browser    Sin abrir navegador / QR
rem    run-app.bat --rebuild-ui    Reconstruye el frontend
rem
rem  En Windows este .bat reenvia a run-app.ps1 (deteccion de IP + QR).
rem ===========================================================================
setlocal EnableExtensions

rem --- Preferir PowerShell: ahi estan la IP local, el QR y el firewall hint ---
where powershell >nul 2>&1
if not errorlevel 1 goto :run_powershell
where pwsh >nul 2>&1
if not errorlevel 1 goto :run_pwsh

echo.
echo   No se encontro PowerShell. Se usara el modo basico sin QR grafico.
echo.
goto :basic_mode

:run_powershell
set "PS_ARGS="
:map_args_ps
if "%~1"=="" goto :exec_ps
if /i "%~1"=="http"          set "PS_ARGS=%PS_ARGS% -LaunchProfile http" & shift & goto :map_args_ps
if /i "%~1"=="https"         set "PS_ARGS=%PS_ARGS% -LaunchProfile https" & shift & goto :map_args_ps
if /i "%~1"=="--no-browser"  set "PS_ARGS=%PS_ARGS% -NoBrowser" & shift & goto :map_args_ps
if /i "%~1"=="--rebuild-ui"  set "PS_ARGS=%PS_ARGS% -RebuildFrontend" & shift & goto :map_args_ps
shift
goto :map_args_ps

:exec_ps
rem Por defecto HTTP: los telefonos no confian el certificado HTTPS de desarrollo.
if "%PS_ARGS%"=="" set "PS_ARGS=-LaunchProfile http"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-app.ps1" %PS_ARGS%
exit /b %ERRORLEVEL%

:run_pwsh
set "PS_ARGS="
:map_args_pwsh
if "%~1"=="" goto :exec_pwsh
if /i "%~1"=="http"          set "PS_ARGS=%PS_ARGS% -LaunchProfile http" & shift & goto :map_args_pwsh
if /i "%~1"=="https"         set "PS_ARGS=%PS_ARGS% -LaunchProfile https" & shift & goto :map_args_pwsh
if /i "%~1"=="--no-browser"  set "PS_ARGS=%PS_ARGS% -NoBrowser" & shift & goto :map_args_pwsh
if /i "%~1"=="--rebuild-ui"  set "PS_ARGS=%PS_ARGS% -RebuildFrontend" & shift & goto :map_args_pwsh
shift
goto :map_args_pwsh

:exec_pwsh
if "%PS_ARGS%"=="" set "PS_ARGS=-LaunchProfile http"
pwsh -NoProfile -File "%~dp0run-app.ps1" %PS_ARGS%
exit /b %ERRORLEVEL%

rem ===========================================================================
rem  Modo basico (sin PowerShell): IP via ipconfig + HTML QR + dotnet run
rem ===========================================================================
:basic_mode
if /i "%~1"=="--open-browser" goto :open_browser

set "OPEN_BROWSER=1"
set "PROFILE=http"
set "REBUILD_UI=0"

:parse_args
if "%~1"=="" goto :args_done
if /i "%~1"=="http"           set "PROFILE=http"      & shift & goto :parse_args
if /i "%~1"=="https"          set "PROFILE=https"     & shift & goto :parse_args
if /i "%~1"=="--no-browser"   set "OPEN_BROWSER=0"    & shift & goto :parse_args
if /i "%~1"=="--rebuild-ui"   set "REBUILD_UI=1"      & shift & goto :parse_args
shift
goto :parse_args
:args_done

set "LAN_PORT=5110"
if /i "%PROFILE%"=="http" (
    set "LOCAL_URL=http://localhost:5110"
) else (
    set "LOCAL_URL=https://localhost:7004"
)

set "PROJECT_DIR=%~dp0PokeOracle-Backend\PokeOracle.WebApi"
set "WWWROOT_INDEX=%PROJECT_DIR%\wwwroot\index.html"
set "FRONTEND_DIR=%~dp0pokeoracle-assistant"
set "QR_HTML=%TEMP%\pokeoracle-lan-qr.html"

where dotnet >nul 2>&1
if errorlevel 1 (
    echo.
    echo   No se encontro el SDK de .NET en el PATH.
    echo.
    exit /b 1
)

if not exist "%PROJECT_DIR%" (
    echo.
    echo   No se encontro el proyecto. Ejecuta desde la raiz del repo.
    echo.
    exit /b 1
)

if "%REBUILD_UI%"=="1" goto :build_ui
if not exist "%WWWROOT_INDEX%" goto :build_ui
goto :ui_ready

:build_ui
where npm >nul 2>&1
if errorlevel 1 (
    echo   Falta wwwroot y no hay npm. Instala Node.js.
    exit /b 1
)
echo   Construyendo la web app...
pushd "%FRONTEND_DIR%"
if not exist "node_modules\" call npm install
call npm run build:dotnet
if errorlevel 1 ( popd & exit /b 1 )
popd

:ui_ready
rem Primera IPv4 que no sea 127.x ni 169.254.x
set "LOCAL_IP="
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /R /C:"IPv4"') do (
    for /f "tokens=1" %%B in ("%%A") do (
        echo %%B | findstr /R "^127\." >nul
        if errorlevel 1 (
            echo %%B | findstr /R "^169\.254\." >nul
            if errorlevel 1 if not defined LOCAL_IP set "LOCAL_IP=%%B"
        )
    )
)
rem Quitar espacios
if defined LOCAL_IP for /f "tokens=* delims= " %%C in ("%LOCAL_IP%") do set "LOCAL_IP=%%C"

set "LAN_URL="
if defined LOCAL_IP set "LAN_URL=http://%LOCAL_IP%:%LAN_PORT%"

echo.
echo   ==========================================================
echo      PokeOracle  -  listo para presentar en clase
echo   ==========================================================
echo.
echo    En este PC : %LOCAL_URL%
if defined LAN_URL (
    echo    Red Wi-Fi  : %LAN_URL%
    echo    IP local   : %LOCAL_IP%
) else (
    echo    No se detecto IPv4 local. Revisa el Wi-Fi.
)
echo.
echo    Firewall ^(si el movil no conecta^):
echo    PowerShell como Admin:
echo      New-NetFirewallRule -DisplayName "PokeOracle %LAN_PORT%" -Direction Inbound -Protocol TCP -LocalPort %LAN_PORT% -Action Allow -Profile Private
echo.
echo    Para detener: Ctrl+C
echo   ----------------------------------------------------------
echo.

if defined LAN_URL (
    > "%QR_HTML%" echo ^<!DOCTYPE html^>
    >>"%QR_HTML%" echo ^<html lang="es"^>^<head^>^<meta charset="utf-8"^/^>
    >>"%QR_HTML%" echo ^<title^>PokeOracle QR^</title^>
    >>"%QR_HTML%" echo ^<style^>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#070b14;color:#fff;font-family:Segoe UI,sans-serif;text-align:center;padding:24px}.card{background:rgba(18,24,38,.85);border:1px solid rgba(255,255,255,.15);border-radius:24px;padding:28px;max-width:420px}img{background:#fff;border-radius:16px;padding:12px}a{color:#fbbf24;word-break:break-all}^</style^>
    >>"%QR_HTML%" echo ^</head^>^<body^>^<div class="card"^>
    >>"%QR_HTML%" echo ^<h1^>PokeOracle^</h1^>
    >>"%QR_HTML%" echo ^<p^>Escanea con el movil ^(misma Wi-Fi^)^</p^>
    >>"%QR_HTML%" echo ^<img width="320" height="320" src="https://api.qrserver.com/v1/create-qr-code/?size=320x320&amp;data=%LAN_URL%" alt="QR"/^>
    >>"%QR_HTML%" echo ^<p^>^<a href="%LAN_URL%"^>%LAN_URL%^</a^>^</p^>
    >>"%QR_HTML%" echo ^</div^>^</body^>^</html^>
)

if "%OPEN_BROWSER%"=="1" (
    if defined LAN_URL start "" "%QR_HTML%"
    start "PokeOracle - abriendo app" /min "%~f0" --open-browser "%LOCAL_URL%"
)

pushd "%PROJECT_DIR%"
dotnet run --launch-profile %PROFILE%
popd

echo.
echo    PokeOracle detenido.
echo.
exit /b 0

:open_browser
set "URL=%~2"
where curl >nul 2>&1
if errorlevel 1 (
    timeout /t 8 /nobreak >nul 2>&1
    start "" "%URL%"
    exit /b 0
)
for /l %%i in (1,1,120) do (
    curl -s -k -o nul --max-time 3 "%URL%" >nul 2>&1
    if not errorlevel 1 (
        start "" "%URL%"
        exit /b 0
    )
    timeout /t 1 /nobreak >nul 2>&1
)
start "" "%URL%"
exit /b 0
