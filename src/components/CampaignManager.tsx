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

export default function CampaignManager({ onOpenEncounters }: { onOpenEncounters?: (campaignId: string) => void } = {}) {
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

  if (selected) return <CampaignDetail campaign={selected} onBack={() => setSelectedId(null)} onOpenEncounters={onOpenEncounters} />;

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

function CampaignDetail({ campaign, onBack, onOpenEncounters }: { campaign: Campaign; onBack: () => void; onOpenEncounters?: (campaignId: string) => void }) {
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

        <CombatStatus campaign={campaign} onOpen={() => onOpenEncounters?.(campaign.id)} />
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

/** Stato del combattimento e scorciatoia verso la pagina Incontri. */
function CombatStatus({ campaign, onOpen }: { campaign: Campaign; onOpen: () => void }) {
  const state = campaign.initiative;
  const current = state?.active ? state.entries[state.turn] : undefined;
  const encounters = campaign.encounters || [];
  return (
    <aside className="sheet-section self-start lg:sticky lg:top-24">
      <div className="sheet-section-title"><Swords className="w-4 h-4" /> Incontri e turni</div>
      <div className="p-4 space-y-3 text-sm">
        {state?.active ? (
          <div className="border border-accent bg-accent/10 px-3 py-2">
            <div className="text-[10px] uppercase tracking-widest font-bold text-accent">{state.encounterName || 'Combattimento'} · round {state.round}</div>
            <div className="font-bold">Turno di {current?.name ?? '—'}</div>
            <div className="text-xs text-text-muted">{state.entries.filter(e => !e.defeated).length} combattenti attivi</div>
          </div>
        ) : state?.entries?.length ? (
          <p className="text-text-muted">Combattimento in preparazione ({state.entries.length} combattenti).</p>
        ) : (
          <p className="text-text-muted">Nessun combattimento in corso.</p>
        )}
        <p className="text-xs text-text-muted">{encounters.length} incontr{encounters.length === 1 ? 'o' : 'i'} preparat{encounters.length === 1 ? 'o' : 'i'}.</p>
        <button onClick={onOpen} className="primary-action w-full py-2.5 flex items-center justify-center gap-2"><Swords className="w-4 h-4" /> {state?.entries?.length ? 'Apri il tracker' : 'Prepara un incontro'}</button>
      </div>
    </aside>
  );
}
