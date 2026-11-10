import type { CharacterData } from '../contexts/CharacterContext';
import { computeCharacterStats, getFinalScores, getModifiers } from './characterRules';
import { getClassResources, recoverClassResources } from '../data/classResources';
import { normalizeResources } from '../hooks/useResourceTracker';

/**
 * Riposo Breve (PHB 2024): si possono spendere Dadi Vita (gestiti a parte),
 * il Warlock recupera gli slot del Patto, Chierico e Paladino recuperano un uso di Incanalare Divinità.
 */
export function getShortRestUpdates(character: CharacterData): Partial<CharacterData> {
  const resources = normalizeResources(character.resources);
  const classResources = getClassResources(character, getModifiers(getFinalScores(character)));
  return {
    classResourcesSpent: recoverClassResources(character.classResourcesSpent, classResources, 'short'),
    resources: {
      ...resources,
      spentPactSlots: 0,
      spentChannelDivinity: Math.max(0, resources.spentChannelDivinity - 1),
    },
  };
}

/**
 * Riposo Lungo (PHB 2024): tutti i PF, tutti i Dadi Vita spesi, tutti gli slot e le risorse,
 * -1 livello di Esaurimento, PF temporanei azzerati.
 */
export function getLongRestUpdates(character: CharacterData): Partial<CharacterData> {
  const stats = computeCharacterStats(character);
  return {
    hpCurrent: stats.hpMax,
    hpTemp: 0,
    hitDiceSpent: {},
    deathSaves: { successes: 0, failures: 0 },
    exhaustion: Math.max(0, (character.exhaustion || 0) - 1),
    classResourcesSpent: {},
    concentratingOn: '',
    resources: {
      spentSpellSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
      spentPactSlots: 0,
      spentSorceryPoints: 0,
      spentChannelDivinity: 0,
    },
  };
}

export function rollDie(sides: number): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return (buffer[0] % sides) + 1;
}
