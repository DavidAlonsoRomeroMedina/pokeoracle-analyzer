/** Alias trilingües (EN / es-ES / es-LA) → forma canónica para matching. */
export type LocaleId = 'en' | 'es-LA' | 'es-ES';

export const LOCALE_STORAGE_KEY = 'pokeoracle-locale';

export const LOCALE_OPTIONS: { id: LocaleId; label: string; short: string; flag: string }[] = [
  { id: 'en', label: 'English', short: 'EN · English', flag: '🇺🇸' },
  { id: 'es-LA', label: 'Español Latino', short: 'ES · Latino', flag: '🇲🇽' },
  { id: 'es-ES', label: 'Español España', short: 'ES · España', flag: '🇪🇸' },
];

export function loadStoredLocale(): LocaleId {
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (raw === 'en' || raw === 'es-LA' || raw === 'es-ES') return raw;
  } catch { /* ignore */ }
  return 'es-LA';
}

export function persistLocale(locale: LocaleId): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch { /* ignore */ }
}

/** Normaliza para matching: minúsculas, sin acentos, sin símbolos. */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

/**
 * Diccionario de alias: cada grupo contiene nombres equivalentes EN / es-ES / es-LA.
 * La primera entrada de cada grupo se trata como canónica para el catálogo local (español).
 */
