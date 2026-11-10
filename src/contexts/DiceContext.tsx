import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { rollD20, rollFormula, signed, type RollMode, type RolledDie } from '../lib/dice';

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
  /** Dadi da animare in 3D */
  dice?: RolledDie[];
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
  /** Dadi 3D animati */
  dice3d: boolean;
  setDice3d: (enabled: boolean) => void;
  /** Tiro attualmente in animazione (il totale viene svelato alla fine) */
  animating: RollEntry | null;
  finishAnimation: (id: string) => void;
  /** WebGL non disponibile: i dadi 3D non si possono mostrare su questo dispositivo */
  dice3dFailed: boolean;
  reportDice3dFailure: () => void;
}

const DiceContext = createContext<DiceContextValue | undefined>(undefined);

const MODE_LABEL: Record<RollMode, string> = { normal: '', advantage: ' · Vantaggio', disadvantage: ' · Svantaggio' };

export function DiceProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<RollEntry[]>([]);
  const [mode, setMode] = useState<RollMode>('normal');
  const [isOpen, setOpen] = useState(false);
  const [animating, setAnimating] = useState<RollEntry | null>(null);
  const [dice3d, setDice3dState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('forge-dice3d');
      // Attivi di default anche con "Riduci movimento": in quel caso l'animazione è breve e senza rotolamento
      return saved !== 'off';
    } catch { return true; }
  });
  const [dice3dFailed, setDice3dFailed] = useState(false);
  const reportDice3dFailure = useCallback(() => setDice3dFailed(true), []);
  const setDice3d = useCallback((enabled: boolean) => {
    setDice3dState(enabled);
    try { localStorage.setItem('forge-dice3d', enabled ? 'on' : 'off'); } catch { /* storage non disponibile */ }
  }, []);
  const finishAnimation = useCallback((id: string) => setAnimating(cur => (cur?.id === id ? null : cur)), []);

  const push = useCallback((entry: Omit<RollEntry, 'id' | 'at'>) => {
    const full = { ...entry, id: crypto.randomUUID(), at: Date.now() };
    setHistory(prev => [full, ...prev].slice(0, 50));
    setOpen(true);
    if (dice3d && full.dice?.length) setAnimating(full);
    return full;
  }, [dice3d]);

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
      dice: result.rolls.map((value, i) => ({ sides: 20, value, dropped: result.rolls.length > 1 && (value !== result.natural || result.rolls.indexOf(value) !== i) })),
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
      dice: result.dice,
    });
  }, [push]);

  const addNote = useCallback((label: string, detail: string) => { push({ label, detail, kind: 'note' }); }, [push]);
  const clear = useCallback(() => setHistory([]), []);

  const value = useMemo(() => ({ history, mode, setMode, isOpen, setOpen, rollCheck, rollDamage, addNote, clear, dice3d, setDice3d, animating, finishAnimation, dice3dFailed, reportDice3dFailure }), [history, mode, isOpen, rollCheck, rollDamage, addNote, clear, dice3d, setDice3d, animating, finishAnimation, dice3dFailed, reportDice3dFailure]);
  return <DiceContext.Provider value={value}>{children}</DiceContext.Provider>;
}

export function useDice() {
  const ctx = useContext(DiceContext);
  if (!ctx) throw new Error('useDice must be used within a DiceProvider');
  return ctx;
}
