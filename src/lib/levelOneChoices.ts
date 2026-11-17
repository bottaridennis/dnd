/**
 * Scelte obbligatorie del 1° livello secondo le tabelle del Manuale del Giocatore 2024
 * (privilegi di classe e talenti d'origine), con i requisiti usati dalla creazione guidata.
 */
import type { CharacterData } from '../contexts/CharacterContext';
import { backgroundsData, classesData } from '../data/rules2024';
import { FEATURES } from '../data/features';
import { standardWeapons, type WeaponData } from '../data/weaponsData';
import { getWeaponMasteryCount } from './characterRules';
import { CLASS_ORDERS, FEAT_PICKS, getFeatPicks, getOriginFeatSlots, parseMagicInitiate, type OriginFeatField } from './featChoices';
import { getSpellBudget } from './spellBudget';
import type { SpellLike } from './spellEligibility';

export interface Requirement { id: string; label: string; done: boolean; help: string; optional?: boolean }

export const STYLE_FEATS = FEATURES.filter(f => f.prerequisite?.includes('Stile di Combattimento'));
export const EXPERTISE_AT_1: Record<string, number> = { rogue: 2 };

/** Armi su cui la classe può scegliere le Maestrie al 1° livello (PHB 2024). */
export function masteryWeaponsFor(classId: string): WeaponData[] {
  return standardWeapons.filter(w => {
    if (classId === 'barbarian') return w.kind === 'melee';
    if (classId === 'rogue') return w.category === 'Semplice' || w.properties.some(p => /Finesse|Light/.test(p));
    return true;
  });
}

/** Scelte di 1° livello previste dalla tabella della classe, con il loro stato. */
export function getClassFeatureRequirements(character: CharacterData): Requirement[] {
  const classId = character.classId;
  const def = classesData.find(c => c.id === classId);
  if (!def) return [];
  const list: Requirement[] = [];
  const order = CLASS_ORDERS[classId];
  if (order) {
    const chosen = character.classes?.[classId]?.order;
    list.push({ id: 'order', label: `Scegli l’${order.title}`, done: Boolean(chosen), help: `Il manuale ti fa scegliere l’${order.title}: ${order.options.map(o => o.name).join(' oppure ')}. Tocca quello che preferisci.` });
  }
  if (classId === 'fighter') {
    const has = (character.feats || []).some(f => STYLE_FEATS.some(s => s.name === f.split(' (')[0]));
    list.push({ id: 'style', label: 'Scegli lo Stile di Combattimento', done: has, help: 'Il Guerriero inizia con un talento Stile di Combattimento: tocca quello che preferisci (Difesa è il più semplice).' });
  }
  const masteries = getWeaponMasteryCount(character);
  if (masteries > 0) {
    const n = Object.keys(character.weaponMasteries || {}).length;
    list.push({ id: 'masteries', label: `Scegli ${masteries} maestrie nelle armi (${n}/${masteries})`, done: n === masteries, help: `Tocca ${masteries} armi che sai usare al meglio: con queste potrai usare la loro proprietà di Maestria. Scegli quelle del tuo equipaggiamento.` });
  }
  const expertise = EXPERTISE_AT_1[classId] || 0;
  if (expertise) {
    const n = (character.expertiseSkills || []).length;
    list.push({ id: 'expertise', label: `Scegli ${expertise} abilità per la Maestria (${n}/${expertise})`, done: n === expertise, help: `Il Ladro raddoppia il bonus di competenza in ${expertise} abilità in cui è già competente: Furtività e Percezione sono ottime scelte.` });
  }
  return list;
}


export const FIELD_LABEL: Record<OriginFeatField, string> = { originFeat: 'dal background', bonusOriginFeat: 'dal tratto Versatile' };

/** Scelte richieste dai Talenti d'Origine (Iniziato alla Magia, Abile, Musicista, Artigiano). */
export function getOriginFeatRequirements(character: CharacterData, spells: SpellLike[]): Requirement[] {
  const list: Requirement[] = [];
  getOriginFeatSlots(character).forEach(({ field, feat, base }) => {
    const where = FIELD_LABEL[field];
    const mi = parseMagicInitiate(feat);
    if (mi) {
      const guide = `mi-${field}`;
      if (!fixedMagicInitiateList(character, field)) list.push({ id: guide, label: `Iniziato alla Magia ${where}: scegli la lista`, done: Boolean(mi.list), help: `Il talento Iniziato alla Magia ${where} ti fa scegliere da quale lista imparare: Chierico, Druido o Mago.` });
      if (mi.list) {
        const budget = getSpellBudget(character, spells);
        const cPool = budget.pools.find(p => p.id === `mi-${field}-c`);
        const lPool = budget.pools.find(p => p.id === `mi-${field}-l`);
        list.push({ id: `${guide}-c`, label: `${mi.list} ${where}: 2 trucchetti (${cPool?.used ?? 0}/2)`, done: (cPool?.used ?? 0) >= 2, help: `Tocca 2 trucchetti della lista del ${mi.list}: li conosci per sempre.` });
        list.push({ id: `${guide}-l`, label: `${mi.list} ${where}: 1 incantesimo (${lPool?.used ?? 0}/1)`, done: (lPool?.used ?? 0) >= 1, help: `Tocca 1 incantesimo di 1° livello della lista del ${mi.list}: è sempre preparato e lo lanci una volta gratis ogni Riposo Lungo.` });
      }
      return;
    }
    const def = FEAT_PICKS[base];
    if (def) {
      const n = getFeatPicks(feat).length;
      list.push({ id: `picks-${field}`, label: `${base}: scegli ${def.count} ${def.label} (${n}/${def.count})`, done: n === def.count, help: `${def.hint} Tocca ${def.count} voci nel riquadro “${base}”.` });
    }
  });
  return list;
}


/** La lista di Iniziato alla Magia è già fissata dal background (Accolito, Guida, Sapiente)? */
export function fixedMagicInitiateList(character: Partial<CharacterData>, field: OriginFeatField): string | undefined {
  if (field !== 'originFeat') return undefined;
  return parseMagicInitiate(backgroundsData.find(b => b.id === character.backgroundId)?.feat)?.list;
}
