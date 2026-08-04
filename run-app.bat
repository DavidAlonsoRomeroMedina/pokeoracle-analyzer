@echo off
rem ===========================================================================
rem  PokeOracle - arranque rapido (doble clic)
rem
rem  Uso:
rem    run-app.bat                 Arranca con HTTPS y abre la web app
rem    run-app.bat http            Arranca con HTTP
rem    run-app.bat --no-browser    Arranca sin abrir el navegador
rem    run-app.bat --rebuild-ui    Reconstruye el frontend aunque ya exista
rem ===========================================================================
setlocal

if /i "%~1"=="--open-browser" goto :open_browser

set "OPEN_BROWSER=1"
set "PROFILE=https"
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

if /i "%PROFILE%"=="http" (
    set "BASE_URL=http://localhost:5110"
) else (
    set "BASE_URL=https://localhost:7004"
)
set "APP_URL=%BASE_URL%"
set "SWAGGER_URL=%BASE_URL%/swagger"
set "PROJECT_DIR=%~dp0PokeOracle-Backend\PokeOracle.WebApi"
set "WWWROOT_INDEX=%PROJECT_DIR%\wwwroot\index.html"
set "FRONTEND_DIR=%~dp0pokeoracle-assistant"

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

if "%REBUILD_UI%"=="1" goto :build_ui
if not exist "%WWWROOT_INDEX%" goto :build_ui
goto :ui_ready

:build_ui
where npm >nul 2>&1
if errorlevel 1 (
    echo.
    echo   Falta la web app en wwwroot y no hay npm para construirla.
    echo   Instala Node.js o ejecuta: cd pokeoracle-assistant ^&^& npm run build:dotnet
    echo.
    exit /b 1
)
echo.
echo   Construyendo la web app ^(React -^> wwwroot^)...
pushd "%FRONTEND_DIR%"
if not exist "node_modules\" call npm install
if errorlevel 1 ( popd & exit /b 1 )
call npm run build:dotnet
if errorlevel 1 ( popd & exit /b 1 )
popd

:ui_ready
echo.
echo   ==========================================================
echo      PokeOracle  -  Simulador y analisis de combates
echo   ==========================================================
echo.
echo    Web App : %APP_URL%
echo    Swagger : %SWAGGER_URL%
echo.
echo    Para detener la aplicacion pulsa Ctrl+C en esta ventana.
echo.
echo   ----------------------------------------------------------
echo.

if "%OPEN_BROWSER%"=="1" (
    start "PokeOracle - abriendo navegador" /min "%~f0" --open-browser "%APP_URL%"
)

pushd "%PROJECT_DIR%"
dotnet run --launch-profile %PROFILE%
popd

echo.
echo    PokeOracle detenido. Hasta la proxima.
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