const MOVE_ALIAS_GROUPS: string[][] = [
  ['Placaje', 'Tackle', 'Tacleada'],
  ['Gruñido', 'Growl'],
  ['Látigo', 'Tail Whip', 'Latigazo cola'],
  ['Ascuas', 'Ember', 'Ascua'],
  ['Pistola Agua', 'Water Gun', 'Chorro de Agua'],
  ['Hoja Afilada', 'Razor Leaf', 'Hoja Magica', 'Hoja Mágica'],
  ['Impactrueno', 'Thunder Shock', 'Impacto Trueno'],
  ['Rayo', 'Thunderbolt'],
  ['Trueno', 'Thunder'],
  ['Rayo Burbuja', 'Bubble Beam', 'Rayo Burbujas'],
  ['Mordisco', 'Bite', 'Mordida'],
  ['Arañazo', 'Scratch'],
  ['Golpe Karate', 'Karate Chop', 'Golpe Karate'],
  ['Doble Patada', 'Double Kick'],
  ['Patada Baja', 'Low Kick'],
  ['Hiperrayo', 'Hyper Beam', 'Hiperrayo'],
  ['Terremoto', 'Earthquake'],
  ['Avalancha', 'Rock Slide', 'Deslización de Rocas'],
  ['Ventisca', 'Blizzard'],
  ['Rayo Hielo', 'Ice Beam', 'Rayo de Hielo'],
  ['Psíquico', 'Psychic', 'Psiquico'],
  ['Confusión', 'Confusion'],
  ['Hipnosis', 'Hypnosis'],
  ['Amnesia', 'Amnesia'],
  ['Doble Equipo', 'Double Team'],
  ['Tóxico', 'Toxic', 'Toxico'],
  ['Polvo Veneno', 'Poison Powder', 'Polvo Venenoso'],
  ['Somnífero', 'Sleep Powder', 'Somnifero'],
  ['Paralizador', 'Stun Spore', 'Espora Paralizante'],
  ['Espora', 'Spore'],
  ['Rugido', 'Roar'],
  ['Supersónico', 'Supersonic', 'Supersonico'],
  ['Destructor', 'Pound'],
  ['Golpe Cuerpo', 'Body Slam'],
  ['Mega Patada', 'Mega Kick'],
  ['Mega Puño', 'Mega Punch', 'Mega Puno'],
  ['Puño Trueno', 'Thunder Punch', 'Puño Relámpago', 'Puño Relampago'],
  ['Puño Hielo', 'Ice Punch'],
  ['Puño Fuego', 'Fire Punch'],
  ['Puño Cometa', 'Comet Punch'],
  ['Doble Bofetón', 'Double Slap', 'Doble Bofeton', 'Doble Bofetada'],
  ['Ataque Rápido', 'Quick Attack', 'Ataque Rapido'],
  ['Ataque Ala', 'Wing Attack'],
  ['Tornado', 'Gust'],
  ['Vuelo', 'Fly'],
  ['Corte', 'Cut'],
  ['Fuerza', 'Strength'],
  ['Surf', 'Surf', 'Surfeo'],
  ['Cascada', 'Waterfall'],
  ['Golpe Roca', 'Rock Smash', 'Golpe Roca'],
  ['Lanzallamas', 'Flamethrower'],
  ['Fuego Fatuo', 'Will-O-Wisp', 'Fuego Fatuo'],
  ['Giro Fuego', 'Fire Spin'],
  ['Llamarada', 'Fire Blast', 'Anillo Ígneo', 'Anillo Igneo'],
  ['Ácido', 'Acid', 'Acido'],
  ['Bomba Lodo', 'Sludge Bomb', 'Bomba de Lodo'],
  ['Picotazo', 'Peck'],
  ['Ataque Furia', 'Fury Attack'],
  ['Cornada', 'Horn Attack'],
  ['Perforador', 'Horn Drill'],
  ['Ataque Arena', 'Sand Attack', 'Ataque de Arena'],
  ['Derribo', 'Take Down'],
  ['Golpe', 'Slam'],
  ['Sísmico', 'Seismic Toss', 'Sismico'],
  ['Sustituto', 'Substitute'],
  ['Refuerzo', 'Helping Hand'],
  ['Pantalla de Luz', 'Light Screen'],
  ['Reflejo', 'Reflect'],
  ['Protección', 'Protect', 'Proteccion', 'Detección', 'Detect'],
  ['Descanso', 'Rest'],
  ['Golpe Aéreo', 'Aerial Ace', 'Golpe Aereo', 'Ataque Aéreo', 'Ataque Aereo'],
  ['Remolino', 'Whirlwind'],
  ['Patada Salto', 'Jump Kick'],
  ['Patada Salto Alta', 'High Jump Kick', 'Patada Salto Alto'],
  ['Hidrobomba', 'Hydro Pump', 'Hidro Bomba'],
  ['Burbuja', 'Bubble'],
  ['Triturar', 'Crunch'],
  ['Teletransporte', 'Teleport', 'Teletransportacion', 'Teletransportación'],
  ['Psicoonda', 'Psywave'],
  ['Psicoataque', 'Psybeam', 'Psicorrayo'],
  ['Golpe Cabeza', 'Headbutt'],
  ['Doble Filo', 'Double-Edge', 'Doble Filo', 'Doble-Filo'],
  ['Día de Pago', 'Pay Day', 'Dia de Pago'],
  ['Pájaro Osado', 'Brave Bird', 'Pajaro Osado'],
  ['Puño Dinámico', 'Dynamic Punch', 'Puño Dinamico', 'Puno Dinamico'],
  ['Puño Meteoro', 'Meteor Mash'],
  ['Puño Drenaje', 'Drain Punch', 'Puño Drenador'],
  ['Ultrapuño', 'Focus Punch', 'Ultra Puño'],
  ['Contraataque', 'Counter'],
  ['Bofetón Lujurioso', 'Facade', 'Imagen', 'Fachada', 'Bofeton'], // Facade aliases → prefer local if any
  ['Imagen', 'Facade', 'Fachada'], // keep even if not in Gen1 JSON
  ['Explosión', 'Explosion', 'Explosion'],
  ['Autodestrucción', 'Self-Destruct', 'Autodestruccion', 'Selfdestruct'],
  ['Guillotina', 'Guillotine'],
  ['Furia', 'Thrash', 'Furia'],
  ['V. Cortante (Razor Wind)', 'Razor Wind', 'Viento Cortante'],
  ['Danza Espada', 'Swords Dance'],
  ['Agilidad', 'Agility'],
  ['Defensa Ácida', 'Acid Armor', 'Armadura Acida', 'Armadura Ácida'],
  ['Rayo Confuso', 'Confuse Ray'],
  ['Transformación', 'Transform', 'Transformacion'],
  ['Conversión', 'Conversion', 'Conversion'],
  ['Esquema', 'Sketch'],
  ['Mimético', 'Mimic', 'Mimetico'],
  ['Copión', 'Mirror Move', 'Copion', 'Movimiento Espejo'],
  ['Venganza', 'Revenge', 'Vendetta'],
  ['Atadura', 'Bind'],
  ['Torbellino', 'Whirlpool'],
  ['Clamp', 'Clamp', 'Tenaza'],
  ['Constricción', 'Wrap', 'Constriccion'],
  ['Absorber', 'Absorb', 'Absorcion', 'Absorción'],
  ['Barrera', 'Barrier'],
  ['Barrage', 'Barrage', 'Bombardeo'],
  ['Malicioso', 'Leer'],
  ['Endurecer', 'Harden'],
  ['Latigazo', 'Vine Whip'],
  ['Rayo Solar', 'Solar Beam', 'Rayo Solar', 'Solarbeam'],
  ['Onda Trueno', 'Thunder Wave'],
  ['Niebla', 'Haze'],
  ['Lanza Rocas', 'Rock Throw', 'Lanzarrocas'],
  ['Picadura', 'Bug Bite', 'Picadura'],
  ['Doble Ataque', 'Fury Swipes', 'Golpes Furia'],
  ['Pin Misil', 'Pin Missile', 'Pin Misil'],
  ['Furia Dragón', 'Dragon Rage', 'Furia Dragon'],
  ['Lengüetazo', 'Lick', 'Lenguetazo'],
  ['Tinieblas', 'Night Shade'],
  ['Kinesis', 'Kinesis'],
  ['Gas Venenoso', 'Poison Gas'],
  // Gen 3+ comunes que aparecen en Showdown aunque no estén en el JSON Gen1
  ['Imagen', 'Facade', 'Fachada'],
  ['Tajo Aéreo', 'Air Slash', 'Tajo Aereo', 'Corte Aéreo'],
  ['Bola Sombra', 'Shadow Ball'],
  ['Pulso Umbrío', 'Dark Pulse', 'Pulso Umbrío', 'Pulso Umbrío'],
  ['Hierba Lazo', 'Grass Knot'],
  ['Voltio Cambio', 'Volt Switch', 'Cambio Voltaico'],
  ['Ida y Vuelta', 'U-turn', 'Ida y Vuelta', 'U turn'],
  ['Demolición', 'Brick Break', 'Demolicion', 'Rompe ladrillos'],
  ['Puño Trueno', 'ThunderPunch', 'Thunderpunch'],
  ['Cola Férrea', 'Iron Tail', 'Cola Ferrea'],
  ['Cabezazo Zen', 'Zen Headbutt'],
  ['Pulso Dragón', 'Dragon Pulse', 'Pulso Dragon'],
  ['Onda Certera', 'Aura Sphere'],
  ['Energibola', 'Energy Ball', 'Bola Energía', 'Bola Energia'],
  ['Tierra Viva', 'Earth Power'],
  ['Hidropulso', 'Water Pulse'],
  ['Rayo Hielo', 'IceBeam'],
];

