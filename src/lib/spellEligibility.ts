import type { CharacterData } from '../contexts/CharacterContext';

export interface SpellLike {
  name: string;
  displayName?: string;
  level?: number;
  school?: string;
  classes?: string[];
  description?: string;
  ritual?: boolean;
  concentration?: boolean;
  [key: string]: unknown;
}

export const SPELLCASTING_CLASSES = ['bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard'] as const;

export const CLASS_LABELS: Record<string, string> = {
  bard: 'Bardo', cleric: 'Chierico', druid: 'Druido', paladin: 'Paladino',
  ranger: 'Ranger', sorcerer: 'Stregone', warlock: 'Warlock', wizard: 'Mago',
};

export const SCHOOL_LABELS: Record<string, string> = {
  abjuration: 'Abiurazione', conjuration: 'Evocazione', divination: 'Divinazione',
  enchantment: 'Ammaliamento', evocation: 'Invocazione', illusion: 'Illusione',
  necromancy: 'Necromanzia', transmutation: 'Trasmutazione',
};

export function getCharacterClassLevels(character: Pick<CharacterData, 'classId' | 'level' | 'classes'> & Partial<CharacterData>): Record<string, number> {
  const entries = Object.entries(character.classes || {}).filter(([, data]) => data && data.level > 0);
  const result: Record<string, number> = entries.length > 0
    ? Object.fromEntries(entries.map(([id, data]) => [id.toLowerCase(), data.level]))
    : character.classId ? { [character.classId.toLowerCase()]: character.level || 1 } : {};
  // Cavaliere Arcano e Mistificatore Arcano usano la lista del Mago
  const subclassOf = (id: string) => character.classes?.[id]?.subclass || (character.classId === id ? character.subclassId : undefined);
  const thirdCasterLevel = (id: string, pattern: RegExp) => (result[id] && pattern.test(subclassOf(id) || '') ? result[id] : 0);
  const ek = thirdCasterLevel('fighter', /cavaliere arcano|eldritch knight/i);
  const at = thirdCasterLevel('rogue', /mistificatore arcano|arcane trickster/i);
  if (ek || at) result['wizard-third'] = Math.max(ek, at);
  return result;
}

export function getMaxSpellLevel(classId: string, classLevel: number): number {
  if (classLevel < 1) return -1;
  if (['bard', 'cleric', 'druid', 'sorcerer', 'wizard'].includes(classId)) return Math.min(9, Math.ceil(classLevel / 2));
  // PHB 2024: Paladino e Ranger accedono al 2° livello al 5°, al 3° al 9°, al 4° al 13°, al 5° al 17°
  if (['paladin', 'ranger'].includes(classId)) return Math.min(5, Math.ceil(classLevel / 4));
  if (classId === 'warlock') return Math.min(5, Math.ceil(classLevel / 2));
  // Terzi incantatori: trucchetti e 1° livello dal 3°, 2° al 7°, 3° al 13°, 4° al 19°
  if (classId === 'wizard-third') {
    if (classLevel < 3) return -1;
    return classLevel >= 19 ? 4 : classLevel >= 13 ? 3 : classLevel >= 7 ? 2 : 1;
  }
  return -1;
}

export function getEligibleSpellClasses(spell: SpellLike, character: Pick<CharacterData, 'classId' | 'level' | 'classes'>): string[] {
  if (!spell.classes?.length) return [];
  const classLevels = getCharacterClassLevels(character);
  return spell.classes.filter(classId => {
    const normalized = classId.toLowerCase();
    const check = (id: string) => {
      const classLevel = classLevels[id];
      if (!classLevel) return false;
      const max = getMaxSpellLevel(id, classLevel);
      if (max < 0 && !(id === 'paladin' || id === 'ranger')) return false;
      // Paladini e Ranger non hanno trucchetti
      if ((spell.level ?? 0) === 0) return !['paladin', 'ranger'].includes(id);
      return (spell.level ?? 0) <= max;
    };
    return check(normalized) || (normalized === 'wizard' && check('wizard-third'));
  });
}

export function canCharacterUseSpell(spell: SpellLike, character: Pick<CharacterData, 'classId' | 'level' | 'classes'>): boolean {
  // Gli elementi homebrew senza lista di classe rimangono selezionabili.
  if (!spell.classes?.length) return true;
  return getEligibleSpellClasses(spell, character).length > 0;
}

export function getAvailableSpellLevels(character: Pick<CharacterData, 'classId' | 'level' | 'classes'>): number[] {
  const classLevels = getCharacterClassLevels(character);
  const max = Math.max(0, ...Object.entries(classLevels).map(([id, level]) => getMaxSpellLevel(id, level)));
  // nessun incantatore: mostra comunque i trucchetti per talenti come Iniziato alla Magia
  return Array.from({ length: max + 1 }, (_, level) => level);
}
