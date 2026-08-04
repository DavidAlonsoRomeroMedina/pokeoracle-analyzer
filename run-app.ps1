<#
.SYNOPSIS
    Arranca PokeOracle en la red local y muestra un QR para escanear desde el movil.

.DESCRIPTION
    - Escucha en 0.0.0.0 (todas las interfaces) via launchSettings.json.
    - Detecta la IPv4 local y genera http://<IP>:5110 para companeros en la misma Wi-Fi.
    - Abre una pagina HTML con el codigo QR y la URL.
    - Muestra instrucciones de firewall si Windows bloquea el puerto.

.PARAMETER LaunchProfile
    'http' (recomendado para moviles) o 'https'.

.PARAMETER NoBrowser
    No abre la web app ni la pagina del QR.

.PARAMETER RebuildFrontend
    Reconstruye el frontend aunque wwwroot ya exista.

.EXAMPLE
    .\run-app.ps1 -LaunchProfile http
    .\run-app.bat http
#>
[CmdletBinding()]
param(
    [ValidateSet('https', 'http')]
    [string]$LaunchProfile = 'http',

    [switch]$NoBrowser,

    [switch]$RebuildFrontend
)

$ErrorActionPreference = 'Stop'

# El QR siempre usa HTTP: los telefonos rechazan el certificado de desarrollo HTTPS.
$lanPort = 5110
$localPort = if ($LaunchProfile -eq 'https') { 7004 } else { 5110 }
$localUrl = "$($LaunchProfile)://localhost:$localPort"

$projectDir = Join-Path $PSScriptRoot 'PokeOracle-Backend/PokeOracle.WebApi'
$wwwrootIndex = Join-Path $projectDir 'wwwroot/index.html'
$frontendDir = Join-Path $PSScriptRoot 'pokeoracle-assistant'
$qrPagePath = Join-Path ([System.IO.Path]::GetTempPath()) 'pokeoracle-lan-qr.html'

function Get-LocalIPv4 {
    # IP de la interfaz que usaria el equipo para salir a la red (funciona en Windows y Linux).
    try {
        $udp = New-Object System.Net.Sockets.UdpClient
        $udp.Connect('8.8.8.8', 53)
        $endpoint = $udp.Client.LocalEndPoint
        $ip = ([System.Net.IPEndPoint]$endpoint).Address.ToString()
        $udp.Dispose()
        if ($ip -and $ip -ne '0.0.0.0' -and -not $ip.StartsWith('127.')) {
            return $ip
        }
    }
    catch { }

    # Reserva: primera IPv4 privada que no sea loopback ni APIPA.
    $candidates = [System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName()) |
        Where-Object { $_.AddressFamily -eq 'InterNetwork' } |
        ForEach-Object { $_.ToString() } |
        Where-Object {
            $_ -notmatch '^127\.' -and
            $_ -notmatch '^169\.254\.' -and
            (
                $_ -match '^10\.' -or
                $_ -match '^192\.168\.' -or
                $_ -match '^172\.(1[6-9]|2[0-9]|3[0-1])\.'
            )
        }

    if ($candidates) { return $candidates[0] }
    return $null
}

function New-QrHtmlPage {
    param(
        [Parameter(Mandatory)] [string]$LanUrl,
        [Parameter(Mandatory)] [string]$LocalUrl,
        [Parameter(Mandatory)] [string]$OutputPath
    )

    $encoded = [uri]::EscapeDataString($LanUrl)
    $qrImageUrl = "https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data=$encoded"

    $html = @"
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PokeOracle · QR de acceso LAN</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; display: grid; place-items: center;
      font-family: Outfit, Segoe UI, system-ui, sans-serif;
      background:
        radial-gradient(ellipse at top, rgba(239,68,68,.25), transparent 45%),
        radial-gradient(ellipse at bottom right, rgba(56,189,248,.18), transparent 40%),
        #070b14;
      color: #f8fafc;
      padding: 24px;
    }
    .card {
      width: min(440px, 100%);
      background: rgba(18,24,38,.82);
      border: 1px solid rgba(255,255,255,.16);
      border-radius: 24px;
      backdrop-filter: blur(16px);
      padding: 28px 24px 24px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,.35);
    }
    h1 { margin: 0 0 6px; font-size: 1.4rem; letter-spacing: .04em; }
    p { margin: 0 0 18px; color: rgba(248,250,252,.65); font-size: .95rem; line-height: 1.45; }
    .qr {
      width: 320px; height: 320px; max-width: 100%;
      background: #fff; border-radius: 18px; padding: 12px; margin: 0 auto 18px;
    }
    .qr img { width: 100%; height: 100%; display: block; }
    .url {
      display: block; word-break: break-all;
      padding: 12px 14px; border-radius: 14px;
      background: rgba(0,0,0,.35); border: 1px solid rgba(255,255,255,.12);
      color: #fbbf24; font-family: ui-monospace, Consolas, monospace; font-size: .95rem;
      text-decoration: none; margin-bottom: 10px;
    }
    .hint { font-size: .8rem; color: rgba(248,250,252,.45); }
    .local { margin-top: 14px; font-size: .8rem; color: rgba(248,250,252,.4); }
  </style>
