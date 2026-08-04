#!/usr/bin/env bash
# =============================================================================
# PokeOracle - equivalente bash de run-app.bat
#
# Flujo automatico:
#   1) Detecta IPv4 local
#   2) Escribe mostrar-qr.html en la raiz del repo
#   3) Abre ese HTML en el navegador (xdg-open / open)
#   4) Arranca la WebApi en http://0.0.0.0:5110
#
# Uso:
#   ./run-app.sh
#   ./run-app.sh --no-browser
#   ./run-app.sh --rebuild-ui
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

LAN_PORT=5110
PROJECT_DIR="$ROOT/PokeOracle-Backend/PokeOracle.WebApi"
WWWROOT_INDEX="$PROJECT_DIR/wwwroot/index.html"
FRONTEND_DIR="$ROOT/pokeoracle-assistant"
QR_HTML="$ROOT/mostrar-qr.html"

NO_BROWSER=0
REBUILD_UI=0
for arg in "$@"; do
  case "$arg" in
    --no-browser) NO_BROWSER=1 ;;
    --rebuild-ui) REBUILD_UI=1 ;;
  esac
done

detect_ip() {
  # Preferir la IP de la ruta por defecto (interfaz Wi-Fi / LAN activa).
  if command -v ip >/dev/null 2>&1; then
    ip -4 route get 8.8.8.8 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src"){print $(i+1); exit}}'
    return
  fi
  if command -v hostname >/dev/null 2>&1; then
    hostname -I 2>/dev/null | awk '{print $1}'
    return
  fi
  python3 - <<'PY'
import socket
s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
try:
    s.connect(("8.8.8.8", 53))
    print(s.getsockname()[0])
finally:
    s.close()
PY
}

open_browser() {
  local file="$1"
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$file" >/dev/null 2>&1 || true
  elif command -v open >/dev/null 2>&1; then
    open "$file"
  else
    echo "  No se encontro xdg-open/open. Abre manualmente: $file"
  fi
}

write_qr_html() {
  local lan_url="$1"
  local local_ip="$2"
  local encoded
  encoded="$(python3 -c "import urllib.parse; print(urllib.parse.quote('''$lan_url''', safe=''))")"

  cat > "$QR_HTML" <<EOF
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
           src="https://api.qrserver.com/v1/create-qr-code/?size=420x420&amp;margin=8&amp;data=${encoded}"
           alt="Codigo QR PokeOracle"
           onerror="this.style.display='none'; window.renderJsQr && window.renderJsQr();" />
    </div>
    <a class="url" href="${lan_url}">${lan_url}</a>
    <p class="meta">IP detectada: ${local_ip} · Puerto 5110</p>
  </div>
  <script>
    window.renderJsQr = function () {
      var host = document.getElementById('qr');
      host.innerHTML = '';
      if (typeof QRCode === 'undefined') {
        host.innerHTML = '<p style="color:#111;font-weight:700;padding:12px">No se pudo generar el QR. Abre:<br>${lan_url}</p>';
        return;
      }
      QRCode.toCanvas("${lan_url}", { width: 380, margin: 2 }, function (err, canvas) {
        if (err) {
          host.innerHTML = '<p style="color:#111;font-weight:700;padding:12px">${lan_url}</p>';
          return;
        }
        host.appendChild(canvas);
      });
    };
  </script>
</body>
</html>
EOF
}

if ! command -v dotnet >/dev/null 2>&1; then
  # Ruta tipica del install script en este entorno
  export PATH="${HOME}/.dotnet:${PATH}"
fi
if ! command -v dotnet >/dev/null 2>&1; then
  echo "  No se encontro el SDK de .NET."
  exit 1
fi

if [[ ! -d "$PROJECT_DIR" ]]; then
  echo "  No se encontro $PROJECT_DIR. Ejecuta desde la raiz del repo."
  exit 1
fi

if [[ "$REBUILD_UI" -eq 1 || ! -f "$WWWROOT_INDEX" ]]; then
  if ! command -v npm >/dev/null 2>&1; then
    echo "  Falta wwwroot y no hay npm."
    exit 1
  fi
  echo "  Construyendo la web app..."
  (
    cd "$FRONTEND_DIR"
    [[ -d node_modules ]] || npm install
    npm run build:dotnet
  )
fi

LOCAL_IP="$(detect_ip | tr -d '[:space:]')"
if [[ -z "$LOCAL_IP" || "$LOCAL_IP" == 127.* ]]; then
  echo "  No se pudo detectar una IPv4 local. Revisa el Wi-Fi."
  exit 1
fi

LAN_URL="http://${LOCAL_IP}:${LAN_PORT}"
write_qr_html "$LAN_URL" "$LOCAL_IP"

echo ""
echo "  =========================================================="
echo "     PokeOracle  -  QR listo para escanear"
echo "  =========================================================="
echo ""
echo "   Archivo   : mostrar-qr.html"
echo "   URL movil : $LAN_URL"
echo "   IP local  : $LOCAL_IP"
echo ""
echo "   Firewall (Windows, si aplica), PowerShell Admin:"
echo "   New-NetFirewallRule -DisplayName \"PokeOracle 5110\" -Direction Inbound -Protocol TCP -LocalPort 5110 -Action Allow -Profile Private"
echo ""

if [[ "$NO_BROWSER" -eq 0 ]]; then
  open_browser "$QR_HTML"
  echo "   Navegador abierto con mostrar-qr.html (automatico)"
  echo ""
fi

echo "   Arrancando servidor en http://0.0.0.0:5110 ..."
echo "   Detener con Ctrl+C"
echo ""

cd "$PROJECT_DIR"
export ASPNETCORE_URLS="http://0.0.0.0:${LAN_PORT}"
export ASPNETCORE_ENVIRONMENT=Development
exec dotnet run --no-launch-profile
