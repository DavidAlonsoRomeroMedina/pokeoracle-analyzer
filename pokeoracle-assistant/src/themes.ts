export type ThemeId = 'kanto' | 'amoled' | 'gameboy' | 'synthwave';

export interface ThemeOption {
  id: ThemeId;
  label: string;
  description: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'kanto',
    label: 'Kanto Deck',
    description: 'Tema oscuro actual con acentos rosa/naranja',
  },
  {
    id: 'amoled',
    label: 'Dark AMOLED',
    description: 'Negros puros y acentos vibrantes',
  },
  {
    id: 'gameboy',
    label: 'Retro Gameboy',
    description: 'Paleta monocromática verde clásica',
  },
  {
    id: 'synthwave',
    label: 'Neon Synthwave',
    description: 'Morados profundos, magenta y cian neón',
  },
];

export const THEME_STORAGE_KEY = 'pokeoracle-theme';

export function loadStoredTheme(): ThemeId {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw && THEME_OPTIONS.some((t) => t.id === raw)) {
      return raw as ThemeId;
    }
  } catch {
    /* ignore */
  }
  return 'kanto';
}

export function persistTheme(theme: ThemeId): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}