const ABILITY_ALIAS_GROUPS: string[][] = [
  ['Mar Llamas', 'Blaze'],
  ['Torrente', 'Torrent'],
  ['Espesura', 'Overgrow'],
  ['Enjambre', 'Swarm'],
  ['Levitación', 'Levitate', 'Levitacion'],
  ['Foco Interno', 'Inner Focus'],
  ['Inmunidad', 'Immunity'],
  ['Absorbe Agua', 'Water Absorb'],
  ['Absorbe Electricidad', 'Volt Absorb'],
  ['Bucle Arena', 'Sand Stream', 'Chorro Arena'],
  ['Cuerpo Puro', 'Clear Body'],
  ['Gran Encanto', 'Cute Charm'],
  ['Clorofila', 'Chlorophyll'],
  ['Presión', 'Pressure', 'Presion'],
  ['Intimidación', 'Intimidate', 'Intimidacion'],
  ['Sincronía', 'Synchronize', 'Sincronia'],
  ['Despiste', 'Oblivious'],
  ['Cuerpo Llama', 'Flame Body'],
  ['Piel Tosca', 'Rough Skin'],
  ['Cabeza Roca', 'Rock Head'],
  ['Robustez', 'Sturdy'],
  ['Electricidad Estática', 'Static', 'Electricidad Estatica', 'Estática', 'Estatica'],
  ['Espíritu Vital', 'Vital Spirit', 'Espiritu Vital'],
  ['Madrugar', 'Early Bird'],
  ['Fuga', 'Run Away'],
  ['Vista Lince', 'Keen Eye'],
  ['Agallas', 'Guts'],
  ['Cromolente', 'Color Change', 'Cambio Color'],
  ['Cura Lluvia', 'Rain Dish'],
  ['Potencia', 'Huge Power', 'Hyper Cutter', 'Corte Fuerte'],
  ['Sustituto', 'Shadow Tag'], // placeholder common mismatch guard
  ['Impulso', 'Speed Boost'],
  ['Poder Solar', 'Solar Power'],
  ['Sebo', 'Thick Fat'],
  ['Mudar', 'Shed Skin'],
  ['Polvo Escudo', 'Shield Dust'],
  ['Humedad', 'Damp'],
  ['Velo Agua', 'Water Veil'],
  ['Nado Rápido', 'Swift Swim', 'Nado Rapido'],
  ['Aclimatación', 'Cloud Nine', 'Aclimatacion'],
  ['Predicción', 'Forecast', 'Prediccion'],
];

