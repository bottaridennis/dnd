
/**
 * D&D 5.5e (PHB 2024) Resource Math
 */

export interface ClassLevels {
  [className: string]: {
    level: number;
    subclass?: string;
  };
}

/**
 * Standard Spellcasting Table for Full Casters
 */
const FULL_CASTER_TABLE: Record<number, number[]> = {
  1: [2, 0, 0, 0, 0, 0, 0, 0, 0],
  2: [3, 0, 0, 0, 0, 0, 0, 0, 0],
  3: [4, 2, 0, 0, 0, 0, 0, 0, 0],
  4: [4, 3, 0, 0, 0, 0, 0, 0, 0],
  5: [4, 3, 2, 0, 0, 0, 0, 0, 0],
  6: [4, 3, 3, 0, 0, 0, 0, 0, 0],
  7: [4, 3, 3, 1, 0, 0, 0, 0, 0],
  8: [4, 3, 3, 2, 0, 0, 0, 0, 0],
  9: [4, 3, 3, 3, 1, 0, 0, 0, 0],
  10: [4, 3, 3, 3, 2, 0, 0, 0, 0],
  11: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  12: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  13: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  14: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  15: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  16: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
  19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
};

type CasterType = 'full' | 'half' | 'third' | null;

function getCasterType(classId: string, subclass?: string): CasterType {
  const cls = classId.toLowerCase();
  if (['bard', 'cleric', 'druid', 'sorcerer', 'wizard'].includes(cls)) return 'full';
  if (['paladin', 'ranger'].includes(cls)) return 'half';
  if (cls === 'fighter' && /cavaliere arcano|eldritch knight/i.test(subclass || '')) return 'third';
  if (cls === 'rogue' && /mistificatore arcano|arcane trickster/i.test(subclass || '')) return 'third';
  return null;
}

/**
 * 1. calculateSpellSlots
 * - Classe singola: si usa la tabella della classe (mezzi e terzi incantatori arrotondano per eccesso).
 * - Multiclasse (PHB 2024): livelli pieni + metà (per eccesso) di Paladino/Ranger + un terzo (per difetto)
 *   di Cavaliere Arcano/Mistificatore Arcano. Il Warlock usa la Magia del Patto separata.
 */
export function calculateSpellSlots(classes: ClassLevels): number[] {
  const casters = Object.entries(classes)
    .map(([name, info]) => ({ type: getCasterType(name, info.subclass), level: info.level }))
    .filter(c => c.type !== null && c.level > 0);

  let totalLevel = 0;
  if (casters.length === 1) {
    const { type, level } = casters[0];
    if (type === 'full') totalLevel = level;
    else if (type === 'half') totalLevel = Math.ceil(level / 2);
    else if (type === 'third') totalLevel = level >= 3 ? Math.ceil(level / 3) : 0;
  } else {
    casters.forEach(({ type, level }) => {
      if (type === 'full') totalLevel += level;
      else if (type === 'half') totalLevel += Math.ceil(level / 2);
      else if (type === 'third') totalLevel += Math.floor(level / 3);
    });
  }

  if (totalLevel <= 0) return [0, 0, 0, 0, 0, 0, 0, 0, 0];
  return FULL_CASTER_TABLE[Math.min(20, totalLevel)] || [0, 0, 0, 0, 0, 0, 0, 0, 0];
}

/**
 * 2. calculatePactMagic
 */
export function calculatePactMagic(level: number): { count: number; level: number } {
  if (level <= 0) return { count: 0, level: 0 };
  
  const slotsByLevel: Record<number, { count: number; level: number }> = {
    1: { count: 1, level: 1 },
    2: { count: 2, level: 1 },
    3: { count: 2, level: 2 },
    4: { count: 2, level: 2 },
    5: { count: 2, level: 3 },
    6: { count: 2, level: 3 },
    7: { count: 2, level: 4 },
    8: { count: 2, level: 4 },
    9: { count: 2, level: 5 },
    10: { count: 2, level: 5 },
    11: { count: 3, level: 5 },
    12: { count: 3, level: 5 },
    13: { count: 3, level: 5 },
    14: { count: 3, level: 5 },
    15: { count: 3, level: 5 },
    16: { count: 3, level: 5 },
    17: { count: 4, level: 5 },
    18: { count: 4, level: 5 },
    19: { count: 4, level: 5 },
    20: { count: 4, level: 5 },
  };

  return slotsByLevel[Math.min(20, level)] || { count: 0, level: 0 };
}

/**
 * 3. calculateSorceryPoints
 */
export function calculateSorceryPoints(level: number): number {
  if (level < 2) return 0;
  return level; // 2024: Sorcery Points equal level starting at level 2
}

/**
 * 4. calculateChannelDivinity
 */
export function calculateChannelDivinity(classes: ClassLevels): number {
  let clericMax = 0;
  let paladinMax = 0;

  // Make lookup case-insensitive
  const clericKey = Object.keys(classes).find(k => k.toLowerCase() === 'cleric');
  if (clericKey) {
    const lvl = classes[clericKey].level;
    if (lvl >= 18) clericMax = 4;
    else if (lvl >= 6) clericMax = 3;
    else if (lvl >= 2) clericMax = 2;
  }

  const paladinKey = Object.keys(classes).find(k => k.toLowerCase() === 'paladin');
  if (paladinKey) {
    const lvl = classes[paladinKey].level;
    if (lvl >= 11) paladinMax = 3;
    else if (lvl >= 3) paladinMax = 2;
  }

  // Highest value, not summed
  return Math.max(clericMax, paladinMax);
}
