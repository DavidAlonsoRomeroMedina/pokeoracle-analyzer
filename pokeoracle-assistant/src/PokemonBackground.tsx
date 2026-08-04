const DECOR_SPRITES = [
  { id: 25, top: '8%', left: '6%', size: 92, opacity: 0.12, delay: '0s' },
  { id: 6, top: '18%', right: '7%', size: 120, opacity: 0.14, delay: '0.8s' },
  { id: 1, bottom: '22%', left: '10%', size: 100, opacity: 0.12, delay: '1.4s' },
  { id: 7, bottom: '12%', right: '12%', size: 88, opacity: 0.13, delay: '0.4s' },
  { id: 150, top: '42%', left: '3%', size: 110, opacity: 0.1, delay: '1.8s' },
  { id: 94, top: '55%', right: '4%', size: 96, opacity: 0.11, delay: '1.1s' },
  { id: 143, bottom: '4%', left: '38%', size: 108, opacity: 0.1, delay: '2.2s' },
  { id: 131, top: '6%', left: '42%', size: 84, opacity: 0.1, delay: '0.6s' },
] as const;

/**
 * Fondo temático de la app: degradado oscuro, patrón de siluetas y
 * artwork oficial suave de Kanto para dar atmósfera sin tapar la UI.
 */
export function PokemonBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Base */}
      <div className="absolute inset-0 bg-[#070b14]" />

      {/* Gradientes de atmósfera */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(239,68,68,0.22),_transparent_45%),radial-gradient(ellipse_at_bottom_right,_rgba(56,189,248,0.16),_transparent_40%),radial-gradient(ellipse_at_bottom_left,_rgba(34,197,94,0.12),_transparent_35%)]" />

      {/* Patrón de siluetas (SVG inline, sin dependencia externa) */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(SILHOUETTE_PATTERN)}")`,
          backgroundSize: '220px 220px',
        }}
      />

      {/* Artwork flotante de Kanto */}
      {DECOR_SPRITES.map((sprite) => (
        <img
          key={sprite.id}
          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${sprite.id}.png`}
          alt=""
          className="absolute animate-float select-none"
          style={{
            top: 'top' in sprite ? sprite.top : undefined,
            left: 'left' in sprite ? sprite.left : undefined,
            right: 'right' in sprite ? sprite.right : undefined,
            bottom: 'bottom' in sprite ? sprite.bottom : undefined,
            width: sprite.size,
            height: sprite.size,
            opacity: sprite.opacity,
            animationDelay: sprite.delay,
            filter: 'grayscale(0.15) saturate(1.1)',
            imageRendering: 'auto',
          }}
        />
      ))}

      {/* Viñeta para legibilidad */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(7,11,20,0.75)_100%)]" />
    </div>
  );
}

const SILHOUETTE_PATTERN = `
<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220">
  <g fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <!-- Pokéball -->
    <circle cx="48" cy="48" r="22"/>
    <path d="M26 48h44"/>
    <circle cx="48" cy="48" r="6"/>
    <!-- Pikachu-ish ears -->
    <path d="M120 70c8-28 18-34 22-34s6 10 2 28"/>
    <path d="M168 70c-8-28-18-34-22-34s-6 10-2 28"/>
    <ellipse cx="144" cy="88" rx="28" ry="24"/>
    <!-- Squirtle shell -->
    <ellipse cx="60" cy="160" rx="26" ry="22"/>
    <path d="M42 160c6 10 30 10 36 0"/>
    <path d="M78 148c10 2 16 12 12 22"/>
    <!-- Bulba bulb -->
    <path d="M150 150c-8-24 8-40 22-40 12 0 26 14 18 38"/>
    <ellipse cx="172" cy="172" rx="24" ry="18"/>
  </g>
</svg>
`;
