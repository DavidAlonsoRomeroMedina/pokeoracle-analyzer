import React, { useMemo, useRef, useState } from 'react';
import {
  X,
  Globe,
  User,
  Wand2,
  BookOpen,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import type { Move, PokemonCatalogEntry, PokemonType } from './types';
import {
  LocaleId,
  LOCALE_OPTIONS,
  t,
} from './i18n';
import {
  COUNTRIES,
  CreatedPokemon,
  UserProfile,
  countryMeta,
} from './userStorage';

const TYPES_LIST: PokemonType[] = [
  'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice', 'Fighting',
  'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost',
  'Dragon', 'Dark', 'Steel', 'Fairy',
];

function ModalShell({
  titleId,
  title,
  hint,
  icon,
  onClose,
  children,
  wide,
}: {
  titleId: string;
  title: string;
  hint?: string;
  icon: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className={`modal-panel space-y-4 ${wide ? 'modal-panel-wide' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
              {icon}
            </div>
            <div>
              <h2 id={titleId} className="text-lg font-display font-bold text-white leading-tight">
                {title}
              </h2>
              {hint && <p className="text-[11px] text-white/50 mt-0.5">{hint}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/50 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function LanguageModal({
  locale,
  onSelect,
  onClose,
}: {
  locale: LocaleId;
  onSelect: (id: LocaleId) => void;
  onClose: () => void;
}) {
  const msg = t(locale);
  return (
    <ModalShell
      titleId="lang-title"
      title={msg.langTitle}
      hint={msg.langHint}
      icon={<Globe className="w-4 h-4 text-sky-300" />}
      onClose={onClose}
    >
      <div className="grid grid-cols-1 gap-2.5">
        {LOCALE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => {
              onSelect(opt.id);
              onClose();
            }}
            className={`text-left px-4 py-3.5 rounded-2xl border transition-all ${
              locale === opt.id
                ? 'bg-white/15 border-sky-400/50 text-white'
                : 'bg-black/25 border-white/10 text-white/75 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="text-xl" aria-hidden>{opt.flag}</span>
                <div>
                  <div className="text-sm font-bold">{opt.label}</div>
                  <div className="text-[11px] text-white/45">{opt.short}</div>
                </div>
              </div>
              {locale === opt.id && (
                <span className="text-[9px] uppercase tracking-wider font-bold text-sky-300">
                  {msg.active}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </ModalShell>
  );
}

export function ProfileModal({
  locale,
  profile,
  onChange,
  onClose,
}: {
  locale: LocaleId;
  profile: UserProfile;
  onChange: (next: UserProfile) => void;
  onClose: () => void;
}) {
  const msg = t(locale);
  const fileRef = useRef<HTMLInputElement>(null);
  const country = countryMeta(profile.country);

  const onAvatar = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ ...profile, avatarDataUrl: String(reader.result || '') });
    };
    reader.readAsDataURL(file);
  };

  const stats: { key: keyof UserProfile['stats']; label: string }[] = [
    { key: 'battles', label: msg.battles },
    { key: 'wins', label: msg.wins },
    { key: 'multiWins', label: msg.multiWins },
    { key: 'created', label: msg.created },
    { key: 'likes', label: msg.likes },
    { key: 'friends', label: msg.friends },
  ];

  return (
    <ModalShell
      titleId="profile-title"
      title={msg.profileTitle}
      icon={<User className="w-4 h-4 text-violet-300" />}
      onClose={onClose}
      wide
    >
      <div className="flex flex-col sm:flex-row gap-5">
        <div className="flex flex-col items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative w-28 h-28 rounded-2xl overflow-hidden border border-white/20 bg-black/40 group"
          >
            {profile.avatarDataUrl ? (
              <img src={profile.avatarDataUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white/40 gap-1">
                <ImageIcon className="w-7 h-7" />
                <span className="text-[9px] uppercase tracking-wider font-bold">Avatar</span>
              </div>
            )}
            <span className="absolute inset-x-0 bottom-0 py-1 bg-black/55 text-[9px] uppercase tracking-wider text-center opacity-0 group-hover:opacity-100 transition-opacity">
              Cambiar
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            className="hidden"
            onChange={(e) => onAvatar(e.target.files?.[0] ?? null)}
          />
          <div className="text-center">
            <div className="text-sm font-bold text-white">{profile.username}</div>
            <div className="text-[11px] font-mono text-amber-300/90">{profile.uniqueId}</div>
          </div>
        </div>

        <div className="flex-1 space-y-3 min-w-0">
          <div className="space-y-1">
            <label className="text-[9px] uppercase tracking-wider text-white/55 font-bold">{msg.username}</label>
            <input
              value={profile.username}
              onChange={(e) => onChange({ ...profile, username: e.target.value.slice(0, 24) })}
              className="w-full p-2.5 text-sm font-semibold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] uppercase tracking-wider text-white/55 font-bold">{msg.country}</label>
            <select
              value={profile.country}
              onChange={(e) => onChange({ ...profile, country: e.target.value })}
              className="w-full p-2.5 text-sm font-semibold"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-white/45">
              {country.flag} {country.name}
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] uppercase tracking-wider text-white/55 font-bold">{msg.registered}</label>
            <p className="text-sm text-white/80 font-mono">
              {new Date(profile.registeredAt).toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'es-ES' ? 'es-ES' : 'es-MX')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-white/10">
        {stats.map((s) => (
          <div key={s.key} className="rounded-2xl bg-black/30 border border-white/10 px-3 py-3">
            <div className="text-[9px] uppercase tracking-wider text-white/45 font-bold leading-tight">{s.label}</div>
            <div className="text-xl font-display font-bold text-white mt-1 tabular-nums">
              {profile.stats[s.key]}
            </div>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

type DraftCreate = {
  name: string;
  types: PokemonType[];
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
  ability: string;
  customAbilityEffect: string;
  moves: string[];
  customMoveEffects: string[];
  spriteDataUrl: string;
  spriteFromCatalog: string;
};

const emptyDraft = (): DraftCreate => ({
  name: '',
  types: ['Normal'],
  hp: 80,
  attack: 80,
  defense: 80,
  spAttack: 80,
  spDefense: 80,
  speed: 80,
  ability: '',
  customAbilityEffect: '',
  moves: ['', '', '', ''],
  customMoveEffects: ['', '', '', ''],
  spriteDataUrl: '',
  spriteFromCatalog: '',
});

export function CreatePokemonModal({
  locale,
  pokemonCatalog,
  movesCatalog,
  abilitiesCatalog,
  onSave,
  onClose,
}: {
  locale: LocaleId;
  pokemonCatalog: PokemonCatalogEntry[];
  movesCatalog: Move[];
  abilitiesCatalog: string[];
  onSave: (created: CreatedPokemon) => void;
  onClose: () => void;
}) {
  const msg = t(locale);
  const [draft, setDraft] = useState<DraftCreate>(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const catalogSprite = useMemo(() => {
    if (!draft.spriteFromCatalog) return undefined;
    return pokemonCatalog.find((p) => p.name === draft.spriteFromCatalog)?.spriteUrl ?? undefined;
  }, [draft.spriteFromCatalog, pokemonCatalog]);

  const previewSrc = draft.spriteDataUrl || catalogSprite;

  const onFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDraft((d) => ({ ...d, spriteDataUrl: String(reader.result || ''), spriteFromCatalog: '' }));
    };
    reader.readAsDataURL(file);
  };

  const setStat = (key: keyof DraftCreate, value: number) => {
    setDraft((d) => ({ ...d, [key]: Math.max(1, Math.min(255, value || 1)) }));
  };

  const handleSave = () => {
    if (!draft.name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    const created: CreatedPokemon = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: draft.name.trim(),
      types: draft.types.slice(0, 2),
      hp: draft.hp,
      attack: draft.attack,
      defense: draft.defense,
      spAttack: draft.spAttack,
      spDefense: draft.spDefense,
      speed: draft.speed,
      ability: draft.ability || 'Personalizada',
      customAbilityEffect: draft.customAbilityEffect || undefined,
      moves: draft.moves
        .map((name, i) => ({ name: name.trim(), customEffect: draft.customMoveEffects[i] || undefined }))
        .filter((m) => m.name),
      spriteDataUrl: draft.spriteDataUrl || catalogSprite || '',
      spriteFromCatalog: draft.spriteFromCatalog || undefined,
      createdAt: new Date().toISOString(),
    };
    onSave(created);
    onClose();
  };

  return (
    <ModalShell
      titleId="create-title"
      title={msg.createTitle}
      hint="Diseña un fakemon y guárdalo en tu Pokédex Original."
      icon={<Wand2 className="w-4 h-4 text-amber-300" />}
      onClose={onClose}
      wide
    >
      <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4">
        <div className="space-y-2">
          <div className="w-full aspect-square rounded-2xl border border-white/15 bg-black/40 flex items-center justify-center overflow-hidden">
            {previewSrc ? (
              <img src={previewSrc} alt="" className="w-full h-full object-contain p-2" />
            ) : (
              <ImageIcon className="w-10 h-10 text-white/25" />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-[10px] font-bold uppercase tracking-wider"
          >
            <Upload className="w-3.5 h-3.5" /> PNG / GIF / JPG
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          <select
            value={draft.spriteFromCatalog}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                spriteFromCatalog: e.target.value,
                spriteDataUrl: e.target.value ? '' : d.spriteDataUrl,
              }))
            }
            className="w-full p-2 text-[11px] font-semibold"
          >
            <option value="">Sprite del catálogo…</option>
            {pokemonCatalog.slice(0, 400).map((p) => (
              <option key={p.pokedexNumber} value={p.name}>
                #{p.pokedexNumber} {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[9px] uppercase tracking-wider text-white/55 font-bold">Nombre</label>
              <input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                className="w-full p-2.5 text-sm font-semibold"
                placeholder="Mi Fakemon"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-white/55 font-bold">Tipo 1</label>
              <select
                value={draft.types[0]}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, types: [e.target.value as PokemonType, d.types[1]].filter(Boolean) as PokemonType[] }))
                }
                className="w-full p-2 text-xs font-semibold"
              >
                {TYPES_LIST.map((ty) => (
                  <option key={ty} value={ty}>{ty}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-white/55 font-bold">Tipo 2</label>
              <select
                value={draft.types[1] ?? ''}
                onChange={(e) => {
                  const t2 = e.target.value as PokemonType | '';
                  setDraft((d) => ({
                    ...d,
                    types: t2 ? [d.types[0], t2] : [d.types[0]],
                  }));
                }}
                className="w-full p-2 text-xs font-semibold"
              >
                <option value="">—</option>
                {TYPES_LIST.map((ty) => (
                  <option key={ty} value={ty}>{ty}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-1.5">
            {([
              ['hp', 'HP'],
              ['attack', 'Atk'],
              ['defense', 'Def'],
              ['spAttack', 'SpA'],
              ['spDefense', 'SpD'],
              ['speed', 'Spe'],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <div className="text-[8px] text-white/45 uppercase text-center font-bold mb-1">{label}</div>
                <input
                  type="number"
                  value={draft[key]}
                  onChange={(e) => setStat(key, Number(e.target.value))}
                  className="w-full p-1.5 text-center text-xs font-bold"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-white/55 font-bold">Habilidad</label>
              <select
                value={abilitiesCatalog.includes(draft.ability) ? draft.ability : ''}
                onChange={(e) => setDraft((d) => ({ ...d, ability: e.target.value }))}
                className="w-full p-2 text-xs font-semibold"
              >
                <option value="">Personalizada / catálogo…</option>
                {abilitiesCatalog.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <input
                value={draft.ability}
                onChange={(e) => setDraft((d) => ({ ...d, ability: e.target.value }))}
                placeholder="Nombre habilidad"
                className="w-full p-2 text-xs font-semibold mt-1"
              />
              <input
                value={draft.customAbilityEffect}
                onChange={(e) => setDraft((d) => ({ ...d, customAbilityEffect: e.target.value }))}
                placeholder="Efecto personalizado (opcional)"
                className="w-full p-2 text-xs mt-1"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-white/55 font-bold">Movimientos</label>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex gap-1 mb-1">
                  <input
                    list={`moves-datalist-${i}`}
                    value={draft.moves[i]}
                    onChange={(e) => {
                      const moves = [...draft.moves];
                      moves[i] = e.target.value;
                      setDraft((d) => ({ ...d, moves }));
                    }}
                    placeholder={`Movimiento ${i + 1}`}
                    className="flex-1 p-1.5 text-[11px] font-semibold min-w-0"
                  />
                  <datalist id={`moves-datalist-${i}`}>
                    {movesCatalog.map((m) => (
                      <option key={m.name} value={m.name} />
                    ))}
                  </datalist>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-xs text-rose-200 bg-rose-500/15 border border-rose-400/30 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose} className="px-4 py-2.5 btn-ghost text-xs font-bold uppercase tracking-wider">
          {msg.cancel}
        </button>
        <button type="button" onClick={handleSave} className="flex-1 py-2.5 btn-accent text-xs font-bold uppercase tracking-wider">
          {msg.savePokemon}
        </button>
      </div>
    </ModalShell>
  );
}

type DetailTarget =
  | { kind: 'national'; entry: PokemonCatalogEntry; seen: boolean }
  | { kind: 'original'; entry: CreatedPokemon };

export function PokedexModal({
  locale,
  pokemonCatalog,
  movesCatalog,
  abilitiesCatalog,
  seenSpecies,
  created,
  onClose,
}: {
  locale: LocaleId;
  pokemonCatalog: PokemonCatalogEntry[];
  movesCatalog: Move[];
  abilitiesCatalog: string[];
  seenSpecies: string[];
  created: CreatedPokemon[];
  onClose: () => void;
}) {
  const msg = t(locale);
  const [tab, setTab] = useState<'national' | 'originals'>('national');
  const [query, setQuery] = useState('');
  const [detail, setDetail] = useState<DetailTarget | null>(null);

  const seenSet = useMemo(
    () => new Set(seenSpecies.map((n) => n.toLowerCase())),
    [seenSpecies]
  );

  const filteredNational = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pokemonCatalog.filter((p) => !q || p.name.toLowerCase().includes(q));
  }, [pokemonCatalog, query]);

  const filteredOriginals = useMemo(() => {
    const q = query.trim().toLowerCase();
    return created.filter((p) => !q || p.name.toLowerCase().includes(q));
  }, [created, query]);

  return (
    <ModalShell
      titleId="pokedex-title"
      title={msg.pokedexTitle}
      hint="Nacional con siluetas · Originales creados por ti"
      icon={<BookOpen className="w-4 h-4 text-rose-300" />}
      onClose={onClose}
      wide
    >
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setTab('national'); setDetail(null); }}
          className={`flex-1 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all ${
            tab === 'national' ? 'bg-rose-500/25 border-rose-400/40 text-white' : 'bg-black/25 border-white/10 text-white/60'
          }`}
        >
          {msg.national}
        </button>
        <button
          type="button"
          onClick={() => { setTab('originals'); setDetail(null); }}
          className={`flex-1 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all ${
            tab === 'originals' ? 'bg-amber-500/25 border-amber-400/40 text-white' : 'bg-black/25 border-white/10 text-white/60'
          }`}
        >
          {msg.originals}
        </button>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar…"
        className="w-full p-2.5 text-sm"
      />

      {detail ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setDetail(null)}
            className="text-[11px] font-bold uppercase tracking-wider text-white/55 hover:text-white"
          >
            ← Volver al listado
          </button>
          {detail.kind === 'national' ? (
            <NationalDetail entry={detail.entry} seen={detail.seen} movesCatalog={movesCatalog} abilitiesCatalog={abilitiesCatalog} />
          ) : (
            <OriginalDetail entry={detail.entry} />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[48vh] overflow-y-auto pr-1">
          {tab === 'national'
            ? filteredNational.map((p) => {
                const seen = seenSet.has(p.name.toLowerCase());
                return (
                  <button
                    key={p.pokedexNumber}
                    type="button"
                    onClick={() => setDetail({ kind: 'national', entry: p, seen })}
                    className="rounded-xl border border-white/10 bg-black/30 p-2 hover:bg-white/10 transition-colors text-center"
                  >
                    <div className="aspect-square flex items-center justify-center mb-1">
                      {p.spriteUrl ? (
                        <img
                          src={p.spriteUrl}
                          alt=""
                          className={`w-14 h-14 object-contain ${seen ? '' : 'brightness-0 opacity-80'}`}
                        />
                      ) : (
                        <span className="text-white/20 text-xs">?</span>
                      )}
                    </div>
                    <div className="text-[9px] font-mono text-white/40">#{String(p.pokedexNumber).padStart(3, '0')}</div>
                    <div className={`text-[10px] font-bold truncate ${seen ? 'text-white' : 'text-white/35'}`}>
                      {seen ? p.name : '????'}
                    </div>
                  </button>
                );
              })
            : filteredOriginals.length === 0
              ? (
                <div className="col-span-full text-center text-xs text-white/40 py-10 italic">
                  Aún no has creado Pokémon. Usa el botón Crear.
                </div>
              )
              : filteredOriginals.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setDetail({ kind: 'original', entry: p })}
                  className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-2 hover:bg-amber-500/20 transition-colors text-center"
                >
                  <div className="aspect-square flex items-center justify-center mb-1">
                    {p.spriteDataUrl ? (
                      <img src={p.spriteDataUrl} alt="" className="w-14 h-14 object-contain" />
                    ) : (
                      <Wand2 className="w-8 h-8 text-amber-300/50" />
                    )}
                  </div>
                  <div className="text-[10px] font-bold text-white truncate">{p.name}</div>
                  <div className="text-[9px] text-white/45 truncate">{p.types.join(' / ')}</div>
                </button>
              ))}
        </div>
      )}
    </ModalShell>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-8 font-bold uppercase text-white/45">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400"
          style={{ width: `${Math.min(100, (value / 255) * 100)}%` }}
        />
      </div>
      <span className="w-8 text-right font-mono text-white/80">{value}</span>
    </div>
  );
}

function NationalDetail({
  entry,
  seen,
  movesCatalog,
}: {
  entry: PokemonCatalogEntry;
  seen: boolean;
  movesCatalog: Move[];
  abilitiesCatalog: string[];
}) {
  const sampleMoves = movesCatalog.slice(0, 8);
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-4">
      <div className="flex gap-4 items-center">
        <div className="w-24 h-24 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden">
          {entry.spriteUrl && (
            <img
              src={entry.spriteUrl}
              alt=""
              className={`w-20 h-20 object-contain ${seen ? '' : 'brightness-0 opacity-80'}`}
            />
          )}
        </div>
        <div>
          <div className="text-[10px] font-mono text-white/40">#{String(entry.pokedexNumber).padStart(3, '0')}</div>
          <h3 className="text-xl font-display font-bold text-white">{seen ? entry.name : '????'}</h3>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {entry.types.map((ty) => (
              <span key={ty} className="px-2 py-0.5 rounded-lg bg-white/10 text-[10px] font-bold uppercase tracking-wider text-white/80">
                {ty}
              </span>
            ))}
          </div>
          {!seen && (
            <p className="text-[11px] text-white/45 mt-2 italic">Aún no registrado — importa o úsalo en combate.</p>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        <StatRow label="HP" value={entry.hp} />
        <StatRow label="Atk" value={entry.attack} />
        <StatRow label="Def" value={entry.defense} />
        <StatRow label="SpA" value={entry.spAttack} />
        <StatRow label="SpD" value={entry.spDefense} />
        <StatRow label="Spe" value={entry.speed} />
      </div>
      {seen && sampleMoves.length > 0 && (
        <div>
          <div className="text-[9px] uppercase tracking-wider text-white/45 font-bold mb-1.5">Movimientos de muestra</div>
          <div className="flex flex-wrap gap-1.5">
            {sampleMoves.map((m) => (
              <span key={m.name} className="px-2 py-1 rounded-lg bg-white/10 text-[10px] text-white/75">
                {m.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OriginalDetail({ entry }: { entry: CreatedPokemon }) {
  return (
    <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 space-y-4">
      <div className="flex gap-4 items-center">
        <div className="w-24 h-24 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden">
          {entry.spriteDataUrl ? (
            <img src={entry.spriteDataUrl} alt="" className="w-20 h-20 object-contain" />
          ) : (
            <Wand2 className="w-10 h-10 text-amber-300/50" />
          )}
        </div>
        <div>
          <div className="text-[10px] font-mono text-amber-300/80">Original</div>
          <h3 className="text-xl font-display font-bold text-white">{entry.name}</h3>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {entry.types.map((ty) => (
              <span key={ty} className="px-2 py-0.5 rounded-lg bg-white/10 text-[10px] font-bold uppercase tracking-wider text-white/80">
                {ty}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-white/55 mt-2">
            Habilidad: <span className="text-white/85 font-semibold">{entry.ability}</span>
            {entry.customAbilityEffect ? ` — ${entry.customAbilityEffect}` : ''}
          </p>
        </div>
      </div>
      <div className="space-y-1.5">
        <StatRow label="HP" value={entry.hp} />
        <StatRow label="Atk" value={entry.attack} />
        <StatRow label="Def" value={entry.defense} />
        <StatRow label="SpA" value={entry.spAttack} />
        <StatRow label="SpD" value={entry.spDefense} />
        <StatRow label="Spe" value={entry.speed} />
      </div>
      {entry.moves.length > 0 && (
        <div>
          <div className="text-[9px] uppercase tracking-wider text-white/45 font-bold mb-1.5">Movimientos</div>
          <div className="flex flex-wrap gap-1.5">
            {entry.moves.map((m) => (
              <span key={m.name} className="px-2 py-1 rounded-lg bg-white/10 text-[10px] text-white/75">
                {m.name}{m.customEffect ? ` (${m.customEffect})` : ''}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