</head>
<body>
  <div class="card">
    <h1>PokeOracle</h1>
    <p>Escanea este codigo con el movil<br/>(misma red Wi‑Fi que el presentador)</p>
    <div class="qr"><img src="$qrImageUrl" alt="Codigo QR PokeOracle" /></div>
    <a class="url" href="$LanUrl">$LanUrl</a>
    <p class="hint">Si el QR no carga, escribe la URL a mano en el navegador del telefono.</p>
    <p class="local">En este PC tambien: <a href="$LocalUrl" style="color:#38bdf8">$LocalUrl</a></p>
  </div>
</body>
</html>
"@

    # UTF-8 sin BOM para que el navegador lo lea bien en cualquier SO.
    [System.IO.File]::WriteAllText($OutputPath, $html, [System.Text.UTF8Encoding]::new($false))
}

function Show-FirewallHint {
    param([int]$Port)

    Write-Host '   Firewall (si el movil no conecta):' -ForegroundColor DarkYellow
    Write-Host "   Abre PowerShell como Administrador y ejecuta:" -ForegroundColor DarkYellow
    Write-Host ''
    Write-Host "   New-NetFirewallRule -DisplayName `"PokeOracle $Port`" -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow -Profile Private" -ForegroundColor White
    Write-Host ''
    Write-Host '   O en Windows Defender Firewall > Reglas de entrada > Nueva regla >' -ForegroundColor DarkGray
    Write-Host "   Puerto TCP $Port > Permitir la conexion > Perfil Privado." -ForegroundColor DarkGray
    Write-Host ''
}

# --- Validaciones ---
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

# --- Frontend ---
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

# --- Red local + QR ---
$localIp = Get-LocalIPv4
$lanUrl = if ($localIp) { "http://${localIp}:$lanPort" } else { $null }

Write-Host ''
Write-Host '  ==========================================================' -ForegroundColor DarkCyan
Write-Host '     PokeOracle  -  listo para presentar en clase' -ForegroundColor Cyan
Write-Host '  ==========================================================' -ForegroundColor DarkCyan
Write-Host ''
Write-Host '   En este PC : ' -NoNewline -ForegroundColor Gray
Write-Host $localUrl -ForegroundColor Yellow

if ($lanUrl) {
    Write-Host '   Red Wi-Fi  : ' -NoNewline -ForegroundColor Gray
    Write-Host $lanUrl -ForegroundColor Green
    Write-Host '   IP local   : ' -NoNewline -ForegroundColor Gray
    Write-Host $localIp -ForegroundColor White
    Write-Host ''
    Write-Host '   Tus companeros pueden escanear el QR o abrir la URL de Red Wi-Fi' -ForegroundColor Gray
    Write-Host '   (deben estar en la misma red que tu).' -ForegroundColor Gray

    New-QrHtmlPage -LanUrl $lanUrl -LocalUrl $localUrl -OutputPath $qrPagePath
    Write-Host ''
    Write-Host "   Pagina QR : $qrPagePath" -ForegroundColor DarkGray
}
else {
    Write-Host ''
    Write-Host '   No se pudo detectar una IPv4 local. Revisa que el Wi-Fi este activo.' -ForegroundColor Red
    Write-Host '   La app arrancara igual en localhost.' -ForegroundColor DarkYellow
}

Write-Host ''
Show-FirewallHint -Port $lanPort

Write-Host '   Para detener: ' -NoNewline -ForegroundColor Gray
Write-Host 'Ctrl+C' -ForegroundColor Magenta
Write-Host ''
Write-Host '  ----------------------------------------------------------' -ForegroundColor DarkCyan
Write-Host ''

if ($LaunchProfile -eq 'https') {
    & dotnet dev-certs https --check --quiet 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host '   Aviso HTTPS: certificado de desarrollo no confiado.' -ForegroundColor DarkYellow
        Write-Host '   Para moviles usa HTTP: .\run-app.ps1 -LaunchProfile http' -ForegroundColor DarkYellow
        Write-Host ''
    }
}

$browserJob = $null
if (-not $NoBrowser) {
    $urlsToOpen = @($localUrl)
    if ($lanUrl -and (Test-Path $qrPagePath)) {
        # file:/// para la pagina QR local
        $urlsToOpen = @(([Uri]$qrPagePath).AbsoluteUri, $localUrl)
    }

    $browserJob = Start-Job -ArgumentList $urlsToOpen, $localPort -ScriptBlock {
        param($urls, $port)
        for ($i = 0; $i -lt 120; $i++) {
            Start-Sleep -Milliseconds 500
            $client = New-Object System.Net.Sockets.TcpClient
            try {
                $client.Connect('localhost', $port)
                if ($client.Connected) {
                    $client.Close()
                    Start-Sleep -Seconds 1
                    foreach ($url in $urls) {
                        Start-Process $url
                        Start-Sleep -Milliseconds 400
                    }
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
