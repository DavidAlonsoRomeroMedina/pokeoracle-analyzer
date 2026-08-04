<#
.SYNOPSIS
    Arranca PokeOracle.WebApi y abre Swagger en el navegador.

.DESCRIPTION
    Compila y ejecuta la WebApi con el perfil 'https' de launchSettings.json y abre
    la interfaz de Swagger en cuanto el servidor responde. La comprobacion se hace
    sondeando el endpoint, no con una espera fija, para que el navegador no se abra
    antes de que la aplicacion este lista.

.PARAMETER LaunchProfile
    Perfil de launchSettings.json a usar: 'https' (por defecto) o 'http'.
    No se llama 'Profile' porque $Profile es una variable automatica de PowerShell.

.PARAMETER NoBrowser
    Arranca la aplicacion sin abrir el navegador.

.EXAMPLE
    .\run-app.ps1
    .\run-app.ps1 -LaunchProfile http
    .\run-app.ps1 -NoBrowser
#>
[CmdletBinding()]
param(
    [ValidateSet('https', 'http')]
    [string]$LaunchProfile = 'https',

    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'

# Puertos declarados en PokeOracle.WebApi/Properties/launchSettings.json
$port = if ($LaunchProfile -eq 'https') { 7004 } else { 5110 }
$baseUrl = "$($LaunchProfile)://localhost:$port"
$swaggerUrl = "$baseUrl/swagger"

$projectDir = Join-Path $PSScriptRoot 'PokeOracle-Backend/PokeOracle.WebApi'

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

Write-Host ''
Write-Host '  ==========================================================' -ForegroundColor DarkCyan
Write-Host '     PokeOracle  -  Simulador y analisis de combates' -ForegroundColor Cyan
Write-Host '  ==========================================================' -ForegroundColor DarkCyan
Write-Host ''
Write-Host '   Swagger      : ' -NoNewline -ForegroundColor Gray
Write-Host $swaggerUrl -ForegroundColor Yellow
Write-Host '   Catalogo Gen1: ' -NoNewline -ForegroundColor Gray
Write-Host "$baseUrl/api/pokemoncatalog/pokemon" -ForegroundColor Yellow
Write-Host ''
Write-Host '   Para detener la aplicacion pulsa ' -NoNewline -ForegroundColor Gray
Write-Host 'Ctrl+C' -NoNewline -ForegroundColor Magenta
Write-Host ' en esta ventana.' -ForegroundColor Gray
Write-Host ''
Write-Host '  ----------------------------------------------------------' -ForegroundColor DarkCyan
Write-Host ''

if ($LaunchProfile -eq 'https') {
    # Sin certificado de desarrollo confiable el navegador muestra un aviso de seguridad.
    & dotnet dev-certs https --check --quiet 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host '   Aviso: el certificado HTTPS de desarrollo no esta confiado.' -ForegroundColor DarkYellow
        Write-Host '   Ejecuta "dotnet dev-certs https --trust" para evitar el aviso del navegador,' -ForegroundColor DarkYellow
        Write-Host '   o usa ".\run-app.ps1 -LaunchProfile http".' -ForegroundColor DarkYellow
        Write-Host ''
    }
}

$browserJob = $null
if (-not $NoBrowser) {
    $browserJob = Start-Job -ArgumentList $swaggerUrl, $port -ScriptBlock {
        param($url, $port)

        # Se sondea el puerto TCP en lugar de hacer una peticion HTTP: funciona igual en
        # Windows PowerShell 5.1 y en PowerShell 7, y evita el aviso del certificado
        # autofirmado cuando se arranca en HTTPS.
        for ($i = 0; $i -lt 120; $i++) {
            Start-Sleep -Milliseconds 500

            $client = New-Object System.Net.Sockets.TcpClient
            try {
                $client.Connect('localhost', $port)
                if ($client.Connected) {
                    $client.Close()
                    # Kestrel acepta conexiones pero aun esta montando el pipeline.
                    Start-Sleep -Seconds 1
                    Start-Process $url
                    return
                }
            }
            catch {
                # Todavia no escucha nadie: se reintenta.
            }
            finally {
                $client.Dispose()
            }
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
