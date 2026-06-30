import React, { useState, useEffect } from 'react';
import {
  Pokemon,
  Move,
  PokemonType,
  StatusEffect,
  MoveCategory,
  SuggestionResult,
  BattleSession
} from './types';
import { csharpCodebase, CSharpFile } from './csharpCode';
import {
  Sparkles,
  Play,
  RotateCcw,
  Copy,
  Check,
  FileCode,
  Folder,
  ChevronRight,
  Info,
  Sliders,
  Plus,
  Trash2,
  Sword,
  Shield,
  Zap,
  Activity,
  Award,
  ChevronDown,
  ExternalLink,
  BookOpen,
  User,
  HelpCircle,
  TrendingUp,
  X
} from 'lucide-react';

const TYPES_LIST: PokemonType[] = [
  'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice', 'Fighting',
  'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost',
  'Dragon', 'Dark', 'Steel', 'Fairy'
];

const STATUS_LIST: StatusEffect[] = ['None', 'Paralysis', 'Poison', 'Burn', 'Sleep', 'Freeze'];

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'codebase'>('simulator');

  // --- Catalogs from API ---
  const [pokemonCatalog, setPokemonCatalog] = useState<any[]>([]);
  const [movesCatalog, setMovesCatalog] = useState<Move[]>([]);
  const [abilitiesCatalog, setAbilitiesCatalog] = useState<string[]>([]);
  const [itemsCatalog, setItemsCatalog] = useState<string[]>([]);

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

  // --- Codebase Viewer State ---
  const [selectedProject, setSelectedProject] = useState<string>('PokeOracle.Domain');
  const [selectedFile, setSelectedFile] = useState<CSharpFile>(csharpCodebase[0]);
  const [searchCodeQuery, setSearchCodeQuery] = useState<string>('');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

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

  // Codebase filters
  const filteredFiles = csharpCodebase.filter(
    (file) =>
      file.project === selectedProject &&
      (searchCodeQuery === '' ||
        file.path.toLowerCase().includes(searchCodeQuery.toLowerCase()) ||
        file.content.toLowerCase().includes(searchCodeQuery.toLowerCase()))
  );

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(selectedFile.path);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#fcfcfc] text-slate-900 font-sans overflow-hidden">
      
      {/* Top Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-slate-900 text-white rounded-none flex items-center justify-center font-bold text-xs uppercase tracking-tighter">PO</div>
          <h1 className="text-sm font-bold uppercase tracking-widest text-slate-900">
            PokeOracle Studio <span className="text-gray-300 font-normal">| Randomlocke Assistant</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          <nav className="flex gap-6 text-[10px] font-bold uppercase tracking-widest">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`pb-1 transition-all ${
                activeTab === 'simulator'
                  ? 'text-black border-b-2 border-black font-extrabold'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Simulador
            </button>
            <button
              onClick={() => {
                setActiveTab('codebase');
                const domainFirst = csharpCodebase.find(f => f.project === 'PokeOracle.Domain');
                if (domainFirst) setSelectedFile(domainFirst);
              }}
              className={`pb-1 transition-all ${
                activeTab === 'codebase'
                  ? 'text-black border-b-2 border-black font-extrabold'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Código Limpio C#
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'simulator' ? (
          <>
            {/* Quick Status Bar */}
            <aside className="w-64 border-r border-gray-100 p-6 flex flex-col justify-between shrink-0 hidden lg:flex bg-white overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-gray-400 mb-1.5 block font-bold">Estado</label>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className={`w-2 h-2 rounded-full ${sessionId ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400 animate-pulse'}`}></span>
                    <span className="text-slate-700">{sessionId ? 'Sesión Iniciada' : 'Configurando Equipos'}</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-4">
                  <div>
                    <label className="text-[9px] uppercase tracking-widest text-gray-400 block font-bold">Heurística de Combate</label>
                    <p className="text-[11px] text-slate-500 font-mono mt-1">
                      Expectiminimax (Depth 3)<br />
                      Foco: Daño Óptimo & KO
                    </p>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-widest text-gray-400 block font-bold">Base de Datos</label>
                    <p className="text-[11px] text-slate-500 font-mono mt-1">
                      EF Core In-Memory<br />
                      Catálogo Dinámico Cargado
                    </p>
                  </div>
                </div>

                {sessionId && (
                  <div className="border-t border-gray-100 pt-4 space-y-2">
                    <label className="text-[9px] uppercase tracking-widest text-gray-400 block font-bold">Tu Plantel Vivo</label>
                    <div className="grid grid-cols-6 gap-1.5 mt-2">
                      {playerParty.map((p, i) => (
                        <div
                          key={i}
                          title={`${p.name} (${p.hp}/${p.maxHp} HP)`}
                          className={`h-6 rounded-none flex items-center justify-center text-[10px] font-bold font-mono ${
                            p.hp <= 0 ? 'bg-red-100 text-red-500 line-through' : i === activePlayerIdx ? 'bg-black text-white' : 'bg-gray-100 text-slate-600'
                          }`}
                        >
                          {p.name.charAt(0)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="text-[9px] text-gray-400 font-mono leading-relaxed uppercase border-t border-gray-100 pt-4">
                PokeOracle Client v2.0<br />
                Clean Minimalism Theme
              </div>
            </aside>

            {/* Stage Area */}
            <section className="flex-1 p-6 md:p-8 flex flex-col overflow-y-auto bg-white relative">
              
              {/* Step Flow indicator */}
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-6 shrink-0">
                <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest">
                  <span className={currentStep === 1 ? 'text-black border-b border-black pb-3' : 'text-gray-300'}>01 Setup Dinámico</span>
                  <span className={currentStep === 2 ? 'text-black border-b border-black pb-3' : 'text-gray-300'}>02 Salida (Lead)</span>
                  <span className={currentStep === 3 ? 'text-black border-b border-black pb-3' : 'text-gray-300'}>03 Simulación Activa</span>
                </div>

                {sessionId && (
                  <button
                    onClick={handleResetSession}
                    className="text-red-500 hover:text-red-700 flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider"
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
                      <div className="inline-block px-2.5 py-1 bg-black text-white text-[9px] font-mono uppercase tracking-widest mb-3">CONSTRUCCIÓN SIN LIMITACIONES</div>
                      <h2 className="text-3xl font-light tracking-tight text-slate-900 leading-none mb-2">Editor de Estadísticas Reales y Atributos</h2>
                      <p className="text-slate-500 text-xs italic max-w-xl">
                        PROHIBIDO hardcodear equipos. Selecciona Pokémon de Kanto, asigna estadísticas reales (con EVs/IVs ya calculados de tu emulador), define Habilidad de Gen 3, Objeto Equipado y sus 4 ataques correspondientes.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                      {/* Left Side: Slots selection */}
                      <div className="xl:col-span-5 space-y-4">
                        <div className="flex bg-gray-100 p-1 rounded-none text-[10px] font-bold uppercase tracking-wider">
                          <button
                            onClick={() => { setEditingParty('player'); setSelectedSlotIndex(0); }}
                            className={`flex-1 py-1.5 text-center ${editingParty === 'player' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}
                          >
                            Tu Equipo
                          </button>
                          <button
                            onClick={() => { setEditingParty('rival'); setSelectedSlotIndex(0); }}
                            className={`flex-1 py-1.5 text-center ${editingParty === 'rival' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}
                          >
                            Equipo Rival
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          {(editingParty === 'player' ? playerParty : rivalParty).map((pkm, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedSlotIndex(idx)}
                              className={`p-3 text-left border flex justify-between items-center transition-all ${
                                selectedSlotIndex === idx
                                  ? 'bg-black text-white border-black'
                                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-slate-800'
                              }`}
                            >
                              <div className="truncate">
                                <span className="text-[10px] font-mono mr-2 text-gray-400">SLOT {idx + 1}</span>
                                <span className="font-bold text-xs uppercase tracking-tight">{pkm.name || 'Seleccionar...'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 font-mono text-[9px]">
                                <span className="text-[9px] uppercase text-gray-400 truncate max-w-[80px]">{(pkm as any).ability}</span>
                                <ChevronRight className="w-3 h-3 opacity-60" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Right Side: Specific stats and details editor */}
                      <div className="xl:col-span-7 bg-gray-50 border border-gray-100 p-5 space-y-4">
                        {currentEditingPokemon ? (
                          <>
                            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                              <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">Editor Slot {selectedSlotIndex + 1} ({editingParty === 'player' ? 'Jugador' : 'Rival'})</span>
                              <div className="flex gap-1.5">
                                {currentEditingPokemon.types.map((t, i) => (
                                  <span key={i} className="text-[8px] px-1.5 py-0.5 bg-gray-200 text-slate-700 font-bold uppercase">{t}</span>
                                ))}
                              </div>
                            </div>

                            {/* Dropdown 151 Kanto Species */}
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Especie Pokémon (151 Kanto)</label>
                              <select
                                value={currentEditingPokemon.name}
                                onChange={(e) => handleUpdatePokemonField(editingParty, selectedSlotIndex, 'name', e.target.value)}
                                className="w-full p-2.5 bg-white border border-gray-200 text-xs font-bold uppercase tracking-wider"
                              >
                                {pokemonCatalog.map((p) => (
                                  <option key={p.name} value={p.name}>{p.name}</option>
                                ))}
                              </select>
                            </div>

                            {/* IV/EV Real Stats Input */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-baseline">
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Estadísticas Reales del Juego</label>
                                <span className="text-[8px] text-amber-600 font-semibold font-mono uppercase">¡Ingresar stats reales, no base!</span>
                              </div>
                              <div className="grid grid-cols-6 gap-2 font-mono text-xs">
                                <div>
                                  <div className="text-[8px] text-slate-400 uppercase text-center font-bold mb-1">HP Real</div>
                                  <input
                                    type="number"
                                    value={currentEditingPokemon.maxHp}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      handleUpdatePokemonField(editingParty, selectedSlotIndex, 'maxHp', val);
                                      handleUpdatePokemonField(editingParty, selectedSlotIndex, 'hp', val);
                                    }}
                                    className="w-full p-1.5 border border-gray-200 bg-white text-center text-xs font-bold"
                                  />
                                </div>
                                <div>
                                  <div className="text-[8px] text-slate-400 uppercase text-center font-bold mb-1">ATK</div>
                                  <input
                                    type="number"
                                    value={currentEditingPokemon.attack}
                                    onChange={(e) => handleUpdatePokemonField(editingParty, selectedSlotIndex, 'attack', Number(e.target.value))}
                                    className="w-full p-1.5 border border-gray-200 bg-white text-center text-xs font-bold"
                                  />
                                </div>
                                <div>
                                  <div className="text-[8px] text-slate-400 uppercase text-center font-bold mb-1">DEF</div>
                                  <input
                                    type="number"
                                    value={currentEditingPokemon.defense}
                                    onChange={(e) => handleUpdatePokemonField(editingParty, selectedSlotIndex, 'defense', Number(e.target.value))}
                                    className="w-full p-1.5 border border-gray-200 bg-white text-center text-xs font-bold"
                                  />
                                </div>
                                <div>
                                  <div className="text-[8px] text-slate-400 uppercase text-center font-bold mb-1">SPA</div>
                                  <input
                                    type="number"
                                    value={currentEditingPokemon.spAttack}
                                    onChange={(e) => handleUpdatePokemonField(editingParty, selectedSlotIndex, 'spAttack', Number(e.target.value))}
                                    className="w-full p-1.5 border border-gray-200 bg-white text-center text-xs font-bold"
                                  />
                                </div>
                                <div>
                                  <div className="text-[8px] text-slate-400 uppercase text-center font-bold mb-1">SPD</div>
                                  <input
                                    type="number"
                                    value={currentEditingPokemon.spDefense}
                                    onChange={(e) => handleUpdatePokemonField(editingParty, selectedSlotIndex, 'spDefense', Number(e.target.value))}
                                    className="w-full p-1.5 border border-gray-200 bg-white text-center text-xs font-bold"
                                  />
                                </div>
                                <div>
                                  <div className="text-[8px] text-slate-400 uppercase text-center font-bold mb-1">SPE</div>
                                  <input
                                    type="number"
                                    value={currentEditingPokemon.speed}
                                    onChange={(e) => handleUpdatePokemonField(editingParty, selectedSlotIndex, 'speed', Number(e.target.value))}
                                    className="w-full p-1.5 border border-gray-200 bg-white text-center text-xs font-bold"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Abilities and Held Items selects */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Habilidad Gen 3 (76 disponibles)</label>
                                <select
                                  value={(currentEditingPokemon as any).ability || 'None'}
                                  onChange={(e) => handleUpdatePokemonField(editingParty, selectedSlotIndex, 'ability', e.target.value)}
                                  className="w-full p-2 bg-white border border-gray-200 text-xs font-semibold"
                                >
                                  {abilitiesCatalog.map((abil) => (
                                    <option key={abil} value={abil}>{abil}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Objeto Equipado (Held Item)</label>
                                <select
                                  value={(currentEditingPokemon as any).heldItem || 'None'}
                                  onChange={(e) => handleUpdatePokemonField(editingParty, selectedSlotIndex, 'heldItem', e.target.value)}
                                  className="w-full p-2 bg-white border border-gray-200 text-xs font-semibold"
                                >
                                  {itemsCatalog.map((it) => (
                                    <option key={it} value={it}>{it}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Moves edit lists */}
                            <div className="space-y-2 pt-2 border-t border-gray-200">
                              <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Set de Ataques (4 Movimientos)</label>
                              <div className="grid grid-cols-2 gap-2">
                                {[0, 1, 2, 3].map((moveIdx) => {
                                  const currentMoveName = currentEditingPokemon.moves[moveIdx]?.name || '';
                                  return (
                                    <select
                                      key={moveIdx}
                                      value={currentMoveName}
                                      onChange={(e) => handleUpdateMove(editingParty, selectedSlotIndex, moveIdx, e.target.value)}
                                      className="w-full p-2 bg-white border border-gray-200 text-[11px] font-semibold"
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
                          <div className="text-center py-10 text-xs text-gray-400 font-mono italic">Selecciona un slot para comenzar a configurar su composición.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 mt-auto">
                    <button
                      onClick={handleSetupBattle}
                      disabled={isCalculating}
                      className="w-full py-4.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-[0.3em] transition-all"
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
                      <div className="inline-block px-2.5 py-1 bg-black text-white text-[9px] font-mono uppercase tracking-widest mb-3">CONSEJO DEL ASISTENTE</div>
                      <h2 className="text-3xl font-light tracking-tight text-slate-900 leading-none mb-2">Predicción de Apertura de Combate (Lead)</h2>
                      <p className="text-slate-500 text-xs italic">
                        El motor de la IA evaluó la composición del rival y predice el abridor óptimo para maximizar el Matchup Ratio.
                      </p>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-none flex items-center gap-5 border border-slate-100">
                      <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 block font-bold">Abridor Sugerido</span>
                        <p className="text-xl font-bold tracking-tight text-slate-900 uppercase mt-0.5">{predictedLead}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">Definir abridores del combate real</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Tu Pokémon Inicial</label>
                          <select
                            value={selectedPlayerLead}
                            onChange={(e) => setSelectedPlayerLead(Number(e.target.value))}
                            className="w-full p-2.5 bg-white border border-gray-200 text-xs font-semibold"
                          >
                            {playerParty.map((p, i) => (
                              <option key={i} value={i}>{p.name} (HP: {p.hp}/{p.maxHp})</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Abridor Inicial Rival</label>
                          <select
                            value={selectedRivalLead}
                            onChange={(e) => setSelectedRivalLead(Number(e.target.value))}
                            className="w-full p-2.5 bg-white border border-gray-200 text-xs font-semibold"
                          >
                            {rivalParty.map((p, i) => (
                              <option key={i} value={i}>{p.name} (HP: {p.hp}/{p.maxHp})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-gray-100 mt-auto">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="px-6 py-4.5 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-bold uppercase tracking-widest transition-all"
                    >
                      Atrás
                    </button>
                    <button
                      onClick={handleConfirmLead}
                      disabled={isCalculating}
                      className="flex-1 py-4.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-widest transition-all"
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
                      <div className="bg-red-50 border-2 border-red-200 p-6 rounded-none space-y-4">
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
                            <div className="bg-white p-4 border border-red-100 space-y-3">
                              <span className="text-[10px] uppercase font-mono text-gray-400 block font-bold">Tu Pokémon está debilitado. Elige Sustituto:</span>
                              <select
                                value={freeSwitchChoice}
                                onChange={(e) => setFreeSwitchChoice(Number(e.target.value))}
                                className="w-full p-2 bg-gray-50 border border-gray-200 text-xs font-semibold"
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
                                className="w-full py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 disabled:bg-gray-200 disabled:text-gray-400"
                              >
                                Confirmar Tu Reemplazo Libre
                              </button>
                            </div>
                          ) : (
                            <div className="bg-gray-100 p-4 flex items-center justify-center text-[11px] font-mono text-slate-500 uppercase">
                              Tu Pokémon activo ({playerParty[activePlayerIdx]?.name}) sigue en pie.
                            </div>
                          )}

                          {/* Rival Free Switch Panel */}
                          {rivalParty[activeRivalIdx]?.hp <= 0 ? (
                            <div className="bg-white p-4 border border-red-100 space-y-3">
                              <span className="text-[10px] uppercase font-mono text-gray-400 block font-bold">Rival debilitado. Elige qué Pokémon envió el rival:</span>
                              <select
                                value={rivalFreeSwitchChoice}
                                onChange={(e) => setRivalFreeSwitchChoice(Number(e.target.value))}
                                className="w-full p-2 bg-gray-50 border border-gray-200 text-xs font-semibold"
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
                                className="w-full py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 disabled:bg-gray-200 disabled:text-gray-400"
                              >
                                Confirmar Reemplazo Rival
                              </button>
                            </div>
                          ) : (
                            <div className="bg-gray-100 p-4 flex items-center justify-center text-[11px] font-mono text-slate-500 uppercase">
                              El rival activo ({rivalParty[activeRivalIdx]?.name}) sigue en pie.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* ORACLE SUGGESTION COMPONENT */
                      aiSuggestion && (
                        <div className="bg-[#f3f4f6] p-5 border border-gray-200 relative">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[9px] font-mono uppercase bg-slate-900 text-white px-2 py-0.5 tracking-wider font-bold">
                              PokeOracle Engine // Confianza: {aiSuggestion.confidence}%
                            </span>
                          </div>

                          <h3 className="text-3xl font-light tracking-tight text-slate-900 mb-2">
                            Sugerencia: {aiSuggestion.recommendedAction === 'Move' ? (
                              <>Usar <span className="font-extrabold italic text-black">{aiSuggestion.moveName}</span></>
                            ) : (
                              <>Cambiar a <span className="font-extrabold italic text-black">{aiSuggestion.switchPokemonName}</span></>
                            )}
                          </h3>
                          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl mb-4 italic">
                            {aiSuggestion.explanation}
                          </p>

                          {/* Expectiminimax pathways dropdown */}
                          <div className="border-t border-gray-300 pt-3">
                            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block mb-1.5">Árbol de Expectación de Daño (Simulación Depth 3)</span>
                            <div className="bg-white p-3 max-h-[110px] overflow-y-auto space-y-1 font-mono text-[10px] text-slate-500 border border-gray-200">
                              {aiSuggestion.simulatedPaths.map((p, i) => (
                                <div key={i} className="flex gap-2">
                                  <span className="text-slate-400 font-bold">[{i+1}]</span>
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
                      <div className="p-4 bg-gray-50 border border-gray-100 space-y-2">
                        <div className="flex justify-between items-center text-[9px] uppercase tracking-widest text-slate-400 font-bold">
                          <span>Tu Pokémon Activo</span>
                          {playerParty[activePlayerIdx]?.status !== 'None' && (
                            <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 border border-yellow-200 text-[8px] font-bold uppercase">{playerParty[activePlayerIdx]?.status}</span>
                          )}
                        </div>
                        <div className="flex justify-between items-baseline">
                          <h4 className="text-lg font-bold text-slate-900 uppercase tracking-tight">{playerParty[activePlayerIdx]?.name}</h4>
                          <span className="text-xs font-mono text-slate-500">HP: {playerParty[activePlayerIdx]?.hp} / {playerParty[activePlayerIdx]?.maxHp}</span>
                        </div>
                        <div className="w-full bg-gray-200 h-1">
                          <div
                            className={`h-full transition-all duration-300 ${
                              (playerParty[activePlayerIdx]?.hp / playerParty[activePlayerIdx]?.maxHp) > 0.5
                                ? 'bg-emerald-500'
                                : (playerParty[activePlayerIdx]?.hp / playerParty[activePlayerIdx]?.maxHp) > 0.2
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.max(0, (playerParty[activePlayerIdx]?.hp / playerParty[activePlayerIdx]?.maxHp) * 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-mono text-gray-400">
                          <span>HAB: {(playerParty[activePlayerIdx] as any)?.ability || 'Ninguna'}</span>
                          <span>OBJ: {(playerParty[activePlayerIdx] as any)?.heldItem || 'Ninguno'}</span>
                          <span>SPE: {playerParty[activePlayerIdx]?.speed}</span>
                        </div>
                      </div>

                      {/* Rival status */}
                      <div className="p-4 bg-gray-50 border border-gray-100 space-y-2">
                        <div className="flex justify-between items-center text-[9px] uppercase tracking-widest text-slate-400 font-bold">
                          <span>Rival Activo</span>
                          {rivalParty[activeRivalIdx]?.status !== 'None' && (
                            <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 border border-yellow-200 text-[8px] font-bold uppercase">{rivalParty[activeRivalIdx]?.status}</span>
                          )}
                        </div>
                        <div className="flex justify-between items-baseline">
                          <h4 className="text-lg font-bold text-slate-900 uppercase tracking-tight">{rivalParty[activeRivalIdx]?.name}</h4>
                          <span className="text-xs font-mono text-slate-500">HP: {rivalParty[activeRivalIdx]?.hp} / {rivalParty[activeRivalIdx]?.maxHp}</span>
                        </div>
                        <div className="w-full bg-gray-200 h-1">
                          <div
                            className={`h-full transition-all duration-300 ${
                              (rivalParty[activeRivalIdx]?.hp / rivalParty[activeRivalIdx]?.maxHp) > 0.5
                                ? 'bg-emerald-500'
                                : (rivalParty[activeRivalIdx]?.hp / rivalParty[activeRivalIdx]?.maxHp) > 0.2
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.max(0, (rivalParty[activeRivalIdx]?.hp / rivalParty[activeRivalIdx]?.maxHp) * 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-mono text-gray-400">
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
                        <h4 className="text-[10px] font-bold uppercase tracking-wider border-b border-gray-100 pb-1.5 text-slate-800">Tu Acción Realizada</h4>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPlayerSwitchTo(-1)}
                            className={`py-2 text-[10px] font-bold uppercase tracking-wider border transition-all ${
                              playerSwitchTo === -1 ? 'bg-black text-white border-black' : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-50'
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
                              playerSwitchTo !== -1 ? 'bg-black text-white border-black' : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            Cambiar
                          </button>
                        </div>

                        {playerSwitchTo === -1 ? (
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Ataque Utilizado</label>
                            <select
                              value={playerMoveUsed}
                              onChange={(e) => setPlayerMoveUsed(Number(e.target.value))}
                              className="w-full p-2 bg-gray-50 border border-gray-200 text-xs font-semibold"
                            >
                              {playerParty[activePlayerIdx]?.moves.map((m, idx) => (
                                <option key={idx} value={idx}>{m.name} ({m.type})</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Pokémon que ingresaste</label>
                            <select
                              value={playerSwitchTo}
                              onChange={(e) => setPlayerSwitchTo(Number(e.target.value))}
                              className="w-full p-2 bg-gray-50 border border-gray-200 text-xs font-semibold"
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
                          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={playerCrit}
                              onChange={(e) => setPlayerCrit(e.target.checked)}
                              className="rounded-none border-gray-300 text-black focus:ring-0"
                            />
                            ¿Golpe Crítico?
                          </label>
                          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={playerMiss}
                              onChange={(e) => setPlayerMiss(e.target.checked)}
                              className="rounded-none border-gray-300 text-black focus:ring-0"
                            />
                            ¿Falló ataque?
                          </label>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Estado aplicado a tu Pokémon en este turno</label>
                          <select
                            value={playerStatusApplied}
                            onChange={(e) => setPlayerStatusApplied(e.target.value as StatusEffect)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 text-xs"
                          >
                            {STATUS_LIST.map((st) => (
                              <option key={st} value={st}>{st === 'None' ? 'Ninguno' : st}</option>
                            ))}
                          </select>
                        </div>

                        {/* Estado Real Post-Turno (HP Sync) */}
                        <div className="space-y-2 pt-2 border-t border-gray-100">
                          <label className="text-[10px] uppercase tracking-wider text-slate-800 font-extrabold block">Estado Real Post-Turno (Consola)</label>
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">¿Tu Pokémon sobrevivió?</span>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPlayerSurvived(true)}
                                  className={`py-1.5 text-[9px] font-bold uppercase tracking-wider border transition-all ${
                                    playerSurvived ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-50'
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
                                    !playerSurvived ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-600 border-gray-200 hover:bg-rose-50 hover:text-rose-600'
                                  }`}
                                >
                                  No, se debilitó
                                </button>
                              </div>
                            </div>

                            {playerSurvived && (
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">HP Real Restante en la Consola</span>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="1"
                                    max={playerParty[activePlayerIdx]?.maxHp || 999}
                                    placeholder={String(playerParty[activePlayerIdx]?.hp || '')}
                                    value={playerRealHp}
                                    onChange={(e) => setPlayerRealHp(e.target.value)}
                                    className="w-full p-2 bg-gray-50 border border-gray-200 text-xs font-mono font-bold"
                                  />
                                  <span className="text-[10px] text-slate-400 font-mono">/ {playerParty[activePlayerIdx]?.maxHp} HP</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Rival Choice */}
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider border-b border-gray-100 pb-1.5 text-slate-800">Acción del Rival</h4>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setRivalSwitchTo(-1)}
                            className={`py-2 text-[10px] font-bold uppercase tracking-wider border transition-all ${
                              rivalSwitchTo === -1 ? 'bg-black text-white border-black' : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-50'
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
                              rivalSwitchTo !== -1 ? 'bg-black text-white border-black' : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            Cambiar
                          </button>
                        </div>

                        {rivalSwitchTo === -1 ? (
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Ataque Utilizado por el Rival</label>
                            <select
                              value={rivalMoveUsed}
                              onChange={(e) => setRivalMoveUsed(Number(e.target.value))}
                              className="w-full p-2 bg-gray-50 border border-gray-200 text-xs font-semibold"
                            >
                              {rivalParty[activeRivalIdx]?.moves.map((m, idx) => (
                                <option key={idx} value={idx}>{m.name} ({m.type})</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Pokémon que ingresó el Rival</label>
                            <select
                              value={rivalSwitchTo}
                              onChange={(e) => setRivalSwitchTo(Number(e.target.value))}
                              className="w-full p-2 bg-gray-50 border border-gray-200 text-xs font-semibold"
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
                          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={rivalCrit}
                              onChange={(e) => setRivalCrit(e.target.checked)}
                              className="rounded-none border-gray-300 text-black focus:ring-0"
                            />
                            ¿Fue Crítico?
                          </label>
                          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={rivalMiss}
                              onChange={(e) => setRivalMiss(e.target.checked)}
                              className="rounded-none border-gray-300 text-black focus:ring-0"
                            />
                            ¿Falló Rival?
                          </label>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Estado aplicado al Pokémon Rival</label>
                          <select
                            value={rivalStatusApplied}
                            onChange={(e) => setRivalStatusApplied(e.target.value as StatusEffect)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 text-xs"
                          >
                            {STATUS_LIST.map((st) => (
                              <option key={st} value={st}>{st === 'None' ? 'Ninguno' : st}</option>
                            ))}
                          </select>
                        </div>

                        {/* Estado Real Post-Turno (HP Sync) */}
                        <div className="space-y-2 pt-2 border-t border-gray-100">
                          <label className="text-[10px] uppercase tracking-wider text-slate-800 font-extrabold block">Estado Real Post-Turno (Consola)</label>
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">¿El Pokémon rival sobrevivió?</span>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setRivalSurvived(true)}
                                  className={`py-1.5 text-[9px] font-bold uppercase tracking-wider border transition-all ${
                                    rivalSurvived ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-50'
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
                                    !rivalSurvived ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-600 border-gray-200 hover:bg-rose-50 hover:text-rose-600'
                                  }`}
                                >
                                  No, se debilitó
                                </button>
                              </div>
                            </div>

                            {rivalSurvived && (
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">HP Real Restante en la Consola</span>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="1"
                                    max={rivalParty[activeRivalIdx]?.maxHp || 999}
                                    placeholder={String(rivalParty[activeRivalIdx]?.hp || '')}
                                    value={rivalRealHp}
                                    onChange={(e) => setRivalRealHp(e.target.value)}
                                    className="w-full p-2 bg-gray-50 border border-gray-200 text-xs font-mono font-bold"
                                  />
                                  <span className="text-[10px] text-slate-400 font-mono">/ {rivalParty[activeRivalIdx]?.maxHp} HP</span>
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
                          className="w-full py-4.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-[0.3em] transition-all disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          {isCalculating ? 'Simulando resolución de daño...' : 'Ejecutar Turno y Sincronizar'}
                        </button>
                      </div>
                    </form>

                    {/* Combat Log */}
                    <div className="pt-4 border-t border-gray-100">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-800 mb-2 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-slate-400" />
                        Registro de Combate Reciente (Stateless Logging)
                      </h4>
                      <div className="bg-[#f9fafb] p-4 font-mono text-[11px] text-slate-600 space-y-1.5 max-h-[150px] overflow-y-auto border border-gray-100">
                        {battleHistory.length === 0 ? (
                          <div className="text-gray-400 italic">No hay registros registrados.</div>
                        ) : (
                          battleHistory.map((log, idx) => (
                            <div key={idx} className="border-l-2 border-slate-300 pl-2 py-0.5">{log}</div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </section>
          </>
        ) : (
          /* CODEBASE VIEW WITH SHINY MINIMALISM */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white">
            
            {/* Project Tree */}
            <aside className="w-72 border-r border-gray-100 p-6 flex flex-col justify-between shrink-0 bg-[#fafafa] overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-gray-400 mb-1.5 block font-bold">Clean Architecture</label>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">PokeOracle C# .NET 8</h3>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                    Estructura desacoplada y modular con el patrón Strategy y base de datos en memoria.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[9px] text-gray-400 font-mono uppercase tracking-widest block font-bold">Proyectos C#</span>
                  <div className="space-y-1">
                    {['PokeOracle.Domain', 'PokeOracle.Application', 'PokeOracle.Infrastructure', 'PokeOracle.WebApi'].map((proj) => (
                      <button
                        key={proj}
                        onClick={() => {
                          setSelectedProject(proj);
                          const firstFile = csharpCodebase.find(f => f.project === proj);
                          if (firstFile) setSelectedFile(firstFile);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all flex justify-between items-center border ${
                          selectedProject === proj
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white hover:bg-gray-100 text-slate-700 border-gray-200'
                        }`}
                      >
                        <span className="truncate">{proj}</span>
                        <Folder className="w-3.5 h-3.5 opacity-70 shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[9px] text-gray-400 font-mono uppercase tracking-widest block font-bold">Buscar en Código</span>
                  <input
                    type="text"
                    placeholder="Ej. Strategy, EF Core..."
                    value={searchCodeQuery}
                    onChange={(e) => setSearchCodeQuery(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 placeholder-gray-300 focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[9px] text-gray-400 font-mono uppercase tracking-widest block font-bold">Archivos</span>
                  <div className="space-y-1 max-h-[220px] overflow-y-auto pr-2">
                    {filteredFiles.map((file) => (
                      <button
                        key={file.path}
                        onClick={() => setSelectedFile(file)}
                        className={`w-full text-left px-3 py-1.5 text-xs font-mono transition-all flex items-center gap-2 border ${
                          selectedFile.path === file.path && selectedFile.project === file.project
                            ? 'bg-gray-200 text-slate-900 font-bold border-gray-200'
                            : 'hover:bg-gray-100 text-gray-500 border-transparent bg-transparent'
                        }`}
                      >
                        <FileCode className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{file.path}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 text-[10px] text-gray-400 font-mono space-y-1 leading-relaxed">
                <div className="font-bold text-slate-700 uppercase tracking-widest text-[9px] mb-1">Dependencias:</div>
                <div>Domain ─── Sin dependencias</div>
                <div>Application ─── Domain</div>
                <div>Infrastructure ─── Application & Domain</div>
                <div>WebApi ─── Application & Infra</div>
              </div>
            </aside>

            {/* Code Output Screen */}
            <div className="flex-1 flex flex-col bg-[#0b0f19] text-slate-200 overflow-hidden">
              <div className="border-b border-slate-900 px-6 py-4 flex justify-between items-center bg-[#131a2c] shrink-0">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-slate-500">{selectedFile.project}/</span>
                  <span className="text-slate-200 font-bold">{selectedFile.path}</span>
                </div>

                <button
                  onClick={() => handleCopyCode(selectedFile.content)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all rounded-none"
                >
                  {copiedFile === selectedFile.path ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copiar C#
                    </>
                  )}
                </button>
              </div>

              <div className="flex-1 p-6 overflow-auto font-mono text-xs leading-relaxed bg-[#060910]">
                <pre className="whitespace-pre">
                  <code>{selectedFile.content}</code>
                </pre>
              </div>

              <div className="bg-[#111622] border-t border-slate-950 p-3 text-[9px] font-mono text-slate-500 flex justify-between shrink-0 uppercase tracking-widest">
                <span>Plataforma: .NET 8.0</span>
                <span>Arquitectura Limpia y Desacoplada</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-3.5 px-8 text-[10px] text-gray-400 flex flex-col sm:flex-row justify-between items-center gap-2 bg-white shrink-0 font-mono uppercase tracking-wider">
        <span>© 2026 PokeOracle Studio</span>
        <div className="flex gap-4">
          <span>Heurística: Expectiminimax Depth 3</span>
          <span>Reglas: Gen 3 + Habilidades & Objetos</span>
        </div>
      </footer>

    </div>
  );
}
