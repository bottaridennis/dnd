/**
 * Dati per costruire e valutare gli incontri.
 * - PE per Grado di Sfida (GS) e budget di PE per personaggio dalla DMG 2024 (difficoltà Bassa / Moderata / Alta).
 * - Mostri di base con statistiche SRD 5.1 (CC-BY-4.0), modificabili liberamente nell'editor.
 */

export const CR_OPTIONS = ['0', '1/8', '1/4', '1/2', ...Array.from({ length: 30 }, (_, i) => String(i + 1))];

export const XP_BY_CR: Record<string, number> = {
  '0': 10, '1/8': 25, '1/4': 50, '1/2': 100, '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800,
  '6': 2300, '7': 2900, '8': 3900, '9': 5000, '10': 5900, '11': 7200, '12': 8400, '13': 10000,
  '14': 11500, '15': 13000, '16': 15000, '17': 18000, '18': 20000, '19': 22000, '20': 25000,
  '21': 33000, '22': 41000, '23': 50000, '24': 62000, '25': 75000, '26': 90000, '27': 105000,
  '28': 120000, '29': 135000, '30': 155000,
};

/** Budget di PE per personaggio (DMG 2024): [Bassa, Moderata, Alta] per livello 1–20. */
const BUDGET: [number, number, number][] = [
  [50, 75, 100], [100, 150, 200], [150, 225, 400], [250, 375, 500], [500, 750, 1100],
  [600, 1000, 1400], [750, 1300, 1700], [1000, 1700, 2100], [1300, 2000, 2600], [1600, 2300, 3100],
  [1900, 2900, 4100], [2200, 3700, 4700], [2600, 4200, 5400], [2900, 4900, 6200], [3300, 5400, 7800],
  [3800, 6100, 9800], [4500, 7200, 11700], [5000, 8700, 14200], [5500, 10700, 17200], [6400, 13200, 22000],
];

export type Difficulty = 'trivial' | 'low' | 'moderate' | 'high' | 'deadly';

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  trivial: 'Banale', low: 'Bassa', moderate: 'Moderata', high: 'Alta', deadly: 'Oltre il limite',
};

export function partyBudget(levels: number[]): { low: number; moderate: number; high: number } {
  return levels.reduce((acc, lvl) => {
    const row = BUDGET[Math.min(20, Math.max(1, lvl)) - 1];
    return { low: acc.low + row[0], moderate: acc.moderate + row[1], high: acc.high + row[2] };
  }, { low: 0, moderate: 0, high: 0 });
}

export function encounterXp(monsters: { cr: string; count: number }[]): number {
  return monsters.reduce((acc, m) => acc + (XP_BY_CR[m.cr] ?? 0) * Math.max(0, m.count), 0);
}

export function rateEncounter(xp: number, budget: { low: number; moderate: number; high: number }): Difficulty {
  if (budget.high === 0) return 'trivial';
  if (xp > budget.high * 1.25) return 'deadly';
  if (xp > budget.moderate) return 'high';
  if (xp > budget.low) return 'moderate';
  if (xp >= budget.low * 0.5) return 'low';
  return 'trivial';
}

export interface MonsterPreset { name: string; cr: string; hp: number; ac: number; initiativeBonus: number; type: string }

export const MONSTER_PRESETS: MonsterPreset[] = [
  { name: 'Bandito', cr: '1/8', hp: 11, ac: 12, initiativeBonus: 1, type: 'Umanoide' },
  { name: 'Coboldo', cr: '1/8', hp: 5, ac: 12, initiativeBonus: 2, type: 'Umanoide' },
  { name: 'Cultista', cr: '1/8', hp: 9, ac: 12, initiativeBonus: 1, type: 'Umanoide' },
  { name: 'Guardia', cr: '1/8', hp: 11, ac: 16, initiativeBonus: 1, type: 'Umanoide' },
  { name: 'Goblin', cr: '1/4', hp: 7, ac: 15, initiativeBonus: 2, type: 'Umanoide' },
  { name: 'Lupo', cr: '1/4', hp: 11, ac: 13, initiativeBonus: 2, type: 'Bestia' },
  { name: 'Scheletro', cr: '1/4', hp: 13, ac: 13, initiativeBonus: 2, type: 'Non morto' },
  { name: 'Zombi', cr: '1/4', hp: 22, ac: 8, initiativeBonus: -2, type: 'Non morto' },
  { name: 'Gnoll', cr: '1/2', hp: 22, ac: 15, initiativeBonus: 1, type: 'Umanoide' },
  { name: 'Hobgoblin', cr: '1/2', hp: 11, ac: 18, initiativeBonus: 1, type: 'Umanoide' },
  { name: 'Orco', cr: '1/2', hp: 15, ac: 13, initiativeBonus: 1, type: 'Umanoide' },
  { name: 'Bugbear', cr: '1', hp: 27, ac: 16, initiativeBonus: 2, type: 'Umanoide' },
  { name: 'Lupo Crudele', cr: '1', hp: 37, ac: 14, initiativeBonus: 2, type: 'Bestia' },
  { name: 'Orso Bruno', cr: '1', hp: 34, ac: 11, initiativeBonus: 0, type: 'Bestia' },
  { name: 'Ragno Gigante', cr: '1', hp: 26, ac: 14, initiativeBonus: 3, type: 'Bestia' },
  { name: 'Capitano dei Banditi', cr: '2', hp: 65, ac: 15, initiativeBonus: 3, type: 'Umanoide' },
  { name: 'Ogre', cr: '2', hp: 59, ac: 11, initiativeBonus: -1, type: 'Gigante' },
  { name: 'Orsogufo', cr: '3', hp: 59, ac: 13, initiativeBonus: 1, type: 'Mostruosità' },
  { name: 'Troll', cr: '5', hp: 84, ac: 15, initiativeBonus: 1, type: 'Gigante' },
  { name: 'Drago Verde Giovane', cr: '8', hp: 136, ac: 18, initiativeBonus: 1, type: 'Drago' },
];

/** Condizioni del PHB 2024 applicabili nel tracker. */
export const TRACKER_CONDITIONS = [
  'Accecato', 'Affascinato', 'Afferrato', 'Assordato', 'Avvelenato', 'Immobilizzato', 'Incapacitato',
  'Invisibile', 'Paralizzato', 'Pietrificato', 'Privo di Sensi', 'Prono', 'Spaventato', 'Stordito', 'Concentrazione',
];
