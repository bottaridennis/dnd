import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Swords, Plus, Trash2, Copy, Play, ChevronRight, ChevronLeft, Dices, Skull, Shield, Heart, Users, Crown, ScrollText,
  Search, Flag, X, RotateCcw, Pencil, Sparkles, Clock, Trophy, ShieldPlus, Undo2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { CharacterData } from '../contexts/CharacterContext';
import { campaignService, EMPTY_INITIATIVE, type Campaign, type Encounter, type EncounterMonster, type InitiativeEntry, type InitiativeState } from '../services/campaignService';
import { computeCharacterStats, getTotalLevel, type CharacterStats } from '../lib/characterRules';
import {
  CR_OPTIONS, DIFFICULTY_LABEL, MONSTER_PRESETS, TRACKER_CONDITIONS, XP_BY_CR, encounterXp, partyBudget, rateEncounter, type Difficulty,
} from '../data/encounters';
import {
  addCondition, buildEncounterState, combatSummary, damageEntry, healEntry, insertEntries, nextTurn, previousTurn, removeCondition,
  removeEntry, resort, rollMissingInitiative, startCombat, updateEntry, withLog,
} from '../lib/combat';
import { rollDie } from '../lib/random';
import { Section, Tag, EmptyState, OptionCard } from './ui';

const PC_CONDITION_LABELS: Record<string, string> = {
  accecato: 'Accecato', affascinato: 'Affascinato', assordato: 'Assordato', spaventato: 'Spaventato', afferrato: 'Afferrato',
  incapacitato: 'Incapacitato', invisibile: 'Invisibile', paralizzato: 'Paralizzato', pietrificato: 'Pietrificato', avvelenato: 'Avvelenato',
  prono: 'Prono', immobilizzato: 'Immobilizzato', stordito: 'Stordito', privo_di_sensi: 'Privo di Sensi',
};

const DIFFICULTY_TONE: Record<Difficulty, string> = {
  trivial: 'text-text-muted', low: 'text-success', moderate: 'text-yellow-500', high: 'text-orange-500', deadly: 'text-danger',
};

const inputClass = 'bg-panel-bg border border-border rounded-[var(--radius-sm)] px-2 py-1.5 outline-none focus:border-accent';
const newId = () => crypto.randomUUID();

