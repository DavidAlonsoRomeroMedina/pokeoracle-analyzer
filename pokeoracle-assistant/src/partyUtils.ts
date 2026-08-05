import type { Move, Pokemon, StatusEffect } from './types';

const emptyMove = (): Move => ({
  name: '',
  type: 'Normal',
  category: 'Status',
  power: 0,
  accuracy: 100,
  statusChance: 0,
  statusEffect: 'None' as StatusEffect,
  isFixedDamage: false,
  fixedDamageValue: 0,
});

/** Slot placeholder sin especie cargada. */
export function emptySlot(_index = 0): Pokemon {
  return {
    name: '',
    types: ['Normal'],
    hp: 0,
    maxHp: 0,
    attack: 0,
    defense: 0,
    spAttack: 0,
    spDefense: 0,
    speed: 0,
    status: 'None',
    ability: 'None',
    heldItem: 'None',
    moves: [emptyMove(), emptyMove(), emptyMove(), emptyMove()],
  };
}

export function emptyParty(): Pokemon[] {
  return Array.from({ length: 6 }, (_, i) => emptySlot(i));
}

export function isSlotEmpty(p?: Pokemon | null): boolean {
  return !p || !p.name?.trim();
}
