
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

/** Normalizza testo UTF-8 letto accidentalmente come Windows-1252/Latin-1. */
export function fixTextEncoding(text: string): string {
  if (!text) return '';
  const replacements: Array<[string, string]> = [
    ['ÃƒÂ ', 'à'], ['ÃƒÂ¨', 'è'], ['ÃƒÂ©', 'é'], ['ÃƒÂ¬', 'ì'], ['ÃƒÂ²', 'ò'], ['ÃƒÂ¹', 'ù'],
    ['Ã ', 'à'], ['Ã¡', 'á'], ['Ã¨', 'è'], ['Ã©', 'é'], ['Ã¬', 'ì'], ['Ã­', 'í'],
    ['Ã²', 'ò'], ['Ã³', 'ó'], ['Ã¹', 'ù'], ['Ãº', 'ú'], ['Ã€', 'À'], ['Ãˆ', 'È'],
    ['ÃŒ', 'Ì'], ['Ã’', 'Ò'], ['Ã™', 'Ù'], ['Â°', '°'], ['Âº', 'º'], ['Â·', '·'],
    ['â€™', '’'], ['â€˜', '‘'], ['â€œ', '“'], ['â€', '”'], ['â€“', '–'], ['â€”', '—'],
    ['â€¢', '•'], ['â€¦', '…'], ['Â', ''],
  ];

  return replacements.reduce((value, [wrong, right]) => value.split(wrong).join(right), text);
}
