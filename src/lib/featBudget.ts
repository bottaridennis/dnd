import type { CharacterData } from '../contexts/CharacterContext';
import { CLASS_FEATURES, isAsiLevel, isEpicBoonLevel } from '../data/classFeatures';
import { getClassLevels, getInvocationsKnown } from './characterRules';
import { checkFeatPrerequisites, checkInvocationPrerequisites } from './featEligibility';

/**
 * Limiti di talenti e Suppliche Occulte secondo il Manuale del Giocatore 2024.
 *
 * I talenti aggiuntivi (oltre a quelli d'origine di background e specie) arrivano solo da:
 *  - i livelli con Aumento dei Punteggi di Caratteristica (un Talento Generale o d'Origine al posto dell'aumento);
 *  - il privilegio Stile di Combattimento (Guerriero 1, Paladino 2, Ranger 2, Campione 7);
 *  - la Benedizione Epica del 19° livello.
 */

export type FeatCategory = 'origin' | 'general' | 'style' | 'boon';
type SlotKind = 'general' | 'style' | 'boon';

export interface FeatLike { name: string; prerequisite?: string; repeatable?: boolean; [key: string]: unknown }

export interface BudgetCheck { ok: boolean; eligible: boolean; reason?: string }

export interface FeatBudget {
  slots: Record<SlotKind, { used: number; max: number }>;
  /** Aumenti di caratteristica già presi al posto di un talento */
  asiTaken: number;
  /** talenti selezionati che non trovano posto o non rispettano più i prerequisiti */
  excess: string[];
  check: (feat: FeatLike) => BudgetCheck;
}

export function getFeatCategory(prerequisite: string | undefined): FeatCategory {
  const text = (prerequisite || '').toLocaleLowerCase('it');
  if (text.includes('stile di combattimento')) return 'style';
  if (text.includes('benedizione epica')) return 'boon';
  if (text.includes('origine')) return 'origin';
  return 'general';
}

const ACCEPTS: Record<SlotKind, FeatCategory[]> = {
  style: ['style'],
  general: ['general', 'origin'],
  // Al 19° livello si può prendere una Benedizione Epica o un altro talento a scelta
  boon: ['boon', 'general', 'origin'],
};

const SLOT_LABEL: Record<SlotKind, string> = { general: 'talenti', style: 'Stili di Combattimento', boon: 'Benedizioni Epiche' };

function matchFeats(categories: FeatCategory[], slots: SlotKind[]): number[] {
  const owner = slots.map(() => -1);
  const assignment = categories.map(() => -1);
  const tryAssign = (f: number, seen: boolean[]): boolean => {
    for (let k = 0; k < slots.length; k++) {
      if (seen[k] || !ACCEPTS[slots[k]].includes(categories[f])) continue;
      seen[k] = true;
      if (owner[k] === -1 || tryAssign(owner[k], seen)) { owner[k] = f; assignment[f] = k; return true; }
    }
    return false;
  };
  // Prima i talenti con meno alternative (stili e benedizioni), poi gli altri
  categories.map((_, i) => i).sort((a, b) => ACCEPTS.boon.indexOf(categories[a]) - ACCEPTS.boon.indexOf(categories[b]))
    .forEach(i => { tryAssign(i, slots.map(() => false)); });
  return assignment;
}

export function getFeatSlots(character: CharacterData): { slots: SlotKind[]; asiTaken: number } {
  const levels = getClassLevels(character);
  let general = 0;
  let boon = 0;
  let style = 0;
  Object.entries(levels).forEach(([classId, data]) => {
    for (let lvl = 1; lvl <= data.level; lvl++) {
      if (isEpicBoonLevel(classId, lvl)) boon++;
      else if (isAsiLevel(classId, lvl)) general++;
      if ((CLASS_FEATURES[classId]?.[lvl] || []).includes('Stile di Combattimento')) style++;
    }
    if (classId === 'fighter' && data.level >= 7 && /campione|champion/i.test(data.subclass || '')) style++;
  });
  // Ogni Aumento dei Punteggi di Caratteristica (+2 complessivi) consuma uno di questi slot
  const bonusTotal = Object.values(character.abilityBonuses || {}).reduce((acc: number, v) => acc + (Number(v) || 0), 0);
  let asiTaken = Math.ceil(bonusTotal / 2);
  const fromGeneral = Math.min(general, asiTaken);
  general -= fromGeneral;
  boon = Math.max(0, boon - (asiTaken - fromGeneral));
  asiTaken = Math.max(0, asiTaken);
  return {
    slots: [...Array(style).fill('style'), ...Array(general).fill('general'), ...Array(boon).fill('boon')] as SlotKind[],
    asiTaken,
  };
}

