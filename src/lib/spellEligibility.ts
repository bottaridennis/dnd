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

export function getCharacterClassLevels(character: Pick<CharacterData, 'classId' | 'level' | 'classes'>): Record<string, number> {
  const entries = Object.entries(character.classes || {});
  if (entries.length > 0) return Object.fromEntries(entries.map(([id, data]) => [id.toLowerCase(), data.level]));
  return character.classId ? { [character.classId.toLowerCase()]: character.level || 1 } : {};
}

export function getMaxSpellLevel(classId: string, classLevel: number): number {
  if (classLevel < 1) return -1;
  if (['bard', 'cleric', 'druid', 'sorcerer', 'wizard'].includes(classId)) return Math.min(9, Math.ceil(classLevel / 2));
  if (['paladin', 'ranger'].includes(classId)) return Math.min(5, Math.ceil(classLevel / 2));
  if (classId === 'warlock') return Math.min(5, Math.ceil(classLevel / 2));
  return -1;
}

export function getEligibleSpellClasses(spell: SpellLike, character: Pick<CharacterData, 'classId' | 'level' | 'classes'>): string[] {
  if (!spell.classes?.length) return [];
  const classLevels = getCharacterClassLevels(character);
  return spell.classes.filter(classId => {
    const normalized = classId.toLowerCase();
    const classLevel = classLevels[normalized];
    if (!classLevel) return false;
    return (spell.level ?? 0) === 0 || (spell.level ?? 0) <= getMaxSpellLevel(normalized, classLevel);
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
  return Array.from({ length: max + 1 }, (_, level) => level);
}