const ITEM_ALIAS_GROUPS: string[][] = [
  ['Restos', 'Leftovers'],
  ['Baya Ziuela', 'Sitrus Berry', 'Baya Zidra'],
  ['Baya Safre', 'Lum Berry', 'Baya Ziuela'],
  ['Banda Focus', 'Focus Band', 'Cinta Focus'],
  ['Cuchara Torcida', 'Twisted Spoon'],
  ['Imán', 'Magnet', 'Iman'],
  ['Carbón', 'Charcoal', 'Carbon'],
  ['Lente de Agua', 'Mystic Water'],
  ['Cinturón Negro', 'Black Belt', 'Cinturon Negro'],
  ['Hierba Blanca', 'White Herb'],
  ['Gafas Especiales', 'Choice Specs', 'Gafas Elegidas'],
  ['Pañuelo Elegido', 'Choice Scarf', 'Panuelo Elegido'],
  ['Cinta Elegida', 'Choice Band'],
  ['Vidasfera', 'Life Orb', 'Orbe Vida'],
  ['Baya Acido', 'Occa Berry'],
  ['Orbe Tormento', 'Toxic Orb'],
  ['Orbe Llama', 'Flame Orb'],
  ['Restos', 'Leftovers'],
  ['Baya Zidra', 'Sitrus Berry'],
  ['Baya Ziñan', 'Chesto Berry', 'Baya Zinan'],
  ['Poké Ball', 'Poke Ball', 'Pokeball'],
];

function buildAliasIndex(groups: string[][]): Map<string, Set<string>> {
  const index = new Map<string, Set<string>>();
  for (const group of groups) {
    const slugs = group.map(slugify).filter(Boolean);
    const set = new Set(slugs);
    for (const s of slugs) {
      const existing = index.get(s);
      if (existing) {
        for (const x of set) existing.add(x);
      } else {
        index.set(s, new Set(set));
      }
    }
  }
  return index;
}

export const MOVE_ALIAS_INDEX = buildAliasIndex(MOVE_ALIAS_GROUPS);
export const ABILITY_ALIAS_INDEX = buildAliasIndex(ABILITY_ALIAS_GROUPS);
export const ITEM_ALIAS_INDEX = buildAliasIndex(ITEM_ALIAS_GROUPS);

