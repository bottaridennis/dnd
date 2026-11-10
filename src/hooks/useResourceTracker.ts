import { useMemo, useCallback } from 'react';
import { CharacterData, useCharacter } from '../contexts/CharacterContext';
import {
  calculateSpellSlots,
  calculatePactMagic,
  calculateSorceryPoints,
  calculateChannelDivinity,
  ClassLevels
} from '../lib/resourceMath';
import { characterService } from '../services/characterService';
import { getClassLevels } from '../lib/characterRules';

export const EMPTY_RESOURCES: NonNullable<CharacterData['resources']> = {
  spentSpellSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  spentPactSlots: 0,
  spentSorceryPoints: 0,
  spentChannelDivinity: 0,
};

export function getMaxResources(character: CharacterData | null) {
  const classLevels: ClassLevels = character ? getClassLevels(character) : {};
  return {
    spellSlots: calculateSpellSlots(classLevels),
    pactMagic: calculatePactMagic(classLevels.warlock?.level || 0),
    sorceryPoints: calculateSorceryPoints(classLevels.sorcerer?.level || 0),
    channelDivinity: calculateChannelDivinity(classLevels),
  };
}

export function normalizeResources(resources: CharacterData['resources'] | undefined) {
  return {
    ...EMPTY_RESOURCES,
    ...(resources || {}),
    spentSpellSlots: { ...EMPTY_RESOURCES.spentSpellSlots, ...(resources?.spentSpellSlots || {}) },
  };
}

export function useResourceTracker() {
  const { currentCharacter, dispatch } = useCharacter();

  const maxResources = useMemo(() => getMaxResources(currentCharacter), [currentCharacter]);
  const currentResources = useMemo(() => normalizeResources(currentCharacter?.resources), [currentCharacter?.resources]);

  const updateResources = useCallback(async (updates: Partial<typeof EMPTY_RESOURCES>) => {
    if (!currentCharacter) return;
    const newResources = { ...currentResources, ...updates };
    dispatch({ type: 'UPDATE_CHARACTER', payload: { resources: newResources } });
    try {
      await characterService.updateCharacter(currentCharacter.id, { resources: newResources });
    } catch (error) {
      console.error('Failed to save resource update:', error);
    }
  }, [currentCharacter, currentResources, dispatch]);

  const expendSpellSlot = (level: number) => {
    const spent = { ...currentResources.spentSpellSlots };
    if ((spent[level] || 0) < maxResources.spellSlots[level - 1]) {
      spent[level] = (spent[level] || 0) + 1;
      updateResources({ spentSpellSlots: spent });
    }
  };

  const recoverSpellSlot = (level: number) => {
    const spent = { ...currentResources.spentSpellSlots };
    if ((spent[level] || 0) > 0) {
      spent[level] -= 1;
      updateResources({ spentSpellSlots: spent });
    }
  };

  const adjustSorceryPoints = (spend: number) => {
    const next = Math.max(0, Math.min(maxResources.sorceryPoints, currentResources.spentSorceryPoints + spend));
    updateResources({ spentSorceryPoints: next });
  };

  const expendChannelDivinity = () => {
    if (currentResources.spentChannelDivinity < maxResources.channelDivinity) {
      updateResources({ spentChannelDivinity: currentResources.spentChannelDivinity + 1 });
    }
  };

  const recoverChannelDivinity = () => {
    if (currentResources.spentChannelDivinity > 0) {
      updateResources({ spentChannelDivinity: currentResources.spentChannelDivinity - 1 });
    }
  };

  const expendPactSlot = () => {
    if (currentResources.spentPactSlots < maxResources.pactMagic.count) {
      updateResources({ spentPactSlots: currentResources.spentPactSlots + 1 });
    }
  };

  const recoverPactSlot = () => {
    if (currentResources.spentPactSlots > 0) {
      updateResources({ spentPactSlots: currentResources.spentPactSlots - 1 });
    }
  };

  return {
    maxResources,
    currentResources,
    expendSpellSlot,
    recoverSpellSlot,
    expendSorceryPoint: () => adjustSorceryPoints(1),
    recoverSorceryPoint: () => adjustSorceryPoints(-1),
    expendChannelDivinity,
    recoverChannelDivinity,
    expendPactSlot,
    recoverPactSlot,
  };
}
