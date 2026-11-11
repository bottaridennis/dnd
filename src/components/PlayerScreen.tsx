import { useEffect, useState } from 'react';
import { Expand, Hexagon, Shield, Skull, Swords, EyeOff } from 'lucide-react';
import { screenService, type HealthStatus, type ScreenState } from '../services/screenService';

const STATUS_STYLE: Record<HealthStatus, string> = {
  illeso: 'text-[#4cc27a] border-[#4cc27a]/50',
  ferito: 'text-yellow-400 border-yellow-400/50',
  grave: 'text-orange-400 border-orange-400/60',
  'a terra': 'text-[#ff5560] border-[#ff5560]/60',
};

/** Schermo per il tavolo (TV, tablet, telefono): ordine d'iniziativa in tempo reale, senza accesso. */
export default function PlayerScreen({ code }: { code: string }) {
  const [screen, setScreen] = useState<ScreenState | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Forge · Schermo del tavolo';
    return screenService.subscribe(code, s => { setScreen(s); setError(null); }, () => setError('Schermo non raggiungibile: controlla il codice o la connessione.'));
  }, [code]);

  // Lo schermo resta acceso finché la pagina è aperta (dove supportato)
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock?.request('screen').then(l => { lock = l; }).catch(() => undefined);
    return () => { lock?.release().catch(() => undefined); };
  }, []);

  const fullscreen = () => document.documentElement.requestFullscreen?.().catch(() => undefined);
  const current = screen?.entries.find(e => e.id === screen.currentId);

  return (
    <div className="min-h-screen bg-[#0b0b0e] text-white flex flex-col">
      <header className="flex items-center justify-between gap-4 px-5 md:px-10 py-4 border-b-4 border-[#c8102e] bg-black">
        <div className="flex items-center gap-3 min-w-0">
          <span className="brand-mark shrink-0"><Hexagon className="w-5 h-5" /></span>
          <div className="min-w-0">
            <div className="brand-title text-lg md:text-2xl truncate">{screen?.campaignName || 'Forge'}</div>
            <div className="text-[10px] md:text-xs uppercase tracking-[.25em] text-white/60">{screen?.encounterName || 'Schermo del tavolo'} · codice {code}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {screen?.active && <div className="text-right"><div className="text-[10px] uppercase tracking-widest text-white/60">Round</div><div className="font-display font-black text-4xl md:text-6xl leading-none">{screen.round}</div></div>}
          <button onClick={fullscreen} className="p-2 text-white/60 hover:text-white" aria-label="Schermo intero" title="Schermo intero"><Expand className="w-6 h-6" /></button>
        </div>
      </header>

      <main className="flex-1 px-5 md:px-10 py-6 md:py-10">
        {error ? <p className="text-center text-xl text-[#ff6b75] mt-20">{error}</p>
          : screen === undefined ? <p className="text-center text-white/60 mt-20 uppercase tracking-widest">Collegamento…</p>
            : !screen || !screen.entries.length ? (
              <div className="text-center mt-24 space-y-3">
                <Swords className="w-14 h-14 mx-auto text-white/30" />
                <p className="text-2xl md:text-4xl font-black uppercase">Nessun combattimento in corso</p>
                <p className="text-white/60">Lo schermo si aggiorna da solo quando il Master avvia un incontro.</p>
              </div>
            ) : (
              <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-6 md:gap-10 max-w-7xl mx-auto">
                <section className="hero-band border border-[#ef3340]/40 p-6 md:p-10 flex flex-col justify-center min-h-[30vh]" aria-live="polite">
                  <p className="eyebrow">{screen.active ? 'È il turno di' : 'In attesa del Master'}</p>
                  {screen.active ? (
                    screen.currentId === 'hidden' ? (
                      <div className="flex items-center gap-4 mt-2"><EyeOff className="w-12 h-12 text-white/50" /><span className="text-4xl md:text-6xl font-black uppercase">???</span></div>
                    ) : current ? (
                      <>
                        <div className="text-5xl md:text-7xl xl:text-8xl font-black uppercase leading-[.9] mt-2 break-words">{current.name}</div>
                        <div className="flex flex-wrap gap-2 mt-4">
                          {current.status && <span className={`px-3 py-1 border text-lg uppercase font-black font-serif ${STATUS_STYLE[current.status]}`}>{current.hp ? `PF ${current.hp}` : current.status}</span>}
                          {current.conditions.map(c => <span key={c} className="px-3 py-1 bg-white/10 text-lg uppercase font-bold">{c}</span>)}
                        </div>
                      </>
                    ) : null
                  ) : <div className="text-4xl md:text-6xl font-black uppercase mt-2">Tirate l’iniziativa</div>}
                </section>

                <section aria-label="Ordine d’iniziativa">
                  <ol className="space-y-2">
                    {screen.entries.map(e => {
                      const isTurn = screen.active && e.id === screen.currentId;
                      return (
                        <li key={e.id} className={`flex items-center gap-4 px-4 py-3 md:py-4 border-l-8 ${isTurn ? 'border-[#ef3340] bg-[#ef3340]/15' : 'border-transparent bg-white/[.04]'} ${e.defeated ? 'opacity-40' : ''}`}>
                          <span className="w-12 md:w-16 text-center font-display font-black text-3xl md:text-4xl text-white/80 shrink-0">{e.initiative ?? '—'}</span>
                          {e.kind === 'pc' ? <Shield className="w-6 h-6 text-[#ff6b75] shrink-0" /> : <Skull className="w-6 h-6 text-white/50 shrink-0" />}
                          <div className="min-w-0 flex-1">
                            <div className={`text-xl md:text-3xl font-black uppercase truncate ${e.defeated ? 'line-through' : ''}`}>{e.name}</div>
                            {e.conditions.length > 0 && <div className="text-sm md:text-base text-white/70 truncate">{e.conditions.join(' · ')}</div>}
                          </div>
                          {e.status && <span className={`px-2 py-0.5 border text-xs md:text-base uppercase font-black font-serif shrink-0 ${STATUS_STYLE[e.status]}`}>{e.hp ?? e.status}</span>}
                        </li>
                      );
                    })}
                  </ol>
                </section>
              </div>
            )}
      </main>
      <footer className="px-5 md:px-10 py-3 text-[11px] text-white/40 uppercase tracking-widest">Forge · i PF delle creature sono indicati come illeso / ferito / grave / a terra</footer>
    </div>
  );
}