/** True si a y b son el mismo concepto vía slug o alias trilingüe. */
export function namesMatch(
  a: string,
  b: string,
  aliasIndex: Map<string, Set<string>> = MOVE_ALIAS_INDEX
): boolean {
  const na = slugify(a);
  const nb = slugify(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const aliases = aliasIndex.get(na);
  if (aliases?.has(nb)) return true;
  const aliasesB = aliasIndex.get(nb);
  if (aliasesB?.has(na)) return true;
  return false;
}

export function matchInList(
  query: string,
  list: string[],
  aliasIndex: Map<string, Set<string>>
): string | undefined {
  const exact = list.find((item) => namesMatch(query, item, aliasIndex));
  if (exact) return exact;
  // fallback contains
  const q = slugify(query);
  return list.find((item) => {
    const s = slugify(item);
    return s.includes(q) || q.includes(s);
  });
}

export type UiMessages = {
  status: string;
  sessionActive: string;
  buildingTeams: string;
  settings: string;
  reset: string;
  language: string;
  yourSquad: string;
  rivalSquad: string;
  import: string;
  profile: string;
  create: string;
  pokedex: string;
  engine: string;
  themeTitle: string;
  themeHint: string;
  active: string;
  close: string;
  importTitle: string;
  importHintPlayer: string;
  importHintRival: string;
  applyTeam: string;
  cancel: string;
  langTitle: string;
  langHint: string;
  profileTitle: string;
  createTitle: string;
  pokedexTitle: string;
  national: string;
  originals: string;
  savePokemon: string;
  username: string;
  country: string;
  registered: string;
  battles: string;
  wins: string;
  multiWins: string;
  created: string;
  likes: string;
  friends: string;
};

const UI: Record<LocaleId, UiMessages> = {
  en: {
    status: 'Status',
    sessionActive: 'Active session',
    buildingTeams: 'Building teams',
    settings: 'Settings',
    reset: 'Reset',
    language: 'EN · English',
    yourSquad: 'Your squad',
    rivalSquad: 'Rival squad',
    import: 'Import',
    profile: 'Profile',
    create: 'Create',
    pokedex: 'Pokédex',
    engine: 'Engine',
    themeTitle: 'Settings & Visual Theme',
    themeHint: 'Pick a look. Saved automatically in this browser.',
    active: 'Active',
    close: 'Close',
    importTitle: 'Import Showdown team',
    importHintPlayer: 'Paste Pokémon Showdown export text for your squad.',
    importHintRival: 'Paste Pokémon Showdown export text for the rival squad.',
    applyTeam: 'Apply to team',
    cancel: 'Cancel',
    langTitle: 'Language',
    langHint: 'Choose UI language. Catalog matching stays trilingual.',
    profileTitle: 'Trainer Profile',
    createTitle: 'Create Pokémon',
    pokedexTitle: 'Pokédex',
    national: 'National (Real)',
    originals: 'Originals (Created)',
    savePokemon: 'Save Pokémon',
    username: 'Username',
    country: 'Country',
    registered: 'Registered',
    battles: 'Battles Fought',
    wins: 'Battles Won',
    multiWins: 'Multiplayer Wins',
    created: 'Pokémon Created',
    likes: 'Likes Received',
    friends: 'Friends',
  },
  'es-LA': {
    status: 'Estado',
    sessionActive: 'Sesión activa',
    buildingTeams: 'Armando equipos',
    settings: 'Configuración',
    reset: 'Reiniciar',
    language: 'ES · Latino',
    yourSquad: 'Tu plantel',
    rivalSquad: 'Plantel rival',
    import: 'Importar',
    profile: 'Perfil',
    create: 'Crear',
    pokedex: 'Pokédex',
    engine: 'Motor',
    themeTitle: 'Configuración & Tema Visual',
    themeHint: 'Elige un aspecto. Se guarda automáticamente en este navegador.',
    active: 'Activo',
    close: 'Cerrar',
    importTitle: 'Importar equipo Showdown',
    importHintPlayer: 'Pega el texto exportado de Pokémon Showdown para el plantel aliado.',
    importHintRival: 'Pega el texto exportado de Pokémon Showdown para el plantel rival.',
    applyTeam: 'Aplicar al equipo',
    cancel: 'Cancelar',
    langTitle: 'Idioma',
    langHint: 'Elige el idioma de la interfaz. El matching de catálogo sigue siendo trilingüe.',
    profileTitle: 'Perfil de Entrenador',
    createTitle: 'Crear Pokémon',
    pokedexTitle: 'Pokédex',
    national: 'Nacional (Reales)',
    originals: 'Originales (Creados)',
    savePokemon: 'Guardar Pokémon',
    username: 'Nombre de usuario',
    country: 'País',
    registered: 'Registro',
    battles: 'Combates Realizados',
    wins: 'Combates Ganados',
    multiWins: 'Victoria Multijugador',
    created: 'Pokémon Creados',
    likes: 'Me Gusta Recibidos',
    friends: 'Número de Amigos',
  },
  'es-ES': {
    status: 'Estado',
    sessionActive: 'Sesión activa',
    buildingTeams: 'Preparando equipos',
    settings: 'Ajustes',
    reset: 'Reiniciar',
    language: 'ES · España',
    yourSquad: 'Tu equipo',
    rivalSquad: 'Equipo rival',
    import: 'Importar',
    profile: 'Perfil',
    create: 'Crear',
    pokedex: 'Pokédex',
    engine: 'Motor',
    themeTitle: 'Ajustes y tema visual',
    themeHint: 'Elige un aspecto. Se guarda automáticamente en este navegador.',
    active: 'Activo',
    close: 'Cerrar',
    importTitle: 'Importar equipo Showdown',
    importHintPlayer: 'Pega el texto exportado de Pokémon Showdown para tu equipo.',
    importHintRival: 'Pega el texto exportado de Pokémon Showdown para el equipo rival.',
    applyTeam: 'Aplicar al equipo',
    cancel: 'Cancelar',
    langTitle: 'Idioma',
    langHint: 'Elige el idioma de la interfaz. La coincidencia de catálogo sigue siendo trilingüe.',
    profileTitle: 'Perfil de Entrenador',
    createTitle: 'Crear Pokémon',
    pokedexTitle: 'Pokédex',
    national: 'Nacional (Reales)',
    originals: 'Originales (Creados)',
    savePokemon: 'Guardar Pokémon',
    username: 'Nombre de usuario',
    country: 'País',
    registered: 'Alta',
    battles: 'Combates realizados',
    wins: 'Combates ganados',
    multiWins: 'Victorias multijugador',
    created: 'Pokémon creados',
    likes: 'Me gusta recibidos',
    friends: 'Número de amigos',
  },
};

export function t(locale: LocaleId): UiMessages {
  return UI[locale];
}
