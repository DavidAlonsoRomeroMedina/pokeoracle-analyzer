import { Pokemon } from './types.js';

export const defaultPlayerParty: Pokemon[] = [
  {
    name: 'Charizard',
    types: ['Fire', 'Flying'],
    hp: 153,
    maxHp: 153,
    attack: 104,
    defense: 98,
    spAttack: 129,
    spDefense: 105,
    speed: 120,
    status: 'None',
    moves: [
      { name: 'Flamethrower', type: 'Fire', category: 'Special', power: 95, accuracy: 100, statusChance: 10, statusEffect: 'Burn', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Fly', type: 'Flying', category: 'Physical', power: 90, accuracy: 95, statusChance: 0, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Dragon Rage', type: 'Dragon', category: 'Special', power: 0, accuracy: 100, statusChance: 0, statusEffect: 'None', isFixedDamage: true, fixedDamageValue: 40 },
      { name: 'Slash', type: 'Normal', category: 'Physical', power: 70, accuracy: 100, statusChance: 0, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 }
    ]
  },
  {
    name: 'Snorlax',
    types: ['Normal'],
    hp: 235,
    maxHp: 235,
    attack: 130,
    defense: 85,
    spAttack: 85,
    spDefense: 130,
    speed: 50,
    status: 'None',
    moves: [
      { name: 'Body Slam', type: 'Normal', category: 'Physical', power: 85, accuracy: 100, statusChance: 30, statusEffect: 'Paralysis', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Earthquake', type: 'Ground', category: 'Physical', power: 100, accuracy: 100, statusChance: 0, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Shadow Ball', type: 'Ghost', category: 'Physical', power: 80, accuracy: 100, statusChance: 0, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Toxic', type: 'Poison', category: 'Status', power: 0, accuracy: 85, statusChance: 100, statusEffect: 'Poison', isFixedDamage: false, fixedDamageValue: 0 }
    ]
  },
  {
    name: 'Lapras',
    types: ['Water', 'Ice'],
    hp: 205,
    maxHp: 205,
    attack: 105,
    defense: 100,
    spAttack: 105,
    spDefense: 115,
    speed: 80,
    status: 'None',
    moves: [
      { name: 'Surf', type: 'Water', category: 'Special', power: 95, accuracy: 100, statusChance: 0, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Ice Beam', type: 'Ice', category: 'Special', power: 95, accuracy: 100, statusChance: 10, statusEffect: 'Freeze', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Thunderbolt', type: 'Electric', category: 'Special', power: 95, accuracy: 100, statusChance: 10, statusEffect: 'Paralysis', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Body Slam', type: 'Normal', category: 'Physical', power: 85, accuracy: 100, statusChance: 30, statusEffect: 'Paralysis', isFixedDamage: false, fixedDamageValue: 0 }
    ]
  },
  {
    name: 'Jolteon',
    types: ['Electric'],
    hp: 140,
    maxHp: 140,
    attack: 85,
    defense: 80,
    spAttack: 130,
    spDefense: 115,
    speed: 150,
    status: 'None',
    moves: [
      { name: 'Thunderbolt', type: 'Electric', category: 'Special', power: 95, accuracy: 100, statusChance: 10, statusEffect: 'Paralysis', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Bite', type: 'Dark', category: 'Special', power: 60, accuracy: 100, statusChance: 10, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Thunder Wave', type: 'Electric', category: 'Status', power: 0, accuracy: 100, statusChance: 100, statusEffect: 'Paralysis', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Quick Attack', type: 'Normal', category: 'Physical', power: 40, accuracy: 100, statusChance: 0, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 }
    ]
  },
  {
    name: 'Alakazam',
    types: ['Psychic'],
    hp: 130,
    maxHp: 130,
    attack: 70,
    defense: 65,
    spAttack: 155,
    spDefense: 105,
    speed: 140,
    status: 'None',
    moves: [
      { name: 'Psychic', type: 'Psychic', category: 'Special', power: 90, accuracy: 100, statusChance: 10, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Fire Punch', type: 'Fire', category: 'Special', power: 75, accuracy: 100, statusChance: 10, statusEffect: 'Burn', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Thunder Punch', type: 'Electric', category: 'Special', power: 75, accuracy: 100, statusChance: 10, statusEffect: 'Paralysis', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Calm Mind', type: 'Psychic', category: 'Status', power: 0, accuracy: 100, statusChance: 0, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 }
    ]
  },
  {
    name: 'Gardevoir',
    types: ['Psychic', 'Fairy'],
    hp: 143,
    maxHp: 143,
    attack: 85,
    defense: 85,
    spAttack: 145,
    spDefense: 135,
    speed: 100,
    status: 'None',
    moves: [
      { name: 'Psychic', type: 'Psychic', category: 'Special', power: 90, accuracy: 100, statusChance: 10, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Moonblast', type: 'Fairy', category: 'Special', power: 95, accuracy: 100, statusChance: 10, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Will-O-Wisp', type: 'Fire', category: 'Status', power: 0, accuracy: 85, statusChance: 100, statusEffect: 'Burn', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Hypnosis', type: 'Psychic', category: 'Status', power: 0, accuracy: 60, statusChance: 100, statusEffect: 'Sleep', isFixedDamage: false, fixedDamageValue: 0 }
    ]
  }
];

export const defaultRivalParty: Pokemon[] = [
  {
    name: 'Blastoise',
    types: ['Water'],
    hp: 154,
    maxHp: 154,
    attack: 103,
    defense: 120,
    spAttack: 105,
    spDefense: 125,
    speed: 98,
    status: 'None',
    moves: [
      { name: 'Hydro Pump', type: 'Water', category: 'Special', power: 120, accuracy: 80, statusChance: 0, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Ice Beam', type: 'Ice', category: 'Special', power: 95, accuracy: 100, statusChance: 10, statusEffect: 'Freeze', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Earthquake', type: 'Ground', category: 'Physical', power: 100, accuracy: 100, statusChance: 0, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Bite', type: 'Dark', category: 'Special', power: 60, accuracy: 100, statusChance: 10, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 }
    ]
  },
  {
    name: 'Gengar',
    types: ['Ghost', 'Poison'],
    hp: 135,
    maxHp: 135,
    attack: 85,
    defense: 80,
    spAttack: 150,
    spDefense: 95,
    speed: 130,
    status: 'None',
    moves: [
      { name: 'Shadow Ball', type: 'Ghost', category: 'Physical', power: 80, accuracy: 100, statusChance: 0, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Sludge Bomb', type: 'Poison', category: 'Physical', power: 90, accuracy: 100, statusChance: 30, statusEffect: 'Poison', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Thunderbolt', type: 'Electric', category: 'Special', power: 95, accuracy: 100, statusChance: 10, statusEffect: 'Paralysis', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Giga Drain', type: 'Grass', category: 'Special', power: 60, accuracy: 100, statusChance: 0, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 }
    ]
  },
  {
    name: 'Dragonite',
    types: ['Dragon', 'Flying'],
    hp: 166,
    maxHp: 166,
    attack: 154,
    defense: 115,
    spAttack: 120,
    spDefense: 120,
    speed: 100,
    status: 'None',
    moves: [
      { name: 'Outrage', type: 'Dragon', category: 'Special', power: 120, accuracy: 100, statusChance: 0, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Wing Attack', type: 'Flying', category: 'Physical', power: 60, accuracy: 100, statusChance: 0, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Flamethrower', type: 'Fire', category: 'Special', power: 95, accuracy: 100, statusChance: 10, statusEffect: 'Burn', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Thunder Wave', type: 'Electric', category: 'Status', power: 0, accuracy: 100, statusChance: 100, statusEffect: 'Paralysis', isFixedDamage: false, fixedDamageValue: 0 }
    ]
  },
  {
    name: 'Tyranitar',
    types: ['Rock', 'Dark'],
    hp: 175,
    maxHp: 175,
    attack: 154,
    defense: 130,
    spAttack: 115,
    spDefense: 120,
    speed: 81,
    status: 'None',
    moves: [
      { name: 'Rock Slide', type: 'Rock', category: 'Physical', power: 75, accuracy: 90, statusChance: 30, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Crunch', type: 'Dark', category: 'Special', power: 80, accuracy: 100, statusChance: 20, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Earthquake', type: 'Ground', category: 'Physical', power: 100, accuracy: 100, statusChance: 0, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Dragon Claw', type: 'Dragon', category: 'Special', power: 80, accuracy: 100, statusChance: 0, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 }
    ]
  },
  {
    name: 'Metagross',
    types: ['Steel', 'Psychic'],
    hp: 155,
    maxHp: 155,
    attack: 155,
    defense: 150,
    spAttack: 115,
    spDefense: 110,
    speed: 90,
    status: 'None',
    moves: [
      { name: 'Meteor Mash', type: 'Steel', category: 'Physical', power: 100, accuracy: 85, statusChance: 20, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Psychic', type: 'Psychic', category: 'Special', power: 90, accuracy: 100, statusChance: 10, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Earthquake', type: 'Ground', category: 'Physical', power: 100, accuracy: 100, statusChance: 0, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Shadow Ball', type: 'Ghost', category: 'Physical', power: 80, accuracy: 100, statusChance: 0, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 }
    ]
  },
  {
    name: 'Clefable',
    types: ['Fairy'],
    hp: 170,
    maxHp: 170,
    attack: 90,
    defense: 93,
    spAttack: 115,
    spDefense: 110,
    speed: 80,
    status: 'None',
    moves: [
      { name: 'Moonblast', type: 'Fairy', category: 'Special', power: 95, accuracy: 100, statusChance: 10, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Flamethrower', type: 'Fire', category: 'Special', power: 95, accuracy: 100, statusChance: 10, statusEffect: 'Burn', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Thunderbolt', type: 'Electric', category: 'Special', power: 95, accuracy: 100, statusChance: 10, statusEffect: 'Paralysis', isFixedDamage: false, fixedDamageValue: 0 },
      { name: 'Thunder Wave', type: 'Electric', category: 'Status', power: 0, accuracy: 100, statusChance: 100, statusEffect: 'Paralysis', isFixedDamage: false, fixedDamageValue: 0 }
    ]
  }
];
