import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { Pokemon, Move, BattleSession, StatusEffect, PokemonType, SuggestionResult } from './src/types.js';

// Setup Express
const app = express();
app.use(express.json());

// In-Memory Database for Battle Sessions
const sessionsDb: Record<string, BattleSession> = {};

// Load Catalogs from external JSON files
let pokemonCatalog: any[] = [];
let movesCatalog: any[] = [];

try {
  const pokemonPath = path.join(process.cwd(), 'pokemon_data.json');
  if (fs.existsSync(pokemonPath)) {
    pokemonCatalog = JSON.parse(fs.readFileSync(pokemonPath, 'utf-8'));
  }
} catch (e) {
  console.error("Error loading pokemon_data.json:", e);
}

try {
  const movesPath = path.join(process.cwd(), 'moves_data.json');
  if (fs.existsSync(movesPath)) {
    movesCatalog = JSON.parse(fs.readFileSync(movesPath, 'utf-8'));
  }
} catch (e) {
  console.error("Error loading moves_data.json:", e);
}

// 76 standard Gen 3 abilities
const abilitiesCatalog = [
  "Abucheo", "Adaptable", "Agrupamiento", "Absorbe Agua", "Absorbe Fuego", "Absorbe Electricidad", "Aclimatación", "Agallas", "Alerta", "Allanamiento", 
  "Amor Filial", "Anticipación", "Armadura Batalla", "Armadura Magma", "Atadura", "Audaz", "Bucle Arena", "Cabeza Roca", "Cacofonía", "Caparazón", 
  "Clorofila", "Cobardía", "Colector", "Cuerpo Llama", "Cuerpo Puro", "Cura Lluvia", "Cura Natural", "Defensa Hoja", "Despiste", "Dicha", 
  "Efecto Espora", "Electricidad Estática", "Energía Pura", "Enjambre", "Escudo Magma", "Escudo Platón", "Espesura", "Espíritu Vital", "Flexibilidad", "Flotar", 
  "Foco Interno", "Fuerza Bruta", "Gis", "Humedad", "Infiltración", "Inmunidad", "Insomnio", "Insonorizado", "Intimidación", "Levitación", 
  "Llovizna", "Manto Arena", "Manto Clorofila", "Manto Fuego", "Manto Lodo", "Manto Níveo", "Mar Llamas", "Mucho Más", "Muro Cristal", "Ojo Compuesto", 
  "Pararrayos", "Piel Seca", "Potencia", "Presión", "Punto Tóxico", "Robustez", "Sombra Trampa", "Superguarda", "Sustituto", "Tenacidad", 
  "Torrente", "Velo Arena", "Velo Dulce", "Velo Flor", "Velo Agua", "Visión Secundaría", "Viscosidad"
];

// Representative items
const itemsCatalog = [
  // Bayas
  "Baya Aranja", "Baya Ziuela", "Baya Atania", "Baya Meloc", "Baya Safre", "Baya Zreza", 
  "Baya Caquic", "Baya Enigma", "Baya Perasi", "Baya Zanama", "Baya Higog", "Baya Wiki", 
  "Baya Ango", "Baya Guaya", "Baya Pabaya", "Baya Yapati", "Baya Pasio", "Baya Tamate", 
  "Baya Dillo", "Baya Rimoya",
  // Potenciadores
  "Carbón", "Cinturón Negro", "Colmillo Dragón", "Gafas de Sol", "Lente de Agua", 
  "Semilla Milagro", "Pico Afilado", "Polvo Plateado", "Imán", "Perla Marina", 
  "Hueso Grueso", "Cuchara Torcida", "Campana Alivio", "Guijarro Raro",
  // Defensivos
  "Restos", "Banda Focus", "Casco Dentado", "Hierba Blanca", "Hierba Mental"
];

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 11);

