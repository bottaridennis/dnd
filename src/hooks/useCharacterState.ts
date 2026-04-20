import { useState, useCallback } from 'react';

export interface DeathSaves {
  successes: number;
  failures: number;
}

export function useCharacterState(initialHp: number, maxHp: number, initialHitDice: number, conMod: number) {
  const [hp, setHp] = useState(initialHp);
  const [hitDice, setHitDice] = useState(initialHitDice);
  const [exhaustion, setExhaustion] = useState(0);
  const [deathSaves, setDeathSaves] = useState<DeathSaves>({ successes: 0, failures: 0 });
  const [isDead, setIsDead] = useState(false);

  const takeDamage = useCallback((amount: number) => {
    setHp(prev => {
      const nextHp = Math.max(0, prev - amount);
      if (nextHp === 0 && prev > 0) {
        // Reset dei tiri salvezza se scende a 0 di nuovo
        setDeathSaves({ successes: 0, failures: 0 });
      }
      return nextHp;
    });
  }, []);

  const heal = useCallback((amount: number) => {
    setHp(prev => Math.min(maxHp, prev + amount));
    // Ripristino i tiri salvezza in caso di cure da svenuto
    setDeathSaves({ successes: 0, failures: 0 });
  }, [maxHp]);

  const shortRest = useCallback((diceToSpend: number, rolls: number[]) => {
    if (diceToSpend > hitDice || diceToSpend !== rolls.length) return false;
    // La cura col dV è tiro + Mod Costituzione. Minimo si riprende 1 pf a dado? D&D non ammette cure negative. Minimo 0 per sicurezza.
    const totalHealing = rolls.reduce((acc, roll) => acc + Math.max(0, roll + conMod), 0);
    setHitDice(prev => prev - diceToSpend);
    heal(totalHealing);
    return true;
  }, [hitDice, conMod, heal]);

  const longRest = useCallback(() => {
    setHp(maxHp);
    // Nelle regole 2024 un Riposo Lungo recupera TUTTI i Dadi Vita spesi, non più metà
    setHitDice(initialHitDice);
    setExhaustion(prev => Math.max(0, prev - 1));
    setDeathSaves({ successes: 0, failures: 0 });
  }, [maxHp, initialHitDice]);

  const rollDeathSave = useCallback((rollValue: number) => {
    if (hp > 0) return; // Non può tirare se è sveglio

    // 20 = +1 pf da terra, reset tiri salvezza
    if (rollValue === 20) {
      heal(1);
      return;
    }

    setDeathSaves(prev => {
      let failGain = 0;
      let succGain = 0;

      if (rollValue === 1) {
        failGain = 2; // 1 Naturale = 2 fallimenti
      } else if (rollValue >= 10) {
        succGain = 1;
      } else {
        failGain = 1;
      }

      const newFails = Math.min(3, prev.failures + failGain);
      const newSuccess = Math.min(3, prev.successes + succGain);

      if (newFails >= 3) {
        setIsDead(true);
      }

      return {
        failures: newFails,
        successes: newSuccess
      };
    });
  }, [hp, heal]);

  return {
    hp, hitDice, exhaustion, deathSaves, isDead,
    takeDamage, heal, shortRest, longRest, rollDeathSave
  };
}
