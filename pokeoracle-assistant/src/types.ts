export type PokemonType =
  | 'Normal'
  | 'Fire'
  | 'Water'
  | 'Grass'
  | 'Electric'
  | 'Ice'
  | 'Fighting'
  | 'Poison'
  | 'Ground'
  | 'Flying'
  | 'Psychic'
  | 'Bug'
  | 'Rock'
  | 'Ghost'
  | 'Dragon'
  | 'Dark'
  | 'Steel'
  | 'Fairy';

export type StatusEffect = 'None' | 'Paralysis' | 'Poison' | 'Burn' | 'Sleep' | 'Freeze';

export type MoveCategory = 'Physical' | 'Special' | 'Status';

export interface Move {
  id?: string;
  name: string;
  type: PokemonType;
  category: MoveCategory;
  power: number; // 0 for status
  accuracy: number; // 0-100
  statusChance: number; // 0-100
  statusEffect: StatusEffect;
  isFixedDamage: boolean;
  fixedDamageValue: number;
}

export interface Pokemon {
  id?: string;
  name: string;
  types: PokemonType[];
  hp: number; // Current HP
  maxHp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
  status: StatusEffect;
  moves: Move[];
  ability?: string;
  heldItem?: string;
}

export interface BattleSession {
  sessionId: string;
  playerParty: Pokemon[];
  rivalParty: Pokemon[];
  playerActiveIndex: number;
  rivalActiveIndex: number;
  turnNumber: number;
  history: string[];
  isSwitchRequired?: boolean;
}

export interface BattleSetupRequest {
  playerParty: Pokemon[];
  rivalParty: Pokemon[];
}

export interface TurnStateRequest {
  playerActiveIndex: number;
  rivalActiveIndex: number;
  playerMoveIndex: number; // -1 if switched
  playerSwitchToIndex: number; // -1 if used a move
  rivalMoveIndex: number; // -1 if switched
  rivalSwitchToIndex: number; // -1 if used a move
  isPlayerCritical: boolean;
  isRivalCritical: boolean;
  isPlayerMissed: boolean;
  isRivalMissed: boolean;
  playerStatusApplied: StatusEffect;
  rivalStatusApplied: StatusEffect;
}

export interface SuggestionResult {
  recommendedAction: 'Move' | 'Switch';
  moveIndex?: number;
  moveName?: string;
  switchIndex?: number;
  switchPokemonName?: string;
  confidence: number; // percentage
  explanation: string;
  simulatedPaths: string[];
}
