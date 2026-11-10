import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Copy, Check, Crown, Dices, Eye, Heart, Plus, Shield, Skull, Sparkles, Swords, Trash2, Users, ChevronRight, ChevronLeft, RotateCcw, Footprints, Brain,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { CharacterData } from '../contexts/CharacterContext';
import { campaignService, EMPTY_INITIATIVE, type Campaign, type InitiativeEntry, type InitiativeState } from '../services/campaignService';
import { computeCharacterStats, getClassLevels, type CharacterStats } from '../lib/characterRules';
import { classesData, speciesData } from '../data/rules2024';
import { rollDie } from '../lib/rests';
import { signed } from '../lib/dice';

const CONDITION_LABELS: Record<string, string> = {
  accecato: 'Accecato', affascinato: 'Affascinato', assordato: 'Assordato', spaventato: 'Spaventato', afferrato: 'Afferrato',
  incapacitato: 'Incapacitato', invisibile: 'Invisibile', paralizzato: 'Paralizzato', pietrificato: 'Pietrificato', avvelenato: 'Avvelenato',
  prono: 'Prono', immobilizzato: 'Immobilizzato', stordito: 'Stordito', privo_di_sensi: 'Privo di Sensi',
};

const classLine = (c: CharacterData) => Object.entries(getClassLevels(c)).map(([id, d]) => `${classesData.find(x => x.id === id)?.name || id} ${d.level}`).join(' / ');

