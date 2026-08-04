<#
.SYNOPSIS
    Arranca PokeOracle y abre automaticamente mostrar-qr.html con el QR de la red local.

.DESCRIPTION
    1. Detecta la IPv4 local.
    2. Escribe mostrar-qr.html en la raiz del repo.
    3. Abre ese HTML en el navegador predeterminado (sin teclear URLs).
    4. Arranca la WebApi en http://0.0.0.0:5110.

.PARAMETER NoBrowser
    No abre el navegador (solo genera el HTML y arranca el servidor).

.PARAMETER RebuildFrontend
    Reconstruye wwwroot si hace falta.
#>
[CmdletBinding()]
param(
    [switch]$NoBrowser,
    [switch]$RebuildFrontend
)

$ErrorActionPreference = 'Stop'

$lanPort = 5110
$projectDir = Join-Path $PSScriptRoot 'PokeOracle-Backend/PokeOracle.WebApi'
$wwwrootIndex = Join-Path $projectDir 'wwwroot/index.html'
$frontendDir = Join-Path $PSScriptRoot 'pokeoracle-assistant'
$qrHtmlPath = Join-Path $PSScriptRoot 'mostrar-qr.html'

function Test-UsableLanIPv4 {
    param([string]$Ip)
    if ([string]::IsNullOrWhiteSpace($Ip)) { return $false }
    if ($Ip -eq '0.0.0.0') { return $false }
    if ($Ip -match '^127\.') { return $false }
    if ($Ip -match '^169\.254\.') { return $false }
    return $true
}

function Get-IpPreferenceRank {
    param([string]$Ip)
    if ($Ip -match '^192\.168\.') { return 0 }
    if ($Ip -match '^10\.') { return 1 }
    if ($Ip -match '^172\.16\.') { return 2 }
    # Docker / Hyper-V habituales: ultimo recurso
    if ($Ip -match '^172\.(1[7-9]|2[0-9]|3[0-1])\.') { return 9 }
    return 5
}

function Get-LocalIPv4 {
    # 1) Preferir adaptadores Wi-Fi / WLAN con IPv4 privada.
    try {
        $wifi = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
            Where-Object {
                $_.PrefixOrigin -ne 'WellKnown' -and
                (Test-UsableLanIPv4 $_.IPAddress) -and
                ($_.InterfaceAlias -match '(?i)wi-?fi|wlan|wireless|wifi')
            } |
            Sort-Object { Get-IpPreferenceRank $_.IPAddress }

        if ($wifi) { return $wifi[0].IPAddress }
    }
    catch { }

    # 2) IP de la ruta por defecto (UDP connect): suele ser la LAN activa.
    try {
        $udp = New-Object System.Net.Sockets.UdpClient
        $udp.Connect('8.8.8.8', 53)
        $ip = ([System.Net.IPEndPoint]$udp.Client.LocalEndPoint).Address.ToString()
        $udp.Dispose()
        if (Test-UsableLanIPv4 $ip) { return $ip }
    }
    catch { }

    # 3) Cualquier IPv4 usable, priorizando 192.168 / 10.x sobre puentes Docker.
    $candidates = [System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName()) |
        Where-Object { $_.AddressFamily -eq 'InterNetwork' } |
        ForEach-Object { $_.ToString() } |
        Where-Object { Test-UsableLanIPv4 $_ } |
        Sort-Object { Get-IpPreferenceRank $_ }

    if ($candidates) { return $candidates[0] }
    return $null
}

function Write-MostrarQrHtml {
    param(
        [Parameter(Mandatory)] [string]$LanUrl,
        [Parameter(Mandatory)] [string]$LocalIp,
        [Parameter(Mandatory)] [string]$OutputPath
    )

    $encoded = [uri]::EscapeDataString($LanUrl)
    $html = @"
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PokeOracle · Escanea el QR</title>
  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; display: grid; place-items: center;
      font-family: Segoe UI, system-ui, sans-serif;
      background:
        radial-gradient(ellipse at top, rgba(239,68,68,.28), transparent 45%),
        radial-gradient(ellipse at bottom right, rgba(56,189,248,.18), transparent 42%),
        #070b14;
      color: #f8fafc; padding: 24px; text-align: center;
    }
    .card {
      width: min(560px, 100%);
      background: rgba(18,24,38,.88);
      border: 1px solid rgba(255,255,255,.16);
      border-radius: 28px;
      padding: 32px 28px 28px;
      box-shadow: 0 24px 70px rgba(0,0,0,.4);
    }
    h1 { margin: 0 0 8px; font-size: clamp(1.6rem, 4vw, 2.2rem); letter-spacing: .04em; }
    .sub { margin: 0 0 22px; color: rgba(248,250,252,.65); font-size: 1.05rem; line-height: 1.45; }
    .qr-wrap {
      width: min(420px, 86vw); aspect-ratio: 1;
      margin: 0 auto 22px; padding: 18px;
      background: #fff; border-radius: 24px;
      display: grid; place-items: center;
    }
    .qr-wrap img, .qr-wrap canvas { width: 100%; height: 100%; object-fit: contain; }
    .url {
      display: block; word-break: break-all;
      padding: 14px 16px; border-radius: 16px;
      background: rgba(0,0,0,.4); border: 1px solid rgba(255,255,255,.14);
      color: #fbbf24; font-family: Consolas, ui-monospace, monospace;
      font-size: clamp(1rem, 2.6vw, 1.25rem); text-decoration: none; font-weight: 700;
    }
    .meta { margin-top: 14px; color: rgba(248,250,252,.45); font-size: .9rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>PokeOracle</h1>
    <p class="sub">Escanea este codigo con el movil<br/>(misma Wi‑Fi que el presentador)</p>
    <div class="qr-wrap" id="qr">
      <img id="qr-img"
           src="https://api.qrserver.com/v1/create-qr-code/?size=420x420&amp;margin=8&amp;data=$encoded"
           alt="Codigo QR PokeOracle"
           onerror="this.onerror=null; this.src='https://quickchart.io/qr?size=420&amp;text=$encoded'; setTimeout(function(){ if(window.renderJsQr) window.renderJsQr(); }, 2500);" />
    </div>
    <a class="url" href="$LanUrl">$LanUrl</a>
    <p class="meta">IP detectada: $LocalIp · Puerto 5110</p>
  </div>
  <script>
    window.renderJsQr = function () {
      var host = document.getElementById('qr');
      if (!host || host.querySelector('canvas')) return;
      host.innerHTML = '';
      if (typeof QRCode === 'undefined') {
        host.innerHTML = '<p style="color:#111;font-weight:700;padding:12px">No se pudo generar el QR. Abre:<br>$LanUrl</p>';
        return;
      }
      QRCode.toCanvas("$LanUrl", { width: 380, margin: 2 }, function (err, canvas) {
        if (err) {
          host.innerHTML = '<p style="color:#111;font-weight:700;padding:12px">$LanUrl</p>';
          return;
        }
        host.appendChild(canvas);
      });
    };
  </script>
</body>
</html>
"@

    [System.IO.File]::WriteAllText($OutputPath, $html, [System.Text.UTF8Encoding]::new($false))
}

