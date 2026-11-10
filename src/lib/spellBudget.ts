import type { CharacterData } from '../contexts/CharacterContext';
import { getSubclassSpells } from '../data/subclassFeatures';
import { computeCharacterStats, getAllFeats, getClassLevels, getInvocationsKnown } from './characterRules';
import { CLASS_LABELS, getCharacterClassLevels, getMaxSpellLevel, type SpellLike } from './spellEligibility';

/**
 * Limiti di incantesimi secondo il Manuale del Giocatore 2024.
 *
 * Ogni classe incantatrice ha due "riserve": trucchetti e incantesimi preparati (tabelle di classe).
 * Il talento Iniziato alla Magia aggiunge 2 trucchetti e 1 incantesimo di 1° livello dalla sua lista,
 * che non contano nei limiti di classe. Gli incantesimi di sottoclasse sempre preparati sono gratuiti.
 * Ogni incantesimo scelto viene assegnato a una riserva compatibile (abbinamento bipartito),
 * così i personaggi multiclasse non vengono penalizzati dall'ordine di scelta.
 */

export interface SpellPool {
  id: string;
  label: string;
  kind: 'cantrip' | 'leveled';
  capacity: number;
  /** liste di classe accettate (id inglesi della lista incantesimi) */
  lists: string[];
  maxLevel: number;
  used: number;
}

export interface SpellCheck {
  ok: boolean;
  /** l'incantesimo appartiene a una lista e a un livello accessibili al personaggio */
  eligible: boolean;
  reason?: string;
}

export interface SpellBudget {
  pools: SpellPool[];
  cantrips: { used: number; max: number };
  leveled: { used: number; max: number };
  /** nomi selezionati che non trovano posto: oltre il limite o non più ammessi */
  excess: string[];
  /** nomi selezionati che non contano nel limite (sottoclasse sempre preparati) */
  free: string[];
  isCaster: boolean;
  check: (spell: SpellLike) => SpellCheck;
}

const MAGIC_INITIATE_LISTS: Record<string, string> = { chierico: 'cleric', druido: 'druid', mago: 'wizard' };

function magicInitiatePools(character: Partial<CharacterData>): SpellPool[] {
  const pools: SpellPool[] = [];
  getAllFeats(character).forEach((feat, idx) => {
    const match = /^iniziato alla magia(?:\s*\(([^)]+)\))?/i.exec(feat.trim());
    if (!match) return;
    const list = match[1] ? MAGIC_INITIATE_LISTS[match[1].trim().toLocaleLowerCase('it')] : undefined;
    const lists = list ? [list] : ['cleric', 'druid', 'wizard'];
    const label = list ? `Iniziato alla Magia (${CLASS_LABELS[list]})` : 'Iniziato alla Magia';
    pools.push({ id: `mi-${idx}-c`, label, kind: 'cantrip', capacity: 2, lists, maxLevel: 0, used: 0 });
    pools.push({ id: `mi-${idx}-l`, label, kind: 'leveled', capacity: 1, lists, maxLevel: 1, used: 0 });
  });
  return pools;
}

export function getSpellPools(character: CharacterData): SpellPool[] {
  const stats = computeCharacterStats(character);
  const levels = getCharacterClassLevels(character);
  const pools: SpellPool[] = [];
  stats.spellcasting.forEach(info => {
    const third = info.classId === 'fighter' || info.classId === 'rogue';
    const lists = [third ? 'wizard' : info.classId];
    const maxLevel = getMaxSpellLevel(third ? 'wizard-third' : info.classId, levels[info.classId] || 0);
    if (info.cantrips > 0) pools.push({ id: `${info.classId}-c`, label: info.label, kind: 'cantrip', capacity: info.cantrips, lists, maxLevel: 0, used: 0 });
    if (info.prepared > 0 && maxLevel >= 1) pools.push({ id: `${info.classId}-l`, label: info.label, kind: 'leveled', capacity: info.prepared, lists, maxLevel, used: 0 });
  });
  return [...pools, ...magicInitiatePools(character)];
}

function accepts(pool: SpellPool, spell: SpellLike): boolean {
  const level = spell.level ?? 0;
  if (pool.kind === 'cantrip' ? level !== 0 : level < 1 || level > pool.maxLevel) return false;
  // Homebrew senza lista di classe: ammesso in qualunque riserva del livello giusto
  if (!spell.classes?.length) return true;
  return spell.classes.some(c => pool.lists.includes(c.toLowerCase()));
}

