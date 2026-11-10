/** Motore dei dadi: formule tipo "2d6+3", tiri d20 con vantaggio/svantaggio e critici. */
import { rollDie } from './rests';

export type RollMode = 'normal' | 'advantage' | 'disadvantage';

export interface DiceTerm { count: number; sides: number; sign: 1 | -1 }
export interface ParsedFormula { dice: DiceTerm[]; modifier: number }

export function parseFormula(formula: string): ParsedFormula | null {
  const clean = formula.replace(/\s+/g, '').toLowerCase();
  if (!clean || !/^[+-]?(\d*d\d+|\d+)([+-](\d*d\d+|\d+))*$/.test(clean)) return null;
  const dice: DiceTerm[] = [];
  let modifier = 0;
  (clean.match(/[+-]?[^+-]+/g) || []).forEach(token => {
    const sign: 1 | -1 = token.startsWith('-') ? -1 : 1;
    const body = token.replace(/^[+-]/, '');
    if (body.includes('d')) {
      const [count, sides] = body.split('d');
      dice.push({ count: Math.min(100, Number(count || 1)), sides: Math.min(1000, Number(sides)), sign });
    } else {
      modifier += sign * Number(body);
    }
  });
  if (dice.some(d => d.sides < 1 || d.count < 1)) return null;
  return { dice, modifier };
}

export function formatFormula(parsed: ParsedFormula): string {
  const parts = parsed.dice.map((d, i) => `${i === 0 ? (d.sign < 0 ? '-' : '') : d.sign < 0 ? ' - ' : ' + '}${d.count}d${d.sides}`);
  if (parsed.modifier) parts.push(`${parts.length ? (parsed.modifier < 0 ? ' - ' : ' + ') : parsed.modifier < 0 ? '-' : ''}${Math.abs(parsed.modifier)}`);
  return parts.join('') || '0';
}

export interface RolledDie { sides: number; value: number; dropped?: boolean }

export interface DamageRoll { total: number; rolls: number[]; dice: RolledDie[]; formula: string; critical: boolean }

/** Tira una formula; con il critico si raddoppiano i dadi (non i modificatori), come da PHB 2024. */
export function rollFormula(formula: string, critical = false): DamageRoll | null {
  const parsed = parseFormula(formula);
  if (!parsed) return null;
  const rolls: number[] = [];
  const dice: RolledDie[] = [];
  let total = parsed.modifier;
  parsed.dice.forEach(term => {
    const count = critical ? term.count * 2 : term.count;
    for (let i = 0; i < count; i++) {
      const value = rollDie(term.sides);
      rolls.push(term.sign * value);
      dice.push({ sides: term.sides, value });
      total += term.sign * value;
    }
  });
  const shown = critical ? { ...parsed, dice: parsed.dice.map(d => ({ ...d, count: d.count * 2 })) } : parsed;
  return { total: Math.max(0, total), rolls, dice, formula: formatFormula(shown), critical };
}

export interface D20Roll { total: number; natural: number; rolls: number[]; bonus: number; mode: RollMode; isCritical: boolean; isFumble: boolean }

export function rollD20(bonus: number, mode: RollMode = 'normal'): D20Roll {
  const first = rollDie(20);
  const rolls = mode === 'normal' ? [first] : [first, rollDie(20)];
  const natural = mode === 'advantage' ? Math.max(...rolls) : mode === 'disadvantage' ? Math.min(...rolls) : first;
  return { total: natural + bonus, natural, rolls, bonus, mode, isCritical: natural === 20, isFumble: natural === 1 };
}

export const signed = (value: number) => (value >= 0 ? `+${value}` : `${value}`);
