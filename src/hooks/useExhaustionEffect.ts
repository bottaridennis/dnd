
import { useEffect, useMemo } from 'react';
import { CharacterData } from '../contexts/CharacterContext';

/**
 * useExhaustionEffect
 * Calcola i malus derivanti dall'Esaurimento (Regole D&D 2024).
 * - Sottrae (Livello x 2) da ogni D20 Test.
 * - Riduce la Velocità di (Livello x 1,5 metri).
 * - Morte al Livello 6.
 */
export function useExhaustionEffect(character: CharacterData | null) {
  const level = character?.exhaustion || 0;

  useEffect(() => {
    if (level >= 6) {
      alert("Il personaggio è morto per esaurimento.");
    }
  }, [level]);

  const exhaustionStats = useMemo(() => {
    return {
      d20Penalty: level * 2,
      speedPenalty: level * 1.5,
      isDead: level >= 6
    };
  }, [level]);

  return exhaustionStats;
}