export function getFeatBudget(character: CharacterData, library: FeatLike[]): FeatBudget {
  const { slots, asiTaken } = getFeatSlots(character);
  const find = (name: string) => library.find(f => f.name === name) || library.find(f => f.name === name.split(' (')[0]);
  const selected = character.feats || [];
  const details = selected.map(name => find(name));
  const categories = details.map(d => getFeatCategory(d?.prerequisite));
  const assignment = matchFeats(categories, slots);

  const excess = selected.filter((_, i) => assignment[i] < 0 || (details[i] ? !checkFeatPrerequisites(details[i]!.prerequisite, character).ok : false));
  const summary = { general: { used: 0, max: 0 }, style: { used: 0, max: 0 }, boon: { used: 0, max: 0 } } as FeatBudget['slots'];
  slots.forEach(kind => { summary[kind].max++; });
  assignment.forEach(k => { if (k >= 0) summary[slots[k]].used++; });

  const origin = [character.originFeat, character.bonusOriginFeat].filter((f): f is string => Boolean(f)).map(f => f.split(' (')[0]);

  const check = (feat: FeatLike): BudgetCheck => {
    if (selected.includes(feat.name)) return { ok: true, eligible: true };
    const category = getFeatCategory(feat.prerequisite);
    const prereq = checkFeatPrerequisites(feat.prerequisite, character);
    const hasSlotKind = slots.some(kind => ACCEPTS[kind].includes(category));
    const eligible = prereq.ok && hasSlotKind;
    if (!prereq.ok) return { ok: false, eligible, reason: prereq.reasons.join(' · ') };
    if (!feat.repeatable && (origin.includes(feat.name) || selected.some(n => n.split(' (')[0] === feat.name))) return { ok: false, eligible, reason: 'Già posseduto' };
    if (!hasSlotKind) {
      const reason = category === 'style' ? 'Richiede il privilegio Stile di Combattimento'
        : category === 'boon' ? 'Le Benedizioni Epiche arrivano al 19° livello'
          : category === 'origin' && summary.general.max + summary.boon.max === 0 ? 'Il Talento d’Origine arriva dal background: altri talenti dal 4° livello'
            : asiTaken > 0 ? 'Hai usato gli aumenti di caratteristica al posto dei talenti' : 'I talenti arrivano con i livelli che concedono l’Aumento dei Punteggi di Caratteristica';
      return { ok: false, eligible, reason };
    }
    if (excess.length > 0) return { ok: false, eligible, reason: 'Rimuovi prima i talenti in eccesso' };
    const trial = matchFeats([...categories, category], slots);
    if (trial.every(k => k >= 0)) return { ok: true, eligible };
    const kind: SlotKind = category === 'style' ? 'style' : category === 'boon' ? 'boon' : 'general';
    return { ok: false, eligible, reason: `Limite raggiunto: ${SLOT_LABEL[kind]} già scelti` };
  };

  return { slots: summary, asiTaken, excess, check };
}

export interface InvocationLike { name: string; prerequisite?: string; [key: string]: unknown }

/** Suppliche Occulte: numero dalla tabella del Warlock e prerequisiti di livello/patto. */
export function getInvocationBudget(character: CharacterData, library: InvocationLike[] = []) {
  const max = getInvocationsKnown(character);
  const selected = character.invocations || [];
  const used = selected.length;
  const excess = selected.filter((name, i) => {
    if (i >= max) return true;
    const details = library.find(inv => inv.name === name);
    return details ? !checkInvocationPrerequisites(details.prerequisite, character).ok : false;
  });
  const check = (invocation: InvocationLike): BudgetCheck => {
    if (selected.includes(invocation.name)) return { ok: true, eligible: true };
    const prereq = checkInvocationPrerequisites(invocation.prerequisite, character);
    if (!prereq.ok) return { ok: false, eligible: false, reason: prereq.reasons.join(' · ') };
    if (excess.length > 0) return { ok: false, eligible: true, reason: 'Rimuovi prima le suppliche in eccesso' };
    if (used >= max) return { ok: false, eligible: true, reason: 'Limite di suppliche raggiunto' };
    return { ok: true, eligible: true };
  };
  return { used, max, full: used >= max, over: used > max, excess, check };
}
