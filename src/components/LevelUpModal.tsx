import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, Lock, Heart, Check, ChevronLeft } from 'lucide-react';
import { Ability, CharacterData } from '../contexts/CharacterContext';
import { classesData } from '../data/rules2024';
import { FEATURES } from '../data/features';
import { CLASS_FEATURES, isAsiLevel, isEpicBoonLevel } from '../data/classFeatures';
import {
  ABILITIES, ABILITY_NAMES, canMulticlassInto, getClassLevels, getFinalScores, getHpGainForLevel, getModifiers, getTotalLevel,
} from '../lib/characterRules';
import { checkFeatPrerequisites } from '../lib/featEligibility';
import { getSpellPools } from '../lib/spellBudget';

export interface LevelUpChoice {
  classId: string;
  hpGain: number;
  abilityIncrease?: Partial<Record<Ability, number>>;
  feat?: string;
  /** il nuovo livello concede trucchetti o incantesimi da scegliere */
  spellGain?: boolean;
}

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onLevelUp: (choice: LevelUpChoice) => void;
}

export default function LevelUpModal({ isOpen, onClose, character, onLevelUp }: LevelUpModalProps) {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [mode, setMode] = useState<'asi' | 'feat'>('asi');
  const [asiPicks, setAsiPicks] = useState<Ability[]>([]);
  const [featName, setFeatName] = useState('');

  const classLevels = getClassLevels(character);
  const totalLevel = getTotalLevel(character);
  const scores = useMemo(() => getFinalScores(character), [character]);
  const mods = getModifiers(scores);

  if (!isOpen) return null;

  const reset = () => { setSelectedClass(null); setMode('asi'); setAsiPicks([]); setFeatName(''); };
  const close = () => { reset(); onClose(); };

  const nextClassLevel = selectedClass ? (classLevels[selectedClass]?.level || 0) + 1 : 0;
  const needsAsi = selectedClass ? isAsiLevel(selectedClass, nextClassLevel) : false;
  const epicBoon = selectedClass ? isEpicBoonLevel(selectedClass, nextClassLevel) : false;

  const featOptions = FEATURES.filter(f => {
    if (epicBoon) return f.prerequisite?.includes('Benedizione Epica') || f.prerequisite?.includes('Talento Generale');
    return !f.prerequisite?.includes('Benedizione Epica');
  }).map(f => ({ ...f, check: checkFeatPrerequisites(f.prerequisite, { ...character, level: totalLevel + 1 }) }))
    .filter(f => f.name !== 'Aumento dei Punteggi di Caratteristica')
    .sort((a, b) => Number(b.check.ok) - Number(a.check.ok) || a.name.localeCompare(b.name, 'it'));

  // ASI: +2 a una caratteristica (stessa scelta due volte) oppure +1 a due, senza superare 20
  const asiIncrease = asiPicks.reduce((acc, a) => ({ ...acc, [a]: (acc[a] || 0) + 1 }), {} as Partial<Record<Ability, number>>);
  const toggleAsi = (ability: Ability) => {
    const current = asiIncrease[ability] || 0;
    if (asiPicks.length < 2 && scores[ability] + current < 20) setAsiPicks([...asiPicks, ability]);
    else if (current > 0) {
      const idx = asiPicks.lastIndexOf(ability);
      setAsiPicks(asiPicks.filter((_, i) => i !== idx));
    }
  };

  // Incantesimi: confronto tra le riserve attuali e quelle dopo l'avanzamento (tabelle del PHB 2024)
  const spellSummary = (() => {
    if (!selectedClass) return null;
    const after: CharacterData = { ...character, level: totalLevel + 1, classes: { ...classLevels, [selectedClass]: { ...(classLevels[selectedClass] || {}), level: nextClassLevel } } };
    const sum = (pools: ReturnType<typeof getSpellPools>, kind: 'cantrip' | 'leveled') => pools.filter(p => p.kind === kind).reduce((a, p) => a + p.capacity, 0);
    const maxLevel = (pools: ReturnType<typeof getSpellPools>) => Math.max(0, ...pools.filter(p => p.kind === 'leveled' && !p.id.startsWith('mi-')).map(p => p.maxLevel));
    const before = getSpellPools(character);
    const next = getSpellPools(after);
    const cantrips = sum(next, 'cantrip') - sum(before, 'cantrip');
    const prepared = sum(next, 'leveled') - sum(before, 'leveled');
    const newLevel = maxLevel(next) > maxLevel(before) ? maxLevel(next) : 0;
    if (!cantrips && !prepared && !newLevel) return null;
    return { cantrips, prepared, newLevel, totalCantrips: sum(next, 'cantrip'), totalPrepared: sum(next, 'leveled') };
  })();

  const asiReady = !needsAsi || (mode === 'asi' ? asiPicks.length === 2 || ABILITIES.every(a => scores[a] + (asiIncrease[a] || 0) >= 20) : Boolean(featName));

  const confirm = () => {
    if (!selectedClass || !asiReady) return;
    onLevelUp({
      classId: selectedClass,
      hpGain: getHpGainForLevel(character, selectedClass, mods.CON),
      abilityIncrease: needsAsi && mode === 'asi' ? asiIncrease : undefined,
      feat: needsAsi && mode === 'feat' ? featName : undefined,
      spellGain: Boolean(spellSummary && (spellSummary.cantrips > 0 || spellSummary.prepared > 0 || spellSummary.newLevel)),
    });
    reset();
  };

  const renderClassButton = (classId: string, isNew: boolean) => {
    const def = classesData.find(c => c.id === classId);
    if (!def) return null;
    const check = isNew ? canMulticlassInto(character, scores, classId) : { ok: true as const, reason: undefined };
    const level = (classLevels[classId]?.level || 0) + 1;
    return (
      <button
        key={classId}
        disabled={!check.ok}
        onClick={() => setSelectedClass(classId)}
        className={`group bg-card-bg border rounded-lg ${isNew ? 'p-4' : 'p-6'} text-left flex items-start justify-between transition-all ${check.ok ? 'border-border hover:border-accent hover:bg-accent/5' : 'border-border/40 opacity-50 cursor-not-allowed'}`}
      >
        <div>
          <div className="font-serif font-black text-lg text-text-primary group-hover:text-accent transition-colors">{def.name}</div>
          <div className="text-[11px] font-mono text-text-muted uppercase mt-1 tracking-normal">Diventa livello {level} · d{def.hitDie}</div>
          {(CLASS_FEATURES[classId]?.[level] || []).length > 0 && (
            <div className="text-[10px] text-text-muted mt-2 leading-snug">{CLASS_FEATURES[classId][level].join(' · ')}</div>
          )}
          {!check.ok && <div className="text-[10px] text-danger mt-2 flex items-center gap-1"><Lock className="w-3 h-3" /> {check.reason}</div>}
        </div>
        {check.ok && <TrendingUp className="w-4 h-4 text-accent shrink-0" />}
      </button>
    );
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="bg-panel-bg border border-border rounded-xl shadow-2xl overflow-hidden max-w-2xl w-full flex flex-col"
          style={{ maxHeight: 'calc(100vh - 40px)' }}
        >
          <div className="flex items-center justify-between p-6 border-b border-border bg-card-bg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent"><TrendingUp className="w-5 h-5" /></div>
              <div>
                <h2 className="text-xl font-serif font-black text-text-primary">Livello {totalLevel + 1}</h2>
                <p className="text-sm text-text-muted">{selectedClass ? `Avanzamento come ${classesData.find(c => c.id === selectedClass)?.name}` : 'In quale classe vuoi avanzare?'}</p>
              </div>
            </div>
            <button onClick={close} className="p-2 hover:bg-bg rounded-lg text-text-muted hover:text-text-primary transition-colors" aria-label="Chiudi"><X className="w-5 h-5" /></button>
          </div>

          {totalLevel >= 20 ? (
            <div className="p-10 text-center text-text-muted">Il personaggio ha già raggiunto il livello massimo (20).</div>
          ) : !selectedClass ? (
            <div className="p-6 overflow-y-auto space-y-8">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase text-accent tracking-widest px-2">Classi attuali</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Object.keys(classLevels).map(id => renderClassButton(id, false))}</div>
              </div>
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase text-text-muted tracking-widest px-2">Nuova classe (multiclasse)</h3>
                <p className="text-[11px] text-text-muted px-2">PHB 2024: servono i requisiti di caratteristica (13+) sia delle classi attuali sia di quella nuova.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{classesData.filter(c => !classLevels[c.id]).map(c => renderClassButton(c.id, true))}</div>
              </div>
            </div>
          ) : (
            <div className="p-6 overflow-y-auto space-y-6">
              <button onClick={reset} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-accent"><ChevronLeft className="w-3 h-3" /> Cambia classe</button>

              <div className="flex items-center gap-4 p-4 bg-card-bg border border-border rounded-lg">
                <Heart className="w-6 h-6 text-success" />
                <div>
                  <div className="text-sm font-bold text-text-primary">+{getHpGainForLevel(character, selectedClass, mods.CON)} Punti Ferita massimi</div>
                  <div className="text-[10px] text-text-muted">Media del d{classesData.find(c => c.id === selectedClass)?.hitDie} arrotondata per eccesso + modificatore di Costituzione</div>
                </div>
              </div>

              {(CLASS_FEATURES[selectedClass]?.[nextClassLevel] || []).length > 0 && (
                <div className="p-4 bg-card-bg border border-border rounded-lg">
                  <div className="text-[10px] font-black uppercase tracking-widest text-accent mb-2">Nuovi privilegi</div>
                  <ul className="text-sm text-text-primary list-disc pl-5 space-y-1">{CLASS_FEATURES[selectedClass][nextClassLevel].map(f => <li key={f}>{f}</li>)}</ul>
                </div>
              )}

              {spellSummary && (
                <div className="p-4 bg-card-bg border border-border rounded-lg">
                  <div className="text-[10px] font-black uppercase tracking-widest text-accent mb-2">Incantesimi</div>
                  <ul className="text-sm text-text-primary list-disc pl-5 space-y-1">
                    {spellSummary.cantrips > 0 && <li>+{spellSummary.cantrips} trucchett{spellSummary.cantrips === 1 ? 'o' : 'i'} (totale {spellSummary.totalCantrips})</li>}
                    {spellSummary.prepared > 0 && <li>+{spellSummary.prepared} incantesim{spellSummary.prepared === 1 ? 'o preparato' : 'i preparati'} (totale {spellSummary.totalPrepared})</li>}
                    {spellSummary.newLevel > 0 && <li>Accesso agli incantesimi di {spellSummary.newLevel}° livello</li>}
                  </ul>
                  <p className="text-[10px] text-text-muted mt-2">Dopo la conferma si apre la scelta degli incantesimi, limitata alla tua lista e al tuo livello.</p>
                </div>
              )}

              {needsAsi && (
                <div className="space-y-4">
                  <div className="flex bg-bg rounded border border-border w-fit">
                    <button onClick={() => setMode('asi')} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest ${mode === 'asi' ? 'bg-accent text-bg' : 'text-text-muted'}`}>Aumento Caratteristiche</button>
                    <button onClick={() => setMode('feat')} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest ${mode === 'feat' ? 'bg-accent text-bg' : 'text-text-muted'}`}>{epicBoon ? 'Benedizione Epica' : 'Talento'}</button>
                  </div>
                  {mode === 'asi' ? (
                    <div>
                      <p className="text-xs text-text-muted mb-3">Aumenta una caratteristica di 2 (cliccala due volte) o due caratteristiche di 1. Massimo 20. ({asiPicks.length}/2)</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {ABILITIES.map(a => (
                          <button key={a} onClick={() => toggleAsi(a)} className={`p-3 rounded border text-left ${asiIncrease[a] ? 'border-accent bg-accent/10' : 'border-border bg-card-bg'} ${scores[a] >= 20 ? 'opacity-40' : ''}`}>
                            <div className="text-[10px] font-black uppercase tracking-widest text-text-muted">{ABILITY_NAMES[a]}</div>
                            <div className="text-lg font-black text-text-primary">{scores[a]}{asiIncrease[a] ? <span className="text-accent"> → {scores[a] + (asiIncrease[a] || 0)}</span> : null}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1">
                      {featOptions.map(f => {
                        const owned = character.feats?.includes(f.name) && !f.repeatable;
                        const disabled = !f.check.ok || owned;
                        return (
                          <button key={f.name} disabled={disabled} onClick={() => setFeatName(f.name)} className={`p-3 rounded border text-left ${featName === f.name ? 'border-accent bg-accent/10' : 'border-border bg-card-bg'} ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-accent'}`}>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-sm text-text-primary">{f.name}</span>
                              {featName === f.name && <Check className="w-4 h-4 text-accent" />}
                            </div>
                            <div className="text-[10px] text-text-muted">{owned ? 'Già posseduto' : f.check.ok ? f.prerequisite : f.check.reasons.join(' · ')}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <button onClick={confirm} disabled={!asiReady} className="w-full py-3 rounded bg-accent text-bg font-black uppercase text-xs tracking-widest disabled:opacity-30">
                Conferma livello {totalLevel + 1}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