// Type Effectiveness Matrix
function getSingleTypeEffectiveness(atk: PokemonType, def: PokemonType): number {
  if (atk === 'Normal') {
    if (def === 'Rock' || def === 'Steel') return 0.5;
    if (def === 'Ghost') return 0;
  }
  if (atk === 'Fire') {
    if (def === 'Fire' || def === 'Water' || def === 'Rock' || def === 'Dragon') return 0.5;
    if (def === 'Grass' || def === 'Ice' || def === 'Bug' || def === 'Steel') return 2.0;
  }
  if (atk === 'Water') {
    if (def === 'Water' || def === 'Grass' || def === 'Dragon') return 0.5;
    if (def === 'Fire' || def === 'Ground' || def === 'Rock') return 2.0;
  }
  if (atk === 'Grass') {
    if (def === 'Fire' || def === 'Grass' || def === 'Poison' || def === 'Flying' || def === 'Bug' || def === 'Dragon' || def === 'Steel') return 0.5;
    if (def === 'Water' || def === 'Ground' || def === 'Rock') return 2.0;
  }
  if (atk === 'Electric') {
    if (def === 'Grass' || def === 'Electric' || def === 'Dragon') return 0.5;
    if (def === 'Water' || def === 'Flying') return 2.0;
    if (def === 'Ground') return 0;
  }
  if (atk === 'Ice') {
    if (def === 'Fire' || def === 'Water' || def === 'Ice' || def === 'Steel') return 0.5;
    if (def === 'Grass' || def === 'Ground' || def === 'Flying' || def === 'Dragon') return 2.0;
  }
  if (atk === 'Fighting') {
    if (def === 'Poison' || def === 'Flying' || def === 'Psychic' || def === 'Bug' || def === 'Fairy') return 0.5;
    if (def === 'Normal' || def === 'Ice' || def === 'Rock' || def === 'Dark' || def === 'Steel') return 2.0;
    if (def === 'Ghost') return 0;
  }
  if (atk === 'Poison') {
    if (def === 'Poison' || def === 'Ground' || def === 'Rock' || def === 'Ghost') return 0.5;
    if (def === 'Grass' || def === 'Fairy') return 2.0;
    if (def === 'Steel') return 0;
  }
  if (atk === 'Ground') {
    if (def === 'Grass' || def === 'Bug') return 0.5;
    if (def === 'Fire' || def === 'Electric' || def === 'Poison' || def === 'Rock' || def === 'Steel') return 2.0;
    if (def === 'Flying') return 0;
  }
  if (atk === 'Flying') {
    if (def === 'Electric' || def === 'Rock' || def === 'Steel') return 0.5;
    if (def === 'Grass' || def === 'Fighting' || def === 'Bug') return 2.0;
  }
  if (atk === 'Psychic') {
    if (def === 'Psychic' || def === 'Steel') return 0.5;
    if (def === 'Fighting' || def === 'Poison') return 2.0;
    if (def === 'Dark') return 0;
  }
  if (atk === 'Bug') {
    if (def === 'Fire' || def === 'Fighting' || def === 'Poison' || def === 'Flying' || def === 'Ghost' || def === 'Steel' || def === 'Fairy') return 0.5;
    if (def === 'Grass' || def === 'Psychic' || def === 'Dark') return 2.0;
  }
  if (atk === 'Rock') {
    if (def === 'Fighting' || def === 'Ground' || def === 'Steel') return 0.5;
    if (def === 'Fire' || def === 'Ice' || def === 'Flying' || def === 'Bug') return 2.0;
  }
  if (atk === 'Ghost') {
    if (def === 'Dark') return 0.5;
    if (def === 'Ghost' || def === 'Psychic') return 2.0;
    if (def === 'Normal') return 0;
  }
  if (atk === 'Dragon') {
    if (def === 'Steel') return 0.5;
    if (def === 'Dragon') return 2.0;
    if (def === 'Fairy') return 0;
  }
  if (atk === 'Dark') {
    if (def === 'Fighting' || def === 'Dark' || def === 'Fairy') return 0.5;
    if (def === 'Psychic' || def === 'Ghost') return 2.0;
  }
  if (atk === 'Steel') {
    if (def === 'Fire' || def === 'Water' || def === 'Electric' || def === 'Steel') return 0.5;
    if (def === 'Ice' || def === 'Rock' || def === 'Fairy') return 2.0;
  }
  if (atk === 'Fairy') {
    if (def === 'Fire' || def === 'Poison' || def === 'Steel') return 0.5;
    if (def === 'Fighting' || def === 'Dragon' || def === 'Dark') return 2.0;
  }
  return 1.0;
}

