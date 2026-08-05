import type { Move, Pokemon, PokemonCatalogEntry, PokemonType, StatusEffect } from './types';
import {
  ABILITY_ALIAS_INDEX,
  ITEM_ALIAS_INDEX,
  MOVE_ALIAS_INDEX,
  matchInList,
  namesMatch,
  slugify,
} from './i18n';

export interface ParsedShowdownPokemon {
  species: string;
  nickname?: string;
  item?: string;
  ability?: string;
  nature?: string;
  level?: number;
  evs?: Partial<Record<'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe', number>>;
  ivs?: Partial<Record<'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe', number>>;
  moves: string[];
}

export interface ShowdownParseResult {
  ok: boolean;
  pokemon: ParsedShowdownPokemon[];
  error?: string;
}

const STAT_KEY: Record<string, 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe'> = {
  hp: 'hp',
  atk: 'atk',
  attack: 'atk',
  def: 'def',
  defense: 'def',
  spa: 'spa',
  'sp. atk': 'spa',
  spatk: 'spa',
  spd: 'spd',
  'sp. def': 'spd',
  spdef: 'spd',
  spe: 'spe',
  speed: 'spe',
};

const EMPTY_MOVE = (): Move => ({
  name: 'Struggle',
  type: 'Normal',
  category: 'Physical',
  power: 50,
  accuracy: 100,
  statusChance: 0,
  statusEffect: 'None' as StatusEffect,
  isFixedDamage: false,
  fixedDamageValue: 0,
});

function parseStatBlock(
  line: string,
  prefix: 'EVs' | 'IVs'
): Partial<Record<'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe', number>> | null {
  const re = new RegExp(`^${prefix}:\\s*(.+)$`, 'i');
  const match = line.match(re);
  if (!match) return null;

  const result: Partial<Record<'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe', number>> = {};
  for (const part of match[1].split('/')) {
    const token = part.trim().match(/^(\d+)\s+(.+)$/);
    if (!token) continue;
    const key = STAT_KEY[token[2].trim().toLowerCase()];
    if (key) result[key] = Number(token[1]);
  }
  return result;
}

/**
 * Parsea texto plano en formato Pokémon Showdown export.
 * Soporta nickname, @ item, Ability/Habilidad, Nature/Naturaleza, EVs, IVs y movimientos (- Move).
 */
export function parseShowdownTeam(text: string): ShowdownParseResult {
  const raw = text.replace(/\r\n/g, '\n').trim();
  if (!raw) {
    return { ok: false, pokemon: [], error: 'El texto está vacío. Pega un equipo en formato Showdown.' };
  }

  const blocks = raw
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return { ok: false, pokemon: [], error: 'No se encontró ningún Pokémon en el texto.' };
  }

  const pokemon: ParsedShowdownPokemon[] = [];

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;

    const header = lines[0];
    let species = header;
    let nickname: string | undefined;
    let item: string | undefined;

    const atIdx = header.lastIndexOf(' @ ');
    if (atIdx >= 0) {
      item = header.slice(atIdx + 3).trim();
      species = header.slice(0, atIdx).trim();
    }

    species = species.replace(/\s*\((?:M|F|m|f)\)\s*$/, '').trim();

    const nickMatch = species.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    if (nickMatch) {
      const maybeSpecies = nickMatch[2].trim();
      if (!/^[MF]$/i.test(maybeSpecies)) {
        nickname = nickMatch[1].trim();
        species = maybeSpecies;
      }
    }

    if (!species) continue;

    const parsed: ParsedShowdownPokemon = {
      species,
      nickname,
      item,
      moves: [],
    };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      const ability =
        line.match(/^Ability:\s*(.+)$/i) ||
        line.match(/^Habilidad:\s*(.+)$/i);
      if (ability) {
        parsed.ability = ability[1].trim();
        continue;
      }

      const nature =
        line.match(/^(.+?)\s+Nature$/i) ||
        line.match(/^Naturaleza:\s*(.+)$/i);
      if (nature) {
        parsed.nature = nature[1].trim();
        continue;
      }

      const level = line.match(/^Level:\s*(\d+)/i) || line.match(/^Nivel:\s*(\d+)/i);
      if (level) {
        parsed.level = Number(level[1]);
        continue;
      }

      const evs = parseStatBlock(line, 'EVs');
      if (evs) {
        parsed.evs = evs;
        continue;
      }

      const ivs = parseStatBlock(line, 'IVs');
      if (ivs) {
        parsed.ivs = ivs;
        continue;
      }

      if (/^(Shiny|Tera Type|Gigantamax|Happiness|Hidden Power):/i.test(line)) {
        continue;
      }

      const moveLine = line.match(/^[-•]\s*(.+)$/);
      if (moveLine) {
        const moveName = moveLine[1].replace(/\s*\/\s*.*$/, '').trim();
        if (moveName) parsed.moves.push(moveName);
      }
    }

    pokemon.push(parsed);
  }

  if (pokemon.length === 0) {
    return {
      ok: false,
      pokemon: [],
      error: 'No se pudo leer ningún Pokémon. Verifica que uses el formato de exportación de Showdown.',
    };
  }

  if (pokemon.length > 6) {
    return {
      ok: false,
      pokemon,
      error: `El equipo tiene ${pokemon.length} Pokémon; el máximo es 6.`,
    };
  }

  return { ok: true, pokemon };
}

