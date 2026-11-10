/** Lingue e competenze negli strumenti (PHB 2024). */
export const STANDARD_LANGUAGES = ['Comune', 'Comune dei Segni', 'Draconico', 'Elfico', 'Gigante', 'Gnomesco', 'Goblin', 'Halfling', 'Nanico', 'Orchesco'];
export const RARE_LANGUAGES = ['Abissale', 'Celestiale', 'Gergo delle Profondità', 'Infernale', 'Primordiale', 'Silvano', 'Sottocomune', 'Druidico', 'Gergo Ladresco'];

export const MUSICAL_INSTRUMENTS = ['Ciaramella', 'Cornamusa', 'Corno', 'Dulcimer', 'Flauto', 'Flauto di Pan', 'Lira', 'Liuto', 'Tamburo', 'Viola'];
export const ARTISAN_TOOLS = [
  'Strumenti da Alchimista', 'Scorte da Birraio', 'Scorte da Calligrafo', 'Strumenti da Falegname', 'Strumenti da Cartografo',
  'Strumenti da Calzolaio', 'Utensili da Cuoco', 'Strumenti da Soffiatore', 'Strumenti da Gioielliere', 'Strumenti da Conciatore',
  'Strumenti da Muratore', 'Scorte da Pittore', 'Strumenti da Vasaio', 'Strumenti da Fabbro', 'Strumenti da Inventore',
  'Strumenti da Tessitore', 'Strumenti da Intagliatore',
];
export const OTHER_TOOLS = ['Kit per Camuffamento', 'Kit per Contraffazione', 'Kit da Erborista', 'Kit da Avvelenatore', 'Strumenti da Navigatore', 'Attrezzi da Ladro', 'Set da Gioco (Carte)', 'Set da Gioco (Dadi)', 'Set da Gioco (Scacchi dei Draghi)'];
export const ALL_TOOLS = [...ARTISAN_TOOLS, ...MUSICAL_INSTRUMENTS, ...OTHER_TOOLS];

/** Lingue ottenute automaticamente (Comune per tutti + privilegi di classe). */
export function getFixedLanguages(classLevels: Record<string, { level: number }>): string[] {
  const list = ['Comune'];
  if (classLevels.druid) list.push('Druidico');
  if (classLevels.rogue) list.push('Gergo Ladresco');
  return list;
}

/** Numero di lingue a scelta: 2 dall'origine, +1 Ladro (Gergo Ladresco), +2 Ranger 2° (Esploratore Esperto). */
export function getLanguageChoices(classLevels: Record<string, { level: number }>): number {
  let count = 2;
  if (classLevels.rogue) count += 1;
  if ((classLevels.ranger?.level || 0) >= 2) count += 2;
  return count;
}

/** Strumenti concessi automaticamente dalla classe. */
export function getFixedClassTools(classLevels: Record<string, { level: number }>): string[] {
  const list: string[] = [];
  if (classLevels.druid) list.push('Kit da Erborista');
  if (classLevels.rogue) list.push('Attrezzi da Ladro');
  return list;
}

/** Strumenti a scelta della classe (Bardo: 3 strumenti musicali; Monaco: 1 strumento da artigiano o musicale). */
export function getClassToolChoices(classId: string): { count: number; options: string[]; label: string } | null {
  if (classId === 'bard') return { count: 3, options: MUSICAL_INSTRUMENTS, label: '3 strumenti musicali' };
  if (classId === 'monk') return { count: 1, options: [...ARTISAN_TOOLS, ...MUSICAL_INSTRUMENTS], label: '1 strumento da artigiano o musicale' };
  return null;
}