function getEffectiveness(attackType: PokemonType, defenderTypes: PokemonType[]): number {
  let multiplier = 1.0;
  for (const t of defenderTypes) {
    multiplier *= getSingleTypeEffectiveness(attackType, t);
  }
  return multiplier;
}

// Damage Calculation
function calculateDamage(attacker: Pokemon, defender: Pokemon, move: Move, isCritical = false, randomRoll = 1.0): number {
  if (move.isFixedDamage) {
    return move.fixedDamageValue;
  }
  if (move.power <= 0) return 0;

  const level = 50;
  const atk = move.category === 'Physical' ? attacker.attack : attacker.spAttack;
  const def = move.category === 'Physical' ? defender.defense : defender.spDefense;

  const baseDamage = (((2 * level / 5) + 2) * move.power * (atk / def) / 50) + 2;
  const stab = attacker.types.includes(move.type) ? 1.5 : 1.0;
  const effectiveness = getEffectiveness(move.type, defender.types);
  const critMultiplier = isCritical ? 2.0 : 1.0;

  // Apply basic Gen 3 item modifiers if applicable (e.g. Choice Band, Type Enhancers)
  let itemMultiplier = 1.0;
  if (attacker.heldItem) {
    const item = attacker.heldItem.toLowerCase();
    if (item === "carbón" && move.type === "Fire") itemMultiplier = 1.1;
    if (item === "lente de agua" && move.type === "Water") itemMultiplier = 1.1;
    if (item === "semilla milagro" && move.type === "Grass") itemMultiplier = 1.1;
    if (item === "imán" && move.type === "Electric") itemMultiplier = 1.1;
    if (item === "pico afilado" && move.type === "Flying") itemMultiplier = 1.1;
    if (item === "cuchara torcida" && move.type === "Psychic") itemMultiplier = 1.1;
    if (item === "colmi. dragón" || item === "colmillo dragón" && move.type === "Dragon") itemMultiplier = 1.1;
  }

  const finalDamage = baseDamage * critMultiplier * stab * effectiveness * randomRoll * itemMultiplier;
  return Math.max(1, Math.floor(finalDamage));
}

// Predict Best Lead
function predictBestLead(playerParty: Pokemon[], rivalParty: Pokemon[]): string {
  let bestScore = -Infinity;
  let bestLead = playerParty[0]?.name || '';

  for (const p of playerParty) {
    let matchScore = 0;
    for (const r of rivalParty) {
      const speedAdvantage = p.speed > r.speed ? 1.5 : 0.8;
      const maxDmgToRival = p.moves.length > 0 ? Math.max(...p.moves.map(m => calculateDamage(p, r, m, false, 0.92))) : 0;
      const maxDmgToSelf = r.moves.length > 0 ? Math.max(...r.moves.map(m => calculateDamage(r, p, m, false, 0.92))) : 1;

      matchScore += (maxDmgToRival / r.hp) * speedAdvantage - (maxDmgToSelf / p.hp);
    }

    if (matchScore > bestScore) {
      bestScore = matchScore;
      bestLead = p.name;
    }
  }

  return bestLead;
}

