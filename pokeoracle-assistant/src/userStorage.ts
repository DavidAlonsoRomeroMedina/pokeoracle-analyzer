import type { PokemonType } from './types';

export const PROFILE_KEY = 'pokeoracle-profile';
export const CREATED_KEY = 'pokeoracle-created-pokemon';
export const SEEN_KEY = 'pokeoracle-seen-species';

export interface UserStats {
  battles: number;
  wins: number;
  multiWins: number;
  created: number;
  likes: number;
  friends: number;
}

export interface UserProfile {
  username: string;
  uniqueId: string;
  avatarDataUrl: string;
  country: string;
  registeredAt: string;
  stats: UserStats;
}

export interface CreatedPokemon {
  id: string;
  name: string;
  types: PokemonType[];
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
  ability: string;
  customAbilityEffect?: string;
  moves: { name: string; customEffect?: string }[];
  spriteDataUrl: string;
  spriteFromCatalog?: string;
  createdAt: string;
}

const COUNTRIES = [
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'JP', name: '日本', flag: '🇯🇵' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
];

export { COUNTRIES };

function randomPokeId(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `#POKE-${n}`;
}

export function defaultProfile(): UserProfile {
  return {
    username: 'Entrenador',
    uniqueId: randomPokeId(),
    avatarDataUrl: '',
    country: 'MX',
    registeredAt: new Date().toISOString(),
    stats: {
      battles: 0,
      wins: 0,
      multiWins: 0,
      created: 0,
      likes: 0,
      friends: 0,
    },
  };
}

export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) {
      const fresh = defaultProfile();
      persistProfile(fresh);
      return fresh;
    }
    const parsed = JSON.parse(raw) as UserProfile;
    if (!parsed.uniqueId) parsed.uniqueId = randomPokeId();
    if (!parsed.stats) parsed.stats = defaultProfile().stats;
    return parsed;
  } catch {
    return defaultProfile();
  }
}

export function persistProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch { /* ignore */ }
}

export function loadCreatedPokemon(): CreatedPokemon[] {
  try {
    const raw = localStorage.getItem(CREATED_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CreatedPokemon[];
  } catch {
    return [];
  }
}

export function persistCreatedPokemon(list: CreatedPokemon[]): void {
  try {
    localStorage.setItem(CREATED_KEY, JSON.stringify(list));
  } catch { /* ignore */ }
}

export function loadSeenSpecies(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function persistSeenSpecies(names: string[]): void {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...new Set(names)]));
  } catch { /* ignore */ }
}

export function markSpeciesSeen(current: string[], names: string[]): string[] {
  const next = [...new Set([...current, ...names.filter(Boolean)])];
  persistSeenSpecies(next);
  return next;
}

export function countryMeta(code: string) {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}
