<#
.SYNOPSIS
    Arranca PokeOracle (backend + web app) y abre el navegador.

.DESCRIPTION
    1. Compila el frontend React a wwwroot si aun no esta construido.
    2. Ejecuta PokeOracle.WebApi.
    3. Abre la web app en cuanto Kestrel acepta conexiones.

.PARAMETER LaunchProfile
    Perfil de launchSettings.json: 'https' (por defecto) o 'http'.

.PARAMETER NoBrowser
    Arranca sin abrir el navegador.

.PARAMETER RebuildFrontend
    Fuerza la recompilacion del frontend aunque wwwroot ya exista.

.EXAMPLE
    .\run-app.ps1
    .\run-app.ps1 -LaunchProfile http
    .\run-app.ps1 -NoBrowser
#>
[CmdletBinding()]
param(
    [ValidateSet('https', 'http')]
    [string]$LaunchProfile = 'https',

    [switch]$NoBrowser,

    [switch]$RebuildFrontend
)

$ErrorActionPreference = 'Stop'

$port = if ($LaunchProfile -eq 'https') { 7004 } else { 5110 }
$baseUrl = "$($LaunchProfile)://localhost:$port"
$appUrl = $baseUrl
$swaggerUrl = "$baseUrl/swagger"

$projectDir = Join-Path $PSScriptRoot 'PokeOracle-Backend/PokeOracle.WebApi'
$wwwrootIndex = Join-Path $projectDir 'wwwroot/index.html'
$frontendDir = Join-Path $PSScriptRoot 'pokeoracle-assistant'

if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
    Write-Host ''
    Write-Host '  No se encontro el SDK de .NET en el PATH.' -ForegroundColor Red
    Write-Host '  Instala .NET 10 desde https://dotnet.microsoft.com/download' -ForegroundColor Red
    Write-Host ''
    exit 1
}

if (-not (Test-Path $projectDir)) {
    Write-Host ''
    Write-Host "  No se encontro el proyecto en: $projectDir" -ForegroundColor Red
    Write-Host '  Ejecuta este script desde la raiz del repositorio.' -ForegroundColor Red
    Write-Host ''
    exit 1
}

# Construye el frontend si falta, para que la raiz del servidor no devuelva 404.
if ($RebuildFrontend -or -not (Test-Path $wwwrootIndex)) {
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Host ''
        Write-Host '  Falta la web app en wwwroot y no hay npm para construirla.' -ForegroundColor Red
        Write-Host '  Instala Node.js o ejecuta: cd pokeoracle-assistant && npm run build:dotnet' -ForegroundColor Red
        Write-Host ''
        exit 1
    }

    Write-Host ''
    Write-Host '  Construyendo la web app (React -> wwwroot)...' -ForegroundColor Cyan
    Push-Location $frontendDir
    try {
        if (-not (Test-Path (Join-Path $frontendDir 'node_modules'))) {
            & npm install
            if ($LASTEXITCODE -ne 0) { throw "npm install fallo con codigo $LASTEXITCODE" }
        }
        & npm run build:dotnet
        if ($LASTEXITCODE -ne 0) { throw "npm run build:dotnet fallo con codigo $LASTEXITCODE" }
    }
    finally {
        Pop-Location
    }
}

Write-Host ''
Write-Host '  ==========================================================' -ForegroundColor DarkCyan
Write-Host '     PokeOracle  -  Simulador y analisis de combates' -ForegroundColor Cyan
Write-Host '  ==========================================================' -ForegroundColor DarkCyan
Write-Host ''
Write-Host '   Web App : ' -NoNewline -ForegroundColor Gray
Write-Host $appUrl -ForegroundColor Yellow
Write-Host '   Swagger : ' -NoNewline -ForegroundColor Gray
Write-Host $swaggerUrl -ForegroundColor DarkGray
Write-Host ''
Write-Host '   Para detener la aplicacion pulsa ' -NoNewline -ForegroundColor Gray
Write-Host 'Ctrl+C' -NoNewline -ForegroundColor Magenta
Write-Host ' en esta ventana.' -ForegroundColor Gray
Write-Host ''
Write-Host '  ----------------------------------------------------------' -ForegroundColor DarkCyan
Write-Host ''

if ($LaunchProfile -eq 'https') {
    & dotnet dev-certs https --check --quiet 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host '   Aviso: el certificado HTTPS de desarrollo no esta confiado.' -ForegroundColor DarkYellow
        Write-Host '   Ejecuta "dotnet dev-certs https --trust" o usa "-LaunchProfile http".' -ForegroundColor DarkYellow
        Write-Host ''
    }
}

$browserJob = $null
if (-not $NoBrowser) {
    $browserJob = Start-Job -ArgumentList $appUrl, $port -ScriptBlock {
        param($url, $port)
        for ($i = 0; $i -lt 120; $i++) {
            Start-Sleep -Milliseconds 500
            $client = New-Object System.Net.Sockets.TcpClient
            try {
                $client.Connect('localhost', $port)
                if ($client.Connected) {
                    $client.Close()
                    Start-Sleep -Seconds 1
                    Start-Process $url
                    return
                }
            }
            catch { }
            finally { $client.Dispose() }
        }
    }
}

Push-Location $projectDir
try {
    & dotnet run --launch-profile $LaunchProfile
}
finally {
    Pop-Location
    if ($browserJob) {
        Stop-Job $browserJob -ErrorAction SilentlyContinue
        Remove-Job $browserJob -Force -ErrorAction SilentlyContinue
    }
    Write-Host ''
    Write-Host '   PokeOracle detenido. Hasta la proxima.' -ForegroundColor Cyan
    Write-Host ''
}