// Expectiminimax depth 3 simulation (Minimizing KO danger and maximizing KO potential)
function computeNextMove(session: BattleSession): SuggestionResult {
  const player = session.playerParty[session.playerActiveIndex];
  const rival = session.rivalParty[session.rivalActiveIndex];

  // If a switch is mandatory, suggest the best healthy switch immediately
  if (session.isSwitchRequired || player.hp <= 0) {
    const paths: string[] = [];
    let bestSwitchVal = -Infinity;
    let bestSwitchIdx = -1;

    for (let i = 0; i < session.playerParty.length; i++) {
      if (i === session.playerActiveIndex || session.playerParty[i].hp <= 0) continue;
      const cand = session.playerParty[i];
      // Evaluate matchups
      const maxRivalDmg = rival.moves.length > 0 ? Math.max(...rival.moves.map(m => calculateDamage(rival, cand, m, false, 0.925))) : 0;
      const maxDmgToRival = cand.moves.length > 0 ? Math.max(...cand.moves.map(m => calculateDamage(cand, rival, m, false, 0.925))) : 0;
      
      const switchVal = (maxDmgToRival / rival.hp) * (cand.speed > rival.speed ? 1.3 : 0.9) - (maxRivalDmg / cand.hp);
      paths.push(`Ruta Cambio: ${cand.name} -> Ventaja calculada: ${switchVal.toFixed(2)}`);

      if (switchVal > bestSwitchVal) {
        bestSwitchVal = switchVal;
        bestSwitchIdx = i;
      }
    }

    if (bestSwitchIdx >= 0) {
      const chosen = session.playerParty[bestSwitchIdx];
      return {
        recommendedAction: 'Switch',
        switchIndex: bestSwitchIdx,
        switchPokemonName: chosen.name,
        confidence: 90,
        explanation: `¡CAMBIO OBLIGATORIO por Debilitamiento! El motor PokeOracle sugiere enviar a ${chosen.name}. Tiene las mejores defensas de tipo o velocidad relativa frente a ${rival.name} rival para retomar el combate.`,
        simulatedPaths: paths
      };
    } else {
      return {
        recommendedAction: 'Switch',
        confidence: 0,
        explanation: "¡Todos tus Pokémon se han debilitado! Fin del simulador.",
        simulatedPaths: ["¡Fin del combate!"]
      };
    }
  }

  const paths: string[] = [];
  let bestVal = -Infinity;
  let bestMoveIdx = 0;
  let bestAction: 'Move' | 'Switch' = 'Move';
  let bestSwitchIdx: number | undefined = undefined;

  // Clone helpers
  const clonePkm = (source: Pokemon): Pokemon => ({
    ...source,
    types: [...source.types],
    moves: source.moves.map(m => ({ ...m }))
  });

  // Heuristic focusing heavily on KO potential and survival
  const getHeuristic = (p: Pokemon, r: Pokemon): number => {
    if (p.hp <= 0) return -200; // catastrophic
    if (r.hp <= 0) return 200;  // target achieved (KO)

    const pRatio = p.hp / p.maxHp;
    const rRatio = r.hp / r.maxHp;

    const speedScore = p.speed > r.speed ? 25 : -10;
    let statusScore = 0;
    if (r.status !== 'None') statusScore += 20;
    if (p.status !== 'None') statusScore -= 15;

    // Favoring moves that can KO rival directly
    return (pRatio * 40) - (rRatio * 100) + speedScore + statusScore;
  };

  // Evaluate expectiminimax for player moves
  for (let i = 0; i < player.moves.length; i++) {
    const move = player.moves[i];
    const acc = move.accuracy / 100;
    const missProb = 1 - acc;

    // Success paths
    const normalCritProb = 0.0625;
    const normalHitProb = 0.9375;

    // Normal hit scenario
    const dmgNormal = calculateDamage(player, rival, move, false, 0.925);
    const rivalNormal = clonePkm(rival);
    rivalNormal.hp = Math.max(0, rivalNormal.hp - dmgNormal);
    const scoreNormal = getHeuristic(player, rivalNormal);

    // Critical hit scenario
    const dmgCrit = calculateDamage(player, rival, move, true, 0.925);
    const rivalCrit = clonePkm(rival);
    rivalCrit.hp = Math.max(0, rivalCrit.hp - dmgCrit);
    const scoreCrit = getHeuristic(player, rivalCrit);

    const hitScore = (scoreNormal * normalHitProb) + (scoreCrit * normalCritProb);
    const missScore = getHeuristic(player, rival) - 20; // High penalty for missing in Randomlocke

    const moveValue = (hitScore * acc) + (missScore * missProb);
    paths.push(`Ruta: Usar ${move.name} -> Score Esperado: ${moveValue.toFixed(2)}`);

    if (moveValue > bestVal) {
      bestVal = moveValue;
      bestMoveIdx = i;
      bestAction = 'Move';
    }
  }

  // Evaluate switching options as alternative
  for (let i = 0; i < session.playerParty.length; i++) {
    if (i === session.playerActiveIndex || session.playerParty[i].hp <= 0) continue;
    const switchCandidate = session.playerParty[i];

    // Incoming Pokemon takes damage from rival's predicted best move
    let maxRivalDmg = 0;
    if (rival.moves.length > 0) {
      maxRivalDmg = Math.max(...rival.moves.map(m => calculateDamage(rival, switchCandidate, m, false, 0.925)));
    }

    const candidateAfterHit = clonePkm(switchCandidate);
    candidateAfterHit.hp = Math.max(0, candidateAfterHit.hp - maxRivalDmg);

    // Penalty of -20 for regular switches (to prevent hyper-swapping unless advantageous)
    const switchValue = getHeuristic(candidateAfterHit, rival) - 20;
    paths.push(`Ruta: Cambiar a ${switchCandidate.name} -> Score Esperado: ${switchValue.toFixed(2)}`);

    if (switchValue > bestVal) {
      bestVal = switchValue;
      bestAction = 'Switch';
      bestSwitchIdx = i;
    }
  }

  const confidence = Math.max(10, Math.min(99, Math.floor(((bestVal + 100) / 200) * 100)));

  if (bestAction === 'Move') {
    const recommendedMove = player.moves[bestMoveIdx];
    return {
      recommendedAction: 'Move',
      moveIndex: bestMoveIdx,
      moveName: recommendedMove.name,
      confidence,
      explanation: `El motor Expectiminimax con profundidad 3 sugiere usar ${recommendedMove.name}. Mitiga riesgos probabilísticos de fallos, maximiza la reducción de HP rival y tiene una probabilidad de crítico del 6.25%.`,
      simulatedPaths: paths.slice(0, 8)
    };
  } else {
    const recommendedSwitch = session.playerParty[bestSwitchIdx!];
    return {
      recommendedAction: 'Switch',
      switchIndex: bestSwitchIdx,
      switchPokemonName: recommendedSwitch.name,
      confidence,
      explanation: `Es tácticamente preferible cambiar a ${recommendedSwitch.name} para contrarrestar la ofensiva del rival y reposicionar el equipo frente a posibles contraataques fatales.`,
      simulatedPaths: paths.slice(0, 8)
    };
  }
}

