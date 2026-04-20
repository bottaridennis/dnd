
export function getModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatModifier(score: number): string {
  const mod = getModifier(score);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export const abilityMap: Record<string, string> = {
  STR: 'FOR',
  DEX: 'DES',
  CON: 'COS',
  INT: 'INT',
  WIS: 'SAG',
  CHA: 'CAR'
};