export default function CampaignManager() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    return campaignService.subscribeMyCampaigns(user.uid, list => { setCampaigns(list); setLoading(false); }, () => {
      setLoading(false);
      setError('Impossibile leggere le campagne: verifica di aver pubblicato le nuove regole di sicurezza Firestore.');
    });
  }, [user]);

  const selected = campaigns.find(c => c.id === selectedId) || null;

  const create = async () => {
    try {
      const campaign = await campaignService.createCampaign(newName);
      setNewName('');
      setSelectedId(campaign.id);
    } catch (e) {
      console.error(e);
      setError('Creazione non riuscita: verifica le regole di sicurezza Firestore.');
    }
  };

  if (selected) return <CampaignDetail campaign={selected} onBack={() => setSelectedId(null)} />;

  return (
    <div>
      <section className="hero-band">
        <div className="max-w-7xl mx-auto px-5 md:px-10 py-12 md:py-16">
          <p className="eyebrow mb-3">Strumenti del Master</p>
          <h1 className="text-5xl md:text-7xl font-black uppercase leading-[.9]">Le tue campagne</h1>
          <p className="mt-4 max-w-2xl text-[#d4d4da]">Crea una campagna, condividi il codice d’invito con i giocatori e segui il gruppo in tempo reale: punti ferita, condizioni, difese e ordine d’iniziativa.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-xl">
            <label className="field-shell flex-1 !bg-white/10 !border-white/20 text-white">
              <Crown className="w-4 h-4 text-[#ff6b75]" />
              <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && create()} placeholder="Nome della campagna" className="w-full bg-transparent py-3 outline-none placeholder:text-white/50" aria-label="Nome della campagna" />
            </label>
            <button onClick={create} className="primary-action px-6 py-3 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Crea campagna</button>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-5 md:px-10 py-10">
        {error && <div className="mb-6 border border-danger/50 bg-danger/10 text-danger px-4 py-3 text-sm">{error}</div>}
        {loading ? <p className="eyebrow">Caricamento…</p> : campaigns.length === 0 ? (
          <div className="surface-card p-10 text-center">
            <Users className="w-10 h-10 mx-auto text-text-muted mb-4" />
            <h2 className="text-2xl uppercase">Nessuna campagna</h2>
            <p className="text-text-muted mt-2">Crea la prima campagna qui sopra. I giocatori useranno il codice d’invito dalla scheda del loro personaggio.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {campaigns.map(c => (
              <button key={c.id} onClick={() => setSelectedId(c.id)} className="surface-card text-left p-6 hover:border-accent transition-colors group">
                <div className="flex items-center justify-between">
                  <span className="eyebrow">Codice {c.id}</span>
                  <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-accent" />
                </div>
                <h2 className="text-2xl uppercase mt-3">{c.name}</h2>
                <p className="text-sm text-text-muted mt-1">{c.initiative?.active ? `Combattimento in corso · round ${c.initiative.round}` : 'Nessun combattimento attivo'}</p>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function CampaignDetail({ campaign, onBack }: { campaign: Campaign; onBack: () => void }) {
  const [party, setParty] = useState<CharacterData[]>([]);
  const [partyError, setPartyError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [notes, setNotes] = useState(campaign.notes || '');

  useEffect(() => campaignService.subscribeParty(campaign, setParty, () => setPartyError('Impossibile leggere le schede del gruppo: verifica le regole di sicurezza Firestore.')), [campaign.id, campaign.dmId]);

  const stats = useMemo(() => Object.fromEntries(party.map(c => [c.id, computeCharacterStats(c)])) as Record<string, CharacterStats>, [party]);

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(campaign.id); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* appunti non disponibili */ }
  };

  const remove = async () => {
    if (!window.confirm(`Eliminare la campagna "${campaign.name}"? Le schede dei giocatori non vengono toccate.`)) return;
    await campaignService.deleteCampaign(campaign.id);
    onBack();
  };

  return (
    <div>
      <section className="hero-band">
        <div className="max-w-7xl mx-auto px-5 md:px-10 py-10">
          <button onClick={onBack} className="flex items-center gap-1 text-xs uppercase font-bold tracking-widest text-white/70 hover:text-white"><ArrowLeft className="w-4 h-4" /> Tutte le campagne</button>
          <div className="mt-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="eyebrow mb-2">Campagna</p>
              <h1 className="text-4xl md:text-6xl font-black uppercase leading-none">{campaign.name}</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-black/40 border border-white/15 px-4 py-2">
                <div className="text-[10px] uppercase tracking-widest text-white/60">Codice d’invito</div>
                <div className="font-display font-black text-3xl tracking-[.2em]">{campaign.id}</div>
              </div>
              <button onClick={copyCode} className="secondary-action !bg-white/10 !border-white/20 !text-white flex items-center gap-2" aria-label="Copia il codice">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copiato' : 'Copia'}
              </button>
              <button onClick={remove} className="p-2.5 border border-white/20 text-white/70 hover:text-white hover:border-white" aria-label="Elimina campagna"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-5 md:px-10 py-8 grid lg:grid-cols-[1fr_420px] gap-6">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl uppercase flex items-center gap-2"><Users className="w-5 h-5 text-accent" /> Il gruppo <span className="text-text-muted">({party.length})</span></h2>
            <span className="text-xs text-text-muted">Aggiornamento in tempo reale</span>
          </div>
          {partyError && <div className="border border-danger/50 bg-danger/10 text-danger px-4 py-3 text-sm">{partyError}</div>}
          {party.length === 0 && !partyError && (
            <div className="surface-card p-8 text-center text-text-muted">
              Nessun personaggio collegato. I giocatori aprono la propria scheda e inseriscono il codice <strong className="text-text-primary">{campaign.id}</strong> nel riquadro “Campagna”.
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            {party.map(c => <PartyCard key={c.id} character={c} stats={stats[c.id]} />)}
          </div>

          <div className="sheet-section">
            <div className="sheet-section-title">Note del Master</div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={() => notes !== (campaign.notes || '') && campaignService.updateCampaign(campaign.id, { notes })}
              rows={5}
              placeholder="PNG, indizi, tesori, appunti di sessione… (visibili solo a te)"
              className="w-full bg-transparent p-4 outline-none resize-y"
            />
          </div>
        </section>

        <InitiativeTracker campaign={campaign} party={party} stats={stats} />
      </main>
    </div>
  );
}

const PartyCard: React.FC<{ character: CharacterData; stats: CharacterStats }> = ({ character, stats }) => {
  const hp = Math.min(character.hpCurrent ?? stats.hpMax, stats.hpMax);
  const pct = Math.max(0, Math.min(100, (hp / stats.hpMax) * 100));
  const species = speciesData.find(s => s.id === character.speciesId)?.name;
  const spell = stats.spellcasting[0];
  const conditions = (character.conditions || []).map(c => CONDITION_LABELS[c] || c);
  return (
    <article className="surface-card overflow-hidden">
      <div className="flex gap-4 p-4">
        <div className="w-16 h-16 shrink-0 bg-panel-bg border border-border overflow-hidden grid place-items-center">
          {character.portraitUrl ? <img src={character.portraitUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Shield className="w-7 h-7 text-text-muted" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xl uppercase truncate">{character.name}</h3>
          <p className="text-xs text-text-muted truncate">{species} · {classLine(character)}</p>
          <div className="mt-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-accent" /> {hp} / {stats.hpMax}{character.hpTemp ? ` (+${character.hpTemp})` : ''}</span>
              {hp === 0 && <span className="text-danger flex items-center gap-1"><Skull className="w-3 h-3" /> {character.deathSaves?.successes || 0}✓ {character.deathSaves?.failures || 0}✗</span>}
            </div>
            <div className="h-1.5 bg-panel-bg mt-1 overflow-hidden"><div className={`h-full ${pct > 50 ? 'bg-success' : pct > 25 ? 'bg-yellow-500' : 'bg-danger'}`} style={{ width: `${pct}%` }} /></div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 border-t border-border text-center">
        {[
          { icon: Shield, label: 'CA', value: stats.acBase },
          { icon: Eye, label: 'Perc. pass.', value: stats.passivePerception },
          { icon: Footprints, label: 'Velocità', value: `${stats.speed}m` },
          { icon: Brain, label: spell ? 'CD inc.' : 'Iniziativa', value: spell ? spell.saveDc : signed(stats.initiative) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="py-2 border-r last:border-r-0 border-border">
            <div className="text-lg font-display font-black leading-none">{value}</div>
            <div className="text-[9px] uppercase tracking-wider text-text-muted mt-1 flex items-center justify-center gap-1"><Icon className="w-3 h-3" />{label}</div>
          </div>
        ))}
      </div>
      {(conditions.length > 0 || character.exhaustion || character.concentratingOn) ? (
        <div className="flex flex-wrap gap-1.5 px-4 py-3 border-t border-border">
          {conditions.map(c => <span key={c} className="text-[10px] uppercase font-bold px-2 py-0.5 bg-danger/15 text-danger">{c}</span>)}
          {!!character.exhaustion && <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-danger/15 text-danger">Esaurimento {character.exhaustion}</span>}
          {character.concentratingOn && <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-accent/15 text-accent flex items-center gap-1"><Sparkles className="w-3 h-3" /> {character.concentratingOn}</span>}
        </div>
      ) : null}
    </article>
  );
};

function InitiativeTracker({ campaign, party, stats }: { campaign: Campaign; party: CharacterData[]; stats: Record<string, CharacterStats> }) {
  const state: InitiativeState = { ...EMPTY_INITIATIVE, ...(campaign.initiative || {}) };
  const [npc, setNpc] = useState({ name: '', bonus: '0', hp: '', ac: '', count: '1' });
  const [hpDelta, setHpDelta] = useState<Record<string, string>>({});

  const save = (next: Partial<InitiativeState>) => campaignService.updateCampaign(campaign.id, { initiative: { ...state, ...next } }).catch(console.error);
  const sorted = (entries: InitiativeEntry[]) => [...entries].sort((a, b) => (b.initiative ?? -99) - (a.initiative ?? -99) || (b.initiativeBonus ?? 0) - (a.initiativeBonus ?? 0) || a.name.localeCompare(b.name, 'it'));

  const addParty = () => {
    const existing = new Set(state.entries.filter(e => e.characterId).map(e => e.characterId));
    const added = party.filter(c => !existing.has(c.id)).map<InitiativeEntry>(c => ({
      id: crypto.randomUUID(), name: c.name, kind: 'pc', characterId: c.id, initiative: null, initiativeBonus: stats[c.id]?.initiative ?? 0,
    }));
    save({ entries: sorted([...state.entries, ...added]) });
  };

  const rollMissing = (onlyNpc = false) => {
    save({ entries: sorted(state.entries.map(e => (e.initiative === null && (!onlyNpc || e.kind === 'npc') ? { ...e, initiative: rollDie(20) + (e.initiativeBonus || 0) } : e))) });
  };

  const addNpc = () => {
    const count = Math.max(1, Math.min(20, parseInt(npc.count, 10) || 1));
    const bonus = parseInt(npc.bonus, 10) || 0;
    const hp = parseInt(npc.hp, 10);
    const ac = parseInt(npc.ac, 10);
    const base = npc.name.trim() || 'Creatura';
    const added = Array.from({ length: count }, (_, i) => ({
      id: crypto.randomUUID(), kind: 'npc' as const, name: count > 1 ? `${base} ${i + 1}` : base, initiative: rollDie(20) + bonus, initiativeBonus: bonus,
      ...(Number.isFinite(hp) ? { hp, maxHp: hp } : {}), ...(Number.isFinite(ac) ? { ac } : {}),
    }));
    save({ entries: sorted([...state.entries, ...added]) });
    setNpc({ name: '', bonus: '0', hp: '', ac: '', count: '1' });
  };

  const updateEntry = (id: string, patch: Partial<InitiativeEntry>) => save({ entries: state.entries.map(e => (e.id === id ? { ...e, ...patch } : e)) });
  const removeEntry = (id: string) => {
    const idx = state.entries.findIndex(e => e.id === id);
    const entries = state.entries.filter(e => e.id !== id);
    save({ entries, turn: Math.min(idx < state.turn ? state.turn - 1 : state.turn, Math.max(0, entries.length - 1)) });
  };

  const start = () => save({ active: true, round: 1, turn: 0, entries: sorted(state.entries) });
  const next = () => {
    if (!state.entries.length) return;
    const turn = state.turn + 1;
    save(turn >= state.entries.length ? { turn: 0, round: state.round + 1 } : { turn });
  };
  const prev = () => {
    if (!state.entries.length) return;
    if (state.turn > 0) save({ turn: state.turn - 1 });
    else if (state.round > 1) save({ turn: state.entries.length - 1, round: state.round - 1 });
  };
  const reset = () => { if (window.confirm('Terminare il combattimento e svuotare l’ordine d’iniziativa?')) save(EMPTY_INITIATIVE); };

  return (
    <aside className="sheet-section self-start lg:sticky lg:top-24">
      <div className="sheet-section-title">
        <span className="flex items-center gap-2"><Swords className="w-4 h-4 text-accent" /> Iniziativa</span>
        {state.active && <span className="ml-auto text-accent">Round {state.round}</span>}
      </div>

      <div className="p-4 space-y-3 border-b border-border">
        <div className="flex flex-wrap gap-2">
          <button onClick={addParty} className="secondary-action flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Aggiungi gruppo</button>
          <button onClick={() => rollMissing()} className="secondary-action flex items-center gap-1.5"><Dices className="w-3.5 h-3.5" /> Tira mancanti</button>
        </div>
        <div className="grid grid-cols-[1fr_56px_56px_56px_48px] gap-1.5 text-xs">
          <input value={npc.name} onChange={e => setNpc({ ...npc, name: e.target.value })} placeholder="Creatura (es. Goblin)" className="bg-panel-bg border border-border px-2 py-2" aria-label="Nome creatura" />
          <input value={npc.bonus} onChange={e => setNpc({ ...npc, bonus: e.target.value })} placeholder="Init" title="Bonus d'iniziativa" className="bg-panel-bg border border-border px-2 py-2 text-center" aria-label="Bonus iniziativa" />
          <input value={npc.hp} onChange={e => setNpc({ ...npc, hp: e.target.value })} placeholder="PF" className="bg-panel-bg border border-border px-2 py-2 text-center" aria-label="Punti ferita" />
          <input value={npc.ac} onChange={e => setNpc({ ...npc, ac: e.target.value })} placeholder="CA" className="bg-panel-bg border border-border px-2 py-2 text-center" aria-label="Classe armatura" />
          <input value={npc.count} onChange={e => setNpc({ ...npc, count: e.target.value })} placeholder="×" title="Quante creature" className="bg-panel-bg border border-border px-2 py-2 text-center" aria-label="Numero di creature" />
        </div>
        <button onClick={addNpc} className="w-full primary-action py-2 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Aggiungi creatura (tira l’iniziativa)</button>
      </div>

      <ol className="divide-y divide-border max-h-[55vh] overflow-y-auto">
        {state.entries.length === 0 && <li className="p-6 text-center text-sm text-text-muted">Aggiungi il gruppo e le creature per iniziare.</li>}
        {state.entries.map((e, idx) => {
          const isTurn = state.active && idx === state.turn;
          const pc = e.characterId ? party.find(c => c.id === e.characterId) : undefined;
          const pcStats = pc ? stats[pc.id] : undefined;
          const hp = pc ? Math.min(pc.hpCurrent, pcStats?.hpMax ?? pc.hpCurrent) : e.hp;
          const maxHp = pc ? pcStats?.hpMax : e.maxHp;
          const ac = pc ? pcStats?.acBase : e.ac;
          return (
            <li key={e.id} className={`flex items-center gap-2 px-3 py-2.5 ${isTurn ? 'bg-accent/10 border-l-4 border-accent' : 'border-l-4 border-transparent'}`}>
              <input
                value={e.initiative ?? ''}
                onChange={ev => updateEntry(e.id, { initiative: ev.target.value === '' ? null : parseInt(ev.target.value, 10) || 0 })}
                onBlur={() => save({ entries: sorted(state.entries) })}
                placeholder="—"
                className="w-11 text-center font-display font-black text-lg bg-panel-bg border border-border py-1"
                aria-label={`Iniziativa di ${e.name}`}
              />
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate flex items-center gap-1.5">{e.kind === 'pc' ? <Shield className="w-3.5 h-3.5 text-accent shrink-0" /> : <Skull className="w-3.5 h-3.5 text-text-muted shrink-0" />}{e.name}</div>
                <div className="text-[11px] text-text-muted">
                  {hp !== undefined && maxHp !== undefined ? <span className={hp === 0 ? 'text-danger font-bold' : ''}>PF {hp}/{maxHp}</span> : 'PF —'}
                  {ac !== undefined && <> · CA {ac}</>}
                  {pc?.conditions?.length ? <> · {pc.conditions.map(c => CONDITION_LABELS[c] || c).join(', ')}</> : null}
                </div>
              </div>
              {e.kind === 'npc' && e.hp !== undefined && (
                <div className="flex items-center gap-1">
                  <input value={hpDelta[e.id] ?? ''} onChange={ev => setHpDelta({ ...hpDelta, [e.id]: ev.target.value })} placeholder="±" className="w-10 text-center bg-panel-bg border border-border py-1 text-xs" aria-label={`Variazione PF di ${e.name}`} />
                  <button onClick={() => { const d = parseInt(hpDelta[e.id] || '0', 10) || 0; updateEntry(e.id, { hp: Math.max(0, Math.min(e.maxHp ?? 9999, (e.hp ?? 0) - d)) }); setHpDelta({ ...hpDelta, [e.id]: '' }); }} className="px-1.5 py-1 text-[10px] font-bold uppercase border border-border hover:border-danger hover:text-danger" title="Applica danno">Dan</button>
                  <button onClick={() => { const d = parseInt(hpDelta[e.id] || '0', 10) || 0; updateEntry(e.id, { hp: Math.max(0, Math.min(e.maxHp ?? 9999, (e.hp ?? 0) + d)) }); setHpDelta({ ...hpDelta, [e.id]: '' }); }} className="px-1.5 py-1 text-[10px] font-bold uppercase border border-border hover:border-success hover:text-success" title="Applica cura">Cur</button>
                </div>
              )}
              <button onClick={() => removeEntry(e.id)} className="p-1 text-text-muted hover:text-danger" aria-label={`Rimuovi ${e.name}`}><Trash2 className="w-4 h-4" /></button>
            </li>
          );
        })}
      </ol>

      <div className="p-4 border-t border-border flex items-center gap-2">
        {!state.active ? (
          <button onClick={start} disabled={!state.entries.length} className="flex-1 primary-action py-2.5 disabled:opacity-40">Inizia il combattimento</button>
        ) : (
          <>
            <button onClick={prev} className="secondary-action !px-3" aria-label="Turno precedente"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={next} className="flex-1 primary-action py-2.5 flex items-center justify-center gap-2">Turno successivo <ChevronRight className="w-4 h-4" /></button>
          </>
        )}
        <button onClick={reset} className="secondary-action !px-3" aria-label="Termina combattimento" title="Termina combattimento"><RotateCcw className="w-4 h-4" /></button>
      </div>
    </aside>
  );
}