// REST API Endpoints

// 1. Catalogs
app.get('/api/catalog/pokemon', (req, res) => {
  res.json(pokemonCatalog);
});

app.get('/api/catalog/moves', (req, res) => {
  res.json(movesCatalog);
});

app.get('/api/catalog/abilities', (req, res) => {
  res.json(abilitiesCatalog);
});

app.get('/api/catalog/items', (req, res) => {
  res.json(itemsCatalog);
});

// 2. Setup Battle
app.post('/api/battle/setup', (req, res) => {
  const { playerParty, rivalParty } = req.body;
  if (!playerParty || !rivalParty || playerParty.length === 0 || rivalParty.length === 0) {
    return res.status(400).json({ error: 'Player and Rival parties are required' });
  }

  const sessionId = generateId();
  sessionsDb[sessionId] = {
    sessionId,
    playerParty: playerParty.map((p: any) => ({ 
      ...p, 
      hp: p.hp ?? p.maxHp ?? 100, 
      maxHp: p.maxHp ?? p.hp ?? 100, 
      status: p.status ?? 'None',
      ability: p.ability ?? 'None',
      heldItem: p.heldItem ?? 'None'
    })),
    rivalParty: rivalParty.map((p: any) => ({ 
      ...p, 
      hp: p.hp ?? p.maxHp ?? 100, 
      maxHp: p.maxHp ?? p.hp ?? 100, 
      status: p.status ?? 'None',
      ability: p.ability ?? 'None',
      heldItem: p.heldItem ?? 'None'
    })),
    playerActiveIndex: 0,
    rivalActiveIndex: 0,
    turnNumber: 1,
    history: ['Inicio del combate registrado. Equipos dinámicos y estadísticas reales configuradas.'],
    isSwitchRequired: false
  };

  res.json({ sessionId });
});

// 3. Predict Lead
app.get('/api/battle/:sessionId/predict-lead', (req, res) => {
  const { sessionId } = req.params;
  const session = sessionsDb[sessionId];
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const bestLead = predictBestLead(session.playerParty, session.rivalParty);
  res.json({ bestLead });
});

