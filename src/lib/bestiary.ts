/**
 * Bestiario: mostri dell'SRD 5.2 (CC-BY-4.0, generati con scripts/bestiary/build.ts) più i mostri personalizzati.
 * I dati SRD (public/data/bestiary.json) vengono scaricati solo quando servono e restano disponibili offline.
 */
import type { Ability } from '../contexts/CharacterContext';

export interface MonsterDamage { dice: string; type: string; /** Danno aggiuntivo solo in certe condizioni (es. "con Vantaggio") */ condition?: string }

export interface MonsterAction {
  name: string;
  desc: string;
  /** Bonus al tiro per colpire */
  attack?: number;
  damage?: MonsterDamage[];
  save?: { ability: string; dc: number };
  /** "Ricarica 5–6", "3/giorno", "A volontà" */
  usage?: string;
  spells?: string[];
}

export interface Monster {
  id: string;
  name: string;
  nameEn?: string;
  size: string;
  type: string;
  alignment?: string;
  ac: number;
  hp: number;
  hpRoll?: string;
  speed: string;
  abilities: Record<Ability, number>;
  saves?: Partial<Record<Ability, number>>;
  skills?: Record<string, number>;
  vulnerabilities?: string[];
  resistances?: string[];
  immunities?: string[];
  conditionImmunities?: string[];
  senses?: string;
  languages?: string;
  cr: string;
  xp?: number;
  xpLair?: number;
  pb?: number;
  traits?: MonsterAction[];
  actions?: MonsterAction[];
  bonusActions?: MonsterAction[];
  reactions?: MonsterAction[];
  legendary?: { uses: number; usesInLair?: number; actions: MonsterAction[] };
  /** Mostro creato dall'utente */
  custom?: boolean;
  notes?: string;
}

export const ABILITY_ORDER: Ability[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
export const ABILITY_SHORT: Record<Ability, string> = { STR: 'FOR', DEX: 'DES', CON: 'COS', INT: 'INT', WIS: 'SAG', CHA: 'CAR' };

export const abilityMod = (score: number) => Math.floor((score - 10) / 2);
export const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
export const initiativeBonusOf = (m: Pick<Monster, 'abilities'>) => abilityMod(m.abilities?.DEX ?? 10);

export function crValue(cr: string): number {
  if (cr.includes('/')) { const [a, b] = cr.split('/').map(Number); return a / b; }
  return Number(cr) || 0;
}

/** Bonus di competenza per grado di sfida (regole 2024). */
export function proficiencyForCr(cr: string): number {
  const v = crValue(cr);
  return v < 5 ? 2 : v < 9 ? 3 : v < 13 ? 4 : v < 17 ? 5 : v < 21 ? 6 : v < 25 ? 7 : v < 29 ? 8 : 9;
}

/** Formula del danno di un'azione (somma dei vari tipi): "1d10+8 + 2d4". */
export const damageFormula = (damage: MonsterDamage[] = []) => damage.filter(d => !d.condition).map(d => d.dice).join('+').replace(/\+-/g, '-');

let cache: Promise<Monster[]> | null = null;
export function loadSrdMonsters(): Promise<Monster[]> {
  if (!cache) {
    cache = fetch(`${import.meta.env.BASE_URL}data/bestiary.json`)
      .then(res => { if (!res.ok) throw new Error(`Bestiario non disponibile (${res.status})`); return res.json() as Promise<Monster[]>; })
      .catch(err => { cache = null; throw err; });
  }
  return cache;
}

export const SRD_ATTRIBUTION = 'Contiene materiale del System Reference Document 5.2 (“SRD 5.2”) di Wizards of the Coast LLC, disponibile su dndbeyond.com/srd, distribuito con licenza Creative Commons Attribuzione 4.0 Internazionale. Statistiche, attacchi e sensi sono tradotti in italiano; parte dei testi descrittivi è in lingua originale.';
