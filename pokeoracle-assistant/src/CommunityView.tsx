import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  MessageCircle,
  PenSquare,
  Swords,
  Users,
  Heart,
  Share2,
  Sparkles,
  X,
} from 'lucide-react';
import type { LocaleId } from './i18n';
import { t } from './i18n';
import type { PokemonCatalogEntry } from './types';
import type { CreatedPokemon } from './userStorage';
import { PokemonSprite } from './PokemonSprite';

type PublishPick =
  | { kind: 'national'; entry: PokemonCatalogEntry }
  | { kind: 'original'; entry: CreatedPokemon };

export function CommunityView({
  locale,
  pokemonCatalog,
  created,
  spriteFor,
  onBack,
}: {
  locale: LocaleId;
  pokemonCatalog: PokemonCatalogEntry[];
  created: CreatedPokemon[];
  spriteFor: (name?: string) => string | undefined;
  onBack: () => void;
}) {
  const ui = t(locale);
  const [publishOpen, setPublishOpen] = useState(false);
  const [picked, setPicked] = useState<PublishPick | null>(null);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const nationals = pokemonCatalog
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .slice(0, 80)
      .map((entry) => ({ kind: 'national' as const, entry }));
    const originals = created
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .map((entry) => ({ kind: 'original' as const, entry }));
    return [...originals, ...nationals];
  }, [pokemonCatalog, created, query]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  return (
    <div className="relative z-10 flex-1 flex flex-col min-h-0 overflow-hidden animate-rise">
      {/* Encabezado Comunidad */}
      <div
        className="flex items-center justify-between gap-3 px-4 md:px-6 py-3 border-b border-white/10 shrink-0"
        style={{ background: 'var(--color-header)' }}
      >
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold uppercase tracking-wider text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {ui.backToSimulator}
        </button>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-sky-300" />
          <span className="font-display font-bold text-white tracking-wide">{ui.community}</span>
        </div>
        <div className="w-[120px] hidden sm:block" aria-hidden />
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Columna principal */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          {/* Barra de acciones */}
          <div className="flex flex-wrap items-center gap-2 px-4 md:px-6 py-3 border-b border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => {
                setPicked(null);
                setQuery('');
                setPublishOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold tracking-wide transition-colors shadow-lg shadow-sky-500/25"
            >
              <PenSquare className="w-4 h-4" />
              {ui.publish}
            </button>
            <button
              type="button"
              onClick={() => showToast(ui.randomBattleSoon)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-rose-400/40 bg-gradient-to-r from-rose-500/30 to-orange-500/20 hover:from-rose-500/45 hover:to-orange-500/30 text-white text-xs font-bold tracking-wide transition-all"
            >
              <Swords className="w-4 h-4" />
              {ui.randomBattle}
            </button>
          </div>

          {/* Banner PRÓXIMAMENTE */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 md:py-12">
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-200 text-[10px] font-mono uppercase tracking-[0.2em]">
                  <Sparkles className="w-3.5 h-3.5" />
                  PokeOracle Social
                </div>
                <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-white leading-none">
                  {ui.comingSoon}
                </h1>
                <p className="text-white/50 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
                  {ui.communityIntro}
                </p>
              </div>

              <div className="glass-panel-strong p-5 md:p-7 space-y-5">
                <p className="text-sm text-white/70 leading-relaxed">{ui.communityRoadmapLead}</p>
                <ul className="space-y-4">
                  {[
                    { icon: <Share2 className="w-4 h-4 text-sky-300" />, title: ui.roadmapFeedTitle, body: ui.roadmapFeedBody },
                    { icon: <MessageCircle className="w-4 h-4 text-emerald-300" />, title: ui.roadmapFriendsTitle, body: ui.roadmapFriendsBody },
                    { icon: <Swords className="w-4 h-4 text-rose-300" />, title: ui.roadmapBattlesTitle, body: ui.roadmapBattlesBody },
                  ].map((item) => (
                    <li
                      key={item.title}
                      className="flex gap-3.5 p-3.5 rounded-2xl bg-black/25 border border-white/10"
                    >
                      <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white">{item.title}</div>
                        <p className="text-[12px] text-white/55 mt-1 leading-relaxed">{item.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-white/40">
                  <Heart className="w-3.5 h-3.5" />
                  {ui.communityTeaserFoot}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Mensajes (derecha en desktop, abajo en mobile) */}
        <aside className="w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col min-h-[200px] lg:min-h-0 bg-black/20">
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-white/60" />
            <h2 className="text-sm font-bold text-white">{ui.directMessages}</h2>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white/25" />
            </div>
            <p className="text-sm font-semibold text-white/70">{ui.noMessages}</p>
            <p className="text-[11px] text-white/40 max-w-[220px] leading-relaxed">{ui.noMessagesHint}</p>
          </div>
        </aside>
      </div>

      {/* Modal Publicar (simulado) */}
      {publishOpen && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="publish-title"
          onClick={() => setPublishOpen(false)}
        >
          <div className="modal-panel space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="publish-title" className="text-lg font-display font-bold text-white">
                  {ui.publishTitle}
                </h2>
                <p className="text-[11px] text-white/50 mt-0.5">{ui.publishHint}</p>
              </div>
              <button
                type="button"
                onClick={() => setPublishOpen(false)}
                className="text-white/50 hover:text-white p-1.5 rounded-lg hover:bg-white/10"
                aria-label={ui.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={ui.publishSearch}
              className="w-full p-2.5 text-sm"
            />

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[40vh] overflow-y-auto pr-1">
              {filtered.map((item) => {
                const name = item.kind === 'national' ? item.entry.name : item.entry.name;
                const src =
                  item.kind === 'national'
                    ? item.entry.spriteUrl ?? spriteFor(name)
                    : item.entry.spriteDataUrl || undefined;
                const selected =
                  picked?.kind === item.kind &&
                  (item.kind === 'national'
                    ? picked.kind === 'national' && picked.entry.pokedexNumber === item.entry.pokedexNumber
                    : picked.kind === 'original' && picked.entry.id === item.entry.id);
                return (
                  <button
                    key={item.kind === 'national' ? `n-${item.entry.pokedexNumber}` : `o-${item.entry.id}`}
                    type="button"
                    onClick={() => setPicked(item)}
                    className={`rounded-xl border p-2 text-center transition-colors ${
                      selected
                        ? 'border-sky-400/50 bg-sky-500/20'
                        : 'border-white/10 bg-black/30 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex justify-center mb-1">
                      {item.kind === 'original' && src ? (
                        <img src={src} alt="" className="w-10 h-10 object-contain" />
                      ) : (
                        <PokemonSprite name={name} src={src} size="md" />
                      )}
                    </div>
                    <div className="text-[10px] font-bold text-white truncate">{name}</div>
                    {item.kind === 'original' && (
                      <div className="text-[8px] uppercase tracking-wider text-amber-300/80">Original</div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setPublishOpen(false)}
                className="px-4 py-2.5 btn-ghost text-xs font-bold uppercase tracking-wider"
              >
                {ui.cancel}
              </button>
              <button
                type="button"
                disabled={!picked}
                onClick={() => {
                  setPublishOpen(false);
                  showToast(ui.publishSimulated);
                }}
                className="flex-1 py-2.5 btn-accent text-xs font-bold uppercase tracking-wider disabled:opacity-40"
              >
                {ui.publish}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-full bg-white/15 border border-white/20 backdrop-blur-md text-xs font-semibold text-white shadow-xl animate-rise">
          {toast}
        </div>
      )}
    </div>
  );
}