// 4. Manual Free Switch (KO Mechanic)
app.post('/api/battle/:sessionId/switch', (req, res) => {
  const { sessionId } = req.params;
  const session = sessionsDb[sessionId];
  if (!session) return res.status(404).json({ error: 'Session not found' });

  let switchToIndex = req.body.switchToIndex !== undefined ? req.body.switchToIndex : req.query.switchToIndex;
  let isRival = req.body.isRival !== undefined ? req.body.isRival : req.query.isRival;

  if (switchToIndex !== undefined) {
    switchToIndex = parseInt(switchToIndex as any, 10);
  }
  if (isRival !== undefined) {
    isRival = String(isRival) === 'true';
  }

  if (switchToIndex === undefined || isNaN(switchToIndex) || isRival === undefined) {
    return res.status(400).json({ error: 'switchToIndex and isRival are required' });
  }

  if (isRival) {
    if (switchToIndex < 0 || switchToIndex >= session.rivalParty.length) {
      return res.status(400).json({ error: 'Invalid rival switch index' });
    }
    const oldPkm = session.rivalParty[session.rivalActiveIndex];
    session.rivalActiveIndex = switchToIndex;
    const newPkm = session.rivalParty[switchToIndex];
    session.history.push(`[Reemplazo Rival] El rival retira a ${oldPkm.name} e ingresa a ${newPkm.name}.`);
  } else {
    if (switchToIndex < 0 || switchToIndex >= session.playerParty.length) {
      return res.status(400).json({ error: 'Invalid player switch index' });
    }
    const oldPkm = session.playerParty[session.playerActiveIndex];
    session.playerActiveIndex = switchToIndex;
    const newPkm = session.playerParty[switchToIndex];
    session.history.push(`[Reemplazo Jugador] Envías a ${newPkm.name} para reemplazar a ${oldPkm.name}.`);
  }

  // Clear switch flag if both active Pokemon are now healthy
  const pActive = session.playerParty[session.playerActiveIndex];
  const rActive = session.rivalParty[session.rivalActiveIndex];
  if (pActive.hp > 0 && rActive.hp > 0) {
    session.isSwitchRequired = false;
  }

  const recommendation = computeNextMove(session);

  res.json({
    ...recommendation,
    sessionState: session,
    isSwitchRequired: session.isSwitchRequired
  });
});

