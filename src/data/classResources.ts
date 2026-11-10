/**
 * Risorse di classe non magiche (PHB 2024) con il loro recupero sui riposi.
 * - 'long': tutte al Riposo Lungo
 * - 'short': tutte al Riposo Breve o Lungo
 * - 'short-one': una al Riposo Breve, tutte al Riposo Lungo
 */
import type { Ability, CharacterData } from '../contexts/CharacterContext';
import { getClassLevels } from '../lib/characterRules';

export type Recovery = 'long' | 'short' | 'short-one';

export interface ClassResource {
  id: string;
  classId: string;
  name: string;
  max: number;
  recovery: Recovery;
  /** 'pool' = riserva di punti da spendere in quantità variabili (es. Imposizione delle Mani) */
  kind: 'uses' | 'pool';
  note?: string;
}

const byLevel = (level: number, table: [number, number][]): number => {
  let value = 0;
  table.forEach(([min, v]) => { if (level >= min) value = v; });
  return value;
};

export function getClassResources(character: CharacterData, mods: Record<Ability, number>): ClassResource[] {
  const levels = getClassLevels(character);
  const list: ClassResource[] = [];
  const add = (r: ClassResource) => { if (r.max > 0) list.push(r); };

  const barbarian = levels.barbarian?.level || 0;
  if (barbarian) {
    add({ id: 'rage', classId: 'barbarian', name: 'Ira', kind: 'uses', recovery: 'short-one',
      max: byLevel(barbarian, [[1, 2], [3, 3], [6, 4], [12, 5], [17, 6]]),
      note: `Danni dell'Ira +${byLevel(barbarian, [[1, 2], [9, 3], [16, 4]])}` });
  }

  const bard = levels.bard?.level || 0;
  if (bard) {
    add({ id: 'bardic-inspiration', classId: 'bard', name: 'Ispirazione Bardica', kind: 'uses',
      recovery: bard >= 5 ? 'short' : 'long', max: Math.max(1, mods.CHA),
      note: `Dado d${byLevel(bard, [[1, 6], [5, 8], [10, 10], [15, 12]])}${bard >= 5 ? ' · Fonte d\'Ispirazione' : ''}` });
  }

  const cleric = levels.cleric?.level || 0;
  if (cleric >= 10) add({ id: 'divine-intervention', classId: 'cleric', name: 'Intervento Divino', kind: 'uses', recovery: 'long', max: 1 });

  const druid = levels.druid?.level || 0;
  if (druid >= 2) {
    add({ id: 'wild-shape', classId: 'druid', name: 'Forma Selvatica', kind: 'uses', recovery: 'short-one',
      max: byLevel(druid, [[2, 2], [6, 3], [17, 4]]) });
  }

  const fighter = levels.fighter?.level || 0;
  if (fighter) {
    add({ id: 'second-wind', classId: 'fighter', name: 'Recuperare Energie', kind: 'uses', recovery: 'short-one',
      max: byLevel(fighter, [[1, 2], [4, 3], [10, 4]]), note: `Recupera 1d10 + ${fighter} PF` });
    if (fighter >= 2) add({ id: 'action-surge', classId: 'fighter', name: 'Azione Impetuosa', kind: 'uses', recovery: 'short', max: fighter >= 17 ? 2 : 1 });
    if (fighter >= 9) add({ id: 'indomitable', classId: 'fighter', name: 'Indomito', kind: 'uses', recovery: 'long', max: byLevel(fighter, [[9, 1], [13, 2], [17, 3]]), note: `Ritira un TS con +${fighter}` });
  }

  const monk = levels.monk?.level || 0;
  if (monk >= 2) {
    add({ id: 'focus', classId: 'monk', name: 'Punti Focus', kind: 'pool', recovery: 'short', max: monk, note: `Dado di Arti Marziali d${byLevel(monk, [[1, 6], [5, 8], [11, 10], [17, 12]])}` });
    add({ id: 'uncanny-metabolism', classId: 'monk', name: 'Metabolismo Straordinario', kind: 'uses', recovery: 'long', max: 1 });
  }

  const paladin = levels.paladin?.level || 0;
  if (paladin) {
    add({ id: 'lay-on-hands', classId: 'paladin', name: 'Imposizione delle Mani', kind: 'pool', recovery: 'long', max: paladin * 5, note: '5 punti curano anche una condizione Avvelenato' });
  }

  const ranger = levels.ranger?.level || 0;
  if (ranger) {
    add({ id: 'favored-enemy', classId: 'ranger', name: 'Nemico Prescelto (Marchio del Cacciatore)', kind: 'uses', recovery: 'long',
      max: byLevel(ranger, [[1, 2], [5, 3], [9, 4], [13, 5], [17, 6]]), note: 'Lanci senza slot' });
  }

  const sorcerer = levels.sorcerer?.level || 0;
  if (sorcerer) add({ id: 'innate-sorcery', classId: 'sorcerer', name: 'Stregoneria Innata', kind: 'uses', recovery: 'long', max: 2 });

  const warlock = levels.warlock?.level || 0;
  if (warlock >= 2) add({ id: 'magical-cunning', classId: 'warlock', name: 'Astuzia Magica', kind: 'uses', recovery: 'long', max: 1, note: 'Recupera metà degli slot del Patto' });

  const wizard = levels.wizard?.level || 0;
  if (wizard) add({ id: 'arcane-recovery', classId: 'wizard', name: 'Recupero Arcano', kind: 'uses', recovery: 'long', max: 1, note: `Slot recuperabili: ${Math.ceil(wizard / 2)} livelli (max 5°)` });

  return list;
}

/** Applica il recupero delle risorse di classe dopo un riposo. */
export function recoverClassResources(spent: Record<string, number> | undefined, resources: ClassResource[], rest: 'short' | 'long'): Record<string, number> {
  if (rest === 'long') return {};
  const next: Record<string, number> = { ...(spent || {}) };
  resources.forEach(r => {
    if (r.recovery === 'short') next[r.id] = 0;
    else if (r.recovery === 'short-one') next[r.id] = Math.max(0, (next[r.id] || 0) - 1);
  });
  return next;
}