/** Abbinamento bipartito (Kuhn): restituisce per ogni incantesimo l'indice dello slot o -1. */
function matchSpells(spells: SpellLike[], slots: SpellPool[]): number[] {
  const slotOwner: number[] = slots.map(() => -1);
  const assignment: number[] = spells.map(() => -1);
  const tryAssign = (s: number, seen: boolean[]): boolean => {
    for (let k = 0; k < slots.length; k++) {
      if (seen[k] || !accepts(slots[k], spells[s])) continue;
      seen[k] = true;
      if (slotOwner[k] === -1 || tryAssign(slotOwner[k], seen)) {
        slotOwner[k] = s;
        assignment[s] = k;
        return true;
      }
    }
    return false;
  };
  spells.forEach((_, s) => { tryAssign(s, slots.map(() => false)); });
  return assignment;
}

export function getSpellBudget(character: CharacterData, library: SpellLike[]): SpellBudget {
  const pools = getSpellPools(character);
  const slots = pools.flatMap(pool => Array.from({ length: pool.capacity }, () => pool));
  const find = (name: string) => library.find(s => s.name === name || s.originalName === name);

  const subclassSpells = new Set(Object.values(getClassLevels(character)).flatMap(c => getSubclassSpells(c.subclass, c.level)));
  const isFree = (spell: SpellLike) => subclassSpells.has(spell.name) || (typeof spell.originalName === 'string' && subclassSpells.has(spell.originalName));

  const free: string[] = [];
  const counted: { name: string; spell: SpellLike }[] = [];
  (character.spells || []).forEach(name => {
    const spell = find(name);
    if (!spell) return; // incantesimo homebrew eliminato: non conteggiabile
    if (isFree(spell)) free.push(name); else counted.push({ name, spell });
  });

  const assignment = matchSpells(counted.map(c => c.spell), slots);
  assignment.forEach(k => { if (k >= 0) slots[k].used += 1; });
  const excess = counted.filter((_, i) => assignment[i] < 0).map(c => c.name);

  const sum = (kind: SpellPool['kind']) => pools.filter(p => p.kind === kind).reduce((acc, p) => acc + p.capacity, 0);
  const cantrips = { used: counted.filter(c => (c.spell.level ?? 0) === 0).length, max: sum('cantrip') };
  const leveled = { used: counted.filter(c => (c.spell.level ?? 0) > 0).length, max: sum('leveled') };

  const check = (spell: SpellLike): SpellCheck => {
    const selected = (character.spells || []).some(n => n === spell.name || n === spell.originalName);
    if (isFree(spell)) return { ok: true, eligible: true, reason: selected ? undefined : 'Già sempre preparato dalla sottoclasse' };
    const eligible = pools.some(p => accepts(p, spell));
    if (selected) return { ok: true, eligible };
    if (!eligible) {
      if (pools.length === 0) return { ok: false, eligible, reason: 'Il personaggio non lancia incantesimi' };
      const level = spell.level ?? 0;
      const onList = pools.some(p => !spell.classes?.length || spell.classes.some(c => p.lists.includes(c.toLowerCase())));
      if (!onList) return { ok: false, eligible, reason: 'Non è nella lista della tua classe' };
      if (level === 0) return { ok: false, eligible, reason: 'La tua classe non conosce trucchetti' };
      return { ok: false, eligible, reason: `Incantesimi di ${level}° livello non ancora accessibili` };
    }
    if (excess.length > 0) return { ok: false, eligible, reason: 'Rimuovi prima gli incantesimi in eccesso' };
    const trial = matchSpells([...counted.map(c => c.spell), spell], slots.map(s => ({ ...s })));
    if (trial[trial.length - 1] >= 0) return { ok: true, eligible };
    return { ok: false, eligible, reason: (spell.level ?? 0) === 0 ? 'Limite di trucchetti raggiunto' : 'Limite di incantesimi preparati raggiunto' };
  };

  return { pools, cantrips, leveled, excess, free, isCaster: pools.length > 0, check };
}

/** Suppliche Occulte: limite dalla tabella del Warlock. */
export function getInvocationBudget(character: CharacterData) {
  const max = getInvocationsKnown(character);
  const used = (character.invocations || []).length;
  return { used, max, full: used >= max, over: used > max };
}
