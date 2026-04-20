
import { useMemo, useCallback } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { 
  calculateSpellSlots, 
  calculatePactMagic, 
  calculateSorceryPoints, 
  calculateChannelDivinity,
  ClassLevels
} from '../lib/resourceMath';
import { characterService } from '../services/characterService';
import { classesData } from '../data/rules2024';

export function useResourceTracker() {
  const { currentCharacter, dispatch } = useCharacter();

  const classLevels = useMemo((): ClassLevels => {
    if (!currentCharacter) return {};
    
    // If explicit classes record exists, use it
    if (currentCharacter.classes && Object.keys(currentCharacter.classes).length > 0) {
      return currentCharacter.classes;
    }

    // Fallback to single class setup
    if (currentCharacter.classId) {
      // Use the internal classId (English) as the key
      return {
        [currentCharacter.classId]: { 
          level: currentCharacter.level, 
          subclass: currentCharacter.subclassId 
        }
      };
    }
    return {};
  }, [currentCharacter]);

  const maxResources = useMemo(() => {
    const spellSlots = calculateSpellSlots(classLevels);
    
    // Find warlock level for pact magic
    const warlockEntry = Object.entries(classLevels).find(([name]) => name.toLowerCase() === 'warlock');
    const warlockLevel = warlockEntry ? (warlockEntry[1] as any).level : 0;
    const pactMagic = calculatePactMagic(warlockLevel);
    
    // Find sorcerer level for sorcery points
    const sorcererEntry = Object.entries(classLevels).find(([name]) => name.toLowerCase() === 'sorcerer');
    const sorcererLevel = sorcererEntry ? (sorcererEntry[1] as any).level : 0;
    const sorceryPoints = calculateSorceryPoints(sorcererLevel);
    
    const channelDivinity = calculateChannelDivinity(classLevels);

    return {
      spellSlots,
      pactMagic,
      sorceryPoints,
      channelDivinity
    };
  }, [classLevels]);

  const updateResources = useCallback(async (updates: any) => {
    if (!currentCharacter) return;
    
    const newResources = {
      ...(currentCharacter.resources || {
        spentSpellSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
        spentPactSlots: 0,
        spentSorceryPoints: 0,
        spentChannelDivinity: 0,
      }),
      ...updates
    };

    dispatch({ type: 'UPDATE_CHARACTER', payload: { resources: newResources } });
    
    try {
      await characterService.updateCharacter(currentCharacter.id, { resources: newResources });
    } catch (error) {
      console.error("Failed to save resource update:", error);
    }
  }, [currentCharacter, dispatch]);

  const expendSpellSlot = (level: number) => {
    if (!currentCharacter?.resources) return;
    const spent = { ...currentCharacter.resources.spentSpellSlots };
    const max = maxResources.spellSlots[level - 1];
    if (spent[level] < max) {
      spent[level] += 1;
      updateResources({ spentSpellSlots: spent });
    }
  };

  const recoverSpellSlot = (level: number) => {
    if (!currentCharacter?.resources) return;
    const spent = { ...currentCharacter.resources.spentSpellSlots };
    if (spent[level] > 0) {
      spent[level] -= 1;
      updateResources({ spentSpellSlots: spent });
    }
  };

  const adjustSorceryPoints = (delta: number) => {
    if (!currentCharacter?.resources) return;
    const newVal = Math.max(0, Math.min(maxResources.sorceryPoints, currentCharacter.resources.spentSorceryPoints - delta));
    // Note: delta > 0 means spending, delta < 0 means recovering
    // or let's just use absolute value for spending? Prompt says "expendSorceryPoint()"
    // Let's store "spent" as a positive number.
    const newSpent = Math.max(0, Math.min(maxResources.sorceryPoints, currentCharacter.resources.spentSorceryPoints + (delta * -1)));
    // Wait, let's keep it simple: spentSorceryPoints
    updateResources({ spentSorceryPoints: newSpent });
  };

  const expendSorceryPoint = () => adjustSorceryPoints(1);
  const recoverSorceryPoint = () => adjustSorceryPoints(-1);

  const expendChannelDivinity = () => {
    if (!currentCharacter?.resources) return;
    if (currentCharacter.resources.spentChannelDivinity < maxResources.channelDivinity) {
      updateResources({ spentChannelDivinity: currentCharacter.resources.spentChannelDivinity + 1 });
    }
  };

  const recoverChannelDivinity = () => {
    if (!currentCharacter?.resources) return;
    if (currentCharacter.resources.spentChannelDivinity > 0) {
      updateResources({ spentChannelDivinity: currentCharacter.resources.spentChannelDivinity - 1 });
    }
  };

  const expendPactSlot = () => {
    if (!currentCharacter?.resources) return;
    if (currentCharacter.resources.spentPactSlots < maxResources.pactMagic.count) {
      updateResources({ spentPactSlots: currentCharacter.resources.spentPactSlots + 1 });
    }
  };

  const recoverPactSlot = () => {
    if (!currentCharacter?.resources) return;
    if (currentCharacter.resources.spentPactSlots > 0) {
      updateResources({ spentPactSlots: currentCharacter.resources.spentPactSlots - 1 });
    }
  };

  const shortRest = () => {
    updateResources({
      spentPactSlots: 0,
      spentChannelDivinity: Math.max(0, (currentCharacter?.resources?.spentChannelDivinity || 0) - 1)
    });
  };

  const longRest = () => {
    updateResources({
      spentSpellSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
      spentPactSlots: 0,
      spentSorceryPoints: 0,
      spentChannelDivinity: 0,
    });
    // Also reset HP and Hit Dice would be nice but prompt focuses on magic resources
  };

  return {
    maxResources,
    currentResources: currentCharacter?.resources || initialCharacter.resources,
    expendSpellSlot,
    recoverSpellSlot,
    expendSorceryPoint,
    recoverSorceryPoint,
    expendChannelDivinity,
    recoverChannelDivinity,
    expendPactSlot,
    recoverPactSlot,
    shortRest,
    longRest
  };
}

const initialCharacter = {
  resources: {
    spentSpellSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
    spentPactSlots: 0,
    spentSorceryPoints: 0,
    spentChannelDivinity: 0,
  }
};