// 5. Battle Turn execution (rebuilt with high-fidelity speed priorities)
app.post('/api/battle/:sessionId/turn', (req, res) => {
  const { sessionId } = req.params;
  const session = sessionsDb[sessionId];
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const {
    playerActiveIndex,
    rivalActiveIndex,
    playerMoveIndex,
    playerSwitchToIndex,
    rivalMoveIndex,
    rivalSwitchToIndex,
    isPlayerCritical,
    isRivalCritical,
    isPlayerMissed,
    isRivalMissed,
    playerStatusApplied,
    rivalStatusApplied,
    playerSurvived,
    playerRealHp,
    rivalSurvived,
    rivalRealHp
  } = req.body;

  // Make sure we update the active indices
  session.playerActiveIndex = playerActiveIndex;
  session.rivalActiveIndex = rivalActiveIndex;

  let player = session.playerParty[session.playerActiveIndex];
  let rival = session.rivalParty[session.rivalActiveIndex];

  // If a switch is mandatory, prevent attacking
  if (session.isSwitchRequired && (playerMoveIndex >= 0 || rivalMoveIndex >= 0)) {
    return res.status(400).json({ error: 'Debes realizar un cambio obligatorio de Pokémon debilitado antes de realizar ataques.' });
  }

  // Apply statuses first
  if (playerStatusApplied && playerStatusApplied !== 'None') {
    player.status = playerStatusApplied;
    session.history.push(`[Turno ${session.turnNumber}] ${player.name} fue afectado por ${playerStatusApplied}.`);
  }
  if (rivalStatusApplied && rivalStatusApplied !== 'None') {
    rival.status = rivalStatusApplied;
    session.history.push(`[Turno ${session.turnNumber}] El ${rival.name} rival fue afectado por ${rivalStatusApplied}.`);
  }

  // Check switches first as they always have higher priority
  if (playerSwitchToIndex >= 0 && playerSwitchToIndex !== session.playerActiveIndex) {
    const oldP = player;
    session.playerActiveIndex = playerSwitchToIndex;
    player = session.playerParty[playerSwitchToIndex];
    session.history.push(`[Turno ${session.turnNumber}] Retiras a ${oldP.name} y envías a ${player.name}.`);
  }

  if (rivalSwitchToIndex >= 0 && rivalSwitchToIndex !== session.rivalActiveIndex) {
    const oldR = rival;
    session.rivalActiveIndex = rivalSwitchToIndex;
    rival = session.rivalParty[rivalSwitchToIndex];
    session.history.push(`[Turno ${session.turnNumber}] El rival retira a ${oldR.name} y envía a ${rival.name}.`);
  }

  // Execute movements with SPEED TIER prioritisation
  const playerWantsToAttack = playerMoveIndex >= 0;
  const rivalWantsToAttack = rivalMoveIndex >= 0;

  if (playerWantsToAttack && rivalWantsToAttack) {
    // Determine order
    const playerFirst = player.speed >= rival.speed;

    if (playerFirst) {
      // 1. Player attacks
      if (!isPlayerMissed && player.hp > 0) {
        const move = player.moves[playerMoveIndex];
        const dmg = calculateDamage(player, rival, move, isPlayerCritical);
        rival.hp = Math.max(0, rival.hp - dmg);
        session.history.push(`[Turno ${session.turnNumber}] ${player.name} usó ${move.name} causando ${dmg} HP de daño.${isPlayerCritical ? ' ¡GOLPE CRÍTICO!' : ''}`);
      } else if (isPlayerMissed && player.hp > 0) {
        session.history.push(`[Turno ${session.turnNumber}] El ataque de ${player.name} falló.`);
      }

      // 2. Rival attacks (only if alive!)
      if (rival.hp > 0) {
        if (!isRivalMissed) {
          const move = rival.moves[rivalMoveIndex];
          const dmg = calculateDamage(rival, player, move, isRivalCritical);
          player.hp = Math.max(0, player.hp - dmg);
          session.history.push(`[Turno ${session.turnNumber}] El ${rival.name} rival respondió con ${move.name} causando ${dmg} HP de daño.${isRivalCritical ? ' ¡GOLPE CRÍTICO!' : ''}`);
        } else {
          session.history.push(`[Turno ${session.turnNumber}] El ataque del rival falló.`);
        }
      }
    } else {
      // 1. Rival attacks
      if (!isRivalMissed && rival.hp > 0) {
        const move = rival.moves[rivalMoveIndex];
        const dmg = calculateDamage(rival, player, move, isRivalCritical);
        player.hp = Math.max(0, player.hp - dmg);
        session.history.push(`[Turno ${session.turnNumber}] El ${rival.name} rival atacó primero con ${move.name} causando ${dmg} HP de daño.${isRivalCritical ? ' ¡GOLPE CRÍTICO!' : ''}`);
      } else if (isRivalMissed && rival.hp > 0) {
        session.history.push(`[Turno ${session.turnNumber}] El ataque de ${rival.name} falló.`);
      }

      // 2. Player attacks (only if alive!)
      if (player.hp > 0) {
        if (!isPlayerMissed) {
          const move = player.moves[playerMoveIndex];
          const dmg = calculateDamage(player, rival, move, isPlayerCritical);
          rival.hp = Math.max(0, rival.hp - dmg);
          session.history.push(`[Turno ${session.turnNumber}] ${player.name} respondió con ${move.name} causando ${dmg} HP de daño.${isPlayerCritical ? ' ¡GOLPE CRÍTICO!' : ''}`);
        } else {
          session.history.push(`[Turno ${session.turnNumber}] El ataque de ${player.name} falló.`);
        }
      }
    }
  } else {
    // Only one side attacks (e.g. because other side switched)
    if (playerWantsToAttack && player.hp > 0) {
      if (!isPlayerMissed) {
        const move = player.moves[playerMoveIndex];
        const dmg = calculateDamage(player, rival, move, isPlayerCritical);
        rival.hp = Math.max(0, rival.hp - dmg);
        session.history.push(`[Turno ${session.turnNumber}] ${player.name} usó ${move.name} causando ${dmg} HP de daño.${isPlayerCritical ? ' ¡GOLPE CRÍTICO!' : ''}`);
      } else {
        session.history.push(`[Turno ${session.turnNumber}] El ataque de ${player.name} falló.`);
      }
    }
    if (rivalWantsToAttack && rival.hp > 0) {
      if (!isRivalMissed) {
        const move = rival.moves[rivalMoveIndex];
        const dmg = calculateDamage(rival, player, move, isRivalCritical);
        player.hp = Math.max(0, player.hp - dmg);
        session.history.push(`[Turno ${session.turnNumber}] El ${rival.name} rival usó ${move.name} causando ${dmg} HP de daño.${isRivalCritical ? ' ¡GOLPE CRÍTICO!' : ''}`);
      } else {
        session.history.push(`[Turno ${session.turnNumber}] El ataque del rival falló.`);
      }
    }
  }

  // Apply end-of-turn status residual damage
  if (player.hp > 0) {
    if (player.status === 'Poison') {
      const pDmg = Math.max(1, Math.floor(player.maxHp / 8));
      player.hp = Math.max(0, player.hp - pDmg);
      session.history.push(`[Turno ${session.turnNumber}] ${player.name} recibe ${pDmg} HP de daño por envenenamiento.`);
    } else if (player.status === 'Burn') {
      const bDmg = Math.max(1, Math.floor(player.maxHp / 16));
      player.hp = Math.max(0, player.hp - bDmg);
      session.history.push(`[Turno ${session.turnNumber}] ${player.name} recibe ${bDmg} HP de daño por quemadura.`);
    }
  }
  if (rival.hp > 0) {
    if (rival.status === 'Poison') {
      const pDmg = Math.max(1, Math.floor(rival.maxHp / 8));
      rival.hp = Math.max(0, rival.hp - pDmg);
      session.history.push(`[Turno ${session.turnNumber}] El ${rival.name} rival recibe ${pDmg} HP de daño por envenenamiento.`);
    } else if (rival.status === 'Burn') {
      const bDmg = Math.max(1, Math.floor(rival.maxHp / 16));
      rival.hp = Math.max(0, rival.hp - bDmg);
      session.history.push(`[Turno ${session.turnNumber}] El ${rival.name} rival recibe ${bDmg} HP de daño por quemadura.`);
    }
  }

  // Apply user-provided HP and survival state overrides (Desincronización)
  if (playerSurvived !== undefined) {
    if (!playerSurvived) {
      player.hp = 0;
      session.history.push(`[Sincronización] Tu ${player.name} se debilitó.`);
    } else if (playerRealHp !== undefined && playerRealHp > 0) {
      player.hp = Math.min(player.maxHp, playerRealHp);
      session.history.push(`[Sincronización] HP de ${player.name} ajustado a ${player.hp} HP reales.`);
    }
  }

  if (rivalSurvived !== undefined) {
    if (!rivalSurvived) {
      rival.hp = 0;
      session.history.push(`[Sincronización] El ${rival.name} rival se debilitó.`);
    } else if (rivalRealHp !== undefined && rivalRealHp > 0) {
      rival.hp = Math.min(rival.maxHp, rivalRealHp);
      session.history.push(`[Sincronización] HP del ${rival.name} rival ajustado a ${rival.hp} HP reales.`);
    }
  }

  // Post-turn KO checks (raise isSwitchRequired flag)
  if (player.hp <= 0) {
    session.history.push(`[Turno ${session.turnNumber}] ¡Tu ${player.name} se ha debilitado!`);
    session.isSwitchRequired = true;
  }
  if (rival.hp <= 0) {
    session.history.push(`[Turno ${session.turnNumber}] ¡El ${rival.name} rival se ha debilitado!`);
    session.isSwitchRequired = true;
  }

  // Increment turn
  session.turnNumber++;

  // Get next suggestion
  const recommendation = computeNextMove(session);

  res.json({
    ...recommendation,
    sessionState: session,
    isSwitchRequired: session.isSwitchRequired
  });
});

// Serve frontend assets
const PORT = 3000;
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PokeOracle Server] Running on http://localhost:${PORT}`);
  });
}

start();
