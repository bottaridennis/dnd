import { useEffect, useRef } from 'react';
import { CharacterData, useCharacter } from '../contexts/CharacterContext';
import { speciesData } from '../data/rules2024';

export function useSpeciesAutomation() {
  const { currentCharacter, dispatch } = useCharacter();
  
  // Track last processed state to avoid infinite loops
  const lastProcessedKey = useRef('');

  useEffect(() => {
    if (!currentCharacter || !currentCharacter.speciesId) return;

    const currentKey = `${currentCharacter.speciesId}-${currentCharacter.speciesSubOption}`;
    if (lastProcessedKey.current === currentKey) return;

    const species = speciesData.find(s => s.id === currentCharacter.speciesId);
    if (!species) return;

    // Reset species-derived values before re-applying
    // We only want to manage SPECIES derived spells/resistances/features here
    // In a real app we might want a more sophisticated way to differentiate 
    // between background feats, class spells and species spells.
    // For this implementation, we will sync them based on the current species choice.

    let newSpells = [...(currentCharacter.spells || [])];
    let newResistances = [...(currentCharacter.resistances || [])];
    let newFeatures = [...(currentCharacter.features || [])];
    let newSpeedOverride = undefined;

    // 1. Basic Species Traits (Level 1)
    // We add them as features if they are not already there
    species.traits.forEach(trait => {
        if (!newFeatures.includes(trait)) newFeatures.push(trait);
    });

    // 2. Sub-Option Derived Benefits
    const subOption = (species as any).subOptions?.find((opt: any) => opt.id === currentCharacter.speciesSubOption);
    
    if (subOption) {
      // Automatic Spells
      if (subOption.spells) {
        subOption.spells.forEach((spell: string) => {
          if (!newSpells.includes(spell)) newSpells.push(spell);
        });
      }

      // Resistances
      if (subOption.resistance) {
         if (!newResistances.includes(subOption.resistance)) newResistances.push(subOption.resistance);
      }
      
      // Dragonborn Damage Resistance
      if (currentCharacter.speciesId === 'dragonborn' && subOption.damageType) {
         const resLabel = `${subOption.damageType}`;
         if (!newResistances.includes(resLabel)) newResistances.push(resLabel);
         const breathFeature = `Arma a Soffio: ${subOption.damageType}`;
         if (!newFeatures.includes(breathFeature)) newFeatures.push(breathFeature);
      }

      // Goliath Features
      if (subOption.feature) {
         if (!newFeatures.includes(subOption.feature)) newFeatures.push(subOption.feature);
      }

      // Wood Elf Speed
      if (subOption.speedBonus) {
         newSpeedOverride = (species.speed || 9) + subOption.speedBonus;
      }
    }

    // Check if we actually need to update
    const needsUpdate = 
      JSON.stringify(newSpells) !== JSON.stringify(currentCharacter.spells) ||
      JSON.stringify(newResistances) !== JSON.stringify(currentCharacter.resistances) ||
      JSON.stringify(newFeatures) !== JSON.stringify(currentCharacter.features) ||
      newSpeedOverride !== currentCharacter.speedOverride;

    if (needsUpdate) {
      dispatch({ 
        type: 'UPDATE_CHARACTER', 
        payload: { 
          spells: Array.from(new Set(newSpells)), // Deduplicate
          resistances: Array.from(new Set(newResistances)),
          features: Array.from(new Set(newFeatures)),
          speedOverride: newSpeedOverride
        } 
      });
    }

    lastProcessedKey.current = currentKey;
  }, [currentCharacter?.speciesId, currentCharacter?.speciesSubOption, dispatch]);
}
