
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

/**
 * Fixes text encoding issues like "Ã¨" -> "è".
 */
export function fixTextEncoding(text: string): string {
  if (!text) return '';
  try {
    // This is a common way to fix UTF-8 strings that were incorrectly read as ISO-8859-1
    return decodeURIComponent(escape(text));
  } catch (e) {
    // If it fails, try a manual mapping for the most common ones in Italian
    const map: Record<string, string> = {
      'Ã ': 'à', 'Ã¡': 'á',
      'Ã¨': 'è', 'Ã©': 'é',
      'Ã¬': 'ì', 'Ã­': 'í',
      'Ã²': 'ò', 'Ã³': 'ó',
      'Ã¹': 'ù', 'Ãº': 'ú',
      'Ã€': 'À', 'Ãˆ': 'È',
      'ÃŒ': 'Ì', 'Ã’': 'Ò',
      'Ã™': 'Ù',
      'Â°': '°', 'Âº': 'º'
    };
    let fixed = text;
    Object.entries(map).forEach(([wrong, right]) => {
      fixed = fixed.replace(new RegExp(wrong, 'g'), right);
    });
    return fixed;
  }
}
