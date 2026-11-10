import { useMemo } from 'react';
import { CharacterData } from '../contexts/CharacterContext';
import { computeCharacterStats } from '../lib/characterRules';

/** Statistiche derivate del personaggio secondo le regole PHB 2024. */
export function useCharacterMath(character: CharacterData | null) {
  return useMemo(() => (character ? computeCharacterStats(character) : null), [character]);
}
