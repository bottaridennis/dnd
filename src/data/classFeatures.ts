/**
 * Privilegi di classe per livello (PHB 2024) — solo i nomi, come promemoria sulla scheda.
 * "Sottoclasse" indica i livelli in cui la sottoclasse concede un privilegio;
 * "Talento" indica Aumento dei Punteggi di Caratteristica o un altro talento; "Benedizione Epica" il talento del 19°.
 */
const SUB = 'Privilegio di Sottoclasse';
const ASI = 'Talento (Aumento dei Punteggi di Caratteristica o altro)';
const BOON = 'Benedizione Epica';

export const CLASS_FEATURES: Record<string, Record<number, string[]>> = {
  barbarian: {
    1: ['Ira', 'Difesa Senza Armatura', 'Maestria nelle Armi'], 2: ['Percezione del Pericolo', 'Attacco Irruento'],
    3: ['Sottoclasse', 'Conoscenza Primordiale'], 4: [ASI], 5: ['Attacco Extra', 'Movimento Veloce'], 6: [SUB],
    7: ['Istinto Ferino', 'Balzo Istintivo'], 8: [ASI], 9: ['Colpo Brutale'], 10: [SUB], 11: ['Ira Implacabile'], 12: [ASI],
    13: ['Colpo Brutale Migliorato'], 14: [SUB], 15: ['Ira Persistente'], 16: [ASI], 17: ['Colpo Brutale Migliorato'],
    18: ['Potenza Indomabile'], 19: [BOON], 20: ['Campione Primordiale'],
  },
  bard: {
    1: ['Ispirazione Bardica', 'Incantesimi'], 2: ['Maestria', 'Factotum'], 3: ['Sottoclasse'], 4: [ASI],
    5: ["Fonte d'Ispirazione"], 6: [SUB], 7: ['Controfascino'], 8: [ASI], 9: ['Maestria'], 10: ['Segreti Magici'],
    12: [ASI], 14: [SUB], 16: [ASI], 18: ['Ispirazione Superiore'], 19: [BOON], 20: ['Parole della Creazione'],
  },
  cleric: {
    1: ['Incantesimi', 'Ordine Divino'], 2: ['Incanalare Divinità'], 3: ['Sottoclasse'], 4: [ASI], 5: ['Sterminare Non Morti'],
    6: [SUB], 7: ['Colpi Benedetti'], 8: [ASI], 10: ['Intervento Divino'], 12: [ASI], 14: ['Colpi Benedetti Migliorati'],
    16: [ASI], 17: [SUB], 19: [BOON], 20: ['Intervento Divino Superiore'],
  },
  druid: {
    1: ['Incantesimi', 'Druidico', 'Ordine Primordiale'], 2: ['Forma Selvatica', 'Compagno Selvatico'], 3: ['Sottoclasse'],
    4: [ASI], 5: ['Risorgenza Selvatica'], 6: [SUB], 7: ['Furia Elementale'], 8: [ASI], 10: [SUB], 12: [ASI], 14: [SUB],
    15: ['Furia Elementale Migliorata'], 16: [ASI], 18: ['Incantesimi Bestiali'], 19: [BOON], 20: ['Arcidruido'],
  },
  fighter: {
    1: ['Stile di Combattimento', 'Recuperare Energie', 'Maestria nelle Armi'], 2: ['Azione Impetuosa (1 uso)', 'Mente Tattica'],
    3: ['Sottoclasse'], 4: [ASI], 5: ['Attacco Extra', 'Spostamento Tattico'], 6: [ASI], 7: [SUB], 8: [ASI],
    9: ['Indomito (1 uso)', 'Maestro Tattico'], 10: [SUB], 11: ['Due Attacchi Extra'], 12: [ASI],
    13: ['Indomito (2 usi)', 'Attacchi Studiati'], 14: [ASI], 15: [SUB], 16: [ASI], 17: ['Azione Impetuosa (2 usi)', 'Indomito (3 usi)'],
    18: [SUB], 19: [BOON], 20: ['Tre Attacchi Extra'],
  },
  monk: {
    1: ['Arti Marziali', 'Difesa Senza Armatura'], 2: ['Focus del Monaco', 'Movimento Senza Armatura', 'Metabolismo Straordinario'],
    3: ['Deviare Attacchi', 'Sottoclasse'], 4: [ASI, 'Caduta Lenta'], 5: ['Attacco Extra', 'Colpo Stordente'],
    6: ['Colpi Potenziati', SUB], 7: ['Elusione'], 8: [ASI], 9: ['Movimento Acrobatico'], 10: ['Focus Potenziato', 'Autoguarigione'],
    11: [SUB], 12: [ASI], 13: ['Deviare Energia'], 14: ['Sopravvissuto Disciplinato'], 15: ['Focus Perfetto'], 16: [ASI],
    17: [SUB], 18: ['Difesa Superiore'], 19: [BOON], 20: ['Corpo e Mente'],
  },
  paladin: {
    1: ['Imposizione delle Mani', 'Incantesimi', 'Maestria nelle Armi'], 2: ['Stile di Combattimento', 'Colpo del Paladino'],
    3: ['Incanalare Divinità', 'Sottoclasse'], 4: [ASI], 5: ['Attacco Extra', 'Destriero Fedele'], 6: ['Aura di Protezione'],
    7: [SUB], 8: [ASI], 9: ['Abiurare Nemici'], 10: ['Aura di Coraggio'], 11: ['Colpi Radiosi'], 12: [ASI],
    14: ['Tocco Rigenerante'], 15: [SUB], 16: [ASI], 18: ["Espansione dell'Aura"], 19: [BOON], 20: [SUB],
  },
  ranger: {
    1: ['Incantesimi', 'Nemico Prescelto', 'Maestria nelle Armi'], 2: ['Esploratore Esperto', 'Stile di Combattimento'],
    3: ['Sottoclasse'], 4: [ASI], 5: ['Attacco Extra'], 6: ['Vagabondo'], 7: [SUB], 8: [ASI], 9: ['Maestria'],
    10: ['Instancabile'], 11: [SUB], 12: [ASI], 13: ['Cacciatore Implacabile'], 14: ['Velo della Natura'], 15: [SUB],
    16: [ASI], 17: ['Cacciatore Preciso'], 18: ['Sensi Ferini'], 19: [BOON], 20: ['Sterminatore di Nemici'],
  },
  rogue: {
    1: ['Maestria', 'Attacco Furtivo', 'Gergo Ladresco', 'Maestria nelle Armi'], 2: ['Azione Scaltra'],
    3: ['Sottoclasse', 'Mira Fissa'], 4: [ASI], 5: ['Colpo Astuto', 'Schivata Prodigiosa'], 6: ['Maestria'],
    7: ['Elusione', 'Talento Affidabile'], 8: [ASI], 9: [SUB], 10: [ASI], 11: ['Colpo Astuto Migliorato'], 12: [ASI],
    13: [SUB], 14: ['Colpi Subdoli'], 15: ['Mente Sfuggente'], 16: [ASI], 17: [SUB], 18: ['Inafferrabile'], 19: [BOON],
    20: ['Colpo di Fortuna'],
  },
  sorcerer: {
    1: ['Incantesimi', 'Stregoneria Innata'], 2: ['Fonte della Magia', 'Metamagia'], 3: ['Sottoclasse'], 4: [ASI],
    5: ['Ripristino Stregonesco'], 6: [SUB], 7: ['Stregoneria Incarnata'], 8: [ASI], 10: ['Metamagia'], 12: [ASI],
    14: [SUB], 16: [ASI], 17: ['Metamagia'], 18: [SUB], 19: [BOON], 20: ['Apoteosi Arcana'],
  },
  warlock: {
    1: ['Suppliche Occulte', 'Magia del Patto'], 2: ['Astuzia Magica'], 3: ['Sottoclasse'], 4: [ASI], 6: [SUB], 8: [ASI],
    9: ['Contattare il Patrono'], 10: [SUB], 11: ['Arcanum Mistico (6° livello)'], 12: [ASI], 13: ['Arcanum Mistico (7° livello)'],
    14: [SUB], 15: ['Arcanum Mistico (8° livello)'], 16: [ASI], 17: ['Arcanum Mistico (9° livello)'], 19: [BOON], 20: ['Maestro Occulto'],
  },
  wizard: {
    1: ['Incantesimi', 'Adepto dei Rituali', 'Recupero Arcano'], 2: ['Studioso'], 3: ['Sottoclasse'], 4: [ASI],
    5: ['Memorizzare Incantesimo'], 6: [SUB], 8: [ASI], 10: [SUB], 12: [ASI], 14: [SUB], 16: [ASI],
    18: ['Maestria negli Incantesimi'], 19: [BOON], 20: ['Incantesimi Distintivi'],
  },
};

export function getClassFeaturesUpTo(classId: string, level: number): { level: number; name: string }[] {
  const table = CLASS_FEATURES[classId] || {};
  const result: { level: number; name: string }[] = [];
  for (let l = 1; l <= level; l++) (table[l] || []).forEach(name => result.push({ level: l, name }));
  return result;
}

export function isAsiLevel(classId: string, classLevel: number): boolean {
  return (CLASS_FEATURES[classId]?.[classLevel] || []).some(f => f === ASI || f === BOON);
}

export function isEpicBoonLevel(classId: string, classLevel: number): boolean {
  return (CLASS_FEATURES[classId]?.[classLevel] || []).includes(BOON);
}
