/**
 * Estrae dalle descrizioni (in italiano) degli incantesimi le informazioni utili al tavolo:
 * tiro per colpire, tiro salvezza, dadi di danno/cura, crescita dei trucchetti e potenziamento con slot superiori.
 */
import type { Ability } from '../contexts/CharacterContext';

const SAVE_ABILITIES: Record<string, Ability> = {
  forza: 'STR', destrezza: 'DEX', costituzione: 'CON', intelligenza: 'INT', saggezza: 'WIS', carisma: 'CHA',
};

export interface SpellMechanics {
  attack: boolean;
  save?: Ability;
  effect?: { kind: 'damage' | 'healing'; count: number; sides: number; flat: number; addModifier: boolean; damageType?: string };
  upcastDice?: { count: number; sides: number };
}

const stripHtml = (text: string) => (text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

export function getSpellMechanics(spell: { description?: string; higherLevelSlot?: string } | undefined): SpellMechanics {
  if (!spell) return { attack: false };
  const text = stripHtml(spell.description || '');
  const lower = text.toLocaleLowerCase('it');
  const result: SpellMechanics = {
    attack: /attacco (a distanza |in mischia )?con incantesimo|attacco con incantesimo/.test(lower),
  };
  const save = lower.match(/tiro salvezza su (forza|destrezza|costituzione|intelligenza|saggezza|carisma)/);
  if (save) result.save = SAVE_ABILITIES[save[1]];

  const heal = text.match(/Punti Ferita pari a (\d+)d(\d+)(\s*(?:\+|più)\s*il tuo modificatore)?/i);
  const damage = text.match(/(\d+)d(\d+)(?:\s*\+\s*(\d+))?\s+danni\s+(?:da\s+|di\s+)?([A-Za-zÀ-ÿ]+)/i);
  if (heal && (!damage || (heal.index ?? 0) < (damage.index ?? 0))) {
    result.effect = { kind: 'healing', count: Number(heal[1]), sides: Number(heal[2]), flat: 0, addModifier: Boolean(heal[3]) };
  } else if (damage) {
    result.effect = { kind: 'damage', count: Number(damage[1]), sides: Number(damage[2]), flat: Number(damage[3] || 0), addModifier: false, damageType: damage[4] };
  }

  const upcast = stripHtml(spell.higherLevelSlot || '').match(/(\d+)d(\d+) per ogni livello di slot/i);
  if (upcast) result.upcastDice = { count: Number(upcast[1]), sides: Number(upcast[2]) };
  return result;
}

/** Moltiplicatore dei dadi dei trucchetti: ×2 al 5°, ×3 all'11°, ×4 al 17° livello del personaggio. */
export function cantripTier(characterLevel: number): number {
  return 1 + (characterLevel >= 5 ? 1 : 0) + (characterLevel >= 11 ? 1 : 0) + (characterLevel >= 17 ? 1 : 0);
}

export function getEffectFormula(
  spell: { level?: number; description?: string; higherLevelSlot?: string; cantripUpgrade?: string } | undefined,
  options: { slotLevel?: number; characterLevel: number; spellMod: number },
): { formula: string; label: string } | null {
  const mech = getSpellMechanics(spell);
  if (!spell || !mech.effect) return null;
  let count = mech.effect.count;
  const level = spell.level ?? 0;
  if (level === 0 && /aumenta di \d+d\d+/i.test(spell.cantripUpgrade || '')) count *= cantripTier(options.characterLevel);
  const extra = level > 0 && options.slotLevel && mech.upcastDice && mech.upcastDice.sides === mech.effect.sides
    ? (options.slotLevel - level) * mech.upcastDice.count
    : 0;
  count += Math.max(0, extra);
  const flat = mech.effect.flat + (mech.effect.addModifier ? options.spellMod : 0);
  const formula = `${count}d${mech.effect.sides}${flat ? (flat > 0 ? `+${flat}` : `${flat}`) : ''}`;
  const label = mech.effect.kind === 'healing' ? 'Cura' : `Danni${mech.effect.damageType ? ` (${mech.effect.damageType})` : ''}`;
  return { formula, label };
}

export const ABILITY_SAVE_LABEL: Record<Ability, string> = {
  STR: 'Forza', DEX: 'Destrezza', CON: 'Costituzione', INT: 'Intelligenza', WIS: 'Saggezza', CHA: 'Carisma',
};
