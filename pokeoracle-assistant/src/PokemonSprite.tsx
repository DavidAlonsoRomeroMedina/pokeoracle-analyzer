import { useEffect, useState } from 'react';

type SpriteSize = 'xs' | 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<SpriteSize, string> = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

const FALLBACK_TEXT: Record<SpriteSize, string> = {
  xs: 'text-[10px]',
  sm: 'text-[11px]',
  md: 'text-sm',
  lg: 'text-base',
};

interface PokemonSpriteProps {
  name?: string;
  src?: string | null;
  size?: SpriteSize;
  /** Atenúa el sprite cuando el Pokémon está debilitado. */
  fainted?: boolean;
  className?: string;
}

/**
 * Sprite de un Pokémon. Si no hay imagen disponible, o si falla la descarga,
 * cae en la inicial del nombre para que la interfaz nunca quede con un hueco.
 */
export function PokemonSprite({
  name,
  src,
  size = 'sm',
  fainted = false,
  className = '',
}: PokemonSpriteProps) {
  const [failed, setFailed] = useState(false);

  // Al cambiar de especie hay que volver a intentar la descarga.
  useEffect(() => setFailed(false), [src]);

  const box = `${SIZE_CLASSES[size]} shrink-0 ${className}`;

  if (!src || failed) {
    return (
      <div
        className={`${box} flex items-center justify-center rounded-xl bg-white/10 text-white/70 font-bold font-mono ${FALLBACK_TEXT[size]}`}
        title={name}
        aria-hidden="true"
      >
        {name?.charAt(0).toUpperCase() ?? '?'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name ?? 'Pokémon'}
      title={name}
      loading="lazy"
      onError={() => setFailed(true)}
      // Los sprites son pixel art: al escalarlos conviene no interpolar.
      style={{ imageRendering: 'pixelated' }}
      className={`${box} object-contain ${fainted ? 'opacity-40 grayscale' : ''}`}
    />
  );
}