function Open-DefaultBrowser {
    param([Parameter(Mandatory)] [string]$FilePath)

    # Ruta absoluta: evita problemas de cwd y de file:// relativos.
    $full = (Resolve-Path -LiteralPath $FilePath).Path

    if ($IsMacOS) {
        & open $full
        return
    }
    if ($IsLinux) {
        if (Get-Command xdg-open -ErrorAction SilentlyContinue) {
            & xdg-open $full | Out-Null
            return
        }
    }

    # Windows (PowerShell 5.1 y 7)
    Start-Process -FilePath $full
}

# --- Validaciones ---
if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
    Write-Host '  No se encontro el SDK de .NET.' -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $projectDir)) {
    Write-Host "  No se encontro $projectDir. Ejecuta desde la raiz del repo." -ForegroundColor Red
    exit 1
}

# --- Frontend si falta ---
if ($RebuildFrontend -or -not (Test-Path $wwwrootIndex)) {
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Host '  Falta wwwroot y no hay npm.' -ForegroundColor Red
        exit 1
    }
    Write-Host '  Construyendo la web app...' -ForegroundColor Cyan
    Push-Location $frontendDir
    try {
        if (-not (Test-Path 'node_modules')) { & npm install }
        & npm run build:dotnet
        if ($LASTEXITCODE -ne 0) { throw 'build:dotnet fallo' }
    }
    finally { Pop-Location }
}

# --- 1) IP  2) HTML  3) Abrir navegador ---
$localIp = Get-LocalIPv4
if (-not $localIp) {
    Write-Host '  No se pudo detectar una IPv4 local. Revisa el Wi-Fi.' -ForegroundColor Red
    exit 1
}

$lanUrl = "http://${localIp}:$lanPort"
Write-MostrarQrHtml -LanUrl $lanUrl -LocalIp $localIp -OutputPath $qrHtmlPath

Write-Host ''
Write-Host '  ==========================================================' -ForegroundColor DarkCyan
Write-Host '     PokeOracle  -  QR listo para escanear' -ForegroundColor Cyan
Write-Host '  ==========================================================' -ForegroundColor DarkCyan
Write-Host ''
Write-Host "   Archivo   : mostrar-qr.html" -ForegroundColor Gray
Write-Host "   URL movil : " -NoNewline -ForegroundColor Gray
Write-Host $lanUrl -ForegroundColor Green
Write-Host "   IP local  : $localIp" -ForegroundColor White
Write-Host ''
Write-Host '   Firewall (si el movil no entra), PowerShell Admin:' -ForegroundColor DarkYellow
Write-Host "   New-NetFirewallRule -DisplayName `"PokeOracle 5110`" -Direction Inbound -Protocol TCP -LocalPort 5110 -Action Allow -Profile Private" -ForegroundColor White
Write-Host ''

if (-not $NoBrowser) {
    Open-DefaultBrowser -FilePath $qrHtmlPath
    Write-Host '   Navegador abierto con mostrar-qr.html (automatico)' -ForegroundColor Cyan
    Write-Host ''
}

Write-Host '   Arrancando servidor en http://0.0.0.0:5110 ...' -ForegroundColor Gray
Write-Host '   Detener con Ctrl+C' -ForegroundColor DarkGray
Write-Host ''

# --- 4) Servidor en todas las interfaces ---
Push-Location $projectDir
try {
    $env:ASPNETCORE_URLS = "http://0.0.0.0:$lanPort"
    $env:ASPNETCORE_ENVIRONMENT = 'Development'
    # --no-launch-profile: respeta ASPNETCORE_URLS al pie de la letra (0.0.0.0).
    & dotnet run --no-launch-profile
}
finally {
    Pop-Location
    Write-Host ''
    Write-Host '   PokeOracle detenido.' -ForegroundColor Cyan
    Write-Host ''
}
