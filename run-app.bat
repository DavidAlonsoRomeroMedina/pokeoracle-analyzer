@echo off
rem ===========================================================================
rem  PokeOracle - arranque rapido para CMD
rem
rem  Uso:
rem    run-app.bat            Arranca con HTTPS (https://localhost:7004)
rem    run-app.bat http       Arranca con HTTP  (http://localhost:5110)
rem    run-app.bat --no-browser
rem
rem  El script se auto-invoca con --open-browser en una ventana secundaria para
rem  abrir Swagger en cuanto Kestrel responde, sin bloquear la consola principal.
rem ===========================================================================
setlocal

rem --- Modo secundario: esperar a que el servidor levante y abrir el navegador ---
if /i "%~1"=="--open-browser" goto :open_browser

set "OPEN_BROWSER=1"
set "PROFILE=https"

:parse_args
if "%~1"=="" goto :args_done
if /i "%~1"=="http"         set "PROFILE=http"      & shift & goto :parse_args
if /i "%~1"=="https"        set "PROFILE=https"     & shift & goto :parse_args
if /i "%~1"=="--no-browser" set "OPEN_BROWSER=0"    & shift & goto :parse_args
shift
goto :parse_args
:args_done

rem Puertos declarados en PokeOracle.WebApi\Properties\launchSettings.json
if /i "%PROFILE%"=="http" (
    set "BASE_URL=http://localhost:5110"
) else (
    set "BASE_URL=https://localhost:7004"
)
set "SWAGGER_URL=%BASE_URL%/swagger"
set "PROJECT_DIR=%~dp0PokeOracle-Backend\PokeOracle.WebApi"

where dotnet >nul 2>&1
if errorlevel 1 (
    echo.
    echo   No se encontro el SDK de .NET en el PATH.
    echo   Instala .NET 10 desde https://dotnet.microsoft.com/download
    echo.
    exit /b 1
)

if not exist "%PROJECT_DIR%" (
    echo.
    echo   No se encontro el proyecto en: %PROJECT_DIR%
    echo   Ejecuta este script desde la raiz del repositorio.
    echo.
    exit /b 1
)

echo.
echo   ==========================================================
echo      PokeOracle  -  Simulador y analisis de combates
echo   ==========================================================
echo.
echo    Swagger      : %SWAGGER_URL%
echo    Catalogo Gen1: %BASE_URL%/api/pokemoncatalog/pokemon
echo.
echo    Para detener la aplicacion pulsa Ctrl+C en esta ventana.
echo.
echo   ----------------------------------------------------------
echo.

if "%OPEN_BROWSER%"=="1" (
    start "PokeOracle - abriendo navegador" /min "%~f0" --open-browser "%SWAGGER_URL%"
)

pushd "%PROJECT_DIR%"
dotnet run --launch-profile %PROFILE%
popd

echo.
echo    PokeOracle detenido. Hasta la proxima.
echo.
exit /b 0

rem ---------------------------------------------------------------------------
:open_browser
set "URL=%~2"

where curl >nul 2>&1
if errorlevel 1 (
    rem Sin curl no se puede sondear: espera fija y abre.
    timeout /t 8 /nobreak >nul 2>&1
    start "" "%URL%"
    exit /b 0
)

rem Sondea hasta ~60s para no abrir el navegador antes de que la app este lista.
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
