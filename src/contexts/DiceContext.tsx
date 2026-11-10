import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { rollD20, rollFormula, signed, type RollMode } from '../lib/dice';

export interface RollEntry {
  id: string;
  label: string;
  kind: 'd20' | 'damage' | 'note';
  total?: number;
  detail: string;
  critical?: boolean;
  fumble?: boolean;
  /** Formula danni da proporre dopo un tiro per colpire */
  followUp?: { label: string; formula: string };
  at: number;
}

interface DiceContextValue {
  history: RollEntry[];
  mode: RollMode;
  setMode: (mode: RollMode) => void;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  rollCheck: (label: string, bonus: number, options?: { followUp?: RollEntry['followUp']; mode?: RollMode }) => RollEntry;
  rollDamage: (label: string, formula: string, critical?: boolean) => RollEntry | null;
  addNote: (label: string, detail: string) => void;
  clear: () => void;
}

const DiceContext = createContext<DiceContextValue | undefined>(undefined);

const MODE_LABEL: Record<RollMode, string> = { normal: '', advantage: ' · Vantaggio', disadvantage: ' · Svantaggio' };

export function DiceProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<RollEntry[]>([]);
  const [mode, setMode] = useState<RollMode>('normal');
  const [isOpen, setOpen] = useState(false);

  const push = useCallback((entry: Omit<RollEntry, 'id' | 'at'>) => {
    const full = { ...entry, id: crypto.randomUUID(), at: Date.now() };
    setHistory(prev => [full, ...prev].slice(0, 50));
    setOpen(true);
    return full;
  }, []);

  const rollCheck = useCallback<DiceContextValue['rollCheck']>((label, bonus, options) => {
    const effectiveMode = options?.mode ?? mode;
    const result = rollD20(bonus, effectiveMode);
    const dice = result.rolls.length > 1 ? `[${result.rolls.join(', ')}] → ${result.natural}` : `${result.natural}`;
    const entry = push({
      label,
      kind: 'd20',
      total: result.total,
      detail: `d20 ${dice} ${signed(bonus)}${MODE_LABEL[effectiveMode]}`,
      critical: result.isCritical,
      fumble: result.isFumble,
      followUp: options?.followUp,
    });
    // Il vantaggio/svantaggio vale per un solo tiro
    if (effectiveMode !== 'normal' && !options?.mode) setMode('normal');
    return entry;
  }, [mode, push]);

  const rollDamage = useCallback<DiceContextValue['rollDamage']>((label, formula, critical = false) => {
    const result = rollFormula(formula, critical);
    if (!result) return null;
    return push({
      label: critical ? `${label} (critico)` : label,
      kind: 'damage',
      total: result.total,
      detail: `${result.formula}: [${result.rolls.join(', ')}]`,
      critical,
    });
  }, [push]);

  const addNote = useCallback((label: string, detail: string) => { push({ label, detail, kind: 'note' }); }, [push]);
  const clear = useCallback(() => setHistory([]), []);

  const value = useMemo(() => ({ history, mode, setMode, isOpen, setOpen, rollCheck, rollDamage, addNote, clear }), [history, mode, isOpen, rollCheck, rollDamage, addNote, clear]);
  return <DiceContext.Provider value={value}>{children}</DiceContext.Provider>;
}

export function useDice() {
  const ctx = useContext(DiceContext);
  if (!ctx) throw new Error('useDice must be used within a DiceProvider');
  return ctx;
}
