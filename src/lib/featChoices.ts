/**
 * Scelte legate a talenti e privilegi di 1° livello (PHB 2024), salvate senza nuovi campi:
 * - talenti con scelte nel nome: "Abile (Atletica, Furtività, Liuto)", "Musicista (Liuto, Flauto, Lira)",
 *   "Artigiano (…)", "Iniziato alla Magia (Chierico: Guida, Taumaturgia | Cura Ferite)";
 * - Ordine Divino / Ordine Primordiale nella voce della classe: classes.cleric.order.
 */
import type { CharacterData } from '../contexts/CharacterContext';
import { ALL_TOOLS, ARTISAN_TOOLS, MUSICAL_INSTRUMENTS } from '../data/languages';
import { ALL_SKILLS } from '../data/rules2024';

export type OriginFeatField = 'originFeat' | 'bonusOriginFeat';

export const featBase = (feat: string) => feat.split(' (')[0].trim();
/** Testo tra la prima " (" e l'ultima ")": le scelte possono contenere parentesi, es. "Set da Gioco (Carte)". */
const inner = (feat: string) => {
  const start = feat.indexOf(' (');
  const end = feat.lastIndexOf(')');
  return start >= 0 && end > start ? feat.slice(start + 2, end) : '';
};

/** Talenti con elenchi di competenze a scelta */
export const FEAT_PICKS: Record<string, { count: number; label: string; options: () => string[]; hint: string }> = {
  'Abile': { count: 3, label: 'abilità o strumenti', options: () => [...ALL_SKILLS, ...ALL_TOOLS], hint: 'Ottieni competenza in tre abilità o strumenti a tua scelta.' },
  'Musicista': { count: 3, label: 'strumenti musicali', options: () => MUSICAL_INSTRUMENTS, hint: 'Ottieni competenza in tre strumenti musicali a tua scelta.' },
  'Artigiano': { count: 3, label: 'strumenti da artigiano', options: () => ARTISAN_TOOLS, hint: 'Ottieni competenza in tre strumenti da artigiano a tua scelta.' },
};

export function getFeatPicks(feat: string | undefined): string[] {
  if (!feat || !FEAT_PICKS[featBase(feat)]) return [];
  return inner(feat).split(',').map(s => s.trim()).filter(Boolean);
}
export const formatFeatPicks = (base: string, picks: string[]) => (picks.length ? `${base} (${picks.join(', ')})` : base);

// ---------------- Iniziato alla Magia
export const MAGIC_INITIATE = 'Iniziato alla Magia';
export const MI_LISTS: Record<string, string> = { Chierico: 'cleric', Druido: 'druid', Mago: 'wizard' };

export interface MagicInitiateChoice { list?: string; cantrips: string[]; spell?: string }

export function parseMagicInitiate(feat: string | undefined): MagicInitiateChoice | null {
  if (!feat || featBase(feat).toLocaleLowerCase('it') !== MAGIC_INITIATE.toLocaleLowerCase('it')) return null;
  const text = inner(feat);
  if (!text) return { cantrips: [] };
  const [listPart, rest = ''] = text.split(':');
  const [cantripPart = '', spellPart = ''] = rest.split('|');
  const list = Object.keys(MI_LISTS).find(l => l.toLocaleLowerCase('it') === listPart.trim().toLocaleLowerCase('it'));
  return {
    ...(list ? { list } : {}),
    cantrips: cantripPart.split(',').map(s => s.trim()).filter(Boolean),
    ...(spellPart.trim() ? { spell: spellPart.trim() } : {}),
  };
}

export function formatMagicInitiate(choice: MagicInitiateChoice): string {
  if (!choice.list) return MAGIC_INITIATE;
  const picks = choice.cantrips.length || choice.spell ? `: ${choice.cantrips.join(', ')}${choice.spell ? ` | ${choice.spell}` : ''}` : '';
  return `${MAGIC_INITIATE} (${choice.list}${picks})`;
}

/** Talenti d'Origine del personaggio che richiedono scelte nella creazione. */
export function getOriginFeatSlots(character: Partial<CharacterData>): { field: OriginFeatField; feat: string; base: string }[] {
  return (['originFeat', 'bonusOriginFeat'] as OriginFeatField[])
    .map(field => ({ field, feat: (character[field] as string) || '' }))
    .filter(({ feat }) => feat && (FEAT_PICKS[featBase(feat)] || parseMagicInitiate(feat)))
    .map(s => ({ ...s, base: featBase(s.feat) }));
}

/** Abilità e strumenti ottenuti dai talenti con scelte (tutti i talenti posseduti). */
export function getFeatProficiencies(character: Partial<CharacterData>): { skills: string[]; tools: string[] } {
  const picks = [character.originFeat, character.bonusOriginFeat, ...(character.feats || [])].flatMap(f => getFeatPicks(f || undefined));
  return { skills: picks.filter(p => ALL_SKILLS.includes(p)), tools: picks.filter(p => !ALL_SKILLS.includes(p)) };
}

// ---------------- Ordini di Chierico e Druido
export interface ClassOrder { id: string; name: string; desc: string }
export const CLASS_ORDERS: Record<string, { title: string; options: ClassOrder[] }> = {
  cleric: {
    title: 'Ordine Divino',
    options: [
      { id: 'protector', name: 'Protettore', desc: 'Addestrato alla battaglia: competenza nelle armi Marziali e nelle armature Pesanti.' },
      { id: 'thaumaturge', name: 'Taumaturgo', desc: 'Un trucchetto da Chierico in più e un bonus pari al modificatore di Saggezza (minimo +1) alle prove di Intelligenza (Arcano o Religione).' },
    ],
  },
  druid: {
    title: 'Ordine Primordiale',
    options: [
      { id: 'magician', name: 'Sapiente', desc: 'Un trucchetto da Druido in più e un bonus pari al modificatore di Saggezza (minimo +1) alle prove di Intelligenza (Arcano o Natura).' },
      { id: 'warden', name: 'Custode', desc: 'Addestrato alla battaglia: competenza nelle armi Marziali e nelle armature Medie.' },
    ],
  },
};
