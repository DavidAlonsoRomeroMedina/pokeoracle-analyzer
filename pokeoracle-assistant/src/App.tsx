import React, { useState, useEffect, useMemo } from 'react';
import {
  Pokemon,
  Move,
  PokemonType,
  StatusEffect,
  SuggestionResult,
  PokemonCatalogEntry
} from './types';
import { PokemonSprite } from './PokemonSprite';
import { PokemonBackground } from './PokemonBackground';
import { parseShowdownTeam, showdownToParty } from './showdownParser';
import { THEME_OPTIONS, ThemeId, loadStoredTheme, persistTheme } from './themes';
import {
  Sparkles,
  RotateCcw,
  Sliders,
  Activity,
  BookOpen,
  X,
  Upload,
  Palette,
  ChevronRight
} from 'lucide-react';

const TYPES_LIST: PokemonType[] = [
  'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice', 'Fighting',
  'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost',
  'Dragon', 'Dark', 'Steel', 'Fairy'
];

const STATUS_LIST: StatusEffect[] = ['None', 'Paralysis', 'Poison', 'Burn', 'Sleep', 'Freeze'];

export default function App() {
  // --- Catalogs from API ---
  const [pokemonCatalog, setPokemonCatalog] = useState<PokemonCatalogEntry[]>([]);
  const [movesCatalog, setMovesCatalog] = useState<Move[]>([]);
  const [abilitiesCatalog, setAbilitiesCatalog] = useState<string[]>([]);
  const [itemsCatalog, setItemsCatalog] = useState<string[]>([]);

  // --- Tema ---
  const [theme, setTheme] = useState<ThemeId>(() => loadStoredTheme());
  const [settingsOpen, setSettingsOpen] = useState(false);

  // --- Importador Showdown ---
  const [importOpen, setImportOpen] = useState(false);
  const [importTarget, setImportTarget] = useState<'player' | 'rival'>('player');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  // Los equipos solo guardan el nombre de la especie, así que el sprite se
  // resuelve por nombre contra el catálogo.
  const spriteByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of pokemonCatalog) {
      if (entry.spriteUrl) map.set(entry.name.toLowerCase(), entry.spriteUrl);
    }
    return map;
  }, [pokemonCatalog]);

  const spriteFor = (name?: string) => (name ? spriteByName.get(name.toLowerCase()) : undefined);

  // --- Battle Simulation State ---
  const [sessionId, setSessionId] = useState<string>('');
  const [playerParty, setPlayerParty] = useState<Pokemon[]>([]);
  const [rivalParty, setRivalParty] = useState<Pokemon[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(1); // 1: Setup, 2: Predict Lead, 3: Active Turn Suggestion
  
  // Setup editor states
  const [editingParty, setEditingParty] = useState<'player' | 'rival'>('player');
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0);

  // Predict Lead info
  const [predictedLead, setPredictedLead] = useState<string>('');
  const [selectedPlayerLead, setSelectedPlayerLead] = useState<number>(0);
  const [selectedRivalLead, setSelectedRivalLead] = useState<number>(0);

  // Turn Simulation loop fields
  const [activePlayerIdx, setActivePlayerIdx] = useState<number>(0);
  const [activeRivalIdx, setActiveRivalIdx] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [aiSuggestion, setAiSuggestion] = useState<SuggestionResult | null>(null);
  
  // Switch Required State (Faint mechanics)
  const [isSwitchRequired, setIsSwitchRequired] = useState<boolean>(false);
  const [freeSwitchChoice, setFreeSwitchChoice] = useState<number>(-1);
  const [rivalFreeSwitchChoice, setRivalFreeSwitchChoice] = useState<number>(-1);

  // Turn user response inputs
  const [playerMoveUsed, setPlayerMoveUsed] = useState<number>(0);
  const [playerSwitchTo, setPlayerSwitchTo] = useState<number>(-1);
  const [rivalMoveUsed, setRivalMoveUsed] = useState<number>(0);
  const [rivalSwitchTo, setRivalSwitchTo] = useState<number>(-1);
  const [playerCrit, setPlayerCrit] = useState<boolean>(false);
  const [rivalCrit, setRivalCrit] = useState<boolean>(false);
  const [playerMiss, setPlayerMiss] = useState<boolean>(false);
  const [rivalMiss, setRivalMiss] = useState<boolean>(false);
  const [playerStatusApplied, setPlayerStatusApplied] = useState<StatusEffect>('None');
  const [rivalStatusApplied, setRivalStatusApplied] = useState<StatusEffect>('None');

  // HP confirmation and desynchronization state
  const [playerSurvived, setPlayerSurvived] = useState<boolean>(true);
  const [playerRealHp, setPlayerRealHp] = useState<string>('');
  const [rivalSurvived, setRivalSurvived] = useState<boolean>(true);
  const [rivalRealHp, setRivalRealHp] = useState<string>('');

  // Battle session response state (HP, history log)
  const [battleHistory, setBattleHistory] = useState<string[]>([]);

  // Persistencia y aplicación del tema
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    persistTheme(theme);
  }, [theme]);

  // Load catalogs on mount
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const pkms = await fetch('/api/catalog/pokemon').then(r => r.json());
        setPokemonCatalog(pkms);

        const mvs = await fetch('/api/catalog/moves').then(r => r.json());
        setMovesCatalog(mvs);

        const abils = await fetch('/api/catalog/abilities').then(r => r.json());
        setAbilitiesCatalog(abils);

        const items = await fetch('/api/catalog/items').then(r => r.json());
        setItemsCatalog(items);

        // Pre-build empty templates for teams
        const initialPlayer: Pokemon[] = Array.from({ length: 6 }, (_, i) => ({
          name: i === 0 ? 'Charizard' : i === 1 ? 'Snorlax' : i === 2 ? 'Lapras' : i === 3 ? 'Jolteon' : i === 4 ? 'Alakazam' : 'Gardevoir',
          types: i === 0 ? ['Fire', 'Flying'] : i === 1 ? ['Normal'] : i === 2 ? ['Water', 'Ice'] : i === 3 ? ['Electric'] : i === 4 ? ['Psychic'] : ['Psychic', 'Fairy'],
          hp: i === 0 ? 153 : i === 1 ? 235 : i === 2 ? 205 : i === 3 ? 140 : i === 4 ? 130 : 143,
          maxHp: i === 0 ? 153 : i === 1 ? 235 : i === 2 ? 205 : i === 3 ? 140 : i === 4 ? 130 : 143,
          attack: i === 0 ? 104 : i === 1 ? 130 : i === 2 ? 105 : i === 3 ? 85 : i === 4 ? 70 : 85,
          defense: i === 0 ? 98 : i === 1 ? 85 : i === 2 ? 100 : i === 3 ? 80 : i === 4 ? 65 : 85,
          spAttack: i === 0 ? 129 : i === 1 ? 85 : i === 2 ? 105 : i === 3 ? 130 : i === 4 ? 155 : 145,
          spDefense: i === 0 ? 105 : i === 1 ? 130 : i === 2 ? 115 : i === 3 ? 115 : i === 4 ? 105 : 135,
          speed: i === 0 ? 120 : i === 1 ? 50 : i === 2 ? 80 : i === 3 ? 150 : i === 4 ? 140 : 100,
          status: 'None',
          ability: i === 0 ? 'Mar Llamas' : i === 1 ? 'Inmunidad' : i === 2 ? 'Absorbe Agua' : i === 3 ? 'Absorbe Electricidad' : i === 4 ? 'Foco Interno' : 'Sustituto',
          heldItem: i === 0 ? 'Carbón' : i === 1 ? 'Restos' : i === 2 ? 'Lente de Agua' : i === 3 ? 'Imán' : i === 4 ? 'Cuchara Torcida' : 'Baya Ziuela',
          moves: [
            { name: 'Flamethrower', type: 'Fire', category: 'Special', power: 95, accuracy: 100, statusChance: 10, statusEffect: 'Burn', isFixedDamage: false, fixedDamageValue: 0 },
            { name: 'Surf', type: 'Water', category: 'Special', power: 95, accuracy: 100, statusChance: 0, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 },
            { name: 'Thunderbolt', type: 'Electric', category: 'Special', power: 95, accuracy: 100, statusChance: 10, statusEffect: 'Paralysis', isFixedDamage: false, fixedDamageValue: 0 },
            { name: 'Body Slam', type: 'Normal', category: 'Physical', power: 85, accuracy: 100, statusChance: 30, statusEffect: 'Paralysis', isFixedDamage: false, fixedDamageValue: 0 }
          ]
        }));

        const initialRival: Pokemon[] = Array.from({ length: 6 }, (_, i) => ({
          name: i === 0 ? 'Blastoise' : i === 1 ? 'Gengar' : i === 2 ? 'Dragonite' : i === 3 ? 'Tyranitar' : i === 4 ? 'Metagross' : 'Clefable',
          types: i === 0 ? ['Water'] : i === 1 ? ['Ghost', 'Poison'] : i === 2 ? ['Dragon', 'Flying'] : i === 3 ? ['Rock', 'Dark'] : i === 4 ? ['Steel', 'Psychic'] : ['Fairy'],
          hp: i === 0 ? 154 : i === 1 ? 135 : i === 2 ? 166 : i === 3 ? 175 : i === 4 ? 155 : 170,
          maxHp: i === 0 ? 154 : i === 1 ? 135 : i === 2 ? 166 : i === 3 ? 175 : i === 4 ? 155 : 170,
          attack: i === 0 ? 103 : i === 1 ? 85 : i === 2 ? 154 : i === 3 ? 154 : i === 4 ? 155 : 90,
          defense: i === 0 ? 120 : i === 1 ? 80 : i === 2 ? 115 : i === 3 ? 130 : i === 4 ? 150 : 93,
          spAttack: i === 0 ? 105 : i === 1 ? 150 : i === 2 ? 120 : i === 3 ? 115 : i === 4 ? 115 : 115,
          spDefense: i === 0 ? 125 : i === 1 ? 95 : i === 2 ? 120 : i === 3 ? 120 : i === 4 ? 110 : 110,
          speed: i === 0 ? 98 : i === 1 ? 130 : i === 2 ? 100 : i === 3 ? 81 : i === 4 ? 90 : 80,
          status: 'None',
          ability: i === 0 ? 'Torrente' : i === 1 ? 'Levitación' : i === 2 ? 'Foco Interno' : i === 3 ? 'Bucle Arena' : i === 4 ? 'Cuerpo Puro' : 'Gran Encanto',
          heldItem: i === 0 ? 'Restos' : i === 1 ? 'Banda Focus' : i === 2 ? 'Baya Safre' : i === 3 ? 'Cinturón Negro' : i === 4 ? 'Hierba Blanca' : 'Baya Ziuela',
          moves: [
            { name: 'Surf', type: 'Water', category: 'Special', power: 95, accuracy: 100, statusChance: 0, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 },
            { name: 'Ice Beam', type: 'Ice', category: 'Special', power: 95, accuracy: 100, statusChance: 10, statusEffect: 'Freeze', isFixedDamage: false, fixedDamageValue: 0 },
            { name: 'Earthquake', type: 'Ground', category: 'Physical', power: 100, accuracy: 100, statusChance: 0, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 },
            { name: 'Psychic', type: 'Psychic', category: 'Special', power: 90, accuracy: 100, statusChance: 10, statusEffect: 'None', isFixedDamage: false, fixedDamageValue: 0 }
          ]
        }));

        setPlayerParty(initialPlayer);
        setRivalParty(initialRival);

      } catch (e) {
        console.error("Error fetching catalogs", e);
      }
    };
    loadCatalogs();
  }, []);

  const handleResetSession = () => {
    setSessionId('');
    setCurrentStep(1);
    setPredictedLead('');
    setAiSuggestion(null);
    setBattleHistory([]);
    setIsSwitchRequired(false);
  };

  // Step 1: POST Setup
  const handleSetupBattle = async () => {
    try {
      setIsCalculating(true);
      const res = await fetch('/api/battle/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerParty, rivalParty })
      });
      const data = await res.json();
      if (data.sessionId) {
        setSessionId(data.sessionId);
        // Call Predict Lead immediately
        const leadRes = await fetch(`/api/battle/${data.sessionId}/predict-lead`);
        const leadData = await leadRes.json();
        setPredictedLead(leadData.bestLead);
        setCurrentStep(2);
      }
    } catch (err) {
      console.error('Error during setup:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  // Step 2: Confirm Starters & Load Suggestion
  const handleConfirmLead = async () => {
    try {
      setIsCalculating(true);
      setActivePlayerIdx(selectedPlayerLead);
      setActiveRivalIdx(selectedRivalLead);

      const res = await fetch(`/api/battle/${sessionId}/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerActiveIndex: selectedPlayerLead,
          rivalActiveIndex: selectedRivalLead,
          playerMoveIndex: -1,
          playerSwitchToIndex: -1,
          rivalMoveIndex: -1,
          rivalSwitchToIndex: -1,
          isPlayerCritical: false,
          isRivalCritical: false,
          isPlayerMissed: false,
          isRivalMissed: false,
          playerStatusApplied: 'None',
          rivalStatusApplied: 'None'
        })
      });
      const data = await res.json();
      setAiSuggestion(data);
      if (data.sessionState) {
        setPlayerParty(data.sessionState.playerParty);
        setRivalParty(data.sessionState.rivalParty);
        setBattleHistory(data.sessionState.history);
        setIsSwitchRequired(!!data.isSwitchRequired);
      }
      setCurrentStep(3);
    } catch (err) {
      console.error('Error starting first turn:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  // Execute Turn Action
  const handleExecuteTurn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSwitchRequired) return;

    try {
      setIsCalculating(true);
      const requestPayload = {
        playerActiveIndex: activePlayerIdx,
        rivalActiveIndex: activeRivalIdx,
        playerMoveIndex: playerSwitchTo === -1 ? playerMoveUsed : -1,
        playerSwitchToIndex: playerSwitchTo,
        rivalMoveIndex: rivalSwitchTo === -1 ? rivalMoveUsed : -1,
        rivalSwitchToIndex: rivalSwitchTo,
        isPlayerCritical: playerCrit,
        isRivalCritical: rivalCrit,
        isPlayerMissed: playerMiss,
        isRivalMissed: rivalMiss,
        playerStatusApplied,
        rivalStatusApplied,
        playerSurvived,
        playerRealHp: playerRealHp !== '' ? Number(playerRealHp) : undefined,
        rivalSurvived,
        rivalRealHp: rivalRealHp !== '' ? Number(rivalRealHp) : undefined
      };

      const res = await fetch(`/api/battle/${sessionId}/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });
      const data = await res.json();
      
      setAiSuggestion(data);
      if (data.sessionState) {
        setPlayerParty(data.sessionState.playerParty);
        setRivalParty(data.sessionState.rivalParty);
        setBattleHistory(data.sessionState.history);
        setActivePlayerIdx(data.sessionState.playerActiveIndex);
        setActiveRivalIdx(data.sessionState.rivalActiveIndex);
        setIsSwitchRequired(!!data.isSwitchRequired);
      }

      // Reset turn inputs
      setPlayerMoveUsed(0);
      setPlayerSwitchTo(-1);
      setRivalMoveUsed(0);
      setRivalSwitchTo(-1);
      setPlayerCrit(false);
      setRivalCrit(false);
      setPlayerMiss(false);
      setRivalMiss(false);
      setPlayerStatusApplied('None');
      setRivalStatusApplied('None');
      setPlayerSurvived(true);
      setPlayerRealHp('');
      setRivalSurvived(true);
      setRivalRealHp('');

    } catch (err) {
      console.error('Error executing turn:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  // Execute Free Switch (Manual Switch required when fainted)
  const handleFreeSwitch = async (isRival: boolean) => {
    const choiceIdx = isRival ? rivalFreeSwitchChoice : freeSwitchChoice;
    if (choiceIdx < 0) return;

    try {
      setIsCalculating(true);
      const res = await fetch(`/api/battle/${sessionId}/switch?switchToIndex=${choiceIdx}&isRival=${isRival}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      
      setAiSuggestion(data);
      if (data.sessionState) {
        setPlayerParty(data.sessionState.playerParty);
        setRivalParty(data.sessionState.rivalParty);
        setBattleHistory(data.sessionState.history);
        setActivePlayerIdx(data.sessionState.playerActiveIndex);
        setActiveRivalIdx(data.sessionState.rivalActiveIndex);
        setIsSwitchRequired(!!data.isSwitchRequired);
      }

      if (isRival) {
        setRivalFreeSwitchChoice(-1);
      } else {
        setFreeSwitchChoice(-1);
      }
    } catch (err) {
      console.error('Error during free switch:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  // Modify individual pokemon setup slot
  const handleUpdatePokemonField = (party: 'player' | 'rival', slotIdx: number, field: keyof Pokemon, value: any) => {
    const targetParty = party === 'player' ? [...playerParty] : [...rivalParty];
    const item = { ...targetParty[slotIdx] };

    if (field === 'name') {
      const matchSpecies = pokemonCatalog.find(p => p.name === value);
      if (matchSpecies) {
        item.name = matchSpecies.name;
        item.types = matchSpecies.types;
        item.hp = matchSpecies.hp;
        item.maxHp = matchSpecies.hp;
        item.attack = matchSpecies.attack;
        item.defense = matchSpecies.defense;
        item.spAttack = matchSpecies.spAttack;
        item.spDefense = matchSpecies.spDefense;
        item.speed = matchSpecies.speed;
      } else {
        item.name = value;
      }
    } else {
      (item as any)[field] = value;
    }

    if (party === 'player') {
      targetParty[slotIdx] = item;
      setPlayerParty(targetParty);
    } else {
      targetParty[slotIdx] = item;
      setRivalParty(targetParty);
    }
  };

  const handleUpdateMove = (party: 'player' | 'rival', slotIdx: number, moveIdx: number, moveName: string) => {
    const targetParty = party === 'player' ? [...playerParty] : [...rivalParty];
    const item = { ...targetParty[slotIdx] };
    const matchMove = movesCatalog.find(m => m.name === moveName);

    if (matchMove) {
      const updatedMoves = [...item.moves];
      updatedMoves[moveIdx] = { ...matchMove };
      item.moves = updatedMoves;
    }

    if (party === 'player') {
      targetParty[slotIdx] = item;
      setPlayerParty(targetParty);
    } else {
      targetParty[slotIdx] = item;
      setRivalParty(targetParty);
    }
  };

  const currentEditingPokemon = editingParty === 'player' ? playerParty[selectedSlotIndex] : rivalParty[selectedSlotIndex];

  const openImportModal = (target: 'player' | 'rival') => {
    setImportTarget(target);
    setImportText('');
    setImportError(null);
    setImportOpen(true);
  };

  const handleImportShowdown = () => {
    const parsed = parseShowdownTeam(importText);
    if (!parsed.ok) {
      setImportError(parsed.error ?? 'Formato Showdown no válido.');
      return;
    }

    const { party, warnings } = showdownToParty(
      parsed.pokemon,
      {
        pokemon: pokemonCatalog,
        moves: movesCatalog,
        abilities: abilitiesCatalog,
        items: itemsCatalog,
      },
      importTarget === 'player' ? playerParty : rivalParty
    );

    if (importTarget === 'player') {
      setPlayerParty(party);
      setEditingParty('player');
    } else {
      setRivalParty(party);
      setEditingParty('rival');
    }
    setSelectedSlotIndex(0);
    setImportOpen(false);
    setImportError(null);

    if (warnings.length > 0) {
      window.alert(
        `Equipo importado con avisos:\n\n• ${warnings.slice(0, 6).join('\n• ')}${
          warnings.length > 6 ? `\n… y ${warnings.length - 6} más` : ''
        }`
      );
    }
  };

  const renderPartyGrid = (party: Pokemon[], activeIdx: number) => (
    <div className="grid grid-cols-3 gap-2">
      {party.map((p, i) => (
        <div
          key={i}
          title={`${p.name} (${p.hp}/${p.maxHp} HP)`}
          className={`aspect-square rounded-2xl flex items-center justify-center border transition-all ${
            p.hp <= 0
              ? 'bg-red-500/15 border-red-400/30'
              : i === activeIdx
                ? 'bg-rose-500/25 border-rose-300/50 shadow-lg shadow-rose-500/20'
                : 'bg-white/5 border-white/10'
          }`}
        >
          <PokemonSprite name={p.name} src={spriteFor(p.name)} size="sm" fainted={p.hp <= 0} />
        </div>
      ))}
    </div>
  );

  return (
    <div
      className="relative flex flex-col h-screen w-full font-sans overflow-hidden"
      style={{ color: 'color-mix(in srgb, var(--color-text) 70%, transparent)' }}
      data-theme={theme}
    >
      <PokemonBackground />

      {/* Top Header */}
      <header
        className="relative z-20 flex items-center justify-between px-5 md:px-8 py-4 border-b border-white/10 backdrop-blur-xl shrink-0"
        style={{ background: 'var(--color-header)' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-gradient-to-br from-rose-500 to-orange-400 text-white rounded-2xl flex items-center justify-center font-display font-bold text-sm shadow-lg shadow-rose-500/30 animate-rise">
            PO
          </div>
          <div>
            <h1 className="text-base md:text-lg font-display font-bold tracking-wide text-white leading-none">
              PokeOracle
            </h1>
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/45 mt-1">Randomlocke · National Dex</p>
          </div>
        </div>

        <div className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/25">
          Simulador
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex overflow-hidden">
          <>
            {/* Side deck — estilo dashboard */}
            <aside className="relative z-10 w-72 p-4 flex flex-col gap-4 shrink-0 hidden lg:flex overflow-y-auto">
              <div className="glass-panel p-4 space-y-4 animate-rise">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Estado</p>
                    <p className="text-sm font-semibold text-white mt-1">
                      {sessionId ? 'Sesión activa' : 'Armando equipos'}
                    </p>
                  </div>
                  <span className={`w-3 h-3 rounded-full ${sessionId ? 'bg-emerald-400 animate-pulse' : 'bg-amber-300 animate-pulse'}`} />
                </div>

                <div className="grid grid-cols-1 gap-2 relative">
                  <button
                    type="button"
                    onClick={() => setSettingsOpen((v) => !v)}
                    className="btn-side flex items-center gap-2 px-3 py-2.5 bg-emerald-500/90 text-white text-xs"
                  >
                    <Sliders className="w-4 h-4" /> Configuración
                  </button>
                  {settingsOpen && (
                    <div className="absolute left-0 right-0 top-full mt-2 z-30 glass-panel-strong p-3 space-y-2 shadow-2xl">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase tracking-widest text-white/70 font-bold flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5" /> Tema visual
                        </span>
                        <button type="button" onClick={() => setSettingsOpen(false)} className="text-white/50 hover:text-white">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {THEME_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setTheme(opt.id);
                            setSettingsOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl border transition-all ${
                            theme === opt.id
                              ? 'bg-white/15 border-white/30 text-white'
                              : 'bg-black/20 border-white/10 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          <div className="text-xs font-bold">{opt.label}</div>
                          <div className="text-[10px] text-white/45 mt-0.5">{opt.description}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  <button type="button" onClick={handleResetSession} className="btn-side flex items-center gap-2 px-3 py-2.5 bg-sky-500/90 text-white text-xs">
                    <RotateCcw className="w-4 h-4" /> Reiniciar
                  </button>
                  <div className="btn-side flex items-center gap-2 px-3 py-2.5 bg-white/10 text-white/80 text-xs">
                    <BookOpen className="w-4 h-4" /> ES · Español
                  </div>
                </div>
              </div>

              <div className="glass-panel p-4 space-y-3 animate-rise" style={{ animationDelay: '0.08s' }}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Tu plantel</p>
                  <button
                    type="button"
                    onClick={() => openImportModal('player')}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-[9px] font-bold uppercase tracking-wider text-white/80"
                  >
                    <Upload className="w-3 h-3" /> Importar
                  </button>
                </div>
                {renderPartyGrid(playerParty, activePlayerIdx)}
              </div>

              <div className="glass-panel p-4 space-y-3 animate-rise" style={{ animationDelay: '0.11s' }}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Plantel rival</p>
                  <button
                    type="button"
                    onClick={() => openImportModal('rival')}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-[9px] font-bold uppercase tracking-wider text-white/80"
                  >
                    <Upload className="w-3 h-3" /> Importar
                  </button>
                </div>
                {renderPartyGrid(rivalParty, activeRivalIdx)}
              </div>

              <div className="glass-panel p-4 space-y-2 animate-rise" style={{ animationDelay: '0.14s' }}>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Motor</p>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Expectiminimax · profundidad 3<br />
                  Catálogo nacional (1025) con sprites vivos
                </p>
              </div>
            </aside>

            {/* Stage Area */}
            <section className="relative z-10 flex-1 p-5 md:p-8 flex flex-col overflow-y-auto bg-transparent">
              
              {/* Step Flow indicator */}
              <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-6 shrink-0">
                <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest">
                  <span className={currentStep === 1 ? 'text-white border-b border-rose-400 pb-3' : 'text-white/30'}>01 Setup Dinámico</span>
                  <span className={currentStep === 2 ? 'text-white border-b border-rose-400 pb-3' : 'text-white/30'}>02 Salida (Lead)</span>
                  <span className={currentStep === 3 ? 'text-white border-b border-rose-400 pb-3' : 'text-white/30'}>03 Simulación Activa</span>
                </div>

                {sessionId && (
                  <button
                    onClick={handleResetSession}
                    className="text-rose-300 hover:text-rose-200 flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider"
                  >
                    <RotateCcw className="w-3 h-3" /> Reconfigurar
                  </button>
                )}
              </div>

              {/* STEP 1: SETUP EQUIPO DINÁMICO */}
              {currentStep === 1 && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div>
                      <div className="inline-block px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-300/30 text-rose-100 text-[9px] font-mono uppercase tracking-widest mb-3">CONSTRUCCIÓN SIN LIMITACIONES</div>
                      <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-white leading-none mb-2">Editor de Estadísticas Reales y Atributos</h2>
                      <p className="text-white/55 text-xs italic max-w-xl">
                        PROHIBIDO hardcodear equipos. Selecciona cualquier Pokémon del dex nacional, asigna estadísticas reales (con EVs/IVs ya calculados de tu emulador), define Habilidad, Objeto Equipado y sus 4 ataques correspondientes.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                      {/* Left Side: Slots selection */}
                      <div className="xl:col-span-5 space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-1 bg-black/30 p-1 rounded-2xl border border-white/10 text-[10px] font-bold uppercase tracking-wider">
                            <button
                              onClick={() => { setEditingParty('player'); setSelectedSlotIndex(0); }}
                              className={`flex-1 py-1.5 text-center ${editingParty === 'player' ? 'bg-white/15 text-white shadow-sm' : 'text-white/50'}`}
                            >
                              Tu Equipo
                            </button>
                            <button
                              onClick={() => { setEditingParty('rival'); setSelectedSlotIndex(0); }}
                              className={`flex-1 py-1.5 text-center ${editingParty === 'rival' ? 'bg-white/15 text-white shadow-sm' : 'text-white/50'}`}
                            >
                              Equipo Rival
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => openImportModal(editingParty)}
                            className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-[9px] font-bold uppercase tracking-wider text-white/80 shrink-0"
                            title="Importar formato Showdown"
                          >
                            <Upload className="w-3.5 h-3.5" /> Importar
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          {(editingParty === 'player' ? playerParty : rivalParty).map((pkm, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedSlotIndex(idx)}
                              className={`p-3 text-left border flex justify-between items-center transition-all ${
                                selectedSlotIndex === idx
                                  ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white border-transparent shadow-lg shadow-rose-500/25'
                                  : 'bg-white/5 hover:bg-white/10 border-white/15 text-white/90'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <PokemonSprite name={pkm.name} src={spriteFor(pkm.name)} size="sm" />
                                <div className="truncate">
                                  <span className="text-[10px] font-mono mr-2 text-white/40">SLOT {idx + 1}</span>
                                  <span className="font-bold text-xs uppercase tracking-tight">{pkm.name || 'Seleccionar...'}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 font-mono text-[9px]">
                                <span className="text-[9px] uppercase text-white/40 truncate max-w-[80px]">{(pkm as any).ability}</span>
                                <ChevronRight className="w-3 h-3 opacity-60" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Right Side: Specific stats and details editor */}
                      <div className="xl:col-span-7 glass-panel p-5 space-y-4">
                        {currentEditingPokemon ? (
                          <>
                            <div className="flex justify-between items-center pb-2 border-b border-white/10">
                              <span className="text-[10px] font-mono text-white/40 uppercase font-bold">Editor Slot {selectedSlotIndex + 1} ({editingParty === 'player' ? 'Jugador' : 'Rival'})</span>
                              <div className="flex gap-1.5">
                                {currentEditingPokemon.types.map((t, i) => (
                                  <span key={i} className="text-[8px] px-1.5 py-0.5 bg-white/15 text-white/80 font-bold uppercase">{t}</span>
                                ))}
                              </div>
                            </div>

                            {/* Dropdown National Dex */}
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase tracking-wider text-white/55 font-bold">Especie Pokémon (Dex nacional)</label>
                              <div className="flex items-center gap-3">
                                <div className="bg-black/30 border border-white/15 p-1 shrink-0">
                                  <PokemonSprite name={currentEditingPokemon.name} src={spriteFor(currentEditingPokemon.name)} size="lg" />
                                </div>
                                <select
                                  value={currentEditingPokemon.name}
                                  onChange={(e) => handleUpdatePokemonField(editingParty, selectedSlotIndex, 'name', e.target.value)}
                                  className="w-full p-2.5 bg-black/30 border border-white/15 text-xs font-bold uppercase tracking-wider"
                                >
                                  {pokemonCatalog.map((p) => (
                                    <option key={p.name} value={p.name}>
                                      {String(p.pokedexNumber).padStart(3, '0')} · {p.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* IV/EV Real Stats Input */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-baseline">
                                <label className="text-[9px] uppercase tracking-wider text-white/55 font-bold">Estadísticas Reales del Juego</label>
                                <span className="text-[8px] text-amber-600 font-semibold font-mono uppercase">¡Ingresar stats reales, no base!</span>
                              </div>
                              <div className="grid grid-cols-6 gap-2 font-mono text-xs">
                                <div>
                                  <div className="text-[8px] text-white/45 uppercase text-center font-bold mb-1">HP Real</div>
                                  <input
                                    type="number"
                                    value={currentEditingPokemon.maxHp}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      handleUpdatePokemonField(editingParty, selectedSlotIndex, 'maxHp', val);
                                      handleUpdatePokemonField(editingParty, selectedSlotIndex, 'hp', val);
                                    }}
                                    className="w-full p-1.5 border border-white/15 bg-white/10 text-center text-xs font-bold"
                                  />
                                </div>
                                <div>
                                  <div className="text-[8px] text-white/45 uppercase text-center font-bold mb-1">ATK</div>
                                  <input
                                    type="number"
                                    value={currentEditingPokemon.attack}
                                    onChange={(e) => handleUpdatePokemonField(editingParty, selectedSlotIndex, 'attack', Number(e.target.value))}
                                    className="w-full p-1.5 border border-white/15 bg-white/10 text-center text-xs font-bold"
                                  />
                                </div>
                                <div>
                                  <div className="text-[8px] text-white/45 uppercase text-center font-bold mb-1">DEF</div>
                                  <input
                                    type="number"
                                    value={currentEditingPokemon.defense}
                                    onChange={(e) => handleUpdatePokemonField(editingParty, selectedSlotIndex, 'defense', Number(e.target.value))}
                                    className="w-full p-1.5 border border-white/15 bg-white/10 text-center text-xs font-bold"
                                  />
                                </div>
                                <div>
                                  <div className="text-[8px] text-white/45 uppercase text-center font-bold mb-1">SPA</div>
                                  <input
                                    type="number"
                                    value={currentEditingPokemon.spAttack}
                                    onChange={(e) => handleUpdatePokemonField(editingParty, selectedSlotIndex, 'spAttack', Number(e.target.value))}
                                    className="w-full p-1.5 border border-white/15 bg-white/10 text-center text-xs font-bold"
                                  />
                                </div>
                                <div>
                                  <div className="text-[8px] text-white/45 uppercase text-center font-bold mb-1">SPD</div>
                                  <input
                                    type="number"
                                    value={currentEditingPokemon.spDefense}
                                    onChange={(e) => handleUpdatePokemonField(editingParty, selectedSlotIndex, 'spDefense', Number(e.target.value))}
                                    className="w-full p-1.5 border border-white/15 bg-white/10 text-center text-xs font-bold"
                                  />
                                </div>
                                <div>
                                  <div className="text-[8px] text-white/45 uppercase text-center font-bold mb-1">SPE</div>
                                  <input
                                    type="number"
                                    value={currentEditingPokemon.speed}
                                    onChange={(e) => handleUpdatePokemonField(editingParty, selectedSlotIndex, 'speed', Number(e.target.value))}
                                    className="w-full p-1.5 border border-white/15 bg-white/10 text-center text-xs font-bold"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Abilities and Held Items selects */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider text-white/55 font-bold">Habilidad Gen 3 (76 disponibles)</label>
                                <select
                                  value={(currentEditingPokemon as any).ability || 'None'}
                                  onChange={(e) => handleUpdatePokemonField(editingParty, selectedSlotIndex, 'ability', e.target.value)}
                                  className="w-full p-2 bg-black/30 border border-white/15 text-xs font-semibold"
                                >
                                  {abilitiesCatalog.map((abil) => (
                                    <option key={abil} value={abil}>{abil}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider text-white/55 font-bold">Objeto Equipado (Held Item)</label>
                                <select
                                  value={(currentEditingPokemon as any).heldItem || 'None'}
                                  onChange={(e) => handleUpdatePokemonField(editingParty, selectedSlotIndex, 'heldItem', e.target.value)}
                                  className="w-full p-2 bg-black/30 border border-white/15 text-xs font-semibold"
                                >
                                  {itemsCatalog.map((it) => (
                                    <option key={it} value={it}>{it}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Moves edit lists */}
                            <div className="space-y-2 pt-2 border-t border-white/10">
                              <label className="text-[9px] uppercase tracking-wider text-white/55 font-bold">Set de Ataques (4 Movimientos)</label>
                              <div className="grid grid-cols-2 gap-2">
                                {[0, 1, 2, 3].map((moveIdx) => {
                                  const currentMoveName = currentEditingPokemon.moves[moveIdx]?.name || '';
                                  return (
                                    <select
                                      key={moveIdx}
                                      value={currentMoveName}
                                      onChange={(e) => handleUpdateMove(editingParty, selectedSlotIndex, moveIdx, e.target.value)}
                                      className="w-full p-2 bg-black/30 border border-white/15 text-[11px] font-semibold"
                                    >
                                      <option value="">-- Vacío --</option>
                                      {movesCatalog.map((mv) => (
                                        <option key={mv.name} value={mv.name}>{mv.name} ({mv.type})</option>
                                      ))}
                                    </select>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-10 text-xs text-white/40 font-mono italic">Selecciona un slot para comenzar a configurar su composición.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 mt-auto">
                    <button
                      onClick={handleSetupBattle}
                      disabled={isCalculating}
                      className="btn-accent w-full py-4 text-xs uppercase tracking-[0.25em]"
                    >
                      {isCalculating ? 'Procesando catálogo e inyectando persistencia...' : 'Registrar planteles y avanzar'}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: LEAD PREDICTION */}
              {currentStep === 2 && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div>
                      <div className="inline-block px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-300/30 text-rose-100 text-[9px] font-mono uppercase tracking-widest mb-3">CONSEJO DEL ASISTENTE</div>
                      <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-white leading-none mb-2">Predicción de Apertura de Combate (Lead)</h2>
                      <p className="text-white/55 text-xs italic">
                        El motor de la IA evaluó la composición del rival y predice el abridor óptimo para maximizar el Matchup Ratio.
                      </p>
                    </div>

                    <div className="advice-card p-6 flex items-center gap-5">
                      <div className="w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center font-bold shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="advice-label text-[9px] uppercase font-mono tracking-widest block font-bold">Abridor Sugerido</span>
                        <p className="advice-title text-xl font-bold tracking-tight uppercase mt-0.5 text-slate-800">{predictedLead}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-white/90">Definir abridores del combate real</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-wider text-white/55 font-bold">Tu Pokémon Inicial</label>
                          <select
                            value={selectedPlayerLead}
                            onChange={(e) => setSelectedPlayerLead(Number(e.target.value))}
                            className="w-full p-2.5 bg-black/30 border border-white/15 text-xs font-semibold"
                          >
                            {playerParty.map((p, i) => (
                              <option key={i} value={i}>{p.name} (HP: {p.hp}/{p.maxHp})</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-wider text-white/55 font-bold">Abridor Inicial Rival</label>
                          <select
                            value={selectedRivalLead}
                            onChange={(e) => setSelectedRivalLead(Number(e.target.value))}
                            className="w-full p-2.5 bg-black/30 border border-white/15 text-xs font-semibold"
                          >
                            {rivalParty.map((p, i) => (
                              <option key={i} value={i}>{p.name} (HP: {p.hp}/{p.maxHp})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-white/10 mt-auto">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="px-6 py-4.5 bg-white/10 hover:bg-white/15 text-white/80 text-xs font-bold uppercase tracking-widest transition-all"
                    >
                      Atrás
                    </button>
                    <button
                      onClick={handleConfirmLead}
                      disabled={isCalculating}
                      className="flex-1 py-4.5 btn-accent text-white text-xs font-bold uppercase tracking-widest transition-all"
                    >
                      Establecer Combate y Solicitar Sugerencia de Turno 1
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: BATTLE TURN LOOP WITH FAINT MECHANIC */}
              {currentStep === 3 && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-6">

                    {/* INTERMEDIATE FAINT SWITCH OVERLAY (Free Switch Mandatory Mode) */}
                    {isSwitchRequired ? (
                      <div className="bg-red-500/15 border-2 border-red-200 p-6 rounded-2xl space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold font-mono">!</div>
                          <div>
                            <h3 className="text-base font-bold text-red-900 uppercase tracking-tight">¡Pokémon Debilitado - Reemplazo Obligatorio (Free Switch)!</h3>
                            <p className="text-xs text-red-700">
                              Uno o ambos Pokémon activos han quedado con 0 HP. El flujo de ataque está congelado. Debes reportar la entrada del sustituto antes de continuar.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          {/* Player Free Switch Panel */}
                          {playerParty[activePlayerIdx]?.hp <= 0 ? (
                            <div className="bg-white/10 p-4 border border-red-100 space-y-3">
                              <span className="text-[10px] uppercase font-mono text-white/40 block font-bold">Tu Pokémon está debilitado. Elige Sustituto:</span>
                              <select
                                value={freeSwitchChoice}
                                onChange={(e) => setFreeSwitchChoice(Number(e.target.value))}
                                className="w-full p-2 glass-panel text-xs font-semibold"
                              >
                                <option value="-1">-- Seleccionar Sustituto Sano --</option>
                                {playerParty.map((p, idx) => (
                                  <option key={idx} value={idx} disabled={p.hp <= 0}>
                                    {p.name} {p.hp <= 0 ? '(DEBILITADO)' : `(HP: ${p.hp}/${p.maxHp})`}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleFreeSwitch(false)}
                                disabled={freeSwitchChoice === -1 || isCalculating}
                                className="w-full py-2 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider hover:brightness-110 disabled:bg-white/15 disabled:text-white/40"
                              >
                                Confirmar Tu Reemplazo Libre
                              </button>
                            </div>
                          ) : (
                            <div className="bg-white/10 p-4 flex items-center justify-center text-[11px] font-mono text-white/55 uppercase">
                              Tu Pokémon activo ({playerParty[activePlayerIdx]?.name}) sigue en pie.
                            </div>
                          )}

                          {/* Rival Free Switch Panel */}
                          {rivalParty[activeRivalIdx]?.hp <= 0 ? (
                            <div className="bg-white/10 p-4 border border-red-100 space-y-3">
                              <span className="text-[10px] uppercase font-mono text-white/40 block font-bold">Rival debilitado. Elige qué Pokémon envió el rival:</span>
                              <select
                                value={rivalFreeSwitchChoice}
                                onChange={(e) => setRivalFreeSwitchChoice(Number(e.target.value))}
                                className="w-full p-2 glass-panel text-xs font-semibold"
                              >
                                <option value="-1">-- Seleccionar Nuevo Pokémon Rival --</option>
                                {rivalParty.map((p, idx) => (
                                  <option key={idx} value={idx} disabled={p.hp <= 0}>
                                    {p.name} {p.hp <= 0 ? '(DEBILITADO)' : `(HP: ${p.hp}/${p.maxHp})`}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleFreeSwitch(true)}
                                disabled={rivalFreeSwitchChoice === -1 || isCalculating}
                                className="w-full py-2 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider hover:brightness-110 disabled:bg-white/15 disabled:text-white/40"
                              >
                                Confirmar Reemplazo Rival
                              </button>
                            </div>
                          ) : (
                            <div className="bg-white/10 p-4 flex items-center justify-center text-[11px] font-mono text-white/55 uppercase">
                              El rival activo ({rivalParty[activeRivalIdx]?.name}) sigue en pie.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* ORACLE SUGGESTION COMPONENT */
                      aiSuggestion && (
                        <div className="advice-card p-5 relative">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[9px] font-mono uppercase bg-rose-500 text-white px-2 py-0.5 tracking-wider font-bold rounded">
                              PokeOracle Engine // Confianza: {aiSuggestion.confidence}%
                            </span>
                          </div>

                          <h3 className="advice-title text-3xl md:text-4xl font-display font-bold tracking-tight mb-2 text-slate-800">
                            Sugerencia: {aiSuggestion.recommendedAction === 'Move' ? (
                              <>Usar <span className="font-extrabold italic">{aiSuggestion.moveName}</span></>
                            ) : (
                              <>Cambiar a <span className="font-extrabold italic">{aiSuggestion.switchPokemonName}</span></>
                            )}
                          </h3>
                          <p className="advice-body text-xs leading-relaxed max-w-3xl mb-4 italic">
                            {aiSuggestion.explanation}
                          </p>

                          <div className="border-t border-slate-300/60 pt-3">
                            <span className="advice-label text-[9px] uppercase tracking-wider font-bold block mb-1.5">Árbol de Expectación de Daño (Simulación Depth 3)</span>
                            <div className="bg-white/60 p-3 max-h-[110px] overflow-y-auto space-y-1 font-mono text-[10px] text-slate-700 border border-slate-200 rounded-xl">
                              {aiSuggestion.simulatedPaths.map((p, i) => (
                                <div key={i} className="flex gap-2">
                                  <span className="text-slate-500 font-bold">[{i+1}]</span>
                                  <span>{p}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    )}

                    {/* Active Pokémon status view cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      {/* Player status */}
                      <div className="p-4 glass-panel space-y-2">
                        <div className="flex justify-between items-center text-[9px] uppercase tracking-widest text-white/45 font-bold">
                          <span>Tu Pokémon Activo</span>
                          {playerParty[activePlayerIdx]?.status !== 'None' && (
                            <span className="px-1.5 py-0.5 bg-amber-300/15 text-amber-200 border border-amber-300/30 text-[8px] font-bold uppercase">{playerParty[activePlayerIdx]?.status}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <PokemonSprite
                            name={playerParty[activePlayerIdx]?.name}
                            src={spriteFor(playerParty[activePlayerIdx]?.name)}
                            size="lg"
                            fainted={(playerParty[activePlayerIdx]?.hp ?? 0) <= 0}
                          />
                          <div className="flex justify-between items-baseline grow min-w-0">
                            <h4 className="text-lg font-bold text-white uppercase tracking-tight truncate">{playerParty[activePlayerIdx]?.name}</h4>
                            <span className="text-xs font-mono text-white/55 shrink-0 ml-2">HP: {playerParty[activePlayerIdx]?.hp} / {playerParty[activePlayerIdx]?.maxHp}</span>
                          </div>
                        </div>
                        <div className="w-full bg-white/15 h-1">
                          <div
                            className={`h-full transition-all duration-300 ${
                              (playerParty[activePlayerIdx]?.hp / playerParty[activePlayerIdx]?.maxHp) > 0.5
                                ? 'bg-emerald-400'
                                : (playerParty[activePlayerIdx]?.hp / playerParty[activePlayerIdx]?.maxHp) > 0.2
                                ? 'bg-amber-400'
                                : 'bg-rose-400'
                            }`}
                            style={{ width: `${Math.max(0, (playerParty[activePlayerIdx]?.hp / playerParty[activePlayerIdx]?.maxHp) * 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-mono text-white/40">
                          <span>HAB: {(playerParty[activePlayerIdx] as any)?.ability || 'Ninguna'}</span>
                          <span>OBJ: {(playerParty[activePlayerIdx] as any)?.heldItem || 'Ninguno'}</span>
                          <span>SPE: {playerParty[activePlayerIdx]?.speed}</span>
                        </div>
                      </div>

                      {/* Rival status */}
                      <div className="p-4 glass-panel space-y-2">
                        <div className="flex justify-between items-center text-[9px] uppercase tracking-widest text-white/45 font-bold">
                          <span>Rival Activo</span>
                          {rivalParty[activeRivalIdx]?.status !== 'None' && (
                            <span className="px-1.5 py-0.5 bg-amber-300/15 text-amber-200 border border-amber-300/30 text-[8px] font-bold uppercase">{rivalParty[activeRivalIdx]?.status}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <PokemonSprite
                            name={rivalParty[activeRivalIdx]?.name}
                            src={spriteFor(rivalParty[activeRivalIdx]?.name)}
                            size="lg"
                            fainted={(rivalParty[activeRivalIdx]?.hp ?? 0) <= 0}
                          />
                          <div className="flex justify-between items-baseline grow min-w-0">
                            <h4 className="text-lg font-bold text-white uppercase tracking-tight truncate">{rivalParty[activeRivalIdx]?.name}</h4>
                            <span className="text-xs font-mono text-white/55 shrink-0 ml-2">HP: {rivalParty[activeRivalIdx]?.hp} / {rivalParty[activeRivalIdx]?.maxHp}</span>
                          </div>
                        </div>
                        <div className="w-full bg-white/15 h-1">
                          <div
                            className={`h-full transition-all duration-300 ${
                              (rivalParty[activeRivalIdx]?.hp / rivalParty[activeRivalIdx]?.maxHp) > 0.5
                                ? 'bg-emerald-400'
                                : (rivalParty[activeRivalIdx]?.hp / rivalParty[activeRivalIdx]?.maxHp) > 0.2
                                ? 'bg-amber-400'
                                : 'bg-rose-400'
                            }`}
                            style={{ width: `${Math.max(0, (rivalParty[activeRivalIdx]?.hp / rivalParty[activeRivalIdx]?.maxHp) * 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-mono text-white/40">
                          <span>HAB: {(rivalParty[activeRivalIdx] as any)?.ability || 'Ninguna'}</span>
                          <span>OBJ: {(rivalParty[activeRivalIdx] as any)?.heldItem || 'Ninguno'}</span>
                          <span>SPE: {rivalParty[activeRivalIdx]?.speed}</span>
                        </div>
                      </div>
                    </div>

                    {/* TURN REPORT INPUTS FORM (Disabled if Switch is Required) */}
                    <form onSubmit={handleExecuteTurn} className={`grid grid-cols-1 md:grid-cols-2 gap-8 pt-2 ${isSwitchRequired ? 'opacity-40 pointer-events-none select-none' : ''}`}>
                      
                      {/* Player Choice */}
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider border-b border-white/10 pb-1.5 text-white/90">Tu Acción Realizada</h4>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPlayerSwitchTo(-1)}
                            className={`py-2 text-[10px] font-bold uppercase tracking-wider border transition-all ${
                              playerSwitchTo === -1 ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white border-transparent shadow-lg shadow-rose-500/25' : 'bg-white/10 text-white/70 border-white/15 hover:bg-white/5'
                            }`}
                          >
                            Atacar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const cand = playerParty.findIndex((p, i) => i !== activePlayerIdx && p.hp > 0);
                              setPlayerSwitchTo(cand >= 0 ? cand : 0);
                            }}
                            className={`py-2 text-[10px] font-bold uppercase tracking-wider border transition-all ${
                              playerSwitchTo !== -1 ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white border-transparent shadow-lg shadow-rose-500/25' : 'bg-white/10 text-white/70 border-white/15 hover:bg-white/5'
                            }`}
                          >
                            Cambiar
                          </button>
                        </div>

                        {playerSwitchTo === -1 ? (
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase tracking-wider text-white/45 font-bold">Ataque Utilizado</label>
                            <select
                              value={playerMoveUsed}
                              onChange={(e) => setPlayerMoveUsed(Number(e.target.value))}
                              className="w-full p-2 glass-panel text-xs font-semibold"
                            >
                              {playerParty[activePlayerIdx]?.moves.map((m, idx) => (
                                <option key={idx} value={idx}>{m.name} ({m.type})</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase tracking-wider text-white/45 font-bold">Pokémon que ingresaste</label>
                            <select
                              value={playerSwitchTo}
                              onChange={(e) => setPlayerSwitchTo(Number(e.target.value))}
                              className="w-full p-2 glass-panel text-xs font-semibold"
                            >
                              {playerParty.map((p, idx) => (
                                <option key={idx} value={idx} disabled={idx === activePlayerIdx || p.hp <= 0}>
                                  {p.name} {p.hp <= 0 ? '(DEBILITADO)' : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/70 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={playerCrit}
                              onChange={(e) => setPlayerCrit(e.target.checked)}
                              className="rounded-2xl border-white/20 text-white focus:ring-0"
                            />
                            ¿Golpe Crítico?
                          </label>
                          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/70 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={playerMiss}
                              onChange={(e) => setPlayerMiss(e.target.checked)}
                              className="rounded-2xl border-white/20 text-white focus:ring-0"
                            />
                            ¿Falló ataque?
                          </label>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-wider text-white/45 font-bold">Estado aplicado a tu Pokémon en este turno</label>
                          <select
                            value={playerStatusApplied}
                            onChange={(e) => setPlayerStatusApplied(e.target.value as StatusEffect)}
                            className="w-full p-2 glass-panel text-xs"
                          >
                            {STATUS_LIST.map((st) => (
                              <option key={st} value={st}>{st === 'None' ? 'Ninguno' : st}</option>
                            ))}
                          </select>
                        </div>

                        {/* Estado Real Post-Turno (HP Sync) */}
                        <div className="space-y-2 pt-2 border-t border-white/10">
                          <label className="text-[10px] uppercase tracking-wider text-white/90 font-extrabold block">Estado Real Post-Turno (Consola)</label>
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <span className="text-[9px] uppercase tracking-wider text-white/45 font-bold block">¿Tu Pokémon sobrevivió?</span>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPlayerSurvived(true)}
                                  className={`py-1.5 text-[9px] font-bold uppercase tracking-wider border transition-all ${
                                    playerSurvived ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white/10 text-white/70 border-white/15 hover:bg-white/5'
                                  }`}
                                >
                                  Sí, sobrevivió
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPlayerSurvived(false);
                                    setPlayerRealHp('0');
                                  }}
                                  className={`py-1.5 text-[9px] font-bold uppercase tracking-wider border transition-all ${
                                    !playerSurvived ? 'bg-rose-600 text-white border-rose-600' : 'bg-white/10 text-white/70 border-white/15 hover:bg-rose-500/20 hover:text-rose-200'
                                  }`}
                                >
                                  No, se debilitó
                                </button>
                              </div>
                            </div>

                            {playerSurvived && (
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase tracking-wider text-white/45 font-bold block">HP Real Restante en la Consola</span>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="1"
                                    max={playerParty[activePlayerIdx]?.maxHp || 999}
                                    placeholder={String(playerParty[activePlayerIdx]?.hp || '')}
                                    value={playerRealHp}
                                    onChange={(e) => setPlayerRealHp(e.target.value)}
                                    className="w-full p-2 glass-panel text-xs font-mono font-bold"
                                  />
                                  <span className="text-[10px] text-white/45 font-mono">/ {playerParty[activePlayerIdx]?.maxHp} HP</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Rival Choice */}
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider border-b border-white/10 pb-1.5 text-white/90">Acción del Rival</h4>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setRivalSwitchTo(-1)}
                            className={`py-2 text-[10px] font-bold uppercase tracking-wider border transition-all ${
                              rivalSwitchTo === -1 ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white border-transparent shadow-lg shadow-rose-500/25' : 'bg-white/10 text-white/70 border-white/15 hover:bg-white/5'
                            }`}
                          >
                            Atacar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const cand = rivalParty.findIndex((p, i) => i !== activeRivalIdx && p.hp > 0);
                              setRivalSwitchTo(cand >= 0 ? cand : 0);
                            }}
                            className={`py-2 text-[10px] font-bold uppercase tracking-wider border transition-all ${
                              rivalSwitchTo !== -1 ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white border-transparent shadow-lg shadow-rose-500/25' : 'bg-white/10 text-white/70 border-white/15 hover:bg-white/5'
                            }`}
                          >
                            Cambiar
                          </button>
                        </div>

                        {rivalSwitchTo === -1 ? (
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase tracking-wider text-white/45 font-bold">Ataque Utilizado por el Rival</label>
                            <select
                              value={rivalMoveUsed}
                              onChange={(e) => setRivalMoveUsed(Number(e.target.value))}
                              className="w-full p-2 glass-panel text-xs font-semibold"
                            >
                              {rivalParty[activeRivalIdx]?.moves.map((m, idx) => (
                                <option key={idx} value={idx}>{m.name} ({m.type})</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase tracking-wider text-white/45 font-bold">Pokémon que ingresó el Rival</label>
                            <select
                              value={rivalSwitchTo}
                              onChange={(e) => setRivalSwitchTo(Number(e.target.value))}
                              className="w-full p-2 glass-panel text-xs font-semibold"
                            >
                              {rivalParty.map((p, idx) => (
                                <option key={idx} value={idx} disabled={idx === activeRivalIdx || p.hp <= 0}>
                                  {p.name} {p.hp <= 0 ? '(DEBILITADO)' : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/70 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={rivalCrit}
                              onChange={(e) => setRivalCrit(e.target.checked)}
                              className="rounded-2xl border-white/20 text-white focus:ring-0"
                            />
                            ¿Fue Crítico?
                          </label>
                          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/70 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={rivalMiss}
                              onChange={(e) => setRivalMiss(e.target.checked)}
                              className="rounded-2xl border-white/20 text-white focus:ring-0"
                            />
                            ¿Falló Rival?
                          </label>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-wider text-white/45 font-bold">Estado aplicado al Pokémon Rival</label>
                          <select
                            value={rivalStatusApplied}
                            onChange={(e) => setRivalStatusApplied(e.target.value as StatusEffect)}
                            className="w-full p-2 glass-panel text-xs"
                          >
                            {STATUS_LIST.map((st) => (
                              <option key={st} value={st}>{st === 'None' ? 'Ninguno' : st}</option>
                            ))}
                          </select>
                        </div>

                        {/* Estado Real Post-Turno (HP Sync) */}
                        <div className="space-y-2 pt-2 border-t border-white/10">
                          <label className="text-[10px] uppercase tracking-wider text-white/90 font-extrabold block">Estado Real Post-Turno (Consola)</label>
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <span className="text-[9px] uppercase tracking-wider text-white/45 font-bold block">¿El Pokémon rival sobrevivió?</span>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setRivalSurvived(true)}
                                  className={`py-1.5 text-[9px] font-bold uppercase tracking-wider border transition-all ${
                                    rivalSurvived ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white/10 text-white/70 border-white/15 hover:bg-white/5'
                                  }`}
                                >
                                  Sí, sobrevivió
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRivalSurvived(false);
                                    setRivalRealHp('0');
                                  }}
                                  className={`py-1.5 text-[9px] font-bold uppercase tracking-wider border transition-all ${
                                    !rivalSurvived ? 'bg-rose-600 text-white border-rose-600' : 'bg-white/10 text-white/70 border-white/15 hover:bg-rose-500/20 hover:text-rose-200'
                                  }`}
                                >
                                  No, se debilitó
                                </button>
                              </div>
                            </div>

                            {rivalSurvived && (
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase tracking-wider text-white/45 font-bold block">HP Real Restante en la Consola</span>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="1"
                                    max={rivalParty[activeRivalIdx]?.maxHp || 999}
                                    placeholder={String(rivalParty[activeRivalIdx]?.hp || '')}
                                    value={rivalRealHp}
                                    onChange={(e) => setRivalRealHp(e.target.value)}
                                    className="w-full p-2 glass-panel text-xs font-mono font-bold"
                                  />
                                  <span className="text-[10px] text-white/45 font-mono">/ {rivalParty[activeRivalIdx]?.maxHp} HP</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Submit button */}
                      <div className="md:col-span-2 pt-4">
                        <button
                          type="submit"
                          disabled={isCalculating}
                          className="w-full py-4.5 btn-accent text-white text-xs font-bold uppercase tracking-[0.3em] transition-all disabled:bg-white/10 disabled:text-white/40"
                        >
                          {isCalculating ? 'Simulando resolución de daño...' : 'Ejecutar Turno y Sincronizar'}
                        </button>
                      </div>
                    </form>

                    {/* Combat Log */}
                    <div className="pt-4 border-t border-white/10">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/90 mb-2 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-white/45" />
                        Registro de Combate Reciente (Stateless Logging)
                      </h4>
                      <div className="advice-card p-4 font-mono text-[11px] space-y-1.5 max-h-[150px] overflow-y-auto">
                        {battleHistory.length === 0 ? (
                          <div className="advice-label italic">No hay registros registrados.</div>
                        ) : (
                          battleHistory.map((log, idx) => (
                            <div key={idx} className="advice-title border-l-2 border-slate-400 pl-2 py-0.5">{log}</div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </section>
          </>
      </main>

      {/* Modal Importar Showdown */}
      {importOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="import-title">
          <div className="modal-panel space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="import-title" className="text-lg font-display font-bold text-white">
                  Importar equipo Showdown
                </h2>
                <p className="text-xs text-white/55 mt-1">
                  Pega el texto exportado de Pokémon Showdown para el{' '}
                  <span className="font-bold text-white/80">
                    {importTarget === 'player' ? 'plantel aliado' : 'plantel rival'}
                  </span>
                  .
                </p>
              </div>
              <button type="button" onClick={() => setImportOpen(false)} className="text-white/50 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value);
                setImportError(null);
              }}
              rows={14}
              spellCheck={false}
              placeholder={`Charizard @ Leftovers\nAbility: Blaze\nEVs: 252 SpA / 4 SpD / 252 Spe\nTimid Nature\n- Flamethrower\n- Air Slash\n- Focus Blast\n- Roost\n\nSnorlax @ Leftovers\n...`}
              className="w-full font-mono text-xs leading-relaxed resize-y min-h-[220px]"
            />

            {importError && (
              <div className="text-xs text-rose-200 bg-rose-500/15 border border-rose-400/30 rounded-xl px-3 py-2">
                {importError}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="px-4 py-2.5 btn-ghost text-xs font-bold uppercase tracking-wider"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleImportShowdown}
                className="flex-1 py-2.5 btn-accent text-xs font-bold uppercase tracking-wider"
              >
                Aplicar al equipo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        className="border-t border-white/10 py-3.5 px-8 text-[10px] text-white/40 flex flex-col sm:flex-row justify-between items-center gap-2 backdrop-blur-xl shrink-0 font-mono uppercase tracking-wider"
        style={{ background: 'var(--color-header)' }}
      >
        <span>© 2026 PokeOracle Studio</span>
        <div className="flex gap-4">
          <span>Heurística: Expectiminimax Depth 3</span>
          <span>Reglas: Gen 3 + Habilidades & Objetos</span>
        </div>
      </footer>

    </div>
  );
}
