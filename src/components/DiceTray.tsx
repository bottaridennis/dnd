import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Dices, X, Trash2, Swords } from 'lucide-react';
import { useDice } from '../contexts/DiceContext';
import { parseFormula } from '../lib/dice';

const QUICK_DICE = [4, 6, 8, 10, 12, 20, 100];

/** Vassoio dei dadi: tiri rapidi, formula libera, vantaggio/svantaggio e cronologia della sessione. */
export default function DiceTray() {
  const { history, mode, setMode, isOpen, setOpen, rollCheck, rollDamage, clear } = useDice();
  const [formula, setFormula] = useState('');
  const formulaValid = !formula.trim() || parseFormula(formula) !== null;
  const last = history[0];

  const rollCustom = () => {
    if (!formula.trim() || !formulaValid) return;
    rollDamage('Tiro libero', formula);
    setFormula('');
  };

  return (
    <div className="fixed z-[70] bottom-4 right-4 flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="surface-card pointer-events-auto w-[min(360px,calc(100vw-32px))] max-h-[70vh] flex flex-col"
            aria-label="Vassoio dei dadi"
          >
            <header className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gold/50">
              <h3 className="font-serif text-lg flex items-center gap-2"><Dices className="w-5 h-5 text-accent" /> Dadi</h3>
              <div className="flex items-center gap-1">
                {history.length > 0 && <button onClick={clear} className="p-1.5 text-text-muted hover:text-danger" aria-label="Svuota cronologia"><Trash2 className="w-4 h-4" /></button>}
                <button onClick={() => setOpen(false)} className="p-1.5 text-text-muted hover:text-accent" aria-label="Chiudi vassoio"><X className="w-4 h-4" /></button>
              </div>
            </header>

            <div className="px-5 py-3 space-y-3 border-b border-gold/30">
              <div className="grid grid-cols-3 gap-1 text-[10px] uppercase font-bold tracking-wider">
                {([['disadvantage', 'Svantaggio'], ['normal', 'Normale'], ['advantage', 'Vantaggio']] as const).map(([id, label]) => (
                  <button key={id} onClick={() => setMode(id)} className={`py-1.5 border ${mode === id ? 'bg-accent text-bg border-accent' : 'border-border text-text-muted hover:border-accent'}`}>{label}</button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_DICE.map(sides => (
                  <button
                    key={sides}
                    onClick={() => (sides === 20 ? rollCheck('d20', 0) : rollDamage(`d${sides}`, `1d${sides}`))}
                    className="flex-1 min-w-[42px] py-1.5 border border-gold/60 bg-card-bg text-xs font-bold hover:border-accent hover:text-accent"
                  >
                    d{sides}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={formula}
                  onChange={e => setFormula(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && rollCustom()}
                  placeholder="Formula, es. 2d6+3"
                  aria-label="Formula dei dadi"
                  className={`flex-1 bg-bg border px-3 py-1.5 text-sm outline-none ${formulaValid ? 'border-border focus:border-accent' : 'border-danger'}`}
                />
                <button onClick={rollCustom} disabled={!formula.trim() || !formulaValid} className="primary-action px-3 disabled:opacity-40">Tira</button>
              </div>
            </div>

            <ol className="flex-1 overflow-y-auto px-5 py-3 space-y-2" aria-live="polite">
              {history.length === 0 && <li className="text-sm text-text-muted italic py-4 text-center">Clicca un'abilità, un tiro salvezza o un attacco della scheda per tirare.</li>}
              {history.map((entry, index) => (
                <li key={entry.id} className={`border px-3 py-2 ${index === 0 ? 'border-accent bg-card-bg' : 'border-border/60'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase font-bold tracking-wider truncate">{entry.label}</div>
                      <div className="text-xs text-text-muted">{entry.detail}</div>
                      {entry.critical && entry.kind === 'd20' && <div className="text-[10px] uppercase font-bold text-accent">20 naturale!</div>}
                      {entry.fumble && <div className="text-[10px] uppercase font-bold text-danger">1 naturale</div>}
                    </div>
                    {entry.total !== undefined && (
                      <div className={`font-display text-3xl leading-none ${entry.critical ? 'text-accent' : entry.fumble ? 'text-danger' : 'text-text-primary'}`}>{entry.total}</div>
                    )}
                  </div>
                  {entry.followUp && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => rollDamage(entry.followUp!.label, entry.followUp!.formula)} className="secondary-action !py-1 !px-2 flex items-center gap-1"><Swords className="w-3 h-3" /> Danni</button>
                      <button onClick={() => rollDamage(entry.followUp!.label, entry.followUp!.formula, true)} className={`secondary-action !py-1 !px-2 ${entry.critical ? '!border-accent !text-accent' : ''}`}>Danni critici</button>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </motion.section>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen(!isOpen)}
        className="brand-mark !w-14 !h-14 pointer-events-auto relative"
        aria-label={isOpen ? 'Chiudi i dadi' : 'Apri i dadi'}
        title="Dadi"
      >
        <Dices className="w-6 h-6" />
        {!isOpen && last?.total !== undefined && (
          <span className="absolute -top-2 -left-2 min-w-7 h-7 px-1 grid place-items-center bg-card-bg text-text-primary border border-gold font-display text-sm">{last.total}</span>
        )}
      </button>
    </div>
  );
}