export default function EncounterPage({ initialCampaignId }: { initialCampaignId?: string | null }) {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(initialCampaignId || null);
  const [party, setParty] = useState<CharacterData[]>([]);
  const [tab, setTab] = useState<'prepare' | 'combat'>('prepare');

  useEffect(() => {
    if (!user) return;
    return campaignService.subscribeMyCampaigns(user.uid, list => {
      setCampaigns(list);
      setLoading(false);
      setCampaignId(cur => cur && list.some(c => c.id === cur) ? cur : list[0]?.id ?? null);
    }, () => { setLoading(false); setError('Impossibile leggere le campagne: verifica le regole di sicurezza Firestore.'); });
  }, [user]);

  const campaign = campaigns.find(c => c.id === campaignId) || null;

  useEffect(() => {
    if (!campaign) { setParty([]); return; }
    return campaignService.subscribeParty(campaign, setParty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign?.id, campaign?.dmId]);

  // Se c'è un combattimento in corso, si apre direttamente il tracker
  const combatActive = Boolean(campaign?.initiative?.entries?.length);
  useEffect(() => { if (combatActive) setTab('combat'); }, [campaignId]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => Object.fromEntries(party.map(c => [c.id, computeCharacterStats(c)])) as Record<string, CharacterStats>, [party]);
  const levels = party.map(c => getTotalLevel(c));
  const budget = partyBudget(levels);

  return (
    <div>
      <section className="hero-band">
        <div className={`max-w-7xl mx-auto px-5 md:px-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6 ${tab === 'combat' ? 'py-5' : 'py-10'}`}>
          <div>
            <p className="eyebrow mb-3">Strumenti del Master</p>
            <h1 className={`font-black uppercase leading-[.9] ${tab === 'combat' ? 'text-4xl' : 'text-5xl md:text-7xl'}`}>Incontri</h1>
            {tab !== 'combat' && <p className="mt-3 text-white/70 max-w-xl">Prepara gli scontri, valuta la difficoltà per il tuo gruppo e gestisci turni, danni e condizioni durante la sessione.</p>}
          </div>
          {campaigns.length > 0 && (
            <div className="bg-black/30 border border-white/15 p-3 min-w-[260px]">
              <label className="block text-[10px] uppercase tracking-widest text-white/60 font-bold mb-1" htmlFor="enc-campaign">Campagna</label>
              <select id="enc-campaign" value={campaignId || ''} onChange={e => setCampaignId(e.target.value)} className="w-full bg-black/40 border border-white/20 px-2 py-2 text-white font-bold">
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="text-xs text-white/70 mt-2 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {party.length ? party.map(c => `${c.name} (${getTotalLevel(c)})`).join(' · ') : 'Nessun personaggio collegato'}</div>
            </div>
          )}
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-5 md:px-10 py-6">
        {error && <div className="mb-6 border border-danger/50 bg-danger/10 text-danger px-4 py-3 text-sm">{error}</div>}
        {loading ? <p className="eyebrow">Caricamento…</p> : !campaign ? (
          <EmptyState icon={Crown} title="Nessuna campagna">Crea una campagna nella sezione Campagne: gli incontri useranno i personaggi collegati.</EmptyState>
        ) : (
          <>
            <div className="flex border-b border-border mb-6" role="tablist">
              {([['prepare', 'Preparazione', ScrollText], ['combat', 'Combattimento', Swords]] as const).map(([id, label, Icon]) => (
                <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`relative flex items-center gap-2 px-4 py-3 text-sm font-black uppercase tracking-wider font-serif ${tab === id ? 'text-accent' : 'text-text-muted hover:text-text-primary'}`}>
                  <Icon className="w-4 h-4" /> {label}
                  {id === 'combat' && campaign.initiative?.active && <span className="w-2 h-2 rounded-full bg-accent animate-pulse" aria-label="in corso" />}
                  {tab === id && <span className="absolute inset-x-0 -bottom-px h-[3px] bg-accent" />}
                </button>
              ))}
            </div>
            {tab === 'prepare'
              ? <EncounterPrep campaign={campaign} party={party} stats={stats} budget={budget} onStarted={() => setTab('combat')} />
              : <CombatTracker campaign={campaign} party={party} stats={stats} onPrepare={() => setTab('prepare')} />}
          </>
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Preparazione                                                         */
/* ------------------------------------------------------------------ */

function DifficultyMeter({ xp, budget }: { xp: number; budget: { low: number; moderate: number; high: number } }) {
  const rating = rateEncounter(xp, budget);
  const max = Math.max(budget.high * 1.4, xp, 1);
  const pct = (v: number) => `${Math.min(100, (v / max) * 100)}%`;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase font-black tracking-wider font-serif text-text-muted">Difficoltà</span>
        <span className={`font-display font-black text-xl uppercase ${DIFFICULTY_TONE[rating]}`}>{DIFFICULTY_LABEL[rating]}</span>
      </div>
      <div className="relative h-3 bg-panel-bg border border-border mt-2 overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-success/30" style={{ width: pct(budget.low) }} />
        <div className="absolute inset-y-0 bg-yellow-500/25" style={{ left: pct(budget.low), width: `calc(${pct(budget.moderate)} - ${pct(budget.low)})` }} />
        <div className="absolute inset-y-0 bg-orange-500/25" style={{ left: pct(budget.moderate), width: `calc(${pct(budget.high)} - ${pct(budget.moderate)})` }} />
        <div className="absolute inset-y-0 bg-danger/25" style={{ left: pct(budget.high), right: 0 }} />
        <div className="absolute inset-y-0 w-[3px] bg-text-primary" style={{ left: pct(xp) }} />
      </div>
      <div className="flex justify-between text-[11px] text-text-muted mt-1">
        <span>{xp} PE</span>
        <span>Bassa {budget.low} · Moderata {budget.moderate} · Alta {budget.high}</span>
      </div>
    </div>
  );
}

function EncounterPrep({ campaign, party, stats, budget, onStarted }: {
  campaign: Campaign; party: CharacterData[]; stats: Record<string, CharacterStats>; budget: { low: number; moderate: number; high: number }; onStarted: () => void;
}) {
  const encounters = campaign.encounters || [];
  const [editing, setEditing] = useState<Encounter | null>(null);

  const saveEncounters = (list: Encounter[]) => campaignService.updateCampaign(campaign.id, { encounters: list }).catch(console.error);
  const saveDraft = (draft: Encounter) => {
    const exists = encounters.some(e => e.id === draft.id);
    saveEncounters(exists ? encounters.map(e => (e.id === draft.id ? draft : e)) : [...encounters, draft]);
    setEditing(null);
  };
  const remove = (enc: Encounter) => { if (window.confirm(`Eliminare l’incontro “${enc.name}”?`)) saveEncounters(encounters.filter(e => e.id !== enc.id)); };
  const duplicate = (enc: Encounter) => saveEncounters([...encounters, { ...enc, id: newId(), name: `${enc.name} (copia)`, createdAt: Date.now(), monsters: enc.monsters.map(m => ({ ...m, id: newId() })) }]);

  const start = async (enc: Encounter) => {
    if (campaign.initiative?.entries?.length && !window.confirm('C’è già un combattimento in corso: sostituirlo con questo incontro?')) return;
    const state = buildEncounterState(enc, party.map(c => ({ id: c.id, name: c.name, initiativeBonus: stats[c.id]?.initiative ?? 0 })));
    await campaignService.updateCampaign(campaign.id, { initiative: state });
    onStarted();
  };

  if (editing) return <EncounterEditor initial={editing} budget={budget} partySize={party.length} onCancel={() => setEditing(null)} onSave={saveDraft} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-muted">{party.length ? `Budget del gruppo (${party.length} personaggi): Bassa ${budget.low} · Moderata ${budget.moderate} · Alta ${budget.high} PE` : 'Collega i personaggi alla campagna per calcolare la difficoltà.'}</p>
        <button onClick={() => setEditing({ id: newId(), name: '', description: '', monsters: [], createdAt: Date.now() })} className="primary-action px-4 py-2.5 flex items-center gap-2"><Plus className="w-4 h-4" /> Nuovo incontro</button>
      </div>
      {encounters.length === 0 ? (
        <EmptyState icon={ScrollText} title="Nessun incontro preparato">Crea un incontro per averlo pronto in sessione: lo avvii con un clic e l’iniziativa delle creature viene tirata in automatico.</EmptyState>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {encounters.map(enc => {
            const xp = encounterXp(enc.monsters);
            const rating = rateEncounter(xp, budget);
            const count = enc.monsters.reduce((a, m) => a + m.count, 0);
            return (
              <article key={enc.id} className="surface-card p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-xl uppercase truncate">{enc.name || 'Senza nome'}</h3>
                    {enc.description && <p className="text-sm text-text-muted line-clamp-2">{enc.description}</p>}
                  </div>
                  <span className={`text-xs font-black uppercase font-serif ${DIFFICULTY_TONE[rating]}`}>{DIFFICULTY_LABEL[rating]}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {enc.monsters.map(m => <Tag key={m.id}>{m.count}× {m.name} · GS {m.cr}</Tag>)}
                </div>
                <div className="text-xs text-text-muted">{count} creature · {xp} PE totali</div>
                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-border">
                  <button onClick={() => start(enc)} disabled={!enc.monsters.length} className="primary-action px-3 py-2 flex items-center gap-1.5 disabled:opacity-40"><Play className="w-4 h-4" /> Avvia</button>
                  <button onClick={() => setEditing(enc)} className="secondary-action !px-2.5" aria-label="Modifica" title="Modifica"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => duplicate(enc)} className="secondary-action !px-2.5" aria-label="Duplica" title="Duplica"><Copy className="w-4 h-4" /></button>
                  <button onClick={() => remove(enc)} className="ml-auto p-2 text-text-muted hover:text-danger" aria-label="Elimina"><Trash2 className="w-4 h-4" /></button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EncounterEditor({ initial, budget, partySize, onCancel, onSave }: {
  initial: Encounter; budget: { low: number; moderate: number; high: number }; partySize: number; onCancel: () => void; onSave: (e: Encounter) => void;
}) {
  const [draft, setDraft] = useState<Encounter>(initial);
  const [search, setSearch] = useState('');
  const xp = encounterXp(draft.monsters);
  const presets = MONSTER_PRESETS.filter(p => !search.trim() || p.name.toLowerCase().includes(search.trim().toLowerCase()) || p.type.toLowerCase().includes(search.trim().toLowerCase()));

  const setMonster = (id: string, patch: Partial<EncounterMonster>) => setDraft(d => ({ ...d, monsters: d.monsters.map(m => (m.id === id ? { ...m, ...patch } : m)) }));
  const addMonster = (m: Omit<EncounterMonster, 'id' | 'count'>) => setDraft(d => {
    const same = d.monsters.find(x => x.name === m.name && x.cr === m.cr && x.hp === m.hp);
    if (same) return { ...d, monsters: d.monsters.map(x => (x.id === same.id ? { ...x, count: x.count + 1 } : x)) };
    return { ...d, monsters: [...d.monsters, { ...m, id: newId(), count: 1 }] };
  });

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
      <div className="space-y-4">
        <Section title={initial.name ? `Modifica · ${initial.name}` : 'Nuovo incontro'} icon={Pencil} bodyClassName="p-4 space-y-3">
          <input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="Nome dell’incontro (es. Imboscata sulla strada)" className={`${inputClass} w-full text-lg font-bold`} aria-label="Nome dell’incontro" />
          <textarea value={draft.description || ''} onChange={e => setDraft({ ...draft, description: e.target.value })} rows={2} placeholder="Ambientazione, tattiche, tesoro…" className={`${inputClass} w-full resize-y`} aria-label="Descrizione" />
        </Section>

        <Section title={`Creature (${draft.monsters.reduce((a, m) => a + m.count, 0)})`} icon={Skull} bodyClassName="">
          {draft.monsters.length === 0 ? <div className="p-4"><EmptyState title="Nessuna creatura">Aggiungile dall’elenco a destra o crea una creatura personalizzata.</EmptyState></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[620px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-text-muted font-serif text-left">
                    <th className="px-3 py-2">Nome</th><th className="px-2">GS</th><th className="px-2">N°</th><th className="px-2">PF</th><th className="px-2">CA</th><th className="px-2">Iniz.</th><th className="px-2 text-right">PE</th><th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {draft.monsters.map(m => (
                    <tr key={m.id}>
                      <td className="px-3 py-2"><input value={m.name} onChange={e => setMonster(m.id, { name: e.target.value })} className={`${inputClass} w-full font-bold`} aria-label="Nome creatura" /></td>
                      <td className="px-2"><select value={m.cr} onChange={e => setMonster(m.id, { cr: e.target.value })} className={inputClass} aria-label="Grado di sfida">{CR_OPTIONS.map(c => <option key={c}>{c}</option>)}</select></td>
                      <td className="px-2"><input type="number" min={1} max={30} value={m.count} onChange={e => setMonster(m.id, { count: Math.max(1, parseInt(e.target.value) || 1) })} className={`${inputClass} w-14 text-center`} aria-label="Quantità" /></td>
                      <td className="px-2"><input type="number" min={1} value={m.hp} onChange={e => setMonster(m.id, { hp: Math.max(1, parseInt(e.target.value) || 1) })} className={`${inputClass} w-16 text-center`} aria-label="PF" /></td>
                      <td className="px-2"><input type="number" min={1} value={m.ac} onChange={e => setMonster(m.id, { ac: Math.max(1, parseInt(e.target.value) || 1) })} className={`${inputClass} w-14 text-center`} aria-label="CA" /></td>
                      <td className="px-2"><input type="number" value={m.initiativeBonus} onChange={e => setMonster(m.id, { initiativeBonus: parseInt(e.target.value) || 0 })} className={`${inputClass} w-14 text-center`} aria-label="Bonus iniziativa" /></td>
                      <td className="px-2 text-right text-text-muted whitespace-nowrap">{(XP_BY_CR[m.cr] ?? 0) * m.count}</td>
                      <td className="px-2"><button onClick={() => setDraft(d => ({ ...d, monsters: d.monsters.filter(x => x.id !== m.id) }))} className="p-1.5 text-text-muted hover:text-danger" aria-label={`Rimuovi ${m.name}`}><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="p-3 border-t border-border">
            <button onClick={() => addMonster({ name: 'Creatura', cr: '1', hp: 10, ac: 12, initiativeBonus: 0 })} className="secondary-action flex items-center gap-1.5"><Plus className="w-4 h-4" /> Creatura personalizzata</button>
          </div>
        </Section>

        <div className="surface-card p-4"><DifficultyMeter xp={xp} budget={budget} />
          {partySize > 0 && <p className="text-xs text-text-muted mt-2">Se tutte le creature vengono sconfitte: {Math.floor(xp / partySize)} PE a testa.</p>}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="secondary-action">Annulla</button>
          <button onClick={() => onSave({ ...draft, name: draft.name.trim() || 'Incontro senza nome' })} className="primary-action px-5 py-2.5">Salva incontro</button>
        </div>
      </div>

      <Section title="Creature di base" icon={Sparkles} className="lg:sticky lg:top-24" bodyClassName="p-3 space-y-2">
        <label className="field-shell"><Search className="w-4 h-4 text-text-muted" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca per nome o tipo" className="w-full bg-transparent py-2 outline-none" aria-label="Cerca creature" /></label>
        <ul className="max-h-[55vh] overflow-y-auto space-y-1.5 pr-1">
          {presets.map(p => (
            <li key={p.name}>
              <button onClick={() => addMonster({ name: p.name, cr: p.cr, hp: p.hp, ac: p.ac, initiativeBonus: p.initiativeBonus })} className="w-full flex items-center justify-between gap-2 text-left bg-card-bg border border-border hover:border-accent px-3 py-2 rounded-[var(--radius-sm)] group">
                <span className="min-w-0"><span className="block font-bold truncate">{p.name}</span><span className="block text-[11px] text-text-muted">{p.type} · GS {p.cr} · PF {p.hp} · CA {p.ac}</span></span>
                <Plus className="w-4 h-4 text-text-muted group-hover:text-accent shrink-0" />
              </button>
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-text-muted">Statistiche di base (SRD 5.1), modificabili nella tabella.</p>
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Combattimento                                                        */
/* ------------------------------------------------------------------ */

function CombatTracker({ campaign, party, stats, onPrepare }: { campaign: Campaign; party: CharacterData[]; stats: Record<string, CharacterStats>; onPrepare: () => void }) {
  const state: InitiativeState = { ...EMPTY_INITIATIVE, ...(campaign.initiative || {}) };
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [conditionFor, setConditionFor] = useState<string | null>(null);
  const [quick, setQuick] = useState({ name: '', bonus: '0', hp: '', ac: '', cr: '1/4' });

  const save = (next: InitiativeState) => campaignService.updateCampaign(campaign.id, { initiative: next }).catch(console.error);

  // Scorciatoie: N / → turno successivo, P / ← precedente (se non si sta scrivendo)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (!state.active || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'n' || e.key === 'N' || e.key === 'ArrowRight') { e.preventDefault(); save(nextTurn(state)); }
      if (e.key === 'p' || e.key === 'P' || e.key === 'ArrowLeft') { e.preventDefault(); save(previousTurn(state)); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const pcOf = (e: InitiativeEntry) => (e.characterId ? party.find(c => c.id === e.characterId) : undefined);
  const current = state.active ? state.entries[state.turn] : undefined;

  const addParty = () => {
    const existing = new Set(state.entries.map(e => e.characterId).filter(Boolean));
    const added = party.filter(c => !existing.has(c.id)).map<InitiativeEntry>(c => ({ id: newId(), name: c.name, kind: 'pc', characterId: c.id, initiative: null, initiativeBonus: stats[c.id]?.initiative ?? 0 }));
    if (added.length) save(withLog(insertEntries(state, added), `Si unisce: ${added.map(a => a.name).join(', ')}`));
  };

  const addQuick = () => {
    const bonus = parseInt(quick.bonus, 10) || 0;
    const hp = parseInt(quick.hp, 10);
    const ac = parseInt(quick.ac, 10);
    const entry: InitiativeEntry = {
      id: newId(), kind: 'npc', name: quick.name.trim() || 'Creatura', initiative: rollDie(20) + bonus, initiativeBonus: bonus, cr: quick.cr,
      ...(Number.isFinite(hp) ? { hp, maxHp: hp } : {}), ...(Number.isFinite(ac) ? { ac } : {}),
    };
    save(withLog(insertEntries(state, [entry]), `Entra in combattimento: ${entry.name} (iniziativa ${entry.initiative})`));
    setQuick({ name: '', bonus: '0', hp: '', ac: '', cr: quick.cr });
  };

  const endCombat = () => {
    save(EMPTY_INITIATIVE);
    setSummaryOpen(false);
  };

  if (!state.entries.length) {
    return (
      <div className="space-y-4">
        <EmptyState icon={Swords} title="Nessun combattimento in corso">Avvia un incontro dalla preparazione, oppure aggiungi il gruppo e le creature qui.</EmptyState>
        <div className="flex flex-wrap justify-center gap-2">
          <button onClick={onPrepare} className="primary-action px-4 py-2.5 flex items-center gap-2"><ScrollText className="w-4 h-4" /> Vai alla preparazione</button>
          <button onClick={addParty} disabled={!party.length} className="secondary-action flex items-center gap-2 disabled:opacity-40"><Users className="w-4 h-4" /> Aggiungi il gruppo</button>
        </div>
      </div>
    );
  }

  const missing = state.entries.filter(e => e.initiative === null).length;
  const summary = combatSummary(state, party.length);

  return (
    <div className="space-y-5">
      {/* Barra di controllo */}
      <div className="surface-card p-3 flex flex-wrap items-center gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-text-muted font-bold font-serif">{state.encounterName || 'Combattimento'}</div>
          <div className="font-display font-black text-2xl uppercase leading-none">{state.active ? `Round ${state.round}` : 'In preparazione'}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          {missing > 0 && <button onClick={() => save(rollMissingInitiative(state))} className="secondary-action flex items-center gap-1.5"><Dices className="w-4 h-4" /> Tira iniziative ({missing})</button>}
          <button onClick={addParty} className="secondary-action flex items-center gap-1.5" title="Aggiungi i personaggi mancanti"><Users className="w-4 h-4" /> Gruppo</button>
          {!state.active ? (
            <button onClick={() => save(startCombat(missing ? rollMissingInitiative(state) : state))} className="primary-action px-5 py-2.5 flex items-center gap-2"><Play className="w-4 h-4" /> Inizia il combattimento</button>
          ) : (
            <>
              <button onClick={() => save(previousTurn(state))} className="secondary-action !px-3" aria-label="Turno precedente" title="Turno precedente (P)"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => save(nextTurn(state))} className="primary-action px-5 py-2.5 flex items-center gap-2" title="Turno successivo (N)">Turno successivo <ChevronRight className="w-4 h-4" /></button>
            </>
          )}
          <button onClick={() => setSummaryOpen(true)} className="secondary-action flex items-center gap-1.5"><Flag className="w-4 h-4" /> Termina</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5 items-start">
        <div className="space-y-4">
          {current && <CurrentTurnCard entry={current} pc={pcOf(current)} stats={current.characterId ? stats[current.characterId] : undefined} />}

          <Section title="Ordine d’iniziativa" icon={Swords} bodyClassName="" actions={<span className="text-[11px]">N / P per cambiare turno</span>}>
            <ol className="divide-y divide-border">
              {state.entries.map((e, idx) => (
                <CombatantRow
                  key={e.id}
                  entry={e}
                  isTurn={state.active && idx === state.turn}
                  pc={pcOf(e)}
                  pcStats={e.characterId ? stats[e.characterId] : undefined}
                  onInitiative={v => save(updateEntry(state, e.id, { initiative: v }))}
                  onInitiativeCommit={() => save(resort(state))}
                  onDamage={v => save(damageEntry(state, e.id, v))}
                  onHeal={v => save(healEntry(state, e.id, v))}
                  onTemp={v => save(withLog(updateEntry(state, e.id, { tempHp: Math.max(e.tempHp || 0, v) }), `${e.name} ottiene ${v} PF temporanei`))}
                  onToggleDefeated={() => save(withLog(updateEntry(state, e.id, { defeated: !e.defeated }), `${e.name} ${e.defeated ? 'torna in combattimento' : 'è sconfitto'}`))}
                  onRemove={() => save(removeEntry(state, e.id))}
                  onAddCondition={() => setConditionFor(e.id)}
                  onRemoveCondition={cid => save(removeCondition(state, e.id, cid))}
                />
              ))}
            </ol>
          </Section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <Section title="Aggiungi creatura" icon={Plus} bodyClassName="p-3 space-y-2">
            <input value={quick.name} onChange={e => setQuick({ ...quick, name: e.target.value })} onKeyDown={e => e.key === 'Enter' && addQuick()} placeholder="Nome (es. Rinforzi goblin)" className={`${inputClass} w-full`} aria-label="Nome creatura" />
            <div className="grid grid-cols-4 gap-1.5">
              <label className="text-[10px] uppercase font-bold text-text-muted">Iniz.<input value={quick.bonus} onChange={e => setQuick({ ...quick, bonus: e.target.value })} className={`${inputClass} w-full text-center`} /></label>
              <label className="text-[10px] uppercase font-bold text-text-muted">PF<input value={quick.hp} onChange={e => setQuick({ ...quick, hp: e.target.value })} className={`${inputClass} w-full text-center`} /></label>
              <label className="text-[10px] uppercase font-bold text-text-muted">CA<input value={quick.ac} onChange={e => setQuick({ ...quick, ac: e.target.value })} className={`${inputClass} w-full text-center`} /></label>
              <label className="text-[10px] uppercase font-bold text-text-muted">GS<select value={quick.cr} onChange={e => setQuick({ ...quick, cr: e.target.value })} className={`${inputClass} w-full`}>{CR_OPTIONS.map(c => <option key={c}>{c}</option>)}</select></label>
            </div>
            <button onClick={addQuick} className="primary-action w-full py-2 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Aggiungi (tira l’iniziativa)</button>
          </Section>

          <Section title="Registro" icon={Clock} bodyClassName="p-3">
            <ol className="space-y-1.5 max-h-[45vh] overflow-y-auto text-sm" aria-live="polite">
              {(state.log || []).length === 0 && <li className="text-text-muted">Nessun evento.</li>}
              {(state.log || []).map(l => (
                <li key={l.id} className="flex gap-2"><span className="text-[10px] font-bold text-text-muted font-serif shrink-0 w-8 pt-0.5">R{l.round}</span><span>{l.text}</span></li>
              ))}
            </ol>
          </Section>
        </aside>
      </div>

      <AnimatePresence>
        {conditionFor && (
          <ConditionPicker
            name={state.entries.find(e => e.id === conditionFor)?.name || ''}
            onClose={() => setConditionFor(null)}
            onPick={(name, rounds) => { save(addCondition(state, conditionFor, name, rounds)); setConditionFor(null); }}
          />
        )}
        {summaryOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm grid place-items-center p-4" onClick={() => setSummaryOpen(false)}>
            <motion.div initial={{ y: 12 }} animate={{ y: 0 }} role="dialog" aria-modal="true" aria-labelledby="summary-title" className="surface-card border-t-4 !border-t-accent max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between">
                <h3 id="summary-title" className="text-2xl uppercase flex items-center gap-2"><Trophy className="w-6 h-6 text-accent" /> Fine del combattimento</h3>
                <button onClick={() => setSummaryOpen(false)} aria-label="Chiudi" className="text-text-muted"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[['Round', summary.rounds], ['Sconfitti', summary.defeated.length], ['PE totali', summary.xp]].map(([k, v]) => (
                  <div key={k as string} className="stat-chip p-2"><div className="text-2xl font-display font-black">{v}</div><div className="text-[10px] uppercase tracking-wider text-text-muted">{k}</div></div>
                ))}
              </div>
              {party.length > 0 && <p className="text-sm">PE per personaggio: <strong className="text-accent">{summary.xpEach}</strong> ({party.length} personaggi)</p>}
              {summary.defeated.length > 0 && <div className="flex flex-wrap gap-1.5">{summary.defeated.map(e => <Tag key={e.id}>{e.name}{e.cr ? ` · GS ${e.cr}` : ''}</Tag>)}</div>}
              <p className="text-xs text-text-muted">Chiudendo, l’ordine d’iniziativa viene svuotato. L’incontro preparato resta disponibile.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setSummaryOpen(false)} className="secondary-action flex items-center gap-1.5"><Undo2 className="w-4 h-4" /> Continua</button>
                <button onClick={endCombat} className="primary-action px-5 py-2.5">Chiudi il combattimento</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function hpOf(entry: InitiativeEntry, pc?: CharacterData, pcStats?: CharacterStats) {
  if (pc && pcStats) return { hp: Math.min(pc.hpCurrent, pcStats.hpMax), max: pcStats.hpMax, temp: pc.hpTemp || 0 };
  if (entry.hp !== undefined) return { hp: entry.hp, max: entry.maxHp ?? entry.hp, temp: entry.tempHp || 0 };
  return null;
}

function HpBar({ hp, max }: { hp: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (hp / Math.max(1, max)) * 100));
  return <div className="h-1.5 bg-panel-bg overflow-hidden"><div className={`h-full transition-all ${pct > 50 ? 'bg-success' : pct > 25 ? 'bg-yellow-500' : 'bg-danger'}`} style={{ width: `${pct}%` }} /></div>;
}

function CurrentTurnCard({ entry, pc, stats }: { entry: InitiativeEntry; pc?: CharacterData; stats?: CharacterStats }) {
  const hp = hpOf(entry, pc, stats);
  return (
    <motion.section key={entry.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="hero-band rounded-[var(--radius-lg)] p-5 border border-[#ef3340]/40" aria-live="polite">
      <div className="flex items-center gap-4">
        <span className="w-14 h-14 grid place-items-center bg-black/40 border border-white/15 shrink-0">{entry.kind === 'pc' ? <Shield className="w-7 h-7 text-[#ff6b75]" /> : <Skull className="w-7 h-7 text-white/70" />}</span>
        <div className="min-w-0 flex-1">
          <div className="eyebrow">Turno di</div>
          <div className="text-3xl md:text-4xl font-black uppercase leading-none truncate">{entry.name}</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-white/80">
            {hp && <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {hp.hp}/{hp.max}{hp.temp ? ` (+${hp.temp})` : ''}</span>}
            {(stats?.acBase ?? entry.ac) !== undefined && <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> CA {stats?.acBase ?? entry.ac}</span>}
            {stats && <span>Percezione passiva {stats.passivePerception}</span>}
            {pc?.concentratingOn && <span className="flex items-center gap-1"><Sparkles className="w-4 h-4" /> {pc.concentratingOn}</span>}
          </div>
        </div>
      </div>
      {(entry.conditions?.length || pc?.conditions?.length || entry.note) ? (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {(pc?.conditions || []).map(c => <span key={c} className="text-[11px] uppercase font-bold px-2 py-0.5 bg-white/10">{PC_CONDITION_LABELS[c] || c}</span>)}
          {(entry.conditions || []).map(c => <span key={c.id} className="text-[11px] uppercase font-bold px-2 py-0.5 bg-white/10">{c.name}{c.rounds ? ` · ${c.rounds}r` : ''}</span>)}
          {entry.note && <span className="text-xs text-white/70 italic">{entry.note}</span>}
        </div>
      ) : null}
    </motion.section>
  );
}

const CombatantRow: React.FC<{
  entry: InitiativeEntry; isTurn: boolean; pc?: CharacterData; pcStats?: CharacterStats;
  onInitiative: (v: number | null) => void; onInitiativeCommit: () => void; onDamage: (v: number) => void; onHeal: (v: number) => void; onTemp: (v: number) => void;
  onToggleDefeated: () => void; onRemove: () => void; onAddCondition: () => void; onRemoveCondition: (id: string) => void;
}> = ({ entry, isTurn, pc, pcStats, onInitiative, onInitiativeCommit, onDamage, onHeal, onTemp, onToggleDefeated, onRemove, onAddCondition, onRemoveCondition }) => {
  const [amount, setAmount] = useState('');
  const hp = hpOf(entry, pc, pcStats);
  const value = Math.max(0, parseInt(amount, 10) || 0);
  const isNpc = entry.kind === 'npc' && entry.hp !== undefined;
  return (
    <li className={`px-3 py-3 flex flex-col md:flex-row md:items-center gap-3 border-l-4 ${isTurn ? 'border-accent bg-accent/10' : 'border-transparent'} ${entry.defeated ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <input
          value={entry.initiative ?? ''}
          onChange={e => onInitiative(e.target.value === '' ? null : parseInt(e.target.value, 10) || 0)}
          onBlur={onInitiativeCommit}
          placeholder="—"
          className="w-12 text-center font-display font-black text-xl bg-panel-bg border border-border py-1 shrink-0"
          aria-label={`Iniziativa di ${entry.name}`}
        />
        <div className="min-w-0 flex-1">
          <div className={`font-bold truncate flex items-center gap-1.5 ${entry.defeated ? 'line-through' : ''}`}>
            {entry.kind === 'pc' ? <Shield className="w-4 h-4 text-accent shrink-0" /> : <Skull className="w-4 h-4 text-text-muted shrink-0" />}
            {entry.name}
            {entry.cr && <span className="text-[10px] text-text-muted font-normal">GS {entry.cr}</span>}
          </div>
          <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
            {hp ? <span className={hp.hp === 0 ? 'text-danger font-bold' : ''}>PF {hp.hp}/{hp.max}{hp.temp ? ` +${hp.temp}` : ''}</span> : <span>PF —</span>}
            {(pcStats?.acBase ?? entry.ac) !== undefined && <span>CA {pcStats?.acBase ?? entry.ac}</span>}
            {pc && <span className="italic">scheda del giocatore</span>}
          </div>
          {hp && <div className="mt-1 max-w-48"><HpBar hp={hp.hp} max={hp.max} /></div>}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {(pc?.conditions || []).map(c => <Tag key={c} tone="danger">{PC_CONDITION_LABELS[c] || c}</Tag>)}
            {(entry.conditions || []).map(c => (
              <button key={c.id} onClick={() => onRemoveCondition(c.id)} title="Rimuovi condizione" className="inline-flex items-center gap-1 px-2 py-0.5 border border-accent/50 text-accent bg-accent/10 text-[10px] font-bold uppercase font-serif rounded-[var(--radius-sm)] hover:border-danger hover:text-danger">
                {c.name}{c.rounds ? ` · ${c.rounds}r` : ''} <X className="w-3 h-3" />
              </button>
            ))}
            <button onClick={onAddCondition} className="inline-flex items-center gap-1 px-2 py-0.5 border border-dashed border-border text-text-muted text-[10px] font-bold uppercase font-serif rounded-[var(--radius-sm)] hover:border-accent hover:text-accent"><Plus className="w-3 h-3" /> Condizione</button>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 md:shrink-0">
        {isNpc && (
          <>
            <input value={amount} onChange={e => setAmount(e.target.value)} type="number" min={0} placeholder="PF" className="w-16 bg-panel-bg border border-border text-center py-1.5" aria-label={`Quantità per ${entry.name}`} />
            <button onClick={() => { onDamage(value); setAmount(''); }} disabled={!value} className="px-2 py-1.5 text-[11px] font-black uppercase font-serif border border-border hover:border-danger hover:text-danger disabled:opacity-30">Danno</button>
            <button onClick={() => { onHeal(value); setAmount(''); }} disabled={!value} className="px-2 py-1.5 text-[11px] font-black uppercase font-serif border border-border hover:border-success hover:text-success disabled:opacity-30">Cura</button>
            <button onClick={() => { onTemp(value); setAmount(''); }} disabled={!value} className="p-1.5 border border-border hover:border-accent hover:text-accent disabled:opacity-30" title="PF temporanei" aria-label="PF temporanei"><ShieldPlus className="w-4 h-4" /></button>
          </>
        )}
        <button onClick={onToggleDefeated} className={`p-1.5 border ${entry.defeated ? 'border-accent text-accent' : 'border-border text-text-muted hover:text-text-primary'}`} title={entry.defeated ? 'Riporta in combattimento' : 'Segna come sconfitto'} aria-label={entry.defeated ? 'Riporta in combattimento' : 'Segna come sconfitto'}>{entry.defeated ? <RotateCcw className="w-4 h-4" /> : <Skull className="w-4 h-4" />}</button>
        <button onClick={onRemove} className="p-1.5 text-text-muted hover:text-danger" aria-label={`Rimuovi ${entry.name}`}><Trash2 className="w-4 h-4" /></button>
      </div>
    </li>
  );
};

function ConditionPicker({ name, onClose, onPick }: { name: string; onClose: () => void; onPick: (name: string, rounds: number | null) => void }) {
  const [rounds, setRounds] = useState('');
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <motion.div initial={{ y: 12 }} animate={{ y: 0 }} role="dialog" aria-modal="true" aria-labelledby="cond-title" className="surface-card max-w-lg w-full p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h3 id="cond-title" className="text-xl uppercase">Condizione · {name}</h3>
          <button onClick={onClose} aria-label="Chiudi" className="text-text-muted"><X className="w-5 h-5" /></button>
        </div>
        <label className="flex items-center gap-3 text-sm">
          Durata in round
          <input type="number" min={1} value={rounds} onChange={e => setRounds(e.target.value)} placeholder="∞" className="w-20 bg-panel-bg border border-border text-center py-1.5" />
          <span className="text-xs text-text-muted">vuoto = finché non la rimuovi; scade alla fine del turno della creatura</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TRACKER_CONDITIONS.map(c => (
            <OptionCard key={c} title={c} className="!p-2.5 [&>div]:!text-sm" onClick={() => onPick(c, rounds ? Math.max(1, parseInt(rounds, 10) || 1) : null)} />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
