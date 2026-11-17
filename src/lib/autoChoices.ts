import type { CharacterData } from '../contexts/CharacterContext';
import { FEATURES } from '../data/features';
import { INVOCATIONS } from '../data/invocations';
import { masteryWeaponsFor } from './levelOneChoices';
import { getProficiencySummary, getSkillProficiencies, getWeaponMasteryCount } from './characterRules';
import { getInvocationBudget } from './featBudget';
import { CLASS_ORDERS, FEAT_PICKS, MI_LISTS, featBase, formatFeatPicks, formatMagicInitiate, parseMagicInitiate } from './featChoices';
import { getSpellBudget } from './spellBudget';
import type { SpellLike } from './spellEligibility';

const shuffle = <T,>(list: T[]): T[] => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
};
const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

export /** Completa a caso le scelte obbligatorie di 1° livello (usata da "Casuale"). */
function autoCompleteChoices(start: CharacterData, spellLib: SpellLike[]): Partial<CharacterData> {
  let c: CharacterData = { ...start };
  const set = (patch: Partial<CharacterData>) => { c = { ...c, ...patch }; };
  // Talenti d'origine
  (['originFeat', 'bonusOriginFeat'] as const).forEach(field => {
    const feat = c[field];
    if (!feat) return;
    const base = featBase(feat);
    if (FEAT_PICKS[base]) {
      const owned = new Set([...getSkillProficiencies(c), ...getProficiencySummary(c).tools]);
      set({ [field]: formatFeatPicks(base, shuffle(FEAT_PICKS[base].options().filter(o => !owned.has(o))).slice(0, FEAT_PICKS[base].count)) });
    }
    const mi = parseMagicInitiate(feat);
    if (mi) {
      const list = mi.list || pick(Object.keys(MI_LISTS));
      const of = (lvl: number) => shuffle(spellLib.filter(sp => sp.level === lvl && sp.classes?.includes(MI_LISTS[list]) && !(c.spells || []).includes(sp.name)));
      const cantrips = of(0).slice(0, 2).map(sp => sp.name);
      const spell = of(1)[0]?.name;
      set({ [field]: formatMagicInitiate({ list, cantrips, spell }), spells: [...(c.spells || []), ...cantrips, ...(spell ? [spell] : [])] });
    }
  });
  // Privilegi di classe
  const order = CLASS_ORDERS[c.classId];
  if (order) set({ classes: { ...c.classes, [c.classId]: { ...(c.classes?.[c.classId] || { level: 1 }), order: pick(order.options).id } } });
  if (c.classId === 'fighter') set({ feats: [pick(FEATURES.filter(f => f.prerequisite?.includes('Stile di Combattimento'))).name] });
  const masteryCount = getWeaponMasteryCount(c);
  if (masteryCount) set({ weaponMasteries: Object.fromEntries(shuffle(masteryWeaponsFor(c.classId)).slice(0, masteryCount).map(w => [w.name, w.mastery])) });
  if (c.classId === 'rogue') set({ expertiseSkills: shuffle(getSkillProficiencies(c)).slice(0, 2) });
  // Incantesimi delle tabelle di classe
  for (const sp of shuffle(spellLib.filter(x => (x.level ?? 0) <= 1))) {
    const budget = getSpellBudget(c, spellLib);
    const classPools = budget.pools.filter(p => !p.id.startsWith('mi-'));
    if (classPools.every(p => p.used >= p.capacity)) break;
    if (!(c.spells || []).includes(sp.name) && budget.check(sp).ok) set({ spells: [...(c.spells || []), sp.name] });
  }
  // Suppliche Occulte
  for (const inv of shuffle([...INVOCATIONS])) {
    const ib = getInvocationBudget(c, INVOCATIONS);
    if (ib.used >= ib.max) break;
    if (ib.check(inv).ok) set({ invocations: [...(c.invocations || []), inv.name] });
  }
  const keys: (keyof CharacterData)[] = ['originFeat', 'bonusOriginFeat', 'classes', 'feats', 'weaponMasteries', 'expertiseSkills', 'spells', 'invocations'];
  return Object.fromEntries(keys.map(k => [k, c[k]])) as Partial<CharacterData>;
}