function findCatalogEntry(
  species: string,
  catalog: PokemonCatalogEntry[]
): PokemonCatalogEntry | undefined {
  const target = slugify(species);
  return (
    catalog.find((p) => slugify(p.name) === target) ||
    catalog.find((p) => {
      const s = slugify(p.name);
      return s.includes(target) || target.includes(s);
    })
  );
}

/** Busca movimiento con matching trilingüe (slug + alias EN/es-ES/es-LA). */
function findMove(name: string, catalog: Move[]): Move | undefined {
  const byAlias = matchInList(
    name,
    catalog.map((m) => m.name),
    MOVE_ALIAS_INDEX
  );
  if (byAlias) {
    return catalog.find((m) => m.name === byAlias);
  }
  // última pasada: namesMatch directo
  return catalog.find((m) => namesMatch(name, m.name, MOVE_ALIAS_INDEX));
}

function findAbility(name: string | undefined, catalog: string[]): string | undefined {
  if (!name) return undefined;
  const matched = matchInList(name, catalog, ABILITY_ALIAS_INDEX);
  return matched ?? name;
}

function findItem(name: string | undefined, catalog: string[]): string | undefined {
  if (!name) return undefined;
  const matched = matchInList(name, catalog, ITEM_ALIAS_INDEX);
  return matched ?? name;
}

function placeholderPokemon(slot: number): Pokemon {
  return {
    name: `Slot ${slot + 1}`,
    types: ['Normal'],
    hp: 100,
    maxHp: 100,
    attack: 50,
    defense: 50,
    spAttack: 50,
    spDefense: 50,
    speed: 50,
    status: 'None',
    ability: 'None',
    heldItem: 'None',
    moves: [EMPTY_MOVE(), EMPTY_MOVE(), EMPTY_MOVE(), EMPTY_MOVE()],
  };
}

/**
 * Convierte un equipo Showdown parseado al modelo Pokemon[] de la app (6 slots).
 * Movimientos desconocidos se conservan con su nombre original (nunca quedan vacíos).
 */
export function showdownToParty(
  parsed: ParsedShowdownPokemon[],
  catalogs: {
    pokemon: PokemonCatalogEntry[];
    moves: Move[];
    abilities: string[];
    items: string[];
  },
  previous?: Pokemon[]
): { party: Pokemon[]; warnings: string[] } {
  const warnings: string[] = [];
  const party: Pokemon[] = Array.from({ length: 6 }, (_, i) =>
    previous?.[i] ? { ...previous[i], moves: [...previous[i].moves] } : placeholderPokemon(i)
  );

  parsed.forEach((entry, index) => {
    const catalogMon = findCatalogEntry(entry.species, catalogs.pokemon);
    if (!catalogMon) {
      warnings.push(`No se encontró «${entry.species}» en el catálogo; se usó el nombre tal cual.`);
    }

    const moves: Move[] = [0, 1, 2, 3].map((i) => {
      const moveName = entry.moves[i];
      if (!moveName) return EMPTY_MOVE();
      const found = findMove(moveName, catalogs.moves);
      if (!found) {
        warnings.push(`Movimiento «${moveName}» no está en el catálogo local; se conservó el nombre.`);
        return {
          ...EMPTY_MOVE(),
          name: moveName,
        };
      }
      return { ...found };
    });

    const types = (catalogMon?.types?.length ? catalogMon.types : ['Normal']) as PokemonType[];

    party[index] = {
      name: catalogMon?.name ?? entry.species,
      types,
      hp: catalogMon?.hp ?? 100,
      maxHp: catalogMon?.hp ?? 100,
      attack: catalogMon?.attack ?? 50,
      defense: catalogMon?.defense ?? 50,
      spAttack: catalogMon?.spAttack ?? 50,
      spDefense: catalogMon?.spDefense ?? 50,
      speed: catalogMon?.speed ?? 50,
      status: 'None',
      ability: findAbility(entry.ability, catalogs.abilities) ?? 'None',
      heldItem: findItem(entry.item, catalogs.items) ?? 'None',
      moves,
    };
  });

  return { party, warnings };
}
