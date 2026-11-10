import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Heart, Shield, Footprints, Sparkles, Minus, Wand2, PawPrint } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useSummons } from '../hooks/useSummons';
import { useCharacter } from '../contexts/CharacterContext';
import { useCharacterMath } from '../hooks/useCharacterMath';
import { SUMMONS_DATA } from '../data/summons';
import { ActiveSummon } from '../types/summons';
import { getModifier } from '../lib/utils';
import { signed } from '../lib/dice';
import { OptionCard, Tag, EmptyState } from './ui';

interface SummonsManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_LABEL: Record<string, string> = { Basic: 'Famiglio', Pact: 'Famiglio del Patto', Scaling: 'Incantesimo di evocazione', Homebrew: 'Personalizzata' };

/** Evocazioni, famigli e compagni: pannello laterale con blocchi statistiche in stile bestiario. */
export default function SummonsManager({ isOpen, onClose }: SummonsManagerProps) {
  const { activeSummons, summonCreature, summonHomebrew, dismissSummon, updateSummonHp } = useSummons();
  const { currentCharacter } = useCharacter();
  const math = useCharacterMath(currentCharacter);
  const [adding, setAdding] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(SUMMONS_DATA[0].id);
  const [spellLevel, setSpellLevel] = useState(4);
  const [isHomebrewMode, setIsHomebrewMode] = useState(false);
  const [hbName, setHbName] = useState('');
  const [hbHp, setHbHp] = useState(1);
  const [hbAc, setHbAc] = useState(10);
  const [hbSpeed, setHbSpeed] = useState('9 m');

  if (!isOpen) return null;

  const selectedTemplate = SUMMONS_DATA.find(s => s.id === selectedTemplateId);
  const minLevel = selectedTemplate?.minLevel || 0;
  const effectiveLevel = Math.max(minLevel, spellLevel);
  const requiresLevel = selectedTemplate?.category === 'Scaling' && !isHomebrewMode;
  const spellAttack = Math.max(0, ...(math?.spellcasting || []).map(s => s.attackBonus)) || (math ? math.proficiencyBonus : 2);

  const handleSummon = async () => {
    if (isHomebrewMode) {
      if (!hbName.trim()) return;
      await summonHomebrew({ name: hbName.trim(), maxHp: hbHp, ac: hbAc, speed: hbSpeed });
    } else {
      await summonCreature(selectedTemplateId, effectiveLevel, { spellAttackModifier: spellAttack });
    }
    setAdding(false);
    setIsHomebrewMode(false);
    setHbName('');
  };

  const groups = (['Basic', 'Pact', 'Scaling'] as const).map(cat => ({ cat, items: SUMMONS_DATA.filter(s => s.category === cat) }));
  const inputClass = 'w-full bg-panel-bg border border-border rounded-[var(--radius-sm)] px-3 py-2 outline-none focus:border-accent';

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm" onClick={onClose}>
        <motion.aside
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-3xl bg-bg border-l-4 border-l-[#d4142f] flex flex-col shadow-2xl"
          onClick={e => e.stopPropagation()}
          role="dialog" aria-modal="true" aria-labelledby="summons-title"
        >
          <header className="hero-band px-6 py-5 flex items-center justify-between gap-4 shrink-0">
            <div>
              <p className="eyebrow mb-1">Famigli, compagni ed evocazioni</p>
              <h2 id="summons-title" className="text-3xl font-black uppercase leading-none">Evocazioni</h2>
            </div>
            <div className="flex items-center gap-2">
              {!adding && <button onClick={() => setAdding(true)} className="primary-action px-4 py-2.5 flex items-center gap-2"><Plus className="w-4 h-4" /> Evoca</button>}
              <button onClick={onClose} className="p-2.5 border border-white/20 text-white/80 hover:text-white" aria-label="Chiudi"><X className="w-5 h-5" /></button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {adding && (
              <section className="sheet-section">
                <div className="sheet-section-title"><Wand2 className="w-3.5 h-3.5" /> Nuova evocazione
                  <button onClick={() => setAdding(false)} className="ml-auto text-text-muted hover:text-text-primary" aria-label="Annulla"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex border-b border-border">
                    {[[false, 'Dal manuale'], [true, 'Personalizzata']].map(([hb, label]) => (
                      <button key={String(hb)} onClick={() => setIsHomebrewMode(hb as boolean)} className={`relative px-4 py-2 text-sm font-black uppercase font-serif ${isHomebrewMode === hb ? 'text-accent' : 'text-text-muted'}`}>
                        {label as string}{isHomebrewMode === hb && <span className="absolute inset-x-0 -bottom-px h-[3px] bg-accent" />}
                      </button>
                    ))}
                  </div>

                  {!isHomebrewMode ? (
                    <>
                      {groups.map(({ cat, items }) => (
                        <div key={cat}>
                          <div className="text-[11px] uppercase font-black tracking-wider text-text-muted font-serif mb-2">{CATEGORY_LABEL[cat]}</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {items.map(t => (
                              <OptionCard key={t.id} selected={selectedTemplateId === t.id} onClick={() => setSelectedTemplateId(t.id)} title={t.name} subtitle={t.type} className="!p-3"
                                meta={t.category === 'Scaling' ? <Tag tone="accent">Dal {t.minLevel}° livello</Tag> : <><Tag>CA {t.ac}</Tag><Tag>PF {t.hp}</Tag></>} />
                            ))}
                          </div>
                        </div>
                      ))}
                      {requiresLevel && (
                        <div>
                          <div className="text-[11px] uppercase font-black tracking-wider text-text-muted font-serif mb-2">Livello dello slot</div>
                          <div className="flex flex-wrap gap-1.5">
                            {[3, 4, 5, 6, 7, 8, 9].filter(l => l >= minLevel).map(l => (
                              <button key={l} onClick={() => setSpellLevel(l)} aria-pressed={effectiveLevel === l} className={`w-11 h-10 border font-display font-black rounded-[var(--radius-sm)] ${effectiveLevel === l ? 'bg-accent border-accent text-white' : 'border-border hover:border-accent'}`}>{l}°</button>
                            ))}
                          </div>
                          <p className="text-xs text-text-muted mt-2">CA, PF e danni crescono con il livello; il tiro per colpire usa il tuo bonus d’attacco con incantesimi ({signed(spellAttack)}).</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <label className="col-span-2 space-y-1"><span className="text-[11px] uppercase font-black text-text-muted font-serif">Nome</span><input value={hbName} onChange={e => setHbName(e.target.value)} placeholder="Es. Lupo spettrale" className={inputClass} /></label>
                      <label className="space-y-1"><span className="text-[11px] uppercase font-black text-text-muted font-serif">PF</span><input type="number" min={1} value={hbHp} onChange={e => setHbHp(Math.max(1, parseInt(e.target.value) || 1))} className={inputClass} /></label>
                      <label className="space-y-1"><span className="text-[11px] uppercase font-black text-text-muted font-serif">CA</span><input type="number" min={1} value={hbAc} onChange={e => setHbAc(Math.max(1, parseInt(e.target.value) || 1))} className={inputClass} /></label>
                      <label className="col-span-2 sm:col-span-4 space-y-1"><span className="text-[11px] uppercase font-black text-text-muted font-serif">Velocità</span><input value={hbSpeed} onChange={e => setHbSpeed(e.target.value)} placeholder="9 m, volare 18 m" className={inputClass} /></label>
                    </div>
                  )}

                  <button onClick={handleSummon} disabled={isHomebrewMode && !hbName.trim()} className="w-full primary-action py-3 flex items-center justify-center gap-2 disabled:opacity-40">
                    <Sparkles className="w-4 h-4" /> Evoca {isHomebrewMode ? hbName || 'creatura' : selectedTemplate?.name}{requiresLevel ? ` (${effectiveLevel}° livello)` : ''}
                  </button>
                </div>
              </section>
            )}

            {activeSummons.length === 0 && !adding ? (
              <EmptyState icon={PawPrint} title="Nessuna creatura evocata">Usa “Evoca” per aggiungere un famiglio, un compagno o lo spirito di un incantesimo.</EmptyState>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSummons.map(summon => (
                  <StatBlock key={summon.instanceId} summon={summon} onDismiss={() => dismissSummon(summon.instanceId)} onHpChange={hp => updateSummonHp(summon.instanceId, hp)} />
                ))}
              </div>
            )}
          </div>
        </motion.aside>
      </motion.div>
    </AnimatePresence>
  );
}

const StatBlock: React.FC<{ summon: ActiveSummon; onDismiss: () => void; onHpChange: (hp: number) => void }> = ({ summon, onDismiss, onHpChange }) => {
  const [amount, setAmount] = useState('');
  const Icon = (LucideIcons as any)[summon.iconName] || LucideIcons.Dog;
  const pct = Math.max(0, Math.min(100, (summon.currentHp / summon.maxHp) * 100));
  const value = Math.max(0, parseInt(amount, 10) || 0);
  const abilities: [string, number][] = [['FOR', summon.str], ['DES', summon.dex], ['COS', summon.con], ['INT', summon.int], ['SAG', summon.wis], ['CAR', summon.cha]];
  const rule = <div className="h-[3px] bg-gradient-to-r from-accent to-transparent my-2" />;

  return (
    <motion.article layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`surface-card p-4 ${summon.currentHp === 0 ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 grid place-items-center bg-accent/10 text-accent rounded-[var(--radius-sm)] shrink-0"><Icon className="w-5 h-5" /></span>
        <div className="min-w-0 flex-1">
          <h3 className="text-xl uppercase leading-tight text-accent truncate">{summon.name}</h3>
          <p className="text-xs italic text-text-muted flavor">{CATEGORY_LABEL[summon.category] || summon.category}{summon.category === 'Scaling' ? ` · ${summon.spellLevel}° livello` : ''}</p>
        </div>
        <button onClick={onDismiss} className="text-xs uppercase font-bold font-serif text-text-muted hover:text-danger" title="Congeda">Congeda</button>
      </div>
      {rule}
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-accent" /><strong>CA</strong> {summon.ac}</div>
        <div className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-accent" /><strong>PF</strong> {summon.currentHp}/{summon.maxHp}</div>
        <div className="flex items-center gap-1.5 truncate"><Footprints className="w-4 h-4 text-accent shrink-0" /><span className="truncate">{summon.speed}</span></div>
      </div>
      <div className="h-1.5 bg-panel-bg mt-2 overflow-hidden"><div className={`h-full ${pct > 50 ? 'bg-success' : pct > 25 ? 'bg-yellow-500' : 'bg-danger'}`} style={{ width: `${pct}%` }} /></div>
      <div className="flex gap-1.5 mt-2">
        <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Quantità" type="number" min={0} className="flex-1 min-w-0 bg-panel-bg border border-border px-2 py-1 text-sm" aria-label={`PF da modificare per ${summon.name}`} />
        <button onClick={() => { onHpChange(summon.currentHp - value); setAmount(''); }} disabled={!value} className="px-2 border border-border hover:border-danger hover:text-danger disabled:opacity-30 flex items-center gap-1 text-xs font-bold uppercase font-serif"><Minus className="w-3 h-3" /> Danno</button>
        <button onClick={() => { onHpChange(summon.currentHp + value); setAmount(''); }} disabled={!value} className="px-2 border border-border hover:border-success hover:text-success disabled:opacity-30 flex items-center gap-1 text-xs font-bold uppercase font-serif"><Plus className="w-3 h-3" /> Cura</button>
      </div>
      {rule}
      <div className="grid grid-cols-6 text-center">
        {abilities.map(([k, v]) => (
          <div key={k}>
            <div className="text-[10px] font-black text-text-muted font-serif">{k}</div>
            <div className="text-sm font-bold">{v} <span className="text-text-muted">({signed(getModifier(v))})</span></div>
          </div>
        ))}
      </div>
      {(summon.traits.length > 0 || summon.actions.length > 0) && rule}
      <div className="space-y-1.5 text-sm">
        {summon.traits.map(t => <p key={t.name}><strong className="italic">{t.name}.</strong> {t.desc}</p>)}
        {summon.actions.length > 0 && <div className="text-xs uppercase font-black text-accent font-serif border-b border-accent/40 pb-0.5 mt-2">Azioni</div>}
        {summon.actions.map(a => <p key={a.name}><strong className="italic">{a.name}.</strong> {a.desc}</p>)}
      </div>
    </motion.article>
  );
};
