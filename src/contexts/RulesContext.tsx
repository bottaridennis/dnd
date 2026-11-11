import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, Search, X } from 'lucide-react';
import { RULES, RULE_CATEGORIES, type RuleCategory, type RuleEntry } from '../data/rulesGlossary';

interface RulesContextValue {
  /** Apre il compendio, opzionalmente su una voce (id o nome) o una categoria */
  openRules: (target?: { id?: string; name?: string; category?: RuleCategory }) => void;
  /** Riassunto breve per i tooltip */
  ruleHint: (name: string) => string | undefined;
}

const RulesContext = createContext<RulesContextValue | undefined>(undefined);

const normalize = (s: string) => s.toLocaleLowerCase('it').normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const findRule = (name: string) => {
  const n = normalize(name.replace(/\s*\(\d+\)$/, ''));
  return RULES.find(r => normalize(r.name) === n || r.id === n || r.aliases?.some(a => normalize(a) === n));
};

export function RulesProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<RuleCategory | 'Tutte'>('Tutte');
  const [search, setSearch] = useState('');
  const [focusId, setFocusId] = useState<string | null>(null);

  const openRules = useCallback<RulesContextValue['openRules']>((target) => {
    const rule = target?.id ? RULES.find(r => r.id === target.id) : target?.name ? findRule(target.name) : undefined;
    setSearch('');
    setCategory(rule?.category || target?.category || 'Tutte');
    setFocusId(rule?.id || null);
    setOpen(true);
  }, []);
  const ruleHint = useCallback((name: string) => findRule(name)?.points.join(' '), []);

  const value = useMemo(() => ({ openRules, ruleHint }), [openRules, ruleHint]);
  return (
    <RulesContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {open && <RulesDrawer category={category} setCategory={setCategory} search={search} setSearch={setSearch} focusId={focusId} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </RulesContext.Provider>
  );
}

export function useRules() {
  const ctx = useContext(RulesContext);
  if (!ctx) throw new Error('useRules must be used within a RulesProvider');
  return ctx;
}

function RulesDrawer({ category, setCategory, search, setSearch, focusId, onClose }: {
  category: RuleCategory | 'Tutte'; setCategory: (c: RuleCategory | 'Tutte') => void; search: string; setSearch: (s: string) => void; focusId: string | null; onClose: () => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const needle = normalize(search);
  const results = RULES.filter(r => (needle ? true : category === 'Tutte' || r.category === category))
    .filter(r => !needle || normalize(r.name).includes(needle) || r.aliases?.some(a => normalize(a).includes(needle)) || r.points.some(p => normalize(p).includes(needle)));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  useEffect(() => {
    if (focusId) window.setTimeout(() => listRef.current?.querySelector(`[data-rule="${focusId}"]`)?.scrollIntoView({ block: 'start' }), 50);
  }, [focusId]);

  const grouped = RULE_CATEGORIES.map(c => [c, results.filter(r => r.category === c)] as [RuleCategory, RuleEntry[]]).filter(([, l]) => l.length);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[95] bg-black/60 backdrop-blur-sm flex justify-end print:hidden" onClick={onClose}>
      <motion.aside initial={{ x: 40 }} animate={{ x: 0 }} exit={{ x: 40 }} role="dialog" aria-modal="true" aria-labelledby="rules-title"
        className="bg-bg border-l border-border w-full max-w-lg h-full flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-border space-y-3 bg-panel-bg">
          <div className="flex items-center justify-between">
            <h2 id="rules-title" className="text-2xl uppercase flex items-center gap-2"><BookOpen className="w-6 h-6 text-accent" /> Regole</h2>
            <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary" aria-label="Chiudi"><X className="w-5 h-5" /></button>
          </div>
          <label className="field-shell"><Search className="w-4 h-4 text-text-muted" /><input autoFocus={!focusId} value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca: prono, copertura, lottare…" className="w-full bg-transparent py-2 outline-none" aria-label="Cerca nelle regole" /></label>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar" role="tablist">
            {(['Tutte', ...RULE_CATEGORIES] as const).map(c => (
              <button key={c} role="tab" aria-selected={!needle && category === c} onClick={() => { setSearch(''); setCategory(c); }}
                className={`shrink-0 px-2.5 py-1 text-[11px] font-black uppercase font-serif border ${!needle && category === c ? 'bg-accent text-bg border-accent' : 'border-border text-text-muted hover:text-text-primary'}`}>{c}</button>
            ))}
          </div>
        </header>
        <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-6">
          {grouped.length === 0 && <p className="text-sm text-text-muted">Nessuna regola trovata.</p>}
          {grouped.map(([c, list]) => (
            <section key={c}>
              <h3 className="text-xs uppercase tracking-[.2em] text-accent mb-2">{c}</h3>
              <div className="space-y-2">
                {list.map(r => (
                  <article key={r.id} data-rule={r.id} className={`border p-3 ${r.id === focusId ? 'border-accent bg-accent/10' : 'border-border bg-card-bg'}`}>
                    <h4 className="font-bold uppercase">{r.name}</h4>
                    <ul className="mt-1 space-y-1 text-sm list-disc pl-5 text-text-primary/90">{r.points.map((p, i) => <li key={i}>{p}</li>)}</ul>
                  </article>
                ))}
              </div>
            </section>
          ))}
          <p className="text-[11px] text-text-muted">Riassunti delle regole 2024 per la consultazione rapida: in caso di dubbio fa fede il manuale.</p>
        </div>
      </motion.aside>
    </motion.div>
  );
}
